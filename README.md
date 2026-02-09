# ShopAlert - E-Shop Uptime Guard

Robustní SaaS pro monitoring e-shopů v ČR a SK. Poskytuje okamžité upozornění při výpadcích, problémech s košíkem, platebními branami nebo zpomalení webu.

## Funkce MVP

- ✅ Kontrola 1-3 URL na e-shop
- ✅ Monitoring interval: 5 minut
- ✅ Email notifikace při výpadku
- ✅ Historie incidentů (7 dní)
- ✅ Dashboard s uptime a grafy
- ✅ Uživatelská registrace a přihlášení
- ✅ Export dat (CSV)

## Technologie

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL (databáze)
- Redis (fronty a cache)
- Bull (job queue pro monitoring)
- Nodemailer (email alerts)

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Recharts (grafy)
- TailwindCSS

### DevOps
- Docker & Docker Compose
- Nginx (reverse proxy)

## Rychlý start

### Požadavky
- Node.js 18+
- Docker a Docker Compose
- PostgreSQL 14+
- Redis 7+

### Instalace

1. **Klonování repozitáře**
```bash
git clone <repository-url>
cd shopalert
```

2. **Spuštění pomocí Docker Compose**
```bash
docker-compose up -d
```

3. **Přístup k aplikaci**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API dokumentace: http://localhost:5000/api-docs

### Lokální vývoj bez Dockeru

#### Backend
```bash
cd backend
npm install
cp .env.example .env
# Upravte .env soubor s vašimi přístupy
npm run migrate
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Architektura

```
shopalert/
├── backend/               # Node.js API server
│   ├── src/
│   │   ├── config/       # Konfigurace (DB, Redis, Email)
│   │   ├── models/       # Databázové modely
│   │   ├── services/     # Business logika
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Express middleware
│   │   ├── jobs/         # Monitoring jobs (Bull)
│   │   └── utils/        # Pomocné funkce
│   └── package.json
│
├── frontend/             # React SPA
│   ├── src/
│   │   ├── components/  # React komponenty
│   │   ├── pages/       # Stránky aplikace
│   │   ├── services/    # API klienti
│   │   ├── hooks/       # Custom React hooks
│   │   ├── types/       # TypeScript typy
│   │   └── assets/      # Statické soubory
│   └── package.json
│
├── docs/                # Dokumentace
├── docker-compose.yml   # Docker orchestrace
└── README.md
```

## API Endpoints (MVP)

### Auth
- `POST /api/auth/register` - Registrace nového uživatele
- `POST /api/auth/login` - Přihlášení
- `POST /api/auth/logout` - Odhlášení
- `GET /api/auth/me` - Aktuální uživatel

### Shops
- `GET /api/shops` - Seznam e-shopů
- `POST /api/shops` - Vytvoření nového shopu
- `GET /api/shops/:id` - Detail shopu
- `PUT /api/shops/:id` - Aktualizace shopu
- `DELETE /api/shops/:id` - Smazání shopu

### Monitors
- `GET /api/monitors` - Seznam všech monitorů
- `POST /api/monitors` - Vytvoření monitoru
- `GET /api/monitors/:id` - Detail monitoru
- `PUT /api/monitors/:id` - Aktualizace monitoru
- `DELETE /api/monitors/:id` - Smazání monitoru

### Incidents
- `GET /api/incidents` - Historie incidentů
- `GET /api/incidents/:id` - Detail incidentu
- `GET /api/incidents/export` - Export do CSV

### Stats
- `GET /api/stats/uptime/:shopId` - Uptime statistiky
- `GET /api/stats/response-time/:shopId` - Response time grafy

## Datový model

### User
- id, email, password_hash, name, created_at, updated_at

### Shop
- id, user_id, name, domain, created_at, updated_at

### Monitor
- id, shop_id, url, check_interval, enabled, created_at, updated_at

### Incident
- id, monitor_id, status, error_message, response_time, http_code, started_at, resolved_at

### Alert
- id, incident_id, type (email/sms/webhook), sent_at, status

## Roadmap

### Fáze 2 (Q2 2026)
- SMS a Telegram notifikace
- Podpora více URL na shop (až 20)
- Webhook integrace
- Rozšířené grafy a statistiky

### Fáze 3 (Q3 2026)
- Test nákupního procesu
- Kontrola platebních bran (GoPay, ComGate, Stripe)
- AI predikce výpadků
- Export do PDF

### Fáze 4 (Q4 2026)
- Integrace s Shoptet API
- Integrace s WooCommerce
- Integrace s Shopify
- White-label řešení

## Monetizace

| Tarif | Cena | Funkce |
|-------|------|--------|
| Free | 0 Kč | 1 shop, 1 URL, interval 15 min, email |
| Start | 149 Kč/měsíc | 3 shopy, 5 URL, interval 5 min, webhook |
| Pro | 399 Kč/měsíc | 5 shopů, 20 URL, SMS + Telegram, grafy |
| Biz | 799 Kč/měsíc | Neomezeno, API, test nákupu |

## Kontribuce

Pull requesty jsou vítány! Pro větší změny prosím nejprve otevřete issue.

## Licence

MIT

## Podpora

Pro podporu kontaktujte: support@shopalert.cz
