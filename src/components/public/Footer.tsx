import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface FooterProps {
  siteName?: string;
  categories?: Category[];
}

export default function Footer({ siteName = 'AI Blog CMS', categories = [] }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="font-bold text-lg text-white">{siteName}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Moderní blogový systém s podporou umělé inteligence pro tvorbu kvalitního obsahu.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kategorie</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Odkazy</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Domů
                </Link>
              </li>
              <li>
                <Link href="/search" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Vyhledávání
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="text-gray-400 hover:text-white transition-colors text-sm">
                  Mapa stránek
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {currentYear} {siteName}. Všechna práva vyhrazena.</p>
        </div>
      </div>
    </footer>
  );
}
