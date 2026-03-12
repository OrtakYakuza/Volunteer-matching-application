import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AutomationMode, Priority, Skill, TaskStatus } from "@/lib/enums";

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
      screeningRequired,
      screeningNote,
      meetingPoint,
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
      screeningRequired?: boolean;
      screeningNote?: string;
      meetingPoint?: string;
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

    const task = await prisma.task.create({
      data: {
        title,
        category,
        description,
        location,
        postalCode,
        requiredSkills: JSON.stringify(parsedSkills),
        capacity,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        priority: parsedPriority,
        status: TaskStatus.OPEN,
        automationMode: AutomationMode.MANUAL,
        screeningRequired,
        screeningNote,
        meetingPoint,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
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

