# ShopAlert API Documentation

RESTful API dokumentace pro ShopAlert backend.

Base URL: `http://localhost:5000/api`

## Autentizace

Většina endpointů vyžaduje autentizaci pomocí JWT tokenu.

Token se odesílá v HTTP header:
```
Authorization: Bearer <token>
```

## Response formáty

### Success Response
```json
{
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Chybová zpráva"
}
```

## Endpoints

### Auth

#### POST /auth/register
Registrace nového uživatele.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "heslo123",
  "name": "Jan Novák"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Jan Novák",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /auth/login
Přihlášení uživatele.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "heslo123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Jan Novák",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### GET /auth/me
Získání informací o aktuálním uživateli.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "Jan Novák",
  "role": "user"
}
```

---

### Shops

#### GET /shops
Získání seznamu e-shopů aktuálního uživatele.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "name": "Můj E-shop",
    "domain": "https://example.com",
    "description": "Popis e-shopu",
    "enabled": true,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z",
    "monitors": [...]
  }
]
```

#### GET /shops/:id
Získání detailu konkrétního e-shopu.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "name": "Můj E-shop",
  "domain": "https://example.com",
  "description": "Popis e-shopu",
  "enabled": true,
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:00:00.000Z",
  "monitors": [...]
}
```

#### POST /shops
Vytvoření nového e-shopu.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Můj E-shop",
  "domain": "https://example.com",
  "description": "Popis e-shopu"
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "name": "Můj E-shop",
  "domain": "https://example.com",
  "description": "Popis e-shopu",
  "enabled": true,
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:00:00.000Z"
}
```

#### PUT /shops/:id
Aktualizace e-shopu.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Nový název",
  "domain": "https://new-domain.com",
  "description": "Nový popis",
  "enabled": false
}
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "name": "Nový název",
  "domain": "https://new-domain.com",
  "description": "Nový popis",
  "enabled": false,
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T11:00:00.000Z"
}
```

#### DELETE /shops/:id
Smazání e-shopu.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Shop byl úspěšně smazán"
}
```

---

### Monitors

#### GET /monitors
Získání všech monitorů aktuálního uživatele.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "shopId": 1,
    "url": "https://example.com",
    "checkInterval": 300000,
    "enabled": true,
    "lastCheck": "2024-01-01T10:00:00.000Z",
    "status": "up",
    "lastStatusCode": 200,
    "lastResponseTime": 150,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z",
    "shop": {...}
  }
]
```

#### GET /monitors/shop/:shopId
Získání monitorů pro konkrétní e-shop.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "shopId": 1,
    "url": "https://example.com",
    "checkInterval": 300000,
    "enabled": true,
    "lastCheck": "2024-01-01T10:00:00.000Z",
    "status": "up",
    "lastStatusCode": 200,
    "lastResponseTime": 150,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
]
```

#### GET /monitors/:id
Získání detailu monitoru.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "shopId": 1,
  "url": "https://example.com",
  "checkInterval": 300000,
  "enabled": true,
  "lastCheck": "2024-01-01T10:00:00.000Z",
  "status": "up",
  "lastStatusCode": 200,
  "lastResponseTime": 150,
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:00:00.000Z",
  "shop": {...},
  "incidents": [...]
}
```

#### POST /monitors
Vytvoření nového monitoru.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "shopId": 1,
  "url": "https://example.com",
  "checkInterval": 300000
}
```

**Response:**
```json
{
  "id": 1,
  "shopId": 1,
  "url": "https://example.com",
  "checkInterval": 300000,
  "enabled": true,
  "status": "unknown",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:00:00.000Z"
}
```

#### PUT /monitors/:id
Aktualizace monitoru.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "url": "https://new-url.com",
  "checkInterval": 600000,
  "enabled": false
}
```

**Response:**
```json
{
  "id": 1,
  "shopId": 1,
  "url": "https://new-url.com",
  "checkInterval": 600000,
  "enabled": false,
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T11:00:00.000Z"
}
```

#### DELETE /monitors/:id
Smazání monitoru.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Monitor byl úspěšně smazán"
}
```

---

### Incidents

#### GET /incidents
Získání seznamu incidentů.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status` (optional): "ongoing" | "resolved"
- `limit` (optional): number, default 50

**Response:**
```json
[
  {
    "id": 1,
    "monitorId": 1,
    "status": "resolved",
    "errorMessage": "HTTP 500",
    "responseTime": 5000,
    "httpCode": 500,
    "startedAt": "2024-01-01T10:00:00.000Z",
    "resolvedAt": "2024-01-01T10:15:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:15:00.000Z",
    "monitor": {...}
  }
]
```

#### GET /incidents/monitor/:monitorId
Získání incidentů pro konkrétní monitor.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "monitorId": 1,
    "status": "resolved",
    "errorMessage": "HTTP 500",
    "responseTime": 5000,
    "httpCode": 500,
    "startedAt": "2024-01-01T10:00:00.000Z",
    "resolvedAt": "2024-01-01T10:15:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:15:00.000Z"
  }
]
```

#### GET /incidents/:id
Získání detailu incidentu.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "monitorId": 1,
  "status": "resolved",
  "errorMessage": "HTTP 500",
  "responseTime": 5000,
  "httpCode": 500,
  "startedAt": "2024-01-01T10:00:00.000Z",
  "resolvedAt": "2024-01-01T10:15:00.000Z",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:15:00.000Z",
  "monitor": {...}
}
```

#### GET /incidents/export/csv
Export incidentů do CSV.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
CSV file download

---

### Stats

#### GET /stats/uptime/:shopId
Získání uptime statistik pro e-shop.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `days` (optional): number, default 7

**Response:**
```json
{
  "uptime": 99.5,
  "incidents": 2,
  "totalDowntimeMinutes": 15,
  "period": "7 days"
}
```

#### GET /stats/response-time/:monitorId
Získání statistik doby odezvy pro monitor.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `days` (optional): number, default 7

**Response:**
```json
{
  "average": 150,
  "min": 100,
  "max": 500,
  "data": [
    {
      "timestamp": "2024-01-01T10:00:00.000Z",
      "responseTime": 150
    }
  ]
}
```

#### GET /stats/overview
Získání celkového přehledu.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalShops": 5,
  "totalMonitors": 15,
  "activeIncidents": 1,
  "recentIncidents": 3,
  "monitorsUp": 14,
  "monitorsDown": 1
}
```

---

## Error Codes

- `400` - Bad Request (chybné parametry)
- `401` - Unauthorized (chybějící nebo neplatný token)
- `404` - Not Found (zdroj nenalezen)
- `500` - Internal Server Error (serverová chyba)

## Rate Limiting

API má rate limit:
- 100 požadavků za 15 minut na IP adresu

Při překročení limitu dostanete 429 Too Many Requests.
