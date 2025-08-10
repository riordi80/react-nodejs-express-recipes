// routes/users.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const logAudit = require('../utils/audit');

// Multi-tenant: usar req.tenantDb en lugar de pool estático

// GET /users
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const [rows] = await req.tenantDb.query('SELECT user_id, first_name, last_name, email, role, is_active FROM USERS');
  res.json(rows);
});

// GET /users/:id
router.get('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const [rows] = await req.tenantDb.query('SELECT user_id, first_name, last_name, email, role, is_active FROM USERS WHERE user_id = ?', [id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.json(rows[0]);
});

// POST /users
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { first_name, last_name, email, role, password, is_active } = req.body;
  const password_hash = await bcrypt.hash(password, 10);
  const [result] = await req.tenantDb.query(
    'INSERT INTO USERS (first_name, last_name, email, role, password_hash, is_active) VALUES (?, ?, ?, ?, ?, ?)', 
    [first_name, last_name, email, role, password_hash, is_active]
  );

  await logAudit(req.tenantDb, req.user.user_id, 'create', 'USERS', result.insertId, `Usuario "${email}" creado`);
  res.status(201).json({ message: 'Usuario creado correctamente' });
});

// PUT /users/:id
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, role, is_active } = req.body;

  await req.tenantDb.query(
    'UPDATE USERS SET first_name = ?, last_name = ?, email = ?, role = ?, is_active = ? WHERE user_id = ?', 
    [first_name, last_name, email, role, is_active, id]
  );

  await logAudit(req.tenantDb, req.user.user_id, 'update', 'USERS', id, `Usuario "${email}" actualizado`);
  res.json({ message: 'Usuario actualizado' });
});

// DELETE /users/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  await req.tenantDb.query('DELETE FROM USERS WHERE user_id = ?', [id]);

  await logAudit(req.tenantDb, req.user.user_id, 'delete', 'USERS', id, `Usuario con ID ${id} eliminado`);
  res.json({ message: 'Usuario eliminado' });
});

module.exports = router;
