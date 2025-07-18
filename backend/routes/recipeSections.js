// routes/recipeSections.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Configura la conexión a tu base de datos
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// GET /recipes/:id/sections
router.get('/:id/sections', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    `SELECT section_id, name, \`order\` FROM RECIPE_SECTIONS WHERE recipe_id = ? ORDER BY \`order\` ASC`, [id]
  );
  res.json(rows);
});

// POST /recipes/:id/sections
router.post('/:id/sections', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { name, order } = req.body;
  const { id } = req.params;
  await pool.query(
    `INSERT INTO RECIPE_SECTIONS (recipe_id, name, \`order\`) VALUES (?, ?, ?)`,
    [id, name, order]
  );
  res.status(201).json({ message: 'Sección creada correctamente' });
});

// PUT /recipes/:id/sections/:section_id
router.put('/:id/sections/:section_id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { name, order } = req.body;
  const { section_id } = req.params;
  await pool.query(
    `UPDATE RECIPE_SECTIONS SET name = ?, \`order\` = ? WHERE section_id = ?`,
    [name, order, section_id]
  );
  res.json({ message: 'Sección actualizada correctamente' });
});

// DELETE /recipes/:id/sections/:section_id
router.delete('/:recipe_id/sections/:section_id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { recipe_id, section_id } = req.params;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Desvincular ingredientes asociados
    await connection.query(`
      UPDATE RECIPE_INGREDIENTS
      SET section_id = NULL
      WHERE section_id = ? AND recipe_id = ?
    `, [section_id, recipe_id]);

    // 2. Eliminar sección
    await connection.query(`
      DELETE FROM RECIPE_SECTIONS
      WHERE section_id = ? AND recipe_id = ?
    `, [section_id, recipe_id]);

    await connection.commit();
    res.json({ message: 'Sección eliminada correctamente y sus ingredientes fueron desvinculados' });

  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar sección:', error);
    res.status(500).json({ message: 'Error al eliminar la sección' });
  } finally {
    connection.release();
  }
});



module.exports = router;
