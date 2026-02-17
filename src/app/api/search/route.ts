import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json([]);
  }

  const articles = await prisma.article.findMany({
    where: {
      status: 'published',
      OR: [
        { title: { contains: query } },
        { content: { contains: query } },
        { excerpt: { contains: query } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      category: { select: { name: true, slug: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  return NextResponse.json(articles);
}
