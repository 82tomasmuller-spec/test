# ShopAlert - Setup Guide

Průvodce instalací a konfigurací ShopAlert aplikace.

## Požadavky

- Node.js 18+ (pro lokální vývoj)
- Docker a Docker Compose (doporučeno)
- PostgreSQL 14+ (pokud nespouštíte přes Docker)
- Redis 7+ (pokud nespouštíte přes Docker)

## Instalace pomocí Docker (doporučeno)

### 1. Klonování repozitáře

```bash
git clone <repository-url>
cd shopalert
```

### 2. Spuštění aplikace

```bash
docker-compose up -d
```

### 3. Přístup k aplikaci

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

### 4. Zastavení aplikace

```bash
docker-compose down
```

### 5. Kompletní reset (včetně databáze)

```bash
docker-compose down -v
```

## Lokální instalace bez Dockeru

### Backend

1. Instalace závislostí:
```bash
cd backend
npm install
```

2. Konfigurace prostředí:
```bash
cp .env.example .env
# Upravte .env soubor s vašimi údaji
```

3. Spuštění databázových migrací:
```bash
npm run migrate
```

4. Spuštění dev serveru:
```bash
npm run dev
```

Backend bude běžet na http://localhost:5000

### Frontend

1. Instalace závislostí:
```bash
cd frontend
npm install
```

2. Konfigurace prostředí:
```bash
cp .env.example .env
# Upravte VITE_API_URL pokud je potřeba
```

3. Spuštění dev serveru:
```bash
npm run dev
```

Frontend bude běžet na http://localhost:3000

## Konfigurace

### Backend Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shopalert
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME=ShopAlert
SMTP_FROM_EMAIL=noreply@shopalert.cz

# Monitoring
MONITOR_CHECK_INTERVAL=300000  # 5 minutes in ms
MONITOR_REQUEST_TIMEOUT=30000  # 30 seconds
MONITOR_MAX_RETRIES=3

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
```

## Email konfigurace (Gmail příklad)

1. Zapněte 2-Factor Authentication ve vašem Google účtu
2. Vygenerujte App Password:
   - Jděte do Google Account Settings
   - Security > 2-Step Verification > App passwords
   - Vyberte "Mail" a vygenerujte heslo
3. Použijte vygenerované heslo v `SMTP_PASSWORD`

## Troubleshooting

### Backend nespouští

1. Zkontrolujte, zda běží PostgreSQL a Redis:
```bash
docker-compose ps
```

2. Zkontrolujte logy:
```bash
docker-compose logs backend
```

3. Restartujte backend:
```bash
docker-compose restart backend
```

### Databázové chyby

1. Resetujte databázi:
```bash
docker-compose down -v
docker-compose up -d
```

2. Pokud používáte lokální PostgreSQL, zkontrolujte připojení:
```bash
psql -h localhost -U postgres -d shopalert
```

### Frontend se nepřipojuje k backendu

1. Zkontrolujte, zda backend běží:
```bash
curl http://localhost:5000/health
```

2. Zkontrolujte CORS nastavení v backendu (config.ts)

3. Zkontrolujte proxy nastavení ve vite.config.ts

### Monitoring jobs neběží

1. Zkontrolujte Redis připojení:
```bash
docker-compose logs redis
```

2. Restartujte backend pro restart job queue:
```bash
docker-compose restart backend
```

## Production deployment

### Build aplikace

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
# Serve dist/ folder pomocí Nginx nebo jiného web serveru
```

### Environment variables pro production

- Změňte `JWT_SECRET` na silné náhodné heslo
- Nastavte `NODE_ENV=production`
- Použijte production databázi
- Nastavte správné SMTP údaje
- Aktualizujte `FRONTEND_URL` a `VITE_API_URL`

### Nginx konfigurace (příklad)

```nginx
server {
    listen 80;
    server_name shopalert.example.com;

    location / {
        root /var/www/shopalert/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Podpora

Pro otázky a problémy vytvořte issue na GitHubu nebo kontaktujte tým na support@shopalert.cz
