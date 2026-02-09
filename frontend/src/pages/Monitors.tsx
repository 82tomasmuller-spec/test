import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { monitorsApi, shopsApi } from '../services/api';
import type { User, Monitor, Shop } from '../types';
import { Plus, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface Props {
  user: User;
}

export default function Monitors({ user }: Props) {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ shopId: '', url: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [monitorsRes, shopsRes] = await Promise.all([
        monitorsApi.getAll(),
        shopsApi.getAll(),
      ]);
      setMonitors(monitorsRes.data);
      setShops(shopsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await monitorsApi.create({ shopId: parseInt(formData.shopId), url: formData.url });
      setFormData({ shopId: '', url: '' });
      setShowForm(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Chyba při vytváření monitoru');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Opravdu chcete smazat tento monitor?')) return;

    try {
      await monitorsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting monitor:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
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
            <h1 className="text-3xl font-bold text-gray-900">Monitory</h1>
            <p className="mt-2 text-gray-600">Správa URL monitorů</p>
          </div>
          {shops.length > 0 && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Přidat monitor
            </button>
          )}
        </div>

        {shops.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-700">
              Nejprve musíte přidat e-shop, než budete moci vytvořit monitor.
            </p>
            <a
              href="/shops"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Přidat e-shop
            </a>
          </div>
        )}

        {showForm && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Nový monitor</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">E-shop</label>
                <select
                  value={formData.shopId}
                  onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Vyberte e-shop</option>
                  {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                  placeholder="https://example.com"
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
          {monitors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Zatím nemáte žádný monitor. Přidejte svůj první monitor kliknutím na tlačítko výše.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {monitors.map((monitor) => (
                <li key={monitor.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start flex-1">
                      <div className="mr-4 mt-1">{getStatusIcon(monitor.status)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-medium text-gray-900">{monitor.url}</h3>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              monitor.status === 'up'
                                ? 'bg-green-100 text-green-800'
                                : monitor.status === 'down'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {monitor.status.toUpperCase()}
                          </span>
                        </div>
                        {monitor.shop && (
                          <p className="text-sm text-gray-600 mt-1">Shop: {monitor.shop.name}</p>
                        )}
                        <div className="mt-2 flex gap-4 text-xs text-gray-500">
                          {monitor.lastResponseTime && (
                            <span>Odezva: {monitor.lastResponseTime}ms</span>
                          )}
                          {monitor.lastCheck && (
                            <span>
                              Poslední kontrola: {new Date(monitor.lastCheck).toLocaleString('cs-CZ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(monitor.id)}
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
