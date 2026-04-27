import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AutomationMode, Priority, RecurrenceRule, Skill, TaskStatus } from "@/lib/enums";
import { randomUUID } from "crypto";

/** Returns the next Date offset by the given recurrence rule. */
function advanceDate(date: Date, rule: RecurrenceRule): Date {
  const next = new Date(date);
  switch (rule) {
    case RecurrenceRule.DAILY:
      next.setDate(next.getDate() + 1);
      break;
    case RecurrenceRule.WEEKLY:
      next.setDate(next.getDate() + 7);
      break;
    case RecurrenceRule.BIWEEKLY:
      next.setDate(next.getDate() + 14);
      break;
    case RecurrenceRule.MONTHLY:
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

/** Generate all (startTime, endTime) pairs up to 4 weeks from now. */
function generateOccurrences(
  start: Date,
  end: Date,
  rule: RecurrenceRule,
): Array<{ startTime: Date; endTime: Date }> {
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + 28); // 4 weeks ahead

  const duration = end.getTime() - start.getTime();
  const occurrences: Array<{ startTime: Date; endTime: Date }> = [];

  let current = new Date(start);
  while (current <= horizon) {
    occurrences.push({
      startTime: new Date(current),
      endTime: new Date(current.getTime() + duration),
    });
    current = advanceDate(current, rule);
  }
  return occurrences;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      category,
      description,
      location,
      postalCode,
      requiredSkills,
      capacity,
      startTime,
      endTime,
      priority,
      automationMode,
      screeningRequired,
      screeningNote,
      meetingPoint,
      recurrenceRule,
    } = body as {
      title: string;
      category: string;
      description: string;
      location: string;
      postalCode?: string;
      requiredSkills: Skill[] | string[];
      capacity: number;
      startTime: string;
      endTime: string;
      priority?: Priority | string;
      automationMode?: AutomationMode | string;
      screeningRequired?: boolean;
      screeningNote?: string;
      meetingPoint?: string;
      recurrenceRule?: RecurrenceRule | string;
    };

    if (
      !title ||
      !category ||
      !description ||
      !location ||
      !capacity ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        { error: "Missing required task fields." },
        { status: 400 },
      );
    }

    const parsedSkills: Skill[] = (requiredSkills ?? []).map((s) =>
      typeof s === "string" ? (s as Skill) : s,
    );

    const parsedPriority: Priority =
      typeof priority === "string"
        ? ((priority as Priority) ?? Priority.MEDIUM)
        : priority ?? Priority.MEDIUM;

    const parsedAutomationMode: AutomationMode =
      typeof automationMode === "string"
        ? ((automationMode as AutomationMode) ?? AutomationMode.MANUAL)
        : automationMode ?? AutomationMode.MANUAL;

    const parsedRecurrenceRule: RecurrenceRule | null =
      recurrenceRule && Object.values(RecurrenceRule).includes(recurrenceRule as RecurrenceRule)
        ? (recurrenceRule as RecurrenceRule)
        : null;

    const sharedData = {
      title,
      category,
      description,
      location,
      postalCode,
      requiredSkills: JSON.stringify(parsedSkills),
      capacity,
      priority: parsedPriority,
      status: TaskStatus.OPEN,
      automationMode: parsedAutomationMode,
      screeningRequired,
      screeningNote,
      meetingPoint,
      recurrenceRule: parsedRecurrenceRule,
    };

    // Non-recurring: create a single task as before.
    if (!parsedRecurrenceRule) {
      const task = await prisma.task.create({
        data: {
          ...sharedData,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          seriesId: null,
        },
      });
      return NextResponse.json({ task }, { status: 201 });
    }

    // Recurring: generate all occurrences within 4 weeks and create them in a transaction.
    const seriesId = randomUUID();
    const occurrences = generateOccurrences(
      new Date(startTime),
      new Date(endTime),
      parsedRecurrenceRule,
    );

    const tasks = await prisma.$transaction(
      occurrences.map((occ) =>
        prisma.task.create({
          data: {
            ...sharedData,
            startTime: occ.startTime,
            endTime: occ.endTime,
            seriesId,
          },
        }),
      ),
    );

    // Return the first instance as the "created" task.
    return NextResponse.json({ task: tasks[0], seriesId, instanceCount: tasks.length }, { status: 201 });
  } catch (error) {
    console.error("Error creating task", error);
    return NextResponse.json(
      { error: "Failed to create task." },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { startTime: "asc" },
      include: {
        assignments: {
          where: { status: { in: ["PROPOSED", "ACCEPTED"] } },
        },
      },
    });

    const withCounts = tasks.map((task) => ({
      ...task,
      acceptedCount: task.assignments.filter(
        (a) => a.status === "ACCEPTED",
      ).length,
      proposedCount: task.assignments.filter(
        (a) => a.status === "PROPOSED",
      ).length,
    }));

    return NextResponse.json({ tasks: withCounts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks." },
      { status: 500 },
    );
  }
}

