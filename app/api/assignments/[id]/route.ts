import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AssignmentStatus, TaskStatus } from "@/lib/enums";


export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const assignmentId = params.id;

  if (!assignmentId) {
    return NextResponse.json(
      { error: "Assignment id is required." },
      { status: 400 },
    );
  }

  try {
    const { status } = (await request.json()) as {
      status?: AssignmentStatus;
    };

    if (!status) {
      return NextResponse.json(
        { error: "Status is required." },
        { status: 400 },
      );
    }

    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { task: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 },
      );
    }

    // If accepting, enforce capacity and update task status.
    if (status === AssignmentStatus.ACCEPTED) {
      const taskId = existing.taskId;
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignments: {
            where: { status: AssignmentStatus.ACCEPTED },
          },
        },
      });

      if (!task) {
        return NextResponse.json(
          { error: "Task not found for assignment." },
          { status: 404 },
        );
      }

      const currentlyAccepted = task.assignments.length;

      if (currentlyAccepted >= task.capacity) {
        return NextResponse.json(
          {
            error:
              "This task is already full. Please contact coordination staff.",
          },
          { status: 409 },
        );
      }

      // Proceed with status update and task status recalculation.
      const updated = await prisma.$transaction(async (tx) => {
        const updatedAssignment = await tx.assignment.update({
          where: { id: assignmentId },
          data: { status },
        });

        const acceptedCount = await tx.assignment.count({
          where: {
            taskId,
            status: AssignmentStatus.ACCEPTED,
          },
        });

        let newTaskStatus: TaskStatus = TaskStatus.OPEN;
        if (acceptedCount >= task.capacity) {
          newTaskStatus = TaskStatus.FULL;
        } else if (acceptedCount > 0) {
          newTaskStatus = TaskStatus.PARTIALLY_FILLED;
        }

        await tx.task.update({
          where: { id: taskId },
          data: { status: newTaskStatus },
        });

        return updatedAssignment;
      });

      return NextResponse.json({ assignment: updated }, { status: 200 });
    }

    // Non-acceptance updates (DECLINED, CANCELLED, COMPLETED) don't change capacity here.
    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { status },
    });

    return NextResponse.json({ assignment: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating assignment status", error);
    return NextResponse.json(
      { error: "Failed to update assignment." },
      { status: 500 },
    );
  }
}

