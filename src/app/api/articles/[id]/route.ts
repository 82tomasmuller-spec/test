import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: {
      author: { select: { name: true, email: true } },
      category: true,
      tags: { include: { tag: true } },
      faqItems: { orderBy: { sortOrder: 'asc' } },
      affiliateLinks: { include: { affiliateLink: true } },
    },
  });

  if (!article) {
    return NextResponse.json({ error: 'Článek nenalezen' }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) {
    return NextResponse.json({ error: 'Článek nenalezen' }, { status: 404 });
  }

  const body = await req.json();
  const {
    title, slug, content, excerpt, status, categoryId,
    metaTitle, metaDescription, canonicalUrl, featuredImage,
    publishAt, tags, faqItems,
  } = body;

  // Save version before updating
  await prisma.articleVersion.create({
    data: {
      articleId: article.id,
      title: article.title,
      content: article.content,
      version: await prisma.articleVersion.count({ where: { articleId: article.id } }) + 1,
    },
  });

  const wasPublished = article.status === 'published';
  const isNowPublished = status === 'published';

  const updated = await prisma.article.update({
    where: { id: params.id },
    data: {
      title: title ?? article.title,
      slug: slug ?? article.slug,
      content: content ?? article.content,
      excerpt: excerpt ?? article.excerpt,
      status: status ?? article.status,
      categoryId: categoryId || null,
      metaTitle: metaTitle ?? article.metaTitle,
      metaDescription: metaDescription ?? article.metaDescription,
      canonicalUrl: canonicalUrl ?? article.canonicalUrl,
      featuredImage: featuredImage ?? article.featuredImage,
      publishAt: publishAt ? new Date(publishAt) : article.publishAt,
      publishedAt: !wasPublished && isNowPublished ? new Date() : article.publishedAt,
    },
  });

  // Update tags
  if (tags !== undefined) {
    await prisma.articleTag.deleteMany({ where: { articleId: article.id } });
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

  // Update FAQ items
  if (faqItems !== undefined) {
    await prisma.fAQItem.deleteMany({ where: { articleId: article.id } });
    for (let i = 0; i < faqItems.length; i++) {
      if (faqItems[i].question?.trim()) {
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
  }

  // Log publication status change
  if (!wasPublished && isNowPublished) {
    await prisma.publicationLog.create({
      data: {
        articleId: article.id,
        action: 'published',
        details: `Článek "${updated.title}" publikován`,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'update',
      entity: 'article',
      entityId: article.id,
      details: `Aktualizován článek: ${updated.title}`,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) {
    return NextResponse.json({ error: 'Článek nenalezen' }, { status: 404 });
  }

  await prisma.article.delete({ where: { id: params.id } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'delete',
      entity: 'article',
      entityId: params.id,
      details: `Smazán článek: ${article.title}`,
    },
  });

  return NextResponse.json({ success: true });
}
