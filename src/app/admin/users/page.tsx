'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: { articles: number };
}

const ROLES = [
  { value: 'admin', label: 'Admin', desc: 'Plný přístup' },
  { value: 'editor', label: 'Editor', desc: 'Správa obsahu' },
  { value: 'author', label: 'Autor', desc: 'Návrhy článků' },
  { value: 'viewer', label: 'Viewer', desc: 'Pouze statistiky' },
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'author' });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error('Nepodařilo se načíst uživatele');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error('Vyplňte všechna povinná pole');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Chyba');
      }
      toast.success('Uživatel vytvořen');
      setShowForm(false);
      setNewUser({ name: '', email: '', password: '', role: 'author' });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      toast.success('Role aktualizována');
      fetchUsers();
    } catch {
      toast.error('Nepodařilo se změnit roli');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Opravdu chcete smazat tohoto uživatele?')) return;
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      toast.success('Uživatel smazán');
      fetchUsers();
    } catch {
      toast.error('Nepodařilo se smazat uživatele');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Správa uživatelů</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + Nový uživatel
        </button>
      </div>

      {/* Role Reference */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {ROLES.map((role) => (
          <div key={role.value} className="bg-white rounded-lg border border-gray-100 p-3">
            <p className="text-sm font-semibold text-gray-900">{role.label}</p>
            <p className="text-xs text-gray-500">{role.desc}</p>
          </div>
        ))}
      </div>

      {/* New User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Nový uživatel</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                placeholder="Jméno *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                placeholder="Heslo *"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} - {r.desc}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600">
                Zrušit
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
              >
                Vytvořit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Uživatel</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Role</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Články</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Registrace</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Akce</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Načítání...</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user.name[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className="text-sm px-2 py-1 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{user._count.articles}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('cs-CZ')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-xs px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                      Smazat
                    </button>
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
