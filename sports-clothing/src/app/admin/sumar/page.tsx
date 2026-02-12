"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "../AdminContext";

interface SummaryRow {
  productId: string;
  productName: string;
  size: string;
  totalQuantity: number;
}

export default function AdminSumarPage() {
  const { selectedClub } = useAdmin();
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedClub) return;

    async function fetchSummary() {
      setLoading(true);
      try {
        const res = await fetch(`/api/clubs/${selectedClub!.id}/orders/summary`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setSummary(data.summary ?? data ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [selectedClub]);

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

  if (summary.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Sumar objednavek</h1>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500">Zatim zadna data k zobrazeni.</p>
        </div>
      </div>
    );
  }

  // Build product-size matrix
  const productNames = [...new Set(summary.map((r) => r.productName))];
  const allSizes = [...new Set(summary.map((r) => r.size))];

  // Sort sizes logically
  const sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "116", "128", "140", "152", "164"];
  allSizes.sort((a, b) => {
    const ia = sizeOrder.indexOf(a);
    const ib = sizeOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const grandTotal = summary.reduce((sum, r) => sum + r.totalQuantity, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sumar objednavek</h1>
          <p className="text-sm text-slate-500 mt-1">
            Prehled mnozstvi produktu a velikosti pro objednavku u dodavatele
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Tisknout
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-indigo-50 border-b-2 border-indigo-200">
                <th className="text-left px-4 py-3 font-bold text-indigo-900 min-w-[200px]">
                  Produkt
                </th>
                {allSizes.map((size) => (
                  <th
                    key={size}
                    className="text-center px-3 py-3 font-bold text-indigo-900 min-w-[60px]"
                  >
                    {size}
                  </th>
                ))}
                <th className="text-center px-4 py-3 font-bold text-indigo-900 min-w-[80px] border-l-2 border-indigo-200">
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
                    } hover:bg-indigo-50/30 transition-colors`}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {product}
                    </td>
                    {allSizes.map((size) => {
                      const row = productRows.find((r) => r.size === size);
                      const qty = row ? row.totalQuantity : 0;
                      return (
                        <td
                          key={size}
                          className={`text-center px-3 py-3 ${
                            qty > 0
                              ? "text-slate-900 font-medium"
                              : "text-slate-300"
                          }`}
                        >
                          {qty > 0 ? qty : "-"}
                        </td>
                      );
                    })}
                    <td className="text-center px-4 py-3 font-bold text-slate-900 border-l-2 border-slate-200">
                      {rowTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-indigo-100 border-t-2 border-indigo-300">
                <td className="px-4 py-3 font-bold text-indigo-900">
                  Celkem kusu
                </td>
                {allSizes.map((size) => {
                  const sizeTotal = summary
                    .filter((r) => r.size === size)
                    .reduce((sum, r) => sum + r.totalQuantity, 0);
                  return (
                    <td
                      key={size}
                      className="text-center px-3 py-3 font-bold text-indigo-900"
                    >
                      {sizeTotal}
                    </td>
                  );
                })}
                <td className="text-center px-4 py-3 font-bold text-indigo-900 text-lg border-l-2 border-indigo-300">
                  {grandTotal}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
