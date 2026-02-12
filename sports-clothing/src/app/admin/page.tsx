"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./AdminContext";

interface SummaryRow {
  productId: string;
  productName: string;
  size: string;
  totalQuantity: number;
}

interface OrderStats {
  total: number;
  ordered: number;
  paid: number;
  issued: number;
  cancelled: number;
}

export default function AdminDashboardPage() {
  const { selectedClub } = useAdmin();
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    ordered: 0,
    paid: 0,
    issued: 0,
    cancelled: 0,
  });
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedClub) return;

    async function fetchData() {
      setLoading(true);
      try {
        const [ordersRes, summaryRes] = await Promise.all([
          fetch(`/api/clubs/${selectedClub!.id}/orders?limit=1000`, {
            credentials: "include",
          }),
          fetch(`/api/clubs/${selectedClub!.id}/orders/summary`, {
            credentials: "include",
          }),
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const orders = ordersData.orders ?? ordersData ?? [];
          const arr = Array.isArray(orders) ? orders : [];
          setStats({
            total: arr.length,
            ordered: arr.filter((o: { status: string }) => o.status === "ORDERED").length,
            paid: arr.filter((o: { status: string }) => o.status === "PAID").length,
            issued: arr.filter((o: { status: string }) => o.status === "ISSUED").length,
            cancelled: arr.filter((o: { status: string }) => o.status === "CANCELLED").length,
          });
        }

        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          setSummary(summaryData.summary ?? summaryData ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedClub]);

  if (!selectedClub) {
    return (
      <div className="text-center py-12 text-slate-500">
        Neni zvolen zadny klub. Vyberte klub v bocnim panelu.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg
          className="animate-spin h-8 w-8 text-indigo-600"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // Build product-size matrix from summary
  const productNames = [...new Set(summary.map((r) => r.productName))];
  const allSizes = [...new Set(summary.map((r) => r.size))];
  // Sort sizes logically
  const sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];
  allSizes.sort((a, b) => {
    const ia = sizeOrder.indexOf(a);
    const ib = sizeOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const statCards = [
    {
      label: "Celkem objednavek",
      value: stats.total,
      color: "bg-slate-100 text-slate-700",
      iconBg: "bg-slate-200",
    },
    {
      label: "Objednano",
      value: stats.ordered,
      color: "bg-blue-50 text-blue-700",
      iconBg: "bg-blue-200",
    },
    {
      label: "Zaplaceno",
      value: stats.paid,
      color: "bg-green-50 text-green-700",
      iconBg: "bg-green-200",
    },
    {
      label: "K vydani",
      value: stats.paid,
      color: "bg-purple-50 text-purple-700",
      iconBg: "bg-purple-200",
    },
    {
      label: "Storno",
      value: stats.cancelled,
      color: "bg-red-50 text-red-700",
      iconBg: "bg-red-200",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Prehled</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl p-4 ${card.color}`}
          >
            <div className="text-sm font-medium opacity-80">{card.label}</div>
            <div className="text-3xl font-bold mt-1">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Summary table */}
      {summary.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">
              Souhrn produktu a velikosti
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">
                    Produkt
                  </th>
                  {allSizes.map((size) => (
                    <th
                      key={size}
                      className="text-center px-3 py-3 font-semibold text-slate-700"
                    >
                      {size}
                    </th>
                  ))}
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">
                    Celkem
                  </th>
                </tr>
              </thead>
              <tbody>
                {productNames.map((product, idx) => {
                  const productRows = summary.filter(
                    (r) => r.productName === product
                  );
                  const rowTotal = productRows.reduce(
                    (sum, r) => sum + r.totalQuantity,
                    0
                  );
                  return (
                    <tr
                      key={product}
                      className={`border-b border-slate-100 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      } hover:bg-indigo-50/50 transition-colors`}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {product}
                      </td>
                      {allSizes.map((size) => {
                        const row = productRows.find((r) => r.size === size);
                        return (
                          <td
                            key={size}
                            className="text-center px-3 py-3 text-slate-600"
                          >
                            {row ? row.totalQuantity : 0}
                          </td>
                        );
                      })}
                      <td className="text-center px-4 py-3 font-bold text-slate-900">
                        {rowTotal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300">
                  <td className="px-4 py-3 font-bold text-slate-900">Celkem</td>
                  {allSizes.map((size) => {
                    const sizeTotal = summary
                      .filter((r) => r.size === size)
                      .reduce((sum, r) => sum + r.totalQuantity, 0);
                    return (
                      <td
                        key={size}
                        className="text-center px-3 py-3 font-bold text-slate-900"
                      >
                        {sizeTotal}
                      </td>
                    );
                  })}
                  <td className="text-center px-4 py-3 font-bold text-indigo-600">
                    {summary.reduce((sum, r) => sum + r.totalQuantity, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
