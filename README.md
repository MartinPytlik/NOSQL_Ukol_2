# 🛒 Product Catalog

Full-stack webová aplikace pro správu produktů e-shopu s **Redis Cache** pro optimalizaci výkonu.

![Product Catalog](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 📋 Obsah

- [Popis projektu](#-popis-projektu)
- [Technologie](#-technologie)
- [Požadavky](#-požadavky)
- [Instalace a spuštění](#-instalace-a-spuštění)
- [Architektura](#-architektura)
- [API Endpoints](#-api-endpoints)
- [Redis Cache](#-redis-cache)
- [Testování](#-testování)
- [Screenshoty](#-screenshoty)

## 📖 Popis projektu

Product Catalog je moderní e-shop aplikace, která demonstruje použití Redis jako cache pro snížení zátěže databáze a urychlení odezvy API. Aplikace umožňuje:

- ✅ **CRUD operace** s produkty (vytváření, čtení, aktualizace, mazání)
- 🔍 **Vyhledávání** produktů podle názvu
- 📂 **Filtrování** podle kategorií
- 📄 **Stránkování** pro efektivní zobrazení velkého množství produktů
- 📊 **Cache statistiky** v reálném čase (hit/miss rate)
- 🎨 **Responzivní UI** optimalizované pro všechna zařízení

## 🛠 Technologie

### Backend
- **Node.js** + **Express.js** - REST API server
- **PostgreSQL** - Relační databáze pro persistentní ukládání produktů
- **Redis Stack** - In-memory cache pro rychlý přístup k datům
- **express-validator** - Validace vstupních dat

### Frontend
- **React 18** - Moderní frontend framework
- **Vite** - Rychlý build tool
- **CSS3** - Vlastní styly s CSS proměnnými a animacemi

### Infrastruktura
- **Docker** + **Docker Compose** - Kontejnerizace a orchestrace služeb
- **Nginx** - Webový server pro produkční prostředí

## 📦 Požadavky

Pro spuštění aplikace potřebujete:

- [Docker](https://docs.docker.com/get-docker/) (verze 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (verze 2.0+)
- [Git](https://git-scm.com/downloads)

## 🚀 Instalace a spuštění

### 1. Klonování repozitáře

```bash
git clone <repo-url>
cd product-catalog
```

### 2. Spuštění aplikace

```bash
docker-compose up --build -d
```

Tento příkaz:
- Stáhne potřebné Docker image
- Sestaví backend a frontend kontejnery
- Spustí všechny služby na pozadí

### 3. Přístup k aplikaci

Po úspěšném spuštění jsou dostupné tyto adresy:

| Služba | URL | Popis |
|--------|-----|-------|
| **Frontend** | http://localhost:3000 | Webová aplikace |
| **Backend API** | http://localhost:3001/api | REST API |
| **RedisInsight** | http://localhost:8001 | GUI pro Redis |
| **PostgreSQL** | localhost:5432 | Databáze (user: postgres, pass: postgres123) |

### 4. Zastavení aplikace

```bash
# Zastavit kontejnery (data zůstanou)
docker-compose down

# Zastavit kontejnery a smazat data
docker-compose down -v
```

## 🏗 Architektura

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│                      http://localhost:3000                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Nginx (Reverse Proxy)                       │
│                        /api → Backend                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Node.js/Express)                     │
│                      http://localhost:3001                      │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    Cache Logic                           │  │
│   │  1. Kontrola Redis cache                                 │  │
│   │  2. Cache HIT → vrať data z Redis                        │  │
│   │  3. Cache MISS → načti z PostgreSQL → ulož do Redis      │  │
│   └─────────────────────────────────────────────────────────┘  │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│     Redis Stack           │   │        PostgreSQL             │
│   (Cache, TTL: 10 min)    │   │    (Persistentní data)        │
│   http://localhost:6379   │   │    localhost:5432             │
└───────────────────────────┘   └───────────────────────────────┘
```

## 📡 API Endpoints

### Produkty

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| GET | `/api/products` | Seznam produktů (s stránkováním a filtry) |
| GET | `/api/products/:id` | Detail produktu |
| GET | `/api/products/categories` | Seznam kategorií |
| POST | `/api/products` | Vytvoření produktu |
| PUT | `/api/products/:id` | Aktualizace produktu |
| DELETE | `/api/products/:id` | Smazání produktu |

### Query parametry pro seznam produktů

| Parametr | Typ | Popis | Příklad |
|----------|-----|-------|---------|
| page | number | Číslo stránky | `?page=2` |
| limit | number | Položek na stránku | `?limit=20` |
| search | string | Vyhledávání v názvu | `?search=iPhone` |
| category | string | Filtr podle kategorie | `?category=Elektronika` |

### Cache

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| GET | `/api/cache/stats` | Statistiky cache (hits, misses, hit rate) |
| POST | `/api/cache/reset-stats` | Reset statistik |
| POST | `/api/cache/flush` | Vyprázdnění cache |

### Health Check

| Metoda | Endpoint | Popis |
|--------|----------|-------|
| GET | `/api/health` | Kontrola stavu služeb |

## 🔴 Redis Cache

### Účel cachování

Redis cache slouží k:

1. **Snížení zátěže databáze** - Opakované dotazy jsou obslouženy z paměti
2. **Urychlení odezvy** - Redis je in-memory databáze s latencí < 1ms
3. **Škálovatelnost** - Databáze může obsluhovat více uživatelů

### Cache strategie (Cache-Aside Pattern)

```
1. Klient požádá o produkt
2. Backend zkontroluje Redis cache
   ├── Cache HIT → vrať data z cache
   └── Cache MISS → načti z PostgreSQL
                    → ulož do Redis s TTL
                    → vrať data
```

### Expirace cache (TTL)

- **Výchozí TTL:** 10 minut (600 sekund)
- **Konfigurace:** Proměnná prostředí `CACHE_TTL`

### Invalidace cache

Cache je automaticky invalidována při:
- **Aktualizaci produktu** (PUT)
- **Smazání produktu** (DELETE)
- **Vytvoření produktu** (seznamy)

## 🧪 Testování

### Test CRUD operací

1. **Přidat produkt:**
   - Klikněte na "Přidat produkt"
   - Vyplňte formulář a uložte

2. **Upravit produkt:**
   - Klikněte na ikonu tužky u produktu
   - Změňte údaje a uložte

3. **Smazat produkt:**
   - Klikněte na ikonu koše u produktu

### Test cache hit/miss

1. **Cache MISS:**
   - Klikněte na "Vyprázdnit cache"
   - Klikněte na "Cache test" u produktu
   - Zobrazí se notifikace "📕 Cache MISS"

2. **Cache HIT:**
   - Klikněte znovu na "Cache test" u stejného produktu
   - Zobrazí se notifikace "📗 Cache HIT"

3. **Statistiky:**
   - Sledujte sekci "Redis Cache Statistiky"
   - Hit Rate ukazuje efektivitu cache

### Příklad API testování

```bash
# Získat všechny produkty
curl http://localhost:3001/api/products

# Získat produkt (první = cache miss, druhý = cache hit)
curl http://localhost:3001/api/products/1
curl http://localhost:3001/api/products/1

# Zkontrolovat cache statistiky
curl http://localhost:3001/api/cache/stats

# Vytvořit produkt
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":999,"category":"Test"}'

# Aktualizovat produkt
curl -X PUT http://localhost:3001/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated","price":1999,"category":"Test"}'

# Smazat produkt
curl -X DELETE http://localhost:3001/api/products/1
```

## 📸 Screenshoty

### Hlavní stránka s produkty
*Seznam produktů s vyhledáváním a filtrováním podle kategorií*

### Cache statistiky
*Real-time monitoring cache hits a misses s hit rate*

### Formulář produktu
*Modální okno pro vytvoření nebo editaci produktu*

### Responzivní design
*Aplikace je plně responzivní pro mobilní zařízení*

## 📁 Struktura projektu

```
product-catalog/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── config/         # Konfigurace DB a Redis
│   │   ├── middleware/     # Cache a error handling
│   │   ├── routes/         # API routes
│   │   └── index.js        # Vstupní bod
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # React aplikace
│   ├── src/
│   │   ├── components/     # React komponenty
│   │   ├── App.jsx         # Hlavní komponenta
│   │   └── main.jsx        # Vstupní bod
│   ├── Dockerfile
│   ├── nginx.conf          # Nginx konfigurace
│   └── package.json
│
├── database/               # SQL skripty
│   └── init.sql            # Inicializace a seed data
│
├── docker-compose.yml      # Docker orchestrace
├── .gitignore
└── README.md
```

## 🔧 Proměnné prostředí

### Backend

| Proměnná | Výchozí | Popis |
|----------|---------|-------|
| PORT | 3001 | Port API serveru |
| DB_HOST | postgres | Host PostgreSQL |
| DB_PORT | 5432 | Port PostgreSQL |
| DB_USER | postgres | Uživatel PostgreSQL |
| DB_PASSWORD | postgres123 | Heslo PostgreSQL |
| DB_NAME | product_catalog | Název databáze |
| REDIS_HOST | redis | Host Redis |
| REDIS_PORT | 6379 | Port Redis |
| CACHE_TTL | 600 | TTL cache v sekundách |

## 📝 Licence

MIT License

## 👤 Autor

Martin Pytlík


