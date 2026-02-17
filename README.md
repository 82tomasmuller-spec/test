# AI Blog CMS

Moderní blogový systém s vlastním redakčním systémem a AI podporou pro tvorbu obsahu.

## Funkce

### Veřejný web (Frontend)
- Responzivní design (mobil / tablet / desktop)
- Homepage s doporučenými a nejnovějšími články
- Detail článku s FAQ sekcí a Schema.org markup
- Kategorie a tagy s filtrací
- Fulltextové vyhledávání
- Breadcrumbs navigace
- Automatický sitemap.xml a robots.txt
- SEO optimalizace (meta tagy, Open Graph, canonical URL)

### Administrace (CMS)
- **Dashboard** - přehled statistik a poslední aktivita
- **Editor článků** - WYSIWYG + HTML režim, náhled, verzování
- **AI Generátor** - automatická tvorba článků pomocí OpenAI/Anthropic API
- **Content Planner** - Kanban board + kalendářní zobrazení
- **Affiliate Management** - správa partnerů, odkazů, statistik kliků
- **Správa médií** - upload, drag&drop, automatická komprese, WebP konverze
- **SEO Manager** - analýza článků, keyword density, doporučení
- **Statistiky** - články, kategorie, affiliate výdělky
- **Správa uživatelů** - role (Admin/Editor/Autor/Viewer)
- **Nastavení** - web, kategorie, AI, SEO

## Technologie

- **Framework**: Next.js 14 (App Router, SSR/SSG)
- **Jazyk**: TypeScript
- **Styling**: TailwindCSS
- **Databáze**: SQLite + Prisma ORM
- **Autentizace**: NextAuth.js
- **AI**: OpenAI API / Anthropic API
- **Zpracování obrázků**: Sharp

## Instalace

```bash
# 1. Nainstalujte závislosti
npm install

# 2. Vytvořte .env soubor
cp .env.example .env
# Upravte .env s vašimi API klíči

# 3. Inicializujte databázi
npx prisma db push

# 4. Naplňte demo daty
npm run db:seed

# 5. Spusťte vývojový server
npm run dev
```

Otevřete http://localhost:3000 (veřejný web) a http://localhost:3000/admin (administrace).

### Výchozí přihlášení
- Email: `admin@example.com`
- Heslo: `admin123`

## Struktura projektu

```
├── prisma/                 # Databázové schéma a seed
│   ├── schema.prisma
│   └── seed.ts
├── public/uploads/         # Nahrané soubory
├── src/
│   ├── app/
│   │   ├── (blog)/         # Veřejné stránky blogu
│   │   ├── admin/          # Administrační stránky
│   │   ├── api/            # API endpointy
│   │   └── auth/           # Přihlašovací stránka
│   ├── components/
│   │   ├── admin/          # Komponenty pro admin
│   │   └── public/         # Komponenty pro veřejný web
│   ├── lib/                # Sdílené knihovny
│   │   ├── ai.ts           # AI generátor
│   │   ├── auth.ts         # Autentizace
│   │   ├── media.ts        # Zpracování médií
│   │   ├── prisma.ts       # Databáze
│   │   ├── seo.ts          # SEO analýza
│   │   └── utils.ts        # Pomocné funkce
│   └── types/              # TypeScript typy
└── .env.example            # Vzorová konfigurace
```

## API Endpointy

| Endpoint | Metody | Popis |
|----------|--------|-------|
| `/api/articles` | GET, POST | Seznam/vytvoření článků |
| `/api/articles/[id]` | GET, PUT, DELETE | Detail/úprava/smazání článku |
| `/api/ai/generate` | POST | AI generace článku |
| `/api/affiliates` | GET, POST | Affiliate partneři |
| `/api/affiliates/[id]` | DELETE | Smazání partnera |
| `/api/affiliates/[id]/links` | POST | Vytvoření odkazu |
| `/api/planner` | GET, POST | Content planner |
| `/api/planner/[id]` | PUT, DELETE | Úprava/smazání plánu |
| `/api/media` | GET | Seznam médií |
| `/api/media/upload` | POST | Upload souboru |
| `/api/media/[id]` | PUT, DELETE | Úprava/smazání média |
| `/api/seo/analyze` | POST | SEO analýza článku |
| `/api/categories` | GET, POST | Kategorie |
| `/api/settings` | GET, PUT | Nastavení |
| `/api/users` | GET, POST | Uživatelé |
| `/api/search` | GET | Vyhledávání |

## Uživatelské role

| Role | Práva |
|------|-------|
| Admin | Plný přístup |
| Editor | Obsah, kategorie, tagy, média, affiliate, SEO, planner, statistiky |
| Autor | Články, kategorie (čtení), tagy (čtení), média, planner (čtení) |
| Viewer | Statistiky (čtení) |

## Produkční nasazení

```bash
# Build
npm run build

# Start
npm start
```

Pro produkci doporučujeme:
- PostgreSQL místo SQLite (změňte provider v schema.prisma)
- Redis pro cache
- CDN pro statické soubory
- Reverse proxy (Nginx)
- SSL certifikát (Let's Encrypt)
