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
      ? 'GREATEST(0, SUM(ri.quantity_per_serving * em.portions) - i.stock) * COALESCE(NULLIF(si.price, 0), i.base_price) * (1 + IFNULL(i.waste_percent, 0))'
      : 'SUM(ri.quantity_per_serving * em.portions) * COALESCE(NULLIF(si.price, 0), i.base_price) * (1 + IFNULL(i.waste_percent, 0))';

    const [neededIngredients] = await pool.query(`
      SELECT 
        i.ingredient_id,
        i.name,
        i.unit,
        i.base_price as price_per_unit,
        i.stock as current_stock,
        SUM(ri.quantity_per_serving * em.portions) as total_needed,
        ${stockFormula} as to_buy,
        ${costFormula} as total_cost,
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
        END as real_total_cost,
        
        -- Indicadores de configuración del proveedor
        CASE 
          WHEN si.supplier_id IS NOT NULL AND si.price IS NOT NULL AND si.price > 0 THEN 'complete'
          WHEN si.supplier_id IS NOT NULL AND (si.price IS NULL OR si.price <= 0) THEN 'incomplete' 
          ELSE 'missing'
        END as supplier_status,
        
        -- Campos de debug
        si.supplier_id as debug_supplier_id,
        si.price as debug_price,
        si.is_preferred_supplier as debug_preferred
      FROM EVENTS e
      JOIN EVENT_MENUS em ON e.event_id = em.event_id
      JOIN RECIPE_INGREDIENTS ri ON em.recipe_id = ri.recipe_id
      JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
      LEFT JOIN SUPPLIER_INGREDIENTS si ON i.ingredient_id = si.ingredient_id AND si.is_preferred_supplier = 1
      LEFT JOIN SUPPLIERS s ON si.supplier_id = s.supplier_id
      WHERE ${whereClause}
        AND i.is_available = 1
      GROUP BY i.ingredient_id, i.name, i.unit, i.base_price, i.stock, si.supplier_id, s.name, si.package_size, si.package_unit, si.minimum_order_quantity, si.price, si.is_preferred_supplier
      HAVING to_buy > 0
      ORDER BY COALESCE(s.name, 'zzz'), i.name
    `, queryParams);


    // 3. Agrupar por proveedor
    const supplierGroups = {};
    let totalCost = 0;
    let supplierStats = {
      complete: 0,    // Ingredientes con proveedor y precio
      incomplete: 0,  // Ingredientes con proveedor pero sin precio
      missing: 0      // Ingredientes sin proveedor
    };

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
        realTotalCost: parseFloat(ingredient.real_total_cost || 0),
        supplierStatus: ingredient.supplier_status || 'missing',
        // Campos de debug
        debugSupplierId: ingredient.debug_supplier_id,
        debugPrice: ingredient.debug_price,
        debugPreferred: ingredient.debug_preferred
      };

      supplierGroups[supplierId].ingredients.push(ingredientData);
      // Usar el costo real si está disponible, sino el costo calculado original
      const costToAdd = ingredientData.realTotalCost > 0 ? ingredientData.realTotalCost : ingredientData.totalCost;
      supplierGroups[supplierId].supplierTotal += costToAdd;
      totalCost += costToAdd;

      // Contar estado del proveedor para estadísticas
      supplierStats[ingredientData.supplierStatus]++;
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
      supplierStats,
      generatedAt: new Date().toISOString()
    };

    res.json(shoppingList);
  } catch (error) {
    console.error('Error al generar lista de compras:', error);
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

// POST /supplier-orders/generate - Generar pedidos desde lista de compras
router.post('/generate', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      suppliers, // Array de proveedores con sus ingredientes
      deliveryDate,
      notes,
      generatedFrom // 'shopping-list', 'manual', 'events'
    } = req.body;

    if (!suppliers || !Array.isArray(suppliers) || suppliers.length === 0) {
      return res.status(400).json({ message: 'Datos de proveedores son obligatorios' });
    }

    const createdOrders = [];

    // Crear un pedido por cada proveedor
    for (const supplierData of suppliers) {
      const { supplierId, supplierName, ingredients, supplierTotal } = supplierData;
      
      if (!ingredients || ingredients.length === 0) {
        continue; // Skip proveedores sin ingredientes
      }

      // Crear el pedido principal
      const [orderResult] = await connection.execute(`
        INSERT INTO SUPPLIER_ORDERS (
          supplier_id, 
          order_date, 
          delivery_date, 
          status, 
          total_amount, 
          notes, 
          created_by_user_id
        ) VALUES (?, CURDATE(), ?, 'pending', ?, ?, ?)
      `, [
        supplierId === 999 ? null : supplierId, // null para "Sin Proveedor Asignado"
        deliveryDate || null,
        supplierTotal,
        notes || `Pedido generado desde ${generatedFrom || 'lista de compras'}`,
        req.user.user_id
      ]);

      const orderId = orderResult.insertId;

      // Insertar los items del pedido
      for (const ingredient of ingredients) {
        const {
          ingredientId,
          toBuy,
          packagesToBuy = 0,
          realQuantity = 0,
          supplierPrice = 0,
          realTotalCost = 0,
          totalCost = 0
        } = ingredient;

        // Usar cantidades reales si están disponibles, sino las básicas
        const quantity = realQuantity > 0 ? realQuantity : toBuy;
        const unitPrice = supplierPrice > 0 ? supplierPrice : (totalCost / toBuy);
        const itemTotalPrice = realTotalCost > 0 ? realTotalCost : totalCost;

        await connection.execute(`
          INSERT INTO SUPPLIER_ORDER_ITEMS (
            order_id,
            ingredient_id,
            quantity,
            unit_price,
            total_price
          ) VALUES (?, ?, ?, ?, ?)
        `, [orderId, ingredientId, quantity, unitPrice, itemTotalPrice]);
      }

      // Registrar auditoría
      await logAudit(req.user.user_id, 'CREATE', 'SUPPLIER_ORDERS', orderId, 
        `Pedido creado para ${supplierName} - Total: €${supplierTotal}`, connection);

      createdOrders.push({
        orderId,
        supplierId,
        supplierName,
        totalAmount: supplierTotal,
        itemsCount: ingredients.length,
        status: 'pending'
      });
    }

    await connection.commit();

    res.json({
      success: true,
      message: `${createdOrders.length} pedidos creados exitosamente`,
      orders: createdOrders
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al generar pedidos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});

// GET /supplier-orders/active - Obtener pedidos activos con datos reales
router.get('/active', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    const [orders] = await pool.query(`
      SELECT 
        so.order_id,
        so.supplier_id,
        COALESCE(s.name, 'Sin Proveedor Asignado') as supplier_name,
        so.order_date,
        so.delivery_date,
        so.status,
        so.total_amount,
        so.notes,
        so.created_at,
        so.updated_at,
        COUNT(soi.ingredient_id) as items_count,
        u.first_name,
        u.last_name
      FROM SUPPLIER_ORDERS so
      LEFT JOIN SUPPLIERS s ON so.supplier_id = s.supplier_id
      LEFT JOIN SUPPLIER_ORDER_ITEMS soi ON so.order_id = soi.order_id
      LEFT JOIN USERS u ON so.created_by_user_id = u.user_id
      WHERE so.status IN ('pending', 'ordered', 'delivered')
      GROUP BY so.order_id, so.supplier_id, s.name, so.order_date, so.delivery_date, 
               so.status, so.total_amount, so.notes, so.created_at, so.updated_at,
               u.first_name, u.last_name
      ORDER BY 
        CASE so.status 
          WHEN 'pending' THEN 1 
          WHEN 'ordered' THEN 2 
          WHEN 'delivered' THEN 3 
          ELSE 4 
        END,
        so.created_at DESC
    `);

    res.json(orders);
  } catch (error) {
    console.error('Error al obtener pedidos activos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /supplier-orders/history - Obtener historial completo de pedidos con filtros
router.get('/history', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    const {
      startDate = null,
      endDate = null,
      supplierId = null,
      status = null,
      minAmount = null,
      maxAmount = null,
      createdBy = null,
      orderBy = 'order_date',
      sortDirection = 'DESC',
      page = 1,
      limit = 50
    } = req.query;

    // Construir condiciones WHERE
    const whereConditions = [];
    const queryParams = [];

    if (startDate) {
      whereConditions.push('so.order_date >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('so.order_date <= ?');
      queryParams.push(endDate);
    }

    if (supplierId && supplierId !== 'all') {
      if (supplierId === '999') {
        whereConditions.push('so.supplier_id IS NULL');
      } else {
        whereConditions.push('so.supplier_id = ?');
        queryParams.push(supplierId);
      }
    }

    if (status && status !== 'all') {
      whereConditions.push('so.status = ?');
      queryParams.push(status);
    }

    if (minAmount) {
      whereConditions.push('so.total_amount >= ?');
      queryParams.push(parseFloat(minAmount));
    }

    if (maxAmount) {
      whereConditions.push('so.total_amount <= ?');
      queryParams.push(parseFloat(maxAmount));
    }

    if (createdBy && createdBy !== 'all') {
      whereConditions.push('so.created_by_user_id = ?');
      queryParams.push(createdBy);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validar orden y dirección
    const validOrderFields = ['order_date', 'total_amount', 'status', 'supplier_name', 'created_at'];
    const validDirections = ['ASC', 'DESC'];
    const safeOrderBy = validOrderFields.includes(orderBy) ? orderBy : 'order_date';
    const safeSortDirection = validDirections.includes(sortDirection.toUpperCase()) ? sortDirection.toUpperCase() : 'DESC';

    // Calcular offset para paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Obtener total de registros
    const [totalResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM SUPPLIER_ORDERS so
      LEFT JOIN SUPPLIERS s ON so.supplier_id = s.supplier_id
      ${whereClause}
    `, queryParams);

    const totalRecords = totalResult[0].total;
    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    // Obtener datos con paginación
    const [orders] = await pool.query(`
      SELECT 
        so.order_id,
        so.supplier_id,
        COALESCE(s.name, 'Sin Proveedor Asignado') as supplier_name,
        s.phone as supplier_phone,
        s.email as supplier_email,
        so.order_date,
        so.delivery_date,
        so.status,
        so.total_amount,
        so.notes,
        so.created_at,
        so.updated_at,
        COUNT(soi.ingredient_id) as items_count,
        u.first_name,
        u.last_name,
        u.email as created_by_email
      FROM SUPPLIER_ORDERS so
      LEFT JOIN SUPPLIERS s ON so.supplier_id = s.supplier_id
      LEFT JOIN SUPPLIER_ORDER_ITEMS soi ON so.order_id = soi.order_id
      LEFT JOIN USERS u ON so.created_by_user_id = u.user_id
      ${whereClause}
      GROUP BY so.order_id, so.supplier_id, s.name, s.phone, s.email, so.order_date, 
               so.delivery_date, so.status, so.total_amount, so.notes, so.created_at, 
               so.updated_at, u.first_name, u.last_name, u.email
      ORDER BY ${safeOrderBy === 'supplier_name' ? 's.name' : `so.${safeOrderBy}`} ${safeSortDirection}
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), offset]);

    // Obtener estadísticas del filtro actual
    const [statsResult] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(so.total_amount) as total_amount,
        AVG(so.total_amount) as avg_amount,
        COUNT(CASE WHEN so.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN so.status = 'ordered' THEN 1 END) as ordered_count,
        COUNT(CASE WHEN so.status = 'delivered' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN so.status = 'cancelled' THEN 1 END) as cancelled_count
      FROM SUPPLIER_ORDERS so
      LEFT JOIN SUPPLIERS s ON so.supplier_id = s.supplier_id
      ${whereClause}
    `, queryParams);

    const response = {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords,
        recordsPerPage: parseInt(limit),
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1
      },
      filters: {
        startDate,
        endDate,
        supplierId,
        status,
        minAmount,
        maxAmount,
        createdBy,
        orderBy: safeOrderBy,
        sortDirection: safeSortDirection
      },
      statistics: {
        totalOrders: parseInt(statsResult[0].total_orders) || 0,
        totalAmount: parseFloat(statsResult[0].total_amount) || 0,
        averageAmount: parseFloat(statsResult[0].avg_amount) || 0,
        statusBreakdown: {
          pending: parseInt(statsResult[0].pending_count) || 0,
          ordered: parseInt(statsResult[0].ordered_count) || 0,
          delivered: parseInt(statsResult[0].delivered_count) || 0,
          cancelled: parseInt(statsResult[0].cancelled_count) || 0
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error al obtener historial de pedidos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /supplier-orders/trends - Obtener tendencias y métricas temporales
router.get('/trends', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    const {
      period = 'month', // 'week', 'month', 'quarter', 'year'
      months = 12,
      supplierId = null
    } = req.query;

    let dateFormat;
    let dateTrunc;
    let intervalValue;

    switch (period) {
      case 'week':
        dateFormat = '%Y-%u';
        dateTrunc = 'WEEK';
        intervalValue = parseInt(months) * 4; // Convertir meses a semanas
        break;
      case 'quarter':
        dateFormat = '%Y-Q%q';
        dateTrunc = 'QUARTER';
        intervalValue = Math.ceil(parseInt(months) / 3);
        break;
      case 'year':
        dateFormat = '%Y';
        dateTrunc = 'YEAR';
        intervalValue = Math.ceil(parseInt(months) / 12);
        break;
      default: // month
        dateFormat = '%Y-%m';
        dateTrunc = 'MONTH';
        intervalValue = parseInt(months);
    }

    // Construir condición de proveedor
    let supplierCondition = '';
    const queryParams = [intervalValue];

    if (supplierId && supplierId !== 'all') {
      if (supplierId === '999') {
        supplierCondition = 'AND so.supplier_id IS NULL';
      } else {
        supplierCondition = 'AND so.supplier_id = ?';
        queryParams.push(supplierId);
      }
    }

    // Obtener tendencias de gastos por período
    const [spendingTrends] = await pool.query(`
      SELECT 
        DATE_FORMAT(so.order_date, ?) as period,
        COUNT(*) as total_orders,
        SUM(so.total_amount) as total_spending,
        AVG(so.total_amount) as avg_order_amount,
        COUNT(CASE WHEN so.status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN so.status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM SUPPLIER_ORDERS so
      WHERE so.order_date >= DATE_SUB(CURDATE(), INTERVAL ? ${dateTrunc})
        ${supplierCondition}
      GROUP BY period
      ORDER BY period ASC
    `, [dateFormat, ...queryParams]);

    // Obtener tendencias por proveedor (top 5)
    const [supplierTrends] = await pool.query(`
      SELECT 
        COALESCE(s.name, 'Sin Proveedor Asignado') as supplier_name,
        COUNT(*) as total_orders,
        SUM(so.total_amount) as total_spending,
        AVG(so.total_amount) as avg_order_amount
      FROM SUPPLIER_ORDERS so
      LEFT JOIN SUPPLIERS s ON so.supplier_id = s.supplier_id
      WHERE so.order_date >= DATE_SUB(CURDATE(), INTERVAL ? ${dateTrunc})
        AND so.status IN ('ordered', 'delivered')
        ${supplierId && supplierId !== 'all' ? supplierCondition : ''}
      GROUP BY supplier_name
      ORDER BY total_spending DESC
      LIMIT 5
    `, [intervalValue, ...(supplierId && supplierId !== 'all' ? [supplierId] : [])]);

    // Obtener métricas de tiempo de entrega
    const [deliveryMetrics] = await pool.query(`
      SELECT 
        AVG(DATEDIFF(so.delivery_date, so.order_date)) as avg_delivery_days,
        MIN(DATEDIFF(so.delivery_date, so.order_date)) as min_delivery_days,
        MAX(DATEDIFF(so.delivery_date, so.order_date)) as max_delivery_days,
        COUNT(CASE 
          WHEN DATEDIFF(so.delivery_date, so.order_date) <= 3 THEN 1 
        END) * 100.0 / COUNT(*) as on_time_percentage
      FROM SUPPLIER_ORDERS so
      WHERE so.status = 'delivered'
        AND so.delivery_date IS NOT NULL
        AND so.order_date >= DATE_SUB(CURDATE(), INTERVAL ? ${dateTrunc})
        ${supplierCondition}
    `, [intervalValue, ...(supplierId && supplierId !== 'all' ? [supplierId] : [])]);

    // Obtener distribución por estado
    const [statusDistribution] = await pool.query(`
      SELECT 
        so.status,
        COUNT(*) as count,
        SUM(so.total_amount) as total_amount
      FROM SUPPLIER_ORDERS so
      WHERE so.order_date >= DATE_SUB(CURDATE(), INTERVAL ? ${dateTrunc})
        ${supplierCondition}
      GROUP BY so.status
      ORDER BY count DESC
    `, [intervalValue, ...(supplierId && supplierId !== 'all' ? [supplierId] : [])]);

    res.json({
      period,
      months: intervalValue,
      spendingTrends,
      supplierTrends,
      deliveryMetrics: deliveryMetrics[0] || {},
      statusDistribution,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error al obtener tendencias:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /supplier-orders/export - Exportar historial en formato CSV
router.get('/export', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    const {
      startDate = null,
      endDate = null,
      supplierId = null,
      status = null,
      minAmount = null,
      maxAmount = null,
      createdBy = null,
      format = 'csv'
    } = req.query;

    // Construir condiciones WHERE (mismo que en history)
    const whereConditions = [];
    const queryParams = [];

    if (startDate) {
      whereConditions.push('so.order_date >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('so.order_date <= ?');
      queryParams.push(endDate);
    }

    if (supplierId && supplierId !== 'all') {
      if (supplierId === '999') {
        whereConditions.push('so.supplier_id IS NULL');
      } else {
        whereConditions.push('so.supplier_id = ?');
        queryParams.push(supplierId);
      }
    }

    if (status && status !== 'all') {
      whereConditions.push('so.status = ?');
      queryParams.push(status);
    }

    if (minAmount) {
      whereConditions.push('so.total_amount >= ?');
      queryParams.push(parseFloat(minAmount));
    }

    if (maxAmount) {
      whereConditions.push('so.total_amount <= ?');
      queryParams.push(parseFloat(maxAmount));
    }

    if (createdBy && createdBy !== 'all') {
      whereConditions.push('so.created_by_user_id = ?');
      queryParams.push(createdBy);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Obtener todos los datos sin paginación para export
    const [orders] = await pool.query(`
      SELECT 
        so.order_id as 'ID Pedido',
        COALESCE(s.name, 'Sin Proveedor Asignado') as 'Proveedor',
        s.email as 'Email Proveedor',
        s.phone as 'Teléfono Proveedor',
        so.order_date as 'Fecha Pedido',
        so.delivery_date as 'Fecha Entrega',
        CASE so.status
          WHEN 'pending' THEN 'Pendiente'
          WHEN 'ordered' THEN 'Enviado'
          WHEN 'delivered' THEN 'Entregado'
          WHEN 'cancelled' THEN 'Cancelado'
          ELSE so.status
        END as 'Estado',
        so.total_amount as 'Importe Total',
        COUNT(soi.ingredient_id) as 'Número de Ingredientes',
        CONCAT(u.first_name, ' ', u.last_name) as 'Creado por',
        so.notes as 'Notas',
        so.created_at as 'Fecha Creación',
        so.updated_at as 'Última Actualización'
      FROM SUPPLIER_ORDERS so
      LEFT JOIN SUPPLIERS s ON so.supplier_id = s.supplier_id
      LEFT JOIN SUPPLIER_ORDER_ITEMS soi ON so.order_id = soi.order_id
      LEFT JOIN USERS u ON so.created_by_user_id = u.user_id
      ${whereClause}
      GROUP BY so.order_id, s.name, s.email, s.phone, so.order_date, 
               so.delivery_date, so.status, so.total_amount, so.notes, 
               so.created_at, so.updated_at, u.first_name, u.last_name
      ORDER BY so.order_date DESC
    `, queryParams);

    if (format === 'csv') {
      // Generar CSV
      if (orders.length === 0) {
        return res.status(404).json({ message: 'No hay datos para exportar' });
      }

      const headers = Object.keys(orders[0]);
      const csvContent = [
        headers.join(','),
        ...orders.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escapar comillas y manejar valores nulos
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // Configurar headers para descarga
      const filename = `pedidos_proveedores_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));
      
      // Añadir BOM para UTF-8 para Excel
      res.write('\ufeff');
      res.end(csvContent);
    } else {
      // Formato JSON por defecto
      res.json({
        data: orders,
        exportedAt: new Date().toISOString(),
        totalRecords: orders.length,
        filters: { startDate, endDate, supplierId, status, minAmount, maxAmount, createdBy }
      });
    }
  } catch (error) {
    console.error('Error al exportar datos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /supplier-orders/:id - Obtener detalles de un pedido específico
router.get('/:id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id } = req.params;
  
  try {
    // Obtener información del pedido
    const [orders] = await pool.query(`
      SELECT 
        so.order_id,
        so.supplier_id,
        COALESCE(s.name, 'Sin Proveedor Asignado') as supplier_name,
        s.phone as supplier_phone,
        s.email as supplier_email,
        so.order_date,
        so.delivery_date,
        so.status,
        so.total_amount,
        so.notes,
        so.created_at,
        so.updated_at,
        u.first_name,
        u.last_name
      FROM SUPPLIER_ORDERS so
      LEFT JOIN SUPPLIERS s ON so.supplier_id = s.supplier_id
      LEFT JOIN USERS u ON so.created_by_user_id = u.user_id
      WHERE so.order_id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Obtener items del pedido
    const [items] = await pool.query(`
      SELECT 
        soi.ingredient_id,
        i.name as ingredient_name,
        i.unit,
        soi.quantity,
        soi.unit_price,
        soi.total_price,
        i.stock as current_stock
      FROM SUPPLIER_ORDER_ITEMS soi
      JOIN INGREDIENTS i ON soi.ingredient_id = i.ingredient_id
      WHERE soi.order_id = ?
      ORDER BY i.name
    `, [id]);

    const orderDetail = {
      ...orders[0],
      items: items
    };

    res.json(orderDetail);
  } catch (error) {
    console.error('Error al obtener detalles del pedido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /supplier-orders/:id/status - Actualizar estado de un pedido
router.put('/:id/status', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const validStatuses = ['pending', 'ordered', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Estado no válido' });
  }

  try {
    // Verificar que el pedido existe
    const [existing] = await pool.query('SELECT status, supplier_id FROM SUPPLIER_ORDERS WHERE order_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const oldStatus = existing[0].status;

    // Actualizar el estado
    const updateFields = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const updateValues = [status];

    if (notes) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }

    updateValues.push(id); // Para el WHERE

    await pool.query(`
      UPDATE SUPPLIER_ORDERS 
      SET ${updateFields.join(', ')}
      WHERE order_id = ?
    `, updateValues);

    // Si el pedido se marca como entregado, actualizar el stock de ingredientes
    if (status === 'delivered' && oldStatus !== 'delivered') {
      const [items] = await pool.query(`
        SELECT ingredient_id, quantity 
        FROM SUPPLIER_ORDER_ITEMS 
        WHERE order_id = ?
      `, [id]);

      for (const item of items) {
        await pool.query(`
          UPDATE INGREDIENTS 
          SET stock = stock + ? 
          WHERE ingredient_id = ?
        `, [item.quantity, item.ingredient_id]);
      }
    }

    // Registrar auditoría
    await logAudit(req.user.user_id, 'UPDATE', 'SUPPLIER_ORDERS', id, 
      `Estado cambiado de ${oldStatus} a ${status}`);

    res.json({ 
      success: true, 
      message: `Estado del pedido actualizado a ${status}` 
    });
  } catch (error) {
    console.error('Error al actualizar estado del pedido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /supplier-orders/:id - Eliminar/Cancelar un pedido
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Verificar que el pedido existe y no está entregado
    const [existing] = await connection.query(
      'SELECT status, supplier_id FROM SUPPLIER_ORDERS WHERE order_id = ?', 
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (existing[0].status === 'delivered') {
      return res.status(400).json({ 
        message: 'No se puede eliminar un pedido ya entregado' 
      });
    }

    // Eliminar items del pedido
    await connection.query('DELETE FROM SUPPLIER_ORDER_ITEMS WHERE order_id = ?', [id]);
    
    // Eliminar el pedido
    await connection.query('DELETE FROM SUPPLIER_ORDERS WHERE order_id = ?', [id]);

    // Registrar auditoría
    await logAudit(req.user.user_id, 'DELETE', 'SUPPLIER_ORDERS', id, 
      'Pedido eliminado', connection);

    await connection.commit();

    res.json({ 
      success: true, 
      message: 'Pedido eliminado exitosamente' 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    connection.release();
  }
});


// GET /supplier-orders/suppliers/analysis - Análisis de proveedores
router.get('/suppliers/analysis', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    // Primero obtener todos los proveedores que tienen pedidos
    const [suppliersData] = await pool.query(`
      SELECT 
        s.supplier_id,
        s.name,
        s.email,
        s.phone,
        
        -- Estadísticas de pedidos
        COUNT(DISTINCT so.order_id) as total_orders,
        COALESCE(SUM(CASE WHEN so.status IN ('ordered', 'delivered') THEN so.total_amount ELSE 0 END), 0) as total_spent,
        
        -- Fecha del último pedido
        MAX(so.order_date) as last_order_date,
        
        -- Tiempo promedio de entrega (solo pedidos entregados)
        AVG(CASE 
          WHEN so.status = 'delivered' AND so.delivery_date IS NOT NULL AND so.order_date IS NOT NULL 
          THEN DATEDIFF(so.delivery_date, so.order_date) 
          ELSE NULL 
        END) as average_delivery_days,
        
        -- Porcentaje de entregas a tiempo (asumiendo 3 días como estándar)
        (COUNT(CASE 
          WHEN so.status = 'delivered' 
            AND so.delivery_date IS NOT NULL 
            AND so.order_date IS NOT NULL 
            AND DATEDIFF(so.delivery_date, so.order_date) <= 3 
          THEN 1 
        END) * 100.0 / NULLIF(COUNT(CASE WHEN so.status = 'delivered' THEN 1 END), 0)) as on_time_delivery_percent,
        
        -- Pedidos por estado
        COUNT(CASE WHEN so.status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN so.status = 'ordered' THEN 1 END) as ordered_orders,
        COUNT(CASE WHEN so.status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN so.status = 'cancelled' THEN 1 END) as cancelled_orders
        
      FROM SUPPLIER_ORDERS so
      JOIN SUPPLIERS s ON so.supplier_id = s.supplier_id
      WHERE (s.name IS NULL OR s.name != 'Sin Proveedor Asignado')
      GROUP BY s.supplier_id, s.name, s.email, s.phone
      HAVING total_orders > 0
      ORDER BY total_spent DESC, total_orders DESC
    `);

    // Obtener información de ingredientes y calcular rating de precios por ingrediente
    const suppliersWithIngredients = await Promise.all(
      suppliersData.map(async (supplier) => {
        const [ingredientsData] = await pool.query(`
          SELECT 
            COUNT(DISTINCT si.ingredient_id) as ingredients_count,
            AVG(si.price) as average_ingredient_price
          FROM SUPPLIER_INGREDIENTS si
          WHERE si.supplier_id = ?
        `, [supplier.supplier_id]);

        // Calcular rating de precios de forma más simple
        const [ingredientPrices] = await pool.query(`
          SELECT 
            si1.ingredient_id,
            si1.price as my_price,
            (SELECT COUNT(*) 
             FROM SUPPLIER_INGREDIENTS si_count 
             WHERE si_count.ingredient_id = si1.ingredient_id 
               AND si_count.price IS NOT NULL 
               AND si_count.price > 0
            ) as competitor_count,
            (SELECT MIN(price) 
             FROM SUPPLIER_INGREDIENTS si_min 
             WHERE si_min.ingredient_id = si1.ingredient_id 
               AND si_min.price IS NOT NULL 
               AND si_min.price > 0
            ) as min_price,
            (SELECT MAX(price) 
             FROM SUPPLIER_INGREDIENTS si_max 
             WHERE si_max.ingredient_id = si1.ingredient_id 
               AND si_max.price IS NOT NULL 
               AND si_max.price > 0
            ) as max_price
          FROM SUPPLIER_INGREDIENTS si1
          WHERE si1.supplier_id = ?
            AND si1.price IS NOT NULL 
            AND si1.price > 0
        `, [supplier.supplier_id]);

        // Calcular rating promedio manualmente
        let totalRating = 0;
        let validIngredients = 0;

        ingredientPrices.forEach(ingredient => {
          if (ingredient.competitor_count === 1) {
            // Solo un proveedor = rating neutro
            totalRating += 3.0;
          } else if (ingredient.competitor_count > 1) {
            // Múltiples proveedores = rating competitivo
            const { my_price, min_price, max_price } = ingredient;
            if (max_price > min_price) {
              // Escala de 1-5: precio más bajo = 5 estrellas
              const rating = 5 - ((my_price - min_price) / (max_price - min_price)) * 4;
              totalRating += Math.max(1, Math.min(5, rating));
            } else {
              // Todos tienen el mismo precio
              totalRating += 3.0;
            }
          }
          validIngredients++;
        });

        const ingredient_based_price_rating = validIngredients > 0 ? totalRating / validIngredients : 3.0;

        return {
          ...supplier,
          ingredients_count: ingredientsData[0]?.ingredients_count || 0,
          average_ingredient_price: ingredientsData[0]?.average_ingredient_price || 0,
          ingredient_based_price_rating: ingredient_based_price_rating
        };
      })
    );

    // Calcular métricas adicionales y formatear datos
    const suppliersAnalysis = suppliersWithIngredients.map(supplier => {
      // Usar el rating de precios basado en ingredientes específicos
      const priceRating = supplier.ingredient_based_price_rating;

      // Calcular rating de calidad basado en entregas a tiempo y otros factores
      const qualityRating = supplier.on_time_delivery_percent 
        ? Math.min(5, (supplier.on_time_delivery_percent / 100) * 5)
        : 3.0; // Rating neutro si no hay datos

      return {
        id: supplier.supplier_id,
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        totalOrders: parseInt(supplier.total_orders) || 0,
        totalSpent: parseFloat(supplier.total_spent) || 0,
        averageDeliveryTime: parseFloat(supplier.average_delivery_days) || null,
        onTimeDeliveries: parseFloat(supplier.on_time_delivery_percent) || 0,
        qualityRating: parseFloat(qualityRating.toFixed(1)),
        priceRating: parseFloat(priceRating.toFixed(1)),
        lastOrder: supplier.last_order_date,
        ingredientsCount: parseInt(supplier.ingredients_count) || 0,
        averageIngredientPrice: parseFloat(supplier.average_ingredient_price) || 0,
        ordersByStatus: {
          pending: parseInt(supplier.pending_orders) || 0,
          ordered: parseInt(supplier.ordered_orders) || 0,
          delivered: parseInt(supplier.delivered_orders) || 0,
          cancelled: parseInt(supplier.cancelled_orders) || 0
        }
      };
    });

    res.json(suppliersAnalysis);
  } catch (error) {
    console.error('Error al obtener análisis de proveedores:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});



module.exports = router;