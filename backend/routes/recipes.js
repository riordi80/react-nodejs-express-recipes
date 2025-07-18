// routes/recipes.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles   = require('../middleware/roleMiddleware');
const logAudit         = require('../utils/audit');

// Configura la conexión a tu base de datos
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// GET /recipes - Obtener recetas con categorías y filtros
router.get('/', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { search, category, prepTime, difficulty, ingredient, allergens } = req.query;

  // Base SQL con agrupación de categorías
  const sql = `
    SELECT
      r.recipe_id,
      r.name,
      r.servings,
      r.production_servings,
      r.cost_per_serving,
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
  const finalSql    = [sql, ...joins, whereClause, groupBy].join(' ');

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
        ri.ingredient_id,
        i.name,
        ri.quantity_per_serving,
        i.unit,
        i.base_price,
        i.waste_percent,
        i.net_price,
        rs.name AS section_name
      FROM RECIPE_INGREDIENTS ri
      JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
      LEFT JOIN RECIPE_SECTIONS rs ON ri.section_id = rs.section_id
      WHERE ri.recipe_id = ?
      `,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'No se encontraron ingredientes para esta receta.' });
    }
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
      ORDER BY rs.\`order\`, rs.section_id, ingredient_name
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
  const {
    name, description, preparation_time,
    cooking_time, servings, is_active, comment
  } = req.body;
  try {
    await pool.query(
      `UPDATE RECIPES SET
         name = ?, description = ?,
         preparation_time = ?, cooking_time = ?,
         servings = ?, is_active = ?, comment = ?
       WHERE recipe_id = ?`,
      [name, description, preparation_time, cooking_time, servings, is_active, comment, id]
    );
    await logAudit(req.user.user_id, 'update', 'RECIPES', id,
      `Receta "${name}" actualizada`
    );
    res.json({ message: 'Receta actualizada correctamente' });
  } catch (err) {
    console.error('Error updating recipe:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
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
  try {
    await pool.query('DELETE FROM RECIPES WHERE recipe_id = ?', [id]);
    await logAudit(req.user.user_id, 'delete', 'RECIPES', id,
      `Receta con ID ${id} eliminada`
    );
    res.json({ message: 'Receta eliminada correctamente' });
  } catch (err) {
    console.error('Error deleting recipe:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
