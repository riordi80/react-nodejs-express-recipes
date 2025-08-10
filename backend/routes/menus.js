// routes/menus.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const logAudit = require('../utils/audit');

// Multi-tenant: usar req.tenantDb en lugar de pool estático

// GET /menus
router.get('/', authenticateToken, authorizeRoles('admin', 'chef', 'waiter'), async (req, res) => {
  const [rows] = await req.tenantDb.query('SELECT * FROM MENUS ORDER BY menu_date DESC');
  res.json(rows);
});

// GET /menus/:id
router.get('/:id', authenticateToken, authorizeRoles('admin', 'chef', 'waiter'), async (req, res) => {
  const { id } = req.params;
  const [rows] = await req.tenantDb.query('SELECT * FROM MENUS WHERE menu_id = ?', [id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Menú no encontrado' });
  res.json(rows[0]);
});

// POST /menus
router.post('/', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { name, menu_date } = req.body;
  const [result] = await req.tenantDb.query('INSERT INTO MENUS (name, menu_date) VALUES (?, ?)', [name, menu_date]);

  await logAudit(req.tenantDb, req.user.user_id, 'create', 'MENUS', result.insertId, `Menú "${name}" creado para ${menu_date}`);
  res.status(201).json({ message: 'Menú creado correctamente' });
});

// PUT /menus/:id
router.put('/:id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id } = req.params;
  const { name, menu_date } = req.body;

  await req.tenantDb.query('UPDATE MENUS SET name = ?, menu_date = ? WHERE menu_id = ?', [name, menu_date, id]);

  await logAudit(req.tenantDb, req.user.user_id, 'update', 'MENUS', id, `Menú "${name}" actualizado`);
  res.json({ message: 'Menú actualizado correctamente' });
});

// DELETE /menus/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  await req.tenantDb.query('DELETE FROM MENU_RECIPES WHERE menu_id = ?', [id]);
  await req.tenantDb.query('DELETE FROM MENUS WHERE menu_id = ?', [id]);

  await logAudit(req.tenantDb, req.user.user_id, 'delete', 'MENUS', id, `Menú con ID ${id} eliminado`);
  res.json({ message: 'Menú eliminado correctamente' });
});

// GET /menus/:id/recipes
router.get('/:id/recipes', authenticateToken, authorizeRoles('admin', 'chef', 'waiter'), async (req, res) => {
  const { id } = req.params;
  const [rows] = await req.tenantDb.query(`
    SELECT r.recipe_id, r.name, r.net_price, r.cost_per_serving
    FROM MENU_RECIPES mr
    JOIN RECIPES r ON mr.recipe_id = r.recipe_id
    WHERE mr.menu_id = ?
  `, [id]);
  res.json(rows);
});

// POST /menus/:id/recipes
router.post('/:id/recipes', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id } = req.params;
  const { recipe_id } = req.body;

  const [exists] = await req.tenantDb.query(
    'SELECT 1 FROM MENU_RECIPES WHERE menu_id = ? AND recipe_id = ?',
    [id, recipe_id]
  );

  if (exists.length > 0) {
    return res.status(400).json({ message: 'La receta ya está asignada a este menú.' });
  }

  await req.tenantDb.query('INSERT INTO MENU_RECIPES (menu_id, recipe_id) VALUES (?, ?)', [id, recipe_id]);

  await logAudit(req.tenantDb, req.user.user_id, 'create', 'MENU_RECIPES', null, `Receta ${recipe_id} asignada al menú ${id}`);
  res.status(201).json({ message: 'Receta asignada al menú' });
});

// DELETE /menus/:id/recipes/:recipe_id
router.delete('/:id/recipes/:recipe_id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id, recipe_id } = req.params;

  await req.tenantDb.query('DELETE FROM MENU_RECIPES WHERE menu_id = ? AND recipe_id = ?', [id, recipe_id]);

  await logAudit(req.tenantDb, req.user.user_id, 'delete', 'MENU_RECIPES', null, `Receta ${recipe_id} eliminada del menú ${id}`);
  res.json({ message: 'Receta eliminada del menú' });
});

module.exports = router;
