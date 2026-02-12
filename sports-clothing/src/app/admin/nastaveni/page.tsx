"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAdmin } from "../AdminContext";

interface ClubSettings {
  id: string;
  name: string;
  slug: string;
  ordersOpen: boolean;
  contactEmail: string;
  contactPhone: string | null;
  ico: string | null;
  address: string | null;
  invoiceNote: string | null;
  memberships?: MembershipEntry[];
}

interface MembershipEntry {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminNastaveniPage() {
  const { selectedClub, refreshUser } = useAdmin();
  const [settings, setSettings] = useState<ClubSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formOrdersOpen, setFormOrdersOpen] = useState(true);
  const [formContactEmail, setFormContactEmail] = useState("");
  const [formContactPhone, setFormContactPhone] = useState("");
  const [formIco, setFormIco] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formInvoiceNote, setFormInvoiceNote] = useState("");

  // Invite
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  async function fetchSettings() {
    if (!selectedClub) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${selectedClub.slug}/settings`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const s = data.settings ?? data;
        setSettings(s);
        setFormName(s.name ?? "");
        setFormOrdersOpen(s.ordersOpen ?? true);
        setFormContactEmail(s.contactEmail ?? "");
        setFormContactPhone(s.contactPhone ?? "");
        setFormIco(s.ico ?? "");
        setFormAddress(s.address ?? "");
        setFormInvoiceNote(s.invoiceNote ?? "");
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClub]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedClub) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/clubs/${selectedClub.slug}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formName.trim(),
          ordersOpen: formOrdersOpen,
          contactEmail: formContactEmail.trim(),
          contactPhone: formContactPhone.trim() || null,
          ico: formIco.trim() || null,
          address: formAddress.trim() || null,
          invoiceNote: formInvoiceNote.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Chyba pri ukladani");
        setSaving(false);
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      refreshUser();
      fetchSettings();
    } catch {
      setSaveError("Chyba pripojeni");
    } finally {
      setSaving(false);
    }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (!selectedClub || !inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    setInviteSuccess(false);

    try {
      const res = await fetch(`/api/clubs/${selectedClub.slug}/settings/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setInviteError(data.error || "Chyba pri pozvanke");
        setInviting(false);
        return;
      }

      setInviteSuccess(true);
      setInviteEmail("");
      setTimeout(() => setInviteSuccess(false), 3000);
      fetchSettings();
    } catch {
      setInviteError("Chyba pripojeni");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemoveMember(membershipId: string) {
    if (!selectedClub) return;
    try {
      await fetch(`/api/clubs/${selectedClub.slug}/settings/members/${membershipId}`, {
        method: "DELETE",
        credentials: "include",
      });
      fetchSettings();
    } catch {
      // silently fail
    }
  }

  if (!selectedClub) {
    return (
      <div className="text-center py-12 text-slate-500">
        Neni zvolen zadny klub.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Nastaveni klubu</h1>

      {/* Settings form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        {saveError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            Nastaveni bylo uspesne ulozeno.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nazev klubu
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formOrdersOpen}
                onChange={(e) => setFormOrdersOpen(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
            <div>
              <span className="text-sm font-medium text-slate-700">
                Objednavky otevreny
              </span>
              <p className="text-xs text-slate-500">
                Pokud je vypnuto, rodice nemohou zadavat nove objednavky
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kontaktni e-mail
              </label>
              <input
                type="email"
                value={formContactEmail}
                onChange={(e) => setFormContactEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kontaktni telefon
              </label>
              <input
                type="text"
                value={formContactPhone}
                onChange={(e) => setFormContactPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ICO
              </label>
              <input
                type="text"
                value={formIco}
                onChange={(e) => setFormIco(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Adresa
              </label>
              <input
                type="text"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Poznamka na fakturu
            </label>
            <textarea
              value={formInvoiceNote}
              onChange={(e) => setFormInvoiceNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
          >
            {saving ? "Ukladam..." : "Ulozit nastaveni"}
          </button>
        </form>
      </div>

      {/* Members management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Sprava uzivatelu</h2>

        {/* Existing members */}
        {settings?.memberships && settings.memberships.length > 0 && (
          <div className="mb-6">
            <div className="space-y-2">
              {settings.memberships.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {m.user.name}
                    </div>
                    <div className="text-xs text-slate-500">{m.user.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                      {m.role}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                      title="Odebrat"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite form */}
        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-medium text-slate-700 mb-3">
            Pozvat noveho uzivatele
          </h3>

          {inviteError && (
            <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {inviteError}
            </div>
          )}
          {inviteSuccess && (
            <div className="mb-3 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              Pozvanka byla odeslana.
            </div>
          )}

          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@priklad.cz"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 text-sm"
            />
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {inviting ? "Odesilam..." : "Pozvat"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
