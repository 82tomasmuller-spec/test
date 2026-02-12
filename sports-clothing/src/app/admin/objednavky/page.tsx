"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "../AdminContext";

interface Order {
  id: string;
  orderNumber: string;
  parentName: string;
  parentEmail: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  category?: {
    id: string;
    name: string;
  };
  categoryId: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "Vse" },
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

export default function AdminObjednavkyPage() {
  const { selectedClub } = useAdmin();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!selectedClub) return;

    async function fetchOrders() {
      setLoading(true);
      try {
        const res = await fetch(`/api/clubs/${selectedClub!.id}/orders?limit=1000`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders ?? data ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [selectedClub]);

  const filteredOrders = statusFilter
    ? orders.filter((o) => o.status === statusFilter)
    : orders;

  if (!selectedClub) {
    return (
      <div className="text-center py-12 text-slate-500">
        Neni zvolen zadny klub.
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Objednavky</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Filtr:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500">
            {statusFilter ? "Zadne objednavky s timto statusem." : "Zatim nemame zadne objednavky."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Cislo</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Rodic</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Kategorie</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Castka</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">Stav</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Datum</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/admin/objednavky/${order.id}`)}
                    className={`border-b border-slate-100 cursor-pointer ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    } hover:bg-indigo-50/50 transition-colors`}
                  >
                    <td className="px-4 py-3 font-medium text-indigo-600">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      <div>{order.parentName}</div>
                      <div className="text-xs text-slate-500">{order.parentEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {order.category?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {order.totalAmount} Kc
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString("cs-CZ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-500">
            Celkem: {filteredOrders.length} objednavek
          </div>
        </div>
      )}
    </div>
  );
}
