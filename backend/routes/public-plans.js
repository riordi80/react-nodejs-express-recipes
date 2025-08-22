// routes/public-plans.js
const express = require('express');
const mysql = require('mysql2/promise');

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
 * GET /api/public/plans
 * Endpoint público para obtener planes de suscripción
 * No requiere autenticación - usado por la página pública de precios
 */
router.get('/plans', async (req, res) => {
    try {
        const { include_features = 'true' } = req.query;

        // Primero obtener todos los campos básicos que sabemos que existen
        const [plans] = await masterPool.execute(`
            SELECT *
            FROM SUBSCRIPTION_PLANS 
            WHERE (is_public = TRUE OR is_public IS NULL) AND (is_active = TRUE OR is_active IS NULL)
            ORDER BY plan_id ASC
        `);


        // Procesar datos para el frontend con manejo seguro de campos faltantes
        const processedPlans = plans.map(plan => ({
            ...plan,
            // Precios con valores por defecto
            price_monthly: plan.monthly_price_cents ? plan.monthly_price_cents / 100 : 0,
            price_yearly: plan.yearly_price_cents ? plan.yearly_price_cents / 100 : 0,
            yearly_savings: plan.monthly_price_cents && plan.yearly_price_cents ? Math.round(
                (plan.monthly_price_cents * 12 - plan.yearly_price_cents) / 100
            ) : 0,
            
            // Features con parsing ultra seguro
            features: include_features === 'true' ? 
                (() => {
                    try {
                        if (!plan.features) return [];
                        // Si empieza con [ o {, es probablemente JSON
                        if (plan.features.trim().startsWith('[') || plan.features.trim().startsWith('{')) {
                            return JSON.parse(plan.features);
                        }
                        // Si no, tratarlo como texto simple
                        return [plan.features];
                    } catch (e) {
                        return [];
                    }
                })() : undefined,
                
            // Campos que pueden no existir aún
            plan_color: plan.plan_color || 'gray',
            sort_order: plan.sort_order || 0,
            is_popular: Boolean(plan.is_popular),
            yearly_discount_percentage: plan.yearly_discount_percentage || 0,
            
            // Límites con valores por defecto seguros
            max_users: plan.max_users !== undefined ? plan.max_users : 5,
            max_recipes: plan.max_recipes !== undefined ? plan.max_recipes : 100,
            max_events: plan.max_events !== undefined ? plan.max_events : 10,
            max_storage_mb: plan.max_storage_mb || 500,
            max_api_calls_monthly: plan.max_api_calls_monthly || 1000,
            
            // Capabilities con valores por defecto
            support_level: plan.support_level || 'email',
            has_analytics: Boolean(plan.has_analytics),
            has_multi_location: Boolean(plan.has_multi_location), 
            has_custom_api: Boolean(plan.has_custom_api),
            has_white_label: Boolean(plan.has_white_label),
            
            // Mantener compatibilidad con frontend
            limits: {
                users: (plan.max_users !== undefined && plan.max_users === -1) ? 'unlimited' : (plan.max_users || 5),
                recipes: (plan.max_recipes !== undefined && plan.max_recipes === -1) ? 'unlimited' : (plan.max_recipes || 100),
                events: (plan.max_events !== undefined && plan.max_events === -1) ? 'unlimited' : (plan.max_events || 10),
                storage_mb: plan.max_storage_mb || 500,
                api_calls_monthly: plan.max_api_calls_monthly || 1000
            },
            capabilities: {
                analytics: Boolean(plan.has_analytics),
                multi_location: Boolean(plan.has_multi_location),
                custom_api: Boolean(plan.has_custom_api),
                white_label: Boolean(plan.has_white_label),
                support_level: plan.support_level || 'email'
            }
        }));

        res.json({
            success: true,
            data: processedPlans
        });

    } catch (error) {
        console.error('Error obteniendo planes públicos:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener planes de suscripción',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * GET /api/public/plans/:slug
 * Obtener detalles de un plan específico por slug
 */
router.get('/plans/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        const [plans] = await masterPool.execute(`
            SELECT 
                plan_id,
                plan_name,
                plan_slug,
                plan_description,
                plan_color,
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
                is_active
            FROM SUBSCRIPTION_PLANS 
            WHERE plan_slug = ? AND is_public = TRUE AND is_active = TRUE
        `, [slug]);

        if (plans.length === 0) {
            return res.status(404).json({
                error: 'Plan no encontrado',
                message: 'El plan especificado no existe o no está disponible públicamente'
            });
        }

        const plan = plans[0];
        const processedPlan = {
            ...plan,
            monthly_price: plan.monthly_price_cents / 100,
            yearly_price: plan.yearly_price_cents / 100,
            yearly_savings: Math.round(
                (plan.monthly_price_cents * 12 - plan.yearly_price_cents) / 100
            ),
            features: (() => {
                try {
                    if (!plan.features) return [];
                    // Si empieza con [ o {, es probablemente JSON
                    if (plan.features.trim().startsWith('[') || plan.features.trim().startsWith('{')) {
                        return JSON.parse(plan.features);
                    }
                    // Si no, tratarlo como texto simple
                    return [plan.features];
                } catch (e) {
                    return [];
                }
            })(),
            limits: {
                users: plan.max_users === -1 ? 'unlimited' : plan.max_users,
                recipes: plan.max_recipes === -1 ? 'unlimited' : plan.max_recipes,
                events: plan.max_events === -1 ? 'unlimited' : plan.max_events,
                storage_mb: plan.max_storage_mb,
                api_calls_monthly: plan.max_api_calls_monthly
            },
            capabilities: {
                analytics: plan.has_analytics,
                multi_location: plan.has_multi_location,
                custom_api: plan.has_custom_api,
                white_label: plan.has_white_label,
                support_level: plan.support_level
            }
        };

        res.json({
            success: true,
            data: processedPlan
        });

    } catch (error) {
        console.error('Error obteniendo plan por slug:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener información del plan'
        });
    }
});

module.exports = router;