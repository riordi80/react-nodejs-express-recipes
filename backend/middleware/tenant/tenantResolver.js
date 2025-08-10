// middleware/tenant/tenantResolver.js
const mysql = require('mysql2/promise');

// Pool de conexiones a la base de datos maestra
const masterPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'recetario_master',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Cache de tenants para evitar consultas repetidas
const tenantCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Middleware para resolver el tenant basado en el subdominio
 * Extrae el tenant_id del subdominio y lo agrega al objeto req
 */
async function resolveTenant(req, res, next) {
    try {
        const hostname = req.get('host') || req.hostname;
        
        // Extraer subdominio
        const subdomain = extractSubdomain(hostname);
        
        if (!subdomain || subdomain === 'www') {
            // Si no hay subdominio o es 'www', redirigir a página principal
            return res.status(400).json({
                error: 'Tenant no especificado',
                message: 'Debe acceder a través de un subdominio válido (ej: restaurante.tuapp.com)',
                code: 'TENANT_REQUIRED'
            });
        }

        // Buscar tenant en cache primero
        const cacheKey = subdomain.toLowerCase();
        const cached = tenantCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            // Usar datos del cache
            req.tenant = cached.data;
            return next();
        }

        // Buscar tenant en la base de datos maestra
        const [rows] = await masterPool.execute(
            'SELECT * FROM TENANTS WHERE subdomain = ? AND is_active = TRUE',
            [subdomain.toLowerCase()]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Tenant no encontrado',
                message: `El tenant '${subdomain}' no existe o está inactivo`,
                code: 'TENANT_NOT_FOUND'
            });
        }

        const tenant = rows[0];

        // Verificar estado de suscripción
        if (tenant.subscription_status === 'suspended') {
            return res.status(403).json({
                error: 'Cuenta suspendida',
                message: 'Esta cuenta ha sido suspendida. Contacte al soporte técnico.',
                code: 'TENANT_SUSPENDED'
            });
        }

        if (tenant.subscription_status === 'cancelled') {
            return res.status(403).json({
                error: 'Cuenta cancelada',
                message: 'Esta cuenta ha sido cancelada.',
                code: 'TENANT_CANCELLED'
            });
        }

        // Agregar información del tenant al request
        req.tenant = {
            tenant_id: tenant.tenant_id,
            subdomain: tenant.subdomain,
            database_name: tenant.database_name,
            business_name: tenant.business_name,
            subscription_plan: tenant.subscription_plan,
            subscription_status: tenant.subscription_status,
            max_users: tenant.max_users,
            max_recipes: tenant.max_recipes,
            max_events: tenant.max_events,
            is_active: tenant.is_active
        };

        // Actualizar cache
        tenantCache.set(cacheKey, {
            data: req.tenant,
            timestamp: Date.now()
        });

        // Actualizar última actividad del tenant
        updateTenantActivity(tenant.tenant_id);

        next();

    } catch (error) {
        console.error('Error resolviendo tenant:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error al resolver el tenant',
            code: 'TENANT_RESOLUTION_ERROR'
        });
    }
}

/**
 * Extrae el subdominio de un hostname
 * @param {string} hostname - El hostname completo
 * @returns {string|null} - El subdominio extraído o null
 */
function extractSubdomain(hostname) {
    if (!hostname) return null;
    
    // Remover puerto si existe
    const cleanHostname = hostname.split(':')[0];
    
    // Para desarrollo local (localhost:port)
    if (cleanHostname === 'localhost' || cleanHostname === '127.0.0.1') {
        return null;
    }
    
    // Dividir por puntos
    const parts = cleanHostname.split('.');
    
    // Para tuapp.com necesitamos al menos 3 partes: subdomain.tuapp.com
    if (parts.length < 3) {
        return null;
    }
    
    // El subdominio es la primera parte
    return parts[0];
}

/**
 * Actualiza la última actividad del tenant de forma asíncrona
 * @param {string} tenantId - ID del tenant
 */
function updateTenantActivity(tenantId) {
    // Ejecutar de forma asíncrona sin bloquear el request
    setImmediate(async () => {
        try {
            await masterPool.execute(
                'UPDATE TENANTS SET last_activity_at = NOW() WHERE tenant_id = ?',
                [tenantId]
            );
        } catch (error) {
            console.error('Error actualizando actividad del tenant:', error);
        }
    });
}

/**
 * Limpia el cache de tenants (útil para testing o updates)
 */
function clearTenantCache() {
    tenantCache.clear();
}

/**
 * Obtiene información de un tenant específico
 * @param {string} subdomain - Subdominio del tenant
 * @returns {Promise<Object|null>} - Datos del tenant o null
 */
async function getTenantBySubdomain(subdomain) {
    try {
        const [rows] = await masterPool.execute(
            'SELECT * FROM TENANTS WHERE subdomain = ? AND is_active = TRUE',
            [subdomain.toLowerCase()]
        );
        
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Error obteniendo tenant:', error);
        return null;
    }
}

module.exports = {
    resolveTenant,
    extractSubdomain,
    clearTenantCache,
    getTenantBySubdomain
};