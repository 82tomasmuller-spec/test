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
  const tag = await prisma.tag.findUnique({ where: { slug: params.slug } });
  if (!tag) return { title: 'Tag nenalezen' };

  return {
    title: `#${tag.name} - Články`,
    description: `Články označené tagem ${tag.name}`,
  };
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const tag = await prisma.tag.findUnique({ where: { slug: params.slug } });
  if (!tag) notFound();

  const page = parseInt(searchParams.page || '1', 10);
  const skip = (page - 1) * ARTICLES_PER_PAGE;

  const [articleTags, total, categories] = await Promise.all([
    prisma.articleTag.findMany({
      where: { tagId: tag.id },
      skip,
      take: ARTICLES_PER_PAGE,
      include: {
        article: {
          include: {
            category: true,
            author: { select: { name: true } },
            tags: { include: { tag: true } },
          },
        },
      },
      orderBy: { article: { publishedAt: 'desc' } },
    }),
    prisma.articleTag.count({ where: { tagId: tag.id } }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  const articles = articleTags
    .map((at) => at.article)
    .filter((a) => a.status === 'published');
  const totalPages = Math.ceil(total / ARTICLES_PER_PAGE);

  return (
    <>
      <Header categories={categories} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Domů', href: '/' },
            { label: `#${tag.name}` },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">#{tag.name}</h1>
          <p className="text-sm text-gray-500">{total} článků</p>
        </div>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p>Pro tento tag zatím nejsou žádné články.</p>
          </div>
        )}

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          basePath={`/tag/${tag.slug}`}
        />
      </main>

      <Footer categories={categories} />
    </>
  );
}
