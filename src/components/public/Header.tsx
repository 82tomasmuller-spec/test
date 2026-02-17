'use client';

import Link from 'next/link';
import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface HeaderProps {
  siteName?: string;
  categories?: Category[];
}

export default function Header({ siteName = 'AI Blog CMS', categories = [] }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="font-bold text-xl text-gray-900">{siteName}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
              Domů
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Search & Mobile Menu */}
          <div className="flex items-center gap-3">
            {/* Search Toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
              aria-label="Vyhledávání"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-gray-900"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {searchOpen && (
          <div className="py-3 border-t border-gray-100 animate-fade-in">
            <form action="/search" method="GET" className="flex gap-2">
              <input
                type="text"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hledat články..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Hledat
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in">
          <nav className="px-4 py-3 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Domů
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
