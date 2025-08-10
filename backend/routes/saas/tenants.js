// routes/saas/tenants.js
const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Función para generar UUID v4
function uuidv4() {
    return crypto.randomUUID();
}
const bcrypt = require('bcryptjs');
const { createTenantDatabase, checkTenantDatabase } = require('../../middleware/tenant/databaseManager');

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
 * POST /api/saas/tenants
 * Crear nuevo tenant (registro de restaurante)
 */
router.post('/tenants', async (req, res) => {
    try {
        const {
            subdomain,
            business_name,
            admin_email,
            admin_password,
            admin_first_name,
            admin_last_name,
            subscription_plan = 'free'
        } = req.body;

        // Validaciones básicas
        if (!subdomain || !business_name || !admin_email || !admin_password || !admin_first_name || !admin_last_name) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'Todos los campos son requeridos'
            });
        }

        // Validar formato de subdominio
        const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
        if (!subdomainRegex.test(subdomain.toLowerCase()) || subdomain.length < 3 || subdomain.length > 20) {
            return res.status(400).json({
                error: 'Subdominio inválido',
                message: 'El subdominio debe tener entre 3-20 caracteres, solo letras, números y guiones'
            });
        }

        // Verificar si el subdominio ya existe
        const [existingTenant] = await masterPool.execute(
            'SELECT tenant_id FROM TENANTS WHERE subdomain = ?',
            [subdomain.toLowerCase()]
        );

        if (existingTenant.length > 0) {
            return res.status(409).json({
                error: 'Subdominio no disponible',
                message: 'Este subdominio ya está en uso'
            });
        }

        // Verificar si el email ya existe
        const [existingUser] = await masterPool.execute(
            'SELECT user_id FROM MASTER_USERS WHERE email = ?',
            [admin_email.toLowerCase()]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                error: 'Email no disponible',
                message: 'Este email ya está registrado'
            });
        }

        // Generar IDs
        const tenantId = uuidv4();
        const databaseName = `recetario_${subdomain.toLowerCase()}`;

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(admin_password, 12);

        // Comenzar transacción
        const connection = await masterPool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Crear el tenant
            await connection.execute(`
                INSERT INTO TENANTS (
                    tenant_id, subdomain, database_name, business_name, admin_email,
                    subscription_plan, subscription_status, trial_ends_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'trial', DATE_ADD(NOW(), INTERVAL 30 DAY))
            `, [
                tenantId,
                subdomain.toLowerCase(),
                databaseName,
                business_name,
                admin_email.toLowerCase(),
                subscription_plan
            ]);

            // 2. Crear el usuario administrador
            await connection.execute(`
                INSERT INTO MASTER_USERS (
                    tenant_id, email, password_hash, first_name, last_name,
                    role, is_tenant_owner, email_verified_at
                ) VALUES (?, ?, ?, ?, ?, 'admin', TRUE, NOW())
            `, [
                tenantId,
                admin_email.toLowerCase(),
                passwordHash,
                admin_first_name,
                admin_last_name
            ]);

            // Confirmar transacción
            await connection.commit();
            connection.release();

            // 3. Crear base de datos del tenant (fuera de la transacción)
            const dbCreated = await createTenantDatabase(databaseName, 'recetario');
            
            if (!dbCreated) {
                // Si falla la creación de la BD, eliminar el tenant creado
                await masterPool.execute('DELETE FROM TENANTS WHERE tenant_id = ?', [tenantId]);
                
                return res.status(500).json({
                    error: 'Error creando base de datos',
                    message: 'No se pudo crear la base de datos del tenant'
                });
            }

            // Respuesta exitosa
            res.status(201).json({
                message: 'Tenant creado exitosamente',
                tenant: {
                    tenant_id: tenantId,
                    subdomain: subdomain.toLowerCase(),
                    business_name,
                    admin_email: admin_email.toLowerCase(),
                    subscription_plan,
                    subscription_status: 'trial',
                    database_name: databaseName,
                    trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                }
            });

        } catch (error) {
            // Revertir transacción
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Error creando tenant:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error al crear el tenant'
        });
    }
});

/**
 * GET /api/saas/tenants/:tenantId
 * Obtener información de un tenant específico
 */
router.get('/tenants/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;

        const [rows] = await masterPool.execute(
            'SELECT * FROM TENANTS WHERE tenant_id = ?',
            [tenantId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Tenant no encontrado',
                message: 'El tenant especificado no existe'
            });
        }

        const tenant = rows[0];

        // No incluir información sensible en la respuesta
        const { ...tenantInfo } = tenant;

        res.json({
            tenant: tenantInfo
        });

    } catch (error) {
        console.error('Error obteniendo tenant:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error al obtener información del tenant'
        });
    }
});

/**
 * PUT /api/saas/tenants/:tenantId
 * Actualizar información de un tenant
 */
router.put('/tenants/:tenantId', async (req, res) => {
    try {
        const { tenantId } = req.params;
        const {
            business_name,
            billing_email,
            billing_address,
            tax_number,
            custom_domain,
            backup_frequency
        } = req.body;

        // Verificar que el tenant existe
        const [existingTenant] = await masterPool.execute(
            'SELECT tenant_id FROM TENANTS WHERE tenant_id = ?',
            [tenantId]
        );

        if (existingTenant.length === 0) {
            return res.status(404).json({
                error: 'Tenant no encontrado',
                message: 'El tenant especificado no existe'
            });
        }

        // Construir query de actualización dinámicamente
        const updates = [];
        const values = [];

        if (business_name !== undefined) {
            updates.push('business_name = ?');
            values.push(business_name);
        }
        if (billing_email !== undefined) {
            updates.push('billing_email = ?');
            values.push(billing_email);
        }
        if (billing_address !== undefined) {
            updates.push('billing_address = ?');
            values.push(billing_address);
        }
        if (tax_number !== undefined) {
            updates.push('tax_number = ?');
            values.push(tax_number);
        }
        if (custom_domain !== undefined) {
            updates.push('custom_domain = ?');
            values.push(custom_domain);
        }
        if (backup_frequency !== undefined) {
            updates.push('backup_frequency = ?');
            values.push(backup_frequency);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: 'Sin cambios',
                message: 'No se especificaron campos para actualizar'
            });
        }

        updates.push('updated_at = NOW()');
        values.push(tenantId);

        await masterPool.execute(
            `UPDATE TENANTS SET ${updates.join(', ')} WHERE tenant_id = ?`,
            values
        );

        res.json({
            message: 'Tenant actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error actualizando tenant:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error al actualizar el tenant'
        });
    }
});

/**
 * GET /api/saas/tenants
 * Listar todos los tenants (para administración)
 */
router.get('/tenants', async (req, res) => {
    try {
        const { page = 1, limit = 50, status, plan } = req.query;
        const offset = (page - 1) * limit;

        // Construir filtros
        let whereClause = 'WHERE 1=1';
        const queryParams = [];

        if (status) {
            whereClause += ' AND subscription_status = ?';
            queryParams.push(status);
        }

        if (plan) {
            whereClause += ' AND subscription_plan = ?';
            queryParams.push(plan);
        }

        // Obtener tenants con paginación
        const [rows] = await masterPool.execute(
            `SELECT 
                tenant_id, subdomain, business_name, admin_email,
                subscription_plan, subscription_status, trial_ends_at,
                created_at, last_activity_at, is_active
            FROM TENANTS 
            ${whereClause} 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?`,
            [...queryParams, parseInt(limit), parseInt(offset)]
        );

        // Obtener total de registros
        const [countRows] = await masterPool.execute(
            `SELECT COUNT(*) as total FROM TENANTS ${whereClause}`,
            queryParams
        );

        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            tenants: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error listando tenants:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: 'Error al obtener la lista de tenants'
        });
    }
});

module.exports = router;