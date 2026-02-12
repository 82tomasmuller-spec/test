"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  imageUrl: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sizes: string[];
  imageUrl: string | null;
}

interface ClubData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  ordersOpen: boolean;
  contactEmail: string;
  contactPhone: string | null;
  categories: Category[];
  products: Product[];
}

export interface CartItem {
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  imageUrl: string | null;
}

function getCartStorageKey(clubSlug: string) {
  return `sport-cart-${clubSlug}`;
}

function formatPrice(price: number): string {
  return `${price.toLocaleString("cs-CZ")} Kč`;
}

export default function StorefrontClient({ club }: { club: ClubData }) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getCartStorageKey(club.slug));
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch {
      // ignore parse errors
    }
  }, [club.slug]);

  // Persist cart to localStorage
  const persistCart = useCallback(
    (items: CartItem[]) => {
      setCart(items);
      localStorage.setItem(getCartStorageKey(club.slug), JSON.stringify(items));
    },
    [club.slug]
  );

  const addToCart = (product: Product) => {
    const size = selectedSizes[product.id];
    if (!size) return;
    const qty = quantities[product.id] || 1;

    const existingIndex = cart.findIndex(
      (item) => item.productId === product.id && item.size === size
    );

    let newCart: CartItem[];
    if (existingIndex >= 0) {
      newCart = cart.map((item, i) =>
        i === existingIndex
          ? { ...item, quantity: item.quantity + qty }
          : item
      );
    } else {
      newCart = [
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          size,
          quantity: qty,
          unitPrice: product.price,
          imageUrl: product.imageUrl,
        },
      ];
    }

    persistCart(newCart);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1500);

    // Reset selections for this product
    setSelectedSizes((prev) => {
      const copy = { ...prev };
      delete copy[product.id];
      return copy;
    });
    setQuantities((prev) => {
      const copy = { ...prev };
      delete copy[product.id];
      return copy;
    });
  };

  const removeFromCart = (index: number) => {
    const newCart = cart.filter((_, i) => i !== index);
    persistCart(newCart);
  };

  const updateCartItemQty = (index: number, delta: number) => {
    const newCart = cart.map((item, i) => {
      if (i !== index) return item;
      const newQty = item.quantity + delta;
      return newQty > 0 ? { ...item, quantity: newQty } : item;
    });
    persistCart(newCart);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const filteredProducts = selectedCategory
    ? club.products
    : club.products;
  // Note: Products don't have a categoryId field in the schema,
  // so we show all products regardless of category selection.
  // Categories are used for order placement (parent selects their child's category).

  return (
    <>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Category chips */}
        {club.categories.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Kategorie (oddíly)
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                Vše
              </button>
              {club.categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === cat.id ? null : cat.id
                    )
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-slate-500">
              V této kategorii nejsou žádné produkty.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="card-hover flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Product image */}
                <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full max-h-40 w-auto object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        className="h-16 w-16 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21z"
                        />
                      </svg>
                    </div>
                  )}
                  {!club.ordersOpen && (
                    <div className="absolute right-2 top-2 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
                      Nedostupné
                    </div>
                  )}
                  {addedProductId === product.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/80">
                      <div className="flex items-center gap-2 text-lg font-bold text-white">
                        <svg
                          className="h-6 w-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                        Přidáno!
                      </div>
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="mt-1 text-sm text-slate-500">
                      {product.description}
                    </p>
                  )}
                  <p className="mt-2 text-xl font-bold text-blue-600">
                    {formatPrice(product.price)}
                  </p>

                  {/* Size selector & quantity */}
                  {club.ordersOpen && (
                    <div className="mt-4 space-y-3">
                      {/* Size */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Velikost
                        </label>
                        <select
                          value={selectedSizes[product.id] || ""}
                          onChange={(e) =>
                            setSelectedSizes((prev) => ({
                              ...prev,
                              [product.id]: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Vyberte velikost</option>
                          {product.sizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                          Počet
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [product.id]: Math.max(
                                  1,
                                  (prev[product.id] || 1) - 1
                                ),
                              }))
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                          >
                            -
                          </button>
                          <span className="w-10 text-center text-sm font-medium">
                            {quantities[product.id] || 1}
                          </span>
                          <button
                            onClick={() =>
                              setQuantities((prev) => ({
                                ...prev,
                                [product.id]: (prev[product.id] || 1) + 1,
                              }))
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Add to cart button */}
                      <button
                        onClick={() => addToCart(product)}
                        disabled={!selectedSizes[product.id]}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                      >
                        Přidat do košíku
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Floating cart badge */}
      {totalItems > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
            />
          </svg>
          <span className="font-semibold">Košík</span>
          <span className="cart-badge-bounce flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-600">
            {totalItems}
          </span>
        </button>
      )}

      {/* Cart sidebar/modal */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setCartOpen(false)}
          />
          {/* Sidebar */}
          <div className="relative flex w-full max-w-md flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-800">
                Košík ({totalItems})
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-slate-500">Košík je prázdný</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div
                      key={`${item.productId}-${item.size}-${index}`}
                      className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      {/* Thumbnail */}
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <svg
                            className="h-8 w-8 text-slate-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21z"
                            />
                          </svg>
                        )}
                      </div>
                      {/* Details */}
                      <div className="flex flex-1 flex-col">
                        <p className="text-sm font-semibold text-slate-800">
                          {item.productName}
                        </p>
                        <p className="text-xs text-slate-500">
                          Velikost: {item.size}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            onClick={() => updateCartItemQty(index, -1)}
                            className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItemQty(index, 1)}
                            className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {/* Price + remove */}
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => removeFromCart(index)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                          title="Odebrat"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatPrice(item.quantity * item.unitPrice)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-slate-200 px-6 py-4">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">
                    Celkem
                  </span>
                  <span className="text-xl font-bold text-slate-800">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    router.push(`/klub/${club.slug}/pokladna`);
                  }}
                  className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Pokračovat k objednávce
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
