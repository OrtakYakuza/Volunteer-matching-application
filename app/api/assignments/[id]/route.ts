import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AssignmentStatus, TaskStatus } from "@/lib/enums";
import { Prisma } from "@prisma/client";


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

      // Proceed with status update, task status recalculation, and series propagation.
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

        await tx.eventLog.create({
          data: {
            actorType: "COORDINATOR",
            eventType: "VOLUNTEER_ACCEPTED",
            payload: JSON.stringify({
              assignmentId,
              volunteerId: existing.volunteerId,
              taskId,
              taskTitle: task.title,
            }),
          },
        });

        // Auto-accept volunteer on all future instances of the same series.
        if (task.seriesId) {
          const now = new Date();
          const futureInstances = await tx.task.findMany({
            where: {
              seriesId: task.seriesId,
              id: { not: taskId },
              startTime: { gt: now },
              status: { not: TaskStatus.FULL },
            },
            orderBy: { startTime: "asc" },
          });

          for (const instance of futureInstances) {
            // Check capacity for this instance.
            const instanceAccepted = await tx.assignment.count({
              where: { taskId: instance.id, status: AssignmentStatus.ACCEPTED },
            });
            if (instanceAccepted >= instance.capacity) continue;

            // Upsert: create accepted assignment if not already assigned.
            try {
              await tx.assignment.upsert({
                where: {
                  volunteerId_taskId: {
                    volunteerId: existing.volunteerId,
                    taskId: instance.id,
                  },
                },
                update: { status: AssignmentStatus.ACCEPTED },
                create: {
                  volunteerId: existing.volunteerId,
                  taskId: instance.id,
                  status: AssignmentStatus.ACCEPTED,
                },
              });

              // Recalculate task status for this instance.
              const newAcceptedCount = await tx.assignment.count({
                where: { taskId: instance.id, status: AssignmentStatus.ACCEPTED },
              });
              let instanceStatus: TaskStatus = TaskStatus.OPEN;
              if (newAcceptedCount >= instance.capacity) {
                instanceStatus = TaskStatus.FULL;
              } else if (newAcceptedCount > 0) {
                instanceStatus = TaskStatus.PARTIALLY_FILLED;
              }
              await tx.task.update({
                where: { id: instance.id },
                data: { status: instanceStatus },
              });
            } catch (e) {
              // Skip on unique constraint or other per-instance errors.
              if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
                continue;
              }
              throw e;
            }
          }
        }

        return updatedAssignment;
      });

      return NextResponse.json({ assignment: updated }, { status: 200 });
    }

    // Non-acceptance updates (DECLINED, CANCELLED, COMPLETED) — log and update.
    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { status },
    });

    await prisma.eventLog.create({
      data: {
        actorType: "COORDINATOR",
        eventType: `VOLUNTEER_${status}`,
        payload: JSON.stringify({
          assignmentId,
          volunteerId: existing.volunteerId,
          taskId: existing.taskId,
          taskTitle: existing.task.title,
        }),
      },
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

