"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

interface InvoiceData {
  invoiceNumber: string;
  amount: number;
  variableSymbol: string;
}

const STEPS = [
  { number: 1, label: "Účet" },
  { number: 2, label: "Klub" },
  { number: 3, label: "Hotovo" },
];

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                currentStep === step.number
                  ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30"
                  : currentStep > step.number
                    ? "bg-primary-500 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {currentStep > step.number ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span
              className={`mt-1 text-xs font-medium ${
                currentStep >= step.number ? "text-primary-700" : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <div
              className={`mx-2 mb-5 h-0.5 w-12 rounded transition-colors ${
                currentStep > step.number ? "bg-primary-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function RegistracePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // Step 2 fields
  const [clubName, setClubName] = useState("");
  const [ico, setIco] = useState("");
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Step 3 data
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");

  function validateStep1(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Jméno a příjmení je povinné";
    }

    if (!email.trim()) {
      newErrors.email = "E-mail je povinný";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Zadejte platný e-mail";
    }

    if (!password) {
      newErrors.password = "Heslo je povinné";
    } else if (password.length < 6) {
      newErrors.password = "Heslo musí mít alespoň 6 znaků";
    }

    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = "Hesla se neshodují";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep2(): boolean {
    const newErrors: Record<string, string> = {};

    if (!clubName.trim()) {
      newErrors.clubName = "Název klubu je povinný";
    }

    if (!contactEmail.trim()) {
      newErrors.contactEmail = "Kontaktní e-mail je povinný";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.contactEmail = "Zadejte platný e-mail";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleStep1Submit(e: FormEvent) {
    e.preventDefault();
    setApiError("");

    if (!validateStep1()) return;

    setLoading(true);

    try {
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        if (registerRes.status === 409) {
          setApiError("Uživatel s tímto e-mailem již existuje.");
        } else {
          setApiError(registerData.error || "Při registraci došlo k chybě.");
        }
        setLoading(false);
        return;
      }

      // Registration sets the cookie automatically, proceed to step 2
      setContactEmail(email.trim());
      setCurrentStep(2);
    } catch {
      setApiError("Nepodařilo se spojit se serverem. Zkuste to prosím znovu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2Submit(e: FormEvent) {
    e.preventDefault();
    setApiError("");

    if (!validateStep2()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clubName.trim(),
          ico: ico.trim() || undefined,
          address: address.trim() || undefined,
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setApiError("Klub s tímto názvem již existuje.");
        } else if (res.status === 401) {
          setApiError("Neautorizovaný přístup. Zkuste se přihlásit znovu.");
        } else {
          setApiError(data.error || "Při vytváření klubu došlo k chybě.");
        }
        setLoading(false);
        return;
      }

      setInvoiceData({
        invoiceNumber: data.invoice?.invoiceNumber || "",
        amount: data.invoice?.amount || 0,
        variableSymbol: data.invoice?.variableSymbol || "",
      });
      setCurrentStep(3);
    } catch {
      setApiError("Nepodařilo se spojit se serverem. Zkuste to prosím znovu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 py-8 px-4">
      <div className="mx-auto max-w-lg">
        {/* Back to homepage link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Zpět na hlavní stránku
        </Link>

        {/* Card */}
        <div className="rounded-2xl bg-white shadow-xl shadow-primary-900/5 border border-gray-100 p-8">
          <StepIndicator currentStep={currentStep} />

          {/* API Error */}
          {apiError && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {apiError}
            </div>
          )}

          {/* Step 1: Account creation */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} noValidate>
              <h1 className="mb-1 text-2xl font-bold text-gray-900">Vytvořte si účet</h1>
              <p className="mb-6 text-sm text-gray-500">
                Zadejte své údaje pro vytvoření nového účtu.
              </p>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                    Jméno a příjmení
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 ${
                      errors.name ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                    }`}
                    placeholder="Jan Novák"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 ${
                      errors.email ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                    }`}
                    placeholder="jan@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                    Heslo
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 ${
                      errors.password ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                    }`}
                    placeholder="Minimálně 6 znaků"
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                  )}
                </div>

                {/* Password confirmation */}
                <div>
                  <label htmlFor="passwordConfirm" className="mb-1 block text-sm font-medium text-gray-700">
                    Heslo znovu
                  </label>
                  <input
                    id="passwordConfirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => {
                      setPasswordConfirm(e.target.value);
                      if (errors.passwordConfirm) setErrors((prev) => ({ ...prev, passwordConfirm: "" }));
                    }}
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 ${
                      errors.passwordConfirm ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                    }`}
                    placeholder="Zopakujte heslo"
                  />
                  {errors.passwordConfirm && (
                    <p className="mt-1 text-xs text-red-600">{errors.passwordConfirm}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loading ? "Zpracovávám..." : "Pokračovat"}
              </button>
            </form>
          )}

          {/* Step 2: Club details */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} noValidate>
              <h1 className="mb-1 text-2xl font-bold text-gray-900">Údaje o klubu</h1>
              <p className="mb-6 text-sm text-gray-500">
                Vyplňte informace o vašem sportovním klubu.
              </p>

              <div className="space-y-4">
                {/* Club name */}
                <div>
                  <label htmlFor="clubName" className="mb-1 block text-sm font-medium text-gray-700">
                    Název klubu
                  </label>
                  <input
                    id="clubName"
                    type="text"
                    value={clubName}
                    onChange={(e) => {
                      setClubName(e.target.value);
                      if (errors.clubName) setErrors((prev) => ({ ...prev, clubName: "" }));
                    }}
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 ${
                      errors.clubName ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                    }`}
                    placeholder="FK Sportovní klub"
                  />
                  {errors.clubName && (
                    <p className="mt-1 text-xs text-red-600">{errors.clubName}</p>
                  )}
                </div>

                {/* ICO */}
                <div>
                  <label htmlFor="ico" className="mb-1 block text-sm font-medium text-gray-700">
                    IČO
                    <span className="ml-1 text-xs font-normal text-gray-400">(nepovinné)</span>
                  </label>
                  <input
                    id="ico"
                    type="text"
                    value={ico}
                    onChange={(e) => setIco(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="12345678"
                  />
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
                    Adresa
                    <span className="ml-1 text-xs font-normal text-gray-400">(nepovinné)</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="Sportovní 123, Praha"
                  />
                </div>

                {/* Contact email */}
                <div>
                  <label htmlFor="contactEmail" className="mb-1 block text-sm font-medium text-gray-700">
                    Kontaktní e-mail
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      if (errors.contactEmail) setErrors((prev) => ({ ...prev, contactEmail: "" }));
                    }}
                    className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 ${
                      errors.contactEmail ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
                    }`}
                    placeholder="klub@example.com"
                  />
                  {errors.contactEmail && (
                    <p className="mt-1 text-xs text-red-600">{errors.contactEmail}</p>
                  )}
                </div>

                {/* Contact phone */}
                <div>
                  <label htmlFor="contactPhone" className="mb-1 block text-sm font-medium text-gray-700">
                    Kontaktní telefon
                    <span className="ml-1 text-xs font-normal text-gray-400">(nepovinné)</span>
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    placeholder="+420 123 456 789"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loading ? "Zpracovávám..." : "Zaregistrovat klub"}
              </button>
            </form>
          )}

          {/* Step 3: Registration complete */}
          {currentStep === 3 && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="mb-2 text-2xl font-bold text-gray-900">Registrace dokončena</h1>
              <p className="mb-6 text-base text-green-700 font-medium">
                Váš klub byl úspěšně zaregistrován!
              </p>

              {/* Invoice details */}
              {invoiceData && (
                <div className="mb-6 rounded-lg bg-gray-50 border border-gray-200 p-5 text-left">
                  <h2 className="mb-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Fakturační údaje
                  </h2>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Číslo faktury</dt>
                      <dd className="font-medium text-gray-900">{invoiceData.invoiceNumber}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Částka</dt>
                      <dd className="font-medium text-gray-900">{invoiceData.amount} Kč</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Variabilní symbol</dt>
                      <dd className="font-medium text-gray-900">{invoiceData.variableSymbol}</dd>
                    </div>
                  </dl>
                </div>
              )}

              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  Na váš e-mail jsme odeslali zálohovou fakturu s QR kódem pro platbu.
                </p>
                <p>
                  Po přijetí platby bude váš klub aktivován a budeme vás informovat e-mailem.
                </p>
              </div>

              <Link
                href="/admin"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Přejít do administrace
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Footer note */}
        {currentStep < 3 && (
          <p className="mt-6 text-center text-xs text-gray-400">
            Registrací souhlasíte s podmínkami používání platformy.
          </p>
        )}
      </div>
    </div>
  );
}
