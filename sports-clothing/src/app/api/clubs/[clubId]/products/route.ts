import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClubAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;

    const products = await prisma.product.findMany({
      where: { clubId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("List products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;

    await requireClubAdmin(clubId);

    const { name, description, price, sizes, imageUrl, sortOrder } = await request.json();

    if (!name || price === undefined || !sizes) {
      return NextResponse.json(
        { error: "Name, price, and sizes are required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        clubId,
        name,
        description: description || null,
        price,
        sizes: typeof sizes === "string" ? sizes : JSON.stringify(sizes),
        imageUrl: imageUrl || null,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
