import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { articles: true } } },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, slug, description, color } = body;

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: 'Název a slug jsou povinné' }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description: description || null,
      color: color || '#3b82f6',
    },
  });

  return NextResponse.json(category, { status: 201 });
}
