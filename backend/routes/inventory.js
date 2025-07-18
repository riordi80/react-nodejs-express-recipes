// routes/inventory.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const logAudit = require('../utils/audit');

// Configura la conexión a tu base de datos
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// GET /inventory/:ingredient_id - Historial de movimientos
router.get('/:ingredient_id', authenticateToken, authorizeRoles('admin', 'inventory_manager'), async (req, res) => {
  const { ingredient_id } = req.params;

  const [rows] = await pool.query(`
    SELECT movement_id, date, quantity, movement_type, comment, recorded_by_user_id
    FROM INVENTORY_MOVEMENTS
    WHERE ingredient_id = ?
    ORDER BY date DESC
  `, [ingredient_id]);

  res.json(rows);
});

// GET /inventory/stock/:ingredient_id - Stock actual
router.get('/stock/:ingredient_id', authenticateToken, authorizeRoles('admin', 'inventory_manager'), async (req, res) => {
  const { ingredient_id } = req.params;

  const [rows] = await pool.query(`
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

  const [result] = await pool.query(`
    INSERT INTO INVENTORY_MOVEMENTS
    (ingredient_id, date, quantity, movement_type, comment, recorded_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [ingredient_id, date, quantity, movement_type, comment, user_id]);

  await logAudit(
    user_id,
    'create',
    'INVENTORY_MOVEMENTS',
    result.insertId,
    `Movimiento de tipo "${movement_type}" registrado para ingrediente ${ingredient_id} (cantidad: ${quantity})`
  );

  res.status(201).json({ message: 'Movimiento registrado correctamente' });
});

module.exports = router;
