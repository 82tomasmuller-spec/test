import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const articles = await prisma.article.findMany({
    where: { status: 'published' },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  });

  const categories = await prisma.category.findMany({
    select: { slug: true, updatedAt: true },
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...articles.map((article) => ({
      url: `${baseUrl}/articles/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...categories.map((cat) => ({
      url: `${baseUrl}/category/${cat.slug}`,
      lastModified: cat.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
