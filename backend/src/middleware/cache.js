/**
 * Cache middleware pro práci s Redis
 * Poskytuje funkce pro čtení a zápis do cache
 */

const { getCacheTTL } = require('../config/database');

/**
 * Generuje klíč pro cache produktu
 * 
 * @param {number} productId - ID produktu
 * @returns {string} Cache klíč
 */
function getProductCacheKey(productId) {
    return `product:${productId}`;
}

/**
 * Generuje klíč pro cache seznamu produktů
 * 
 * @param {Object} params - Parametry dotazu (stránkování, vyhledávání)
 * @returns {string} Cache klíč
 */
function getProductListCacheKey(params = {}) {
    const { page = 1, limit = 10, search = '', category = '' } = params;
    return `products:list:${page}:${limit}:${search}:${category}`;
}

/**
 * Získá produkt z cache
 * 
 * @param {RedisClient} redis - Redis klient
 * @param {number} productId - ID produktu
 * @param {Object} cacheStats - Objekt pro statistiky cache
 * @returns {Object|null} Produkt z cache nebo null
 */
async function getProductFromCache(redis, productId, cacheStats) {
    try {
        const key = getProductCacheKey(productId);
        const cached = await redis.get(key);
        
        if (cached) {
            // Cache HIT
            cacheStats.hits++;
            console.log(`📗 Cache HIT pro produkt ID: ${productId}`);
            return {
                data: JSON.parse(cached),
                fromCache: true
            };
        }
        
        // Cache MISS
        cacheStats.misses++;
        console.log(`📕 Cache MISS pro produkt ID: ${productId}`);
        return null;
    } catch (error) {
        console.error('Chyba při čtení z cache:', error);
        cacheStats.misses++;
        return null;
    }
}

/**
 * Uloží produkt do cache
 * 
 * @param {RedisClient} redis - Redis klient
 * @param {number} productId - ID produktu
 * @param {Object} product - Data produktu
 */
async function setProductInCache(redis, productId, product) {
    try {
        const key = getProductCacheKey(productId);
        const ttl = getCacheTTL();
        
        await redis.setEx(key, ttl, JSON.stringify(product));
        console.log(`💾 Produkt ID: ${productId} uložen do cache (TTL: ${ttl}s)`);
    } catch (error) {
        console.error('Chyba při ukládání do cache:', error);
    }
}

/**
 * Invaliduje (smaže) produkt z cache
 * Volá se při aktualizaci nebo smazání produktu
 * 
 * @param {RedisClient} redis - Redis klient
 * @param {number} productId - ID produktu
 */
async function invalidateProductCache(redis, productId) {
    try {
        const key = getProductCacheKey(productId);
        await redis.del(key);
        
        // Smazání všech cache klíčů pro seznamy produktů
        const listKeys = await redis.keys('products:list:*');
        if (listKeys.length > 0) {
            await redis.del(listKeys);
        }
        
        console.log(`🗑️  Cache invalidována pro produkt ID: ${productId}`);
    } catch (error) {
        console.error('Chyba při invalidaci cache:', error);
    }
}

/**
 * Získá seznam produktů z cache
 * 
 * @param {RedisClient} redis - Redis klient
 * @param {Object} params - Parametry dotazu
 * @param {Object} cacheStats - Objekt pro statistiky cache
 * @returns {Object|null} Seznam produktů z cache nebo null
 */
async function getProductListFromCache(redis, params, cacheStats) {
    try {
        const key = getProductListCacheKey(params);
        const cached = await redis.get(key);
        
        if (cached) {
            cacheStats.hits++;
            console.log(`📗 Cache HIT pro seznam produktů`);
            return {
                data: JSON.parse(cached),
                fromCache: true
            };
        }
        
        cacheStats.misses++;
        console.log(`📕 Cache MISS pro seznam produktů`);
        return null;
    } catch (error) {
        console.error('Chyba při čtení seznamu z cache:', error);
        cacheStats.misses++;
        return null;
    }
}

/**
 * Uloží seznam produktů do cache
 * 
 * @param {RedisClient} redis - Redis klient
 * @param {Object} params - Parametry dotazu
 * @param {Object} data - Data seznamu produktů
 */
async function setProductListInCache(redis, params, data) {
    try {
        const key = getProductListCacheKey(params);
        const ttl = getCacheTTL();
        
        await redis.setEx(key, ttl, JSON.stringify(data));
        console.log(`💾 Seznam produktů uložen do cache (TTL: ${ttl}s)`);
    } catch (error) {
        console.error('Chyba při ukládání seznamu do cache:', error);
    }
}

/**
 * Ukládá návštěvu produktu do Redis (Sorted Set s časovým razítkem)
 * 
 * @param {RedisClient} redis - Redis klient
 * @param {string} userId - ID uživatele (např. session ID nebo IP)
 * @param {number} productId - ID produktu
 */
async function trackProductVisit(redis, userId, productId) {
    try {
        const key = `user:${userId}:recent`;
        const timestamp = Date.now();
        
        // Přidání produktu do sorted setu s časovým razítkem jako score
        await redis.zAdd(key, { score: timestamp, value: productId.toString() });
        
        // Zachování pouze posledních 50 návštěv
        await redis.zRemRangeByRank(key, 0, -51);
        
        // Nastavení expirace klíče na 30 dní
        await redis.expire(key, 30 * 24 * 60 * 60);
        
        console.log(`👁️  Uživatel ${userId} navštívil produkt ID: ${productId}`);
    } catch (error) {
        console.error('Chyba při sledování návštěvy:', error);
    }
}

/**
 * Získá nedávno navštívené produkty uživatele
 * 
 * @param {RedisClient} redis - Redis klient
 * @param {string} userId - ID uživatele
 * @param {number} limit - Maximální počet produktů
 * @returns {Array} Pole ID produktů
 */
async function getRecentVisits(redis, userId, limit = 6) {
    try {
        const key = `user:${userId}:recent`;
        // Získání nejnovějších návštěv (od nejvyššího score)
        const productIds = await redis.zRange(key, 0, limit - 1, { REV: true });
        return productIds.map(id => parseInt(id));
    } catch (error) {
        console.error('Chyba při získávání nedávných návštěv:', error);
        return [];
    }
}

/**
 * Získá kategorie ze sledovaných produktů pro doporučení
 * 
 * @param {RedisClient} redis - Redis klient
 * @param {string} userId - ID uživatele
 * @returns {Array} Pole kategorií
 */
async function getUserInterests(redis, userId) {
    try {
        const key = `user:${userId}:interests`;
        const cached = await redis.get(key);
        
        if (cached) {
            return JSON.parse(cached);
        }
        return [];
    } catch (error) {
        console.error('Chyba při získávání zájmů uživatele:', error);
        return [];
    }
}

/**
 * Aktualizuje záznamy o zájmech uživatele na základě navštíveného produktu
 * 
 * @param {RedisClient} redis - Redis klient
 * @param {string} userId - ID uživatele
 * @param {string} category - Kategorie produktu
 */
async function updateUserInterests(redis, userId, category) {
    try {
        const key = `user:${userId}:interests`;
        const interests = await getUserInterests(redis, userId);
        
        // Přidání nebo inkrementace kategorie
        const existing = interests.find(i => i.category === category);
        if (existing) {
            existing.count++;
        } else {
            interests.push({ category, count: 1 });
        }
        
        // Seřazení podle počtu a zachování top 10
        interests.sort((a, b) => b.count - a.count);
        const topInterests = interests.slice(0, 10);
        
        // Uložení zpět do Redis
        await redis.setEx(key, 30 * 24 * 60 * 60, JSON.stringify(topInterests));
    } catch (error) {
        console.error('Chyba při aktualizaci zájmů uživatele:', error);
    }
}

module.exports = {
    getProductCacheKey,
    getProductListCacheKey,
    getProductFromCache,
    setProductInCache,
    invalidateProductCache,
    getProductListFromCache,
    setProductListInCache,
    trackProductVisit,
    getRecentVisits,
    getUserInterests,
    updateUserInterests
};

