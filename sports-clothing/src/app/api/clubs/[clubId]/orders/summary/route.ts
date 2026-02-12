import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClubAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  try {
    const { clubId } = await params;

    await requireClubAdmin(clubId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");

    const orderWhere: Record<string, unknown> = { clubId };
    if (status) {
      orderWhere.status = status;
    }
    if (categoryId) {
      orderWhere.categoryId = categoryId;
    }

    // Get all order items for matching orders
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: orderWhere,
      },
      include: {
        product: true,
        order: {
          select: {
            status: true,
            categoryId: true,
          },
        },
      },
    });

    // Aggregate: product x size -> total quantity
    const summary: Record<
      string,
      {
        productId: string;
        productName: string;
        size: string;
        totalQuantity: number;
        totalAmount: number;
      }
    > = {};

    for (const item of orderItems) {
      const key = `${item.productId}-${item.size}`;
      if (!summary[key]) {
        summary[key] = {
          productId: item.productId,
          productName: item.product.name,
          size: item.size,
          totalQuantity: 0,
          totalAmount: 0,
        };
      }
      summary[key].totalQuantity += item.quantity;
      summary[key].totalAmount += item.unitPrice * item.quantity;
    }

    const summaryArray = Object.values(summary).sort((a, b) => {
      if (a.productName !== b.productName) {
        return a.productName.localeCompare(b.productName);
      }
      return a.size.localeCompare(b.size);
    });

    const totalOrders = await prisma.order.count({ where: orderWhere });
    const totalAmount = summaryArray.reduce((sum, item) => sum + item.totalAmount, 0);

    return NextResponse.json({
      summary: summaryArray,
      totalOrders,
      totalAmount,
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
    console.error("Order summary error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
