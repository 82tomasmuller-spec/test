import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plans = await prisma.contentPlan.findMany({
    orderBy: [{ priority: 'desc' }, { plannedDate: 'asc' }, { createdAt: 'desc' }],
  });

  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, description, keyword, status, priority, plannedDate, notes } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Název je povinný' }, { status: 400 });
  }

  const plan = await prisma.contentPlan.create({
    data: {
      title,
      description: description || null,
      keyword: keyword || null,
      status: status || 'idea',
      priority: priority || 'medium',
      plannedDate: plannedDate ? new Date(plannedDate) : null,
      notes: notes || null,
    },
  });

  return NextResponse.json(plan, { status: 201 });
}
