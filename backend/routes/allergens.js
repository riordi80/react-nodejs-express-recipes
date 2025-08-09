// routes/allergens.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const logAudit = require('../utils/audit');

// Multi-tenant: usar req.tenantDb en lugar de pool estático

// GET /allergens - Obtener todos los alérgenos
router.get('/', authenticateToken, authorizeRoles('admin', 'chef', 'waiter'), async (req, res) => {
  try {
    const [rows] = await req.tenantDb.query('SELECT * FROM ALLERGENS ORDER BY allergen_id ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener los alérgenos:', error);
    res.status(500).json({ message: 'Error al obtener los alérgenos' });
  }
});

// GET /allergens/:id - Obtener un alérgeno por ID
router.get('/:id', authenticateToken, authorizeRoles('admin', 'chef', 'waiter'), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await req.tenantDb.query('SELECT * FROM ALLERGENS WHERE allergen_id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Alérgeno no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener el alérgeno:', error);
    res.status(500).json({ message: 'Error al obtener el alérgeno' });
  }
});

// POST /allergens - Crear un nuevo alérgeno
router.post('/', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'El campo "name" es obligatorio y debe ser un string.' });
  }

  try {
    const [result] = await req.tenantDb.query('INSERT INTO ALLERGENS (name) VALUES (?)', [name.trim()]);
    await logAudit(req.user.user_id, 'create', 'ALLERGENS', result.insertId, `Alérgeno "${name}" creado`);
    res.status(201).json({ message: 'Alérgeno creado correctamente', id: result.insertId });
  } catch (error) {
    console.error('Error al crear el alérgeno:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe un alérgeno con ese nombre.' });
    }
    res.status(500).json({ message: 'Error al crear el alérgeno' });
  }
});

// PUT /allergens/:id - Actualizar un alérgeno
router.put('/:id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'El campo "name" es obligatorio y debe ser un string.' });
  }

  try {
    const [result] = await req.tenantDb.query(
      'UPDATE ALLERGENS SET name = ? WHERE allergen_id = ?',
      [name.trim(), id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Alérgeno no encontrado' });
    }
    await logAudit(req.user.user_id, 'update', 'ALLERGENS', parseInt(id, 10), `Alérgeno con ID ${id} actualizado`);
    res.json({ message: 'Alérgeno actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el alérgeno:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe un alérgeno con ese nombre.' });
    }
    res.status(500).json({ message: 'Error al actualizar el alérgeno' });
  }
});

// DELETE /allergens/:id - Eliminar un alérgeno
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await req.tenantDb.query('DELETE FROM ALLERGENS WHERE allergen_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Alérgeno no encontrado' });
    }
    await logAudit(req.user.user_id, 'delete', 'ALLERGENS', parseInt(id, 10), `Alérgeno con ID ${id} eliminado`);
    res.json({ message: 'Alérgeno eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el alérgeno:', error);
    res.status(500).json({ message: 'Error al eliminar el alérgeno' });
  }
});

module.exports = router;
