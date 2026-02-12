import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const clubs = await prisma.club.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-blue-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              SportObjednávky.cz
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100 sm:text-xl">
              Objednávka sportovního oblečení pro kluby
            </p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-semibold text-slate-800">
          Vyberte svůj klub
        </h2>

        {clubs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
            <p className="text-lg text-slate-500">
              Momentálně nejsou k dispozici žádné aktivní kluby.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <Link
                key={club.id}
                href={`/klub/${club.slug}`}
                className="card-hover group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                  {club.logoUrl ? (
                    <img
                      src={club.logoUrl}
                      alt={`Logo ${club.name}`}
                      className="h-full max-h-28 w-auto object-contain"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white">
                      {club.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-600">
                    {club.name}
                  </h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        club.ordersOpen
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {club.ordersOpen
                        ? "Objednávky otevřeny"
                        : "Objednávky uzavřeny"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:text-blue-700">
                      Vstoupit
                      <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} SportObjednávky.cz
            </p>
            <Link
              href="/admin/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Přihlásit se do administrace
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
