import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AssignmentStatus, AutomationMode, TaskStatus, Skill } from "@/lib/enums";
import { hasAvailabilityForTask } from "@/lib/matching";


export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const taskId = params.id;

  try {
    const { volunteerId } = (await request.json()) as { volunteerId?: string };

    if (!taskId || !volunteerId) {
      return NextResponse.json(
        { error: "Task id and volunteer id are required." },
        { status: 400 },
      );
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const volunteer = await prisma.volunteer.findUnique({
      where: { id: volunteerId },
      include: {
        availabilityBlocks: true,
        assignments: true,
      },
    });

    if (!volunteer) {
      return NextResponse.json(
        { error: "Volunteer not found." },
        { status: 404 },
      );
    }

    // Capability constraint: volunteer must have all required skills.
    const required: Skill[] = JSON.parse(task.requiredSkills);
    const volunteerSkills: Skill[] = JSON.parse(volunteer.skills);
    const hasAllRequired =
      required.length === 0 ||
      required.every((s) => volunteerSkills.includes(s));

    if (!hasAllRequired) {
      return NextResponse.json(
        {
          error:
            "Volunteer does not meet required skills for this task according to their self-assessment.",
        },
        { status: 400 },
      );
    }

    const availabilityOk = hasAvailabilityForTask(
      volunteer.availabilityBlocks,
      task.startTime,
      task.endTime,
    );

    if (!availabilityOk) {
      return NextResponse.json(
        {
          error:
            "Volunteer is not available for the task time window according to stored availability.",
        },
        { status: 400 },
      );
    }

    const overlappingExisting = await prisma.assignment.findFirst({
      where: {
        volunteerId,
        status: {
          in: [AssignmentStatus.PROPOSED, AssignmentStatus.ACCEPTED],
        },
        task: {
          startTime: { lt: task.endTime },
          endTime: { gt: task.startTime },
        },
      },
    });

    if (overlappingExisting) {
      return NextResponse.json(
        {
          error:
            "Volunteer is already assigned to another task that overlaps this time window.",
        },
        { status: 400 },
      );
    }

    const activeAssignments = await prisma.assignment.count({
      where: {
        taskId,
        status: {
          in: [AssignmentStatus.PROPOSED, AssignmentStatus.ACCEPTED],
        },
      },
    });

    if (activeAssignments >= task.capacity) {
      return NextResponse.json(
        { error: "Task is already at or above capacity." },
        { status: 409 },
      );
    }

    const created = await prisma.assignment.create({
      data: {
        volunteerId,
        taskId,
        status: AssignmentStatus.PROPOSED,
        automationMode: AutomationMode.MANUAL,
      },
    });

    const acceptedCount = await prisma.assignment.count({
      where: { taskId, status: AssignmentStatus.ACCEPTED },
    });
    const proposedCount = await prisma.assignment.count({
      where: { taskId, status: AssignmentStatus.PROPOSED },
    });

    let newTaskStatus: TaskStatus = TaskStatus.OPEN;
    if (acceptedCount >= task.capacity) {
      newTaskStatus = TaskStatus.FULL;
    } else if (acceptedCount + proposedCount > 0) {
      newTaskStatus = TaskStatus.PARTIALLY_FILLED;
    }

    await prisma.task.update({
      where: { id: taskId },
      data: { status: newTaskStatus },
    });

    return NextResponse.json({ assignment: created }, { status: 201 });
  } catch (error) {
    console.error("Error assigning volunteer to task", error);
    return NextResponse.json(
      { error: "Failed to assign volunteer." },
      { status: 500 },
    );
  }
}

