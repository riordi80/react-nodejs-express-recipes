// routes/ingredient-categories.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const logAudit = require('../utils/audit');

// Multi-tenant: usar req.tenantDb en lugar de pool estático

// GET /ingredient-categories - Obtener todas las categorías de ingredientes
router.get('/', authenticateToken, authorizeRoles('admin', 'chef', 'waiter'), async (req, res) => {
  try {
    const [rows] = await req.tenantDb.query('SELECT * FROM INGREDIENT_CATEGORIES ORDER BY category_id ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener las categorías de ingredientes:', error);
    res.status(500).json({ message: 'Error al obtener las categorías de ingredientes' });
  }
});

// GET /ingredient-categories/:id - Obtener una categoría por ID
router.get('/:id', authenticateToken, authorizeRoles('admin', 'chef', 'waiter'), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await req.tenantDb.query('SELECT * FROM INGREDIENT_CATEGORIES WHERE category_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Categoría de ingrediente no encontrada' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener la categoría de ingrediente:', error);
    res.status(500).json({ message: 'Error al obtener la categoría de ingrediente' });
  }
});

// POST /ingredient-categories - Crear una nueva categoría de ingrediente
router.post('/', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'El campo "name" es obligatorio y debe ser un string.' });
  }

  try {
    const [result] = await req.tenantDb.query('INSERT INTO INGREDIENT_CATEGORIES (name) VALUES (?)', [name.trim()]);
    await logAudit(req.tenantDb, req.user.user_id, 'create', 'INGREDIENT_CATEGORIES', result.insertId, `Categoría de ingrediente "${name}" creada`);
    res.status(201).json({ message: 'Categoría de ingrediente creada correctamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear la categoría de ingrediente:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe una categoría de ingrediente con ese nombre.' });
    }
    res.status(500).json({ message: 'Error al crear la categoría de ingrediente' });
  }
});

// PUT /ingredient-categories/:id - Actualizar una categoría de ingrediente
router.put('/:id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'El campo "name" es obligatorio y debe ser un string.' });
  }

  try {
    const [result] = await req.tenantDb.query(
      'UPDATE INGREDIENT_CATEGORIES SET name = ? WHERE category_id = ?',
      [name.trim(), id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Categoría de ingrediente no encontrada' });
    }
    await logAudit(req.tenantDb, req.user.user_id, 'update', 'INGREDIENT_CATEGORIES', parseInt(id, 10), `Categoría de ingrediente con ID ${id} actualizada`);
    res.json({ message: 'Categoría de ingrediente actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar la categoría de ingrediente:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe una categoría de ingrediente con ese nombre.' });
    }
    res.status(500).json({ message: 'Error al actualizar la categoría de ingrediente' });
  }
});

// DELETE /ingredient-categories/:id - Eliminar una categoría de ingrediente
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await req.tenantDb.query('DELETE FROM INGREDIENT_CATEGORIES WHERE category_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Categoría de ingrediente no encontrada' });
    }
    await logAudit(req.tenantDb, req.user.user_id, 'delete', 'INGREDIENT_CATEGORIES', parseInt(id, 10), `Categoría de ingrediente con ID ${id} eliminada`);
    res.json({ message: 'Categoría de ingrediente eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la categoría de ingrediente:', error);
    res.status(500).json({ message: 'Error al eliminar la categoría de ingrediente' });
  }
});

module.exports = router;