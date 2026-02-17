'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { STATUS_LABELS, STATUS_COLORS, type ArticleStatus } from '@/types';

interface Article {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  publishedAt: string | null;
  updatedAt: string;
  author: { name: string };
  category: { name: string; color: string } | null;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchArticles();
  }, [statusFilter, searchQuery]);

  async function fetchArticles() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (searchQuery) params.set('search', searchQuery);

    try {
      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      setArticles(data.items || []);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteArticle(id: string) {
    if (!confirm('Opravdu chcete smazat tento článek?')) return;

    try {
      await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      fetchArticles();
    } catch (err) {
      console.error('Failed to delete article:', err);
    }
  }

  const statuses: ArticleStatus[] = ['draft', 'in_progress', 'ready', 'scheduled', 'published', 'archived'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Články</h1>
        <Link
          href="/admin/articles/new"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
        >
          + Nový článek
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Hledat články..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
        >
          <option value="">Všechny stavy</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Articles Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Název</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Kategorie</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Stav</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Autor</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Aktualizace</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Akce</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Načítání...
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Žádné články nenalezeny
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr key={article.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="text-sm font-medium text-gray-900 hover:text-primary-600"
                    >
                      {article.title}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5">/{article.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    {article.category ? (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: article.category.color + '20',
                          color: article.category.color,
                        }}
                      >
                        {article.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[article.status as ArticleStatus]}`}>
                      {STATUS_LABELS[article.status as ArticleStatus] || article.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{article.author?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(article.updatedAt).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Upravit
                      </Link>
                      {article.status === 'published' && (
                        <Link
                          href={`/articles/${article.slug}`}
                          target="_blank"
                          className="text-xs px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          Zobrazit
                        </Link>
                      )}
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Smazat
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
