import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const partners = await prisma.affiliatePartner.findMany({
    include: {
      links: {
        orderBy: { clicks: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(partners);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, website, commission, notes } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Název je povinný' }, { status: 400 });
  }

  const partner = await prisma.affiliatePartner.create({
    data: {
      name,
      website: website || null,
      commission: commission || null,
      notes: notes || null,
    },
  });

  return NextResponse.json(partner, { status: 201 });
}
