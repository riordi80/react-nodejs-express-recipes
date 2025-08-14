// routes/supplier-orders.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const logAudit = require('../utils/audit');

// Multi-tenant: usar req.tenantDb en lugar de pool estático
// Nota: Los límites de conexión se manejan ahora en databaseManager.js

// GET /supplier-orders/dashboard - Obtener métricas del dashboard
router.get('/dashboard', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    // 1. Calcular gasto mensual (último mes)
    const [monthlySpendingResult] = await req.tenantDb.query(`
      SELECT COALESCE(SUM(total_amount), 0) as monthly_spending
      FROM SUPPLIER_ORDERS 
      WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
        AND status IN ('ordered', 'delivered')
    `);
    
    // 2. Contar entregas de hoy
    const [todayDeliveriesResult] = await req.tenantDb.query(`
      SELECT COUNT(*) as today_deliveries
      FROM SUPPLIER_ORDERS 
      WHERE delivery_date = CURDATE()
        AND status = 'delivered'
    `);
    
    // 3. Calcular ingredientes con stock bajo
    const [lowStockResult] = await req.tenantDb.query(`
      SELECT COUNT(*) as count
      FROM INGREDIENTS 
      WHERE stock < stock_minimum 
        AND is_available = 1
    `);
    
    // 4. Calcular ahorro potencial por consolidación de pedidos


    // Consulta detallada para mostrar información de debug
    const [savingsDetailResult] = await req.tenantDb.query(`
      WITH pedidos_pendientes AS (
        -- Obtener pedidos pendientes con source_events
        SELECT 
          so.order_id,
          so.supplier_id,
          so.source_events,
          s.name as supplier_name
        FROM SUPPLIER_ORDERS so
        LEFT JOIN SUPPLIERS s ON so.supplier_id = s.supplier_id
        WHERE so.status = 'pending'
          AND so.order_date >= CURDATE()
          AND so.source_events IS NOT NULL
          AND JSON_LENGTH(so.source_events) > 0
      ),
      eventos_de_pedidos AS (
        -- Expandir eventos de cada pedido
        SELECT DISTINCT
          pp.order_id,
          pp.supplier_name,
          CAST(JSON_UNQUOTE(JSON_EXTRACT(pp.source_events, CONCAT('$[', numbers.n, ']'))) AS UNSIGNED) as event_id
        FROM pedidos_pendientes pp
        CROSS JOIN (
          SELECT 0 as n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL 
          SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL 
          SELECT 8 UNION ALL SELECT 9
        ) numbers
        WHERE JSON_EXTRACT(pp.source_events, CONCAT('$[', numbers.n, ']')) IS NOT NULL
      ),
      cantidades_reales_por_pedido AS (
        -- Calcular cantidad real necesaria por ingrediente y pedido desde los eventos
        SELECT 
          edp.order_id,
          edp.supplier_name,
          i.ingredient_id,
          i.name as ingredient_name,
          SUM(ri.quantity_per_serving * em.portions * (1 + IFNULL(i.waste_percent, 0))) as cantidad_real_necesaria,
          i.base_price,
          -- Obtener información del paquete del proveedor preferido
          COALESCE(si.package_size, 1.0) as package_size,
          COALESCE(si.package_unit, 'unidad') as package_unit,
          COALESCE(si.price, i.base_price) as supplier_price
        FROM eventos_de_pedidos edp
        JOIN EVENT_MENUS em ON edp.event_id = em.event_id
        JOIN RECIPE_INGREDIENTS ri ON em.recipe_id = ri.recipe_id
        JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
        LEFT JOIN SUPPLIER_INGREDIENTS si ON i.ingredient_id = si.ingredient_id AND si.is_preferred_supplier = 1
        GROUP BY edp.order_id, edp.supplier_name, i.ingredient_id, i.name, i.base_price, si.package_size, si.package_unit, si.price
      ),
      cantidades_pedidas_por_pedido AS (
        -- Obtener cantidades pedidas por ingrediente y pedido
        SELECT 
          pp.order_id,
          pp.supplier_name,
          soi.ingredient_id,
          soi.quantity as cantidad_pedida,
          soi.unit_price
        FROM pedidos_pendientes pp
        JOIN SUPPLIER_ORDER_ITEMS soi ON pp.order_id = soi.order_id
      ),
      analisis_por_ingrediente AS (
        -- Combinar cantidades reales y pedidas por ingrediente
        SELECT 
          crp.ingredient_name,
          crp.ingredient_id,
          COUNT(DISTINCT crp.order_id) as num_pedidos,
          GROUP_CONCAT(DISTINCT CONCAT('Pedido #', crp.order_id, ' (', COALESCE(crp.supplier_name, 'Sin proveedor'), ')') SEPARATOR ', ') as pedidos_afectados,
          SUM(crp.cantidad_real_necesaria) as cantidad_total_necesaria,
          SUM(cpp.cantidad_pedida) as cantidad_total_pedida,
          MAX(crp.package_size) as package_size,  -- Usar MAX en lugar de AVG
          MAX(crp.package_unit) as package_unit,
          AVG(COALESCE(cpp.unit_price, crp.supplier_price)) as precio_promedio,
          -- Calcular paquetes necesarios por separado vs consolidado
          SUM(CEIL(crp.cantidad_real_necesaria / crp.package_size)) as paquetes_separados,
          CEIL(SUM(crp.cantidad_real_necesaria) / MAX(crp.package_size)) as paquetes_consolidados,
          -- Ahorro en paquetes y en cantidad
          SUM(CEIL(crp.cantidad_real_necesaria / crp.package_size)) - CEIL(SUM(crp.cantidad_real_necesaria) / MAX(crp.package_size)) as paquetes_ahorrados,
          (SUM(CEIL(crp.cantidad_real_necesaria / crp.package_size)) - CEIL(SUM(crp.cantidad_real_necesaria) / MAX(crp.package_size))) * MAX(crp.package_size) as cantidad_ahorrada,
          (SUM(CEIL(crp.cantidad_real_necesaria / crp.package_size)) - CEIL(SUM(crp.cantidad_real_necesaria) / MAX(crp.package_size))) * AVG(COALESCE(cpp.unit_price, crp.supplier_price)) as ahorro_euros
        FROM cantidades_reales_por_pedido crp
        JOIN cantidades_pedidas_por_pedido cpp ON crp.order_id = cpp.order_id AND crp.ingredient_id = cpp.ingredient_id
        GROUP BY crp.ingredient_id, crp.ingredient_name
        HAVING COUNT(DISTINCT crp.order_id) > 1  -- Solo ingredientes que están en múltiples pedidos
          AND SUM(CEIL(crp.cantidad_real_necesaria / crp.package_size)) > CEIL(SUM(crp.cantidad_real_necesaria) / MAX(crp.package_size))  -- Solo donde hay ahorro de paquetes
      )
      SELECT 
        ingredient_name,
        num_pedidos,
        pedidos_afectados,
        cantidad_total_necesaria,
        cantidad_total_pedida,
        package_size,
        package_unit,
        paquetes_separados,
        paquetes_consolidados,
        paquetes_ahorrados,
        cantidad_ahorrada,
        precio_promedio,
        ahorro_euros
      FROM analisis_por_ingrediente
      ORDER BY ahorro_euros DESC
      LIMIT 10  -- OPTIMIZACIÓN CRÍTICA: Limitar resultado para evitar agotamiento de memoria
    `);

    const [potentialSavingsResult] = await req.tenantDb.query(`
      WITH pedidos_pendientes AS (
        -- Obtener pedidos pendientes con source_events
        SELECT 
          so.order_id,
          so.supplier_id,
          so.source_events
        FROM SUPPLIER_ORDERS so
        WHERE so.status = 'pending'
          AND so.order_date >= CURDATE()
          AND so.source_events IS NOT NULL
          AND JSON_LENGTH(so.source_events) > 0
      ),
      eventos_de_pedidos AS (
        -- Expandir eventos de cada pedido
        SELECT DISTINCT
          pp.order_id,
          CAST(JSON_UNQUOTE(JSON_EXTRACT(pp.source_events, CONCAT('$[', numbers.n, ']'))) AS UNSIGNED) as event_id
        FROM pedidos_pendientes pp
        CROSS JOIN (
          SELECT 0 as n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL 
          SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL 
          SELECT 8 UNION ALL SELECT 9
        ) numbers
        WHERE JSON_EXTRACT(pp.source_events, CONCAT('$[', numbers.n, ']')) IS NOT NULL
      ),
      cantidades_reales_por_pedido AS (
        -- Calcular cantidad real necesaria por ingrediente y pedido desde los eventos
        SELECT 
          edp.order_id,
          i.ingredient_id,
          SUM(ri.quantity_per_serving * em.portions * (1 + IFNULL(i.waste_percent, 0))) as cantidad_real_necesaria,
          i.base_price,
          COALESCE(si.package_size, 1.0) as package_size,
          COALESCE(si.package_unit, 'unidad') as package_unit,
          COALESCE(si.price, i.base_price) as supplier_price
        FROM eventos_de_pedidos edp
        JOIN EVENT_MENUS em ON edp.event_id = em.event_id
        JOIN RECIPE_INGREDIENTS ri ON em.recipe_id = ri.recipe_id
        JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
        LEFT JOIN SUPPLIER_INGREDIENTS si ON i.ingredient_id = si.ingredient_id AND si.is_preferred_supplier = 1
        GROUP BY edp.order_id, i.ingredient_id, i.base_price, si.package_size, si.package_unit, si.price
      ),
      cantidades_pedidas_por_pedido AS (
        -- Obtener cantidades pedidas por ingrediente y pedido
        SELECT 
          pp.order_id,
          soi.ingredient_id,
          soi.quantity as cantidad_pedida,
          soi.unit_price
        FROM pedidos_pendientes pp
        JOIN SUPPLIER_ORDER_ITEMS soi ON pp.order_id = soi.order_id
      ),
      analisis_por_ingrediente AS (
        -- Combinar cantidades reales y pedidas por ingrediente
        SELECT 
          crp.ingredient_id,
          COUNT(DISTINCT crp.order_id) as num_pedidos,
          SUM(crp.cantidad_real_necesaria) as cantidad_total_necesaria,
          AVG(COALESCE(cpp.unit_price, crp.supplier_price)) as precio_promedio,
          -- Calcular ahorro por consolidación de paquetes
          SUM(CEIL(crp.cantidad_real_necesaria / crp.package_size)) - CEIL(SUM(crp.cantidad_real_necesaria) / AVG(crp.package_size)) as paquetes_ahorrados
        FROM cantidades_reales_por_pedido crp
        JOIN cantidades_pedidas_por_pedido cpp ON crp.order_id = cpp.order_id AND crp.ingredient_id = cpp.ingredient_id
        GROUP BY crp.ingredient_id
        HAVING COUNT(DISTINCT crp.order_id) > 1  -- Solo ingredientes que están en múltiples pedidos
          AND SUM(CEIL(crp.cantidad_real_necesaria / crp.package_size)) > CEIL(SUM(crp.cantidad_real_necesaria) / MAX(crp.package_size))  -- Solo donde hay ahorro de paquetes
      )
      SELECT 
        COALESCE(
          SUM(api.paquetes_ahorrados * api.precio_promedio), 
          0
        ) as potential_savings
      FROM analisis_por_ingrediente api
    `);


    const dashboardData = {
      monthlySpending: parseFloat(monthlySpendingResult[0].monthly_spending) || 0,
      todayDeliveries: parseInt(todayDeliveriesResult[0].today_deliveries) || 0,
      potentialSavings: parseInt(potentialSavingsResult[0].potential_savings) || 0,
      lowStockItems: parseInt(lowStockResult[0].count) || 0,
      savingsDetail: savingsDetailResult || []
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
    const [confirmedEvents] = await req.tenantDb.query(`
      SELECT COUNT(*) as total_events,
             MIN(event_date) as date_from,
             MAX(event_date) as date_to
      FROM EVENTS e
      WHERE ${whereClause}
    `, queryParams);

    // 2. Calcular ingredientes necesarios (corregido para incluir merma en cantidades)
    const stockFormula = includeStock 
      ? 'GREATEST(0, (SUM(ri.quantity_per_serving * em.portions) * (1 + IFNULL(i.waste_percent, 0))) - i.stock)' 
      : 'SUM(ri.quantity_per_serving * em.portions) * (1 + IFNULL(i.waste_percent, 0))';
    
    // Cálculo de costos: usar precio por unidad base del ingrediente cuando no hay proveedor
    const costFormula = includeStock
      ? 'GREATEST(0, (SUM(ri.quantity_per_serving * em.portions) * (1 + IFNULL(i.waste_percent, 0))) - i.stock) * i.base_price'
      : 'SUM(ri.quantity_per_serving * em.portions) * (1 + IFNULL(i.waste_percent, 0)) * i.base_price';

    const [neededIngredients] = await req.tenantDb.query(`
      SELECT 
        i.ingredient_id,
        i.name,
        i.unit,
        i.base_price as price_per_unit,
        i.stock as current_stock,
        i.waste_percent,
        SUM(ri.quantity_per_serving * em.portions) as total_needed_base,
        SUM(ri.quantity_per_serving * em.portions) * (1 + IFNULL(i.waste_percent, 0)) as total_needed_with_waste,
        ${stockFormula} as to_buy,
        ${costFormula} as total_cost,
        MAX(si.supplier_id) as supplier_id,
        MAX(s.name) as supplier_name,
        MAX(si.package_size) as package_size,
        MAX(si.package_unit) as package_unit,
        MAX(si.minimum_order_quantity) as minimum_order_quantity,
        MAX(si.price) as supplier_price,
        -- Cálculos simplificados - se harán en JavaScript
        0 as packages_to_buy,
        0 as real_quantity,
        0 as real_total_cost,
        
        'unknown' as supplier_status,
        
        -- Campos de debug
        MAX(si.supplier_id) as debug_supplier_id,
        MAX(si.price) as debug_price,
        MAX(si.is_preferred_supplier) as debug_preferred
      FROM EVENTS e
      JOIN EVENT_MENUS em ON e.event_id = em.event_id
      JOIN RECIPE_INGREDIENTS ri ON em.recipe_id = ri.recipe_id
      JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
      LEFT JOIN SUPPLIER_INGREDIENTS si ON i.ingredient_id = si.ingredient_id AND si.is_preferred_supplier = 1
      LEFT JOIN SUPPLIERS s ON si.supplier_id = s.supplier_id
      WHERE ${whereClause}
        AND i.is_available = 1
      GROUP BY i.ingredient_id, i.name, i.unit, i.base_price, i.stock, i.waste_percent
      HAVING to_buy > 0
      ORDER BY COALESCE(MAX(s.name), 'zzz'), i.name
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

      // Calcular campos del proveedor correctamente en JavaScript
      const toBuy = Math.round(parseFloat(ingredient.to_buy) * 10000) / 10000;
      const packageSize = Math.round(parseFloat(ingredient.package_size || 1) * 10000) / 10000;
      const minimumOrderQuantity = Math.round(parseFloat(ingredient.minimum_order_quantity || 1) * 100) / 100;
      const supplierPrice = Math.round(parseFloat(ingredient.supplier_price || ingredient.price_per_unit) * 10000) / 10000;
      
      // Calcular cantidad real de paquetes necesarios
      let packagesToBuy = 0;
      let realQuantity = toBuy;
      let realTotalCost = Math.round(parseFloat(ingredient.total_cost || 0) * 100) / 100;
      
      if (ingredient.supplier_id && packageSize > 0) {
        packagesToBuy = Math.max(
          minimumOrderQuantity,
          Math.ceil(toBuy / packageSize)
        );
        realQuantity = packagesToBuy * packageSize;
        
        if (supplierPrice > 0) {
          realTotalCost = Math.round((packagesToBuy * supplierPrice) * 100) / 100;
        }
      }
      
      // Determinar estado del proveedor
      let supplierStatus = 'missing';
      if (ingredient.supplier_id) {
        supplierStatus = (supplierPrice > 0) ? 'complete' : 'incomplete';
      }

      const ingredientData = {
        ingredientId: ingredient.ingredient_id,
        name: ingredient.name,
        needed: Math.round(parseFloat(ingredient.total_needed_with_waste) * 10000) / 10000,
        neededBase: Math.round(parseFloat(ingredient.total_needed_base) * 10000) / 10000,
        neededWithWaste: Math.round(parseFloat(ingredient.total_needed_with_waste) * 10000) / 10000,
        wastePercent: Math.round(parseFloat(ingredient.waste_percent || 0) * 10000) / 10000,
        inStock: Math.round(parseFloat(ingredient.current_stock) * 10000) / 10000,
        toBuy: toBuy,
        unit: ingredient.unit,
        pricePerUnit: Math.round(parseFloat(ingredient.price_per_unit) * 10000) / 10000,
        totalCost: Math.round(parseFloat(ingredient.total_cost || 0) * 100) / 100,
        // Campos del proveedor calculados correctamente
        packageSize: packageSize,
        packageUnit: ingredient.package_unit || 'unidad',
        minimumOrderQuantity: minimumOrderQuantity,
        supplierPrice: supplierPrice,
        packagesToBuy: Math.round(packagesToBuy * 100) / 100,
        realQuantity: Math.round(realQuantity * 10000) / 10000,
        realTotalCost: realTotalCost,
        supplierStatus: supplierStatus,
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
    
    const [events] = await req.tenantDb.query(`
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
  const connection = await req.tenantDb.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      suppliers, // Array de proveedores con sus ingredientes
      deliveryDate,
      notes,
      generatedFrom, // 'shopping-list', 'manual', 'events'
      sourceEventIds // Array de event_ids que generaron este pedido
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
      // Preparar los source_events como JSON
      const sourceEventsJson = sourceEventIds && sourceEventIds.length > 0 ? JSON.stringify(sourceEventIds) : null;
      
      const [orderResult] = await connection.execute(`
        INSERT INTO SUPPLIER_ORDERS (
          supplier_id, 
          order_date, 
          delivery_date, 
          status, 
          total_amount, 
          notes, 
          source_events,
          created_by_user_id
        ) VALUES (?, CURDATE(), ?, 'pending', ?, ?, ?, ?)
      `, [
        supplierId === 999 ? null : supplierId, // null para "Sin Proveedor Asignado"
        deliveryDate || null,
        supplierTotal,
        notes || `Pedido generado desde ${generatedFrom || 'lista de compras'}`,
        sourceEventsJson,
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
          totalCost = 0,
          packageSize = 1
        } = ingredient;

        // Usar cantidades reales si están disponibles, sino las básicas
        const quantity = realQuantity > 0 ? realQuantity : toBuy;
        // Calcular precio unitario real: si hay proveedor, dividir precio del paquete por tamaño del paquete
        const unitPrice = supplierPrice > 0 && packageSize > 1 
          ? (supplierPrice / packageSize) 
          : (supplierPrice > 0 ? supplierPrice : (totalCost / toBuy));
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
      await logAudit(req.tenantDb, req.user.user_id, 'CREATE', 'SUPPLIER_ORDERS', orderId, 
        `Pedido creado para ${supplierName} - Total: €${supplierTotal}`);

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

// GET /supplier-orders/active - Obtener pedidos activos con filtros y paginación
router.get('/active', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  try {
    // Extraer parámetros de filtro y paginación de la query
    const {
      status = 'pending,ordered,delivered', // Estados por defecto
      dateFrom = null,
      dateTo = null,
      search = null,
      amountMin = null,
      amountMax = null,
      page = 1,
      limit = 20,
      sortKey = null,
      sortOrder = 'desc'
    } = req.query;

    // Paginación
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;

    // Construir condiciones WHERE dinámicamente
    let whereConditions = ['1=1']; // Condición base
    let queryParams = [];

    // Filtro por estados
    if (status) {
      const statusList = status.split(',').map(s => s.trim()).filter(s => s);
      if (statusList.length > 0) {
        const placeholders = statusList.map(() => '?').join(',');
        whereConditions.push(`so.status IN (${placeholders})`);
        queryParams.push(...statusList);
      }
    }

    // Filtro por fecha desde
    if (dateFrom) {
      whereConditions.push('so.order_date >= ?');
      queryParams.push(dateFrom);
    }

    // Filtro por fecha hasta
    if (dateTo) {
      whereConditions.push('so.order_date <= ?');
      queryParams.push(dateTo + ' 23:59:59'); // Incluir todo el día
    }

    // Filtro por búsqueda (número de pedido o nombre de proveedor)
    if (search) {
      whereConditions.push('(so.order_id LIKE ? OR s.name LIKE ?)');
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    // Filtro por importe mínimo
    if (amountMin) {
      whereConditions.push('so.total_amount >= ?');
      queryParams.push(parseFloat(amountMin));
    }

    // Filtro por importe máximo
    if (amountMax) {
      whereConditions.push('so.total_amount <= ?');
      queryParams.push(parseFloat(amountMax));
    }

    const whereClause = whereConditions.join(' AND ');

    // Contar total de registros
    const countSql = `
      SELECT COUNT(DISTINCT so.order_id) as total
      FROM SUPPLIER_ORDERS so
      LEFT JOIN SUPPLIERS s ON so.supplier_id = s.supplier_id
      WHERE ${whereClause}
    `;
    const [countResult] = await req.tenantDb.query(countSql, queryParams);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limitNum);

    // Determinar orden
    let orderClause = `
      ORDER BY 
        CASE so.status 
          WHEN 'pending' THEN 1 
          WHEN 'ordered' THEN 2 
          WHEN 'delivered' THEN 3 
          ELSE 4 
        END,
        so.created_at DESC
    `;
    
    if (sortKey && sortOrder) {
      const validSortKeys = ['order_id', 'supplier_name', 'order_date', 'total_amount', 'status'];
      const validSortOrders = ['asc', 'desc'];
      
      if (validSortKeys.includes(sortKey) && validSortOrders.includes(sortOrder.toLowerCase())) {
        if (sortKey === 'supplier_name') {
          orderClause = `ORDER BY s.name ${sortOrder.toUpperCase()}`;
        } else {
          orderClause = `ORDER BY so.${sortKey} ${sortOrder.toUpperCase()}`;
        }
      }
    }

    // Obtener datos paginados
    const dataSql = `
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
      WHERE ${whereClause}
      GROUP BY so.order_id, so.supplier_id, s.name, so.order_date, so.delivery_date, 
               so.status, so.total_amount, so.notes, so.created_at, so.updated_at,
               u.first_name, u.last_name
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    
    const dataParams = [...queryParams, limitNum, offset];
    const [orders] = await req.tenantDb.query(dataSql, dataParams);

    // Devolver respuesta paginada
    res.json({
      data: orders,
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
    const [totalResult] = await req.tenantDb.query(`
      SELECT COUNT(*) as total
      FROM SUPPLIER_ORDERS so
      LEFT JOIN SUPPLIERS s ON so.supplier_id = s.supplier_id
      ${whereClause}
    `, queryParams);

    const totalRecords = totalResult[0].total;
    const totalPages = Math.ceil(totalRecords / parseInt(limit));

    // Obtener datos con paginación
    const [orders] = await req.tenantDb.query(`
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
    const [statsResult] = await req.tenantDb.query(`
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
    const [spendingTrends] = await req.tenantDb.query(`
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
    const [supplierTrends] = await req.tenantDb.query(`
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
    const [deliveryMetrics] = await req.tenantDb.query(`
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
    const [statusDistribution] = await req.tenantDb.query(`
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
    const [orders] = await req.tenantDb.query(`
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
      LIMIT 100  -- OPTIMIZACIÓN CRÍTICA: Limitar para evitar agotamiento de memoria
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
    const [orders] = await req.tenantDb.query(`
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
    const [items] = await req.tenantDb.query(`
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

// PUT /supplier-orders/:id/items - Actualizar items de un pedido
router.put('/:id/items', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id } = req.params;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Los items son obligatorios' });
  }

  const connection = await req.tenantDb.getConnection();
  
  try {
    await connection.beginTransaction();

    // Verificar que el pedido existe y está en estado 'ordered'
    const [existing] = await connection.query(
      'SELECT status, supplier_id FROM SUPPLIER_ORDERS WHERE order_id = ?', 
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    if (existing[0].status !== 'ordered') {
      return res.status(400).json({ 
        message: 'Solo se pueden editar pedidos en estado "enviado"' 
      });
    }

    // Obtener información del pedido para saber el proveedor
    const [orderInfo] = await connection.query(
      'SELECT supplier_id FROM SUPPLIER_ORDERS WHERE order_id = ?', 
      [id]
    );
    const supplierId = orderInfo[0]?.supplier_id;

    // Actualizar cada item
    for (const item of items) {
      const { ingredient_id, quantity, unit_price } = item;
      const total_price = quantity * unit_price;

      // Actualizar el item del pedido
      await connection.execute(`
        UPDATE SUPPLIER_ORDER_ITEMS 
        SET quantity = ?, unit_price = ?, total_price = ?
        WHERE order_id = ? AND ingredient_id = ?
      `, [quantity, unit_price, total_price, id, ingredient_id]);

      // Si el pedido tiene proveedor, actualizar el precio en SUPPLIER_INGREDIENTS
      if (supplierId) {
        await connection.execute(`
          UPDATE SUPPLIER_INGREDIENTS 
          SET price = ?
          WHERE supplier_id = ? AND ingredient_id = ?
        `, [unit_price, supplierId, ingredient_id]);
        
      }

      // Actualizar también el precio base del ingrediente
      await connection.execute(`
        UPDATE INGREDIENTS 
        SET base_price = ?
        WHERE ingredient_id = ?
      `, [unit_price, ingredient_id]);
      
    }

    // Recalcular el total del pedido
    const [newTotal] = await connection.query(`
      SELECT SUM(total_price) as new_total
      FROM SUPPLIER_ORDER_ITEMS 
      WHERE order_id = ?
    `, [id]);

    // Actualizar el total del pedido
    await connection.execute(`
      UPDATE SUPPLIER_ORDERS 
      SET total_amount = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `, [newTotal[0].new_total || 0, id]);

    // Registrar auditoría
    const priceUpdatesCount = supplierId ? items.length : 0;
    await logAudit(req.tenantDb, req.user.user_id, 'UPDATE', 'SUPPLIER_ORDER_ITEMS', id, 
      `Items del pedido actualizados - Nuevo total: €${newTotal[0].new_total || 0} - ${items.length} precios base actualizados${priceUpdatesCount > 0 ? ` - ${priceUpdatesCount} precios de relación proveedor-ingrediente actualizados` : ''}`);

    await connection.commit();

    res.json({ 
      success: true, 
      message: 'Items del pedido actualizados exitosamente',
      newTotal: newTotal[0].new_total || 0
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar items del pedido:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  } finally {
    connection.release();
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
    const [existing] = await req.tenantDb.query('SELECT status, supplier_id FROM SUPPLIER_ORDERS WHERE order_id = ?', [id]);
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

    await req.tenantDb.query(`
      UPDATE SUPPLIER_ORDERS 
      SET ${updateFields.join(', ')}
      WHERE order_id = ?
    `, updateValues);

    // Si el pedido se marca como entregado, actualizar el stock de ingredientes
    if (status === 'delivered' && oldStatus !== 'delivered') {
      const [items] = await req.tenantDb.query(`
        SELECT ingredient_id, quantity 
        FROM SUPPLIER_ORDER_ITEMS 
        WHERE order_id = ?
      `, [id]);

      for (const item of items) {
        await req.tenantDb.query(`
          UPDATE INGREDIENTS 
          SET stock = stock + ? 
          WHERE ingredient_id = ?
        `, [item.quantity, item.ingredient_id]);
        
      }
    }

    // Registrar auditoría
    await logAudit(req.tenantDb, req.user.user_id, 'UPDATE', 'SUPPLIER_ORDERS', id, 
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
  const connection = await req.tenantDb.getConnection();

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
    await logAudit(req.tenantDb, req.user.user_id, 'DELETE', 'SUPPLIER_ORDERS', id, 
      'Pedido eliminado');

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
    const [suppliersData] = await req.tenantDb.query(`
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
        const [ingredientsData] = await req.tenantDb.query(`
          SELECT 
            COUNT(DISTINCT si.ingredient_id) as ingredients_count,
            AVG(si.price) as average_ingredient_price
          FROM SUPPLIER_INGREDIENTS si
          WHERE si.supplier_id = ?
        `, [supplier.supplier_id]);

        // Calcular rating de precios de forma más simple
        const [ingredientPrices] = await req.tenantDb.query(`
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