import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const club = await prisma.club.findUnique({
      where: { slug },
      include: {
        categories: {
          orderBy: { sortOrder: "asc" },
        },
        products: {
          where: { active: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ club });
  } catch (error) {
    console.error("Get club error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
