/**
 * Konfigurace a inicializace databázových připojení
 * PostgreSQL a Redis
 */

const { Pool } = require('pg');
const { createClient } = require('redis');

/**
 * Inicializace PostgreSQL connection pool
 * Vytvoří pool připojení pro efektivní správu databázových spojení
 * 
 * @returns {Pool} PostgreSQL connection pool
 */
async function initializeDatabase() {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres123',
        database: process.env.DB_NAME || 'product_catalog',
        // Nastavení connection pool
        max: 20,                    // Maximální počet připojení
        idleTimeoutMillis: 30000,   // Timeout pro neaktivní připojení
        connectionTimeoutMillis: 2000, // Timeout pro nové připojení
    });

    // Otestování připojení
    try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        return pool;
    } catch (error) {
        console.error('Chyba při připojení k PostgreSQL:', error);
        throw error;
    }
}

/**
 * Inicializace Redis klienta
 * Vytvoří připojení k Redis serveru pro cachování
 * 
 * @returns {RedisClient} Redis klient
 */
async function initializeRedis() {
    const client = createClient({
        socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
        }
    });

    // Event handlery pro Redis
    client.on('error', (err) => {
        console.error('Redis chyba:', err);
    });

    client.on('connect', () => {
        console.log('Redis: Připojování...');
    });

    client.on('ready', () => {
        console.log('Redis: Připraveno k použití');
    });

    // Připojení k Redis
    await client.connect();
    
    return client;
}

/**
 * Získání TTL (Time To Live) pro cache v sekundách
 * Defaultně 10 minut (600 sekund)
 * 
 * @returns {number} TTL v sekundách
 */
function getCacheTTL() {
    return parseInt(process.env.CACHE_TTL) || 600;
}

module.exports = {
    initializeDatabase,
    initializeRedis,
    getCacheTTL
};

