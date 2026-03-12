import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 },
      );
    }

    const volunteer = await prisma.volunteer.findUnique({
      where: { email },
    });

    if (!volunteer) {
      return NextResponse.json(
        { error: "No volunteer found for this email." },
        { status: 404 },
      );
    }

    return NextResponse.json({ volunteer }, { status: 200 });
  } catch (error) {
    console.error("Error looking up volunteer by email", error);
    return NextResponse.json(
      { error: "Failed to look up volunteer." },
      { status: 500 },
    );
  }
}

