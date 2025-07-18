// routes/recipeCategories.js
const express = require('express');
const router = express.Router();
const mysql  = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles    = require('../middleware/roleMiddleware');
const logAudit          = require('../utils/audit');

// Configura la conexión a tu base de datos
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// GET /recipe-categories — Obtener todas las categorías
router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'chef', 'waiter'),
  async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT category_id, name FROM RECIPE_CATEGORIES ORDER BY category_id ASC'
      );
      res.json(rows);
    } catch (error) {
      console.error('Error al obtener las categorías de recetas:', error);
      res.status(500).json({ message: 'Error al obtener las categorías' });
    }
  }
);

// GET /recipe-categories/:id — Obtener una categoría por ID
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'chef', 'waiter'),
  async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await pool.query(
        'SELECT category_id, name FROM RECIPE_CATEGORIES WHERE category_id = ?',
        [id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error('Error al obtener la categoría:', error);
      res.status(500).json({ message: 'Error al obtener la categoría' });
    }
  }
);

// POST /recipe-categories — Crear una nueva categoría
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'chef'),
  async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res
        .status(400)
        .json({ message: 'El campo "name" es obligatorio y debe ser un string.' });
    }

    try {
      const [result] = await pool.query(
        'INSERT INTO RECIPE_CATEGORIES (name) VALUES (?)',
        [name.trim()]
      );
      await logAudit(
        req.user.user_id,
        'create',
        'RECIPE_CATEGORIES',
        result.insertId,
        `Categoría de receta "${name}" creada`
      );
      res.status(201).json({ message: 'Categoría creada correctamente', id: result.insertId });
    } catch (error) {
      console.error('Error al crear la categoría:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Ya existe una categoría con ese nombre.' });
      }
      res.status(500).json({ message: 'Error al crear la categoría' });
    }
  }
);

// PUT /recipe-categories/:id — Actualizar una categoría
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'chef'),
  async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res
        .status(400)
        .json({ message: 'El campo "name" es obligatorio y debe ser un string.' });
    }

    try {
      const [result] = await pool.query(
        'UPDATE RECIPE_CATEGORIES SET name = ? WHERE category_id = ?',
        [name.trim(), id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      await logAudit(
        req.user.user_id,
        'update',
        'RECIPE_CATEGORIES',
        parseInt(id, 10),
        `Categoría de receta con ID ${id} actualizada`
      );
      res.json({ message: 'Categoría actualizada correctamente' });
    } catch (error) {
      console.error('Error al actualizar la categoría:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Ya existe una categoría con ese nombre.' });
      }
      res.status(500).json({ message: 'Error al actualizar la categoría' });
    }
  }
);

// DELETE /recipe-categories/:id — Eliminar una categoría
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await pool.query(
        'DELETE FROM RECIPE_CATEGORIES WHERE category_id = ?',
        [id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Categoría no encontrada' });
      }
      await logAudit(
        req.user.user_id,
        'delete',
        'RECIPE_CATEGORIES',
        parseInt(id, 10),
        `Categoría de receta con ID ${id} eliminada`
      );
      res.json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar la categoría:', error);
      res.status(500).json({ message: 'Error al eliminar la categoría' });
    }
  }
);

module.exports = router;
