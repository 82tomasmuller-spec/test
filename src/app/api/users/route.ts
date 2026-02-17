import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { articles: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, email, password, role } = body;

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: 'Všechna pole jsou povinná' }, { status: 400 });
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email je již registrován' }, { status: 400 });
  }

  const hashedPassword = await hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || 'author',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'create',
      entity: 'user',
      entityId: user.id,
      details: `Vytvořen uživatel: ${name}`,
    },
  });

  return NextResponse.json(user, { status: 201 });
}
