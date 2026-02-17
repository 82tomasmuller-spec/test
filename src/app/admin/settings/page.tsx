'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  sortOrder: number;
}

interface SettingItem {
  key: string;
  value: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCatForm, setShowCatForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '', description: '', color: '#3b82f6' });

  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, categoriesRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/categories'),
      ]);
      const settingsData = await settingsRes.json();
      const categoriesData = await categoriesRes.json();

      const settingsMap: Record<string, string> = {};
      settingsData.forEach((s: SettingItem) => { settingsMap[s.key] = s.value; });
      setSettings(settingsMap);
      setCategories(categoriesData);
    } catch {
      toast.error('Nepodařilo se načíst nastavení');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveSettings = async () => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      toast.success('Nastavení uloženo');
    } catch {
      toast.error('Nepodařilo se uložit');
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Zadejte název kategorie');
      return;
    }

    const slug = newCategory.slug || newCategory.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newCategory, slug }),
      });
      if (!res.ok) throw new Error('Chyba');
      toast.success('Kategorie vytvořena');
      setShowCatForm(false);
      setNewCategory({ name: '', slug: '', description: '', color: '#3b82f6' });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Smazat kategorii?')) return;
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      toast.success('Kategorie smazána');
      fetchData();
    } catch {
      toast.error('Nepodařilo se smazat');
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Načítání...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nastavení</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Obecné nastavení</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Název webu</label>
              <input
                type="text"
                value={settings.site_name || ''}
                onChange={(e) => setSettings((p) => ({ ...p, site_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Popis webu</label>
              <textarea
                value={settings.site_description || ''}
                onChange={(e) => setSettings((p) => ({ ...p, site_description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Článků na stránku</label>
              <input
                type="number"
                value={settings.posts_per_page || '12'}
                onChange={(e) => setSettings((p) => ({ ...p, posts_per_page: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Výchozí jazyk</label>
              <select
                value={settings.default_language || 'cs'}
                onChange={(e) => setSettings((p) => ({ ...p, default_language: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="cs">Čeština</option>
                <option value="sk">Slovenština</option>
                <option value="en">Angličtina</option>
                <option value="de">Němčina</option>
              </select>
            </div>
            <button
              onClick={handleSaveSettings}
              className="w-full py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Uložit nastavení
            </button>
          </div>
        </div>

        {/* Categories Management */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Kategorie</h2>
            <button
              onClick={() => setShowCatForm(!showCatForm)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              + Přidat
            </button>
          </div>

          {showCatForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
                placeholder="Název kategorie *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="URL slug (auto)"
                  className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory((p) => ({ ...p, color: e.target.value }))}
                  className="h-10 w-full rounded-lg border border-gray-300 cursor-pointer"
                />
              </div>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))}
                placeholder="Popis"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-y"
              />
              <button
                onClick={handleCreateCategory}
                className="w-full py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                Vytvořit kategorii
              </button>
            </div>
          )}

          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-400">/{cat.slug}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  Smazat
                </button>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">Žádné kategorie</p>
            )}
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI nastavení</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
              <select
                value={settings.ai_provider || 'openai'}
                onChange={(e) => setSettings((p) => ({ ...p, ai_provider: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="openai">OpenAI (GPT-4)</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>
            <p className="text-xs text-gray-400">
              API klíče se konfigurují v .env souboru na serveru (OPENAI_API_KEY / ANTHROPIC_API_KEY).
            </p>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO nastavení</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Robots.txt</label>
              <textarea
                value={settings.robots_txt || 'User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: /sitemap.xml'}
                onChange={(e) => setSettings((p) => ({ ...p, robots_txt: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
              <input
                type="text"
                value={settings.google_analytics_id || ''}
                onChange={(e) => setSettings((p) => ({ ...p, google_analytics_id: e.target.value }))}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              className="w-full py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Uložit nastavení
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
