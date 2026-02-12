import Link from "next/link";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; orderNumber: string }>;
}) {
  const { slug, orderNumber } = await params;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold sm:text-3xl">
            SportObjednávky.cz
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          {/* Success icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            Objednávka byla přijata!
          </h2>

          <div className="mt-6 rounded-lg bg-blue-50 px-6 py-4">
            <p className="text-sm text-blue-600">Číslo objednávky</p>
            <p className="mt-1 text-2xl font-bold tracking-wide text-blue-800">
              {orderNumber}
            </p>
          </div>

          <p className="mt-6 text-slate-600">
            Děkujeme za vaši objednávku. Potvrzení bylo zasláno na váš e-mail.
          </p>

          <p className="mt-2 text-sm text-slate-500">
            O změně stavu objednávky budete informováni e-mailem.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/klub/${slug}`}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Zpět na nabídku
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Na hlavní stránku
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
