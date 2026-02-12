import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { slugify, generateInvoiceNumber, generateVariableSymbol } from "@/lib/utils";
import { sendEmail, invoiceEmail } from "@/lib/email";
import { generatePaymentQR } from "@/lib/qr";

export async function GET() {
  try {
    const clubs = await prisma.club.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ clubs });
  } catch (error) {
    console.error("List clubs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    const { name, contactEmail, contactPhone, ico, address } = await request.json();

    if (!name || !contactEmail) {
      return NextResponse.json(
        { error: "Name and contact email are required" },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    const existingClub = await prisma.club.findUnique({
      where: { slug },
    });

    if (existingClub) {
      return NextResponse.json(
        { error: "Club with this name already exists" },
        { status: 409 }
      );
    }

    const invoiceNumber = generateInvoiceNumber();
    const variableSymbol = generateVariableSymbol();
    const activationFee = 500;

    const club = await prisma.club.create({
      data: {
        name,
        slug,
        contactEmail,
        contactPhone: contactPhone || null,
        ico: ico || null,
        address: address || null,
        isActive: false,
        memberships: {
          create: {
            userId: user.id,
            role: "ADMIN",
          },
        },
        invoices: {
          create: {
            invoiceNumber,
            amount: activationFee,
            variableSymbol,
            status: "UNPAID",
          },
        },
      },
      include: {
        memberships: true,
        invoices: true,
      },
    });

    const iban = process.env.BANK_IBAN || "CZ6508000000192000145399";

    const qrCodeDataUrl = await generatePaymentQR({
      iban,
      amount: activationFee,
      variableSymbol,
      message: `Aktivace klubu ${name}`,
      recipientName: "SportObjednavky",
    });

    await sendEmail({
      to: contactEmail,
      subject: `Faktura za aktivaci klubu - ${name}`,
      html: invoiceEmail({
        clubName: name,
        invoiceNumber,
        amount: activationFee,
        variableSymbol,
        qrCodeDataUrl,
        bankAccount: iban,
      }),
    });

    return NextResponse.json({ club, invoice: club.invoices[0] }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create club error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
