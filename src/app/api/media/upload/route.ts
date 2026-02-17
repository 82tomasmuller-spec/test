import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { processUpload } from '@/lib/media';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nebyl nahrán žádný soubor' }, { status: 400 });
    }

    const result = await processUpload(file);

    const media = await prisma.media.create({
      data: {
        filename: result.filename,
        originalName: result.originalName,
        mimeType: result.mimeType,
        size: result.size,
        width: result.width ?? null,
        height: result.height ?? null,
        path: result.path,
      },
    });

    return NextResponse.json(media, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
