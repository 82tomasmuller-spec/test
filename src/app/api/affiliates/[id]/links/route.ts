import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, url, shortCode } = body;

  if (!name?.trim() || !url?.trim()) {
    return NextResponse.json({ error: 'Název a URL jsou povinné' }, { status: 400 });
  }

  const code = shortCode?.trim() || crypto.randomBytes(4).toString('hex');

  const link = await prisma.affiliateLink.create({
    data: {
      partnerId: params.id,
      name,
      url,
      shortCode: code,
    },
  });

  return NextResponse.json(link, { status: 201 });
}
