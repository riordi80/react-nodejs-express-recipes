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

module.exports = router;