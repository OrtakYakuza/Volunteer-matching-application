import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Skill } from "@/lib/enums";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phoneNumber,
      birthDate,
      postalCode,
      location,
      description,
      skills,
    }: {
      name: string;
      email: string;
      phoneNumber: string;
      birthDate: string;
      postalCode?: string;
      location?: string;
      description?: string;
      skills: Skill[] | string[];
    } = body;

    if (!name || !email || !phoneNumber || !birthDate) {
      return NextResponse.json(
        { error: "Name, email, phone number, and birth date are required." },
        { status: 400 },
      );
    }

    const existingVolunteer = await prisma.volunteer.findUnique({
      where: { email },
    });

    if (existingVolunteer) {
      return NextResponse.json(
        { error: "A volunteer with this email already exists." },
        { status: 409 },
      );
    }

    const parsedSkills: Skill[] = (skills ?? []).map((s) =>
      typeof s === "string" ? (s as Skill) : s,
    );

    const volunteer = await prisma.volunteer.create({
      data: {
        name,
        email,
        phoneNumber,
        birthDate: new Date(birthDate),
        postalCode,
        location,
        description,
        skills: JSON.stringify(parsedSkills),
      },
    });

    return NextResponse.json(
      {
        volunteer,
        message:
          "Thank you for registering. You can now browse tasks and apply.",
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

