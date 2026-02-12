import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClubAdmin } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { sendEmail, orderConfirmationEmail } from "@/lib/email";

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
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = { clubId };

    if (status) {
      where.status = status;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [
        { parentName: { contains: search } },
        { parentEmail: { contains: search } },
        { orderNumber: { contains: search } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: { product: true },
          },
          category: true,
          statusLog: {
            orderBy: { changedAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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
    console.error("List orders error:", error);
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

    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    if (!club.isActive) {
      return NextResponse.json(
        { error: "Club is not active" },
        { status: 400 }
      );
    }

    if (!club.ordersOpen) {
      return NextResponse.json(
        { error: "Orders are currently closed for this club" },
        { status: 400 }
      );
    }

    const { parentName, parentEmail, parentPhone, categoryId, items } = await request.json();

    if (!parentName || !parentEmail || !parentPhone || !categoryId || !items || !items.length) {
      return NextResponse.json(
        { error: "Parent name, email, phone, category, and items are required" },
        { status: 400 }
      );
    }

    // Validate category belongs to club
    const category = await prisma.category.findFirst({
      where: { id: categoryId, clubId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Fetch all products to calculate prices
    const productIds = items.map((item: { productId: string }) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        clubId,
        active: true,
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products not found or not active" },
        { status: 400 }
      );
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Calculate total amount and prepare order items
    let totalAmount = 0;
    const orderItems = items.map(
      (item: { productId: string; size: string; quantity: number }) => {
        const product = productMap.get(item.productId)!;
        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;
        return {
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
          unitPrice: product.price,
        };
      }
    );

    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        clubId,
        orderNumber,
        parentName,
        parentEmail,
        parentPhone,
        categoryId,
        totalAmount,
        status: "ORDERED",
        items: {
          create: orderItems,
        },
        statusLog: {
          create: {
            oldStatus: null,
            newStatus: "ORDERED",
            note: "Order created",
          },
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        category: true,
        statusLog: true,
      },
    });

    // Send confirmation email
    const emailHtml = orderConfirmationEmail({
      orderNumber: order.orderNumber,
      parentName: order.parentName,
      items: order.items.map((item) => ({
        productName: item.product.name,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      totalAmount: order.totalAmount,
      clubName: club.name,
    });

    await sendEmail({
      to: parentEmail,
      subject: `Potvrzení objednávky ${orderNumber} - ${club.name}`,
      html: emailHtml,
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
