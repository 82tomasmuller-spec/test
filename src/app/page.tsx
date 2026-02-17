import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import ArticleCard from '@/components/public/ArticleCard';
import { WebSiteSchema } from '@/components/public/SchemaOrg';

export const metadata: Metadata = {
  title: 'AI Blog CMS - Domů',
  description: 'Moderní blogový systém s AI podporou. Nejnovější články a novinky.',
};

export const revalidate = 60;

async function getHomeData() {
  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      take: 13,
      include: {
        category: true,
        author: { select: { name: true } },
        tags: { include: { tag: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  return { articles, categories };
}

export default async function HomePage() {
  const { articles, categories } = await getHomeData();
  const featuredArticle = articles[0];
  const recentArticles = articles.slice(1);

  return (
    <>
      <WebSiteSchema />
      <Header categories={categories} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero / Featured Article */}
        {featuredArticle && (
          <section className="mb-12">
            <ArticleCard article={featuredArticle} variant="featured" />
          </section>
        )}

        {/* Recent Articles */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Nejnovější články</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {articles.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg">Zatím nejsou žádné publikované články.</p>
              <p className="mt-2">Vytvořte svůj první článek v administraci.</p>
            </div>
          )}
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Kategorie</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="block p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow text-center"
                >
                  <div
                    className="w-10 h-10 rounded-full mx-auto mb-2"
                    style={{ backgroundColor: cat.color + '20' }}
                  />
                  <span className="font-medium text-gray-900">{cat.name}</span>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer siteName="AI Blog CMS" categories={categories} />
    </>
  );
}
