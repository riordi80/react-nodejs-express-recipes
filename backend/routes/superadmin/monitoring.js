// routes/superadmin/monitoring.js
const express = require('express');
const mysql = require('mysql2/promise');
const { requirePermission } = require('../../middleware/superAdminMiddleware');

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
 * GET /api/superadmin/monitoring/system-health
 * Estado de salud del sistema
 */
router.get('/system-health', requirePermission('access_monitoring'), async (req, res) => {
    try {
        // Métricas básicas del sistema
        const [dbMetrics] = await masterPool.execute(`
            SELECT 
                COUNT(*) as total_connections,
                VERSION() as mysql_version
            FROM INFORMATION_SCHEMA.PROCESSLIST
        `);

        // Tamaño de bases de datos
        const [dbSizes] = await masterPool.execute(`
            SELECT 
                TABLE_SCHEMA as database_name,
                ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA LIKE 'recetario_%'
            GROUP BY TABLE_SCHEMA
            ORDER BY size_mb DESC
        `);

        res.json({
            success: true,
            data: {
                database: {
                    ...dbMetrics[0],
                    sizes: dbSizes
                },
                system: {
                    uptime: process.uptime(),
                    memory_usage: process.memoryUsage(),
                    node_version: process.version
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo salud del sistema:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener estado del sistema'
        });
    }
});

/**
 * GET /api/superadmin/monitoring/audit-logs
 * Logs de auditoría
 */
router.get('/audit-logs', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const { page = 1, limit = 50, action_type, user_id } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];

        if (action_type) {
            whereConditions.push('al.action_type = ?');
            queryParams.push(action_type);
        }

        if (user_id) {
            whereConditions.push('al.user_id = ?');
            queryParams.push(user_id);
        }

        const whereClause = whereConditions.length > 0 ? 
            `WHERE ${whereConditions.join(' AND ')}` : '';

        const [logs] = await masterPool.execute(`
            SELECT 
                al.*,
                mu.first_name,
                mu.last_name,
                mu.email,
                t.business_name as target_tenant_name
            FROM SUPERADMIN_AUDIT_LOG al
            JOIN MASTER_USERS mu ON al.user_id = mu.user_id
            LEFT JOIN TENANTS t ON al.target_tenant_id = t.tenant_id
            ${whereClause}
            ORDER BY al.performed_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), parseInt(offset)]);

        res.json({
            success: true,
            data: logs
        });

    } catch (error) {
        console.error('Error obteniendo logs de auditoría:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener logs de auditoría'
        });
    }
});

module.exports = router;