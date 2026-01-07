# Changelog - Personalizované doporučování produktů

## Přidané funkce

### 🎯 Sledování návštěv uživatelů
- **Redis Sorted Set** pro ukládání historie prohlížení produktů
- Každá návštěva produktu je zaznamenána s časovým razítkem
- Automatické čištění - uchovává se pouze posledních 50 návštěv
- Expirace dat po 30 dnech

### 👁️ Nedávno navštívené produkty
- Nový endpoint `/api/products/recommendations/recent`
- Zobrazení až 6 naposledy navštívených produktů
- Seřazeno od nejnovějších

### 💡 Inteligentní doporučování
- Nový endpoint `/api/products/recommendations/suggested`
- Sledování zájmů uživatele podle kategorií navštívených produktů
- Doporučení produktů ze stejných kategorií
- Vyloučení již zobrazených produktů
- Randomizace pro rozmanitost doporučení

### 🔧 Technická implementace

#### Backend změny
1. **cache.js** - Nové funkce:
   - `trackProductVisit()` - Zaznamenání návštěvy produktu
   - `getRecentVisits()` - Získání historie návštěv
   - `getUserInterests()` - Získání zájmů uživatele
   - `updateUserInterests()` - Aktualizace zájmů podle kategorie

2. **routes/products.js** - Nové endpointy:
   - `GET /api/products/recommendations/recent`
   - `GET /api/products/recommendations/suggested`
   - Automatické sledování návštěv při `GET /api/products/:id`

#### Frontend změny
1. **App.jsx** - Integrace s backendem:
   - Generování unikátního user ID
   - Načítání nedávno navštívených produktů z API
   - Načítání doporučených produktů z API
   - Automatická aktualizace doporučení

2. **Recommendations.jsx** - Již existující komponenta nyní využívá:
   - Data z backendu místo localStorage
   - Zobrazení obou sekcí (nedávno zobrazené + doporučení)

### 📊 Redis struktury

```
# Historie návštěv (Sorted Set)
user:{userId}:recent
  - Score: timestamp
  - Value: productId
  - Expirace: 30 dní
  - Kapacita: 50 položek

# Zájmy uživatele (JSON String)
user:{userId}:interests
  - Obsah: [{ category, count }, ...]
  - Expirace: 30 dní
  - Kapacita: Top 10 kategorií
```

### 🚀 Jak to funguje

1. **Uživatel klikne na "Cache test"** u produktu
2. Backend zavolá `trackProductVisit(userId, productId)`
3. Produkt se přidá do `user:{userId}:recent` sorted set
4. Kategorie produktu se zaznamená do `user:{userId}:interests`
5. Frontend načte aktualizovaná doporučení
6. Zobrazí se sekce "Nedávno zobrazené" a "Mohlo by se vám líbit"

### 📝 Příklady API volání

```bash
# Návštěva produktu (automatické sledování)
curl http://localhost:3001/api/products/1 \
  -H "x-user-id: user123"

# Nedávno navštívené
curl http://localhost:3001/api/products/recommendations/recent \
  -H "x-user-id: user123"

# Doporučené produkty
curl http://localhost:3001/api/products/recommendations/suggested \
  -H "x-user-id: user123"
```

## Testování

1. Spusťte aplikaci: `docker-compose up --build -d`
2. Otevřete http://localhost:3000
3. Klikněte na "Cache test" u několika produktů
4. Sledujte sekci "Nedávno zobrazené" - objeví se produkty, které jste navštívili
5. Sledujte sekci "Mohlo by se vám líbit" - objeví se podobné produkty

## Budoucí vylepšení

- [ ] Collaborative filtering - doporučování na základě podobných uživatelů
- [ ] Váhování doporučení podle času (novější návštěvy mají větší váhu)
- [ ] A/B testování různých algoritmů doporučování
- [ ] Tracking konverzí (které doporučení vedlo k nákupu)
- [ ] Machine learning modely pro přesnější predikce
