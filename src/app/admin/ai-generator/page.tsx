'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { WritingStyle, AIGenerationOutput } from '@/types';

export default function AIGeneratorPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    topic: '',
    keyword: '',
    affiliateLinks: '',
    writingStyle: 'blog' as WritingStyle,
    articleLength: 'medium' as 'short' | 'medium' | 'long',
    language: 'cs',
    targetAudience: '',
    customNotes: '',
  });

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<AIGenerationOutput | null>(null);
  const [creatingArticle, setCreatingArticle] = useState(false);

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      toast.error('Zadejte téma článku');
      return;
    }
    if (!formData.keyword.trim()) {
      toast.error('Zadejte klíčové slovo');
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          affiliateLinks: formData.affiliateLinks
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'AI generace selhala');
      }

      const data = await res.json();
      setResult(data);
      toast.success('Článek vygenerován');
    } catch (err: any) {
      toast.error(err.message || 'Nepodařilo se vygenerovat článek');
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateArticle = async () => {
    if (!result) return;
    setCreatingArticle(true);

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result.title,
          content: result.content,
          excerpt: result.excerpt,
          metaTitle: result.metaTitle,
          metaDescription: result.metaDescription,
          tags: result.tags,
          faqItems: result.faqItems,
          status: 'draft',
          aiGenerated: true,
          aiPrompt: formData.topic,
          writingStyle: formData.writingStyle,
          targetAudience: formData.targetAudience,
        }),
      });

      if (!res.ok) throw new Error('Nepodařilo se vytvořit článek');

      const article = await res.json();
      toast.success('Článek vytvořen jako koncept');
      router.push(`/admin/articles/${article.id}/edit`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreatingArticle(false);
    }
  };

  const writingStyles: { value: WritingStyle; label: string; desc: string }[] = [
    { value: 'formal', label: 'Formální', desc: 'Profesionální a věcný tón' },
    { value: 'blog', label: 'Blogový', desc: 'Přátelský a přístupný styl' },
    { value: 'review', label: 'Recenze', desc: 'Detailní hodnocení produktů' },
    { value: 'expert', label: 'Expertní', desc: 'Hloubková analýza tématu' },
    { value: 'casual', label: 'Neformální', desc: 'Konverzační a uvolněný' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">AI Generátor článků</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vstupní parametry</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téma článku *
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) => setFormData((p) => ({ ...p, topic: e.target.value }))}
                  placeholder="např. Nejlepší notebooky pro práci z domova 2025"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Klíčové slovo *
                </label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) => setFormData((p) => ({ ...p, keyword: e.target.value }))}
                  placeholder="např. nejlepší notebooky pro práci"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Styl psaní
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {writingStyles.map((style) => (
                    <label
                      key={style.value}
                      className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.writingStyle === style.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="writingStyle"
                        value={style.value}
                        checked={formData.writingStyle === style.value}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, writingStyle: e.target.value as WritingStyle }))
                        }
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{style.label}</p>
                        <p className="text-xs text-gray-500">{style.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Délka článku
                  </label>
                  <select
                    value={formData.articleLength}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, articleLength: e.target.value as any }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="short">Krátký (800-1200 slov)</option>
                    <option value="medium">Střední (1500-2500 slov)</option>
                    <option value="long">Dlouhý (3000-5000 slov)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jazyk
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData((p) => ({ ...p, language: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="cs">Čeština</option>
                    <option value="sk">Slovenština</option>
                    <option value="en">Angličtina</option>
                    <option value="de">Němčina</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cílová skupina
                </label>
                <input
                  type="text"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData((p) => ({ ...p, targetAudience: e.target.value }))}
                  placeholder="např. IT profesionálové, studenti, začátečníci"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Affiliate odkazy (jeden na řádek)
                </label>
                <textarea
                  value={formData.affiliateLinks}
                  onChange={(e) => setFormData((p) => ({ ...p, affiliateLinks: e.target.value }))}
                  placeholder={"https://partner1.com/product?ref=123\nhttps://partner2.com/deal?aff=456"}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vlastní poznámky
                </label>
                <textarea
                  value={formData.customNotes}
                  onChange={(e) => setFormData((p) => ({ ...p, customNotes: e.target.value }))}
                  placeholder="Další pokyny pro AI..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    AI generuje článek...
                  </span>
                ) : (
                  'Generovat článek'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Result Preview */}
        <div className="space-y-6">
          {result ? (
            <>
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Vygenerovaný článek</h2>
                  <button
                    onClick={handleCreateArticle}
                    disabled={creatingArticle}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {creatingArticle ? 'Vytvářím...' : 'Vytvořit článek'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase mb-1">Titulek</p>
                    <p className="text-xl font-bold text-gray-900">{result.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1">Meta Title</p>
                      <p className="text-sm text-gray-700">{result.metaTitle}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase mb-1">Meta Description</p>
                      <p className="text-sm text-gray-700">{result.metaDescription}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase mb-1">Úryvek</p>
                    <p className="text-sm text-gray-700">{result.excerpt}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase mb-1">Kategorie</p>
                    <p className="text-sm text-gray-700">{result.category}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase mb-1">Tagy</p>
                    <div className="flex flex-wrap gap-1">
                      {result.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-400 uppercase mb-1">CTA</p>
                    <p className="text-sm text-gray-700">{result.ctaText}</p>
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Náhled obsahu</h3>
                <div
                  className="prose-article text-sm max-h-[500px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: result.content }}
                />
              </div>

              {/* FAQ */}
              {result.faqItems?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">FAQ</h3>
                  <div className="space-y-2">
                    {result.faqItems.map((faq, i) => (
                      <div key={i} className="border border-gray-100 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900">{faq.question}</p>
                        <p className="text-sm text-gray-600 mt-1">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4 text-gray-200">AI</div>
              <h3 className="text-lg font-semibold text-gray-400 mb-2">Výstup AI generátoru</h3>
              <p className="text-sm text-gray-400">
                Vyplňte parametry vlevo a klikněte na &quot;Generovat článek&quot; pro vytvoření obsahu pomocí AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
