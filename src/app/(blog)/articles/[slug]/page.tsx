import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Header from '@/components/public/Header';
import Footer from '@/components/public/Footer';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import ArticleCard from '@/components/public/ArticleCard';
import { ArticleSchema, FAQSchema } from '@/components/public/SchemaOrg';
import { formatDate, estimateReadTime, absoluteUrl } from '@/lib/utils';

interface PageProps {
  params: { slug: string };
}

async function getArticle(slug: string) {
  const article = await prisma.article.findUnique({
    where: { slug, status: 'published' },
    include: {
      author: { select: { name: true } },
      category: true,
      tags: { include: { tag: true } },
      faqItems: { orderBy: { sortOrder: 'asc' } },
      affiliateLinks: {
        include: { affiliateLink: { include: { partner: true } } },
      },
    },
  });
  return article;
}

async function getRelatedArticles(articleId: string, categoryId: string | null) {
  if (!categoryId) return [];
  return prisma.article.findMany({
    where: {
      status: 'published',
      categoryId,
      id: { not: articleId },
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
    include: {
      category: true,
      author: { select: { name: true } },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: 'Článek nenalezen' };

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt || undefined,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt || undefined,
      url: absoluteUrl(`/articles/${article.slug}`),
      type: 'article',
      ...(article.featuredImage && { images: [article.featuredImage] }),
      publishedTime: article.publishedAt?.toISOString(),
    },
    alternates: {
      canonical: article.canonicalUrl || absoluteUrl(`/articles/${article.slug}`),
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  const relatedArticles = await getRelatedArticles(article.id, article.categoryId);
  const readTime = estimateReadTime(article.content);

  const breadcrumbs = [
    { label: 'Domů', href: '/' },
    ...(article.category
      ? [{ label: article.category.name, href: `/category/${article.category.slug}` }]
      : []),
    { label: article.title },
  ];

  const faqItems = article.faqItems.map((f) => ({
    question: f.question,
    answer: f.answer,
  }));

  return (
    <>
      <ArticleSchema article={{ ...article, faqItems }} />
      {faqItems.length > 0 && <FAQSchema items={faqItems} />}
      <Header categories={categories} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={breadcrumbs} />

        <article>
          {/* Header */}
          <header className="mb-8">
            {article.category && (
              <a
                href={`/category/${article.category.slug}`}
                className="inline-block px-3 py-1 text-sm font-semibold rounded-full mb-4"
                style={{
                  backgroundColor: article.category.color + '20',
                  color: article.category.color,
                }}
              >
                {article.category.name}
              </a>
            )}
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {article.author && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {article.author.name}
                </span>
              )}
              {article.publishedAt && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(article.publishedAt)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {readTime} min čtení
              </span>
            </div>
          </header>

          {/* Featured Image */}
          {article.featuredImage && (
            <div className="mb-8 rounded-xl overflow-hidden">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-auto"
                loading="eager"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose-article max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* FAQ Section */}
          {faqItems.length > 0 && (
            <section className="mt-12 bg-gray-50 rounded-xl p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Často kladené otázky</h2>
              <div className="space-y-2">
                {faqItems.map((faq, i) => (
                  <details key={i} className="faq-item bg-white rounded-lg p-4 border border-gray-100">
                    <summary>{faq.question}</summary>
                    <p className="mt-2 text-gray-600 leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {article.tags.map(({ tag }) => (
                <a
                  key={tag.id}
                  href={`/tag/${tag.slug}`}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  #{tag.name}
                </a>
              ))}
            </div>
          )}

          {/* Affiliate Disclosure */}
          {article.affiliateLinks.length > 0 && (
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
              Tento článek obsahuje affiliate odkazy. Při nákupu přes tyto odkazy můžeme získat provizi bez dodatečných nákladů pro vás.
            </div>
          )}
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Související články</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((related) => (
                <ArticleCard key={related.id} article={related} />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer categories={categories} />
    </>
  );
}
