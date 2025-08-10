// routes/saas/index.js
const express = require('express');
const tenantsRouter = require('./tenants');

const router = express.Router();

// Montar rutas de tenants
router.use('/', tenantsRouter);

module.exports = router;