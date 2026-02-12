"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAdmin } from "../../AdminContext";

interface OrderItem {
  id: string;
  productId: string;
  size: string;
  quantity: number;
  unitPrice: number;
  product?: {
    id: string;
    name: string;
  };
}

interface StatusLogEntry {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  changedAt: string;
  note: string | null;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  };
  items: OrderItem[];
  statusLog: StatusLogEntry[];
}

const STATUS_OPTIONS = [
  { value: "ORDERED", label: "Objednano" },
  { value: "PAID", label: "Zaplaceno" },
  { value: "ISSUED", label: "Vydano" },
  { value: "CANCELLED", label: "Stornovano" },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    ORDERED: { label: "Objednano", classes: "bg-blue-100 text-blue-700" },
    PAID: { label: "Zaplaceno", classes: "bg-green-100 text-green-700" },
    ISSUED: { label: "Vydano", classes: "bg-purple-100 text-purple-700" },
    CANCELLED: { label: "Stornovano", classes: "bg-red-100 text-red-700" },
  };
  const s = map[status] ?? { label: status, classes: "bg-slate-100 text-slate-700" };
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${s.classes}`}>
      {s.label}
    </span>
  );
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    ORDERED: "Objednano",
    PAID: "Zaplaceno",
    ISSUED: "Vydano",
    CANCELLED: "Stornovano",
  };
  return map[status] ?? status;
}

export default function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const { selectedClub } = useAdmin();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function fetchOrder() {
    if (!selectedClub) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${selectedClub.id}/orders/${orderId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const orderData = data.order ?? data;
        setOrder(orderData);
        setNewStatus(orderData.status);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClub, orderId]);

  async function handleStatusChange() {
    if (!selectedClub || !order || newStatus === order.status) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/clubs/${selectedClub.id}/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(data.error || "Chyba pri zmene stavu");
        setSaving(false);
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchOrder();
    } catch {
      setSaveError("Chyba pripojeni");
    } finally {
      setSaving(false);
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

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 mb-4">Objednavka nebyla nalezena.</p>
        <Link href="/admin/objednavky" className="text-indigo-600 hover:text-indigo-800 font-medium">
          Zpet na objednavky
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/admin/objednavky"
            className="text-sm text-indigo-600 hover:text-indigo-800 mb-1 inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zpet na objednavky
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Objednavka {order.orderNumber}
          </h1>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Order info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parent info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Udaje rodice</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Jmeno</div>
                <div className="text-slate-900 font-medium">{order.parentName}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">E-mail</div>
                <div className="text-slate-900">{order.parentEmail}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Telefon</div>
                <div className="text-slate-900">{order.parentPhone}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Kategorie</div>
                <div className="text-slate-900">{order.category?.name ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Datum objednavky</div>
                <div className="text-slate-900">
                  {new Date(order.createdAt).toLocaleString("cs-CZ")}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Celkova castka</div>
                <div className="text-xl font-bold text-slate-900">{order.totalAmount} Kc</div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Polozky objednavky</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Produkt</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-700">Velikost</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-700">Pocet</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-700">Cena/ks</th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-700">Celkem</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-100 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {item.product?.name ?? item.productId}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                          {item.size}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {item.unitPrice} Kc
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {item.quantity * item.unitPrice} Kc
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300">
                    <td colSpan={4} className="px-4 py-3 font-bold text-slate-900 text-right">
                      Celkem
                    </td>
                    <td className="px-4 py-3 font-bold text-right text-indigo-600">
                      {order.totalAmount} Kc
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Status log */}
          {order.statusLog && order.statusLog.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Historie zmen stavu</h2>
              <div className="space-y-3">
                {order.statusLog.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <div>
                      <div className="text-slate-900">
                        {log.oldStatus ? (
                          <>
                            {statusLabel(log.oldStatus)}{" "}
                            <span className="text-slate-400 mx-1">&rarr;</span>{" "}
                            {statusLabel(log.newStatus)}
                          </>
                        ) : (
                          <>Vytvoreno: {statusLabel(log.newStatus)}</>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(log.changedAt).toLocaleString("cs-CZ")}
                        {log.note && <span className="ml-2 text-slate-400">- {log.note}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Status change */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Zmena stavu</h2>

            {saveError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                Stav byl uspesne zmenen.
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Novy stav
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStatusChange}
                disabled={saving || newStatus === order.status}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
              >
                {saving ? "Ukladam..." : "Ulozit stav"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
