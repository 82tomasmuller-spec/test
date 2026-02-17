'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { SEOAnalysis } from '@/types';

interface ArticleSEO {
  id: string;
  title: string;
  slug: string;
  metaTitle: string | null;
  metaDescription: string | null;
  content: string;
  status: string;
  seoScore?: number;
}

export default function SEOPage() {
  const [articles, setArticles] = useState<ArticleSEO[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<SEOAnalysis | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    try {
      const res = await fetch('/api/articles?perPage=100');
      const data = await res.json();
      setArticles(data.items || []);
    } catch {
      toast.error('Nepodařilo se načíst články');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleAnalyze = async (articleId: string) => {
    setAnalyzing(articleId);
    setSelectedArticle(articleId);

    try {
      const res = await fetch('/api/seo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      if (!res.ok) throw new Error('Analýza selhala');
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAnalyzing(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">SEO Manager</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Articles List */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Články k analýze</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Načítání...</div>
            ) : (
              articles.map((article) => (
                <div
                  key={article.id}
                  className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedArticle === article.id ? 'bg-primary-50' : ''
                  }`}
                  onClick={() => handleAnalyze(article.id)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">/{article.slug}</span>
                      {!article.metaTitle && (
                        <span className="text-xs text-red-500">Chybí meta title</span>
                      )}
                      {!article.metaDescription && (
                        <span className="text-xs text-red-500">Chybí meta desc</span>
                      )}
                    </div>
                  </div>
                  <button
                    disabled={analyzing === article.id}
                    className="text-xs px-3 py-1 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors ml-2"
                  >
                    {analyzing === article.id ? '...' : 'Analyzovat'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Analysis Result */}
        <div className="space-y-4">
          {analysisResult ? (
            <>
              {/* Score */}
              <div className="bg-white rounded-xl border border-gray-100 p-6 text-center">
                <p className="text-sm text-gray-500 mb-2">SEO skóre</p>
                <div
                  className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${getScoreColor(
                    analysisResult.score
                  )}`}
                >
                  {analysisResult.score}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {analysisResult.score >= 80
                    ? 'Výborné SEO'
                    : analysisResult.score >= 60
                    ? 'Potřebuje zlepšení'
                    : 'Vyžaduje pozornost'}
                </p>
              </div>

              {/* Issues */}
              {analysisResult.issues.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Problémy ({analysisResult.issues.length})
                  </h3>
                  <div className="space-y-2">
                    {analysisResult.issues.map((issue, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 p-3 rounded-lg ${
                          issue.type === 'error'
                            ? 'bg-red-50'
                            : issue.type === 'warning'
                            ? 'bg-yellow-50'
                            : 'bg-blue-50'
                        }`}
                      >
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            issue.type === 'error'
                              ? 'bg-red-100 text-red-700'
                              : issue.type === 'warning'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {issue.type === 'error' ? 'CHYBA' : issue.type === 'warning' ? 'VAROVÁNÍ' : 'INFO'}
                        </span>
                        <p className="text-sm text-gray-700">{issue.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysisResult.suggestions.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Doporučení</h3>
                  <ul className="space-y-2">
                    {analysisResult.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-primary-500 mt-0.5">*</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400">Vyberte článek pro SEO analýzu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
