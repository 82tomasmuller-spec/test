'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface AffiliatePartner {
  id: string;
  name: string;
  website: string | null;
  commission: string | null;
  isActive: boolean;
  links: AffiliateLink[];
}

interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  shortCode: string;
  isActive: boolean;
  clicks: number;
  conversions: number;
  revenue: number;
}

export default function AffiliatesPage() {
  const [partners, setPartners] = useState<AffiliatePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState<string | null>(null);
  const [newPartner, setNewPartner] = useState({ name: '', website: '', commission: '', notes: '' });
  const [newLink, setNewLink] = useState({ name: '', url: '', shortCode: '' });

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliates');
      const data = await res.json();
      setPartners(data);
    } catch {
      toast.error('Nepodařilo se načíst partnery');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleCreatePartner = async () => {
    if (!newPartner.name.trim()) {
      toast.error('Zadejte název partnera');
      return;
    }

    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner),
      });
      if (!res.ok) throw new Error('Chyba při vytváření');
      toast.success('Partner vytvořen');
      setShowPartnerForm(false);
      setNewPartner({ name: '', website: '', commission: '', notes: '' });
      fetchPartners();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCreateLink = async (partnerId: string) => {
    if (!newLink.name.trim() || !newLink.url.trim()) {
      toast.error('Vyplňte název a URL');
      return;
    }

    try {
      const res = await fetch(`/api/affiliates/${partnerId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink),
      });
      if (!res.ok) throw new Error('Chyba při vytváření odkazu');
      toast.success('Odkaz vytvořen');
      setShowLinkForm(null);
      setNewLink({ name: '', url: '', shortCode: '' });
      fetchPartners();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm('Smazat partnera a všechny jeho odkazy?')) return;
    try {
      await fetch(`/api/affiliates/${id}`, { method: 'DELETE' });
      toast.success('Partner smazán');
      fetchPartners();
    } catch {
      toast.error('Nepodařilo se smazat');
    }
  };

  const totalClicks = partners.reduce(
    (sum, p) => sum + p.links.reduce((s, l) => s + l.clicks, 0),
    0
  );
  const totalConversions = partners.reduce(
    (sum, p) => sum + p.links.reduce((s, l) => s + l.conversions, 0),
    0
  );
  const totalRevenue = partners.reduce(
    (sum, p) => sum + p.links.reduce((s, l) => s + l.revenue, 0),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Affiliate Management</h1>
        <button
          onClick={() => setShowPartnerForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + Nový partner
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Celkem kliků</p>
          <p className="text-2xl font-bold text-gray-900">{totalClicks}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Konverze</p>
          <p className="text-2xl font-bold text-gray-900">{totalConversions}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Příjmy</p>
          <p className="text-2xl font-bold text-gray-900">{totalRevenue.toFixed(2)} Kč</p>
        </div>
      </div>

      {/* New Partner Modal */}
      {showPartnerForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Nový affiliate partner</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newPartner.name}
                onChange={(e) => setNewPartner((p) => ({ ...p, name: e.target.value }))}
                placeholder="Název partnera *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="url"
                value={newPartner.website}
                onChange={(e) => setNewPartner((p) => ({ ...p, website: e.target.value }))}
                placeholder="Web partnera"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                value={newPartner.commission}
                onChange={(e) => setNewPartner((p) => ({ ...p, commission: e.target.value }))}
                placeholder="Provize (např. 10%)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              />
              <textarea
                value={newPartner.notes}
                onChange={(e) => setNewPartner((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Poznámky"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 resize-y"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowPartnerForm(false)} className="px-4 py-2 text-gray-600">
                Zrušit
              </button>
              <button
                onClick={handleCreatePartner}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
              >
                Vytvořit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Partners List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Načítání...</div>
      ) : partners.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Zatím nemáte žádné affiliate partnery.
        </div>
      ) : (
        <div className="space-y-4">
          {partners.map((partner) => (
            <div key={partner.id} className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{partner.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {partner.website && <span>{partner.website}</span>}
                    {partner.commission && <span>Provize: {partner.commission}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLinkForm(partner.id)}
                    className="text-sm px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    + Odkaz
                  </button>
                  <button
                    onClick={() => handleDeletePartner(partner.id)}
                    className="text-sm px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    Smazat
                  </button>
                </div>
              </div>

              {/* New Link Form */}
              {showLinkForm === partner.id && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newLink.name}
                      onChange={(e) => setNewLink((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Název odkazu *"
                      className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    <input
                      type="url"
                      value={newLink.url}
                      onChange={(e) => setNewLink((p) => ({ ...p, url: e.target.value }))}
                      placeholder="URL odkazu *"
                      className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newLink.shortCode}
                        onChange={(e) => setNewLink((p) => ({ ...p, shortCode: e.target.value }))}
                        placeholder="Krátký kód"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      />
                      <button
                        onClick={() => handleCreateLink(partner.id)}
                        className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700"
                      >
                        Přidat
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Links Table */}
              {partner.links.length > 0 && (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-500 font-medium">Odkaz</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Kód</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Kliky</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Konverze</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Příjmy</th>
                      <th className="text-right py-2 text-gray-500 font-medium">Stav</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partner.links.map((link) => (
                      <tr key={link.id} className="border-b border-gray-50">
                        <td className="py-2">
                          <p className="font-medium text-gray-900">{link.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{link.url}</p>
                        </td>
                        <td className="py-2 text-gray-600 font-mono text-xs">{link.shortCode}</td>
                        <td className="py-2 text-right text-gray-900">{link.clicks}</td>
                        <td className="py-2 text-right text-gray-900">{link.conversions}</td>
                        <td className="py-2 text-right text-gray-900">{link.revenue.toFixed(2)} Kč</td>
                        <td className="py-2 text-right">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              link.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {link.isActive ? 'Aktivní' : 'Neaktivní'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
