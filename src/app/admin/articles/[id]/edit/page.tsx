import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import ArticleEditor from '@/components/admin/ArticleEditor';

interface PageProps {
  params: { id: string };
}

export default async function EditArticlePage({ params }: PageProps) {
  const [article, categories, tags] = await Promise.all([
    prisma.article.findUnique({
      where: { id: params.id },
      include: {
        tags: { include: { tag: true } },
        faqItems: { orderBy: { sortOrder: 'asc' } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ]);

  if (!article) notFound();

  const articleData = {
    id: article.id,
    title: article.title,
    slug: article.slug,
    content: article.content,
    excerpt: article.excerpt || '',
    status: article.status,
    categoryId: article.categoryId || '',
    metaTitle: article.metaTitle || '',
    metaDescription: article.metaDescription || '',
    canonicalUrl: article.canonicalUrl || '',
    featuredImage: article.featuredImage || '',
    publishAt: article.publishAt ? new Date(article.publishAt).toISOString().slice(0, 16) : '',
    tags: article.tags.map((t) => t.tag.name),
    faqItems: article.faqItems.map((f) => ({ question: f.question, answer: f.answer })),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Upravit článek</h1>
      <ArticleEditor article={articleData} categories={categories} allTags={tags} />
    </div>
  );
}
