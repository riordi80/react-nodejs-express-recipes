// routes/ingredients.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const logAudit = require('../utils/audit');

// Multi-tenant: usar req.tenantDb en lugar de pool estático
// Nota: Los límites de conexión se manejan ahora en databaseManager.js

// GET /ingredients/dashboard-widgets - Datos para widgets del dashboard de ingredientes
router.get('/dashboard-widgets', authenticateToken, authorizeRoles('admin', 'chef', 'inventory_manager'), async (req, res) => {
  try {
    // 1. Stock Crítico - Ingredientes con stock por debajo del mínimo
    const [lowStockRows] = await req.tenantDb.query(`
      SELECT ingredient_id, name, stock, stock_minimum, unit, is_available,
             (stock_minimum - stock) as deficit
      FROM INGREDIENTS 
      WHERE is_available = TRUE 
        AND stock < stock_minimum 
        AND stock_minimum > 0
      ORDER BY (stock_minimum - stock) DESC
      LIMIT 6
    `);

    // 1b. Contar total de ingredientes en stock crítico
    const [lowStockCountResult] = await req.tenantDb.query(`
      SELECT COUNT(*) as total
      FROM INGREDIENTS 
      WHERE is_available = TRUE 
        AND stock < stock_minimum 
        AND stock_minimum > 0
    `);
    const lowStockTotal = lowStockCountResult[0].total;

    // 2. Próximos a Caducar - Ingredientes con fecha de caducidad en los próximos 15 días
    const [expiringRows] = await req.tenantDb.query(`
      SELECT ingredient_id, name, expiration_date, stock, unit,
             DATEDIFF(expiration_date, CURDATE()) as days_until_expiry
      FROM INGREDIENTS 
      WHERE is_available = TRUE 
        AND expiration_date IS NOT NULL 
        AND expiration_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY)
        AND stock > 0
      ORDER BY expiration_date ASC
      LIMIT 6
    `);

    // 2b. Contar total de ingredientes próximos a caducar
    const [expiringCountResult] = await req.tenantDb.query(`
      SELECT COUNT(*) as total
      FROM INGREDIENTS 
      WHERE is_available = TRUE 
        AND expiration_date IS NOT NULL 
        AND expiration_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY)
        AND stock > 0
    `);
    const expiringTotal = expiringCountResult[0].total;

    // 3. Ingredientes Estacionales - Versión optimizada manteniendo funcionalidad
    const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' });
    const [seasonalRows] = await req.tenantDb.query(`
      SELECT ingredient_id, name, season, stock, unit, base_price, net_price, is_available
      FROM INGREDIENTS 
      WHERE season IS NOT NULL 
        AND season != ''
        AND season != 'todo_año'
        AND season != 'todo el año'
        AND is_available = TRUE
        AND season LIKE ?
      ORDER BY stock DESC, name ASC
      LIMIT 6
    `, [`%${currentMonth}%`]);

    // 3b. Contar total de ingredientes estacionales
    const [seasonalCountResult] = await req.tenantDb.query(`
      SELECT COUNT(*) as total
      FROM INGREDIENTS 
      WHERE season IS NOT NULL 
        AND season != ''
        AND season != 'todo_año'
        AND season != 'todo el año'
        AND is_available = TRUE
        AND season LIKE ?
    `, [`%${currentMonth}%`]);
    const seasonalTotal = seasonalCountResult[0].total;

    // 4. Sin Proveedor Preferido - CONSULTA OPTIMIZADA
    const [noPreferredRows] = await req.tenantDb.query(`
      SELECT 
        i.ingredient_id, 
        i.name, 
        i.stock, 
        i.unit, 
        i.base_price, 
        i.is_available,
        COALESCE(ic.name, 'Sin categoría') as category
      FROM INGREDIENTS i
      LEFT JOIN INGREDIENT_CATEGORY_ASSIGNMENTS ica ON i.ingredient_id = ica.ingredient_id
      LEFT JOIN INGREDIENT_CATEGORIES ic ON ica.category_id = ic.category_id
      WHERE i.is_available = TRUE 
        AND i.ingredient_id NOT IN (
          SELECT DISTINCT ingredient_id FROM SUPPLIER_INGREDIENTS 
          WHERE ingredient_id IS NOT NULL AND is_preferred_supplier = TRUE
        )
      ORDER BY i.name ASC
      LIMIT 6
    `);

    // 4b. Contar total de ingredientes sin proveedor preferido
    const [noPreferredCountResult] = await req.tenantDb.query(`
      SELECT COUNT(*) as total
      FROM INGREDIENTS i
      WHERE i.is_available = TRUE 
        AND i.ingredient_id NOT IN (
          SELECT DISTINCT ingredient_id FROM SUPPLIER_INGREDIENTS 
          WHERE ingredient_id IS NOT NULL AND is_preferred_supplier = TRUE
        )
    `);
    const noPreferredTotal = noPreferredCountResult[0].total;

    // DEBUG TEMPORAL - verificar resultados
    console.log('🔍 Resultados widgets:', {
      lowStock: lowStockRows.length,
      expiringSoon: expiringRows.length, 
      seasonal: seasonalRows.length,
      noPreferred: noPreferredRows.length,
      currentMonth,
      totals: {
        lowStock: lowStockTotal,
        expiringSoon: expiringTotal,
        seasonal: seasonalTotal,
        noPreferred: noPreferredTotal
      }
    });

    // DEBUG ESPECÍFICO para ingredientes próximos a caducar
    console.log('🕐 DEBUG Próximos a Caducar:', {
      fecha_actual: new Date().toISOString().split('T')[0],
      ingredientes_encontrados: expiringRows.length,
      total_ingredientes: expiringTotal,
      primeros_resultados: expiringRows.slice(0, 3).map(ing => ({
        name: ing.name,
        expiration_date: ing.expiration_date,
        days_until_expiry: ing.days_until_expiry,
        stock: ing.stock
      }))
    });

    res.json({
      lowStock: lowStockRows,
      expiringSoon: expiringRows,
      seasonal: seasonalRows,
      noSuppliers: noPreferredRows,  // Mantener el nombre noSuppliers para compatibilidad frontend
      totals: {
        lowStock: lowStockTotal,
        expiringSoon: expiringTotal,
        seasonal: seasonalTotal,
        noSuppliers: noPreferredTotal
      }
    });

  } catch (error) {
    console.error('Error fetching ingredients dashboard data:', error);
    res.status(500).json({ message: 'Error al obtener datos del dashboard' });
  }
});

// GET /ingredients - Todos los ingredientes con filtros múltiples
router.get('/', authenticateToken, authorizeRoles('admin', 'chef', 'inventory_manager'), async (req, res) => {
  try {
    const { available, search, expiryStatus, stockStatus, season } = req.query;
    
    let query = 'SELECT * FROM INGREDIENTS';
    let whereConditions = [];
    let params = [];
    
    // Filtro de disponibilidad
    if (available === 'true') {
      whereConditions.push('is_available = TRUE');
    } else if (available === 'false') {
      whereConditions.push('is_available = FALSE');
    }
    
    // Filtro de búsqueda por nombre
    if (search && search.trim() !== '') {
      whereConditions.push('name LIKE ?');
      params.push(`%${search.trim()}%`);
    }
    
    // Filtro de temporada
    if (season && season.trim() !== '') {
      whereConditions.push('(season LIKE ? OR season = ?)');
      params.push(`%${season.trim()}%`, season.trim());
    }
    
    // Aplicar condiciones WHERE si existen
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    query += ' ORDER BY name ASC';
    
    // OPTIMIZACIÓN CRÍTICA: Limitar consulta para evitar agotamiento de memoria
    const maxIngredients = 500; // Límite de seguridad
    query += ' LIMIT ?';
    params.push(maxIngredients);
    
    let [rows] = await req.tenantDb.query(query, params);
    
    // Aplicar filtros de JavaScript para lógica compleja
    if (expiryStatus || stockStatus) {
      const currentDate = new Date();
      
      rows = rows.filter(ingredient => {
        let passesExpiryFilter = true;
        let passesStockFilter = true;
        
        // Filtro de estado de caducidad
        if (expiryStatus) {
          if (ingredient.expiration_date) {
            const expiryDate = new Date(ingredient.expiration_date);
            const daysDiff = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
            
            switch (expiryStatus) {
              case 'expired':
                passesExpiryFilter = daysDiff < 0;
                break;
              case 'critical':
                passesExpiryFilter = daysDiff >= 0 && daysDiff <= 3;
                break;
              case 'warning':
                passesExpiryFilter = daysDiff >= 4 && daysDiff <= 7;
                break;
              case 'normal':
                passesExpiryFilter = daysDiff > 7;
                break;
            }
          } else {
            // Si no tiene fecha de caducidad, solo pasa el filtro "normal"
            passesExpiryFilter = expiryStatus === 'normal';
          }
        }
        
        // Filtro de estado de stock
        if (stockStatus) {
          const stock = parseFloat(ingredient.stock) || 0;
          const stockMinimum = parseFloat(ingredient.stock_minimum) || 0;
          
          switch (stockStatus) {
            case 'low':
              passesStockFilter = stockMinimum > 0 && stock < stockMinimum;
              break;
            case 'withStock':
              passesStockFilter = stock > 0;
              break;
            case 'noStock':
              passesStockFilter = stock === 0;
              break;
          }
        }
        
        return passesExpiryFilter && passesStockFilter;
      });
    }
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ message: 'Error al obtener ingredientes' });
  }
});

// GET /ingredients/:id/price-history
router.get('/:id/price-history', authenticateToken, authorizeRoles('admin', 'supplier_manager'), async (req, res) => {
  const { id } = req.params;

  const [rows] = await req.tenantDb.query(`
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
  const [rows] = await req.tenantDb.query(`
    SELECT a.allergen_id, a.name
    FROM ALLERGENS a
    JOIN INGREDIENT_ALLERGENS ia ON a.allergen_id = ia.allergen_id
    WHERE ia.ingredient_id = ?
  `, [req.params.id]);
  res.json(rows);
});

// GET /ingredients/:id - Ingrediente por ID
router.get('/:id', authenticateToken, authorizeRoles('admin', 'chef', 'inventory_manager'), async (req, res) => {
  try {
    // 1. Obtener datos básicos del ingrediente
    const [ingredientRows] = await req.tenantDb.query('SELECT * FROM INGREDIENTS WHERE ingredient_id = ?', [req.params.id]);
    if (ingredientRows.length === 0) {
      return res.status(404).json({ message: 'Ingrediente no encontrado' });
    }

    const ingredient = ingredientRows[0];

    // 2. Obtener alérgenos asignados a este ingrediente
    const [allergenRows] = await req.tenantDb.query(`
      SELECT a.allergen_id, a.name
      FROM INGREDIENT_ALLERGENS ia
      JOIN ALLERGENS a ON ia.allergen_id = a.allergen_id
      WHERE ia.ingredient_id = ?
    `, [req.params.id]);

    // 3. Incluir solo los IDs de los alérgenos en el response (para compatibilidad con el frontend)
    ingredient.allergens = allergenRows.map(allergen => allergen.allergen_id);
    ingredient.allergen_details = allergenRows; // Para información adicional si se necesita

    // 4. Convertir fecha de caducidad a formato ISO si existe
    if (ingredient.expiration_date) {
      // MySQL devuelve un objeto Date, convertirlo a formato ISO
      const dateObj = new Date(ingredient.expiration_date);
      // Ajustar para zona horaria y evitar desfase de días
      dateObj.setUTCHours(23, 0, 0, 0);
      ingredient.expiration_date = dateObj.toISOString();
    }
    
    res.json(ingredient);
  } catch (error) {
    console.error('Error al cargar ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /ingredients - Crear nuevo ingrediente
router.post('/', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const {
    name, unit, base_price, waste_percent, net_price,
    stock, stock_minimum, season, expiration_date, is_available, comment
  } = req.body;

  // Convertir fecha ISO a formato MySQL DATE (YYYY-MM-DD)
  let mysql_expiration_date = null;
  if (expiration_date) {
    if (typeof expiration_date === 'string') {
      if (expiration_date.includes('T')) {
        // Formato ISO: "2025-07-16T23:00:00.000Z" -> "2025-07-16"
        mysql_expiration_date = expiration_date.split('T')[0];
      } else if (expiration_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Ya está en formato MySQL: "2025-07-16"
        mysql_expiration_date = expiration_date;
      }
    } else if (expiration_date instanceof Date) {
      // Es un objeto Date
      mysql_expiration_date = expiration_date.toISOString().split('T')[0];
    }
  }

  const [result] = await req.tenantDb.query(`
    INSERT INTO INGREDIENTS
    (name, unit, base_price, waste_percent, net_price, stock, stock_minimum, season, expiration_date, is_available, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, unit, base_price, waste_percent, net_price, stock, stock_minimum, season, mysql_expiration_date, is_available, comment]
  );

  await logAudit(req.tenantDb, req.user.user_id, 'create', 'INGREDIENTS', result.insertId, `Ingrediente "${name}" creado`);
  res.status(201).json({ 
    message: 'Ingrediente creado correctamente', 
    ingredient_id: result.insertId 
  });
});

// PUT /ingredients/:id - Actualizar ingrediente
router.put('/:id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const connection = await req.tenantDb.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      name, unit, base_price, waste_percent, net_price,
      stock, stock_minimum, season, expiration_date, is_available, comment,
      calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
      allergens
    } = req.body;

    // Convertir fecha ISO a formato MySQL DATE (YYYY-MM-DD)
    let mysql_expiration_date = null;
    if (expiration_date) {
      if (typeof expiration_date === 'string') {
        if (expiration_date.includes('T')) {
          // Formato ISO: "2025-07-16T23:00:00.000Z" -> "2025-07-16"
          mysql_expiration_date = expiration_date.split('T')[0];
        } else if (expiration_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Ya está en formato MySQL: "2025-07-16"
          mysql_expiration_date = expiration_date;
        }
      } else if (expiration_date instanceof Date) {
        // Es un objeto Date
        mysql_expiration_date = expiration_date.toISOString().split('T')[0];
      }
    }

    // Procesar season para permitir múltiples temporadas
    let clean_season = season;
    
    if (Array.isArray(season)) {
      // El frontend está enviando array de temporadas, unirlas con comas
      clean_season = season.join(',');
    } else if (typeof season === 'string' && season.includes(',')) {
      // Ya es un string separado por comas, mantenerlo así
      clean_season = season;
    }
    
    // Limpiar duplicados si existen
    if (clean_season && typeof clean_season === 'string' && clean_season.includes(',')) {
      const seasons = clean_season.split(',').map(s => s.trim()).filter(s => s);
      // Eliminar duplicados manteniendo el orden
      const uniqueSeasons = [...new Set(seasons)];
      clean_season = uniqueSeasons.join(',');
    }


    // 1. Actualizar información básica del ingrediente
    await connection.query(`
      UPDATE INGREDIENTS SET
      name = ?, unit = ?, base_price = ?, waste_percent = ?, net_price = ?,
      stock = ?, stock_minimum = ?, season = ?, expiration_date = ?, is_available = ?, comment = ?,
      calories_per_100g = ?, protein_per_100g = ?, carbs_per_100g = ?, fat_per_100g = ?
      WHERE ingredient_id = ?`,
      [name, unit, base_price, waste_percent, net_price, stock, stock_minimum, clean_season, mysql_expiration_date, is_available, comment, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, req.params.id]
    );

    // 2. Actualizar alérgenos si se proporcionaron
    if (allergens && Array.isArray(allergens)) {
      // Eliminar alérgenos existentes
      await connection.query('DELETE FROM INGREDIENT_ALLERGENS WHERE ingredient_id = ?', [req.params.id]);

      // Insertar nuevos alérgenos
      if (allergens.length > 0) {
        const values = allergens.map(allergen_id => [req.params.id, allergen_id]);
        await connection.query(
          'INSERT INTO INGREDIENT_ALLERGENS (ingredient_id, allergen_id) VALUES ?',
          [values]
        );
      }
    }

    await connection.commit();
    await logAudit(req.tenantDb, req.user.user_id, 'UPDATE', 'INGREDIENTS', req.params.id, `Ingrediente "${name}" actualizado`);
    
    res.json({ message: 'Ingrediente actualizado' });
  } catch (error) {
    await connection.rollback();
    console.error('Error detallado al actualizar ingrediente:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  } finally {
    connection.release();
  }
});

// POST /ingredients/:id/allergens - Asignar alérgenos a un ingrediente
router.post('/:id/allergens', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { allergen_ids } = req.body;
  const ingredient_id = req.params.id;

  if (!Array.isArray(allergen_ids)) {
    return res.status(400).json({ message: 'allergen_ids debe ser un array' });
  }

  const connection = await req.tenantDb.getConnection();
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
      await logAudit(req.tenantDb, req.user.user_id, 'update', 'INGREDIENT_ALLERGENS', ingredient_id, `Alérgenos actualizados para ingrediente ${ingredient_id}`);
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
  try {
    const { id, allergen_id } = req.params;

    await req.tenantDb.query('DELETE FROM INGREDIENT_ALLERGENS WHERE ingredient_id = ? AND allergen_id = ?', [id, allergen_id]);

    await logAudit(req.tenantDb, req.user.user_id, 'DELETE', 'INGREDIENT_ALLERGENS', id, `Alérgeno ${allergen_id} eliminado del ingrediente ${id}`);
    res.json({ message: 'Alérgeno eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar alérgeno:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /ingredients/:id - Soft delete: desactivar ingrediente
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;

  try {
    // Obtener el nombre del ingrediente para la auditoría
    const [ingredient] = await req.tenantDb.query('SELECT name FROM INGREDIENTS WHERE ingredient_id = ?', [id]);
    if (ingredient.length === 0) {
      return res.status(404).json({ message: 'Ingrediente no encontrado' });
    }

    // Soft delete: marcar como no disponible
    await req.tenantDb.query('UPDATE INGREDIENTS SET is_available = FALSE WHERE ingredient_id = ?', [id]);

    await logAudit(req.tenantDb, req.user.user_id, 'update', 'INGREDIENTS', id, `Ingrediente "${ingredient[0].name}" desactivado (soft delete)`);
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
    const [ingredient] = await req.tenantDb.query('SELECT name FROM INGREDIENTS WHERE ingredient_id = ?', [id]);
    if (ingredient.length === 0) {
      return res.status(404).json({ message: 'Ingrediente no encontrado' });
    }

    // Reactivar: marcar como disponible
    await req.tenantDb.query('UPDATE INGREDIENTS SET is_available = TRUE WHERE ingredient_id = ?', [id]);

    await logAudit(req.tenantDb, req.user.user_id, 'update', 'INGREDIENTS', id, `Ingrediente "${ingredient[0].name}" reactivado`);
    res.json({ message: 'Ingrediente reactivado correctamente' });
  } catch (error) {
    console.error('Error al reactivar ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /ingredients/:id/suppliers - Obtener proveedores de un ingrediente
router.get('/:id/suppliers', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id } = req.params;

  try {
    const [suppliers] = await req.tenantDb.query(`
      SELECT 
        si.supplier_id,
        s.name as supplier_name,
        si.price,
        si.delivery_time,
        si.is_preferred_supplier,
        si.package_size,
        si.package_unit,
        si.minimum_order_quantity
      FROM SUPPLIER_INGREDIENTS si
      JOIN SUPPLIERS s ON si.supplier_id = s.supplier_id
      WHERE si.ingredient_id = ?
      ORDER BY si.is_preferred_supplier DESC, s.name
    `, [id]);

    res.json(suppliers);
  } catch (error) {
    console.error('Error al obtener proveedores del ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /ingredients/:id/suppliers - Añadir proveedor a un ingrediente
router.post('/:id/suppliers', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id } = req.params;
  const { 
    supplier_id, 
    price = 0, 
    delivery_time = null, 
    is_preferred_supplier = false,
    package_size = 1,
    package_unit = 'unidad',
    minimum_order_quantity = 1
  } = req.body;

  if (!supplier_id) {
    return res.status(400).json({ message: 'ID del proveedor es obligatorio' });
  }

  try {
    // Verificar que el ingrediente existe
    const [ingredient] = await req.tenantDb.query('SELECT name FROM INGREDIENTS WHERE ingredient_id = ?', [id]);
    if (ingredient.length === 0) {
      return res.status(404).json({ message: 'Ingrediente no encontrado' });
    }

    // Verificar que el proveedor existe
    const [supplier] = await req.tenantDb.query('SELECT name FROM SUPPLIERS WHERE supplier_id = ?', [supplier_id]);
    if (supplier.length === 0) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }

    // Verificar que la relación no existe ya
    const [existing] = await req.tenantDb.query(
      'SELECT * FROM SUPPLIER_INGREDIENTS WHERE ingredient_id = ? AND supplier_id = ?',
      [id, supplier_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Este proveedor ya está asignado al ingrediente' });
    }

    // Añadir la relación
    await req.tenantDb.query(`
      INSERT INTO SUPPLIER_INGREDIENTS (
        ingredient_id, supplier_id, price, delivery_time, 
        is_preferred_supplier, package_size, package_unit, minimum_order_quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, supplier_id, price, delivery_time, is_preferred_supplier, package_size, package_unit, minimum_order_quantity]);

    await logAudit(req.tenantDb, req.user.user_id, 'create', 'SUPPLIER_INGREDIENTS', null, 
      `Proveedor "${supplier[0].name}" añadido al ingrediente "${ingredient[0].name}"`);

    res.status(201).json({ message: 'Proveedor añadido correctamente' });
  } catch (error) {
    console.error('Error al añadir proveedor al ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /ingredients/:id/suppliers/:supplier_id - Actualizar relación ingrediente-proveedor
router.put('/:id/suppliers/:supplier_id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id, supplier_id } = req.params;
  const { 
    price, 
    delivery_time, 
    is_preferred_supplier,
    package_size,
    package_unit,
    minimum_order_quantity
  } = req.body;

  try {
    // Verificar que la relación existe
    const [existing] = await req.tenantDb.query(
      'SELECT * FROM SUPPLIER_INGREDIENTS WHERE ingredient_id = ? AND supplier_id = ?',
      [id, supplier_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Relación ingrediente-proveedor no encontrada' });
    }

    // Si se está marcando como preferido, desmarcar otros proveedores preferidos del mismo ingrediente
    if (is_preferred_supplier === true) {
      await req.tenantDb.query(
        'UPDATE SUPPLIER_INGREDIENTS SET is_preferred_supplier = FALSE WHERE ingredient_id = ? AND supplier_id != ?',
        [id, supplier_id]
      );
    }

    // Construir la consulta de actualización dinámicamente
    const updates = [];
    const values = [];
    
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }
    if (delivery_time !== undefined) {
      updates.push('delivery_time = ?');
      values.push(delivery_time);
    }
    if (is_preferred_supplier !== undefined) {
      updates.push('is_preferred_supplier = ?');
      values.push(is_preferred_supplier);
    }
    if (package_size !== undefined) {
      updates.push('package_size = ?');
      values.push(package_size);
    }
    if (package_unit !== undefined) {
      updates.push('package_unit = ?');
      values.push(package_unit);
    }
    if (minimum_order_quantity !== undefined) {
      updates.push('minimum_order_quantity = ?');
      values.push(minimum_order_quantity);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No hay campos para actualizar' });
    }

    values.push(id, supplier_id);

    await req.tenantDb.query(
      `UPDATE SUPPLIER_INGREDIENTS SET ${updates.join(', ')} WHERE ingredient_id = ? AND supplier_id = ?`,
      values
    );

    await logAudit(req.tenantDb, req.user.user_id, 'update', 'SUPPLIER_INGREDIENTS', null, 
      `Relación ingrediente-proveedor actualizada: ingrediente ${id}, proveedor ${supplier_id}`);

    res.json({ message: 'Relación actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar relación ingrediente-proveedor:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// DELETE /ingredients/:id/suppliers/:supplier_id - Eliminar proveedor de un ingrediente
router.delete('/:id/suppliers/:supplier_id', authenticateToken, authorizeRoles('admin', 'chef'), async (req, res) => {
  const { id, supplier_id } = req.params;

  try {
    // Verificar que la relación existe
    const [existing] = await req.tenantDb.query(
      'SELECT * FROM SUPPLIER_INGREDIENTS WHERE ingredient_id = ? AND supplier_id = ?',
      [id, supplier_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Relación ingrediente-proveedor no encontrada' });
    }

    // Eliminar la relación
    await req.tenantDb.query(
      'DELETE FROM SUPPLIER_INGREDIENTS WHERE ingredient_id = ? AND supplier_id = ?',
      [id, supplier_id]
    );

    await logAudit(req.tenantDb, req.user.user_id, 'delete', 'SUPPLIER_INGREDIENTS', null, 
      `Proveedor eliminado del ingrediente: ingrediente ${id}, proveedor ${supplier_id}`);

    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proveedor del ingrediente:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /ingredients/seasonal/all - Todos los ingredientes estacionales
router.get('/seasonal/all', authenticateToken, authorizeRoles('admin', 'chef', 'inventory_manager'), async (req, res) => {
  try {
    const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' });
    const [seasonalRows] = await req.tenantDb.query(`
      SELECT 
        i.ingredient_id, 
        i.name, 
        i.season, 
        i.stock, 
        i.unit, 
        i.base_price, 
        i.net_price, 
        i.is_available,
        si.price as preferred_supplier_price
      FROM INGREDIENTS i
      LEFT JOIN SUPPLIER_INGREDIENTS si ON i.ingredient_id = si.ingredient_id AND si.is_preferred_supplier = TRUE
      WHERE i.season IS NOT NULL 
        AND i.season != ''
        AND i.season != 'todo_año'
        AND i.season != 'todo el año'
        AND i.is_available = TRUE
        AND i.season LIKE ?
      ORDER BY i.stock DESC, i.name ASC
    `, [`%${currentMonth}%`]);

    res.json(seasonalRows);
  } catch (error) {
    console.error('Error fetching all seasonal ingredients:', error);
    res.status(500).json({ message: 'Error al obtener ingredientes estacionales' });
  }
});

// GET /ingredients/low-stock/all - Todos los ingredientes en stock crítico (CONSULTA OPTIMIZADA)
router.get('/low-stock/all', authenticateToken, authorizeRoles('admin', 'chef', 'inventory_manager'), async (req, res) => {
  try {
    const [lowStockRows] = await req.tenantDb.query(`
      SELECT ingredient_id, name, stock, stock_minimum, unit, 
             base_price, net_price, is_available,
             (stock_minimum - stock) as deficit
      FROM INGREDIENTS
      WHERE is_available = TRUE 
        AND stock < stock_minimum 
        AND stock_minimum > 0
      ORDER BY (stock_minimum - stock) DESC, name ASC
    `);

    res.json(lowStockRows);
  } catch (error) {
    console.error('Error fetching all low stock ingredients:', error);
    res.status(500).json({ message: 'Error al obtener ingredientes en stock crítico' });
  }
});

// GET /ingredients/expiring/all - Todos los ingredientes próximos a caducar
router.get('/expiring/all', authenticateToken, authorizeRoles('admin', 'chef', 'inventory_manager'), async (req, res) => {
  try {
    const [expiringRows] = await req.tenantDb.query(`
      SELECT ingredient_id, name, expiration_date, stock, unit,
             DATEDIFF(expiration_date, CURDATE()) as days_until_expiry,
             is_available
      FROM INGREDIENTS 
      WHERE is_available = TRUE 
        AND expiration_date IS NOT NULL 
        AND expiration_date BETWEEN CURDATE() - INTERVAL 5 DAY AND DATE_ADD(CURDATE(), INTERVAL 15 DAY)
        AND stock > 0
      ORDER BY DATEDIFF(expiration_date, CURDATE()) ASC, name ASC
    `);

    res.json(expiringRows);
  } catch (error) {
    console.error('Error fetching all expiring ingredients:', error);
    res.status(500).json({ message: 'Error al obtener ingredientes próximos a caducar' });
  }
});

module.exports = router;