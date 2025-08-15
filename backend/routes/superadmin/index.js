// routes/superadmin/index.js
const express = require('express');
const { requireSuperAdmin, rateLimitSuperAdmin } = require('../../middleware/superAdminMiddleware');

const router = express.Router();

// Importar sub-routers
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const tenantsRoutes = require('./tenants');
const usersRoutes = require('./users');
const billingRoutes = require('./billing');
const monitoringRoutes = require('./monitoring');
const settingsRoutes = require('./settings');

// Rutas de autenticación (NO requieren middleware de autenticación)
router.use('/auth', authRoutes);

// Aplicar middleware de superadmin y rate limiting a todas las rutas protegidas
router.use(requireSuperAdmin);
router.use(rateLimitSuperAdmin());

// Montar sub-rutas protegidas
router.use('/dashboard', dashboardRoutes);
router.use('/tenants', tenantsRoutes);
router.use('/users', usersRoutes);
router.use('/billing', billingRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/settings', settingsRoutes);

// Ruta de verificación de estado del panel superadmin
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        superadmin: {
            user_id: req.superAdmin.user_id,
            email: req.superAdmin.email,
            role: req.superAdmin.superadmin_role,
            permissions: req.superAdmin.permissions
        }
    });
});

module.exports = router;