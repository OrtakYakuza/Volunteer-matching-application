import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email }: { name: string; email: string; } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 },
      );
    }

    const existingCoordinator = await prisma.coordinator.findUnique({
      where: { email },
    });

    if (existingCoordinator) {
      return NextResponse.json(
        { error: "A coordinator with this email already exists." },
        { status: 409 },
      );
    }

    const coordinator = await prisma.coordinator.create({
      data: {
        name,
        email,
      },
    });

    return NextResponse.json(
      {
        coordinator,
        message: "Registration successful. You can now manage tasks.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating coordinator", error);
    return NextResponse.json(
      { error: "Failed to register coordinator." },
      { status: 500 },
    );
  }
}
