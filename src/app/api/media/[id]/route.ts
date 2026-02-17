import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const media = await prisma.media.update({
    where: { id: params.id },
    data: {
      altText: body.altText ?? undefined,
      caption: body.caption ?? undefined,
    },
  });

  return NextResponse.json(media);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const media = await prisma.media.findUnique({ where: { id: params.id } });
  if (!media) {
    return NextResponse.json({ error: 'Soubor nenalezen' }, { status: 404 });
  }

  // Delete physical file
  try {
    const filePath = path.join(process.cwd(), 'public', media.path);
    await unlink(filePath);
  } catch {
    // File may already be deleted
  }

  await prisma.media.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
