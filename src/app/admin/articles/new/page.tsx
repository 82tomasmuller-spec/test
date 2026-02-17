import prisma from '@/lib/prisma';
import ArticleEditor from '@/components/admin/ArticleEditor';

export default async function NewArticlePage() {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.tag.findMany({ orderBy: { name: 'asc' } }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nový článek</h1>
      <ArticleEditor categories={categories} allTags={tags} />
    </div>
  );
}
