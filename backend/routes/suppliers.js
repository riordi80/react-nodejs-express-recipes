// routes/suppliers.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const logAudit = require('../utils/audit');

// Multi-tenant: usar req.tenantDb en lugar de pool estático

// GET /suppliers - Con paginación y búsqueda
router.get('/', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    
    // Paginación
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * limitNum;
    
    let baseQuery = `FROM SUPPLIERS s
                     LEFT JOIN SUPPLIER_INGREDIENTS si ON s.supplier_id = si.supplier_id`;
    let whereConditions = [];
    let params = [];
    
    // Filtro de búsqueda por nombre (insensible a acentos)
    if (search && search.trim() !== '') {
      const normalizedSearch = search.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      whereConditions.push(`REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
        UPPER(s.name), 
        'Á','A'), 'É','E'), 'Í','I'), 'Ó','O'), 'Ú','U'), 'Ñ','N'), 'Ü','U'), 'À','A'), 'È','E'), 'Ì','I')
        LIKE UPPER(?)`);
      params.push(`%${normalizedSearch}%`);
    }
    
    // Construir WHERE clause
    const whereClause = whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '';
    const groupByClause = ' GROUP BY s.supplier_id';
    
    // Contar total de registros
    const countQuery = `SELECT COUNT(DISTINCT s.supplier_id) as total ${baseQuery}${whereClause}`;
    const [countResult] = await req.tenantDb.query(countQuery, [...params]);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limitNum);
    
    // Obtener datos paginados
    const dataQuery = `SELECT s.*, 
                              COUNT(si.ingredient_id) as ingredients_count
                       ${baseQuery}${whereClause}${groupByClause}
                       ORDER BY s.name ASC
                       LIMIT ? OFFSET ?`;
    params.push(limitNum, offset);
    
    const [rows] = await req.tenantDb.query(dataQuery, params);
    
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
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ message: 'Error al obtener proveedores' });
  }
});

// GET /suppliers/:id
router.get('/:id', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const { id } = req.params;
  const [rows] = await req.tenantDb.query('SELECT * FROM SUPPLIERS WHERE supplier_id = ?', [id]);
  if (rows.length === 0) return res.status(404).json({ message: 'Proveedor no encontrado' });
  res.json(rows[0]);
});

// POST /suppliers
router.post('/', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  try {
    const { name, phone, email, website_url, address, contact_person, notes, active } = req.body;
    
    // Validación básica
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }
    
    const [result] = await req.tenantDb.query(
      'INSERT INTO SUPPLIERS (name, phone, email, website_url, address, contact_person, notes, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, phone, email, website_url, address, contact_person, notes, active || true]
    );

    await logAudit(req.tenantDb, req.user.user_id, 'create', 'SUPPLIERS', result.insertId, `Proveedor "${name}" creado`);
    
    res.status(201).json({ 
      message: 'Proveedor creado correctamente',
      supplier_id: result.insertId
    });
  } catch (error) {
    console.error('Error en POST /suppliers:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

// PUT /suppliers/:id
router.put('/:id', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, website_url, address, contact_person, notes, active } = req.body;

  await req.tenantDb.query(
    'UPDATE SUPPLIERS SET name = ?, phone = ?, email = ?, website_url = ?, address = ?, contact_person = ?, notes = ?, active = ? WHERE supplier_id = ?',
    [name, phone, email, website_url, address, contact_person, notes, active, id]
  );

  await logAudit(req.tenantDb, req.user.user_id, 'update', 'SUPPLIERS', id, `Proveedor actualizado: ${name}`);
  res.json({ message: 'Proveedor actualizado' });
});

// DELETE /suppliers/:id
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  await req.tenantDb.query('DELETE FROM SUPPLIER_INGREDIENTS WHERE supplier_id = ?', [id]);
  await req.tenantDb.query('DELETE FROM SUPPLIERS WHERE supplier_id = ?', [id]);

  await logAudit(req.tenantDb, req.user.user_id, 'delete', 'SUPPLIERS', id, `Proveedor con ID ${id} eliminado`);
  res.json({ message: 'Proveedor eliminado' });
});

// GET /suppliers/:id/ingredients - Con paginación
router.get('/:id/ingredients', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sortKey, sortOrder = 'asc' } = req.query;
    
    // Paginación
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    
    // Validar sortKey permitidas
    const allowedSortKeys = ['name', 'price', 'delivery_time', 'package_size', 'is_preferred_supplier'];
    const validSortKey = allowedSortKeys.includes(sortKey) ? sortKey : 'name';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder?.toLowerCase()) ? sortOrder.toLowerCase() : 'asc';
    
    // Contar total de ingredientes del proveedor
    const [countResult] = await req.tenantDb.query(`
      SELECT COUNT(*) as total
      FROM SUPPLIER_INGREDIENTS si
      JOIN INGREDIENTS i ON si.ingredient_id = i.ingredient_id
      WHERE si.supplier_id = ?
    `, [id]);
    
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limitNum);
    
    // Obtener ingredientes paginados y ordenados
    const [rows] = await req.tenantDb.query(`
      SELECT si.ingredient_id, i.name as ingredient_name, si.price, si.delivery_time, si.is_preferred_supplier, 
             si.package_size, si.package_unit, si.minimum_order_quantity, si.updated_at
      FROM SUPPLIER_INGREDIENTS si
      JOIN INGREDIENTS i ON si.ingredient_id = i.ingredient_id
      WHERE si.supplier_id = ?
      ORDER BY ${validSortKey === 'name' ? 'i.name' : 'si.' + validSortKey} ${validSortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `, [id, limitNum, offset]);
    
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
    console.error('Error fetching supplier ingredients:', error);
    res.status(500).json({ message: 'Error al obtener ingredientes del proveedor' });
  }
});

// GET /suppliers/:id/orders - Historial de pedidos del proveedor
router.get('/:id/orders', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sortKey = 'order_date', sortOrder = 'desc' } = req.query;
    
    // Paginación
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    
    // Validar sortKey permitidas
    const allowedSortKeys = ['order_date', 'delivery_date', 'status', 'total_amount', 'created_at'];
    const validSortKey = allowedSortKeys.includes(sortKey) ? sortKey : 'order_date';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder?.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';
    
    // Contar total de pedidos del proveedor
    const [countResult] = await req.tenantDb.query(`
      SELECT COUNT(*) as total
      FROM SUPPLIER_ORDERS
      WHERE supplier_id = ?
    `, [id]);
    
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limitNum);
    
    // Obtener pedidos con información adicional
    const [orders] = await req.tenantDb.query(`
      SELECT so.order_id, so.order_date, so.delivery_date, so.status, so.total_amount, 
             so.notes, so.source_events, so.created_at, so.updated_at,
             u.first_name, u.last_name,
             COUNT(soi.ingredient_id) as items_count,
             SUM(soi.quantity) as total_quantity
      FROM SUPPLIER_ORDERS so
      LEFT JOIN USERS u ON so.created_by_user_id = u.user_id
      LEFT JOIN SUPPLIER_ORDER_ITEMS soi ON so.order_id = soi.order_id
      WHERE so.supplier_id = ?
      GROUP BY so.order_id
      ORDER BY so.${validSortKey} ${validSortOrder.toUpperCase()}
      LIMIT ? OFFSET ?
    `, [id, limitNum, offset]);
    
    // Obtener detalles de ingredientes para cada pedido
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const [items] = await req.tenantDb.query(`
        SELECT soi.ingredient_id, i.name as ingredient_name, soi.quantity, 
               soi.unit_price, soi.total_price, i.unit
        FROM SUPPLIER_ORDER_ITEMS soi
        JOIN INGREDIENTS i ON soi.ingredient_id = i.ingredient_id
        WHERE soi.order_id = ?
        ORDER BY i.name
      `, [order.order_id]);
      
      return {
        ...order,
        items,
        created_by: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
        source_events: order.source_events ? JSON.parse(order.source_events) : []
      };
    }));
    
    res.json({
      data: ordersWithItems,
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
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({ message: 'Error al obtener historial de pedidos del proveedor' });
  }
});

// POST /suppliers/:id/ingredients
router.post('/:id/ingredients', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const { id } = req.params;
  const { ingredients } = req.body;

  try {
    // Verificar si el cuerpo contiene múltiples ingredientes o uno solo
    const ingredientsArray = ingredients || [req.body];
    
    // Validar que tenemos ingredientes válidos
    if (!ingredientsArray || ingredientsArray.length === 0) {
      return res.status(400).json({ message: 'No se han proporcionado ingredientes válidos' });
    }

    // Validar campos requeridos
    for (const ingredient of ingredientsArray) {
      if (!ingredient.ingredient_id || !ingredient.price) {
        return res.status(400).json({ message: 'Faltan campos requeridos: ingredient_id y price' });
      }
    }
    
    // Validar que no haya ingredientes duplicados
    const duplicateChecks = await Promise.all(
      ingredientsArray.map(async (ingredient) => {
        const [exists] = await req.tenantDb.query(
          'SELECT 1 FROM SUPPLIER_INGREDIENTS WHERE supplier_id = ? AND ingredient_id = ?',
          [id, ingredient.ingredient_id]
        );
        return { ingredient_id: ingredient.ingredient_id, exists: exists.length > 0 };
      })
    );

    const duplicates = duplicateChecks.filter(check => check.exists);
    if (duplicates.length > 0) {
      return res.status(400).json({ 
        message: `Los siguientes ingredientes ya están asociados a este proveedor: ${duplicates.map(d => d.ingredient_id).join(', ')}` 
      });
    }

    // Insertar todos los ingredientes
    await Promise.all(
      ingredientsArray.map(async (ingredient) => {
        await req.tenantDb.query(
          `INSERT INTO SUPPLIER_INGREDIENTS 
           (supplier_id, ingredient_id, price, delivery_time, is_preferred_supplier, package_size, package_unit, minimum_order_quantity) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, 
            ingredient.ingredient_id, 
            ingredient.price, 
            ingredient.delivery_time || null, 
            ingredient.is_preferred_supplier || false,
            ingredient.package_size || 1.0,
            ingredient.package_unit || 'unidad',
            ingredient.minimum_order_quantity || 1.0
          ]
        );
      })
    );

    await logAudit(req.tenantDb, req.user.user_id, 'create', 'SUPPLIER_INGREDIENTS', null, `${ingredientsArray.length} ingrediente(s) asignado(s) al proveedor ${id}`);
    res.status(201).json({ message: `${ingredientsArray.length} ingrediente(s) asignado(s) al proveedor correctamente` });
  } catch (error) {
    console.error('Error al asignar ingredientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /suppliers/:id/ingredients/:ingredient_id
router.put('/:id/ingredients/:ingredient_id', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const { id, ingredient_id } = req.params;
  const { price, delivery_time, is_preferred_supplier, package_size, package_unit, minimum_order_quantity } = req.body;

  try {
    // Verificar que la relación existe
    const [exists] = await req.tenantDb.query(
      'SELECT 1 FROM SUPPLIER_INGREDIENTS WHERE supplier_id = ? AND ingredient_id = ?',
      [id, ingredient_id]
    );

    if (exists.length === 0) {
      return res.status(404).json({ message: 'La relación proveedor-ingrediente no existe' });
    }

    // Actualizar la relación
    await req.tenantDb.query(
      `UPDATE SUPPLIER_INGREDIENTS 
       SET price = ?, delivery_time = ?, is_preferred_supplier = ?, package_size = ?, package_unit = ?, minimum_order_quantity = ?
       WHERE supplier_id = ? AND ingredient_id = ?`,
      [price, delivery_time, is_preferred_supplier, package_size || 1.0, package_unit || 'unidad', minimum_order_quantity || 1.0, id, ingredient_id]
    );

    await logAudit(req.tenantDb, req.user.user_id, 'update', 'SUPPLIER_INGREDIENTS', null, `Relación proveedor ${id} - ingrediente ${ingredient_id} actualizada`);
    res.json({ message: 'Relación proveedor-ingrediente actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar relación proveedor-ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /suppliers/:id/ingredients/:ingredient_id
router.delete('/:id/ingredients/:ingredient_id', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const { id, ingredient_id } = req.params;
  
  try {
    // Verificar que la relación existe
    const [exists] = await req.tenantDb.query(
      'SELECT 1 FROM SUPPLIER_INGREDIENTS WHERE supplier_id = ? AND ingredient_id = ?',
      [id, ingredient_id]
    );

    if (exists.length === 0) {
      return res.status(404).json({ message: 'La relación proveedor-ingrediente no existe' });
    }

    await req.tenantDb.query(
      'DELETE FROM SUPPLIER_INGREDIENTS WHERE supplier_id = ? AND ingredient_id = ?',
      [id, ingredient_id]
    );

    await logAudit(req.tenantDb, req.user.user_id, 'delete', 'SUPPLIER_INGREDIENTS', null, `Ingrediente ${ingredient_id} desvinculado del proveedor ${id}`);
    res.json({ message: 'Ingrediente eliminado del proveedor' });
  } catch (error) {
    console.error('Error al eliminar relación proveedor-ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
