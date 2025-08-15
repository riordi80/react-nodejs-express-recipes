// routes/superadmin/billing.js
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
 * GET /api/superadmin/billing/overview
 * Vista general de facturación
 */
router.get('/overview', requirePermission('manage_billing'), async (req, res) => {
    try {
        // Métricas financieras
        const [metrics] = await masterPool.execute(`
            SELECT 
                COUNT(*) as total_paying_customers,
                SUM(monthly_revenue_cents) as total_mrr_cents,
                SUM(yearly_revenue_cents) as total_arr_cents,
                AVG(monthly_revenue_cents) as avg_revenue_per_customer_cents
            FROM TENANTS 
            WHERE subscription_status = 'active'
        `);

        // Distribución de ingresos por plan
        const [planRevenue] = await masterPool.execute(`
            SELECT 
                subscription_plan,
                COUNT(*) as customers,
                SUM(monthly_revenue_cents) as mrr_cents,
                SUM(yearly_revenue_cents) as arr_cents
            FROM TENANTS 
            WHERE subscription_status = 'active'
            GROUP BY subscription_plan
        `);

        res.json({
            success: true,
            data: {
                metrics: {
                    ...metrics[0],
                    total_mrr: metrics[0].total_mrr_cents / 100,
                    total_arr: metrics[0].total_arr_cents / 100,
                    avg_revenue_per_customer: metrics[0].avg_revenue_per_customer_cents / 100
                },
                plan_revenue: planRevenue.map(plan => ({
                    ...plan,
                    mrr: plan.mrr_cents / 100,
                    arr: plan.arr_cents / 100
                }))
            }
        });

    } catch (error) {
        console.error('Error obteniendo overview de facturación:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener información de facturación'
        });
    }
});

/**
 * GET /api/superadmin/billing/plans
 * Gestión de planes de suscripción
 */
router.get('/plans', requirePermission('manage_billing'), async (req, res) => {
    try {
        const [plans] = await masterPool.execute(`
            SELECT 
                p.*,
                COUNT(t.tenant_id) as active_subscribers
            FROM SUBSCRIPTION_PLANS p
            LEFT JOIN TENANTS t ON p.plan_id = t.subscription_plan 
                AND t.subscription_status = 'active'
            GROUP BY p.plan_id
            ORDER BY p.sort_order ASC
        `);

        // Procesar features JSON
        const processedPlans = plans.map(plan => ({
            ...plan,
            features: JSON.parse(plan.features),
            price_monthly: plan.price_monthly_cents / 100,
            price_yearly: plan.price_yearly_cents / 100
        }));

        res.json({
            success: true,
            data: processedPlans
        });

    } catch (error) {
        console.error('Error obteniendo planes:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener planes de suscripción'
        });
    }
});

module.exports = router;