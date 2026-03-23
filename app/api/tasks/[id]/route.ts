import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AssignmentStatus, AutomationMode, TaskStatus } from "@/lib/enums";
import { scoreVolunteerForTask, ScoredVolunteer } from "@/lib/matching";
import { Volunteer } from "@prisma/client";


export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const taskId = params.id;

  if (!taskId) {
    return NextResponse.json(
      { error: "Task id is required." },
      { status: 400 },
    );
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: {
          include: {
            volunteer: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const acceptedCount = task.assignments.filter(
      (a) => a.status === AssignmentStatus.ACCEPTED,
    ).length;

    return NextResponse.json({ task, acceptedCount }, { status: 200 });
  } catch (error) {
    console.error("Error fetching task details", error);
    return NextResponse.json(
      { error: "Failed to fetch task details." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const taskId = params.id;

  if (!taskId) {
    return NextResponse.json(
      { error: "Task id is required." },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    const { status } = body as { status?: TaskStatus };

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
      },
    });

    return NextResponse.json({ task: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating task", error);
    return NextResponse.json(
      { error: "Failed to update task." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const taskId = params.id;
  const { action } = (await request.json()) as { action?: string };

  if (!taskId || !action) {
    return NextResponse.json(
      { error: "Task id and action are required." },
      { status: 400 },
    );
  }

  if (action === "suggest") {
    return suggestVolunteers(taskId);
  }

  if (action === "autoFill") {
    return autoFillTask(taskId);
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

async function suggestVolunteers(taskId: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    // Only suggest from volunteers who have explicitly applied (status PROPOSED)
    const proposedAssignments = await prisma.assignment.findMany({
      where: {
        taskId,
        status: AssignmentStatus.PROPOSED,
      },
      include: {
        volunteer: true
      }
    });

    const activeAssignmentsCount = await prisma.assignment.count({
      where: {
        taskId,
        status: AssignmentStatus.ACCEPTED,
      },
    });

    const capacityLeft = task.capacity - activeAssignmentsCount;
    if (capacityLeft <= 0) {
      return NextResponse.json(
        { suggestions: [], message: "Task is already at or above capacity." },
        { status: 200 },
      );
    }

    const scored: ScoredVolunteer[] = [];

    for (const assignment of proposedAssignments) {
      const result = scoreVolunteerForTask(assignment.volunteer as Volunteer, task);
      if (result) {
        result.assignmentId = assignment.id;
        scored.push(result);
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return NextResponse.json(
      {
        suggestions: scored.slice(0, capacityLeft),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error generating suggestions", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions." },
      { status: 500 },
    );
  }
}

async function autoFillTask(taskId: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: {
          where: {
            status: {
              in: [AssignmentStatus.PROPOSED, AssignmentStatus.ACCEPTED],
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    // Auto-fill should only auto-accept existing PROPOSED applicants
    const proposedAssignments = await prisma.assignment.findMany({
      where: {
        taskId,
        status: AssignmentStatus.PROPOSED,
      },
      include: {
        volunteer: true
      }
    });

    const initialCount = task.assignments.filter(
      (a) => a.status === AssignmentStatus.ACCEPTED,
    ).length;
    let capacityLeft = task.capacity - initialCount;

    if (capacityLeft <= 0) {
      return NextResponse.json(
        { createdAssignments: [], message: "Task is already full." },
        { status: 200 },
      );
    }

    const scored: ScoredVolunteer[] = [];
    for (const assignment of proposedAssignments) {
      const result = scoreVolunteerForTask(assignment.volunteer as Volunteer, task);
      if (result) {
        scored.push(result);
      }
    }

    scored.sort((a, b) => b.score - a.score);

    const toAssign = scored.slice(0, capacityLeft);

    const created = await prisma.$transaction(async (tx) => {
      const updatedAssignments = [];
      for (const candidate of toAssign) {
        if (capacityLeft <= 0) break;
        // The assignment already exists as PROPOSED, so we update it.
        // We need to find the assignment ID for this volunteer and task.
        const existingAssignment = proposedAssignments.find(a => a.volunteerId === candidate.volunteer.id);
        if (!existingAssignment) continue;

        const assignment = await tx.assignment.update({
          where: { id: existingAssignment.id },
          data: {
            status: AssignmentStatus.ACCEPTED,
            automationMode: AutomationMode.AUTO,
            explanation: candidate.explanation,
          },
        });
        updatedAssignments.push(assignment);
        capacityLeft -= 1;
      }

      const acceptedCount = await tx.assignment.count({
        where: {
          taskId,
          status: AssignmentStatus.ACCEPTED,
        },
      });
      const proposedCount = await tx.assignment.count({
        where: {
          taskId,
          status: AssignmentStatus.PROPOSED,
        },
      });

      let newTaskStatus: TaskStatus = TaskStatus.OPEN;
      if (acceptedCount >= task.capacity) {
        newTaskStatus = TaskStatus.FULL;
      } else if (acceptedCount + proposedCount > 0) {
        newTaskStatus = TaskStatus.PARTIALLY_FILLED;
      }

      await tx.task.update({
        where: { id: taskId },
        data: {
          status: newTaskStatus,
          automationMode: AutomationMode.AUTO,
        },
      });

      return updatedAssignments;
    });

    return NextResponse.json({ updatedAssignments: created }, { status: 200 });
  } catch (error) {
    console.error("Error auto-filling task", error);
    return NextResponse.json(
      { error: "Failed to auto-fill task." },
      { status: 500 },
    );
  }
}

