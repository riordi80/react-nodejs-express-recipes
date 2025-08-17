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
    queueLimit: 0,
    idleTimeout: 600000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

/**
 * GET /api/superadmin/users
 * Listar todos los usuarios SuperAdmin con filtros
 */
router.get('/', requirePermission('manage_superadmins'), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            role,
            status = 'active',
            search,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        // Validar parámetros
        const allowedSortFields = ['created_at', 'first_name', 'last_name', 'email', 'superadmin_role', 'last_login_at'];
        const safeSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
        const safeSortOrder = ['asc', 'desc'].includes(sort_order.toLowerCase()) ? sort_order.toUpperCase() : 'DESC';
        const offset = (page - 1) * limit;

        // Construir query base usando solo las columnas que existen en MASTER_USERS
        let baseQuery = `
            SELECT 
                user_id,
                email,
                first_name,
                last_name,
                superadmin_role,
                is_active,
                created_at,
                updated_at,
                last_login_at
            FROM MASTER_USERS 
            WHERE is_super_admin = TRUE
        `;

        // Filtros
        if (status === 'active') {
            baseQuery += ` AND is_active = TRUE`;
        } else if (status === 'inactive') {
            baseQuery += ` AND is_active = FALSE`;
        }

        if (role && role !== 'all') {
            baseQuery += ` AND superadmin_role = '${role.replace(/'/g, "''")}'`;
        }

        if (search) {
            const safeSearch = search.replace(/'/g, "''");
            baseQuery += ` AND (first_name LIKE '%${safeSearch}%' OR last_name LIKE '%${safeSearch}%' OR email LIKE '%${safeSearch}%')`;
        }

        // Query principal
        const mainQuery = `${baseQuery} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ${parseInt(limit)} OFFSET ${offset}`;
        const [users] = await masterPool.query(mainQuery);

        // Contar total
        const countQuery = baseQuery.replace(/SELECT.*?FROM/s, 'SELECT COUNT(*) as total FROM');
        const [countResult] = await masterPool.query(countQuery);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Obtener permisos para cada usuario
        for (let user of users) {
            const [permissions] = await masterPool.query(
                'SELECT permission_type FROM SUPERADMIN_PERMISSIONS WHERE user_id = ?',
                [user.user_id]
            );
            user.permissions = permissions.map(p => p.permission_type);
        }

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    current_page: parseInt(page),
                    per_page: parseInt(limit),
                    total_items: total,
                    total_pages: totalPages,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo lista de SuperAdmins:', error.message);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener lista de SuperAdmins'
        });
    }
});

/**
 * GET /api/superadmin/users/roles
 * Obtener lista de roles disponibles y sus permisos
 */
router.get('/roles', requirePermission('manage_superadmins'), async (req, res) => {
    try {
        const roles = {
            'super_admin_full': {
                name: 'SuperAdmin Completo',
                description: 'Acceso completo a todas las funciones del sistema',
                permissions: ['create_tenants', 'delete_tenants', 'manage_billing', 'access_monitoring', 'manage_superadmins', 'impersonate_tenants', 'configure_system']
            },
            'super_admin_read': {
                name: 'SuperAdmin Solo Lectura',
                description: 'Acceso de solo lectura a monitoreo y estadísticas',
                permissions: ['access_monitoring']
            },
            'super_admin_billing': {
                name: 'SuperAdmin Facturación',
                description: 'Gestión de facturación y planes de suscripción',
                permissions: ['manage_billing']
            },
            'super_admin_support': {
                name: 'SuperAdmin Soporte',
                description: 'Acceso para impersonar tenants y ver monitoreo',
                permissions: ['impersonate_tenants', 'access_monitoring']
            },
            'super_admin_dev': {
                name: 'SuperAdmin Desarrollo',
                description: 'Acceso a configuración del sistema y monitoreo',
                permissions: ['access_monitoring', 'configure_system']
            }
        };

        res.json({
            success: true,
            data: { roles }
        });

    } catch (error) {
        console.error('Error obteniendo roles:', error.message);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener roles'
        });
    }
});

/**
 * POST /api/superadmin/users
 * Crear nuevo usuario SuperAdmin
 */
router.post('/', requirePermission('manage_superadmins'), auditLog('create_superadmin'), async (req, res) => {
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            superadmin_role,
            custom_permissions = []
        } = req.body;

        // Validaciones
        if (!email || !password || !first_name || !last_name || !superadmin_role) {
            return res.status(400).json({
                error: 'Campos requeridos',
                message: 'Email, contraseña, nombre, apellido y rol son requeridos'
            });
        }

        // Verificar que no existe el email
        const [existingUser] = await masterPool.query(
            'SELECT user_id FROM MASTER_USERS WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                error: 'Email ya existe',
                message: 'Ya existe un usuario con este email'
            });
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(12);
        const password_hash = await bcrypt.hash(password, salt);

        // Crear usuario usando query directo
        const insertQuery = `
            INSERT INTO MASTER_USERS (
                email, password_hash, first_name, last_name, 
                is_super_admin, superadmin_role, tenant_id, is_active,
                created_at, updated_at
            ) VALUES (
                '${email.replace(/'/g, "''")}', 
                '${password_hash.replace(/'/g, "''")}', 
                '${first_name.replace(/'/g, "''")}', 
                '${last_name.replace(/'/g, "''")}', 
                TRUE, 
                '${superadmin_role.replace(/'/g, "''")}', 
                NULL, 
                TRUE, 
                NOW(), 
                NOW()
            )
        `;

        const [result] = await masterPool.query(insertQuery);
        const newUserId = result.insertId;

        // Asignar permisos basados en rol
        const { getPermissionsByRole } = require('../../middleware/superAdminMiddleware');
        const rolePermissions = getPermissionsByRole(superadmin_role);
        const finalPermissions = [...rolePermissions, ...custom_permissions];

        // Insertar permisos usando query directo
        if (finalPermissions.length > 0) {
            const permissionValues = finalPermissions.map(permission => 
                `(${newUserId}, '${permission.replace(/'/g, "''")}', ${req.superAdmin.user_id})`
            ).join(', ');

            await masterPool.query(`
                INSERT INTO SUPERADMIN_PERMISSIONS (user_id, permission_type, granted_by)
                VALUES ${permissionValues}
            `);
        }

        // Obtener usuario creado
        const [newUser] = await masterPool.query(`
            SELECT 
                user_id, email, first_name, last_name, superadmin_role, 
                is_active, created_at
            FROM MASTER_USERS 
            WHERE user_id = ${newUserId}
        `);

        const [permissions] = await masterPool.query(
            `SELECT permission_type FROM SUPERADMIN_PERMISSIONS WHERE user_id = ${newUserId}`
        );

        newUser[0].permissions = permissions.map(p => p.permission_type);

        res.status(201).json({
            success: true,
            message: 'Usuario SuperAdmin creado correctamente',
            data: newUser[0]
        });

    } catch (error) {
        console.error('Error creando SuperAdmin:', error.message);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al crear usuario SuperAdmin'
        });
    }
});

/**
 * GET /api/superadmin/users/:userId
 * Obtener detalles de un usuario SuperAdmin específico
 */
router.get('/:userId', requirePermission('manage_superadmins'), async (req, res) => {
    try {
        const { userId } = req.params;

        // Obtener usuario
        const [userRows] = await masterPool.query(`
            SELECT 
                user_id, email, first_name, last_name, superadmin_role, 
                is_active, created_at, updated_at, last_login_at
            FROM MASTER_USERS 
            WHERE user_id = ${parseInt(userId)} AND is_super_admin = TRUE
        `);

        if (userRows.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                message: 'El usuario SuperAdmin especificado no existe'
            });
        }

        const user = userRows[0];

        // Obtener permisos
        const [permissions] = await masterPool.query(
            `SELECT permission_type FROM SUPERADMIN_PERMISSIONS WHERE user_id = ${parseInt(userId)}`
        );
        user.permissions = permissions.map(p => p.permission_type);

        // Obtener actividad reciente
        const [recentActivity] = await masterPool.query(`
            SELECT action_type, performed_at, ip_address, user_agent
            FROM SUPERADMIN_AUDIT_LOG 
            WHERE user_id = ${parseInt(userId)}
            ORDER BY performed_at DESC 
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                user,
                recent_activity: recentActivity
            }
        });

    } catch (error) {
        console.error('Error obteniendo detalles del SuperAdmin:', error.message);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener detalles del usuario'
        });
    }
});

/**
 * PUT /api/superadmin/users/:userId
 * Actualizar usuario SuperAdmin
 */
router.put('/:userId', requirePermission('manage_superadmins'), auditLog('update_superadmin'), async (req, res) => {
    try {
        const { userId } = req.params;
        const {
            first_name,
            last_name,
            superadmin_role,
            is_active,
            custom_permissions = []
        } = req.body;

        // Verificar que existe
        const [existingUser] = await masterPool.query(
            `SELECT user_id, superadmin_role FROM MASTER_USERS WHERE user_id = ${parseInt(userId)} AND is_super_admin = TRUE`
        );

        if (existingUser.length === 0) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // No permitir que se desactive a sí mismo
        if (req.superAdmin.user_id == userId && is_active === false) {
            return res.status(400).json({
                error: 'No puedes desactivarte a ti mismo'
            });
        }

        // Construir actualización usando query directo
        const updateFields = [];

        if (first_name !== undefined) {
            updateFields.push(`first_name = '${first_name.replace(/'/g, "''")}'`);
        }
        if (last_name !== undefined) {
            updateFields.push(`last_name = '${last_name.replace(/'/g, "''")}'`);
        }
        if (superadmin_role !== undefined) {
            updateFields.push(`superadmin_role = '${superadmin_role.replace(/'/g, "''")}'`);
        }
        if (is_active !== undefined) {
            updateFields.push(`is_active = ${is_active ? 'TRUE' : 'FALSE'}`);
        }

        if (updateFields.length > 0) {
            updateFields.push('updated_at = NOW()');

            await masterPool.query(`
                UPDATE MASTER_USERS 
                SET ${updateFields.join(', ')} 
                WHERE user_id = ${parseInt(userId)}
            `);
        }

        // Actualizar permisos si se proporcionan
        if (superadmin_role !== undefined || custom_permissions.length > 0) {
            // Eliminar permisos existentes
            await masterPool.query(
                `DELETE FROM SUPERADMIN_PERMISSIONS WHERE user_id = ${parseInt(userId)}`
            );

            // Agregar nuevos permisos
            const { getPermissionsByRole } = require('../../middleware/superAdminMiddleware');
            const rolePermissions = getPermissionsByRole(superadmin_role || existingUser[0].superadmin_role);
            const finalPermissions = [...rolePermissions, ...custom_permissions];

            if (finalPermissions.length > 0) {
                const permissionValues = finalPermissions.map(permission => 
                    `(${parseInt(userId)}, '${permission.replace(/'/g, "''")}', ${req.superAdmin.user_id})`
                ).join(', ');

                await masterPool.query(`
                    INSERT INTO SUPERADMIN_PERMISSIONS (user_id, permission_type, granted_by)
                    VALUES ${permissionValues}
                `);
            }
        }

        // Obtener usuario actualizado
        const [updatedUser] = await masterPool.query(`
            SELECT 
                user_id, email, first_name, last_name, superadmin_role, 
                is_active, updated_at
            FROM MASTER_USERS 
            WHERE user_id = ${parseInt(userId)}
        `);

        const [permissions] = await masterPool.query(
            `SELECT permission_type FROM SUPERADMIN_PERMISSIONS WHERE user_id = ${parseInt(userId)}`
        );

        updatedUser[0].permissions = permissions.map(p => p.permission_type);

        res.json({
            success: true,
            message: 'Usuario actualizado correctamente',
            data: updatedUser[0]
        });

    } catch (error) {
        console.error('Error actualizando SuperAdmin:', error.message);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al actualizar usuario'
        });
    }
});

/**
 * DELETE /api/superadmin/users/:userId
 * Desactivar usuario SuperAdmin (no eliminación física)
 */
router.delete('/:userId', requirePermission('manage_superadmins'), auditLog('deactivate_superadmin'), async (req, res) => {
    try {
        const { userId } = req.params;

        // No permitir desactivarse a sí mismo
        if (req.superAdmin.user_id == userId) {
            return res.status(400).json({
                error: 'No puedes desactivarte a ti mismo'
            });
        }

        await masterPool.query(`
            UPDATE MASTER_USERS 
            SET is_active = FALSE,
                updated_at = NOW()
            WHERE user_id = ${parseInt(userId)} AND is_super_admin = TRUE
        `);

        res.json({
            success: true,
            message: 'Usuario desactivado correctamente'
        });

    } catch (error) {
        console.error('Error desactivando SuperAdmin:', error.message);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al desactivar usuario'
        });
    }
});

/**
 * PUT /api/superadmin/users/:userId/activate
 * Reactivar un usuario SuperAdmin
 */
router.put('/:userId/activate', requirePermission('manage_superadmins'), auditLog('activate_superadmin'), async (req, res) => {
    try {
        const { userId } = req.params;

        // Verificar que el usuario existe y está inactivo
        const [existingUser] = await masterPool.execute(
            'SELECT user_id, email, first_name, last_name, is_active FROM MASTER_USERS WHERE user_id = ? AND superadmin_role IS NOT NULL',
            [userId]
        );

        if (existingUser.length === 0) {
            return res.status(404).json({
                error: 'Usuario SuperAdmin no encontrado'
            });
        }

        if (existingUser[0].is_active) {
            return res.status(400).json({
                error: 'El usuario ya está activo'
            });
        }

        // Reactivar usuario
        await masterPool.execute(
            'UPDATE MASTER_USERS SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Usuario reactivado correctamente',
            data: {
                user_id: userId,
                email: existingUser[0].email,
                first_name: existingUser[0].first_name,
                last_name: existingUser[0].last_name
            }
        });

    } catch (error) {
        console.error('Error reactivando usuario SuperAdmin:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al reactivar usuario'
        });
    }
});

/**
 * DELETE /api/superadmin/users/:userId/permanent
 * Eliminar permanentemente un usuario SuperAdmin
 */
router.delete('/:userId/permanent', requirePermission('manage_superadmins'), auditLog('delete_superadmin_permanent'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { confirmation } = req.body;

        // No permitir eliminarse a sí mismo
        if (req.superAdmin.user_id == userId) {
            return res.status(400).json({
                error: 'No puedes eliminarte a ti mismo'
            });
        }

        // Verificar que el usuario existe
        const [existingUser] = await masterPool.execute(
            'SELECT user_id, email, first_name, last_name FROM MASTER_USERS WHERE user_id = ? AND superadmin_role IS NOT NULL',
            [userId]
        );

        if (existingUser.length === 0) {
            return res.status(404).json({
                error: 'Usuario SuperAdmin no encontrado'
            });
        }

        const user = existingUser[0];
        const expectedConfirmation = `${user.first_name} ${user.last_name}`;

        // Verificar confirmación (nombre completo del usuario)
        if (!confirmation || confirmation !== expectedConfirmation) {
            return res.status(400).json({
                error: 'Confirmación incorrecta',
                message: `Debes escribir "${expectedConfirmation}" para confirmar la eliminación`
            });
        }

        // Eliminar permisos asociados primero
        await masterPool.execute(
            'DELETE FROM SUPERADMIN_PERMISSIONS WHERE user_id = ?',
            [userId]
        );

        // Eliminar usuario permanentemente
        await masterPool.execute(
            'DELETE FROM MASTER_USERS WHERE user_id = ?',
            [userId]
        );

        res.json({
            success: true,
            message: 'Usuario eliminado permanentemente'
        });

    } catch (error) {
        console.error('Error eliminando usuario SuperAdmin:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al eliminar usuario'
        });
    }
});

module.exports = router;