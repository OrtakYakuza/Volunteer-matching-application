import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "";

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required." },
      { status: 400 },
    );
  }

  try {
    const volunteers = await prisma.volunteer.findMany({
      where: {
        OR: [
          { name: { contains: query,  } },
          { email: { contains: query,  } },
          { postalCode: { contains: query,  } },
        ],
      },
      take: 20,
    });

    return NextResponse.json({ volunteers }, { status: 200 });
  } catch (error) {
    console.error("Error searching volunteers", error);
    return NextResponse.json(
      { error: "Failed to search volunteers." },
      { status: 500 },
    );
  }
}

