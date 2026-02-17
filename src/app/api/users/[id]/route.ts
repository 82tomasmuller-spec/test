import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const updateData: any = {};

  if (body.role) updateData.role = body.role;
  if (body.name) updateData.name = body.name;

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Prevent self-deletion
  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'Nemůžete smazat svůj vlastní účet' }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
