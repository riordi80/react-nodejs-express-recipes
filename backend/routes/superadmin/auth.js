// routes/superadmin/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { requireSuperAdmin, auditLog } = require('../../middleware/superAdminMiddleware');

const router = express.Router();

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
 * POST /api/superadmin/auth/login
 * Login específico para superadministradores
 */
router.post('/login', auditLog('superadmin_login'), async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario superadmin
        const [rows] = await masterPool.execute(`
            SELECT user_id, email, password_hash, first_name, last_name, 
                   is_super_admin, superadmin_role, failed_login_attempts, 
                   account_locked_until
            FROM MASTER_USERS 
            WHERE email = ? AND is_super_admin = TRUE AND is_active = TRUE
        `, [email.toLowerCase()]);

        if (rows.length === 0) {
            // Log intento de login fallido
            await masterPool.execute(`
                INSERT INTO LOGIN_AUDIT (email, ip_address, user_agent, success, failure_reason)
                VALUES (?, ?, ?, FALSE, 'Usuario no encontrado o no es superadmin')
            `, [email, req.ip, req.get('User-Agent') || 'Unknown']);

            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos'
            });
        }

        const user = rows[0];

        // Verificar si la cuenta está bloqueada
        if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
            return res.status(423).json({
                error: 'Cuenta bloqueada',
                message: 'Cuenta temporalmente bloqueada por múltiples intentos fallidos',
                locked_until: user.account_locked_until
            });
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            // Incrementar intentos fallidos
            const newAttempts = (user.failed_login_attempts || 0) + 1;
            let lockUntil = null;

            // Bloquear cuenta después de 5 intentos fallidos
            if (newAttempts >= 5) {
                lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
            }

            await masterPool.execute(`
                UPDATE MASTER_USERS 
                SET failed_login_attempts = ?, account_locked_until = ?
                WHERE user_id = ?
            `, [newAttempts, lockUntil, user.user_id]);

            // Log intento fallido
            await masterPool.execute(`
                INSERT INTO LOGIN_AUDIT (email, ip_address, user_agent, success, failure_reason)
                VALUES (?, ?, ?, FALSE, 'Contraseña incorrecta')
            `, [email, req.ip, req.get('User-Agent') || 'Unknown']);

            return res.status(401).json({
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos',
                attempts_remaining: Math.max(0, 5 - newAttempts)
            });
        }

        // Login exitoso - resetear intentos fallidos
        await masterPool.execute(`
            UPDATE MASTER_USERS 
            SET failed_login_attempts = 0, account_locked_until = NULL, 
                last_login_at = CURRENT_TIMESTAMP, last_superadmin_login_at = CURRENT_TIMESTAMP
            WHERE user_id = ?
        `, [user.user_id]);

        // Cargar permisos del usuario
        const [permissions] = await masterPool.execute(
            'SELECT permission_type FROM SUPERADMIN_PERMISSIONS WHERE user_id = ?',
            [user.user_id]
        );

        const userPermissions = permissions.map(p => p.permission_type);

        // Crear JWT token
        const tokenPayload = {
            user_id: user.user_id,
            email: user.email,
            is_super_admin: true,
            superadmin_role: user.superadmin_role,
            permissions: userPermissions
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { 
            expiresIn: '24h' 
        });

        // Configurar cookie HTTP-only
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 24 horas
            path: '/'
        };

        res.cookie('superadmin_token', token, cookieOptions);

        // Log login exitoso
        await masterPool.execute(`
            INSERT INTO LOGIN_AUDIT (email, user_id, ip_address, user_agent, success)
            VALUES (?, ?, ?, ?, TRUE)
        `, [email, user.user_id, req.ip, req.get('User-Agent') || 'Unknown']);

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Login exitoso',
            user: {
                user_id: user.user_id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                superadmin_role: user.superadmin_role,
                permissions: userPermissions
            }
        });

    } catch (error) {
        console.error('Error en login de superadmin:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error interno durante el login'
        });
    }
});

/**
 * POST /api/superadmin/auth/logout
 * Logout para superadministradores
 */
router.post('/logout', auditLog('superadmin_logout'), (req, res) => {
    try {
        // Limpiar cookie
        res.clearCookie('superadmin_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/'
        });

        res.json({
            success: true,
            message: 'Logout exitoso'
        });

    } catch (error) {
        console.error('Error en logout de superadmin:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error durante el logout'
        });
    }
});

/**
 * GET /api/superadmin/auth/me
 * Verificar estado de autenticación del superadmin
 */
router.get('/me', requireSuperAdmin, (req, res) => {
    res.json({
        authenticated: true,
        user: {
            user_id: req.superAdmin.user_id,
            email: req.superAdmin.email,
            first_name: req.superAdmin.first_name,
            last_name: req.superAdmin.last_name,
            superadmin_role: req.superAdmin.superadmin_role,
            permissions: req.superAdmin.permissions,
            last_login: req.superAdmin.last_superadmin_login_at
        }
    });
});

/**
 * POST /api/superadmin/auth/change-password
 * Cambiar contraseña del superadmin
 */
router.post('/change-password', auditLog('change_password'), async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Contraseña actual y nueva son requeridas'
            });
        }

        if (new_password.length < 8) {
            return res.status(400).json({
                error: 'Contraseña inválida',
                message: 'La nueva contraseña debe tener al menos 8 caracteres'
            });
        }

        // Obtener contraseña actual
        const [rows] = await masterPool.execute(
            'SELECT password_hash FROM MASTER_USERS WHERE user_id = ?',
            [req.superAdmin.user_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Verificar contraseña actual
        const isValidPassword = await bcrypt.compare(current_password, rows[0].password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Contraseña incorrecta',
                message: 'La contraseña actual no es correcta'
            });
        }

        // Hashear nueva contraseña
        const newPasswordHash = await bcrypt.hash(new_password, 12);

        // Actualizar contraseña
        await masterPool.execute(
            'UPDATE MASTER_USERS SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [newPasswordHash, req.superAdmin.user_id]
        );

        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al cambiar la contraseña'
        });
    }
});

module.exports = router;