'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { ArticleStatus } from '@/types';
import { STATUS_LABELS } from '@/types';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface ArticleData {
  id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: ArticleStatus;
  categoryId: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  featuredImage: string;
  publishAt: string;
  tags: string[];
  faqItems: FAQItem[];
}

interface ArticleEditorProps {
  article?: Partial<ArticleData> & { id?: string };
  categories: Category[];
  allTags: Tag[];
}

export default function ArticleEditor({ article, categories, allTags }: ArticleEditorProps) {
  const router = useRouter();
  const isEditing = !!article?.id;

  const [data, setData] = useState<ArticleData>({
    title: article?.title || '',
    slug: article?.slug || '',
    content: article?.content || '',
    excerpt: article?.excerpt || '',
    status: (article?.status as ArticleStatus) || 'draft',
    categoryId: article?.categoryId || '',
    metaTitle: article?.metaTitle || '',
    metaDescription: article?.metaDescription || '',
    canonicalUrl: article?.canonicalUrl || '',
    featuredImage: article?.featuredImage || '',
    publishAt: article?.publishAt || '',
    tags: article?.tags || [],
    faqItems: article?.faqItems || [],
  });

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'html' | 'preview'>('editor');
  const [tagInput, setTagInput] = useState('');

  const updateField = useCallback(<K extends keyof ArticleData>(
    field: K,
    value: ArticleData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const generateSlug = useCallback(() => {
    const slug = data.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    updateField('slug', slug);
  }, [data.title, updateField]);

  const addFaqItem = () => {
    updateField('faqItems', [...data.faqItems, { question: '', answer: '' }]);
  };

  const removeFaqItem = (index: number) => {
    updateField('faqItems', data.faqItems.filter((_, i) => i !== index));
  };

  const updateFaqItem = (index: number, field: 'question' | 'answer', value: string) => {
    const updated = [...data.faqItems];
    updated[index] = { ...updated[index], [field]: value };
    updateField('faqItems', updated);
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !data.tags.includes(trimmed)) {
      updateField('tags', [...data.tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateField('tags', data.tags.filter((t) => t !== tag));
  };

  const handleSave = async (newStatus?: ArticleStatus) => {
    if (!data.title.trim()) {
      toast.error('Titulek je povinný');
      return;
    }

    setSaving(true);
    const payload = {
      ...data,
      status: newStatus || data.status,
      publishAt: data.publishAt || null,
    };

    try {
      const url = isEditing ? `/api/articles/${article!.id}` : '/api/articles';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chyba při ukládání');
      }

      const result = await res.json();
      toast.success(isEditing ? 'Článek aktualizován' : 'Článek vytvořen');

      if (!isEditing) {
        router.push(`/admin/articles/${result.id}/edit`);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'Nepodařilo se uložit článek');
    } finally {
      setSaving(false);
    }
  };

  const statuses: ArticleStatus[] = ['draft', 'in_progress', 'ready', 'scheduled', 'published'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-6">
        {/* Title */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <input
            type="text"
            value={data.title}
            onChange={(e) => updateField('title', e.target.value)}
            onBlur={() => !data.slug && generateSlug()}
            placeholder="Titulek článku"
            className="w-full text-2xl font-bold outline-none text-gray-900 placeholder-gray-300"
          />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-400">/articles/</span>
            <input
              type="text"
              value={data.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              placeholder="url-slug"
              className="text-sm text-gray-600 outline-none flex-1"
            />
            <button
              onClick={generateSlug}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              Generovat
            </button>
          </div>
        </div>

        {/* Content Editor */}
        <div className="bg-white rounded-xl border border-gray-100">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['editor', 'html', 'preview'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'editor' ? 'WYSIWYG' : tab === 'html' ? 'HTML' : 'Náhled'}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'editor' && (
              <div>
                {/* Simple toolbar */}
                <div className="flex flex-wrap gap-1 mb-3 pb-3 border-b border-gray-100">
                  {[
                    { label: 'B', cmd: 'bold' },
                    { label: 'I', cmd: 'italic' },
                    { label: 'H2', cmd: 'h2' },
                    { label: 'H3', cmd: 'h3' },
                    { label: 'UL', cmd: 'ul' },
                    { label: 'OL', cmd: 'ol' },
                    { label: 'Link', cmd: 'link' },
                    { label: 'Img', cmd: 'image' },
                  ].map((btn) => (
                    <button
                      key={btn.cmd}
                      className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 transition-colors font-medium"
                      onClick={() => {
                        let insertion = '';
                        switch (btn.cmd) {
                          case 'bold': insertion = '<strong>text</strong>'; break;
                          case 'italic': insertion = '<em>text</em>'; break;
                          case 'h2': insertion = '<h2>Nadpis</h2>'; break;
                          case 'h3': insertion = '<h3>Podnadpis</h3>'; break;
                          case 'ul': insertion = '<ul>\n  <li>Položka</li>\n</ul>'; break;
                          case 'ol': insertion = '<ol>\n  <li>Položka</li>\n</ol>'; break;
                          case 'link': insertion = '<a href="url">text odkazu</a>'; break;
                          case 'image': insertion = '<img src="url" alt="popis" />'; break;
                        }
                        updateField('content', data.content + insertion);
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={data.content}
                  onChange={(e) => updateField('content', e.target.value)}
                  placeholder="Začněte psát obsah článku..."
                  className="w-full min-h-[500px] outline-none text-gray-700 leading-relaxed resize-y font-mono text-sm"
                />
              </div>
            )}

            {activeTab === 'html' && (
              <textarea
                value={data.content}
                onChange={(e) => updateField('content', e.target.value)}
                className="w-full min-h-[500px] outline-none text-gray-700 font-mono text-sm resize-y"
                spellCheck={false}
              />
            )}

            {activeTab === 'preview' && (
              <div
                className="prose-article min-h-[500px]"
                dangerouslySetInnerHTML={{ __html: data.content || '<p class="text-gray-400">Žádný obsah k zobrazení</p>' }}
              />
            )}
          </div>
        </div>

        {/* Excerpt */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Úryvek</label>
          <textarea
            value={data.excerpt}
            onChange={(e) => updateField('excerpt', e.target.value)}
            placeholder="Krátký úryvek článku pro náhledy..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-y"
          />
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-semibold text-gray-700">FAQ (Často kladené otázky)</label>
            <button
              onClick={addFaqItem}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Přidat otázku
            </button>
          </div>
          {data.faqItems.map((faq, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 mb-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => updateFaqItem(i, 'question', e.target.value)}
                  placeholder="Otázka"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium"
                />
                <button
                  onClick={() => removeFaqItem(i)}
                  className="text-red-500 hover:text-red-600 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <textarea
                value={faq.answer}
                onChange={(e) => updateFaqItem(i, 'answer', e.target.value)}
                placeholder="Odpověď"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-y"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Publish Box */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Publikace</h3>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Stav</label>
              <select
                value={data.status}
                onChange={(e) => updateField('status', e.target.value as ArticleStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Datum publikace
              </label>
              <input
                type="datetime-local"
                value={data.publishAt}
                onChange={(e) => updateField('publishAt', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {saving ? 'Ukládání...' : 'Uložit'}
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              Publikovat
            </button>
          </div>
        </div>

        {/* Category */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Kategorie</h3>
          <select
            value={data.categoryId}
            onChange={(e) => updateField('categoryId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Bez kategorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Tagy</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Přidat tag..."
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              list="tag-suggestions"
            />
            <button
              onClick={addTag}
              className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
            >
              +
            </button>
          </div>
          <datalist id="tag-suggestions">
            {allTags.map((t) => (
              <option key={t.id} value={t.name} />
            ))}
          </datalist>
          <div className="flex flex-wrap gap-1.5">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs"
              >
                #{tag}
                <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-500">
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Featured Image */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Hlavní obrázek</h3>
          <input
            type="text"
            value={data.featuredImage}
            onChange={(e) => updateField('featuredImage', e.target.value)}
            placeholder="URL obrázku nebo cesta k souboru"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
          {data.featuredImage && (
            <div className="mt-2 rounded-lg overflow-hidden">
              <img src={data.featuredImage} alt="Náhled" className="w-full h-auto" />
            </div>
          )}
        </div>

        {/* SEO */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">SEO</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Meta Title ({data.metaTitle.length}/60)
              </label>
              <input
                type="text"
                value={data.metaTitle}
                onChange={(e) => updateField('metaTitle', e.target.value)}
                placeholder="SEO titulek"
                maxLength={70}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Meta Description ({data.metaDescription.length}/155)
              </label>
              <textarea
                value={data.metaDescription}
                onChange={(e) => updateField('metaDescription', e.target.value)}
                placeholder="SEO popis"
                maxLength={160}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Canonical URL</label>
              <input
                type="text"
                value={data.canonicalUrl}
                onChange={(e) => updateField('canonicalUrl', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* SEO Preview */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Náhled ve vyhledávači:</p>
            <p className="text-blue-700 text-sm font-medium truncate">
              {data.metaTitle || data.title || 'Titulek článku'}
            </p>
            <p className="text-green-700 text-xs truncate">
              example.com/articles/{data.slug || 'url-slug'}
            </p>
            <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">
              {data.metaDescription || data.excerpt || 'Popis článku...'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
