// routes/supplier-orders.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const logAudit = require('../utils/audit');

// Configura la conexión a tu base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// GET /supplier-orders/dashboard - Obtener métricas del dashboard
router.get('/dashboard', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    // 1. Calcular gasto mensual (último mes)
    const [monthlySpendingResult] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as monthly_spending
      FROM SUPPLIER_ORDERS 
      WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        AND status IN ('ordered', 'delivered')
    `);
    
    // 2. Contar entregas de hoy
    const [todayDeliveriesResult] = await pool.query(`
      SELECT COUNT(*) as today_deliveries
      FROM SUPPLIER_ORDERS 
      WHERE delivery_date = CURDATE()
        AND status = 'delivered'
    `);
    
    // 3. Calcular ingredientes con stock bajo
    const [lowStockResult] = await pool.query(`
      SELECT COUNT(*) as count
      FROM INGREDIENTS 
      WHERE stock < stock_minimum 
        AND is_available = 1
    `);
    
    // 4. Calcular ahorro potencial (pedidos pendientes que podrían consolidarse)
    const [potentialSavingsResult] = await pool.query(`
      SELECT COUNT(*) * 25 as potential_savings
      FROM SUPPLIER_ORDERS 
      WHERE status = 'pending'
        AND order_date >= CURDATE()
    `);

    const dashboardData = {
      monthlySpending: parseFloat(monthlySpendingResult[0].monthly_spending) || 0,
      todayDeliveries: parseInt(todayDeliveriesResult[0].today_deliveries) || 0,
      potentialSavings: parseInt(potentialSavingsResult[0].potential_savings) || 0,
      lowStockItems: parseInt(lowStockResult[0].count) || 0
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /supplier-orders/shopping-list - Generar lista de compras consolidada
router.get('/shopping-list', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    // Parámetros de query con valores por defecto
    const includeStock = req.query.includeStock !== 'false'; // true por defecto
    const includeConfirmed = req.query.includeConfirmed !== 'false'; // true por defecto  
    const includePlanned = req.query.includePlanned === 'true'; // false por defecto
    const days = parseInt(req.query.days) || 30; // 30 días por defecto
    const selectedEventIds = req.query.eventIds ? req.query.eventIds.split(',').map(id => parseInt(id)) : null;

    let whereConditions = [];
    let queryParams = [];

    // Si hay eventos específicos seleccionados, usar solo esos
    if (selectedEventIds && selectedEventIds.length > 0) {
      const placeholders = selectedEventIds.map(() => '?').join(',');
      whereConditions.push(`e.event_id IN (${placeholders})`);
      queryParams.push(...selectedEventIds);
    } else {
      // Usar filtros tradicionales por status y fecha
      const statusConditions = [];
      if (includeConfirmed) statusConditions.push("'confirmed'");
      if (includePlanned) statusConditions.push("'planned'");
      
      if (statusConditions.length === 0) {
        return res.json({
          totalEvents: 0,
          dateRange: { from: null, to: null },
          ingredientsBySupplier: [],
          totalCost: 0,
          filters: { includeStock, includeConfirmed, includePlanned, days, selectedEventIds },
          message: 'No hay tipos de eventos seleccionados'
        });
      }

      whereConditions.push(`e.status IN (${statusConditions.join(',')})`);
      whereConditions.push(`e.event_date >= CURDATE()`);
      whereConditions.push(`e.event_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)`);
      queryParams.push(days);
    }

    const whereClause = whereConditions.join(' AND ');

    // 1. Obtener eventos según filtros
    const [confirmedEvents] = await pool.query(`
      SELECT COUNT(*) as total_events,
             MIN(event_date) as date_from,
             MAX(event_date) as date_to
      FROM EVENTS e
      WHERE ${whereClause}
    `, queryParams);

    // 2. Calcular ingredientes necesarios
    const stockFormula = includeStock 
      ? 'GREATEST(0, SUM(ri.quantity_per_serving * em.portions) - i.stock)' 
      : 'SUM(ri.quantity_per_serving * em.portions)';
    
    const costFormula = includeStock
      ? 'GREATEST(0, SUM(ri.quantity_per_serving * em.portions) - i.stock) * i.base_price * (1 + IFNULL(i.waste_percent, 0))'
      : 'SUM(ri.quantity_per_serving * em.portions) * i.base_price * (1 + IFNULL(i.waste_percent, 0))';

    const [neededIngredients] = await pool.query(`
      SELECT 
        i.ingredient_id,
        i.name,
        i.unit,
        i.base_price as price_per_unit,
        i.stock as current_stock,
        SUM(ri.quantity_per_serving * em.portions) as total_needed,
        ${stockFormula} as to_buy,
        si.supplier_id,
        s.name as supplier_name,
        si.package_size,
        si.package_unit,
        si.minimum_order_quantity,
        si.price as supplier_price,
        -- Calcular cantidad real de paquetes necesarios (solo si hay proveedor)
        CASE 
          WHEN si.supplier_id IS NOT NULL THEN 
            GREATEST(
              si.minimum_order_quantity,
              CEIL(${stockFormula} / si.package_size)
            )
          ELSE 0
        END as packages_to_buy,
        -- Calcular cantidad total real (en unidades base)
        CASE 
          WHEN si.supplier_id IS NOT NULL THEN 
            GREATEST(
              si.minimum_order_quantity,
              CEIL(${stockFormula} / si.package_size)
            ) * si.package_size
          ELSE 0
        END as real_quantity,
        -- Calcular costo real basado en precio del proveedor
        CASE 
          WHEN si.supplier_id IS NOT NULL THEN 
            GREATEST(
              si.minimum_order_quantity,
              CEIL(${stockFormula} / si.package_size)
            ) * si.price
          ELSE ${costFormula}
        END as real_total_cost
      FROM EVENTS e
      JOIN EVENT_MENUS em ON e.event_id = em.event_id
      JOIN RECIPE_INGREDIENTS ri ON em.recipe_id = ri.recipe_id
      JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
      LEFT JOIN SUPPLIER_INGREDIENTS si ON i.ingredient_id = si.ingredient_id AND si.is_preferred_supplier = 1
      LEFT JOIN SUPPLIERS s ON si.supplier_id = s.supplier_id
      WHERE ${whereClause}
        AND i.is_available = 1
      GROUP BY i.ingredient_id, i.name, i.unit, i.base_price, i.stock, si.supplier_id, s.name, si.package_size, si.package_unit, si.minimum_order_quantity, si.price
      HAVING to_buy > 0
      ORDER BY COALESCE(s.name, 'zzz'), i.name
    `, queryParams);

    // 3. Agrupar por proveedor
    const supplierGroups = {};
    let totalCost = 0;

    neededIngredients.forEach(ingredient => {
      const supplierId = ingredient.supplier_id || 999;
      const supplierName = ingredient.supplier_name || 'Sin Proveedor Asignado';
      
      if (!supplierGroups[supplierId]) {
        supplierGroups[supplierId] = {
          supplierId,
          supplierName,
          ingredients: [],
          supplierTotal: 0
        };
      }

      const ingredientData = {
        ingredientId: ingredient.ingredient_id,
        name: ingredient.name,
        needed: parseFloat(ingredient.total_needed),
        inStock: parseFloat(ingredient.current_stock),
        toBuy: parseFloat(ingredient.to_buy),
        unit: ingredient.unit,
        pricePerUnit: parseFloat(ingredient.price_per_unit),
        totalCost: parseFloat(ingredient.total_cost || 0),
        // Nuevos campos para cantidades reales
        packageSize: parseFloat(ingredient.package_size || 1),
        packageUnit: ingredient.package_unit || 'unidad',
        minimumOrderQuantity: parseFloat(ingredient.minimum_order_quantity || 1),
        supplierPrice: parseFloat(ingredient.supplier_price || ingredient.price_per_unit),
        packagesToBuy: parseFloat(ingredient.packages_to_buy || 0),
        realQuantity: parseFloat(ingredient.real_quantity || 0),
        realTotalCost: parseFloat(ingredient.real_total_cost || 0)
      };

      supplierGroups[supplierId].ingredients.push(ingredientData);
      // Usar el costo real si está disponible, sino el costo calculado original
      const costToAdd = ingredientData.realTotalCost > 0 ? ingredientData.realTotalCost : ingredientData.totalCost;
      supplierGroups[supplierId].supplierTotal += costToAdd;
      totalCost += costToAdd;
    });

    const shoppingList = {
      totalEvents: parseInt(confirmedEvents[0].total_events) || 0,
      dateRange: {
        from: confirmedEvents[0].date_from,
        to: confirmedEvents[0].date_to
      },
      ingredientsBySupplier: Object.values(supplierGroups),
      totalCost: parseFloat(totalCost.toFixed(2)),
      filters: {
        includeStock,
        includeConfirmed,
        includePlanned,
        days,
        selectedEventIds
      },
      generatedAt: new Date().toISOString()
    };

    res.json(shoppingList);
  } catch (error) {
    console.error('Error al generar lista de compras:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /supplier-orders/active - Obtener pedidos activos
router.get('/active', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    // TODO: Implementar consulta real a la base de datos
    
    const activeOrders = [
      {
        id: 1,
        supplier: 'Proveedor A',
        status: 'borrador',
        items: 5,
        total: 125.50,
        createdAt: '2024-01-24',
        deliveryDate: null
      },
      {
        id: 2,
        supplier: 'Proveedor B',
        status: 'enviado',
        items: 3,
        total: 89.30,
        createdAt: '2024-01-23',
        deliveryDate: '2024-01-26'
      },
      {
        id: 3,
        supplier: 'Proveedor C',
        status: 'en_camino',
        items: 8,
        total: 245.80,
        createdAt: '2024-01-22',
        deliveryDate: '2024-01-25'
      }
    ];

    res.json(activeOrders);
  } catch (error) {
    console.error('Error al obtener pedidos activos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /supplier-orders/available-events - Obtener eventos disponibles para pedidos
router.get('/available-events', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 60; // 60 días por defecto para más flexibilidad
    
    const [events] = await pool.query(`
      SELECT 
        e.event_id,
        e.name as event_name,
        e.event_date,
        e.event_time,
        e.guests_count,
        e.location,
        e.status,
        e.budget,
        COUNT(DISTINCT em.recipe_id) as recipes_count,
        GROUP_CONCAT(DISTINCT r.name SEPARATOR ', ') as recipe_names,
        SUM(em.portions) as total_portions
      FROM EVENTS e
      LEFT JOIN EVENT_MENUS em ON e.event_id = em.event_id
      LEFT JOIN RECIPES r ON em.recipe_id = r.recipe_id
      WHERE e.status IN ('planned', 'confirmed')
        AND e.event_date >= CURDATE()
        AND e.event_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      GROUP BY e.event_id, e.name, e.event_date, e.event_time, e.guests_count, e.location, e.status, e.budget
      ORDER BY e.event_date ASC, e.event_time ASC
    `, [days]);

    res.json(events);
  } catch (error) {
    console.error('Error al obtener eventos disponibles:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /supplier-orders/suppliers/analysis - Análisis de proveedores
router.get('/suppliers/analysis', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    // TODO: Implementar análisis real de proveedores
    
    const suppliersAnalysis = [
      {
        id: 1,
        name: 'Proveedor A',
        totalOrders: 15,
        totalSpent: 1250.30,
        averageDeliveryTime: 2.5,
        onTimeDeliveries: 0.93,
        qualityRating: 4.2,
        priceRating: 3.8,
        lastOrder: '2024-01-23'
      },
      {
        id: 2,
        name: 'Proveedor B',
        totalOrders: 8,
        totalSpent: 890.50,
        averageDeliveryTime: 1.8,
        onTimeDeliveries: 0.87,
        qualityRating: 4.7,
        priceRating: 4.1,
        lastOrder: '2024-01-22'
      },
      {
        id: 3,
        name: 'Proveedor C',
        totalOrders: 12,
        totalSpent: 650.80,
        averageDeliveryTime: 3.2,
        onTimeDeliveries: 0.75,
        qualityRating: 3.9,
        priceRating: 4.5,
        lastOrder: '2024-01-20'
      }
    ];

    res.json(suppliersAnalysis);
  } catch (error) {
    console.error('Error al obtener análisis de proveedores:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;