// routes/superadmin/settings.js
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
 * GET /api/superadmin/settings/plans
 * Obtener configuración de planes
 */
router.get('/plans', requirePermission('configure_system'), async (req, res) => {
    try {
        const [plans] = await masterPool.execute(`
            SELECT * FROM SUBSCRIPTION_PLANS 
            ORDER BY sort_order ASC
        `);

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
        console.error('Error obteniendo configuración de planes:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener configuración de planes'
        });
    }
});

/**
 * PUT /api/superadmin/settings/plans/:planId
 * Actualizar configuración de un plan
 */
router.put('/plans/:planId', requirePermission('configure_system'), auditLog('update_plan'), async (req, res) => {
    try {
        const { planId } = req.params;
        const {
            name,
            description,
            price_monthly,
            price_yearly,
            max_users,
            max_recipes,
            max_events,
            max_storage_gb,
            api_calls_per_month,
            features,
            is_active
        } = req.body;

        const updateFields = [];
        const updateValues = [];

        if (name !== undefined) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            updateValues.push(description);
        }
        if (price_monthly !== undefined) {
            updateFields.push('price_monthly_cents = ?');
            updateValues.push(Math.round(price_monthly * 100));
        }
        if (price_yearly !== undefined) {
            updateFields.push('price_yearly_cents = ?');
            updateValues.push(Math.round(price_yearly * 100));
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
        if (max_storage_gb !== undefined) {
            updateFields.push('max_storage_gb = ?');
            updateValues.push(max_storage_gb);
        }
        if (api_calls_per_month !== undefined) {
            updateFields.push('api_calls_per_month = ?');
            updateValues.push(api_calls_per_month);
        }
        if (features !== undefined) {
            updateFields.push('features = ?');
            updateValues.push(JSON.stringify(features));
        }
        if (is_active !== undefined) {
            updateFields.push('is_active = ?');
            updateValues.push(is_active);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                error: 'No hay campos para actualizar'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(planId);

        await masterPool.execute(`
            UPDATE SUBSCRIPTION_PLANS 
            SET ${updateFields.join(', ')} 
            WHERE plan_id = ?
        `, updateValues);

        res.json({
            success: true,
            message: 'Plan actualizado correctamente'
        });

    } catch (error) {
        console.error('Error actualizando plan:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al actualizar el plan'
        });
    }
});

module.exports = router;