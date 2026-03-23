import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AssignmentStatus, AutomationMode, TaskStatus } from "@/lib/enums";


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
    });

    if (!volunteer) {
      return NextResponse.json(
        { error: "Volunteer not found." },
        { status: 404 },
      );
    }

    const activeAssignments = await prisma.assignment.count({
      where: {
        taskId,
        status: AssignmentStatus.ACCEPTED,
      },
    });

    if (activeAssignments >= task.capacity) {
      return NextResponse.json(
        { error: "Task is already at or above capacity." },
        { status: 409 },
      );
    }

    // Always create a PROPOSED assignment for all modes. Auto Mode is triggered manually by coordinator later.
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

