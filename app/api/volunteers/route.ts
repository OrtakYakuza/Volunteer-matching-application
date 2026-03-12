import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Skill } from "@/lib/enums";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      postalCode,
      location,
      skills,
      availabilityBlocks,
    }: {
      name: string;
      email: string;
      postalCode?: string;
      location?: string;
      skills: Skill[] | string[];
      availabilityBlocks?: { start: string; end: string; note?: string }[];
    } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 },
      );
    }

    const parsedSkills: Skill[] = (skills ?? []).map((s) =>
      typeof s === "string" ? (s as Skill) : s,
    );

    const volunteer = await prisma.volunteer.create({
      data: {
        name,
        email,
        postalCode,
        location,
        skills: JSON.stringify(parsedSkills),
        availabilityBlocks: availabilityBlocks
          ? {
              create: availabilityBlocks.map((block) => ({
                start: new Date(block.start),
                end: new Date(block.end),
                note: block.note,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json(
      {
        volunteer,
        message:
          "Thank you for registering. Coordinators will review your availability and send you mission proposals.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating volunteer", error);
    return NextResponse.json(
      { error: "Failed to register volunteer." },
      { status: 500 },
    );
  }
}

