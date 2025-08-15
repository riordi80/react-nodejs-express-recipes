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
 * GET /api/superadmin/monitoring/alerts
 * Alertas del sistema
 */
router.get('/alerts', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const { filter = 'all' } = req.query;
        
        // Por ahora retornamos alertas simuladas
        // En producción estas vendrían de un sistema de monitoreo real
        const mockAlerts = [
            {
                alert_id: '1',
                type: 'critical',
                title: 'Alto uso de CPU en servidor principal',
                message: 'El servidor DB-01 está experimentando un uso de CPU del 89% durante los últimos 15 minutos.',
                created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                action_required: true,
                affected_tenants: ['tenant-restaurant-abc', 'tenant-pizzeria-roma']
            },
            {
                alert_id: '2',
                type: 'warning',
                title: 'Tenant con pagos pendientes',
                message: 'El tenant "restaurant-moroso" tiene 3 intentos de pago fallidos.',
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                action_required: true,
                affected_tenants: ['tenant-restaurant-moroso']
            }
        ];
        
        let filteredAlerts = mockAlerts;
        
        if (filter === 'critical') {
            filteredAlerts = mockAlerts.filter(a => a.type === 'critical');
        } else if (filter === 'warning') {
            filteredAlerts = mockAlerts.filter(a => a.type === 'warning');
        } else if (filter === 'unresolved') {
            filteredAlerts = mockAlerts.filter(a => !a.resolved_at);
        }
        
        res.json({
            success: true,
            data: filteredAlerts
        });
        
    } catch (error) {
        console.error('Error obteniendo alertas:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener alertas del sistema'
        });
    }
});

/**
 * POST /api/superadmin/monitoring/alerts/:id/resolve
 * Resolver una alerta
 */
router.post('/alerts/:id/resolve', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const { id } = req.params;
        
        // En producción actualizaría la alerta en la base de datos
        // Por ahora solo simulamos la respuesta
        
        res.json({
            success: true,
            message: 'Alerta marcada como resuelta'
        });
        
    } catch (error) {
        console.error('Error resolviendo alerta:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al resolver alerta'
        });
    }
});

/**
 * GET /api/superadmin/monitoring/system-metrics
 * Métricas detalladas del sistema
 */
router.get('/system-metrics', requirePermission('access_monitoring'), async (req, res) => {
    try {
        // Obtener métricas de la base de datos
        const [dbMetrics] = await masterPool.execute(`
            SELECT 
                COUNT(DISTINCT table_schema) as total_databases,
                ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as total_size_mb,
                COUNT(*) as total_tables
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA LIKE 'recetario_%'
        `);
        
        // Métricas de conexiones activas
        const [connectionMetrics] = await masterPool.execute(`
            SELECT COUNT(*) as active_connections
            FROM INFORMATION_SCHEMA.PROCESSLIST
            WHERE DB LIKE 'recetario_%'
        `);
        
        // Simular métricas del sistema operativo
        const systemMetrics = {
            cpu_usage: Math.random() * 80 + 10, // 10-90%
            memory_usage: Math.random() * 70 + 20, // 20-90%
            disk_usage: Math.random() * 60 + 30, // 30-90%
            uptime_hours: process.uptime() / 3600,
            response_time_avg: Math.random() * 300 + 100 // 100-400ms
        };
        
        res.json({
            success: true,
            data: {
                database: {
                    ...dbMetrics[0],
                    ...connectionMetrics[0]
                },
                system: systemMetrics,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo métricas del sistema:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener métricas del sistema'
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

/**
 * GET /api/superadmin/monitoring/performance
 * Métricas de rendimiento de la API
 */
router.get('/performance', requirePermission('access_monitoring'), async (req, res) => {
    try {
        // Simular métricas de rendimiento
        // En producción estas vendrían de un sistema de monitoreo como Prometheus
        const performanceData = {
            api_calls_last_hour: Math.floor(Math.random() * 5000 + 1000),
            avg_response_time_ms: Math.random() * 200 + 50,
            error_rate_percent: Math.random() * 5,
            requests_per_minute: Math.floor(Math.random() * 100 + 20),
            popular_endpoints: [
                { endpoint: '/api/recipes', calls: 1250, avg_time: 145 },
                { endpoint: '/api/events', calls: 890, avg_time: 95 },
                { endpoint: '/api/suppliers', calls: 720, avg_time: 110 },
                { endpoint: '/api/auth/me', calls: 2100, avg_time: 25 },
                { endpoint: '/api/ingredients', calls: 650, avg_time: 130 }
            ],
            hourly_traffic: Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                requests: Math.floor(Math.random() * 500 + 100)
            }))
        };
        
        res.json({
            success: true,
            data: performanceData
        });
        
    } catch (error) {
        console.error('Error obteniendo métricas de rendimiento:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener métricas de rendimiento'
        });
    }
});

module.exports = router;