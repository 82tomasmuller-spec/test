import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    await requireSuperAdmin();

    const { clubId } = await params;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        invoices: {
          where: { status: "UNPAID" },
          orderBy: { issuedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    if (club.isActive) {
      return NextResponse.json(
        { error: "Club is already active" },
        { status: 400 }
      );
    }

    // Activate club and mark invoice as paid
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: { isActive: true },
    });

    // Mark the latest unpaid invoice as paid
    if (club.invoices.length > 0) {
      await prisma.invoice.update({
        where: { id: club.invoices[0].id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      club: updatedClub,
      message: "Club activated successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("Activate club error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
