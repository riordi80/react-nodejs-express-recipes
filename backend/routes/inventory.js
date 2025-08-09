// routes/inventory.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const logAudit = require('../utils/audit');

// Multi-tenant: usar req.tenantDb en lugar de pool estático
// Nota: Los límites de conexión se manejan ahora en databaseManager.js

// GET /inventory/:ingredient_id - Historial de movimientos
router.get('/:ingredient_id', authenticateToken, authorizeRoles('admin', 'inventory_manager'), async (req, res) => {
  const { ingredient_id } = req.params;

  const [rows] = await req.tenantDb.query(`
    SELECT movement_id, date, quantity, movement_type, comment, recorded_by_user_id
    FROM INVENTORY_MOVEMENTS
    WHERE ingredient_id = ?
    ORDER BY date DESC
    LIMIT 100  -- OPTIMIZACIÓN: Limitar historial para evitar problemas de memoria
  `, [ingredient_id]);

  res.json(rows);
});

// GET /inventory/stock/:ingredient_id - Stock actual
router.get('/stock/:ingredient_id', authenticateToken, authorizeRoles('admin', 'inventory_manager'), async (req, res) => {
  const { ingredient_id } = req.params;

  const [rows] = await req.tenantDb.query(`
    SELECT
      ingredient_id,
      SUM(CASE 
        WHEN movement_type IN ('entry', 'adjustment') THEN quantity
        ELSE -quantity
      END) AS stock
    FROM INVENTORY_MOVEMENTS
    WHERE ingredient_id = ?
    GROUP BY ingredient_id
  `, [ingredient_id]);

  const stock = rows.length > 0 ? rows[0].stock : 0;
  res.json({ ingredient_id, stock });
});

// POST /inventory - Registrar nuevo movimiento
router.post('/', authenticateToken, authorizeRoles('admin', 'inventory_manager'), async (req, res) => {
  const { ingredient_id, date, quantity, movement_type, comment } = req.body;
  const user_id = req.user.user_id;

  const [result] = await req.tenantDb.query(`
    INSERT INTO INVENTORY_MOVEMENTS
    (ingredient_id, date, quantity, movement_type, comment, recorded_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [ingredient_id, date, quantity, movement_type, comment, user_id]);

  await logAudit(
    req.tenantDb,
    user_id,
    'create',
    'INVENTORY_MOVEMENTS',
    result.insertId,
    `Movimiento de tipo "${movement_type}" registrado para ingrediente ${ingredient_id} (cantidad: ${quantity})`
  );

  res.status(201).json({ message: 'Movimiento registrado correctamente' });
});

module.exports = router;
