/**
 * Hlavní vstupní bod pro backend API
 * Product Catalog s Redis Cache
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { createClient } = require('redis');

// Import routerů a middleware
const productRoutes = require('./routes/products');
const cacheMiddleware = require('./middleware/cache');
const errorHandler = require('./middleware/errorHandler');
const { initializeDatabase, initializeRedis } = require('./config/database');

// Inicializace Express aplikace
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware pro parsování JSON a CORS
app.use(cors());
app.use(express.json());

// Globální proměnné pro databázové připojení
let dbPool = null;
let redisClient = null;

/**
 * Statistiky cache pro monitoring
 * Sleduje počet cache hit a miss pro demonstraci efektivity cachování
 */
const cacheStats = {
    hits: 0,
    misses: 0,
    reset: function() {
        this.hits = 0;
        this.misses = 0;
    },
    getStats: function() {
        const total = this.hits + this.misses;
        return {
            hits: this.hits,
            misses: this.misses,
            total: total,
            hitRate: total > 0 ? ((this.hits / total) * 100).toFixed(2) + '%' : '0%'
        };
    }
};

/**
 * Middleware pro přidání databázových připojení do requestu
 */
app.use((req, res, next) => {
    req.db = dbPool;
    req.redis = redisClient;
    req.cacheStats = cacheStats;
    next();
});

// API Routes
app.use('/api/products', productRoutes);

/**
 * Endpoint pro získání statistik cache
 * GET /api/cache/stats
 */
app.get('/api/cache/stats', (req, res) => {
    res.json({
        success: true,
        data: cacheStats.getStats()
    });
});

/**
 * Endpoint pro reset statistik cache
 * POST /api/cache/reset-stats
 */
app.post('/api/cache/reset-stats', (req, res) => {
    cacheStats.reset();
    res.json({
        success: true,
        message: 'Cache statistiky byly resetovány'
    });
});

/**
 * Endpoint pro vyprázdnění celé cache
 * POST /api/cache/flush
 */
app.post('/api/cache/flush', async (req, res) => {
    try {
        // Smazání všech klíčů s prefixem 'product:'
        const keys = await redisClient.keys('product:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
        
        // Smazání klíče pro seznam produktů
        await redisClient.del('products:all');
        
        res.json({
            success: true,
            message: `Cache vyprázdněna, smazáno ${keys.length + 1} klíčů`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Chyba při vyprazdňování cache'
        });
    }
});

/**
 * Health check endpoint
 * GET /api/health
 */
app.get('/api/health', async (req, res) => {
    try {
        // Test připojení k PostgreSQL
        await dbPool.query('SELECT 1');
        
        // Test připojení k Redis
        await redisClient.ping();
        
        res.json({
            success: true,
            status: 'healthy',
            services: {
                postgres: 'connected',
                redis: 'connected'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Error handling middleware
app.use(errorHandler);

/**
 * Inicializace serveru
 * Připojí se k PostgreSQL a Redis, poté spustí HTTP server
 */
async function startServer() {
    try {
        console.log('🚀 Spouštím Product Catalog Backend...');
        
        // Inicializace PostgreSQL
        console.log('📦 Připojuji k PostgreSQL...');
        dbPool = await initializeDatabase();
        console.log('✅ PostgreSQL připojeno');
        
        // Inicializace Redis
        console.log('🔴 Připojuji k Redis...');
        redisClient = await initializeRedis();
        console.log('✅ Redis připojeno');
        
        // Spuštění HTTP serveru
        app.listen(PORT, () => {
            console.log(`\n🎉 Server běží na portu ${PORT}`);
            console.log(`📊 API dostupné na: http://localhost:${PORT}/api`);
            console.log(`💾 Cache statistiky: http://localhost:${PORT}/api/cache/stats`);
            console.log(`❤️  Health check: http://localhost:${PORT}/api/health\n`);
        });
    } catch (error) {
        console.error('❌ Chyba při spouštění serveru:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\n👋 Ukončuji server...');
    
    if (redisClient) {
        await redisClient.quit();
        console.log('✅ Redis odpojeno');
    }
    
    if (dbPool) {
        await dbPool.end();
        console.log('✅ PostgreSQL odpojeno');
    }
    
    process.exit(0);
});

// Spuštění serveru
startServer();

