// routes/superadmin/dashboard.js
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
 * GET /api/superadmin/dashboard/metrics
 * Obtener métricas principales del dashboard
 */
router.get('/metrics', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Métricas de tenants
        const [tenantMetrics] = await masterPool.execute(`
            SELECT 
                COUNT(*) as total_tenants,
                SUM(CASE WHEN subscription_status = 'active' THEN 1 ELSE 0 END) as active_tenants,
                SUM(CASE WHEN subscription_status = 'trial' THEN 1 ELSE 0 END) as trial_tenants,
                SUM(CASE WHEN subscription_status = 'suspended' THEN 1 ELSE 0 END) as suspended_tenants,
                SUM(CASE WHEN subscription_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_tenants,
                SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) as new_today
            FROM TENANTS 
            WHERE is_active = TRUE
        `, [today]);

        // Métricas financieras
        const [revenueMetrics] = await masterPool.execute(`
            SELECT 
                COALESCE(SUM(monthly_revenue_cents), 0) as mrr_cents,
                COALESCE(SUM(yearly_revenue_cents), 0) as arr_cents,
                COUNT(*) as paying_tenants
            FROM TENANTS 
            WHERE subscription_status = 'active'
        `);

        // Crecimiento de los últimos 30 días
        const [growthData] = await masterPool.execute(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_tenants
            FROM TENANTS 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                AND is_active = TRUE
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // Distribución por planes
        const [planDistribution] = await masterPool.execute(`
            SELECT 
                subscription_plan,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM TENANTS WHERE is_active = TRUE), 2) as percentage
            FROM TENANTS 
            WHERE is_active = TRUE
            GROUP BY subscription_plan
            ORDER BY count DESC
        `);

        // Actividad reciente (últimos 10 tenants)
        const [recentActivity] = await masterPool.execute(`
            SELECT 
                tenant_id, subdomain, business_name, subscription_plan,
                subscription_status, created_at, last_activity_at
            FROM TENANTS 
            WHERE is_active = TRUE
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        // Métricas del sistema (última entrada)
        const [systemMetrics] = await masterPool.execute(`
            SELECT * FROM SYSTEM_METRICS 
            ORDER BY metric_date DESC 
            LIMIT 1
        `);

        // Alertas críticas (últimos 7 días)
        const [alerts] = await masterPool.execute(`
            SELECT COUNT(*) as critical_alerts
            FROM SUPERADMIN_AUDIT_LOG 
            WHERE performed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                AND action_type IN ('suspend_tenant', 'delete_tenant')
        `);

        res.json({
            success: true,
            data: {
                tenants: tenantMetrics[0],
                revenue: {
                    ...revenueMetrics[0],
                    mrr: revenueMetrics[0].mrr_cents / 100,
                    arr: revenueMetrics[0].arr_cents / 100
                },
                growth: growthData,
                plan_distribution: planDistribution,
                recent_activity: recentActivity,
                system: systemMetrics[0] || {},
                alerts: alerts[0]
            },
            generated_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error obteniendo métricas del dashboard:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener métricas del dashboard'
        });
    }
});

/**
 * GET /api/superadmin/dashboard/charts/growth
 * Datos para gráfico de crecimiento de tenants
 */
router.get('/charts/growth', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const { period = '30' } = req.query; // días
        
        const [chartData] = await masterPool.execute(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_tenants,
                (SELECT COUNT(*) FROM TENANTS t2 WHERE DATE(t2.created_at) <= DATE(t1.created_at) AND t2.is_active = TRUE) as cumulative_tenants
            FROM TENANTS t1
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                AND is_active = TRUE
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [parseInt(period)]);

        res.json({
            success: true,
            data: chartData,
            period: period
        });

    } catch (error) {
        console.error('Error obteniendo datos de crecimiento:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener datos de crecimiento'
        });
    }
});

/**
 * GET /api/superadmin/dashboard/charts/revenue
 * Datos para gráfico de ingresos
 */
router.get('/charts/revenue', requirePermission(['access_monitoring', 'manage_billing']), async (req, res) => {
    try {
        const { period = '12' } = req.query; // meses

        // Ingresos por mes (simulado - en producción vendría de sistema de facturación)
        const [revenueData] = await masterPool.execute(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') as month,
                SUM(monthly_revenue_cents) as monthly_revenue_cents,
                COUNT(*) as new_subscribers
            FROM TENANTS 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
                AND subscription_status = 'active'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
        `, [parseInt(period)]);

        // Convertir centavos a euros/dolares
        const processedData = revenueData.map(row => ({
            ...row,
            monthly_revenue: row.monthly_revenue_cents / 100
        }));

        res.json({
            success: true,
            data: processedData,
            period: period
        });

    } catch (error) {
        console.error('Error obteniendo datos de ingresos:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener datos de ingresos'
        });
    }
});

/**
 * GET /api/superadmin/dashboard/activity-feed
 * Feed de actividad reciente del sistema
 */
router.get('/activity-feed', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const { limit = 20 } = req.query;
        const auditLimit = Math.floor(parseInt(limit) / 2);
        const tenantLimit = Math.floor(parseInt(limit) / 2);

        // WORKAROUND: Usar query directo para evitar problemas con prepared statements
        // Actividad de audit log
        const auditQuery = `
            SELECT 
                'audit' as type,
                al.action_type,
                al.performed_at,
                al.target_tenant_id,
                al.target_user_id,
                mu.first_name,
                mu.last_name,
                mu.email,
                t.business_name as tenant_name
            FROM SUPERADMIN_AUDIT_LOG al
            JOIN MASTER_USERS mu ON al.user_id = mu.user_id
            LEFT JOIN TENANTS t ON al.target_tenant_id = t.tenant_id
            ORDER BY al.performed_at DESC
            LIMIT ${auditLimit}
        `;
        
        const [auditActivity] = await masterPool.query(auditQuery);

        // Actividad de nuevos tenants
        const tenantQuery = `
            SELECT 
                'new_tenant' as type,
                'create_tenant' as action_type,
                created_at as performed_at,
                tenant_id as target_tenant_id,
                NULL as target_user_id,
                admin_email as email,
                business_name as tenant_name,
                subscription_plan
            FROM TENANTS
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY created_at DESC
            LIMIT ${tenantLimit}
        `;
        
        const [tenantActivity] = await masterPool.query(tenantQuery);

        // Combinar y ordenar actividades
        const allActivity = [...auditActivity, ...tenantActivity]
            .sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at))
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: allActivity
        });

    } catch (error) {
        console.error('Error obteniendo feed de actividad:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener feed de actividad'
        });
    }
});

/**
 * POST /api/superadmin/dashboard/refresh-metrics
 * Forzar recálculo de métricas del sistema
 */
router.post('/refresh-metrics', requirePermission('configure_system'), auditLog('refresh_metrics'), async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        
        // Llamar al procedimiento almacenado para recalcular métricas
        await masterPool.execute('CALL sp_calculate_daily_metrics(?)', [today]);

        res.json({
            success: true,
            message: 'Métricas recalculadas correctamente',
            date: today
        });

    } catch (error) {
        console.error('Error recalculando métricas:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al recalcular métricas'
        });
    }
});

module.exports = router;