// routes/ingredients.js
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

// GET /ingredients - Todos los ingredientes con filtro de disponibilidad
router.get('/', authenticateToken, authorizeRoles('admin', 'chef', 'inventory_manager'), async (req, res) => {
  const { available } = req.query; // 'true', 'false', o undefined (todos)
  
  let query = 'SELECT * FROM INGREDIENTS';
  let params = [];
  
  if (available === 'true') {
    query += ' WHERE is_available = TRUE';
  } else if (available === 'false') {
    query += ' WHERE is_available = FALSE';
  }
  // Si available es undefined, devolver todos los ingredientes
  
  query += ' ORDER BY name ASC';
  
  const [rows] = await pool.query(query, params);
  res.json(rows);
});

// GET /ingredients/:id/price-history
router.get('/:id/price-history', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query(`
    SELECT ph.history_id, ph.old_price, ph.new_price, ph.change_date,
           u.user_id, u.first_name, u.last_name, u.email
    FROM PRICE_HISTORY ph
    JOIN USERS u ON ph.changed_by_user_id = u.user_id
    WHERE ph.ingredient_id = ?
    ORDER BY ph.change_date DESC
  `, [id]);

  res.json(rows);
});

// GET /ingredients/:id/allergens - Obtener alérgenos de un ingrediente
router.get('/:id/allergens', authenticateToken, authorizeRoles('admin', 'chef', 'inventory_manager'), async (req, res) => {
  const [rows] = await pool.query(`
    SELECT a.allergen_id, a.name
    FROM ALLERGENS a
    JOIN INGREDIENT_ALLERGENS ia ON a.allergen_id = ia.allergen_id
    WHERE ia.ingredient_id = ?
  `, [req.params.id]);
  res.json(rows);
});

// GET /ingredients/:id - Ingrediente por ID
router.get('/:id', authenticateToken, authorizeRoles('admin', 'chef', 'inventory_manager'), async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM INGREDIENTS WHERE ingredient_id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Ingrediente no encontrado' });
  res.json(rows[0]);
});

// POST /ingredients - Crear nuevo ingrediente
router.post('/', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const {
    name, unit, base_price, waste_percent, net_price,
    stock, stock_minimum, season, expiration_date, is_available, comment
  } = req.body;

  // Convertir fecha ISO a formato MySQL DATE (YYYY-MM-DD)
  let mysql_expiration_date = expiration_date;
  if (expiration_date && expiration_date.includes('T')) {
    mysql_expiration_date = expiration_date.split('T')[0];
  }

  const [result] = await pool.query(`
    INSERT INTO INGREDIENTS
    (name, unit, base_price, waste_percent, net_price, stock, stock_minimum, season, expiration_date, is_available, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, unit, base_price, waste_percent, net_price, stock, stock_minimum, season, mysql_expiration_date, is_available, comment]
  );

  await logAudit(req.user.user_id, 'create', 'INGREDIENTS', result.insertId, `Ingrediente "${name}" creado`);
  res.status(201).json({ 
    message: 'Ingrediente creado correctamente', 
    ingredient_id: result.insertId 
  });
});

// PUT /ingredients/:id - Actualizar ingrediente
router.put('/:id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const {
    name, unit, base_price, waste_percent, net_price,
    stock, stock_minimum, season, expiration_date, is_available, comment
  } = req.body;

  // Convertir fecha ISO a formato MySQL DATE (YYYY-MM-DD)
  let mysql_expiration_date = expiration_date;
  if (expiration_date && expiration_date.includes('T')) {
    mysql_expiration_date = expiration_date.split('T')[0];
  }

  await pool.query(`
    UPDATE INGREDIENTS SET
    name = ?, unit = ?, base_price = ?, waste_percent = ?, net_price = ?,
    stock = ?, stock_minimum = ?, season = ?, expiration_date = ?, is_available = ?, comment = ?
    WHERE ingredient_id = ?`,
    [name, unit, base_price, waste_percent, net_price, stock, stock_minimum, season, mysql_expiration_date, is_available, comment, req.params.id]
  );

  await logAudit(req.user.user_id, 'update', 'INGREDIENTS', req.params.id, `Ingrediente "${name}" actualizado`);
  res.json({ message: 'Ingrediente actualizado' });
});

// POST /ingredients/:id/allergens - Asignar alérgenos a un ingrediente
router.post('/:id/allergens', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { allergen_ids } = req.body;
  const ingredient_id = req.params.id;

  if (!Array.isArray(allergen_ids)) {
    return res.status(400).json({ message: 'allergen_ids debe ser un array' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Eliminar alérgenos existentes
    await connection.query('DELETE FROM INGREDIENT_ALLERGENS WHERE ingredient_id = ?', [ingredient_id]);

    // Insertar nuevos alérgenos
    if (allergen_ids.length > 0) {
      const values = allergen_ids.map(allergen_id => [ingredient_id, allergen_id]);
      await connection.query(
        'INSERT INTO INGREDIENT_ALLERGENS (ingredient_id, allergen_id) VALUES ?',
        [values]
      );
    }

    await connection.commit();
    
    try {
      await logAudit(req.user.user_id, 'update', 'INGREDIENT_ALLERGENS', ingredient_id, `Alérgenos actualizados para ingrediente ${ingredient_id}`);
    } catch (auditError) {
      console.error('Error en auditoría (no crítico):', auditError);
    }
    
    res.json({ message: 'Alérgenos asignados correctamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al asignar alérgenos:', error);
    res.status(500).json({ message: 'Error al asignar alérgenos', error: error.message });
  } finally {
    connection.release();
  }
});

// DELETE /ingredients/:id/allergens/:allergen_id - Quitar un alérgeno específico
router.delete('/:id/allergens/:allergen_id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id, allergen_id } = req.params;

  await pool.query('DELETE FROM INGREDIENT_ALLERGENS WHERE ingredient_id = ? AND allergen_id = ?', [id, allergen_id]);

  await logAudit(req.user.user_id, 'delete', 'INGREDIENT_ALLERGENS', id, `Alérgeno ${allergen_id} eliminado del ingrediente ${id}`);
  res.json({ message: 'Alérgeno eliminado correctamente' });
});

// DELETE /ingredients/:id - Soft delete: desactivar ingrediente
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener el nombre del ingrediente para la auditoría
    const [ingredient] = await pool.query('SELECT name FROM INGREDIENTS WHERE ingredient_id = ?', [id]);
    if (ingredient.length === 0) {
      return res.status(404).json({ message: 'Ingrediente no encontrado' });
    }

    // Soft delete: marcar como no disponible
    await pool.query('UPDATE INGREDIENTS SET is_available = FALSE WHERE ingredient_id = ?', [id]);

    await logAudit(req.user.user_id, 'update', 'INGREDIENTS', id, `Ingrediente "${ingredient[0].name}" desactivado (soft delete)`);
    res.json({ message: 'Ingrediente desactivado correctamente' });
  } catch (error) {
    console.error('Error al desactivar ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /ingredients/:id/activate - Reactivar ingrediente
router.put('/:id/activate', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener el nombre del ingrediente para la auditoría
    const [ingredient] = await pool.query('SELECT name FROM INGREDIENTS WHERE ingredient_id = ?', [id]);
    if (ingredient.length === 0) {
      return res.status(404).json({ message: 'Ingrediente no encontrado' });
    }

    // Reactivar: marcar como disponible
    await pool.query('UPDATE INGREDIENTS SET is_available = TRUE WHERE ingredient_id = ?', [id]);

    await logAudit(req.user.user_id, 'update', 'INGREDIENTS', id, `Ingrediente "${ingredient[0].name}" reactivado`);
    res.json({ message: 'Ingrediente reactivado correctamente' });
  } catch (error) {
    console.error('Error al reactivar ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /ingredients/:id/suppliers - Obtener proveedores de un ingrediente
router.get('/:id/suppliers', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id } = req.params;

  try {
    const [suppliers] = await pool.query(`
      SELECT 
        si.supplier_id,
        s.name as supplier_name,
        si.price,
        si.delivery_time,
        si.is_preferred_supplier,
        si.package_size,
        si.package_unit,
        si.minimum_order_quantity
      FROM SUPPLIER_INGREDIENTS si
      JOIN SUPPLIERS s ON si.supplier_id = s.supplier_id
      WHERE si.ingredient_id = ?
      ORDER BY si.is_preferred_supplier DESC, s.name
    `, [id]);

    res.json(suppliers);
  } catch (error) {
    console.error('Error al obtener proveedores del ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /ingredients/:id/suppliers - Añadir proveedor a un ingrediente
router.post('/:id/suppliers', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id } = req.params;
  const { 
    supplier_id, 
    price = 0, 
    delivery_time = null, 
    is_preferred_supplier = false,
    package_size = 1,
    package_unit = 'unidad',
    minimum_order_quantity = 1
  } = req.body;

  if (!supplier_id) {
    return res.status(400).json({ message: 'ID del proveedor es obligatorio' });
  }

  try {
    // Verificar que el ingrediente existe
    const [ingredient] = await pool.query('SELECT name FROM INGREDIENTS WHERE ingredient_id = ?', [id]);
    if (ingredient.length === 0) {
      return res.status(404).json({ message: 'Ingrediente no encontrado' });
    }

    // Verificar que el proveedor existe
    const [supplier] = await pool.query('SELECT name FROM SUPPLIERS WHERE supplier_id = ?', [supplier_id]);
    if (supplier.length === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    // Verificar que la relación no existe ya
    const [existing] = await pool.query(
      'SELECT * FROM SUPPLIER_INGREDIENTS WHERE ingredient_id = ? AND supplier_id = ?',
      [id, supplier_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Este proveedor ya está asignado al ingrediente' });
    }

    // Añadir la relación
    await pool.query(`
      INSERT INTO SUPPLIER_INGREDIENTS (
        ingredient_id, supplier_id, price, delivery_time, 
        is_preferred_supplier, package_size, package_unit, minimum_order_quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, supplier_id, price, delivery_time, is_preferred_supplier, package_size, package_unit, minimum_order_quantity]);

    await logAudit(req.user.user_id, 'create', 'SUPPLIER_INGREDIENTS', null, 
      `Proveedor "${supplier[0].name}" añadido al ingrediente "${ingredient[0].name}"`);

    res.status(201).json({ message: 'Proveedor añadido correctamente' });
  } catch (error) {
    console.error('Error al añadir proveedor al ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /ingredients/:id/suppliers/:supplier_id - Actualizar relación ingrediente-proveedor
router.put('/:id/suppliers/:supplier_id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id, supplier_id } = req.params;
  const { 
    price, 
    delivery_time, 
    is_preferred_supplier,
    package_size,
    package_unit,
    minimum_order_quantity
  } = req.body;

  try {
    // Verificar que la relación existe
    const [existing] = await pool.query(
      'SELECT * FROM SUPPLIER_INGREDIENTS WHERE ingredient_id = ? AND supplier_id = ?',
      [id, supplier_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Relación ingrediente-proveedor no encontrada' });
    }

    // Si se está marcando como preferido, desmarcar otros proveedores preferidos del mismo ingrediente
    if (is_preferred_supplier === true) {
      await pool.query(
        'UPDATE SUPPLIER_INGREDIENTS SET is_preferred_supplier = FALSE WHERE ingredient_id = ? AND supplier_id != ?',
        [id, supplier_id]
      );
    }

    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const values = [];
    
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }
    if (delivery_time !== undefined) {
      updates.push('delivery_time = ?');
      values.push(delivery_time);
    }
    if (is_preferred_supplier !== undefined) {
      updates.push('is_preferred_supplier = ?');
      values.push(is_preferred_supplier);
    }
    if (package_size !== undefined) {
      updates.push('package_size = ?');
      values.push(package_size);
    }
    if (package_unit !== undefined) {
      updates.push('package_unit = ?');
      values.push(package_unit);
    }
    if (minimum_order_quantity !== undefined) {
      updates.push('minimum_order_quantity = ?');
      values.push(minimum_order_quantity);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    values.push(id, supplier_id);

    await pool.query(
      `UPDATE SUPPLIER_INGREDIENTS SET ${updates.join(', ')} WHERE ingredient_id = ? AND supplier_id = ?`,
      values
    );

    await logAudit(req.user.user_id, 'update', 'SUPPLIER_INGREDIENTS', null, 
      `Relación ingrediente-proveedor actualizada: ingrediente ${id}, proveedor ${supplier_id}`);

    res.json({ message: 'Relación actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar relación ingrediente-proveedor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /ingredients/:id/suppliers/:supplier_id - Eliminar proveedor de un ingrediente
router.delete('/:id/suppliers/:supplier_id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id, supplier_id } = req.params;

  try {
    // Verificar que la relación existe
    const [existing] = await pool.query(
      'SELECT * FROM SUPPLIER_INGREDIENTS WHERE ingredient_id = ? AND supplier_id = ?',
      [id, supplier_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Relación ingrediente-proveedor no encontrada' });
    }

    // Eliminar la relación
    await pool.query(
      'DELETE FROM SUPPLIER_INGREDIENTS WHERE ingredient_id = ? AND supplier_id = ?',
      [id, supplier_id]
    );

    await logAudit(req.user.user_id, 'delete', 'SUPPLIER_INGREDIENTS', null, 
      `Proveedor eliminado del ingrediente: ingrediente ${id}, proveedor ${supplier_id}`);

    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proveedor del ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;