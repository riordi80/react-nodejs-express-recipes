// middleware/superAdminMiddleware.js
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

/**
 * Middleware para verificar que el usuario es superadmin
 * Debe ejecutarse DESPUÉS del middleware de autenticación normal
 */
async function requireSuperAdmin(req, res, next) {
    try {
        // 1. Verificar autenticación básica
        if (!req.user) {
            return res.status(401).json({ 
                error: 'No autenticado',
                message: 'Debe iniciar sesión para acceder al panel de administración',
                code: 'AUTH_REQUIRED'
            });
        }

        // 2. Verificar que es superadmin en la base de datos maestra
        const [rows] = await masterPool.execute(
            'SELECT user_id, email, first_name, last_name, is_super_admin, superadmin_role FROM MASTER_USERS WHERE user_id = ? AND is_super_admin = TRUE AND is_active = TRUE',
            [req.user.user_id]
        );

        if (rows.length === 0) {
            return res.status(403).json({
                error: 'Acceso denegado',
                message: 'Se requieren permisos de superadministrador para acceder a esta sección',
                code: 'SUPERADMIN_REQUIRED'
            });
        }

        const superAdminUser = rows[0];

        // 3. Verificar que la cuenta no esté bloqueada
        if (superAdminUser.account_locked_until && new Date(superAdminUser.account_locked_until) > new Date()) {
            return res.status(423).json({
                error: 'Cuenta bloqueada',
                message: 'Su cuenta de superadministrador está temporalmente bloqueada',
                code: 'ACCOUNT_LOCKED',
                locked_until: superAdminUser.account_locked_until
            });
        }

        // 4. Cargar permisos específicos del superadmin
        const [permissions] = await masterPool.execute(
            'SELECT permission_type FROM SUPERADMIN_PERMISSIONS WHERE user_id = ?',
            [req.user.user_id]
        );

        const userPermissions = permissions.map(p => p.permission_type);

        // 5. Agregar información de superadmin al request
        req.superAdmin = {
            ...superAdminUser,
            permissions: userPermissions
        };

        // 6. Actualizar último login de superadmin
        await masterPool.execute(
            'UPDATE MASTER_USERS SET last_superadmin_login_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [req.user.user_id]
        );

        next();

    } catch (error) {
        console.error('Error en middleware superadmin:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al verificar permisos de superadministrador',
            code: 'SERVER_ERROR'
        });
    }
}

/**
 * Middleware para verificar permisos específicos de superadmin
 * @param {string|array} requiredPermissions - Permiso(s) requerido(s)
 */
function requirePermission(requiredPermissions) {
    return (req, res, next) => {
        if (!req.superAdmin) {
            return res.status(500).json({
                error: 'Error de configuración',
                message: 'Middleware requireSuperAdmin debe ejecutarse antes que requirePermission',
                code: 'MIDDLEWARE_ORDER_ERROR'
            });
        }

        // Convertir a array si es string
        const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
        
        // Superadmin full tiene acceso a todo
        if (req.superAdmin.superadmin_role === 'super_admin_full') {
            return next();
        }

        // Verificar si tiene alguno de los permisos requeridos
        const hasPermission = permissions.some(permission => 
            req.superAdmin.permissions.includes(permission)
        );

        if (!hasPermission) {
            return res.status(403).json({
                error: 'Permisos insuficientes',
                message: `Se requiere uno de los siguientes permisos: ${permissions.join(', ')}`,
                code: 'INSUFFICIENT_PERMISSIONS',
                required_permissions: permissions,
                user_permissions: req.superAdmin.permissions
            });
        }

        next();
    };
}

/**
 * Middleware para registro de auditoría de acciones de superadmin
 * @param {string} actionType - Tipo de acción realizada
 */
function auditLog(actionType) {
    return async (req, res, next) => {
        // Ejecutar el middleware original
        const originalJson = res.json;
        
        res.json = function(body) {
            // Solo registrar si la operación fue exitosa (status < 400)
            if (res.statusCode < 400) {
                // Registrar auditoría de forma asíncrona
                logAuditAction(req, actionType, body).catch(error => {
                    console.error('Error registrando auditoría:', error);
                });
            }
            
            // Llamar al método original
            return originalJson.call(this, body);
        };

        next();
    };
}

/**
 * Función helper para registrar acciones en audit log
 * @param {object} req - Request object
 * @param {string} actionType - Tipo de acción
 * @param {object} responseBody - Cuerpo de la respuesta
 */
async function logAuditAction(req, actionType, responseBody) {
    try {
        const actionDetails = {
            method: req.method,
            path: req.path,
            query: req.query,
            body: req.body,
            response: responseBody
        };

        // Extraer IDs del request si están disponibles
        const targetTenantId = req.params.tenantId || req.body.tenant_id || null;
        const targetUserId = req.params.userId || req.body.user_id || null;

        await masterPool.execute(`
            INSERT INTO SUPERADMIN_AUDIT_LOG (
                user_id, action_type, target_tenant_id, target_user_id, 
                action_details, ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            req.superAdmin.user_id,
            actionType,
            targetTenantId,
            targetUserId,
            JSON.stringify(actionDetails),
            req.ip || req.connection.remoteAddress,
            req.get('User-Agent') || 'Unknown'
        ]);

    } catch (error) {
        console.error('Error guardando audit log:', error);
    }
}

/**
 * Middleware para rate limiting específico de superadmin
 * Límite más estricto para operaciones administrativas
 */
const superAdminRateLimit = {};

function rateLimitSuperAdmin(windowMs = 15 * 60 * 1000, maxRequests = 100) {
    return (req, res, next) => {
        const userId = req.superAdmin?.user_id;
        if (!userId) return next();

        const now = Date.now();
        const windowStart = now - windowMs;

        // Inicializar tracking para este usuario si no existe
        if (!superAdminRateLimit[userId]) {
            superAdminRateLimit[userId] = [];
        }

        // Limpiar requests antiguos
        superAdminRateLimit[userId] = superAdminRateLimit[userId].filter(
            timestamp => timestamp > windowStart
        );

        // Verificar límite
        if (superAdminRateLimit[userId].length >= maxRequests) {
            return res.status(429).json({
                error: 'Demasiadas solicitudes',
                message: `Límite de ${maxRequests} solicitudes por ${windowMs / 60000} minutos excedido`,
                code: 'RATE_LIMIT_EXCEEDED',
                retry_after: Math.ceil((superAdminRateLimit[userId][0] + windowMs - now) / 1000)
            });
        }

        // Registrar esta solicitud
        superAdminRateLimit[userId].push(now);
        next();
    };
}

/**
 * Helper para verificar si un usuario tiene un permiso específico
 * @param {object} superAdminUser - Usuario superadmin
 * @param {string} permission - Permiso a verificar
 */
function hasPermission(superAdminUser, permission) {
    if (!superAdminUser) return false;
    if (superAdminUser.superadmin_role === 'super_admin_full') return true;
    return superAdminUser.permissions && superAdminUser.permissions.includes(permission);
}

/**
 * Helper para obtener permisos basados en el rol
 * @param {string} role - Rol del superadmin
 */
function getPermissionsByRole(role) {
    const rolePermissions = {
        'super_admin_full': ['create_tenants', 'delete_tenants', 'manage_billing', 'access_monitoring', 'manage_superadmins', 'impersonate_tenants', 'configure_system'],
        'super_admin_read': ['access_monitoring'],
        'super_admin_billing': ['manage_billing'],
        'super_admin_support': ['impersonate_tenants', 'access_monitoring'],
        'super_admin_dev': ['access_monitoring', 'configure_system']
    };

    return rolePermissions[role] || [];
}

module.exports = {
    requireSuperAdmin,
    requirePermission,
    auditLog,
    rateLimitSuperAdmin,
    hasPermission,
    getPermissionsByRole,
    logAuditAction
};