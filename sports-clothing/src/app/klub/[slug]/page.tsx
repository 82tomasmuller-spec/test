import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StorefrontClient from "./StorefrontClient";

export default async function ClubStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const club = await prisma.club.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
      },
      products: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!club || !club.isActive) {
    notFound();
  }

  const clubData = {
    id: club.id,
    name: club.name,
    slug: club.slug,
    logoUrl: club.logoUrl,
    ordersOpen: club.ordersOpen,
    contactEmail: club.contactEmail,
    contactPhone: club.contactPhone,
    categories: club.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      imageUrl: cat.imageUrl,
    })),
    products: club.products.map((prod) => ({
      id: prod.id,
      name: prod.name,
      description: prod.description,
      price: prod.price,
      sizes: JSON.parse(prod.sizes) as string[],
      imageUrl: prod.imageUrl,
    })),
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-sm text-blue-200 hover:text-white hover:underline"
            >
              &larr; Zpět na výběr klubu
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-5">
            {club.logoUrl ? (
              <img
                src={club.logoUrl}
                alt={`Logo ${club.name}`}
                className="h-16 w-16 rounded-lg bg-white object-contain p-1 shadow sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-700 text-2xl font-bold text-white sm:h-20 sm:w-20 sm:text-3xl">
                {club.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{club.name}</h1>
              <p className="mt-1 text-blue-200">Objednávka sportovního oblečení</p>
            </div>
          </div>
        </div>
      </header>

      {/* Orders closed banner */}
      {!club.ordersOpen && (
        <div className="border-b border-orange-200 bg-orange-50 px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-center gap-3 sm:px-6 lg:px-8">
            <svg
              className="h-5 w-5 shrink-0 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <p className="text-sm font-medium text-orange-800">
              Příjem objednávek je momentálně uzavřen. Níže si můžete prohlédnout
              nabídku.
            </p>
          </div>
        </div>
      )}

      {/* Client storefront */}
      <StorefrontClient club={clubData} />
    </div>
  );
}
