import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import ArticleCard from '@/components/public/ArticleCard';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import Pagination from '@/components/public/Pagination';

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

const ARTICLES_PER_PAGE = 12;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) return { title: 'Kategorie nenalezena' };

  return {
    title: `${category.name} - Články`,
    description: category.description || `Články v kategorii ${category.name}`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();

  const page = parseInt(searchParams.page || '1', 10);
  const skip = (page - 1) * ARTICLES_PER_PAGE;

  const [articles, total, categories] = await Promise.all([
    prisma.article.findMany({
      where: { status: 'published', categoryId: category.id },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: ARTICLES_PER_PAGE,
      include: {
        category: true,
        author: { select: { name: true } },
        tags: { include: { tag: true } },
      },
    }),
    prisma.article.count({
      where: { status: 'published', categoryId: category.id },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  const totalPages = Math.ceil(total / ARTICLES_PER_PAGE);

  return (
    <>
      <Header categories={categories} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Domů', href: '/' },
            { label: category.name },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-gray-600">{category.description}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">{total} článků</p>
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p>V této kategorii zatím nejsou žádné články.</p>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/category/${category.slug}`}
        />
      </main>

      <Footer categories={categories} />
    </>
  );
}
