import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateSlug } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(req.url);

  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('perPage') || '20', 10);

  const where: any = {};

  // Non-authenticated users only see published articles
  if (!session) {
    where.status = 'published';
  } else if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        author: { select: { name: true } },
        category: true,
        tags: { include: { tag: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    title, content, excerpt, status, categoryId, metaTitle, metaDescription,
    canonicalUrl, featuredImage, publishAt, tags, faqItems,
    aiGenerated, aiPrompt, writingStyle, targetAudience,
  } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Titulek je povinný' }, { status: 400 });
  }

  let slug = body.slug || generateSlug(title);

  // Ensure unique slug
  const existingSlug = await prisma.article.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const article = await prisma.article.create({
    data: {
      title,
      slug,
      content: content || '',
      excerpt: excerpt || null,
      status: status || 'draft',
      categoryId: categoryId || null,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      featuredImage: featuredImage || null,
      publishAt: publishAt ? new Date(publishAt) : null,
      publishedAt: status === 'published' ? new Date() : null,
      authorId: session.user.id,
      aiGenerated: aiGenerated || false,
      aiPrompt: aiPrompt || null,
      writingStyle: writingStyle || null,
      targetAudience: targetAudience || null,
    },
  });

  // Handle tags
  if (tags?.length) {
    for (const tagName of tags) {
      const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: {},
        create: { name: tagName, slug: tagSlug },
      });
      await prisma.articleTag.create({
        data: { articleId: article.id, tagId: tag.id },
      });
    }
  }

  // Handle FAQ items
  if (faqItems?.length) {
    for (let i = 0; i < faqItems.length; i++) {
      await prisma.fAQItem.create({
        data: {
          articleId: article.id,
          question: faqItems[i].question,
          answer: faqItems[i].answer,
          sortOrder: i,
        },
      });
    }
  }

  // Log publication
  if (status === 'published') {
    await prisma.publicationLog.create({
      data: {
        articleId: article.id,
        action: 'published',
        details: `Článek "${title}" publikován`,
      },
    });
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'create',
      entity: 'article',
      entityId: article.id,
      details: `Vytvořen článek: ${title}`,
    },
  });

  return NextResponse.json(article, { status: 201 });
}
