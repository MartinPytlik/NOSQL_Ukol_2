/**
 * Router pro produktové endpointy
 * CRUD operace s Redis cache logikou
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();
const {
    getProductFromCache,
    setProductInCache,
    invalidateProductCache,
    getProductListFromCache,
    setProductListInCache,
    trackProductVisit,
    getRecentVisits,
    getUserInterests,
    updateUserInterests
} = require('../middleware/cache');
const { createError } = require('../middleware/errorHandler');

/**
 * Validace pro vytvoření/aktualizaci produktu
 */
const productValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Název produktu je povinný')
        .isLength({ max: 255 }).withMessage('Název může mít maximálně 255 znaků'),
    body('description')
        .optional()
        .trim(),
    body('price')
        .notEmpty().withMessage('Cena je povinná')
        .isFloat({ min: 0 }).withMessage('Cena musí být kladné číslo'),
    body('category')
        .trim()
        .notEmpty().withMessage('Kategorie je povinná')
        .isLength({ max: 100 }).withMessage('Kategorie může mít maximálně 100 znaků'),
    body('image_url')
        .optional()
        .trim()
        .isURL().withMessage('Neplatná URL adresa obrázku'),
    body('stock_quantity')
        .optional()
        .isInt({ min: 0 }).withMessage('Množství na skladě musí být nezáporné celé číslo')
];

/**
 * Pomocná funkce pro zpracování validačních chyb
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validační chyba',
            details: errors.array().map(e => ({
                field: e.path,
                message: e.msg
            }))
        });
    }
    next();
}

/**
 * GET /api/products
 * Získá seznam všech produktů s podporou stránkování a vyhledávání
 * 
 * Query parametry:
 * - page: číslo stránky (default: 1)
 * - limit: počet položek na stránku (default: 10, max: 100)
 * - search: vyhledávací text v názvu
 * - category: filtr podle kategorie
 */
router.get('/', [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().trim(),
    query('category').optional().trim()
], handleValidationErrors, async (req, res, next) => {
    try {
        const { db, redis, cacheStats } = req;
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const search = req.query.search || '';
        const category = req.query.category || '';
        const offset = (page - 1) * limit;

        // Pokus o získání z cache
        const cacheParams = { page, limit, search, category };
        const cached = await getProductListFromCache(redis, cacheParams, cacheStats);
        
        if (cached) {
            return res.json({
                success: true,
                fromCache: true,
                ...cached.data
            });
        }

        // Sestavení SQL dotazu s filtry
        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            whereConditions.push(`LOWER(name) LIKE LOWER($${paramIndex})`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        if (category) {
            whereConditions.push(`category = $${paramIndex}`);
            queryParams.push(category);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}` 
            : '';

        // Dotaz pro počet záznamů
        const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`;
        const countResult = await db.query(countQuery, queryParams);
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        // Dotaz pro produkty
        const productsQuery = `
            SELECT * FROM products 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        queryParams.push(limit, offset);
        
        const result = await db.query(productsQuery, queryParams);

        // Data pro odpověď
        const responseData = {
            data: result.rows,
            pagination: {
                page,
                limit,
                totalItems,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };

        // Uložení do cache
        await setProductListInCache(redis, cacheParams, responseData);

        res.json({
            success: true,
            fromCache: false,
            ...responseData
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/products/categories
 * Získá seznam všech kategorií
 */
router.get('/categories', async (req, res, next) => {
    try {
        const { db } = req;
        
        const result = await db.query(`
            SELECT DISTINCT category, COUNT(*) as count
            FROM products
            GROUP BY category
            ORDER BY category
        `);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/products/recommendations/recent
 * Získá nedávno navštívené produkty uživatele
 */
router.get('/recommendations/recent', async (req, res, next) => {
    try {
        const { db, redis } = req;
        const userId = req.headers['x-user-id'] || req.ip || 'anonymous';
        const limit = parseInt(req.query.limit) || 6;

        // Získání ID nedávno navštívených produktů z Redis
        const recentProductIds = await getRecentVisits(redis, userId, limit);
        
        if (recentProductIds.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Načtení detailů produktů z databáze
        const placeholders = recentProductIds.map((_, i) => `$${i + 1}`).join(',');
        const result = await db.query(
            `SELECT * FROM products WHERE id IN (${placeholders})`,
            recentProductIds
        );

        // Seřazení podle pořadí v recentProductIds
        const orderedProducts = recentProductIds
            .map(id => result.rows.find(p => p.id === id))
            .filter(p => p !== undefined);

        res.json({
            success: true,
            data: orderedProducts
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/products/recommendations/suggested
 * Získá doporučené produkty na základě zájmů uživatele
 */
router.get('/recommendations/suggested', async (req, res, next) => {
    try {
        const { db, redis } = req;
        const userId = req.headers['x-user-id'] || req.ip || 'anonymous';
        const limit = parseInt(req.query.limit) || 6;

        // Získání zájmů uživatele (kategorie)
        const interests = await getUserInterests(redis, userId);
        
        // Získání nedávno navštívených produktů pro vyloučení
        const recentProductIds = await getRecentVisits(redis, userId, 20);

        let products = [];

        if (interests.length > 0) {
            // Produkty z preferovaných kategorií
            const topCategories = interests.slice(0, 3).map(i => i.category);
            const placeholders = topCategories.map((_, i) => `$${i + 1}`).join(',');
            
            let query = `SELECT * FROM products WHERE category IN (${placeholders})`;
            let params = [...topCategories];
            
            // Vyloučení nedávno navštívených
            if (recentProductIds.length > 0) {
                const excludePlaceholders = recentProductIds.map((_, i) => `$${topCategories.length + i + 1}`).join(',');
                query += ` AND id NOT IN (${excludePlaceholders})`;
                params = [...params, ...recentProductIds];
            }
            
            query += ` ORDER BY RANDOM() LIMIT $${params.length + 1}`;
            params.push(limit);
            
            const result = await db.query(query, params);
            products = result.rows;
        }

        // Pokud nemáme dost produktů, doplníme náhodnými
        if (products.length < limit) {
            const existingIds = [...recentProductIds, ...products.map(p => p.id)];
            let query = 'SELECT * FROM products';
            let params = [];
            
            if (existingIds.length > 0) {
                const placeholders = existingIds.map((_, i) => `$${i + 1}`).join(',');
                query += ` WHERE id NOT IN (${placeholders})`;
                params = existingIds;
            }
            
            query += ` ORDER BY RANDOM() LIMIT $${params.length + 1}`;
            params.push(limit - products.length);
            
            const result = await db.query(query, params);
            products = [...products, ...result.rows];
        }

        res.json({
            success: true,
            data: products.slice(0, limit)
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/products/:id
 * Získá detail produktu podle ID
 * Využívá Redis cache - nejprve se podívá do cache, pak do DB
 */
router.get('/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID musí být kladné celé číslo')
], handleValidationErrors, async (req, res, next) => {
    try {
        const { db, redis, cacheStats } = req;
        const productId = parseInt(req.params.id);

        // Získání user ID z IP nebo session
        const userId = req.headers['x-user-id'] || req.ip || 'anonymous';

        // Pokus o získání z cache (Cache-Aside pattern)
        const cached = await getProductFromCache(redis, productId, cacheStats);
        
        if (cached) {
            // Sledování návštěvy i při cache hit
            await trackProductVisit(redis, userId, productId);
            if (cached.data.category) {
                await updateUserInterests(redis, userId, cached.data.category);
            }
            
            return res.json({
                success: true,
                fromCache: true,
                data: cached.data
            });
        }

        // Cache MISS - načtení z databáze
        const result = await db.query(
            'SELECT * FROM products WHERE id = $1',
            [productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Produkt nenalezen'
            });
        }

        const product = result.rows[0];

        // Uložení do cache pro příští požadavky
        await setProductInCache(redis, productId, product);

        // Sledování návštěvy
        await trackProductVisit(redis, userId, productId);
        if (product.category) {
            await updateUserInterests(redis, userId, product.category);
        }

        res.json({
            success: true,
            fromCache: false,
            data: product
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/products
 * Vytvoří nový produkt
 */
router.post('/', productValidation, handleValidationErrors, async (req, res, next) => {
    try {
        const { db, redis } = req;
        const { name, description, price, category, image_url, stock_quantity } = req.body;

        const result = await db.query(
            `INSERT INTO products (name, description, price, category, image_url, stock_quantity)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [name, description || null, price, category, image_url || null, stock_quantity || 0]
        );

        const newProduct = result.rows[0];

        // Invalidace cache seznamu produktů
        const listKeys = await redis.keys('products:list:*');
        if (listKeys.length > 0) {
            await redis.del(listKeys);
        }

        console.log(`✨ Vytvořen nový produkt ID: ${newProduct.id}`);

        res.status(201).json({
            success: true,
            message: 'Produkt úspěšně vytvořen',
            data: newProduct
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/products/:id
 * Aktualizuje existující produkt
 * Po aktualizaci invaliduje cache
 */
router.put('/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID musí být kladné celé číslo'),
    ...productValidation
], handleValidationErrors, async (req, res, next) => {
    try {
        const { db, redis } = req;
        const productId = parseInt(req.params.id);
        const { name, description, price, category, image_url, stock_quantity } = req.body;

        // Kontrola existence produktu
        const existCheck = await db.query('SELECT id FROM products WHERE id = $1', [productId]);
        if (existCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Produkt nenalezen'
            });
        }

        // Aktualizace produktu
        const result = await db.query(
            `UPDATE products 
             SET name = $1, description = $2, price = $3, category = $4, 
                 image_url = $5, stock_quantity = $6
             WHERE id = $7
             RETURNING *`,
            [name, description || null, price, category, image_url || null, stock_quantity || 0, productId]
        );

        const updatedProduct = result.rows[0];

        // Invalidace cache produktu i seznamů
        await invalidateProductCache(redis, productId);

        console.log(`📝 Aktualizován produkt ID: ${productId}`);

        res.json({
            success: true,
            message: 'Produkt úspěšně aktualizován',
            data: updatedProduct
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/products/:id
 * Smaže produkt
 * Po smazání invaliduje cache
 */
router.delete('/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID musí být kladné celé číslo')
], handleValidationErrors, async (req, res, next) => {
    try {
        const { db, redis } = req;
        const productId = parseInt(req.params.id);

        // Kontrola existence a smazání
        const result = await db.query(
            'DELETE FROM products WHERE id = $1 RETURNING id, name',
            [productId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Produkt nenalezen'
            });
        }

        // Invalidace cache
        await invalidateProductCache(redis, productId);

        console.log(`🗑️  Smazán produkt ID: ${productId}`);

        res.json({
            success: true,
            message: 'Produkt úspěšně smazán',
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

