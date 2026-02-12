"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface CartItem {
  productId: string;
  productName: string;
  size: string;
  quantity: number;
  unitPrice: number;
  imageUrl: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface ClubInfo {
  id: string;
  name: string;
  slug: string;
  categories: Category[];
}

function formatPrice(price: number): string {
  return `${price.toLocaleString("cs-CZ")} Kč`;
}

export default function CheckoutPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [clubInfo, setClubInfo] = useState<ClubInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Load cart and club info
  useEffect(() => {
    async function loadData() {
      try {
        // Fetch club info for categories
        const res = await fetch(`/api/clubs/by-slug/${slug}`);
        if (!res.ok) throw new Error("Nepodařilo se načíst informace o klubu");
        const club = await res.json();
        setClubInfo(club);

        // Load cart from localStorage
        const storageKey = `sport-cart-${club.id}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const items = JSON.parse(stored) as CartItem[];
          setCart(items);
          if (items.length === 0) {
            router.push(`/klub/${slug}`);
          }
        } else {
          router.push(`/klub/${slug}`);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Nastala neočekávaná chyba"
        );
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug, router]);

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubInfo) return;

    setSubmitting(true);
    setError(null);

    try {
      const body = {
        parentName,
        parentEmail,
        parentPhone,
        categoryId,
        items: cart.map((item) => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
        })),
      };

      const res = await fetch(`/api/clubs/${clubInfo.id}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error || "Nepodařilo se odeslat objednávku. Zkuste to prosím znovu."
        );
      }

      const order = await res.json();

      // Clear cart
      localStorage.removeItem(`sport-cart-${clubInfo.id}`);

      // Redirect to confirmation
      router.push(`/klub/${slug}/potvrzeni/${order.orderNumber}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nastala neočekávaná chyba"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-slate-500">Načítání...</p>
        </div>
      </div>
    );
  }

  if (!clubInfo || cart.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href={`/klub/${slug}`}
            className="text-sm text-blue-200 hover:text-white hover:underline"
          >
            &larr; Zpět na nabídku
          </Link>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Pokladna</h1>
          <p className="mt-1 text-blue-200">{clubInfo.name}</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Order form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} id="checkout-form">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-bold text-slate-800">
                  Kontaktní údaje
                </h2>
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="parentName"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Jméno a příjmení *
                    </label>
                    <input
                      id="parentName"
                      type="text"
                      required
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Jan Novák"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="parentEmail"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      E-mail *
                    </label>
                    <input
                      id="parentEmail"
                      type="email"
                      required
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="jan.novak@email.cz"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="parentPhone"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Telefon *
                    </label>
                    <input
                      id="parentPhone"
                      type="tel"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="+420 123 456 789"
                      className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label
                      htmlFor="categoryId"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Kategorie (oddíl) *
                    </label>
                    <select
                      id="categoryId"
                      required
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Vyberte kategorii</option>
                      {clubInfo.categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-slate-800">
                Souhrn objednávky
              </h2>

              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div
                    key={`${item.productId}-${item.size}-${index}`}
                    className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {item.productName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Vel. {item.size} &times; {item.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-slate-700">
                      {formatPrice(item.quantity * item.unitPrice)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Položek celkem
                  </span>
                  <span className="text-sm font-medium">{totalItems} ks</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-base font-bold text-slate-800">
                    Celkem
                  </span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Odesílání...
                  </span>
                ) : (
                  "Odeslat objednávku"
                )}
              </button>

              <p className="mt-3 text-center text-xs text-slate-400">
                Odesláním objednávky souhlasíte se zpracováním uvedených údajů.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
