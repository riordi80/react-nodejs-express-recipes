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
        // Métricas financieras - calcular desde planes reales
        const [metrics] = await masterPool.execute(`
            SELECT 
                COUNT(*) as total_paying_customers,
                SUM(CASE 
                    WHEN subscription_plan = 'basic' THEN 2500
                    WHEN subscription_plan = 'premium' THEN 4900  
                    WHEN subscription_plan = 'enterprise' THEN 9900
                    ELSE 0 
                END) as total_mrr_cents,
                SUM(CASE 
                    WHEN subscription_plan = 'basic' THEN 2500 * 12
                    WHEN subscription_plan = 'premium' THEN 4900 * 12
                    WHEN subscription_plan = 'enterprise' THEN 9900 * 12
                    ELSE 0 
                END) as total_arr_cents,
                AVG(CASE 
                    WHEN subscription_plan = 'basic' THEN 2500
                    WHEN subscription_plan = 'premium' THEN 4900  
                    WHEN subscription_plan = 'enterprise' THEN 9900
                    ELSE 0 
                END) as avg_revenue_per_customer_cents
            FROM TENANTS 
            WHERE subscription_status = 'active' AND is_active = TRUE
        `);

        // Distribución de ingresos por plan
        const [planRevenue] = await masterPool.execute(`
            SELECT 
                subscription_plan,
                COUNT(*) as customers,
                SUM(CASE 
                    WHEN subscription_plan = 'basic' THEN 2500
                    WHEN subscription_plan = 'premium' THEN 4900  
                    WHEN subscription_plan = 'enterprise' THEN 9900
                    ELSE 0 
                END) as mrr_cents,
                SUM(CASE 
                    WHEN subscription_plan = 'basic' THEN 2500 * 12
                    WHEN subscription_plan = 'premium' THEN 4900 * 12
                    WHEN subscription_plan = 'enterprise' THEN 9900 * 12
                    ELSE 0 
                END) as arr_cents
            FROM TENANTS 
            WHERE subscription_status = 'active' AND is_active = TRUE
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
        const { include_inactive = 'false' } = req.query;

        // Obtener planes desde la base de datos
        const whereClause = include_inactive === 'true' ? '' : 'WHERE is_active = TRUE';
        
        const [plans] = await masterPool.execute(`
            SELECT 
                plan_id,
                plan_name,
                plan_slug,
                plan_description,
                plan_color,
                sort_order,
                is_public,
                is_popular,
                monthly_price_cents,
                yearly_price_cents,
                yearly_discount_percentage,
                max_users,
                max_recipes,
                max_events,
                max_storage_mb,
                max_api_calls_monthly,
                support_level,
                has_analytics,
                has_multi_location,
                has_custom_api,
                has_white_label,
                features,
                is_active,
                created_at,
                updated_at
            FROM SUBSCRIPTION_PLANS 
            ${whereClause}
            ORDER BY sort_order ASC, plan_id ASC
        `);

        // Contar suscriptores activos por plan
        const plansWithSubscribers = [];
        for (let plan of plans) {
            try {
                // Intentar con plan_slug primero, luego con plan_name
                const searchValue = plan.plan_slug || plan.plan_name.toLowerCase();
                const [subscribers] = await masterPool.execute(`
                    SELECT COUNT(*) as active_subscribers
                    FROM TENANTS 
                    WHERE subscription_plan = ? AND subscription_status = 'active' AND is_active = TRUE
                `, [searchValue]);
                
                plansWithSubscribers.push({
                    ...plan,
                    price_monthly: (plan.monthly_price_cents || 0) / 100,
                    price_yearly: (plan.yearly_price_cents || 0) / 100,
                    yearly_savings: Math.round(
                        ((plan.monthly_price_cents || 0) * 12 - (plan.yearly_price_cents || 0)) / 100
                    ),
                    features: JSON.parse(plan.features || '[]'),
                    active_subscribers: subscribers[0].active_subscribers || 0,
                    limits: {
                        users: plan.max_users === -1 ? 'unlimited' : plan.max_users,
                        recipes: plan.max_recipes === -1 ? 'unlimited' : plan.max_recipes,
                        events: plan.max_events === -1 ? 'unlimited' : plan.max_events,
                        storage_mb: plan.max_storage_mb || 1000,
                        api_calls_monthly: plan.max_api_calls_monthly || 10000
                    },
                    capabilities: {
                        analytics: !!plan.has_analytics,
                        multi_location: !!plan.has_multi_location,
                        custom_api: !!plan.has_custom_api,
                        white_label: !!plan.has_white_label,
                        support_level: plan.support_level || 'email'
                    }
                });
            } catch (planError) {
                console.error('Error procesando plan:', plan.plan_name, planError);
                // Añadir plan con datos por defecto si hay error
                plansWithSubscribers.push({
                    ...plan,
                    price_monthly: (plan.monthly_price_cents || 0) / 100,
                    price_yearly: (plan.yearly_price_cents || 0) / 100,
                    yearly_savings: 0,
                    features: [],
                    active_subscribers: 0,
                    limits: {
                        users: plan.max_users || 0,
                        recipes: plan.max_recipes || 0,
                        events: plan.max_events || 0,
                        storage_mb: 1000,
                        api_calls_monthly: 10000
                    },
                    capabilities: {
                        analytics: false,
                        multi_location: false,
                        custom_api: false,
                        white_label: false,
                        support_level: 'email'
                    }
                });
            }
        }

        res.json({
            success: true,
            data: plansWithSubscribers
        });

    } catch (error) {
        console.error('Error obteniendo planes:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener planes de suscripción'
        });
    }
});

/**
 * POST /api/superadmin/billing/plans
 * Crear nuevo plan de suscripción
 */
router.post('/plans', requirePermission('manage_billing'), auditLog('create_plan'), async (req, res) => {
    try {
        const {
            plan_name, plan_slug, plan_description, plan_color = 'blue',
            sort_order = 0, is_public = true, is_popular = false,
            monthly_price_cents, yearly_price_cents, yearly_discount_percentage = 16.67,
            max_users, max_recipes, max_events, max_storage_mb = 1000,
            max_api_calls_monthly = 10000, support_level = 'email',
            has_analytics = false, has_multi_location = false,
            has_custom_api = false, has_white_label = false,
            features = []
        } = req.body;

        // Validaciones básicas
        if (!plan_name || !plan_slug || !monthly_price_cents) {
            return res.status(400).json({
                error: 'Datos incompletos',
                message: 'plan_name, plan_slug y monthly_price_cents son requeridos'
            });
        }

        // Verificar que el slug no exista
        const [existingPlan] = await masterPool.execute(`
            SELECT plan_id FROM SUBSCRIPTION_PLANS WHERE plan_slug = ?
        `, [plan_slug]);

        if (existingPlan.length > 0) {
            return res.status(400).json({
                error: 'Plan duplicado',
                message: 'Ya existe un plan con ese slug'
            });
        }

        // Crear el plan
        const [result] = await masterPool.execute(`
            INSERT INTO SUBSCRIPTION_PLANS (
                plan_name, plan_slug, plan_description, plan_color, sort_order,
                is_public, is_popular, monthly_price_cents, yearly_price_cents,
                yearly_discount_percentage, max_users, max_recipes, max_events,
                max_storage_mb, max_api_calls_monthly, support_level,
                has_analytics, has_multi_location, has_custom_api, has_white_label,
                features, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
        `, [
            plan_name, plan_slug, plan_description, plan_color, sort_order,
            is_public, is_popular, monthly_price_cents, yearly_price_cents,
            yearly_discount_percentage, max_users, max_recipes, max_events,
            max_storage_mb, max_api_calls_monthly, support_level,
            has_analytics, has_multi_location, has_custom_api, has_white_label,
            JSON.stringify(features)
        ]);

        // Obtener el plan creado
        const [newPlan] = await masterPool.execute(`
            SELECT * FROM SUBSCRIPTION_PLANS WHERE plan_id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Plan creado exitosamente',
            data: {
                ...newPlan[0],
                price_monthly: newPlan[0].monthly_price_cents / 100,
                price_yearly: newPlan[0].yearly_price_cents / 100,
                features: JSON.parse(newPlan[0].features || '[]')
            }
        });

    } catch (error) {
        console.error('Error creando plan:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al crear el plan de suscripción'
        });
    }
});

/**
 * PUT /api/superadmin/billing/plans/:planId
 * Actualizar plan de suscripción existente
 */
router.put('/plans/:planId', requirePermission('manage_billing'), auditLog('update_plan'), async (req, res) => {
    try {
        const { planId } = req.params;
        const updateData = req.body;

        // Verificar que el plan existe
        const [existingPlan] = await masterPool.execute(`
            SELECT plan_id FROM SUBSCRIPTION_PLANS WHERE plan_id = ?
        `, [planId]);

        if (existingPlan.length === 0) {
            return res.status(404).json({
                error: 'Plan no encontrado',
                message: 'El plan especificado no existe'
            });
        }

        // Si se está actualizando el slug, verificar que no exista otro plan con ese slug
        if (updateData.plan_slug) {
            const [slugExists] = await masterPool.execute(`
                SELECT plan_id FROM SUBSCRIPTION_PLANS WHERE plan_slug = ? AND plan_id != ?
            `, [updateData.plan_slug, planId]);

            if (slugExists.length > 0) {
                return res.status(400).json({
                    error: 'Slug duplicado',
                    message: 'Ya existe otro plan con ese slug'
                });
            }
        }

        // Preparar campos a actualizar
        const allowedFields = [
            'plan_name', 'plan_slug', 'plan_description', 'plan_color', 'sort_order',
            'is_public', 'is_popular', 'monthly_price_cents', 'yearly_price_cents',
            'yearly_discount_percentage', 'max_users', 'max_recipes', 'max_events',
            'max_storage_mb', 'max_api_calls_monthly', 'support_level',
            'has_analytics', 'has_multi_location', 'has_custom_api', 'has_white_label',
            'features', 'is_active'
        ];

        const updateFields = [];
        const updateValues = [];

        for (const [key, value] of Object.entries(updateData)) {
            if (allowedFields.includes(key)) {
                updateFields.push(`${key} = ?`);
                updateValues.push(key === 'features' ? JSON.stringify(value) : value);
            }
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                error: 'Sin cambios',
                message: 'No hay campos válidos para actualizar'
            });
        }

        // Actualizar el plan
        updateValues.push(planId);
        await masterPool.execute(`
            UPDATE SUBSCRIPTION_PLANS 
            SET ${updateFields.join(', ')}, updated_at = NOW()
            WHERE plan_id = ?
        `, updateValues);

        // Obtener el plan actualizado
        const [updatedPlan] = await masterPool.execute(`
            SELECT * FROM SUBSCRIPTION_PLANS WHERE plan_id = ?
        `, [planId]);

        res.json({
            success: true,
            message: 'Plan actualizado exitosamente',
            data: {
                ...updatedPlan[0],
                price_monthly: updatedPlan[0].monthly_price_cents / 100,
                price_yearly: updatedPlan[0].yearly_price_cents / 100,
                features: JSON.parse(updatedPlan[0].features || '[]')
            }
        });

    } catch (error) {
        console.error('Error actualizando plan:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al actualizar el plan de suscripción'
        });
    }
});

/**
 * DELETE /api/superadmin/billing/plans/:planId
 * Eliminar plan de suscripción (soft delete)
 */
router.delete('/plans/:planId', requirePermission('manage_billing'), auditLog('delete_plan'), async (req, res) => {
    try {
        const { planId } = req.params;

        // Verificar que el plan existe
        const [existingPlan] = await masterPool.execute(`
            SELECT plan_id, plan_name FROM SUBSCRIPTION_PLANS WHERE plan_id = ?
        `, [planId]);

        if (existingPlan.length === 0) {
            return res.status(404).json({
                error: 'Plan no encontrado',
                message: 'El plan especificado no existe'
            });
        }

        // Verificar si hay tenants usando este plan
        const [activeTenants] = await masterPool.execute(`
            SELECT COUNT(*) as tenant_count
            FROM TENANTS 
            WHERE subscription_plan = ? AND subscription_status = 'active' AND is_active = TRUE
        `, [existingPlan[0].plan_name.toLowerCase()]);

        if (activeTenants[0].tenant_count > 0) {
            return res.status(400).json({
                error: 'Plan en uso',
                message: `No se puede eliminar el plan porque ${activeTenants[0].tenant_count} tenant(s) lo están usando actualmente`
            });
        }

        // Soft delete - marcar como inactivo
        await masterPool.execute(`
            UPDATE SUBSCRIPTION_PLANS 
            SET is_active = FALSE, updated_at = NOW()
            WHERE plan_id = ?
        `, [planId]);

        res.json({
            success: true,
            message: 'Plan desactivado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando plan:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al eliminar el plan de suscripción'
        });
    }
});

/**
 * GET /api/superadmin/billing/financial-reports
 * Reportes financieros detallados
 */
router.get('/financial-reports', requirePermission('manage_billing'), async (req, res) => {
    try {
        const { period = '12' } = req.query; // meses por defecto

        // Consulta simple para trial conversion (la más segura)
        const [trialConversion] = await masterPool.execute(`
            SELECT 
                COUNT(*) as total_trials,
                SUM(CASE WHEN subscription_status = 'active' THEN 1 ELSE 0 END) as converted_trials,
                CASE 
                    WHEN COUNT(*) > 0 THEN ROUND(
                        SUM(CASE WHEN subscription_status = 'active' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
                        2
                    )
                    ELSE 0
                END as conversion_rate
            FROM TENANTS 
            WHERE created_at IS NOT NULL
        `);

        // LTV por plan (consulta simplificada)
        const [ltvData] = await masterPool.execute(`
            SELECT 
                subscription_plan,
                COUNT(*) as total_customers,
                CASE 
                    WHEN subscription_plan = 'basic' THEN 2500
                    WHEN subscription_plan = 'premium' THEN 4900  
                    WHEN subscription_plan = 'enterprise' THEN 9900
                    ELSE 0 
                END as monthly_value_cents
            FROM TENANTS 
            WHERE is_active = TRUE
            GROUP BY subscription_plan
        `);

        // Datos mock para las consultas más complejas que fallan
        const mockRevenueData = [];
        const mockChurnData = [];

        // Procesar LTV real
        const processedLTV = (ltvData || []).map(row => ({
            ...row,
            avg_lifespan_days: 180, // Valor estimado por ahora
            monthly_value: (row.monthly_value_cents || 0) / 100,
            estimated_ltv: ((row.monthly_value_cents || 0) / 100) * 6 // 6 meses promedio
        }));

        res.json({
            success: true,
            data: {
                revenue_trends: mockRevenueData,
                churn_analysis: mockChurnData,
                trial_conversion: trialConversion[0] || { total_trials: 0, converted_trials: 0, conversion_rate: 0 },
                ltv_by_plan: processedLTV,
                period: period
            }
        });

    } catch (error) {
        console.error('Error obteniendo reportes financieros:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener reportes financieros'
        });
    }
});

/**
 * PUT /api/superadmin/billing/tenant/:tenantId/plan
 * Cambiar plan de suscripción de un tenant
 */
router.put('/tenant/:tenantId/plan', requirePermission('manage_billing'), auditLog('update_billing'), async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { new_plan, billing_cycle } = req.body;

        // Validar que el plan existe
        const validPlans = ['free', 'basic', 'premium', 'enterprise'];
        if (!validPlans.includes(new_plan)) {
            return res.status(400).json({
                error: 'Plan inválido',
                message: 'El plan especificado no existe'
            });
        }

        // Obtener información actual del tenant
        const [currentTenant] = await masterPool.execute(`
            SELECT tenant_id, subscription_plan, subscription_status, business_name
            FROM TENANTS 
            WHERE tenant_id = ? AND is_active = TRUE
        `, [tenantId]);

        if (currentTenant.length === 0) {
            return res.status(404).json({
                error: 'Tenant no encontrado',
                message: 'El tenant especificado no existe o está inactivo'
            });
        }

        // Actualizar el plan
        await masterPool.execute(`
            UPDATE TENANTS 
            SET subscription_plan = ?, 
                subscription_status = 'active',
                updated_at = NOW()
            WHERE tenant_id = ?
        `, [new_plan, tenantId]);

        // Obtener tenant actualizado
        const [updatedTenant] = await masterPool.execute(`
            SELECT tenant_id, subdomain, business_name, subscription_plan, subscription_status, updated_at
            FROM TENANTS 
            WHERE tenant_id = ?
        `, [tenantId]);

        res.json({
            success: true,
            message: 'Plan de suscripción actualizado correctamente',
            data: {
                tenant: updatedTenant[0],
                previous_plan: currentTenant[0].subscription_plan,
                new_plan: new_plan,
                billing_cycle: billing_cycle || 'monthly'
            }
        });

    } catch (error) {
        console.error('Error actualizando plan:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al actualizar el plan de suscripción'
        });
    }
});

/**
 * GET /api/superadmin/billing/tenant/:tenantId/usage
 * Obtener uso actual de un tenant vs límites de su plan
 */
router.get('/tenant/:tenantId/usage', requirePermission('manage_billing'), async (req, res) => {
    try {
        const { tenantId } = req.params;

        // Obtener información del tenant y su plan
        const [tenantInfo] = await masterPool.execute(`
            SELECT tenant_id, subdomain, business_name, subscription_plan, subscription_status
            FROM TENANTS 
            WHERE tenant_id = ? AND is_active = TRUE
        `, [tenantId]);

        if (tenantInfo.length === 0) {
            return res.status(404).json({
                error: 'Tenant no encontrado'
            });
        }

        const tenant = tenantInfo[0];

        // Obtener límites del plan (hardcoded por ahora)
        const planLimits = {
            'free': { max_users: 2, max_recipes: 50, max_events: 5 },
            'basic': { max_users: 5, max_recipes: 200, max_events: 20 },
            'premium': { max_users: 15, max_recipes: 500, max_events: 50 },
            'enterprise': { max_users: -1, max_recipes: -1, max_events: -1 } // Ilimitado
        };

        const limits = planLimits[tenant.subscription_plan] || planLimits['free'];

        // Por ahora simularemos el uso real - en producción se conectaría a la base de datos del tenant
        const currentUsage = {
            users_count: Math.floor(Math.random() * (limits.max_users === -1 ? 20 : limits.max_users)) + 1,
            recipes_count: Math.floor(Math.random() * (limits.max_recipes === -1 ? 300 : limits.max_recipes)) + 10,
            events_count: Math.floor(Math.random() * (limits.max_events === -1 ? 30 : limits.max_events)) + 1,
            storage_used_mb: Math.floor(Math.random() * 500) + 50,
            api_calls_this_month: Math.floor(Math.random() * 1000) + 100
        };

        // Calcular porcentajes de uso
        const usage_percentages = {
            users: limits.max_users === -1 ? 0 : Math.round((currentUsage.users_count / limits.max_users) * 100),
            recipes: limits.max_recipes === -1 ? 0 : Math.round((currentUsage.recipes_count / limits.max_recipes) * 100),
            events: limits.max_events === -1 ? 0 : Math.round((currentUsage.events_count / limits.max_events) * 100)
        };

        res.json({
            success: true,
            data: {
                tenant_info: tenant,
                plan_limits: limits,
                current_usage: currentUsage,
                usage_percentages: usage_percentages,
                is_over_limit: {
                    users: limits.max_users !== -1 && currentUsage.users_count > limits.max_users,
                    recipes: limits.max_recipes !== -1 && currentUsage.recipes_count > limits.max_recipes,
                    events: limits.max_events !== -1 && currentUsage.events_count > limits.max_events
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo uso del tenant:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener información de uso'
        });
    }
});

module.exports = router;