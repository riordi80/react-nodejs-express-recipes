// routes/superadmin/users.js
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { requirePermission, auditLog } = require('../../middleware/superAdminMiddleware');

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
 * GET /api/superadmin/users
 * Listar todos los superadministradores
 */
router.get('/', requirePermission('manage_superadmins'), async (req, res) => {
    try {
        const [users] = await masterPool.execute(`
            SELECT 
                u.user_id, u.email, u.first_name, u.last_name, u.is_super_admin,
                u.superadmin_role, u.is_active, u.created_at, u.last_login_at,
                u.last_superadmin_login_at, u.failed_login_attempts,
                GROUP_CONCAT(p.permission_type) as permissions
            FROM MASTER_USERS u
            LEFT JOIN SUPERADMIN_PERMISSIONS p ON u.user_id = p.user_id
            WHERE u.is_super_admin = TRUE
            GROUP BY u.user_id
            ORDER BY u.created_at DESC
        `);

        // Procesar permisos
        const processedUsers = users.map(user => ({
            ...user,
            permissions: user.permissions ? user.permissions.split(',') : []
        }));

        res.json({
            success: true,
            data: processedUsers
        });

    } catch (error) {
        console.error('Error obteniendo lista de superadmins:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener lista de superadministradores'
        });
    }
});

/**
 * POST /api/superadmin/users
 * Crear nuevo superadministrador
 */
router.post('/', requirePermission('manage_superadmins'), auditLog('create_superadmin'), async (req, res) => {
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            superadmin_role,
            permissions = []
        } = req.body;

        // Validaciones
        if (!email || !password || !first_name || !last_name || !superadmin_role) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Todos los campos son requeridos'
            });
        }

        // Verificar que el email no exista
        const [existingUser] = await masterPool.execute(
            'SELECT user_id FROM MASTER_USERS WHERE email = ?',
            [email.toLowerCase()]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                error: 'Email ya existe',
                message: 'Ya existe un usuario con este email'
            });
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 12);

        // Crear usuario
        const [result] = await masterPool.execute(`
            INSERT INTO MASTER_USERS (
                tenant_id, email, password_hash, first_name, last_name,
                role, is_super_admin, superadmin_role, is_active
            ) VALUES (
                'superadmin', ?, ?, ?, ?, 'admin', TRUE, ?, TRUE
            )
        `, [email.toLowerCase(), passwordHash, first_name, last_name, superadmin_role]);

        const newUserId = result.insertId;

        // Asignar permisos
        if (permissions.length > 0) {
            const permissionValues = permissions.map(permission => 
                [newUserId, permission, req.superAdmin.user_id]
            );

            await masterPool.execute(`
                INSERT INTO SUPERADMIN_PERMISSIONS (user_id, permission_type, granted_by)
                VALUES ${permissions.map(() => '(?, ?, ?)').join(', ')}
            `, permissionValues.flat());
        }

        res.json({
            success: true,
            message: 'Superadministrador creado correctamente',
            data: {
                user_id: newUserId,
                email,
                first_name,
                last_name,
                superadmin_role,
                permissions
            }
        });

    } catch (error) {
        console.error('Error creando superadmin:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al crear superadministrador'
        });
    }
});

module.exports = router;