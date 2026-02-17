import { absoluteUrl } from '@/lib/utils';

interface ArticleSchemaProps {
  article: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string | null;
    metaDescription?: string | null;
    featuredImage?: string | null;
    publishedAt?: Date | string | null;
    updatedAt?: Date | string | null;
    author?: { name: string } | null;
    category?: { name: string } | null;
    faqItems?: { question: string; answer: string }[];
  };
}

export function ArticleSchema({ article }: ArticleSchemaProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription || article.excerpt || '',
    url: absoluteUrl(`/articles/${article.slug}`),
    ...(article.featuredImage && {
      image: article.featuredImage.startsWith('http')
        ? article.featuredImage
        : absoluteUrl(article.featuredImage),
    }),
    ...(article.publishedAt && { datePublished: new Date(article.publishedAt).toISOString() }),
    ...(article.updatedAt && { dateModified: new Date(article.updatedAt).toISOString() }),
    author: {
      '@type': 'Person',
      name: article.author?.name || 'Redakce',
    },
    publisher: {
      '@type': 'Organization',
      name: process.env.APP_NAME || 'AI Blog CMS',
    },
    ...(article.category && {
      articleSection: article.category.name,
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function FAQSchema({ items }: { items: { question: string; answer: string }[] }) {
  if (!items?.length) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function WebSiteSchema() {
  const siteName = process.env.APP_NAME || 'AI Blog CMS';
  const siteUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
