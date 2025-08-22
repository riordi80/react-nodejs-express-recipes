// routes/events.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles   = require('../middleware/roleMiddleware');
const logAudit         = require('../utils/audit');

// Multi-tenant: usar req.tenantDb en lugar de pool estático

// GET /events - Obtener eventos con filtros y paginación
router.get('/', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { search, status, date_from, date_to, location, page = 1, limit = 20, sortKey, sortOrder } = req.query;

  // Paginación
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset = (pageNum - 1) * limitNum;

  let baseSql = `
    FROM EVENTS e
    LEFT JOIN USERS u ON e.created_by_user_id = u.user_id
    LEFT JOIN EVENT_MENUS em ON e.event_id = em.event_id
  `;

  const wheres = [];
  const params = [];

  // Filtros opcionales
  if (search) {
    // Normalizar búsqueda para insensibilidad a acentos
    const normalizedSearch = search.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    wheres.push(`(
      REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        UPPER(e.name), 
        'Á','A'), 'É','E'), 'Í','I'), 'Ó','O'), 'Ú','U'), 'Ñ','N'), 'Ü','U'), 'À','A'), 'È','E'), 'Ì','I')
        LIKE UPPER(?) OR
      REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        UPPER(e.description), 
        'Á','A'), 'É','E'), 'Í','I'), 'Ó','O'), 'Ú','U'), 'Ñ','N'), 'Ü','U'), 'À','A'), 'È','E'), 'Ì','I')
        LIKE UPPER(?) OR
      REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        UPPER(e.location), 
        'Á','A'), 'É','E'), 'Í','I'), 'Ó','O'), 'Ú','U'), 'Ñ','N'), 'Ü','U'), 'À','A'), 'È','E'), 'Ì','I')
        LIKE UPPER(?)
    )`);
    params.push(`%${normalizedSearch}%`, `%${normalizedSearch}%`, `%${normalizedSearch}%`);
  }

  if (status) {
    // Handle multiple statuses separated by commas
    if (status.includes(',')) {
      const statusArray = status.split(',').map(s => s.trim()).filter(s => s);
      if (statusArray.length > 0) {
        const placeholders = statusArray.map(() => '?').join(',');
        wheres.push(`e.status IN (${placeholders})`);
        params.push(...statusArray);
      }
    } else {
      wheres.push('e.status = ?');
      params.push(status);
    }
  }

  if (date_from) {
    wheres.push('e.event_date >= ?');
    params.push(date_from);
  }

  if (date_to) {
    wheres.push('e.event_date <= ?');
    params.push(date_to);
  }

  if (location) {
    // Normalizar búsqueda de ubicación para insensibilidad a acentos
    const normalizedLocation = location.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    wheres.push(`REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
      UPPER(e.location), 
      'Á','A'), 'É','E'), 'Í','I'), 'Ó','O'), 'Ú','U'), 'Ñ','N'), 'Ü','U'), 'À','A'), 'È','E'), 'Ì','I')
      LIKE UPPER(?)`);
    params.push(`%${normalizedLocation}%`);
  }

  const whereClause = wheres.length > 0 ? ' WHERE ' + wheres.join(' AND ') : '';
  const groupByClause = ' GROUP BY e.event_id';

  try {
    // Contar total de registros
    const countSql = `SELECT COUNT(DISTINCT e.event_id) as total ${baseSql}${whereClause}`;
    const [countResult] = await req.tenantDb.query(countSql, params);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limitNum);

    // Determinar orden
    let orderClause = 'ORDER BY e.event_date DESC, e.created_at DESC';
    if (sortKey && sortOrder) {
      const validSortKeys = ['name', 'event_date', 'guests_count', 'status', 'budget'];
      const validSortOrders = ['asc', 'desc'];
      
      if (validSortKeys.includes(sortKey) && validSortOrders.includes(sortOrder.toLowerCase())) {
        orderClause = `ORDER BY e.${sortKey} ${sortOrder.toUpperCase()}`;
      }
    }

    // Obtener datos paginados
    const dataSql = `
      SELECT 
        e.event_id,
        e.name,
        e.description,
        e.event_date,
        e.event_time,
        e.guests_count,
        e.location,
        e.status,
        e.budget,
        e.notes,
        e.created_by_user_id,
        e.created_at,
        e.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        COUNT(em.recipe_id) as recipes_count
      ${baseSql}${whereClause}${groupByClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    
    const dataParams = [...params, limitNum, offset];
    const [rows] = await req.tenantDb.query(dataSql, dataParams);

    // Devolver respuesta paginada
    res.json({
      data: rows,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /events/dashboard-widgets - Obtener datos para widgets del dashboard
router.get('/dashboard-widgets', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  try {
    // Widget 1: Eventos Próximos (7 días)
    const [upcomingEvents] = await req.tenantDb.query(`
      SELECT 
        event_id,
        name,
        event_date,
        event_time,
        guests_count,
        status
      FROM EVENTS 
      WHERE event_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND status != 'cancelled'
      ORDER BY event_date ASC, event_time ASC
      LIMIT 10
    `);

    // Widget 2: Sin Menú Asignado
    const [eventsWithoutMenu] = await req.tenantDb.query(`
      SELECT 
        e.event_id,
        e.name,
        e.event_date,
        e.guests_count,
        e.status
      FROM EVENTS e
      LEFT JOIN EVENT_MENUS em ON e.event_id = em.event_id
      WHERE em.event_id IS NULL 
        AND e.status != 'cancelled'
        AND e.event_date >= CURDATE()
      ORDER BY e.event_date ASC
      LIMIT 10
    `);

    // Widget 3: Presupuesto Excedido
    const [budgetExceededEvents] = await req.tenantDb.query(`
      SELECT 
        e.event_id,
        e.name,
        e.event_date,
        e.budget,
        e.guests_count,
        COALESCE(SUM(r.cost_per_serving * em.portions), 0) as menu_cost,
        (COALESCE(SUM(r.cost_per_serving * em.portions), 0) - e.budget) as excess_amount
      FROM EVENTS e
      LEFT JOIN EVENT_MENUS em ON e.event_id = em.event_id
      LEFT JOIN RECIPES r ON em.recipe_id = r.recipe_id
      WHERE e.budget > 0 
        AND e.status != 'cancelled'
        AND e.event_date >= CURDATE()
      GROUP BY e.event_id, e.name, e.event_date, e.budget, e.guests_count
      HAVING menu_cost > e.budget
      ORDER BY excess_amount DESC
      LIMIT 10
    `);

    // Widget 4: Eventos Grandes (>50 invitados)
    const [largeEvents] = await req.tenantDb.query(`
      SELECT 
        event_id,
        name,
        event_date,
        guests_count,
        status,
        location
      FROM EVENTS 
      WHERE guests_count > 50
        AND status != 'cancelled'
        AND event_date >= CURDATE()
      ORDER BY guests_count DESC, event_date ASC
      LIMIT 10
    `);

    res.json({
      upcomingEvents: upcomingEvents,
      eventsWithoutMenu: eventsWithoutMenu,
      budgetExceeded: budgetExceededEvents,
      largeEvents: largeEvents
    });
  } catch (error) {
    console.error('Error al obtener datos de widgets de eventos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /events/:id - Obtener evento específico con su menú
router.get('/:id', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener información del evento
    const [eventRows] = await req.tenantDb.query(`
      SELECT 
        e.*,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name
      FROM EVENTS e
      LEFT JOIN USERS u ON e.created_by_user_id = u.user_id
      WHERE e.event_id = ?
    `, [id]);

    if (eventRows.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Obtener menú del evento con información nutricional y alérgenos
    const [menuRows] = await req.tenantDb.query(`
      SELECT 
        em.*,
        r.name as recipe_name,
        r.cost_per_serving,
        r.prep_time,
        r.difficulty,
        r.production_servings,
        -- Información nutricional (suma de todos los ingredientes por 100g)
        ROUND(SUM(i.calories_per_100g * ri.quantity_per_serving / 100), 1) as calories,
        ROUND(SUM(i.protein_per_100g * ri.quantity_per_serving / 100), 1) as protein,
        ROUND(SUM(i.carbs_per_100g * ri.quantity_per_serving / 100), 1) as carbs,
        ROUND(SUM(i.fat_per_100g * ri.quantity_per_serving / 100), 1) as fat,
        -- Alérgenos (lista de nombres únicos)
        GROUP_CONCAT(DISTINCT a.name ORDER BY a.name SEPARATOR ', ') as allergens
      FROM EVENT_MENUS em
      JOIN RECIPES r ON em.recipe_id = r.recipe_id
      LEFT JOIN RECIPE_INGREDIENTS ri ON r.recipe_id = ri.recipe_id
      LEFT JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
      LEFT JOIN INGREDIENT_ALLERGENS ia ON i.ingredient_id = ia.ingredient_id
      LEFT JOIN ALLERGENS a ON ia.allergen_id = a.allergen_id
      WHERE em.event_id = ?
      GROUP BY em.event_id, em.recipe_id, em.portions, em.course_type, em.notes, 
               r.name, r.cost_per_serving, r.prep_time, r.difficulty, r.production_servings
      ORDER BY 
        CASE em.course_type 
          WHEN 'starter' THEN 1
          WHEN 'main' THEN 2
          WHEN 'side' THEN 3
          WHEN 'dessert' THEN 4
          WHEN 'beverage' THEN 5
          ELSE 6
        END,
        r.name
    `, [id]);

    // Obtener ingredientes detallados para cada receta del menú (para cálculo de costos)
    for (let recipe of menuRows) {
      const [ingredients] = await req.tenantDb.query(`
        SELECT 
          ri.ingredient_id,
          ri.quantity_per_serving,
          i.name as ingredient_name,
          i.unit,
          i.base_price,
          IFNULL(i.waste_percent, 0) as waste_percent
        FROM RECIPE_INGREDIENTS ri
        JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
        WHERE ri.recipe_id = ?
        ORDER BY i.name
      `, [recipe.recipe_id]);
      
      recipe.ingredients = ingredients;
    }

    const event = eventRows[0];
    event.menu = menuRows;

    res.json(event);
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /events - Crear nuevo evento
router.post('/', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const {
    name,
    description,
    event_date,
    event_time,
    guests_count,
    location,
    status = 'planned',
    budget,
    notes
  } = req.body;

  // Validaciones básicas
  if (!name || !event_date || !guests_count) {
    return res.status(400).json({ 
      message: 'Nombre, fecha del evento y número de invitados son obligatorios' 
    });
  }

  if (guests_count < 1) {
    return res.status(400).json({ 
      message: 'El número de invitados debe ser al menos 1' 
    });
  }

  try {
    const [result] = await req.tenantDb.query(`
      INSERT INTO EVENTS (
        name, description, event_date, event_time, guests_count, 
        location, status, budget, notes, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description, event_date, event_time, guests_count, location, status, budget, notes, req.user.user_id]);

    const eventId = result.insertId;

    // Registrar auditoría
    await logAudit(req.tenantDb, req.user.user_id, 'create', 'EVENTS', eventId, `Evento creado: ${name}`);

    res.status(201).json({ 
      message: 'Evento creado correctamente',
      event_id: eventId
    });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /events/:id - Actualizar evento
router.put('/:id', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    event_date,
    event_time,
    guests_count,
    location,
    status,
    budget,
    notes
  } = req.body;

  // Validaciones básicas
  if (!name || !event_date || !guests_count) {
    return res.status(400).json({ 
      message: 'Nombre, fecha del evento y número de invitados son obligatorios' 
    });
  }

  if (guests_count < 1) {
    return res.status(400).json({ 
      message: 'El número de invitados debe ser al menos 1' 
    });
  }

  try {
    // Verificar que el evento existe
    const [existingEvent] = await req.tenantDb.query('SELECT name FROM EVENTS WHERE event_id = ?', [id]);
    if (existingEvent.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Actualizar evento
    await req.tenantDb.query(`
      UPDATE EVENTS SET 
        name = ?, description = ?, event_date = ?, event_time = ?, 
        guests_count = ?, location = ?, status = ?, budget = ?, notes = ?
      WHERE event_id = ?
    `, [name, description, event_date, event_time, guests_count, location, status, budget, notes, id]);

    // Registrar auditoría
    await logAudit(req.tenantDb, req.user.user_id, 'update', 'EVENTS', id, `Evento actualizado: ${name}`);

    res.json({ message: 'Evento actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /events/:id - Eliminar evento
router.delete('/:id', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que el evento existe
    const [existingEvent] = await req.tenantDb.query('SELECT name FROM EVENTS WHERE event_id = ?', [id]);
    if (existingEvent.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    const eventName = existingEvent[0].name;

    // Eliminar evento (EVENT_MENUS se eliminará automáticamente por CASCADE)
    await req.tenantDb.query('DELETE FROM EVENTS WHERE event_id = ?', [id]);

    // Registrar auditoría
    await logAudit(req.tenantDb, req.user.user_id, 'delete', 'EVENTS', id, `Evento eliminado: ${eventName}`);

    res.json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /events/:id/recipes - Añadir receta al menú del evento
router.post('/:id/recipes', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id } = req.params;
  const { recipe_id, portions = 1, course_type, notes } = req.body;

  // Validaciones
  if (!recipe_id || !course_type) {
    return res.status(400).json({ 
      message: 'ID de receta y tipo de plato son obligatorios' 
    });
  }

  const validCourseTypes = ['starter', 'main', 'dessert', 'beverage', 'side'];
  if (!validCourseTypes.includes(course_type)) {
    return res.status(400).json({ 
      message: 'Tipo de plato inválido. Debe ser: starter, main, dessert, beverage, side' 
    });
  }

  if (portions < 1) {
    return res.status(400).json({ 
      message: 'Las porciones deben ser al menos 1' 
    });
  }

  try {
    // Verificar que el evento existe
    const [eventExists] = await req.tenantDb.query('SELECT event_id FROM EVENTS WHERE event_id = ?', [id]);
    if (eventExists.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Verificar que la receta existe
    const [recipeExists] = await req.tenantDb.query('SELECT name FROM RECIPES WHERE recipe_id = ?', [recipe_id]);
    if (recipeExists.length === 0) {
      return res.status(404).json({ message: 'Receta no encontrada' });
    }

    // Verificar que la receta no esté ya en el menú del evento
    const [existingMenu] = await req.tenantDb.query(
      'SELECT event_id FROM EVENT_MENUS WHERE event_id = ? AND recipe_id = ?', 
      [id, recipe_id]
    );
    if (existingMenu.length > 0) {
      return res.status(400).json({ message: 'Esta receta ya está en el menú del evento' });
    }

    // Añadir receta al menú
    await req.tenantDb.query(`
      INSERT INTO EVENT_MENUS (event_id, recipe_id, portions, course_type, notes)
      VALUES (?, ?, ?, ?, ?)
    `, [id, recipe_id, portions, course_type, notes]);

    // Registrar auditoría
    const recipeName = recipeExists[0].name;
    await logAudit(req.tenantDb, req.user.user_id, 'create', 'EVENT_MENUS', null, 
      `Receta "${recipeName}" añadida al evento ${id}`);

    res.status(201).json({ message: 'Receta añadida al menú correctamente' });
  } catch (error) {
    console.error('Error al añadir receta al menú:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /events/:id/recipes/:recipe_id - Actualizar receta en el menú del evento
router.put('/:id/recipes/:recipe_id', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id, recipe_id } = req.params;
  const { portions, course_type, notes } = req.body;

  // Validaciones
  if (!course_type) {
    return res.status(400).json({ message: 'Tipo de plato es obligatorio' });
  }

  const validCourseTypes = ['starter', 'main', 'dessert', 'beverage', 'side'];
  if (!validCourseTypes.includes(course_type)) {
    return res.status(400).json({ 
      message: 'Tipo de plato inválido. Debe ser: starter, main, dessert, beverage, side' 
    });
  }

  if (portions && portions < 1) {
    return res.status(400).json({ message: 'Las porciones deben ser al menos 1' });
  }

  try {
    // Verificar que la combinación evento-receta existe
    const [existingMenu] = await req.tenantDb.query(
      'SELECT event_id FROM EVENT_MENUS WHERE event_id = ? AND recipe_id = ?', 
      [id, recipe_id]
    );
    if (existingMenu.length === 0) {
      return res.status(404).json({ message: 'Receta no encontrada en el menú del evento' });
    }

    // Actualizar receta en el menú
    await req.tenantDb.query(`
      UPDATE EVENT_MENUS 
      SET portions = ?, course_type = ?, notes = ?
      WHERE event_id = ? AND recipe_id = ?
    `, [portions || 1, course_type, notes, id, recipe_id]);

    // Registrar auditoría
    await logAudit(req.tenantDb, req.user.user_id, 'update', 'EVENT_MENUS', null, 
      `Receta ${recipe_id} actualizada en evento ${id}`);

    res.json({ message: 'Receta del menú actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar receta del menú:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /events/:id/recipes/:recipe_id - Eliminar receta del menú del evento
router.delete('/:id/recipes/:recipe_id', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id, recipe_id } = req.params;

  try {
    // Verificar que la combinación evento-receta existe
    const [existingMenu] = await req.tenantDb.query(
      'SELECT event_id FROM EVENT_MENUS WHERE event_id = ? AND recipe_id = ?', 
      [id, recipe_id]
    );
    if (existingMenu.length === 0) {
      return res.status(404).json({ message: 'Receta no encontrada en el menú del evento' });
    }

    // Eliminar receta del menú
    await req.tenantDb.query('DELETE FROM EVENT_MENUS WHERE event_id = ? AND recipe_id = ?', [id, recipe_id]);

    // Registrar auditoría
    await logAudit(req.tenantDb, req.user.user_id, 'delete', 'EVENT_MENUS', null, 
      `Receta ${recipe_id} eliminada del evento ${id}`);

    res.json({ message: 'Receta eliminada del menú correctamente' });
  } catch (error) {
    console.error('Error al eliminar receta del menú:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /events/:id/shopping-list - Generar lista de compras para el evento
router.get('/:id/shopping-list', authenticateToken, authorizeRoles('admin','chef'), async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que el evento existe
    const [eventExists] = await req.tenantDb.query(
      'SELECT name, guests_count FROM EVENTS WHERE event_id = ?', [id]
    );
    if (eventExists.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    const event = eventExists[0];

    // Obtener ingredientes necesarios para todas las recetas del evento
    const [ingredients] = await req.tenantDb.query(`
      SELECT 
        i.ingredient_id,
        i.name as ingredient_name,
        i.unit,
        i.base_price,
        SUM(ri.quantity_per_serving * em.portions) as total_quantity_needed,
        SUM(ri.quantity_per_serving * em.portions * i.base_price * (1 + IFNULL(i.waste_percent, 0))) as total_cost
      FROM EVENT_MENUS em
      JOIN RECIPE_INGREDIENTS ri ON em.recipe_id = ri.recipe_id
      JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
      WHERE em.event_id = ?
      GROUP BY i.ingredient_id, i.name, i.unit, i.base_price
      ORDER BY i.name
    `, [id]);

    // Calcular costo total
    const totalCost = ingredients.reduce((sum, ingredient) => sum + parseFloat(ingredient.total_cost), 0);

    res.json({
      event_name: event.name,
      guests_count: event.guests_count,
      ingredients: ingredients,
      total_cost: totalCost,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al generar lista de compras:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;