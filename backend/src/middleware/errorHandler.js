/**
 * Centrální middleware pro zpracování chyb
 * Zajišťuje konzistentní formát chybových odpovědí
 */

/**
 * Error handling middleware
 * Zachytává všechny chyby a vrací standardizovanou odpověď
 * 
 * @param {Error} err - Chybový objekt
 * @param {Request} req - Express request objekt
 * @param {Response} res - Express response objekt
 * @param {Function} next - Next middleware funkce
 */
function errorHandler(err, req, res, next) {
    // Logování chyby
    console.error('❌ Chyba:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method
    });

    // Určení HTTP status kódu
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Interní chyba serveru';

    // Specifické chyby PostgreSQL
    if (err.code) {
        switch (err.code) {
            case '23505': // Unique violation
                statusCode = 409;
                message = 'Záznam s těmito údaji již existuje';
                break;
            case '23503': // Foreign key violation
                statusCode = 400;
                message = 'Neplatná reference na jiný záznam';
                break;
            case '22P02': // Invalid text representation
                statusCode = 400;
                message = 'Neplatný formát dat';
                break;
            case '23502': // Not null violation
                statusCode = 400;
                message = 'Chybí povinné pole';
                break;
        }
    }

    // Validační chyby z express-validator
    if (err.errors && Array.isArray(err.errors)) {
        statusCode = 400;
        message = 'Validační chyba';
        return res.status(statusCode).json({
            success: false,
            error: message,
            details: err.errors.map(e => ({
                field: e.path || e.param,
                message: e.msg
            }))
        });
    }

    // Standardní odpověď
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && {
            stack: err.stack
        })
    });
}

/**
 * Vytvoří vlastní chybu s HTTP status kódem
 * 
 * @param {string} message - Chybová zpráva
 * @param {number} statusCode - HTTP status kód
 * @returns {Error} Chybový objekt
 */
function createError(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

module.exports = errorHandler;
module.exports.createError = createError;

