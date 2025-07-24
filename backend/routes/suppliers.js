// routes/suppliers.js
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

// GET /suppliers
router.get('/', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM SUPPLIERS ORDER BY name');
  res.json(rows);
});

// GET /suppliers/:id
router.get('/:id', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM SUPPLIERS WHERE supplier_id = ?', [id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Proveedor no encontrado' });
  res.json(rows[0]);
});

// POST /suppliers
router.post('/', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  try {
    const { name, phone, email, website_url, address } = req.body;
    
    // Validación básica
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO SUPPLIERS (name, phone, email, website_url, address) VALUES (?, ?, ?, ?, ?)',
      [name, phone, email, website_url, address]
    );

    await logAudit(req.user.user_id, 'create', 'SUPPLIERS', result.insertId, `Proveedor "${name}" creado`);
    
    res.status(201).json({ message: 'Proveedor creado correctamente' });
  } catch (error) {
    console.error('Error en POST /suppliers:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// PUT /suppliers/:id
router.put('/:id', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, website_url, address } = req.body;

  await pool.query(
    'UPDATE SUPPLIERS SET name = ?, phone = ?, email = ?, website_url = ?, address = ? WHERE supplier_id = ?',
    [name, phone, email, website_url, address, id]
  );

  await logAudit(req.user.user_id, 'update', 'SUPPLIERS', id, `Proveedor actualizado: ${name}`);
  res.json({ message: 'Proveedor actualizado' });
});

// DELETE /suppliers/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM SUPPLIER_INGREDIENTS WHERE supplier_id = ?', [id]);
  await pool.query('DELETE FROM SUPPLIERS WHERE supplier_id = ?', [id]);

  await logAudit(req.user.user_id, 'delete', 'SUPPLIERS', id, `Proveedor con ID ${id} eliminado`);
  res.json({ message: 'Proveedor eliminado' });
});

// GET /suppliers/:id/ingredients
router.get('/:id/ingredients', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(`
    SELECT si.ingredient_id, i.name, si.price, si.delivery_time, si.is_preferred_supplier, 
           si.package_size, si.package_unit, si.minimum_order_quantity
    FROM SUPPLIER_INGREDIENTS si
    JOIN INGREDIENTS i ON si.ingredient_id = i.ingredient_id
    WHERE si.supplier_id = ?
  `, [id]);
  res.json(rows);
});

// POST /suppliers/:id/ingredients
router.post('/:id/ingredients', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const { id } = req.params;
  const { ingredients } = req.body;

  try {
    // Verificar si el cuerpo contiene múltiples ingredientes o uno solo
    const ingredientsArray = ingredients || [req.body];
    
    // Validar que tenemos ingredientes válidos
    if (!ingredientsArray || ingredientsArray.length === 0) {
      return res.status(400).json({ message: 'No se han proporcionado ingredientes válidos' });
    }

    // Validar campos requeridos
    for (const ingredient of ingredientsArray) {
      if (!ingredient.ingredient_id || !ingredient.price) {
        return res.status(400).json({ message: 'Faltan campos requeridos: ingredient_id y price' });
      }
    }
    
    // Validar que no haya ingredientes duplicados
    const duplicateChecks = await Promise.all(
      ingredientsArray.map(async (ingredient) => {
        const [exists] = await pool.query(
          'SELECT 1 FROM SUPPLIER_INGREDIENTS WHERE supplier_id = ? AND ingredient_id = ?',
          [id, ingredient.ingredient_id]
        );
        return { ingredient_id: ingredient.ingredient_id, exists: exists.length > 0 };
      })
    );

    const duplicates = duplicateChecks.filter(check => check.exists);
    if (duplicates.length > 0) {
      return res.status(400).json({ 
        message: `Los siguientes ingredientes ya están asociados a este proveedor: ${duplicates.map(d => d.ingredient_id).join(', ')}` 
      });
    }

    // Insertar todos los ingredientes
    await Promise.all(
      ingredientsArray.map(async (ingredient) => {
        await pool.query(
          `INSERT INTO SUPPLIER_INGREDIENTS 
           (supplier_id, ingredient_id, price, delivery_time, is_preferred_supplier, package_size, package_unit, minimum_order_quantity) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, 
            ingredient.ingredient_id, 
            ingredient.price, 
            ingredient.delivery_time || null, 
            ingredient.is_preferred_supplier || false,
            ingredient.package_size || 1.0,
            ingredient.package_unit || 'unidad',
            ingredient.minimum_order_quantity || 1.0
          ]
        );
      })
    );

    await logAudit(req.user.user_id, 'create', 'SUPPLIER_INGREDIENTS', null, `${ingredientsArray.length} ingrediente(s) asignado(s) al proveedor ${id}`);
    res.status(201).json({ message: `${ingredientsArray.length} ingrediente(s) asignado(s) al proveedor correctamente` });
  } catch (error) {
    console.error('Error al asignar ingredientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /suppliers/:id/ingredients/:ingredient_id
router.put('/:id/ingredients/:ingredient_id', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const { id, ingredient_id } = req.params;
  const { price, delivery_time, is_preferred_supplier, package_size, package_unit, minimum_order_quantity } = req.body;

  try {
    // Verificar que la relación existe
    const [exists] = await pool.query(
      'SELECT 1 FROM SUPPLIER_INGREDIENTS WHERE supplier_id = ? AND ingredient_id = ?',
      [id, ingredient_id]
    );

    if (exists.length === 0) {
      return res.status(404).json({ message: 'La relación proveedor-ingrediente no existe' });
    }

    // Actualizar la relación
    await pool.query(
      `UPDATE SUPPLIER_INGREDIENTS 
       SET price = ?, delivery_time = ?, is_preferred_supplier = ?, package_size = ?, package_unit = ?, minimum_order_quantity = ?
       WHERE supplier_id = ? AND ingredient_id = ?`,
      [price, delivery_time, is_preferred_supplier, package_size || 1.0, package_unit || 'unidad', minimum_order_quantity || 1.0, id, ingredient_id]
    );

    await logAudit(req.user.user_id, 'update', 'SUPPLIER_INGREDIENTS', null, `Relación proveedor ${id} - ingrediente ${ingredient_id} actualizada`);
    res.json({ message: 'Relación proveedor-ingrediente actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar relación proveedor-ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /suppliers/:id/ingredients/:ingredient_id
router.delete('/:id/ingredients/:ingredient_id', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const { id, ingredient_id } = req.params;
  
  try {
    // Verificar que la relación existe
    const [exists] = await pool.query(
      'SELECT 1 FROM SUPPLIER_INGREDIENTS WHERE supplier_id = ? AND ingredient_id = ?',
      [id, ingredient_id]
    );

    if (exists.length === 0) {
      return res.status(404).json({ message: 'La relación proveedor-ingrediente no existe' });
    }

    await pool.query(
      'DELETE FROM SUPPLIER_INGREDIENTS WHERE supplier_id = ? AND ingredient_id = ?',
      [id, ingredient_id]
    );

    await logAudit(req.user.user_id, 'delete', 'SUPPLIER_INGREDIENTS', null, `Ingrediente ${ingredient_id} desvinculado del proveedor ${id}`);
    res.json({ message: 'Ingrediente eliminado del proveedor' });
  } catch (error) {
    console.error('Error al eliminar relación proveedor-ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
