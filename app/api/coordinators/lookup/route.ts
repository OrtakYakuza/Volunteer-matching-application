import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }

    const coordinator = await prisma.coordinator.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!coordinator) {
      return NextResponse.json(
        { error: "Coordinator not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ coordinator }, { status: 200 });
  } catch (error) {
    console.error("Error looking up coordinator", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
