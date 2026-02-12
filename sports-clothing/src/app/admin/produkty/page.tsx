"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAdmin } from "../AdminContext";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sizes: string;
  imageUrl: string | null;
  active: boolean;
  sortOrder: number;
}

const AVAILABLE_SIZES = [
  "XXS", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL",
  "116", "128", "140", "152", "164",
];

const PREDEFINED_IMAGES = [
  { label: "Tricko", value: "/images/default-tshirt.svg" },
  { label: "Kratasy", value: "/images/default-shorts.svg" },
  { label: "Kalhoty", value: "/images/default-pants.svg" },
];

export default function AdminProduktyPage() {
  const { selectedClub } = useAdmin();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formSizes, setFormSizes] = useState<string[]>([]);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formImageMode, setFormImageMode] = useState<"predefined" | "upload" | "url">("predefined");
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState("");

  async function fetchProducts() {
    if (!selectedClub) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/clubs/${selectedClub.id}/products`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClub]);

  function openNewModal() {
    setEditingProduct(null);
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormSizes([]);
    setFormImageUrl("");
    setFormImageMode("predefined");
    setFormActive(true);
    setFormError("");
    setShowModal(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDesc(product.description ?? "");
    setFormPrice(String(product.price));
    try {
      setFormSizes(JSON.parse(product.sizes));
    } catch {
      setFormSizes([]);
    }
    setFormImageUrl(product.imageUrl ?? "");
    setFormImageMode(
      PREDEFINED_IMAGES.some((p) => p.value === product.imageUrl)
        ? "predefined"
        : "url"
    );
    setFormActive(product.active);
    setFormError("");
    setShowModal(true);
  }

  function toggleSize(size: string) {
    setFormSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formName.trim()) {
      setFormError("Nazev je povinny");
      return;
    }
    if (!formPrice || isNaN(Number(formPrice)) || Number(formPrice) <= 0) {
      setFormError("Zadejte platnou cenu");
      return;
    }
    if (formSizes.length === 0) {
      setFormError("Vyberte alespon jednu velikost");
      return;
    }

    setSaving(true);
    const body = {
      name: formName.trim(),
      description: formDesc.trim() || null,
      price: Number(formPrice),
      sizes: JSON.stringify(formSizes),
      imageUrl: formImageUrl || null,
      active: formActive,
    };

    try {
      const url = editingProduct
        ? `/api/clubs/${selectedClub!.id}/products/${editingProduct.id}`
        : `/api/clubs/${selectedClub!.id}/products`;
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || "Chyba pri ukladani");
        setSaving(false);
        return;
      }

      setShowModal(false);
      fetchProducts();
    } catch {
      setFormError("Chyba pripojeni");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/clubs/${selectedClub!.id}/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setDeleteConfirm(null);
      fetchProducts();
    } catch {
      // silently fail
    }
  }

  async function handleFileUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setFormImageUrl(data.url ?? data.imageUrl ?? "");
      }
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Produkty</h1>
        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novy produkt
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <p className="text-slate-500">Zatim nemame zadne produkty.</p>
          <button
            onClick={openNewModal}
            className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
          >
            Pridat prvni produkt
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Produkt</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Cena</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Velikosti</th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700">Aktivni</th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700">Akce</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => {
                  let sizes: string[] = [];
                  try {
                    sizes = JSON.parse(product.sizes);
                  } catch {
                    sizes = [];
                  }
                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-slate-100 ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      } hover:bg-indigo-50/50 transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.imageUrl && (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                            />
                          )}
                          <div>
                            <div className="font-medium text-slate-900">{product.name}</div>
                            {product.description && (
                              <div className="text-xs text-slate-500 truncate max-w-xs">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {product.price} Kc
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {sizes.map((s) => (
                            <span
                              key={s}
                              className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {product.active ? (
                          <span className="inline-block w-3 h-3 rounded-full bg-green-500" title="Aktivni" />
                        ) : (
                          <span className="inline-block w-3 h-3 rounded-full bg-slate-300" title="Neaktivni" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Upravit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {deleteConfirm === product.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Smazat
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                              >
                                Zrusit
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(product.id)}
                              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Smazat"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingProduct ? "Upravit produkt" : "Novy produkt"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nazev *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                  placeholder="Nazev produktu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Popis
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                  placeholder="Kratky popis produktu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cena (Kc) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Velikosti *
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        formSizes.includes(size)
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Obrazek
                </label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormImageMode("predefined")}
                    className={`px-3 py-1 text-xs rounded-lg border ${
                      formImageMode === "predefined"
                        ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                        : "bg-white text-slate-600 border-slate-300"
                    }`}
                  >
                    Preddefinovany
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormImageMode("upload")}
                    className={`px-3 py-1 text-xs rounded-lg border ${
                      formImageMode === "upload"
                        ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                        : "bg-white text-slate-600 border-slate-300"
                    }`}
                  >
                    Nahrat
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormImageMode("url")}
                    className={`px-3 py-1 text-xs rounded-lg border ${
                      formImageMode === "url"
                        ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                        : "bg-white text-slate-600 border-slate-300"
                    }`}
                  >
                    URL
                  </button>
                </div>

                {formImageMode === "predefined" && (
                  <div className="flex gap-3">
                    {PREDEFINED_IMAGES.map((img) => (
                      <button
                        key={img.value}
                        type="button"
                        onClick={() => setFormImageUrl(img.value)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-colors ${
                          formImageUrl === img.value
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <img src={img.value} alt={img.label} className="w-12 h-12 object-contain" />
                        <span className="text-xs text-slate-600">{img.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {formImageMode === "upload" && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                )}

                {formImageMode === "url" && (
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                    placeholder="https://..."
                  />
                )}

                {formImageUrl && (
                  <div className="mt-2">
                    <img
                      src={formImageUrl}
                      alt="Nahled"
                      className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
                <span className="text-sm font-medium text-slate-700">
                  Aktivni produkt
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors"
                >
                  {saving ? "Ukladam..." : editingProduct ? "Ulozit zmeny" : "Vytvorit produkt"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  Zrusit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
