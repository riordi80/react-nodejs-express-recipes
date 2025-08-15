// routes/superadmin/tenants.js
const express = require('express');
const mysql = require('mysql2/promise');
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
 * GET /api/superadmin/tenants
 * Listar todos los tenants con filtros y paginación
 */
router.get('/', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            status,
            plan,
            search,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        const offset = (page - 1) * limit;
        
        // Construir WHERE clause dinámico
        let whereConditions = ['t.is_active = TRUE'];
        let queryParams = [];

        if (status && status !== 'all') {
            whereConditions.push('t.subscription_status = ?');
            queryParams.push(status);
        }

        if (plan && plan !== 'all') {
            whereConditions.push('t.subscription_plan = ?');
            queryParams.push(plan);
        }

        if (search) {
            whereConditions.push('(t.subdomain LIKE ? OR t.business_name LIKE ? OR t.admin_email LIKE ?)');
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        const whereClause = whereConditions.join(' AND ');
        
        // Query principal con información extendida
        const [tenants] = await masterPool.execute(`
            SELECT 
                t.*,
                (SELECT COUNT(*) FROM MASTER_USERS mu WHERE mu.tenant_id = t.tenant_id AND mu.is_active = TRUE) as users_count,
                DATEDIFF(CURDATE(), t.created_at) as days_since_creation,
                CASE 
                    WHEN t.trial_ends_at IS NOT NULL AND t.trial_ends_at < CURDATE() THEN 'expired'
                    WHEN t.trial_ends_at IS NOT NULL AND t.trial_ends_at >= CURDATE() THEN 'active'
                    ELSE 'none'
                END as trial_status
            FROM TENANTS t
            WHERE ${whereClause}
            ORDER BY t.${sort_by} ${sort_order.toUpperCase()}
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), parseInt(offset)]);

        // Contar total para paginación
        const [countResult] = await masterPool.execute(`
            SELECT COUNT(*) as total
            FROM TENANTS t
            WHERE ${whereClause}
        `, queryParams);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                tenants,
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
        console.error('Error obteniendo lista de tenants:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener lista de tenants'
        });
    }
});

/**
 * GET /api/superadmin/tenants/:tenantId
 * Obtener detalles de un tenant específico
 */
router.get('/:tenantId', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const { tenantId } = req.params;

        // Información del tenant
        const [tenantRows] = await masterPool.execute(`
            SELECT * FROM TENANTS WHERE tenant_id = ? AND is_active = TRUE
        `, [tenantId]);

        if (tenantRows.length === 0) {
            return res.status(404).json({
                error: 'Tenant no encontrado',
                message: 'El tenant especificado no existe o está inactivo'
            });
        }

        const tenant = tenantRows[0];

        // Usuarios del tenant
        const [users] = await masterPool.execute(`
            SELECT user_id, email, first_name, last_name, role, is_active, 
                   created_at, last_login_at
            FROM MASTER_USERS 
            WHERE tenant_id = ?
            ORDER BY created_at DESC
        `, [tenantId]);

        // Métricas de uso (simuladas - en producción vendrían de la BD del tenant)
        const [usageMetrics] = await masterPool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM MASTER_USERS WHERE tenant_id = ? AND is_active = TRUE) as users_count,
                0 as recipes_count,  -- Placeholder
                0 as events_count,   -- Placeholder
                0 as storage_mb      -- Placeholder
        `, [tenantId]);

        // Actividad reciente del tenant en audit log
        const [recentActivity] = await masterPool.execute(`
            SELECT al.*, mu.first_name, mu.last_name, mu.email
            FROM SUPERADMIN_AUDIT_LOG al
            JOIN MASTER_USERS mu ON al.user_id = mu.user_id
            WHERE al.target_tenant_id = ?
            ORDER BY al.performed_at DESC
            LIMIT 10
        `, [tenantId]);

        res.json({
            success: true,
            data: {
                tenant,
                users,
                usage_metrics: usageMetrics[0],
                recent_activity: recentActivity
            }
        });

    } catch (error) {
        console.error('Error obteniendo detalles del tenant:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener detalles del tenant'
        });
    }
});

/**
 * PUT /api/superadmin/tenants/:tenantId
 * Actualizar información de un tenant
 */
router.put('/:tenantId', requirePermission('manage_tenants'), auditLog('update_tenant'), async (req, res) => {
    try {
        const { tenantId } = req.params;
        const {
            business_name,
            admin_email,
            subscription_plan,
            subscription_status,
            max_users,
            max_recipes,
            max_events,
            billing_email,
            billing_address,
            tax_number,
            backup_frequency,
            notes
        } = req.body;

        // Verificar que el tenant existe
        const [existingTenant] = await masterPool.execute(
            'SELECT * FROM TENANTS WHERE tenant_id = ?',
            [tenantId]
        );

        if (existingTenant.length === 0) {
            return res.status(404).json({
                error: 'Tenant no encontrado'
            });
        }

        // Construir query de actualización dinámico
        const updateFields = [];
        const updateValues = [];

        if (business_name !== undefined) {
            updateFields.push('business_name = ?');
            updateValues.push(business_name);
        }
        if (admin_email !== undefined) {
            updateFields.push('admin_email = ?');
            updateValues.push(admin_email);
        }
        if (subscription_plan !== undefined) {
            updateFields.push('subscription_plan = ?');
            updateValues.push(subscription_plan);
        }
        if (subscription_status !== undefined) {
            updateFields.push('subscription_status = ?');
            updateValues.push(subscription_status);
        }
        if (max_users !== undefined) {
            updateFields.push('max_users = ?');
            updateValues.push(max_users);
        }
        if (max_recipes !== undefined) {
            updateFields.push('max_recipes = ?');
            updateValues.push(max_recipes);
        }
        if (max_events !== undefined) {
            updateFields.push('max_events = ?');
            updateValues.push(max_events);
        }
        if (billing_email !== undefined) {
            updateFields.push('billing_email = ?');
            updateValues.push(billing_email);
        }
        if (billing_address !== undefined) {
            updateFields.push('billing_address = ?');
            updateValues.push(billing_address);
        }
        if (tax_number !== undefined) {
            updateFields.push('tax_number = ?');
            updateValues.push(tax_number);
        }
        if (backup_frequency !== undefined) {
            updateFields.push('backup_frequency = ?');
            updateValues.push(backup_frequency);
        }
        if (notes !== undefined) {
            updateFields.push('notes = ?');
            updateValues.push(notes);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                error: 'No hay campos para actualizar'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(tenantId);

        await masterPool.execute(`
            UPDATE TENANTS 
            SET ${updateFields.join(', ')} 
            WHERE tenant_id = ?
        `, updateValues);

        // Obtener tenant actualizado
        const [updatedTenant] = await masterPool.execute(
            'SELECT * FROM TENANTS WHERE tenant_id = ?',
            [tenantId]
        );

        res.json({
            success: true,
            message: 'Tenant actualizado correctamente',
            data: updatedTenant[0]
        });

    } catch (error) {
        console.error('Error actualizando tenant:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al actualizar el tenant'
        });
    }
});

/**
 * POST /api/superadmin/tenants/:tenantId/suspend
 * Suspender un tenant
 */
router.post('/:tenantId/suspend', requirePermission(['manage_tenants', 'manage_billing']), auditLog('suspend_tenant'), async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { reason } = req.body;

        await masterPool.execute(`
            UPDATE TENANTS 
            SET subscription_status = 'suspended', 
                updated_at = CURRENT_TIMESTAMP,
                notes = CONCAT(COALESCE(notes, ''), '\n[', NOW(), '] Suspendido: ', ?)
            WHERE tenant_id = ?
        `, [reason || 'Sin razón especificada', tenantId]);

        res.json({
            success: true,
            message: 'Tenant suspendido correctamente'
        });

    } catch (error) {
        console.error('Error suspendiendo tenant:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al suspender el tenant'
        });
    }
});

/**
 * POST /api/superadmin/tenants/:tenantId/reactivate
 * Reactivar un tenant suspendido
 */
router.post('/:tenantId/reactivate', requirePermission(['manage_tenants', 'manage_billing']), auditLog('reactivate_tenant'), async (req, res) => {
    try {
        const { tenantId } = req.params;

        await masterPool.execute(`
            UPDATE TENANTS 
            SET subscription_status = 'active', 
                updated_at = CURRENT_TIMESTAMP,
                notes = CONCAT(COALESCE(notes, ''), '\n[', NOW(), '] Reactivado')
            WHERE tenant_id = ?
        `, [tenantId]);

        res.json({
            success: true,
            message: 'Tenant reactivado correctamente'
        });

    } catch (error) {
        console.error('Error reactivando tenant:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al reactivar el tenant'
        });
    }
});

/**
 * DELETE /api/superadmin/tenants/:tenantId
 * Eliminar un tenant (marca como inactivo)
 */
router.delete('/:tenantId', requirePermission('delete_tenants'), auditLog('delete_tenant'), async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { confirm_deletion } = req.body;

        if (!confirm_deletion) {
            return res.status(400).json({
                error: 'Confirmación requerida',
                message: 'Debe confirmar la eliminación del tenant'
            });
        }

        // Marcar como inactivo en lugar de eliminar
        await masterPool.execute(`
            UPDATE TENANTS 
            SET is_active = FALSE, 
                subscription_status = 'cancelled',
                updated_at = CURRENT_TIMESTAMP,
                notes = CONCAT(COALESCE(notes, ''), '\n[', NOW(), '] Eliminado por superadmin')
            WHERE tenant_id = ?
        `, [tenantId]);

        res.json({
            success: true,
            message: 'Tenant eliminado correctamente'
        });

    } catch (error) {
        console.error('Error eliminando tenant:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al eliminar el tenant'
        });
    }
});

module.exports = router;