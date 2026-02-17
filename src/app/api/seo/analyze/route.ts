import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { analyzeSEO } from '@/lib/seo';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { articleId } = await req.json();

  if (!articleId) {
    return NextResponse.json({ error: 'articleId je povinný' }, { status: 400 });
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!article) {
    return NextResponse.json({ error: 'Článek nenalezen' }, { status: 404 });
  }

  const analysis = analyzeSEO({
    title: article.title,
    metaTitle: article.metaTitle || undefined,
    metaDescription: article.metaDescription || undefined,
    content: article.content,
    slug: article.slug,
  });

  // Save report
  await prisma.sEOReport.create({
    data: {
      articleId,
      score: analysis.score,
      issues: JSON.stringify(analysis.issues),
      suggestions: JSON.stringify(analysis.suggestions),
    },
  });

  return NextResponse.json(analysis);
}
