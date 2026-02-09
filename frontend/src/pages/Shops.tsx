import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { shopsApi } from '../services/api';
import type { User, Shop } from '../types';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

interface Props {
  user: User;
}

export default function Shops({ user }: Props) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', domain: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      const response = await shopsApi.getAll();
      setShops(response.data);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await shopsApi.create(formData);
      setFormData({ name: '', domain: '', description: '' });
      setShowForm(false);
      loadShops();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Chyba při vytváření shopu');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Opravdu chcete smazat tento e-shop?')) return;

    try {
      await shopsApi.delete(id);
      loadShops();
    } catch (error) {
      console.error('Error deleting shop:', error);
    }
  };

  if (loading) {
    return (
      <Layout user={user}>
        <div className="text-center py-12">Načítání...</div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">E-shopy</h1>
            <p className="mt-2 text-gray-600">Správa vašich e-shopů</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Přidat e-shop
          </button>
        </div>

        {showForm && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Nový e-shop</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Název</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Doména (URL)</label>
                <input
                  type="url"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  required
                  placeholder="https://example.com"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Popis (volitelné)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              {error && <div className="text-red-600 text-sm">{error}</div>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Uložit
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Zrušit
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {shops.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Zatím nemáte žádný e-shop. Přidejte svůj první e-shop kliknutím na tlačítko výše.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {shops.map((shop) => (
                <li key={shop.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{shop.name}</h3>
                      <a
                        href={shop.domain}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center mt-1"
                      >
                        {shop.domain}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                      {shop.description && (
                        <p className="text-sm text-gray-600 mt-2">{shop.description}</p>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        Monitorů: {shop.monitors?.length || 0}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(shop.id)}
                      className="ml-4 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
