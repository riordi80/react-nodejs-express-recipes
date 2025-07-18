// routes/taxes.js
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

// GET /taxes - Listar todos los impuestos
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM TAXES ORDER BY name');
  res.json(rows);
});

// GET /taxes/:id - Obtener impuesto por ID
router.get('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM TAXES WHERE tax_id = ?', [id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Impuesto no encontrado' });
  res.json(rows[0]);
});

// POST /taxes - Crear nuevo impuesto
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, percent } = req.body;

  const [result] = await pool.query(
    'INSERT INTO TAXES (name, percent) VALUES (?, ?)',
    [name, percent]
  );

  await logAudit(req.user.user_id, 'create', 'TAXES', result.insertId, `Impuesto "${name}" creado con ${percent}%`);
  res.status(201).json({ message: 'Impuesto creado correctamente' });
});

// PUT /taxes/:id - Actualizar impuesto
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { name, percent } = req.body;

  await pool.query(
    'UPDATE TAXES SET name = ?, percent = ? WHERE tax_id = ?',
    [name, percent, id]
  );

  await logAudit(req.user.user_id, 'update', 'TAXES', id, `Impuesto actualizado a "${name}" (${percent}%)`);
  res.json({ message: 'Impuesto actualizado correctamente' });
});

// DELETE /taxes/:id - Eliminar impuesto
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  await pool.query('DELETE FROM TAXES WHERE tax_id = ?', [id]);

  await logAudit(req.user.user_id, 'delete', 'TAXES', id, `Impuesto con ID ${id} eliminado`);
  res.json({ message: 'Impuesto eliminado correctamente' });
});

module.exports = router;
