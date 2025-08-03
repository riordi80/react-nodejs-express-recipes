// routes/recipes.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles   = require('../middleware/roleMiddleware');
const logAudit         = require('../utils/audit');

// OPTIMIZACIÓN: Pool de conexiones con límites para evitar agotamiento de memoria
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Límites críticos para servidores con poca memoria
  connectionLimit: 3,          // Máximo 3 conexiones simultáneas
  idleTimeout: 300000,         // Cerrar conexiones inactivas después de 5min
  maxIdle: 1                   // Máximo 1 conexión idle
});

// GET /recipes - Obtener recetas con categorías y filtros
router.get('/', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { search, category, prepTime, difficulty, ingredient, allergens } = req.query;

  // Base SQL con agrupación de categorías y cálculo dinámico de costos
  const sql = `
    SELECT
      r.recipe_id,
      r.name,
      r.servings,
      r.production_servings,
      COALESCE(
        (SELECT SUM(ri.quantity_per_serving * i.base_price * (1 + i.waste_percent) * r.servings) / r.servings
         FROM RECIPE_INGREDIENTS ri 
         JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id 
         WHERE ri.recipe_id = r.recipe_id),
        r.cost_per_serving
      ) as cost_per_serving,
      r.cost_percentage,
      r.net_price,
      r.prep_time,
      r.difficulty,
      r.is_featured_recipe,
      r.instructions,
      r.tax_id,
      GROUP_CONCAT(DISTINCT rc.name ORDER BY rc.name SEPARATOR ', ') AS categories
    FROM RECIPES r
    LEFT JOIN RECIPE_CATEGORY_ASSIGNMENTS rca ON r.recipe_id = rca.recipe_id
    LEFT JOIN RECIPE_CATEGORIES rc              ON rca.category_id = rc.category_id
  `;

  const joins = [];
  const wheres = [];
  const params = [];

  // Filtros opcionales
  if (search) {
    wheres.push('r.name LIKE ?');
    params.push(`%${search}%`);
  }
  if (prepTime) {
    wheres.push('r.prep_time <= ?');
    params.push(prepTime);
  }
  if (difficulty) {
    wheres.push('r.difficulty = ?');
    params.push(difficulty.toLowerCase());
  }
  if (category) {
    wheres.push('? IN (SELECT rc2.name FROM RECIPE_CATEGORY_ASSIGNMENTS rca2 JOIN RECIPE_CATEGORIES rc2 ON rca2.category_id = rc2.category_id WHERE rca2.recipe_id = r.recipe_id)');
    params.push(category);
  }
  if (ingredient) {
    joins.push(
      'JOIN RECIPE_INGREDIENTS ri ON r.recipe_id = ri.recipe_id',
      'JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id'
    );
    wheres.push('i.name = ?');
    params.push(ingredient);
  }
  if (allergens) {
    const list = allergens.split(',').map(a => a.trim());
    const placeholders = list.map(() => '?').join(',');
    wheres.push(
      `r.recipe_id NOT IN (
        SELECT ri2.recipe_id
          FROM RECIPE_INGREDIENTS ri2
          JOIN INGREDIENT_ALLERGENS ia ON ri2.ingredient_id = ia.ingredient_id
          JOIN ALLERGENS a ON ia.allergen_id = a.allergen_id
        WHERE a.name IN (${placeholders})
      )`
    );
    params.push(...list);
  }

  const whereClause = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
  const groupBy     = 'GROUP BY r.recipe_id';
  
  // OPTIMIZACIÓN CRÍTICA: Añadir límite y orden para evitar agotamiento de memoria
  const orderBy     = 'ORDER BY r.name ASC';
  const maxRecipes  = 200; // Límite de seguridad
  const limitClause = 'LIMIT ?';
  params.push(maxRecipes);
  
  const finalSql    = [sql, ...joins, whereClause, groupBy, orderBy, limitClause].join(' ');

  try {
    const [rows] = await pool.query(finalSql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching filtered recipes:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /recipes/:id - Obtener una receta específica
router.get('/:id', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM RECIPES WHERE recipe_id = ?',
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Receta no encontrada' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching recipe by ID:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /recipes/:id/ingredients - Obtener ingredientes de una receta
router.get('/:id/ingredients', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT
        ri.id,
        ri.ingredient_id,
        i.name,
        ri.quantity_per_serving,
        i.unit,
        i.base_price,
        i.waste_percent,
        i.net_price,
        i.calories_per_100g,
        i.protein_per_100g,
        i.carbs_per_100g,
        i.fat_per_100g,
        ri.section_id,
        rs.name AS section_name
      FROM RECIPE_INGREDIENTS ri
      JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
      LEFT JOIN RECIPE_SECTIONS rs ON ri.section_id = rs.section_id
      WHERE ri.recipe_id = ?
      `,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching recipe ingredients:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /recipes/:id/ingredients/by-section - Ingredientes agrupados por sección
router.get('/:id/ingredients/by-section', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT
        rs.section_id,
        rs.name AS section_name,
        ri.ingredient_id,
        i.name AS ingredient_name,
        ri.quantity_per_serving,
        i.unit,
        i.base_price,
        i.waste_percent,
        i.net_price
      FROM RECIPE_INGREDIENTS ri
      LEFT JOIN RECIPE_SECTIONS rs ON ri.section_id = rs.section_id
      JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
      WHERE ri.recipe_id = ?
      ORDER BY rs.section_order, rs.section_id, ingredient_name
      `,
      [id]
    );
    const grouped = {};
    for (const row of rows) {
      const section = row.section_name || 'Sin sección';
      if (!grouped[section]) grouped[section] = [];
      grouped[section].push({
        ingredient_id: row.ingredient_id,
        name: row.ingredient_name,
        quantity_per_serving: row.quantity_per_serving,
        unit: row.unit,
        base_price: row.base_price,
        waste_percent: row.waste_percent,
        net_price: row.net_price
      });
    }
    res.json(grouped);
  } catch (err) {
    console.error('Error fetching ingredients by section:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /recipes/:id/allergens - Obtener alérgenos de una receta basados en sus ingredientes
router.get('/:id/allergens', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT DISTINCT a.allergen_id, a.name
      FROM ALLERGENS a
      JOIN INGREDIENT_ALLERGENS ia ON a.allergen_id = ia.allergen_id
      JOIN RECIPE_INGREDIENTS ri ON ia.ingredient_id = ri.ingredient_id
      WHERE ri.recipe_id = ?
      ORDER BY a.name
      `,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching recipe allergens:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /recipes/:recipe_id/ingredients/:ingredient_id/section
router.put('/:recipe_id/ingredients/:ingredient_id/section', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { recipe_id, ingredient_id } = req.params;
  const { section_id } = req.body;
  try {
    await pool.query(
      'UPDATE RECIPE_INGREDIENTS SET section_id = ? WHERE recipe_id = ? AND ingredient_id = ?',
      [section_id, recipe_id, ingredient_id]
    );
    await logAudit(req.user.user_id, 'update', 'RECIPE_INGREDIENTS', null,
      `Asignación de sección ${section_id} al ingrediente ${ingredient_id} en receta ${recipe_id}`
    );
    res.json({ message: 'Sección actualizada para el ingrediente' });
  } catch (err) {
    console.error('Error updating ingredient section:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /recipes - Crear nueva receta
router.post('/', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const {
    name, servings, production_servings,
    net_price, prep_time, difficulty,
    is_featured_recipe, instructions, tax_id
  } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO RECIPES
        (name, servings, production_servings, net_price,
         prep_time, difficulty, is_featured_recipe,
         instructions, tax_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, servings, production_servings, net_price,
       prep_time, difficulty, is_featured_recipe,
       instructions, tax_id]
    );
    await logAudit(req.user.user_id, 'create', 'RECIPES', result.insertId,
      `Receta "${name}" creada`
    );
    res.status(201).json({ message: 'Receta creada correctamente', id: result.insertId });
  } catch (err) {
    console.error('Error creating recipe:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /recipes/:id - Actualizar receta
router.put('/:id', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id } = req.params;
  
  // Extraer solo los campos que existen en la tabla RECIPES
  const {
    name,
    servings,
    production_servings,
    net_price,
    prep_time,
    difficulty,
    is_featured_recipe,
    instructions,
    tax_id
  } = req.body;

  try {

    await pool.query(
      `UPDATE RECIPES SET
         name = ?, servings = ?, production_servings = ?,
         net_price = ?, prep_time = ?, difficulty = ?,
         is_featured_recipe = ?, instructions = ?, tax_id = ?
       WHERE recipe_id = ?`,
      [name, servings, production_servings, net_price, prep_time, 
       difficulty, is_featured_recipe, instructions, tax_id, id]
    );
    
    await logAudit(req.user.user_id, 'update', 'RECIPES', id,
      `Receta "${name}" actualizada`
    );
    res.json({ message: 'Receta actualizada correctamente' });
  } catch (err) {
    console.error('Error updating recipe:', err);
    console.error('SQL Error details:', err.sqlMessage);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      details: err.sqlMessage || err.message 
    });
  }
});

// PUT /recipes/:id/categories - Actualizar categorías de una receta
router.put('/:id/categories', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id } = req.params;
  const { categoryIds } = req.body;
  
  if (!Array.isArray(categoryIds)) {
    return res.status(400).json({ message: 'categoryIds debe ser un array' });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Eliminar todas las categorías existentes de la receta
    await connection.query(
      'DELETE FROM RECIPE_CATEGORY_ASSIGNMENTS WHERE recipe_id = ?',
      [id]
    );
    
    // Insertar las nuevas categorías si hay alguna
    if (categoryIds.length > 0) {
      const values = categoryIds.map(categoryId => [id, categoryId]);
      await connection.query(
        'INSERT INTO RECIPE_CATEGORY_ASSIGNMENTS (recipe_id, category_id) VALUES ?',
        [values]
      );
    }
    
    await connection.commit();
    
    await logAudit(req.user.user_id, 'update', 'RECIPE_CATEGORY_ASSIGNMENTS', null,
      `Categorías actualizadas para receta ${id}: [${categoryIds.join(', ')}]`
    );
    
    res.json({ message: 'Categorías actualizadas correctamente' });
  } catch (err) {
    await connection.rollback();
    console.error('Error updating recipe categories:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// PUT /recipes/:id/costs - Recalcular costos
router.put('/:id/costs', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('CALL sp_update_recipe_costs(?)', [id]);
    await logAudit(req.user.user_id, 'update', 'RECIPES', id,
      `Costos recalculados para receta ${id}`
    );
    res.json({ message: 'Costos actualizados correctamente' });
  } catch (err) {
    console.error('Error recalculating costs:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /recipes/:id - Eliminar receta
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Eliminar referencias en orden de dependencias
    await connection.query('DELETE FROM EVENT_MENUS WHERE recipe_id = ?', [id]);
    await connection.query('DELETE FROM MENU_RECIPES WHERE recipe_id = ?', [id]);
    await connection.query('DELETE FROM RECIPE_CATEGORY_ASSIGNMENTS WHERE recipe_id = ?', [id]);
    await connection.query('DELETE FROM RECIPE_INGREDIENTS WHERE recipe_id = ?', [id]);
    await connection.query('DELETE FROM RECIPE_SECTIONS WHERE recipe_id = ?', [id]);
    
    // Finalmente eliminar la receta
    await connection.query('DELETE FROM RECIPES WHERE recipe_id = ?', [id]);
    
    await connection.commit();
    
    await logAudit(req.user.user_id, 'delete', 'RECIPES', id,
      `Receta con ID ${id} eliminada con todas sus referencias`
    );
    res.json({ message: 'Receta eliminada correctamente' });
  } catch (err) {
    await connection.rollback();
    console.error('Error deleting recipe:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// POST /recipes/:id/ingredients - Añadir ingrediente a receta
router.post('/:id/ingredients', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id: recipe_id } = req.params;
  const { ingredient_id, quantity_per_serving, section_id } = req.body;
  
  try {
    
    // Verificar si ya existe este ingrediente en la misma sección de la receta
    const [existing] = await pool.query(
      'SELECT * FROM RECIPE_INGREDIENTS WHERE recipe_id = ? AND ingredient_id = ? AND (section_id = ? OR (section_id IS NULL AND ? IS NULL))',
      [recipe_id, ingredient_id, section_id, section_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        message: 'Este ingrediente ya está en esta sección de la receta' 
      });
    }
    
    // Insertar el nuevo ingrediente
    await pool.query(
      'INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id) VALUES (?, ?, ?, ?)',
      [recipe_id, ingredient_id, quantity_per_serving, section_id || null]
    );
    
    await logAudit(req.user.user_id, 'create', 'RECIPE_INGREDIENTS', null,
      `Ingrediente ${ingredient_id} añadido a receta ${recipe_id}`
    );
    
    res.json({ message: 'Ingrediente añadido correctamente' });
  } catch (err) {
    console.error('Error adding ingredient to recipe:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /recipes/:id/ingredients/:ingredient_id - Actualizar cantidad de ingrediente en receta específica
router.put('/:id/ingredients/:ingredient_id', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id: recipe_id, ingredient_id } = req.params;
  const { quantity_per_serving, section_id, current_section_id } = req.body;
  
  try {
    
    // Actualizar ingrediente específico por sección para evitar ambigüedad
    const [result] = await pool.query(
      'UPDATE RECIPE_INGREDIENTS SET quantity_per_serving = ?, section_id = ? WHERE recipe_id = ? AND ingredient_id = ? AND (section_id = ? OR (section_id IS NULL AND ? IS NULL))',
      [quantity_per_serving, section_id || null, recipe_id, ingredient_id, current_section_id, current_section_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ingrediente no encontrado en la sección especificada' });
    }
    
    await logAudit(req.user.user_id, 'update', 'RECIPE_INGREDIENTS', null,
      `Ingrediente ${ingredient_id} actualizado en receta ${recipe_id}`
    );
    
    res.json({ message: 'Ingrediente actualizado correctamente' });
  } catch (err) {
    console.error('Error updating ingredient in recipe:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /recipes/:id/ingredients/:ingredient_id - Eliminar ingrediente de receta (mantener compatibilidad)
router.delete('/:id/ingredients/:ingredient_id', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id: recipe_id, ingredient_id } = req.params;
  const { section_id } = req.query; // Permitir especificar sección por query param
  
  try {
    let query = 'DELETE FROM RECIPE_INGREDIENTS WHERE recipe_id = ? AND ingredient_id = ?';
    let params = [recipe_id, ingredient_id];
    
    // Si se especifica section_id, ser más específico
    if (section_id !== undefined) {
      query += ' AND (section_id = ? OR (section_id IS NULL AND ? IS NULL))';
      params.push(section_id, section_id);
    }
    
    const [result] = await pool.query(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ingrediente no encontrado en la receta' });
    }
    
    await logAudit(req.user.user_id, 'delete', 'RECIPE_INGREDIENTS', null,
      `Ingrediente ${ingredient_id} eliminado de receta ${recipe_id}`
    );
    
    res.json({ message: 'Ingrediente eliminado correctamente' });
  } catch (err) {
    console.error('Error removing ingredient from recipe:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /recipes/:recipe_id/recipe-ingredients/:id - Eliminar registro específico por ID único
router.delete('/:recipe_id/recipe-ingredients/:id', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { recipe_id, id } = req.params;
  
  try {
    const [result] = await pool.query(
      'DELETE FROM RECIPE_INGREDIENTS WHERE id = ? AND recipe_id = ?',
      [id, recipe_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Registro de ingrediente no encontrado' });
    }
    
    await logAudit(req.user.user_id, 'delete', 'RECIPE_INGREDIENTS', null,
      `Registro de ingrediente ${id} eliminado de receta ${recipe_id}`
    );
    
    res.json({ message: 'Ingrediente eliminado correctamente' });
  } catch (err) {
    console.error('Error deleting recipe ingredient record:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ===== ENDPOINTS PARA GESTIÓN DE SECCIONES =====

// GET /recipes/:id/sections - Obtener secciones de una receta
router.get('/:id/sections', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id: recipe_id } = req.params;
  
  try {
    const [sections] = await pool.query(
      'SELECT section_id, name, section_order FROM RECIPE_SECTIONS WHERE recipe_id = ? ORDER BY section_order ASC, name ASC',
      [recipe_id]
    );
    
    res.json(sections);
  } catch (err) {
    console.error('Error fetching recipe sections:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /recipes/:id/sections - Crear nueva sección
router.post('/:id/sections', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id: recipe_id } = req.params;
  const { name, section_order } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'El nombre de la sección es obligatorio' });
  }
  
  try {
    // Verificar que no existe una sección con el mismo nombre en esta receta
    const [existing] = await pool.query(
      'SELECT section_id FROM RECIPE_SECTIONS WHERE recipe_id = ? AND name = ?',
      [recipe_id, name.trim()]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ya existe una sección con este nombre en la receta' });
    }
    
    // Si no se especifica orden, poner al final
    let finalOrder = section_order;
    if (!finalOrder) {
      const [maxOrder] = await pool.query(
        'SELECT COALESCE(MAX(section_order), 0) + 1 as next_order FROM RECIPE_SECTIONS WHERE recipe_id = ?',
        [recipe_id]
      );
      finalOrder = maxOrder[0].next_order;
    }
    
    const [result] = await pool.query(
      'INSERT INTO RECIPE_SECTIONS (recipe_id, name, section_order) VALUES (?, ?, ?)',
      [recipe_id, name.trim(), finalOrder]
    );
    
    await logAudit(req.user.user_id, 'create', 'RECIPE_SECTIONS', null,
      `Sección "${name}" creada en receta ${recipe_id}`
    );
    
    res.json({ 
      section_id: result.insertId,
      message: 'Sección creada correctamente' 
    });
  } catch (err) {
    console.error('Error creating recipe section:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /recipes/:id/sections/:section_id - Actualizar sección
router.put('/:id/sections/:section_id', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id: recipe_id, section_id } = req.params;
  const { name, section_order } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'El nombre de la sección es obligatorio' });
  }
  
  try {
    // Verificar que la sección existe y pertenece a esta receta
    const [section] = await pool.query(
      'SELECT section_id FROM RECIPE_SECTIONS WHERE section_id = ? AND recipe_id = ?',
      [section_id, recipe_id]
    );
    
    if (section.length === 0) {
      return res.status(404).json({ message: 'Sección no encontrada' });
    }
    
    // Verificar que no existe otra sección con el mismo nombre
    const [existing] = await pool.query(
      'SELECT section_id FROM RECIPE_SECTIONS WHERE recipe_id = ? AND name = ? AND section_id != ?',
      [recipe_id, name.trim(), section_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ya existe una sección con este nombre en la receta' });
    }
    
    const [result] = await pool.query(
      'UPDATE RECIPE_SECTIONS SET name = ? WHERE section_id = ? AND recipe_id = ?',
      [name.trim(), section_id, recipe_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Sección no encontrada' });
    }
    
    await logAudit(req.user.user_id, 'update', 'RECIPE_SECTIONS', null,
      `Sección ${section_id} actualizada en receta ${recipe_id}`
    );
    
    res.json({ message: 'Sección actualizada correctamente' });
  } catch (err) {
    console.error('Error updating recipe section:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /recipes/:id/sections/:section_id - Eliminar sección
router.delete('/:id/sections/:section_id', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id: recipe_id, section_id } = req.params;
  
  try {
    // Verificar que la sección existe y pertenece a esta receta
    const [section] = await pool.query(
      'SELECT section_id, name FROM RECIPE_SECTIONS WHERE section_id = ? AND recipe_id = ?',
      [section_id, recipe_id]
    );
    
    if (section.length === 0) {
      return res.status(404).json({ message: 'Sección no encontrada' });
    }
    
    // Verificar si hay ingredientes asignados a esta sección
    const [ingredients] = await pool.query(
      'SELECT COUNT(*) as count FROM RECIPE_INGREDIENTS WHERE section_id = ?',
      [section_id]
    );
    
    if (ingredients[0].count > 0) {
      return res.status(400).json({ 
        message: `No se puede eliminar la sección "${section[0].name}" porque tiene ${ingredients[0].count} ingrediente(s) asignado(s). Mueve los ingredientes a otra sección primero.` 
      });
    }
    
    const [result] = await pool.query(
      'DELETE FROM RECIPE_SECTIONS WHERE section_id = ? AND recipe_id = ?',
      [section_id, recipe_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Sección no encontrada' });
    }
    
    await logAudit(req.user.user_id, 'delete', 'RECIPE_SECTIONS', null,
      `Sección "${section[0].name}" eliminada de receta ${recipe_id}`
    );
    
    res.json({ message: 'Sección eliminada correctamente' });
  } catch (err) {
    console.error('Error deleting recipe section:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /recipes/:id/nutrition - Calcular información nutricional de una receta
router.get('/:id/nutrition', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id } = req.params;
  
  try {
    // Obtener receta y ingredientes con información nutricional
    const [recipeResult] = await pool.query(
      'SELECT servings FROM RECIPES WHERE recipe_id = ?',
      [id]
    );
    
    if (!recipeResult.length) {
      return res.status(404).json({ message: 'Receta no encontrada' });
    }
    
    const recipe = recipeResult[0];
    
    // Obtener ingredientes con datos nutricionales
    const [ingredients] = await pool.query(`
      SELECT 
        ri.quantity_per_serving,
        i.unit,
        i.calories_per_100g,
        i.protein_per_100g,
        i.carbs_per_100g,
        i.fat_per_100g
      FROM RECIPE_INGREDIENTS ri
      JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
      WHERE ri.recipe_id = ?
    `, [id]);
    
    // Función para convertir cantidad a gramos
    const convertToGrams = (quantity, unit) => {
      const conversions = {
        'gr': 1,
        'kg': 1000,
        'ml': 1,    // Asumimos densidad 1 g/ml para líquidos
        'l': 1000,  // 1 litro = 1000g (densidad 1)
        'unit': 0,  // Las unidades no tienen conversión nutricional directa
        'tbsp': 15, // 1 cucharada ≈ 15g
        'tsp': 5    // 1 cucharadita ≈ 5g
      };
      return quantity * (conversions[unit] || 1);
    };

    // Calcular totales nutricionales
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    ingredients.forEach(ingredient => {
      const quantity = parseFloat(ingredient.quantity_per_serving) || 0;
      const unit = ingredient.unit;
      const calories = parseFloat(ingredient.calories_per_100g) || 0;
      const protein = parseFloat(ingredient.protein_per_100g) || 0;
      const carbs = parseFloat(ingredient.carbs_per_100g) || 0;
      const fat = parseFloat(ingredient.fat_per_100g) || 0;
      
      // Convertir cantidad a gramos
      const quantityInGrams = convertToGrams(quantity, unit);
      
      // Calcular aporte nutricional por porción: (valor_por_100g * cantidad_en_gramos) / 100
      const caloriesContribution = (calories * quantityInGrams) / 100;
      const proteinContribution = (protein * quantityInGrams) / 100;
      const carbsContribution = (carbs * quantityInGrams) / 100;
      const fatContribution = (fat * quantityInGrams) / 100;
      
      totalCalories += caloriesContribution;
      totalProtein += proteinContribution;
      totalCarbs += carbsContribution;
      totalFat += fatContribution;
    });
    
    // Los valores ya están calculados por porción, no necesitan división adicional
    const nutritionPerServing = {
      calories: Math.round(totalCalories),
      protein: Math.round(totalProtein * 10) / 10, // 1 decimal
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10
    };
    
    res.json(nutritionPerServing);
  } catch (err) {
    console.error('Error calculating nutrition:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
