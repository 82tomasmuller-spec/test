import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import ArticleCard from '@/components/public/ArticleCard';
import Pagination from '@/components/public/Pagination';

interface PageProps {
  searchParams: { q?: string; page?: string };
}

const ARTICLES_PER_PAGE = 12;

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const query = searchParams.q || '';
  return {
    title: query ? `Výsledky hledání: ${query}` : 'Vyhledávání',
    robots: { index: false },
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const query = searchParams.q?.trim() || '';
  const page = parseInt(searchParams.page || '1', 10);
  const skip = (page - 1) * ARTICLES_PER_PAGE;

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });

  let articles: any[] = [];
  let total = 0;

  if (query) {
    const where = {
      status: 'published' as const,
      OR: [
        { title: { contains: query } },
        { content: { contains: query } },
        { excerpt: { contains: query } },
      ],
    };

    [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: ARTICLES_PER_PAGE,
        include: {
          category: true,
          author: { select: { name: true } },
          tags: { include: { tag: true } },
        },
      }),
      prisma.article.count({ where }),
    ]);
  }

  const totalPages = Math.ceil(total / ARTICLES_PER_PAGE);

  return (
    <>
      <Header categories={categories} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Vyhledávání</h1>
          <form action="/search" method="GET" className="flex gap-2 max-w-2xl">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Hledat články..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Hledat
            </button>
          </form>
        </div>

        {query && (
          <p className="text-gray-600 mb-6">
            {total > 0
              ? `Nalezeno ${total} výsledků pro "${query}"`
              : `Žádné výsledky pro "${query}"`}
          </p>
        )}

        {articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}

        {query && articles.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">Zkuste jiný hledaný výraz.</p>
          </div>
        )}

        {query && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={`/search?q=${encodeURIComponent(query)}`}
          />
        )}
      </main>

      <Footer categories={categories} />
    </>
  );
}
