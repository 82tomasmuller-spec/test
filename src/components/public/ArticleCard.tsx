import Link from 'next/link';
import Image from 'next/image';
import { formatDate, estimateReadTime, getExcerpt } from '@/lib/utils';

interface ArticleCardProps {
  article: {
    slug: string;
    title: string;
    content: string;
    excerpt?: string | null;
    featuredImage?: string | null;
    publishedAt?: Date | string | null;
    category?: { name: string; slug: string; color: string } | null;
    author?: { name: string } | null;
    tags?: { tag: { name: string; slug: string } }[];
  };
  variant?: 'default' | 'featured' | 'compact';
}

export default function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const readTime = estimateReadTime(article.content);
  const excerpt = article.excerpt || getExcerpt(article.content);

  if (variant === 'featured') {
    return (
      <article className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
        <Link href={`/articles/${article.slug}`} className="block">
          <div className="aspect-[16/9] bg-gray-200 relative overflow-hidden">
            {article.featuredImage ? (
              <Image
                src={article.featuredImage}
                alt={article.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 66vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <span className="text-6xl text-primary-400">AI</span>
              </div>
            )}
          </div>
          <div className="p-6">
            {article.category && (
              <span
                className="inline-block px-3 py-1 text-xs font-semibold rounded-full mb-3"
                style={{
                  backgroundColor: article.category.color + '20',
                  color: article.category.color,
                }}
              >
                {article.category.name}
              </span>
            )}
            <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
              {article.title}
            </h2>
            <p className="text-gray-600 mb-4 line-clamp-3">{excerpt}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {article.author && <span>{article.author.name}</span>}
              {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
              <span>{readTime} min čtení</span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="group flex gap-4 py-4 border-b border-gray-100 last:border-0">
        <Link href={`/articles/${article.slug}`} className="flex gap-4 flex-1">
          <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            {article.featuredImage ? (
              <Image
                src={article.featuredImage}
                alt={article.title}
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                <span className="text-sm text-primary-400">AI</span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">
              {article.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
              <span>{readTime} min</span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // Default variant
  return (
    <article className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <Link href={`/articles/${article.slug}`} className="block">
        <div className="aspect-[16/10] bg-gray-200 relative overflow-hidden">
          {article.featuredImage ? (
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
              <span className="text-4xl text-primary-300">AI</span>
            </div>
          )}
        </div>
        <div className="p-5">
          {article.category && (
            <span
              className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full mb-2"
              style={{
                backgroundColor: article.category.color + '20',
                color: article.category.color,
              }}
            >
              {article.category.name}
            </span>
          )}
          <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
            {article.title}
          </h2>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{excerpt}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
            <span>{readTime} min čtení</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
