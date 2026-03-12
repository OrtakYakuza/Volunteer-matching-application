import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";


export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const volunteerId = params.id;

  if (!volunteerId) {
    return NextResponse.json(
      { error: "Volunteer id is required." },
      { status: 400 },
    );
  }

  try {
    const assignments = await prisma.assignment.findMany({
      where: { volunteerId },
      orderBy: { createdAt: "desc" },
      include: {
        task: true,
      },
    });

    return NextResponse.json({ assignments }, { status: 200 });
  } catch (error) {
    console.error("Error fetching assignments for volunteer", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments." },
      { status: 500 },
    );
  }
}

