// routes/dashboard.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Configura la conexión a tu base de datos
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// GET /dashboard/low-stock-ingredients - Ingredientes con stock bajo (alertas)
router.get('/low-stock-ingredients', authenticateToken, authorizeRoles('admin', 'chef', 'inventory_manager'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        ingredient_id,
        name,
        stock,
        stock_minimum,
        unit,
        (stock - stock_minimum) as stock_difference
      FROM INGREDIENTS 
      WHERE stock < stock_minimum 
      AND is_available = 1
      ORDER BY (stock - stock_minimum) ASC
      LIMIT 10
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener ingredientes con stock bajo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /dashboard/recipes-by-category - Recetas por categoría (gráfico)
router.get('/recipes-by-category', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        rc.name as category_name,
        COUNT(rca.recipe_id) as recipe_count
      FROM RECIPE_CATEGORIES rc
      LEFT JOIN RECIPE_CATEGORY_ASSIGNMENTS rca ON rc.category_id = rca.category_id
      GROUP BY rc.category_id, rc.name
      ORDER BY recipe_count DESC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener recetas por categoría:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /dashboard/latest-recipes - Últimas recetas añadidas
router.get('/latest-recipes', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    const [rows] = await pool.query(`
      SELECT 
        recipe_id,
        name,
        difficulty,
        prep_time,
        created_at,
        cost_per_serving,
        servings
      FROM RECIPES 
      ORDER BY created_at DESC 
      LIMIT ?
    `, [parseInt(limit)]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener últimas recetas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /dashboard/upcoming-events - Eventos programados esta semana/mes
router.get('/upcoming-events', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    const period = req.query.period || 'week'; // 'week' o 'month'
    const interval = period === 'week' ? 7 : 30;
    
    const [rows] = await pool.query(`
      SELECT 
        event_id,
        name,
        event_date,
        event_time,
        guests_count,
        location,
        status,
        budget
      FROM EVENTS 
      WHERE event_date >= CURDATE() 
      AND event_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY event_date ASC, event_time ASC
    `, [interval]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener eventos programados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /dashboard/events-with-menus - Próximos eventos con menús asignados
router.get('/events-with-menus', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        e.event_id,
        e.name as event_name,
        e.event_date,
        e.event_time,
        e.guests_count,
        e.status,
        r.recipe_id,
        r.name as recipe_name,
        em.course_type,
        em.portions
      FROM EVENTS e
      INNER JOIN EVENT_MENUS em ON e.event_id = em.event_id
      INNER JOIN RECIPES r ON em.recipe_id = r.recipe_id
      WHERE e.event_date >= CURDATE()
      AND e.status IN ('planned', 'confirmed')
      ORDER BY e.event_date ASC, e.event_time ASC, em.course_type ASC
    `);
    
    // Agrupar por evento
    const groupedEvents = rows.reduce((acc, row) => {
      if (!acc[row.event_id]) {
        acc[row.event_id] = {
          event_id: row.event_id,
          event_name: row.event_name,
          event_date: row.event_date,
          event_time: row.event_time,
          guests_count: row.guests_count,
          status: row.status,
          menu_items: []
        };
      }
      
      acc[row.event_id].menu_items.push({
        recipe_id: row.recipe_id,
        recipe_name: row.recipe_name,
        course_type: row.course_type,
        portions: row.portions
      });
      
      return acc;
    }, {});
    
    res.json(Object.values(groupedEvents));
  } catch (error) {
    console.error('Error al obtener eventos con menús:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /dashboard/supplier-order-reminders - Recordatorios de pedidos a proveedores
router.get('/supplier-order-reminders', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        so.order_id,
        so.order_date,
        so.delivery_date,
        so.status,
        so.total_amount,
        s.name as supplier_name,
        s.phone,
        s.email,
        COUNT(soi.ingredient_id) as items_count
      FROM SUPPLIER_ORDERS so
      INNER JOIN SUPPLIERS s ON so.supplier_id = s.supplier_id
      LEFT JOIN SUPPLIER_ORDER_ITEMS soi ON so.order_id = soi.order_id
      WHERE so.status IN ('pending', 'ordered')
      AND (so.delivery_date IS NULL OR so.delivery_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY))
      GROUP BY so.order_id
      ORDER BY so.delivery_date ASC, so.order_date ASC
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener recordatorios de pedidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /dashboard/seasonal-ingredients - Calendario de temporada de ingredientes
router.get('/seasonal-ingredients', authenticateToken, authorizeRoles('admin', 'chef', 'inventory_manager'), async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                       'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    const [rows] = await pool.query(`
      SELECT 
        ingredient_id,
        name,
        unit,
        season,
        stock,
        is_available
      FROM INGREDIENTS 
      WHERE season IS NOT NULL 
      AND season != ''
      AND is_available = 1
      ORDER BY name ASC
    `);
    
    // Filtrar ingredientes de temporada actual
    const seasonalIngredients = rows.filter(ingredient => {
      if (!ingredient.season) return false;
      const season = ingredient.season.toLowerCase();
      const currentMonthName = monthNames[currentMonth - 1];
      return season.includes(currentMonthName);
    });
    
    res.json({
      current_month: monthNames[currentMonth - 1],
      seasonal_ingredients: seasonalIngredients,
      all_ingredients: rows
    });
  } catch (error) {
    console.error('Error al obtener ingredientes de temporada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /dashboard/summary - Resumen general del dashboard
router.get('/summary', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    const [totalRecipes] = await pool.query('SELECT COUNT(*) as count FROM RECIPES');
    const [totalIngredients] = await pool.query('SELECT COUNT(*) as count FROM INGREDIENTS WHERE is_available = 1');
    const [totalSuppliers] = await pool.query('SELECT COUNT(*) as count FROM SUPPLIERS');
    const [lowStockCount] = await pool.query('SELECT COUNT(*) as count FROM INGREDIENTS WHERE stock < stock_minimum AND is_available = 1');
    const [upcomingEvents] = await pool.query('SELECT COUNT(*) as count FROM EVENTS WHERE event_date >= CURDATE() AND event_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)');
    const [pendingOrders] = await pool.query('SELECT COUNT(*) as count FROM SUPPLIER_ORDERS WHERE status IN ("pending", "ordered")');
    
    const summary = {
      totalRecipes: totalRecipes[0].count,
      totalIngredients: totalIngredients[0].count,
      totalSuppliers: totalSuppliers[0].count,
      lowStockCount: lowStockCount[0].count,
      upcomingEvents: upcomingEvents[0].count,
      pendingOrders: pendingOrders[0].count
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error al obtener resumen del dashboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;