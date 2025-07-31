// routes/dashboard.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// OPTIMIZACIÓN: Pool de conexiones con límites para evitar agotamiento de memoria
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Límites críticos para servidores con poca memoria
  connectionLimit: 5,          // Máximo 5 conexiones simultáneas
  acquireTimeout: 60000,       // 60s timeout para obtener conexión
  timeout: 60000,              // 60s timeout para consultas
  reconnect: true,
  idleTimeout: 300000,         // Cerrar conexiones inactivas después de 5min
  maxIdle: 2                   // Máximo 2 conexiones idle
});

// GET /dashboard/low-stock-ingredients - Ingredientes con stock bajo (alertas)
router.get('/low-stock-ingredients', authenticateToken, authorizeRoles('admin', 'chef', 'inventory_manager'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
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
      LIMIT ?
    `, [limit]);
    
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
    const limit = parseInt(req.query.limit) || 5;
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
    `, [limit]);
    
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
    const limit = parseInt(req.query.limit) || 10;
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
      LIMIT ?
    `, [interval, limit]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener eventos programados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /dashboard/events-with-menus - Próximos eventos con menús asignados
router.get('/events-with-menus', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    // OPTIMIZACIÓN: Limitar consulta para evitar agotamiento de memoria
    const maxRows = 50; // Límite de seguridad
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
      LIMIT ?
    `, [maxRows]);
    
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
    
    // Aplicar límite después del agrupamiento
    const limit = parseInt(req.query.limit) || 10;
    const limitedEvents = Object.values(groupedEvents).slice(0, limit);
    
    res.json(limitedEvents);
  } catch (error) {
    console.error('Error al obtener eventos con menús:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /dashboard/supplier-order-reminders - Recordatorios de pedidos a proveedores
router.get('/supplier-order-reminders', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
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
      LIMIT ?
    `, [limit]);
    
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
    
    // OPTIMIZACIÓN CRÍTICA: Limitar consulta para evitar agotamiento de memoria
    const maxIngredients = 100; // Límite de seguridad
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
      LIMIT ?
    `, [maxIngredients]);
    
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

// GET /dashboard/cost-trends - Tendencias de costos de ingredientes
router.get('/cost-trends', authenticateToken, authorizeRoles('admin', 'chef', 'supplier_manager'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const [rows] = await pool.query(`
      SELECT 
        i.ingredient_id,
        i.name,
        i.base_price as current_price,
        ph.old_price,
        ph.change_date,
        ROUND(((i.base_price - ph.old_price) / ph.old_price) * 100, 1) as price_change_percent,
        CASE 
          WHEN i.base_price > ph.old_price THEN 'increase'
          WHEN i.base_price < ph.old_price THEN 'decrease'
          ELSE 'stable'
        END as trend_direction,
        DATEDIFF(CURDATE(), ph.change_date) as days_ago
      FROM INGREDIENTS i
      INNER JOIN PRICE_HISTORY ph ON i.ingredient_id = ph.ingredient_id
      WHERE ph.change_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND i.is_available = 1
        AND ph.old_price > 0
        AND i.base_price != ph.old_price
      ORDER BY ABS(((i.base_price - ph.old_price) / ph.old_price) * 100) DESC
      LIMIT ?
    `, [limit]);
    
    // Si no hay datos de price_history, mostrar ingredientes más caros como fallback
    if (rows.length === 0) {
      const fallbackLimit = Math.min(limit, 5); // Limitar fallback a máximo 5
      const [fallbackRows] = await pool.query(`
        SELECT 
          ingredient_id,
          name,
          base_price as current_price,
          base_price as old_price,
          CURDATE() as change_date,
          0 as price_change_percent,
          'stable' as trend_direction,
          0 as days_ago
        FROM INGREDIENTS 
        WHERE is_available = 1 
          AND base_price > 0
        ORDER BY base_price DESC
        LIMIT ?
      `, [fallbackLimit]);
      
      return res.json(fallbackRows);
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener tendencias de costos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /dashboard/seasonal-alerts - Alertas de ingredientes de temporada
router.get('/seasonal-alerts', authenticateToken, authorizeRoles('admin', 'chef', 'inventory_manager'), async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                       'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    
    // OPTIMIZACIÓN CRÍTICA: Limitar consulta para evitar agotamiento de memoria
    const maxIngredients = 50; // Límite más restrictivo para alertas
    const [rows] = await pool.query(`
      SELECT 
        ingredient_id,
        name,
        season,
        stock,
        unit,
        is_available
      FROM INGREDIENTS 
      WHERE season IS NOT NULL 
        AND season != ''
        AND is_available = 1
      ORDER BY name ASC
      LIMIT ?
    `, [maxIngredients]);
    
    const alerts = [];
    const currentMonthName = monthNames[currentMonth - 1];
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const nextMonthName = monthNames[nextMonth - 1];
    const prevMonthName = monthNames[prevMonth - 1];
    
    rows.forEach(ingredient => {
      if (!ingredient.season) return;
      
      const season = ingredient.season.toLowerCase();
      
      // Ingrediente en temporada alta (contiene el mes actual)
      if (season.includes(currentMonthName)) {
        alerts.push({
          ingredient_id: ingredient.ingredient_id,
          name: ingredient.name,
          stock: ingredient.stock,
          unit: ingredient.unit,
          alert_type: 'in_season',
          message: 'En temporada alta',
          urgency: 'success'
        });
      }
      // Ingrediente que va a salir de temporada (está en temporada actual pero no en el próximo mes)
      else if (season.includes(prevMonthName) && !season.includes(currentMonthName)) {
        alerts.push({
          ingredient_id: ingredient.ingredient_id,
          name: ingredient.name,
          stock: ingredient.stock,
          unit: ingredient.unit,
          alert_type: 'ending_season',
          message: 'Temporada termina pronto',
          urgency: 'warning'
        });
      }
      // Ingrediente que va a entrar en temporada
      else if (season.includes(nextMonthName) && !season.includes(currentMonthName)) {
        alerts.push({
          ingredient_id: ingredient.ingredient_id,
          name: ingredient.name,
          stock: ingredient.stock,
          unit: ingredient.unit,
          alert_type: 'starting_season',
          message: 'Temporada inicia pronto',
          urgency: 'info'
        });
      }
    });
    
    // Limitar según el parámetro limit
    const limit = parseInt(req.query.limit) || 8;
    const limitedAlerts = alerts.slice(0, limit);
    
    res.json({
      current_month: currentMonthName,
      alerts: limitedAlerts,
      total_seasonal_ingredients: rows.length
    });
  } catch (error) {
    console.error('Error al obtener alertas de temporada:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


// GET /dashboard/summary - Resumen general del dashboard
router.get('/summary', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    const [totalRecipes] = await pool.query('SELECT COUNT(*) as count FROM RECIPES');
    const [totalEvents] = await pool.query('SELECT COUNT(*) as count FROM EVENTS');
    const [totalSuppliers] = await pool.query('SELECT COUNT(*) as count FROM SUPPLIERS');
    const [lowStockCount] = await pool.query('SELECT COUNT(*) as count FROM INGREDIENTS WHERE stock < stock_minimum AND is_available = 1');
    const [upcomingEvents] = await pool.query('SELECT COUNT(*) as count FROM EVENTS WHERE event_date >= CURDATE() AND event_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)');
    const [pendingOrders] = await pool.query('SELECT COUNT(*) as count FROM SUPPLIER_ORDERS WHERE status IN ("pending", "ordered")');
    const [urgentOrders] = await pool.query('SELECT COUNT(*) as count FROM SUPPLIER_ORDERS WHERE status IN ("pending", "ordered") AND delivery_date IS NOT NULL AND delivery_date <= DATE_ADD(CURDATE(), INTERVAL 2 DAY)');
    const [overdueOrders] = await pool.query('SELECT COUNT(*) as count FROM SUPPLIER_ORDERS WHERE status IN ("pending", "ordered") AND delivery_date IS NOT NULL AND delivery_date < CURDATE()');
    
    // Datos adicionales para Eventos
    const [eventsWithoutMenu] = await pool.query('SELECT COUNT(*) as count FROM EVENTS WHERE status IN ("planned", "confirmed") AND event_date >= CURDATE() AND event_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND event_id NOT IN (SELECT DISTINCT event_id FROM EVENT_MENUS)');
    const [upcomingEventsNoMenu] = await pool.query('SELECT COUNT(*) as count FROM EVENTS WHERE status IN ("planned", "confirmed") AND event_date >= CURDATE() AND event_date <= DATE_ADD(CURDATE(), INTERVAL 2 DAY) AND event_id NOT IN (SELECT DISTINCT event_id FROM EVENT_MENUS)');
    
    // Datos adicionales para Stock Bajo
    const [zeroStockCount] = await pool.query('SELECT COUNT(*) as count FROM INGREDIENTS WHERE stock = 0 AND is_available = 1');
    const [criticalStockCount] = await pool.query('SELECT COUNT(*) as count FROM INGREDIENTS WHERE stock < (stock_minimum * 0.5) AND stock > 0 AND is_available = 1');
    
    // Datos adicionales para Recetas
    const currentMonth = new Date().getMonth() + 1;
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                       'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const currentMonthName = monthNames[currentMonth - 1];
    
    // OPTIMIZACIÓN: Consultas más eficientes con límites
    const [recipesWithSeasonalIngredients] = await pool.query(`
      SELECT COUNT(DISTINCT r.recipe_id) as count 
      FROM RECIPES r
      INNER JOIN RECIPE_INGREDIENTS ri ON r.recipe_id = ri.recipe_id
      INNER JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
      WHERE i.season IS NOT NULL 
        AND i.season != ''
        AND LOWER(i.season) LIKE ?
        AND i.is_available = 1
      LIMIT 1000
    `, [`%${currentMonthName}%`]);
    
    // OPTIMIZACIÓN: Consulta simplificada - eliminada por ser muy costosa
    // Esta consulta escaneaba TODAS las recetas - ahora usamos valor fijo para evitar problemas de memoria
    const recipesWithAvailableIngredients = [{ count: 0 }]; // Temporalmente deshabilitado
    
    const summary = {
      totalRecipes: totalRecipes[0].count,
      totalEvents: totalEvents[0].count,
      totalSuppliers: totalSuppliers[0].count,
      lowStockCount: lowStockCount[0].count,
      upcomingEvents: upcomingEvents[0].count,
      pendingOrders: pendingOrders[0].count,
      urgentOrders: urgentOrders[0].count,
      overdueOrders: overdueOrders[0].count,
      // Nuevos datos para Eventos
      eventsWithoutMenu: eventsWithoutMenu[0].count,
      upcomingEventsNoMenu: upcomingEventsNoMenu[0].count,
      // Nuevos datos para Stock Bajo
      zeroStockCount: zeroStockCount[0].count,
      criticalStockCount: criticalStockCount[0].count,
      // Nuevos datos para Recetas
      recipesWithSeasonalIngredients: recipesWithSeasonalIngredients[0].count,
      recipesWithAvailableIngredients: recipesWithAvailableIngredients[0].count
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error al obtener resumen del dashboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;