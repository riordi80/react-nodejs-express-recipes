// middleware/tenant/index.js
const { resolveTenant, extractSubdomain, clearTenantCache, getTenantBySubdomain } = require('./tenantResolver');
const { 
    getTenantPool, 
    attachTenantDatabase, 
    checkTenantDatabase, 
    createTenantDatabase,
    closeTenantPool,
    closeAllTenantPools,
    getTenantPoolStats 
} = require('./databaseManager');

/**
 * Middleware completo para manejo de multi-tenant
 * Combina resolución de tenant y adjuntar base de datos
 */
function tenantMiddleware(req, res, next) {
    // Primero resolver el tenant, luego adjuntar la base de datos
    resolveTenant(req, res, (error) => {
        if (error) return next(error);
        
        attachTenantDatabase(req, res, next);
    });
}

/**
 * Middleware solo para resolución de tenant (sin base de datos)
 * Útil para endpoints que solo necesitan información del tenant
 */
function tenantResolverOnly(req, res, next) {
    return resolveTenant(req, res, next);
}

module.exports = {
    // Middleware principal
    tenantMiddleware,
    tenantResolverOnly,
    
    // Funciones de resolución de tenant
    resolveTenant,
    extractSubdomain,
    clearTenantCache,
    getTenantBySubdomain,
    
    // Funciones de gestión de base de datos
    getTenantPool,
    attachTenantDatabase,
    checkTenantDatabase,
    createTenantDatabase,
    closeTenantPool,
    closeAllTenantPools,
    getTenantPoolStats
};