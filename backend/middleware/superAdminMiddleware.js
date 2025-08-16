// middleware/superAdminMiddleware.js
const mysql = require('mysql2/promise');

// Pool de conexiones a la base de datos maestra - con configuración idéntica al sistema tenant
const masterPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'recetario_master',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    idleTimeout: 600000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Agregar manejo de errores para el pool
masterPool.on('error', (err) => {
    console.error('SuperAdmin MySQL pool error:', err);
});

/**
 * Middleware para verificar que el usuario es superadmin
 * Maneja su propia autenticación con tokens SuperAdmin
 */
async function requireSuperAdmin(req, res, next) {
    try {
        const jwt = require('jsonwebtoken');
        
        // 1. Verificar token de SuperAdmin en cookies
        const token = req.cookies.superadmin_token;
        console.log(`🔍 Verificando autenticación SuperAdmin para ${req.method} ${req.path}`);
        console.log('Token encontrado:', !!token);
        
        if (!token) {
            console.error(`❌ Token SuperAdmin no encontrado para ${req.method} ${req.path}`);
            console.error('Cookies disponibles:', Object.keys(req.cookies || {}));
            return res.status(401).json({ 
                error: 'No autenticado',
                message: 'Debe iniciar sesión para acceder al panel de administración',
                code: 'AUTH_REQUIRED'
            });
        }

        // 2. Verificar y decodificar token JWT
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            return res.status(401).json({
                error: 'Token inválido',
                message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente',
                code: 'TOKEN_INVALID'
            });
        }

        // 3. Verificar que es superadmin en la base de datos maestra
        const [rows] = await masterPool.execute(
            'SELECT user_id, email, first_name, last_name, is_super_admin, superadmin_role FROM MASTER_USERS WHERE user_id = ? AND is_super_admin = TRUE AND is_active = TRUE',
            [decoded.user_id]
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
            [decoded.user_id]
        );

        const userPermissions = permissions.map(p => p.permission_type);

        // 5. Agregar información de superadmin al request
        req.superAdmin = {
            ...superAdminUser,
            permissions: userPermissions
        };

        console.log(`✅ SuperAdmin autenticado: ${superAdminUser.email} (ID: ${superAdminUser.user_id}) para ${req.method} ${req.path}`);
        console.log(`🔍 req.superAdmin configurado:`, {
            user_id: req.superAdmin.user_id,
            email: req.superAdmin.email,
            permissions: req.superAdmin.permissions
        });

        // 6. Actualizar último login de superadmin
        await masterPool.execute(
            'UPDATE MASTER_USERS SET last_superadmin_login_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [decoded.user_id]
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
        console.log(`🔐 Verificando permisos para ${req.method} ${req.path}`);
        console.log(`🔍 req.superAdmin disponible:`, !!req.superAdmin);
        
        if (!req.superAdmin) {
            console.error('❌ req.superAdmin no está disponible en requirePermission');
            return res.status(500).json({
                error: 'Error de configuración',
                message: 'Middleware requireSuperAdmin debe ejecutarse antes que requirePermission',
                code: 'MIDDLEWARE_ORDER_ERROR'
            });
        }

        console.log(`👤 Usuario actual: ${req.superAdmin.email} (${req.superAdmin.user_id})`);

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
        // Validar que req.superAdmin existe antes de usarlo
        if (!req.superAdmin) {
            console.error('❌ Error en audit log: req.superAdmin no está disponible');
            console.error('Path:', req.path);
            console.error('Method:', req.method);
            console.error('User:', req.user ? `${req.user.email} (${req.user.user_id})` : 'No user');
            
            // No fallar la operación, solo registrar el error
            return;
        }

        if (!req.superAdmin.user_id) {
            console.error('❌ Error en audit log: req.superAdmin.user_id no está disponible');
            console.error('req.superAdmin keys:', Object.keys(req.superAdmin));
            console.error('req.superAdmin:', JSON.stringify(req.superAdmin, null, 2));
            
            // No fallar la operación, solo registrar el error
            return;
        }

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

        console.log(`📝 Registrando audit log: ${actionType} por usuario ${req.superAdmin.user_id}`);

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

        console.log(`✅ Audit log registrado exitosamente: ${actionType}`);

    } catch (error) {
        console.error('Error guardando audit log:', error);
        console.error('Stack:', error.stack);
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