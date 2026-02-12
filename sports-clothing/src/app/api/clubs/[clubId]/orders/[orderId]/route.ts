import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClubAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string; orderId: string }> }
) {
  try {
    const { clubId, orderId } = await params;

    const order = await prisma.order.findFirst({
      where: { id: orderId, clubId },
      include: {
        items: {
          include: { product: true },
        },
        category: true,
        statusLog: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string; orderId: string }> }
) {
  try {
    const { clubId, orderId } = await params;

    await requireClubAdmin(clubId);

    const order = await prisma.order.findFirst({
      where: { id: orderId, clubId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const { status, note } = await request.json();

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        statusLog: {
          create: {
            oldStatus: order.status,
            newStatus: status,
            note: note || null,
          },
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        category: true,
        statusLog: {
          orderBy: { changedAt: "desc" },
        },
      },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Forbidden") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    console.error("Update order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
