// routes/data.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const backupManager = require('../utils/backupManager');

// Asegurar que existe la carpeta uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer para manejo de archivos
const upload = multer({ 
  dest: uploadsDir,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/json' ||
        file.originalname.endsWith('.csv') ||
        file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV y JSON'));
    }
  }
});

// Multi-tenant: usar req.tenantDb en lugar de pool estático

// ===== EXPORTACIÓN DE DATOS =====

// GET /data/export/recipes - Exportar recetas
router.get('/export/recipes', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    // Consulta completa de recetas con cálculo de costo en tiempo real
    const [recipes] = await req.tenantDb.execute(`
      SELECT 
        r.recipe_id,
        r.name,
        r.servings,
        r.production_servings,
        r.cost_per_serving as stored_cost_per_serving,
        COALESCE(
          SUM((ri.quantity_per_serving * i.base_price * (1 + COALESCE(i.waste_percent, 0)))), 
          r.cost_per_serving, 
          0
        ) as calculated_cost_per_serving,
        r.net_price,
        r.prep_time,
        r.difficulty,
        r.instructions,
        r.created_at,
        GROUP_CONCAT(DISTINCT rc.name SEPARATOR '; ') as categories,
        GROUP_CONCAT(
          CONCAT(i.name, ':', ri.quantity_per_serving, ' ', i.unit) 
          SEPARATOR '; '
        ) as ingredients
      FROM RECIPES r
      LEFT JOIN RECIPE_INGREDIENTS ri ON r.recipe_id = ri.recipe_id
      LEFT JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
      LEFT JOIN RECIPE_CATEGORY_ASSIGNMENTS rca ON r.recipe_id = rca.recipe_id
      LEFT JOIN RECIPE_CATEGORIES rc ON rca.category_id = rc.category_id
      GROUP BY r.recipe_id, r.name, r.servings, r.production_servings, r.cost_per_serving, r.net_price, r.prep_time, r.difficulty, r.instructions, r.created_at
      ORDER BY r.name
    `);

    // Debug: Log para comparar costos almacenados vs calculados
    console.log('📊 DEBUG: Comparación de costos (primeras 3 recetas):');
    recipes.slice(0, 3).forEach(recipe => {
      console.log(`- ${recipe.name}:`);
      console.log(`  Almacenado: ${recipe.stored_cost_per_serving}`);
      console.log(`  Calculado: ${recipe.calculated_cost_per_serving}`);
    });

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=recipes.json');
      
      // Usar el costo calculado para JSON también
      const recipesWithCalculatedCost = recipes.map(recipe => ({
        ...recipe,
        cost_per_serving: recipe.calculated_cost_per_serving
      }));
      
      res.json(recipesWithCalculatedCost);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=recipes.csv');
      
      const csvHeader = 'ID,Nombre,Porciones_Produccion,Precio_Neto,Tiempo_Prep,Dificultad,Categorias,Preparacion,Ingredientes\n';
      const csvData = recipes.map(recipe => {
        const netPrice = recipe.net_price ? Number(recipe.net_price).toFixed(2) : '0.00';
        const categories = recipe.categories || '';
        const instructions = recipe.instructions || '';
        // Escapar comillas dobles en el texto de preparación
        const safeInstructions = instructions.replace(/"/g, '""');
        return `${recipe.recipe_id},"${recipe.name}",${recipe.production_servings},${netPrice},${recipe.prep_time || 0},"${recipe.difficulty}","${categories}","${safeInstructions}","${recipe.ingredients || ''}"`;
      }).join('\n');
      
      res.send(csvHeader + csvData);
    } else {
      res.status(400).json({ message: 'Formato no soportado' });
    }
    
  } catch (error) {
    console.error('Error exportando recetas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /data/export/ingredients - Exportar ingredientes
router.get('/export/ingredients', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const [ingredients] = await req.tenantDb.execute(`
      SELECT 
        i.ingredient_id,
        i.name,
        i.unit,
        i.base_price,
        i.waste_percent,
        i.stock,
        i.stock_minimum,
        i.season,
        i.expiration_date,
        i.is_available,
        i.comment,
        i.calories_per_100g,
        i.protein_per_100g,
        i.carbs_per_100g,
        i.fat_per_100g,
        GROUP_CONCAT(DISTINCT ic.name SEPARATOR '; ') as categories,
        GROUP_CONCAT(DISTINCT a.name SEPARATOR '; ') as allergens,
        (SELECT s.name 
         FROM SUPPLIERS s 
         JOIN SUPPLIER_INGREDIENTS si ON s.supplier_id = si.supplier_id 
         WHERE si.ingredient_id = i.ingredient_id 
         AND si.is_preferred_supplier = TRUE 
         LIMIT 1) as preferred_supplier
      FROM INGREDIENTS i
      LEFT JOIN INGREDIENT_CATEGORY_ASSIGNMENTS ica ON i.ingredient_id = ica.ingredient_id
      LEFT JOIN INGREDIENT_CATEGORIES ic ON ica.category_id = ic.category_id
      LEFT JOIN INGREDIENT_ALLERGENS ia ON i.ingredient_id = ia.ingredient_id
      LEFT JOIN ALLERGENS a ON ia.allergen_id = a.allergen_id
      GROUP BY i.ingredient_id
      ORDER BY i.name
    `);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=ingredients.json');
      res.json(ingredients);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=ingredients.csv');
      
      const csvHeader = 'ID,Nombre,Unidad,Precio_Base,Porcentaje_Merma,Stock,Stock_Minimo,Temporada,Fecha_Caducidad,Disponible,Comentario,Calorias,Proteinas,Carbohidratos,Grasas,Categoria,Alergenos,Proveedor_Preferido\n';
      const csvData = ingredients.map(ingredient => {
        // Formatear fecha de caducidad
        const expirationDate = ingredient.expiration_date ? 
          new Date(ingredient.expiration_date).toISOString().split('T')[0] : '';
        
        // Limpiar valores null/undefined
        const cleanValue = (value) => value === null || value === undefined ? '' : value;
        
        return `${ingredient.ingredient_id},"${ingredient.name}","${ingredient.unit}",${ingredient.base_price},${cleanValue(ingredient.waste_percent)},${ingredient.stock},${ingredient.stock_minimum},"${cleanValue(ingredient.season)}","${expirationDate}",${ingredient.is_available ? 'Si' : 'No'},"${cleanValue(ingredient.comment)}",${cleanValue(ingredient.calories_per_100g)},${cleanValue(ingredient.protein_per_100g)},${cleanValue(ingredient.carbs_per_100g)},${cleanValue(ingredient.fat_per_100g)},"${cleanValue(ingredient.categories)}","${cleanValue(ingredient.allergens)}","${cleanValue(ingredient.preferred_supplier)}"`;
      }).join('\n');
      
      res.send(csvHeader + csvData);
    } else {
      res.status(400).json({ message: 'Formato no soportado' });
    }
    
  } catch (error) {
    console.error('Error exportando ingredientes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /data/export/suppliers - Exportar proveedores
router.get('/export/suppliers', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const [suppliers] = await req.tenantDb.execute(`
      SELECT 
        supplier_id,
        name,
        phone,
        email,
        website_url,
        address
      FROM SUPPLIERS
      ORDER BY name
    `);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=suppliers.json');
      res.json(suppliers);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=suppliers.csv');
      
      const csvHeader = 'ID,Nombre,Telefono,Email,Sitio_Web,Direccion\n';
      const csvData = suppliers.map(supplier => 
        `${supplier.supplier_id},"${supplier.name}","${supplier.phone || ''}","${supplier.email || ''}","${supplier.website_url || ''}","${supplier.address || ''}"`
      ).join('\n');
      
      res.send(csvHeader + csvData);
    } else {
      res.status(400).json({ message: 'Formato no soportado' });
    }
    
  } catch (error) {
    console.error('Error exportando proveedores:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /data/export/events - Exportar eventos
router.get('/export/events', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const [events] = await req.tenantDb.execute(`
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
        e.created_at,
        e.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) as created_by_name,
        GROUP_CONCAT(
          CONCAT(r.name, ':', em.portions, ' ', em.course_type) 
          SEPARATOR '; '
        ) as menu_items
      FROM EVENTS e
      LEFT JOIN USERS u ON e.created_by_user_id = u.user_id
      LEFT JOIN EVENT_MENUS em ON e.event_id = em.event_id
      LEFT JOIN RECIPES r ON em.recipe_id = r.recipe_id
      GROUP BY e.event_id, e.name, e.description, e.event_date, e.event_time, 
               e.guests_count, e.location, e.status, e.budget, e.notes, 
               e.created_at, e.updated_at, u.first_name, u.last_name
      ORDER BY e.event_date DESC
    `);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=events.json');
      res.json(events);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=events.csv');
      
      const csvHeader = 'ID,Nombre,Descripcion,Fecha_Evento,Hora_Evento,Numero_Invitados,Ubicacion,Estado,Presupuesto,Notas,Creado_Por,Menu_Items\n';
      const csvData = events.map(event => {
        const eventDate = event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : '';
        const eventTime = event.event_time || '';
        const description = (event.description || '').replace(/"/g, '""');
        const location = (event.location || '').replace(/"/g, '""');
        const notes = (event.notes || '').replace(/"/g, '""');
        const createdBy = (event.created_by_name || '').replace(/"/g, '""');
        const menuItems = (event.menu_items || '').replace(/"/g, '""');
        const budget = event.budget ? Number(event.budget).toFixed(2) : '0.00';
        
        return `${event.event_id},"${event.name}","${description}","${eventDate}","${eventTime}",${event.guests_count},"${location}","${event.status}",${budget},"${notes}","${createdBy}","${menuItems}"`;
      }).join('\n');
      
      res.send(csvHeader + csvData);
    } else {
      res.status(400).json({ message: 'Formato no soportado' });
    }
    
  } catch (error) {
    console.error('Error exportando eventos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /data/export/users - Exportar usuarios
router.get('/export/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const [users] = await req.tenantDb.execute(`
      SELECT 
        user_id,
        first_name,
        last_name,
        email,
        role,
        is_active,
        language,
        timezone
      FROM USERS
      ORDER BY last_name, first_name
    `);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=users.json');
      res.json(users);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      
      const csvHeader = 'ID,Nombre,Apellido,Email,Rol,Activo,Idioma,Zona_Horaria\n';
      const csvData = users.map(user => {
        const firstName = (user.first_name || '').replace(/"/g, '""');
        const lastName = (user.last_name || '').replace(/"/g, '""');
        const language = user.language || 'es';
        const timezone = user.timezone || 'Europe/Madrid';
        
        return `${user.user_id},"${firstName}","${lastName}","${user.email}","${user.role}",${user.is_active ? 'Si' : 'No'},"${language}","${timezone}"`;
      }).join('\n');
      
      res.send(csvHeader + csvData);
    } else {
      res.status(400).json({ message: 'Formato no soportado' });
    }
    
  } catch (error) {
    console.error('Error exportando usuarios:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ===== IMPORTACIÓN DE DATOS =====

// POST /data/import/recipes - Importar recetas
router.post('/import/recipes', authenticateToken, authorizeRoles('admin'), upload.single('file'), async (req, res) => {
  let uploadedFile = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }
    
    uploadedFile = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    let recipesData = [];
    
    // Procesar archivo según formato
    if (fileExtension === 'json') {
      const fileContent = fs.readFileSync(uploadedFile, 'utf8');
      recipesData = JSON.parse(fileContent);
      if (!Array.isArray(recipesData)) {
        return res.status(400).json({ message: 'El archivo JSON debe contener un array de recetas' });
      }
    } else if (fileExtension === 'csv') {
      recipesData = await parseCSVFile(uploadedFile);
    } else {
      return res.status(400).json({ message: 'Formato de archivo no soportado. Use CSV o JSON.' });
    }
    
    // Validar que hay datos
    if (!recipesData || recipesData.length === 0) {
      return res.status(400).json({ message: 'El archivo está vacío o no contiene recetas válidas' });
    }
    
    // Procesar importación
    const result = await importRecipes(req.tenantDb, recipesData, req.user.user_id);
    
    // Registrar en audit logs
    await req.tenantDb.execute(
      'INSERT INTO AUDIT_LOGS (user_id, action, table_name, description, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [req.user.user_id, 'import', 'RECIPES', `Importación de recetas: ${result.imported} importadas, ${result.updated} actualizadas, ${result.errors} errores`]
    );
    
    res.json({
      message: 'Importación completada',
      imported: result.imported,
      updated: result.updated,
      errors: result.errors,
      errorDetails: result.errorDetails.slice(0, 10) // Limitar errores mostrados
    });
    
  } catch (error) {
    console.error('Error importando recetas:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      details: error.message 
    });
  } finally {
    // Limpiar archivo temporal
    if (uploadedFile && fs.existsSync(uploadedFile)) {
      fs.unlinkSync(uploadedFile);
    }
  }
});

// POST /data/import/ingredients - Importar ingredientes
router.post('/import/ingredients', authenticateToken, authorizeRoles('admin'), upload.single('file'), async (req, res) => {
  let uploadedFile = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }
    
    uploadedFile = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    let ingredientsData = [];
    
    // Procesar archivo según formato
    if (fileExtension === 'json') {
      const fileContent = fs.readFileSync(uploadedFile, 'utf8');
      ingredientsData = JSON.parse(fileContent);
      if (!Array.isArray(ingredientsData)) {
        return res.status(400).json({ message: 'El archivo JSON debe contener un array de ingredientes' });
      }
    } else if (fileExtension === 'csv') {
      ingredientsData = await parseCSVFile(uploadedFile);
    } else {
      return res.status(400).json({ message: 'Formato de archivo no soportado. Use CSV o JSON.' });
    }
    
    // Validar que hay datos
    if (!ingredientsData || ingredientsData.length === 0) {
      return res.status(400).json({ message: 'El archivo está vacío o no contiene ingredientes válidos' });
    }
    
    // Procesar importación
    const result = await importIngredients(req.tenantDb, ingredientsData, req.user.user_id);
    
    // Registrar en audit logs
    await req.tenantDb.execute(
      'INSERT INTO AUDIT_LOGS (user_id, action, table_name, description, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [req.user.user_id, 'import', 'INGREDIENTS', `Importación de ingredientes: ${result.imported} importados, ${result.updated} actualizados, ${result.errors} errores`]
    );
    
    res.json({
      message: 'Importación completada',
      imported: result.imported,
      updated: result.updated,
      errors: result.errors,
      errorDetails: result.errorDetails.slice(0, 10) // Limitar errores mostrados
    });
    
  } catch (error) {
    console.error('Error importando ingredientes:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      details: error.message 
    });
  } finally {
    // Limpiar archivo temporal
    if (uploadedFile && fs.existsSync(uploadedFile)) {
      fs.unlinkSync(uploadedFile);
    }
  }
});

// POST /data/import/suppliers - Importar proveedores
router.post('/import/suppliers', authenticateToken, authorizeRoles('admin'), upload.single('file'), async (req, res) => {
  let uploadedFile = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }
    
    uploadedFile = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    let suppliersData = [];
    
    // Procesar archivo según formato
    if (fileExtension === 'json') {
      const fileContent = fs.readFileSync(uploadedFile, 'utf8');
      suppliersData = JSON.parse(fileContent);
      if (!Array.isArray(suppliersData)) {
        return res.status(400).json({ message: 'El archivo JSON debe contener un array de proveedores' });
      }
    } else if (fileExtension === 'csv') {
      suppliersData = await parseCSVFile(uploadedFile);
    } else {
      return res.status(400).json({ message: 'Formato de archivo no soportado. Use CSV o JSON.' });
    }
    
    // Validar que hay datos
    if (!suppliersData || suppliersData.length === 0) {
      return res.status(400).json({ message: 'El archivo está vacío o no contiene proveedores válidos' });
    }
    
    // Procesar importación
    const result = await importSuppliers(req.tenantDb, suppliersData, req.user.user_id);
    
    // Registrar en audit logs
    await req.tenantDb.execute(
      'INSERT INTO AUDIT_LOGS (user_id, action, table_name, description, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [req.user.user_id, 'import', 'SUPPLIERS', `Importación de proveedores: ${result.imported} importados, ${result.updated} actualizados, ${result.errors} errores`]
    );
    
    res.json({
      message: 'Importación completada',
      imported: result.imported,
      updated: result.updated,
      errors: result.errors,
      errorDetails: result.errorDetails.slice(0, 10) // Limitar errores mostrados
    });
    
  } catch (error) {
    console.error('Error importando proveedores:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      details: error.message 
    });
  } finally {
    // Limpiar archivo temporal
    if (uploadedFile && fs.existsSync(uploadedFile)) {
      fs.unlinkSync(uploadedFile);
    }
  }
});

// POST /data/import/users - Importar usuarios
router.post('/import/users', authenticateToken, authorizeRoles('admin'), upload.single('file'), async (req, res) => {
  let uploadedFile = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }
    
    uploadedFile = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    let usersData = [];
    
    // Procesar archivo según formato
    if (fileExtension === 'json') {
      const fileContent = fs.readFileSync(uploadedFile, 'utf8');
      usersData = JSON.parse(fileContent);
      if (!Array.isArray(usersData)) {
        return res.status(400).json({ message: 'El archivo JSON debe contener un array de usuarios' });
      }
    } else if (fileExtension === 'csv') {
      usersData = await parseCSVFile(uploadedFile);
    } else {
      return res.status(400).json({ message: 'Formato de archivo no soportado. Use CSV o JSON.' });
    }
    
    // Validar que hay datos
    if (!usersData || usersData.length === 0) {
      return res.status(400).json({ message: 'El archivo está vacío o no contiene usuarios válidos' });
    }
    
    // Procesar importación
    const result = await importUsers(req.tenantDb, usersData, req.user.user_id);
    
    // Registrar en audit logs
    await req.tenantDb.execute(
      'INSERT INTO AUDIT_LOGS (user_id, action, table_name, description, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [req.user.user_id, 'import', 'USERS', `Importación de usuarios: ${result.imported} importados, ${result.updated} actualizados, ${result.errors} errores`]
    );
    
    res.json({
      message: 'Importación completada',
      imported: result.imported,
      updated: result.updated,
      errors: result.errors,
      errorDetails: result.errorDetails.slice(0, 10) // Limitar errores mostrados
    });
    
  } catch (error) {
    console.error('Error importando usuarios:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      details: error.message 
    });
  } finally {
    // Limpiar archivo temporal
    if (uploadedFile && fs.existsSync(uploadedFile)) {
      fs.unlinkSync(uploadedFile);
    }
  }
});

// POST /data/import/events - Importar eventos
router.post('/import/events', authenticateToken, authorizeRoles('admin'), upload.single('file'), async (req, res) => {
  let uploadedFile = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }
    
    uploadedFile = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    let eventsData = [];
    
    // Procesar archivo según formato
    if (fileExtension === 'json') {
      const fileContent = fs.readFileSync(uploadedFile, 'utf8');
      eventsData = JSON.parse(fileContent);
      if (!Array.isArray(eventsData)) {
        return res.status(400).json({ message: 'El archivo JSON debe contener un array de eventos' });
      }
    } else if (fileExtension === 'csv') {
      eventsData = await parseCSVFile(uploadedFile);
    } else {
      return res.status(400).json({ message: 'Formato de archivo no soportado. Use CSV o JSON.' });
    }
    
    // Validar que hay datos
    if (!eventsData || eventsData.length === 0) {
      return res.status(400).json({ message: 'El archivo está vacío o no contiene eventos válidos' });
    }
    
    // Procesar importación
    const result = await importEvents(req.tenantDb, eventsData, req.user.user_id);
    
    // Registrar en audit logs
    await req.tenantDb.execute(
      'INSERT INTO AUDIT_LOGS (user_id, action, table_name, description, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [req.user.user_id, 'import', 'EVENTS', `Importación de eventos: ${result.imported} importados, ${result.updated} actualizados, ${result.errors} errores`]
    );
    
    res.json({
      message: 'Importación completada',
      imported: result.imported,
      updated: result.updated,
      errors: result.errors,
      errorDetails: result.errorDetails.slice(0, 10) // Limitar errores mostrados
    });
    
  } catch (error) {
    console.error('Error importando eventos:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      details: error.message 
    });
  } finally {
    // Limpiar archivo temporal
    if (uploadedFile && fs.existsSync(uploadedFile)) {
      fs.unlinkSync(uploadedFile);
    }
  }
});

// POST /data/import/backup - Restaurar backup completo
router.post('/import/backup', authenticateToken, authorizeRoles('admin'), upload.single('file'), async (req, res) => {
  let uploadedFile = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo' });
    }
    
    uploadedFile = req.file.path;
    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    
    // Solo acepta archivos JSON para backup
    if (fileExtension !== 'json') {
      return res.status(400).json({ message: 'Solo se permiten archivos JSON para restaurar backup' });
    }
    
    let backupData = {};
    
    // Procesar archivo JSON
    const fileContent = fs.readFileSync(uploadedFile, 'utf8');
    backupData = JSON.parse(fileContent);
    
    // Validar estructura del backup
    if (!backupData.metadata || !backupData.data) {
      return res.status(400).json({ message: 'Archivo de backup inválido. Falta metadata o data.' });
    }
    
    if (!backupData.metadata.version || !backupData.metadata.tables) {
      return res.status(400).json({ message: 'Archivo de backup inválido. Metadata incompleta.' });
    }
    
    // Procesar restauración
    const result = await restoreBackup(req.tenantDb, backupData, req.user.user_id);
    
    // Registrar en audit logs
    await req.tenantDb.execute(
      'INSERT INTO AUDIT_LOGS (user_id, action, table_name, description, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [req.user.user_id, 'import', 'SYSTEM', `Restauración de backup: ${result.restored} tablas restauradas, ${result.errors} errores`]
    );
    
    res.json({
      message: 'Restauración de backup completada',
      restored: result.restored,
      errors: result.errors,
      errorDetails: result.errorDetails.slice(0, 10), // Limitar errores mostrados
      tablesProcessed: result.tablesProcessed
    });
    
  } catch (error) {
    console.error('Error restaurando backup:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      details: error.message 
    });
  } finally {
    // Limpiar archivo temporal
    if (uploadedFile && fs.existsSync(uploadedFile)) {
      fs.unlinkSync(uploadedFile);
    }
  }
});

// Función helper para parsear CSV
async function parseCSVFile(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

// Función principal de importación
async function importIngredients(tenantDb, ingredientsData, userId) {
  const connection = await tenantDb.getConnection();
  await connection.beginTransaction();
  
  const result = {
    imported: 0,
    updated: 0,
    errors: 0,
    errorDetails: []
  };
  
  try {
    for (let i = 0; i < ingredientsData.length; i++) {
      const ingredient = ingredientsData[i];
      
      try {
        // Validar campos obligatorios
        if (!ingredient.Nombre || !ingredient.Unidad || !ingredient.Precio_Base) {
          throw new Error('Faltan campos obligatorios: Nombre, Unidad, Precio_Base');
        }
        
        // Validar unidad
        const validUnits = ['gr', 'kg', 'ml', 'l', 'unit', 'tbsp', 'tsp'];
        if (!validUnits.includes(ingredient.Unidad)) {
          throw new Error(`Unidad inválida: ${ingredient.Unidad}. Valores permitidos: ${validUnits.join(', ')}`);
        }
        
        // Preparar datos del ingrediente
        const ingredientData = {
          name: ingredient.Nombre.trim(),
          unit: ingredient.Unidad,
          base_price: parseFloat(ingredient.Precio_Base) || 0,
          waste_percent: parseFloat(ingredient.Porcentaje_Merma) || 0,
          stock: parseFloat(ingredient.Stock) || 0,
          stock_minimum: parseFloat(ingredient.Stock_Minimo) || 0,
          season: ingredient.Temporada || null,
          expiration_date: ingredient.Fecha_Caducidad ? parseDate(ingredient.Fecha_Caducidad) : null,
          is_available: ingredient.Disponible === 'Si' || ingredient.Disponible === true || ingredient.Disponible === 1,
          comment: ingredient.Comentario || null,
          calories_per_100g: parseFloat(ingredient.Calorias) || 0,
          protein_per_100g: parseFloat(ingredient.Proteinas) || 0,
          carbs_per_100g: parseFloat(ingredient.Carbohidratos) || 0,
          fat_per_100g: parseFloat(ingredient.Grasas) || 0
        };
        
        // Verificar si el ingrediente ya existe
        const [existingIngredient] = await connection.execute(
          'SELECT ingredient_id FROM INGREDIENTS WHERE name = ?',
          [ingredientData.name]
        );
        
        let ingredientId;
        
        if (existingIngredient.length > 0) {
          // Actualizar ingrediente existente
          ingredientId = existingIngredient[0].ingredient_id;
          
          await connection.execute(`
            UPDATE INGREDIENTS SET 
              unit = ?, base_price = ?, waste_percent = ?, stock = ?, 
              stock_minimum = ?, season = ?, expiration_date = ?, 
              is_available = ?, comment = ?, calories_per_100g = ?, 
              protein_per_100g = ?, carbs_per_100g = ?, fat_per_100g = ?
            WHERE ingredient_id = ?
          `, [
            ingredientData.unit, ingredientData.base_price, ingredientData.waste_percent,
            ingredientData.stock, ingredientData.stock_minimum, ingredientData.season,
            ingredientData.expiration_date, ingredientData.is_available, ingredientData.comment,
            ingredientData.calories_per_100g, ingredientData.protein_per_100g,
            ingredientData.carbs_per_100g, ingredientData.fat_per_100g, ingredientId
          ]);
          
          result.updated++;
        } else {
          // Insertar nuevo ingrediente
          const [insertResult] = await connection.execute(`
            INSERT INTO INGREDIENTS (
              name, unit, base_price, waste_percent, stock, stock_minimum, 
              season, expiration_date, is_available, comment, 
              calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            ingredientData.name, ingredientData.unit, ingredientData.base_price,
            ingredientData.waste_percent, ingredientData.stock, ingredientData.stock_minimum,
            ingredientData.season, ingredientData.expiration_date, ingredientData.is_available,
            ingredientData.comment, ingredientData.calories_per_100g, ingredientData.protein_per_100g,
            ingredientData.carbs_per_100g, ingredientData.fat_per_100g
          ]);
          
          ingredientId = insertResult.insertId;
          result.imported++;
        }
        
        // Procesar relaciones
        await processIngredientRelations(connection, ingredientId, ingredient);
        
      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          row: i + 1,
          ingredient: ingredient.Nombre || 'Desconocido',
          error: error.message
        });
        console.error(`Error procesando ingrediente en fila ${i + 1}:`, error.message);
      }
    }
    
    await connection.commit();
    return result;
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Función para procesar relaciones del ingrediente
async function processIngredientRelations(connection, ingredientId, ingredient) {
  // Procesar categorías
  if (ingredient.Categoria && ingredient.Categoria.trim()) {
    const categories = ingredient.Categoria.split(';').map(cat => cat.trim()).filter(cat => cat);
    
    // Limpiar categorías existentes
    await connection.execute(
      'DELETE FROM INGREDIENT_CATEGORY_ASSIGNMENTS WHERE ingredient_id = ?',
      [ingredientId]
    );
    
    for (const categoryName of categories) {
      const categoryId = await findOrCreateCategory(connection, categoryName);
      await connection.execute(
        'INSERT IGNORE INTO INGREDIENT_CATEGORY_ASSIGNMENTS (ingredient_id, category_id) VALUES (?, ?)',
        [ingredientId, categoryId]
      );
    }
  }
  
  // Procesar alérgenos
  if (ingredient.Alergenos && ingredient.Alergenos.trim()) {
    const allergens = ingredient.Alergenos.split(';').map(all => all.trim()).filter(all => all);
    
    // Limpiar alérgenos existentes
    await connection.execute(
      'DELETE FROM INGREDIENT_ALLERGENS WHERE ingredient_id = ?',
      [ingredientId]
    );
    
    for (const allergenName of allergens) {
      const allergenId = await findOrCreateAllergen(connection, allergenName);
      await connection.execute(
        'INSERT IGNORE INTO INGREDIENT_ALLERGENS (ingredient_id, allergen_id) VALUES (?, ?)',
        [ingredientId, allergenId]
      );
    }
  }
  
  // Procesar proveedor preferido
  if (ingredient.Proveedor_Preferido && ingredient.Proveedor_Preferido.trim()) {
    const supplierId = await findOrCreateSupplier(connection, ingredient.Proveedor_Preferido.trim());
    
    // Remover otros proveedores preferidos para este ingrediente
    await connection.execute(
      'UPDATE SUPPLIER_INGREDIENTS SET is_preferred_supplier = FALSE WHERE ingredient_id = ?',
      [ingredientId]
    );
    
    // Establecer proveedor preferido
    await connection.execute(`
      INSERT INTO SUPPLIER_INGREDIENTS (supplier_id, ingredient_id, price, is_preferred_supplier, package_size, package_unit, minimum_order_quantity)
      VALUES (?, ?, ?, TRUE, 1.0, 'unidad', 1.0)
      ON DUPLICATE KEY UPDATE is_preferred_supplier = TRUE
    `, [supplierId, ingredientId, ingredient.Precio_Base || 0]);
  }
}

// Funciones helper para encontrar o crear entidades relacionadas
async function findOrCreateCategory(connection, categoryName) {
  const [existing] = await connection.execute(
    'SELECT category_id FROM INGREDIENT_CATEGORIES WHERE name = ?',
    [categoryName]
  );
  
  if (existing.length > 0) {
    return existing[0].category_id;
  }
  
  const [result] = await connection.execute(
    'INSERT INTO INGREDIENT_CATEGORIES (name) VALUES (?)',
    [categoryName]
  );
  
  return result.insertId;
}

async function findOrCreateAllergen(connection, allergenName) {
  const [existing] = await connection.execute(
    'SELECT allergen_id FROM ALLERGENS WHERE name = ?',
    [allergenName]
  );
  
  if (existing.length > 0) {
    return existing[0].allergen_id;
  }
  
  const [result] = await connection.execute(
    'INSERT INTO ALLERGENS (name, severity) VALUES (?, ?)',
    [allergenName, 'medium']
  );
  
  return result.insertId;
}

async function findOrCreateSupplier(connection, supplierName) {
  const [existing] = await connection.execute(
    'SELECT supplier_id FROM SUPPLIERS WHERE name = ?',
    [supplierName]
  );
  
  if (existing.length > 0) {
    return existing[0].supplier_id;
  }
  
  const [result] = await connection.execute(
    'INSERT INTO SUPPLIERS (name, active) VALUES (?, TRUE)',
    [supplierName]
  );
  
  return result.insertId;
}

// Función helper para parsear fechas
function parseDate(dateString) {
  if (!dateString) return null;
  
  // Intentar varios formatos de fecha
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}$/ // DD-MM-YYYY
  ];
  
  for (const format of formats) {
    if (format.test(dateString)) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  
  return null;
}

// Función principal de importación de recetas
async function importRecipes(tenantDb, recipesData, userId) {
  const connection = await tenantDb.getConnection();
  await connection.beginTransaction();
  
  const result = {
    imported: 0,
    updated: 0,
    errors: 0,
    errorDetails: []
  };
  
  try {
    for (let i = 0; i < recipesData.length; i++) {
      const recipe = recipesData[i];
      
      try {
        // Validar campos obligatorios
        if (!recipe.Nombre || !recipe.Porciones_Produccion || !recipe.Precio_Neto) {
          throw new Error('Faltan campos obligatorios: Nombre, Porciones_Produccion, Precio_Neto');
        }
        
        // Validar dificultad
        const validDifficulties = ['easy', 'medium', 'hard'];
        const difficulty = recipe.Dificultad && validDifficulties.includes(recipe.Dificultad.toLowerCase()) 
          ? recipe.Dificultad.toLowerCase() 
          : 'medium';
        
        // Preparar datos de la receta
        const recipeData = {
          name: recipe.Nombre.trim(),
          servings: parseInt(recipe.Porciones_Produccion) || 1, // Usar production_servings como servings base
          production_servings: parseInt(recipe.Porciones_Produccion) || 1,
          net_price: parseFloat(recipe.Precio_Neto) || 0,
          prep_time: parseInt(recipe.Tiempo_Prep) || null,
          difficulty: difficulty,
          instructions: recipe.Preparacion || null
        };
        
        // Verificar si la receta ya existe
        const [existingRecipe] = await connection.execute(
          'SELECT recipe_id FROM RECIPES WHERE name = ?',
          [recipeData.name]
        );
        
        let recipeId;
        
        if (existingRecipe.length > 0) {
          // Actualizar receta existente
          recipeId = existingRecipe[0].recipe_id;
          
          await connection.execute(`
            UPDATE RECIPES SET 
              servings = ?, production_servings = ?, net_price = ?, 
              prep_time = ?, difficulty = ?, instructions = ?
            WHERE recipe_id = ?
          `, [
            recipeData.servings, recipeData.production_servings, recipeData.net_price,
            recipeData.prep_time, recipeData.difficulty, recipeData.instructions,
            recipeId
          ]);
          
          result.updated++;
        } else {
          // Insertar nueva receta
          const [insertResult] = await connection.execute(`
            INSERT INTO RECIPES (
              name, servings, production_servings, net_price, 
              prep_time, difficulty, instructions
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            recipeData.name, recipeData.servings, recipeData.production_servings,
            recipeData.net_price, recipeData.prep_time, recipeData.difficulty,
            recipeData.instructions
          ]);
          
          recipeId = insertResult.insertId;
          result.imported++;
        }
        
        // Procesar categorías
        await processRecipeCategories(connection, recipeId, recipe);
        
        // Procesar ingredientes
        await processRecipeIngredients(connection, recipeId, recipe);
        
      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          row: i + 1,
          recipe: recipe.Nombre || 'Desconocido',
          error: error.message
        });
        console.error(`Error procesando receta en fila ${i + 1}:`, error.message);
      }
    }
    
    await connection.commit();
    return result;
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Función para procesar categorías de recetas
async function processRecipeCategories(connection, recipeId, recipe) {
  // Procesar categorías
  if (recipe.Categorias && recipe.Categorias.trim()) {
    const categories = recipe.Categorias.split(';').map(cat => cat.trim()).filter(cat => cat);
    
    // Limpiar categorías existentes
    await connection.execute(
      'DELETE FROM RECIPE_CATEGORY_ASSIGNMENTS WHERE recipe_id = ?',
      [recipeId]
    );
    
    for (const categoryName of categories) {
      const categoryId = await findOrCreateRecipeCategory(connection, categoryName);
      await connection.execute(
        'INSERT IGNORE INTO RECIPE_CATEGORY_ASSIGNMENTS (recipe_id, category_id) VALUES (?, ?)',
        [recipeId, categoryId]
      );
    }
  }
}

// Función helper para encontrar o crear categorías de recetas
async function findOrCreateRecipeCategory(connection, categoryName) {
  const [existing] = await connection.execute(
    'SELECT category_id FROM RECIPE_CATEGORIES WHERE name = ?',
    [categoryName]
  );
  
  if (existing.length > 0) {
    return existing[0].category_id;
  }
  
  const [result] = await connection.execute(
    'INSERT INTO RECIPE_CATEGORIES (name) VALUES (?)',
    [categoryName]
  );
  
  return result.insertId;
}

// Función para procesar ingredientes de recetas
async function processRecipeIngredients(connection, recipeId, recipe) {
  // Procesar ingredientes
  if (recipe.Ingredientes && recipe.Ingredientes.trim()) {
    // Limpiar ingredientes existentes
    await connection.execute(
      'DELETE FROM RECIPE_INGREDIENTS WHERE recipe_id = ?',
      [recipeId]
    );
    
    // Parse formato: "Arroz:100 gr; Pollo:200 gr; Tomate:300 gr"
    const ingredients = recipe.Ingredientes.split(';').map(ing => ing.trim()).filter(ing => ing);
    
    for (const ingredientStr of ingredients) {
      const parts = ingredientStr.split(':').map(p => p.trim());
      
      if (parts.length >= 2) {
        const ingredientName = parts[0];
        const quantityWithUnit = parts[1];
        
        // Parse cantidad y unidad (ej: "100 gr")
        const quantityMatch = quantityWithUnit.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
        
        if (quantityMatch) {
          const quantity = parseFloat(quantityMatch[1]);
          const unit = quantityMatch[2] || 'unit';
          
          // Buscar o crear ingrediente
          const ingredientId = await findOrCreateIngredient(connection, ingredientName, unit);
          
          // Insertar relación receta-ingrediente
          await connection.execute(
            'INSERT IGNORE INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving) VALUES (?, ?, ?)',
            [recipeId, ingredientId, quantity]
          );
        }
      }
    }
  }
}

// Función helper para encontrar o crear ingredientes
async function findOrCreateIngredient(connection, ingredientName, unit) {
  const [existing] = await connection.execute(
    'SELECT ingredient_id FROM INGREDIENTS WHERE name = ?',
    [ingredientName]
  );
  
  if (existing.length > 0) {
    return existing[0].ingredient_id;
  }
  
  // Crear ingrediente con valores por defecto
  const [result] = await connection.execute(
    'INSERT INTO INGREDIENTS (name, unit, base_price, waste_percent) VALUES (?, ?, ?, ?)',
    [ingredientName, unit, 0.00, 0.0000]
  );
  
  return result.insertId;
}

// ===== BACKUP Y RESTORE =====

// GET /data/backup - Crear backup completo
router.get('/backup', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const tenantId = req.tenant?.tenant_id || req.tenant?.subdomain || 'default';
    
    // Usar BackupManager para crear backup manual
    const result = await backupManager.createAutomaticBackupForTenant(
      req.tenantDb, 
      tenantId, 
      req.user.user_id
    );
    
    if (result.success) {
      res.json({ 
        message: 'Backup creado correctamente',
        filename: result.filename,
        size: result.size,
        tenant_id: result.tenantId
      });
    } else {
      res.status(500).json({ message: 'Error al crear backup' });
    }
    
  } catch (error) {
    console.error('Error creando backup:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /data/backup/status - Obtener estado del backup
router.get('/backup/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Obtener configuración de backup
    const [settings] = await req.tenantDb.execute(`
      SELECT setting_key, setting_value 
      FROM SYSTEM_SETTINGS 
      WHERE setting_key IN ('backup_auto_enabled', 'backup_frequency', 'backup_last_date')
    `);
    
    const backupSettings = {};
    settings.forEach(row => {
      backupSettings[row.setting_key] = row.setting_value;
    });
    
    // Obtener último backup desde audit logs
    const [lastBackup] = await req.tenantDb.execute(`
      SELECT timestamp 
      FROM AUDIT_LOGS 
      WHERE action = 'backup' AND table_name = 'SYSTEM'
      ORDER BY timestamp DESC 
      LIMIT 1
    `);
    
    const autoEnabled = backupSettings.backup_auto_enabled === 'true';
    const frequency = backupSettings.backup_frequency || 'weekly';
    
    // Inicializar scheduler si está habilitado y no está ya corriendo
    const tenantId = req.tenant?.tenant_id || req.tenant?.subdomain || 'default';
    if (autoEnabled) {
      await backupManager.initializeSchedulerForTenant(req.tenantDb, tenantId);
    }
    
    // Obtener estadísticas de backups para el tenant
    const stats = await backupManager.getBackupStatsForTenant(tenantId);
    
    // Calcular próximo backup si está habilitado
    let nextBackup = null;
    if (autoEnabled) {
      nextBackup = calculateNextBackupDate(frequency, tenantId);
    }
    
    res.json({
      auto_enabled: autoEnabled,
      frequency: frequency,
      last_backup: lastBackup[0]?.timestamp || null,
      last_backup_formatted: lastBackup[0]?.timestamp ? 
        new Date(lastBackup[0].timestamp).toLocaleString('es-ES') : 'Nunca',
      next_backup: nextBackup,
      stats: stats
    });
    
  } catch (error) {
    console.error('Error obteniendo estado del backup:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /data/backup/settings - Actualizar configuración de backup
router.put('/backup/settings', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { auto_enabled, frequency } = req.body;
    
    const settings = [
      { key: 'backup_auto_enabled', value: auto_enabled ? 'true' : 'false' },
      { key: 'backup_frequency', value: frequency || 'weekly' }
    ];
    
    // Actualizar configuración
    for (const setting of settings) {
      await req.tenantDb.execute(`
        INSERT INTO SYSTEM_SETTINGS (setting_key, setting_value, updated_at) 
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        setting_value = VALUES(setting_value), 
        updated_at = VALUES(updated_at)
      `, [setting.key, setting.value]);
    }
    
    // Actualizar scheduler del BackupManager para el tenant actual
    const tenantId = req.tenant?.tenant_id || req.tenant?.subdomain || 'default';
    await backupManager.updateSchedulerForTenant(req.tenantDb, tenantId, auto_enabled, frequency);
    
    // Registrar en audit logs
    await req.tenantDb.execute(
      'INSERT INTO AUDIT_LOGS (user_id, action, table_name, description, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [req.user.user_id, 'update', 'SYSTEM_SETTINGS', `Configuración de backup actualizada: auto=${auto_enabled}, frecuencia=${frequency}`]
    );
    
    res.json({ message: 'Configuración de backup actualizada correctamente' });
    
  } catch (error) {
    console.error('Error actualizando configuración de backup:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /data/backup/list - Listar backups almacenados
router.get('/backup/list', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const tenantId = req.tenant?.tenant_id || req.tenant?.subdomain || 'default';
    const backups = await backupManager.listBackupsForTenant(tenantId);
    const stats = await backupManager.getBackupStatsForTenant(tenantId);
    
    res.json({
      backups: backups.map(backup => ({
        filename: backup.filename,
        size: backup.size,
        created_at: backup.created_at,
        formatted_date: backup.created_at.toLocaleString('es-ES'),
        formatted_size: formatBytes(backup.size)
      })),
      stats: {
        ...stats,
        formatted_total_size: formatBytes(stats.total_size)
      }
    });
  } catch (error) {
    console.error('Error listando backups:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /data/backup/download/:filename - Descargar backup específico
router.get('/backup/download/:filename', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = await backupManager.getBackupFile(filename);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.sendFile(filepath);
  } catch (error) {
    console.error('Error descargando backup:', error);
    res.status(404).json({ message: 'Archivo de backup no encontrado' });
  }
});

// DELETE /data/backup/:filename - Eliminar backup específico
router.delete('/backup/:filename', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { filename } = req.params;
    await backupManager.deleteBackup(filename);
    
    // Registrar en audit logs
    await req.tenantDb.execute(
      'INSERT INTO AUDIT_LOGS (user_id, action, table_name, description, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [req.user.user_id, 'delete', 'SYSTEM', `Backup eliminado: ${filename}`]
    );
    
    res.json({ message: 'Backup eliminado correctamente' });
  } catch (error) {
    console.error('Error eliminando backup:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Helper function para formatear bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ===== RESET APPLICATION =====

// POST /data/reset - Restablecer aplicación (PELIGROSO)
router.post('/reset', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { confirm } = req.body;
    
    if (confirm !== 'RESET_APPLICATION') {
      return res.status(400).json({ 
        message: 'Confirmación requerida. Envía { "confirm": "RESET_APPLICATION" }' 
      });
    }
    
    const connection = await req.tenantDb.getConnection();
    await connection.beginTransaction();
    
    try {
      // Registrar la acción antes de eliminar
      await connection.execute(
        'INSERT INTO AUDIT_LOGS (user_id, action, table_name, description, timestamp) VALUES (?, ?, ?, ?, NOW())',
        [req.user.user_id, 'reset', 'SYSTEM', 'Aplicación restablecida completamente']
      );
      
      // Eliminar datos de las tablas principales (en orden correcto debido a FK)
      await connection.execute('DELETE FROM RECIPE_INGREDIENTS');
      await connection.execute('DELETE FROM SUPPLIER_INGREDIENTS');
      await connection.execute('DELETE FROM INGREDIENT_ALLERGENS');
      await connection.execute('DELETE FROM RECIPE_CATEGORY_ASSIGNMENTS');
      await connection.execute('DELETE FROM INGREDIENT_CATEGORY_ASSIGNMENTS');
      await connection.execute('DELETE FROM MENU_RECIPES');
      await connection.execute('DELETE FROM INVENTORY_MOVEMENTS');
      await connection.execute('DELETE FROM PRICE_HISTORY');
      await connection.execute('DELETE FROM INGREDIENT_LOGS');
      
      await connection.execute('DELETE FROM RECIPES');
      await connection.execute('DELETE FROM INGREDIENTS');
      await connection.execute('DELETE FROM SUPPLIERS');
      await connection.execute('DELETE FROM MENUS');
      await connection.execute('DELETE FROM RECIPE_CATEGORIES');
      await connection.execute('DELETE FROM INGREDIENT_CATEGORIES');
      
      // Mantener usuario admin actual y sistema settings
      await connection.execute('DELETE FROM USERS WHERE user_id != ?', [req.user.user_id]);
      
      // Resetear AUTO_INCREMENT
      await connection.execute('ALTER TABLE RECIPES AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE INGREDIENTS AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE SUPPLIERS AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE USERS AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE MENUS AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE RECIPE_CATEGORIES AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE INGREDIENT_CATEGORIES AUTO_INCREMENT = 1');
      
      await connection.commit();
      res.json({ message: 'Aplicación restablecida correctamente' });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error restableciendo aplicación:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ===== FUNCIONES DE IMPORTACIÓN =====

// Función para importar proveedores
async function importSuppliers(tenantDb, suppliersData, userId) {
  const connection = await tenantDb.getConnection();
  await connection.beginTransaction();
  
  const result = {
    imported: 0,
    updated: 0,
    errors: 0,
    errorDetails: []
  };
  
  try {
    for (let i = 0; i < suppliersData.length; i++) {
      const supplier = suppliersData[i];
      
      try {
        // Validar campo obligatorio (nombre)
        if (!supplier.Nombre && !supplier.name) {
          throw new Error('Falta campo obligatorio: Nombre');
        }
        
        // Preparar datos del proveedor
        const supplierData = {
          name: supplier.Nombre || supplier.name,
          phone: supplier.Telefono || supplier.phone || null,
          email: supplier.Email || supplier.email || null,
          website_url: supplier.Sitio_Web || supplier.website_url || null,
          address: supplier.Direccion || supplier.address || null
        };
        
        // Verificar si el proveedor ya existe
        const [existingSupplier] = await connection.execute(
          'SELECT supplier_id FROM SUPPLIERS WHERE name = ?',
          [supplierData.name]
        );
        
        if (existingSupplier.length > 0) {
          // Actualizar proveedor existente
          const supplierId = existingSupplier[0].supplier_id;
          
          await connection.execute(`
            UPDATE SUPPLIERS SET 
              phone = ?, email = ?, website_url = ?, address = ?
            WHERE supplier_id = ?
          `, [
            supplierData.phone, supplierData.email, supplierData.website_url,
            supplierData.address, supplierId
          ]);
          
          result.updated++;
        } else {
          // Insertar nuevo proveedor
          await connection.execute(`
            INSERT INTO SUPPLIERS (name, phone, email, website_url, address)
            VALUES (?, ?, ?, ?, ?)
          `, [
            supplierData.name, supplierData.phone, supplierData.email,
            supplierData.website_url, supplierData.address
          ]);
          
          result.imported++;
        }
        
      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          row: i + 1,
          supplier: supplier.Nombre || supplier.name || 'Desconocido',
          error: error.message
        });
        console.error(`Error procesando proveedor en fila ${i + 1}:`, error.message);
      }
    }
    
    await connection.commit();
    return result;
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Función para importar usuarios
async function importUsers(tenantDb, usersData, userId) {
  const bcrypt = require('bcryptjs');
  const connection = await tenantDb.getConnection();
  await connection.beginTransaction();
  
  const result = {
    imported: 0,
    updated: 0,
    errors: 0,
    errorDetails: []
  };
  
  try {
    for (let i = 0; i < usersData.length; i++) {
      const user = usersData[i];
      
      try {
        // Validar campos obligatorios
        if (!user.Nombre && !user.first_name) {
          throw new Error('Falta campo obligatorio: Nombre');
        }
        if (!user.Apellido && !user.last_name) {
          throw new Error('Falta campo obligatorio: Apellido');
        }
        if (!user.Email && !user.email) {
          throw new Error('Falta campo obligatorio: Email');
        }
        if (!user.Rol && !user.role) {
          throw new Error('Falta campo obligatorio: Rol');
        }
        
        // Validar rol
        const validRoles = ['admin', 'chef', 'inventory_manager', 'waiter', 'supplier_manager'];
        const role = user.Rol || user.role;
        if (!validRoles.includes(role)) {
          throw new Error(`Rol inválido: ${role}. Valores permitidos: ${validRoles.join(', ')}`);
        }
        
        // Preparar datos del usuario
        const userData = {
          first_name: user.Nombre || user.first_name,
          last_name: user.Apellido || user.last_name,
          email: user.Email || user.email,
          role: role,
          is_active: user.Activo === 'Si' || user.is_active === true || user.is_active === 1,
          language: user.Idioma || user.language || 'es',
          timezone: user.Zona_Horaria || user.timezone || 'Europe/Madrid'
        };
        
        // Verificar si el usuario ya existe
        const [existingUser] = await connection.execute(
          'SELECT user_id FROM USERS WHERE email = ?',
          [userData.email]
        );
        
        if (existingUser.length > 0) {
          // Actualizar usuario existente (sin contraseña)
          const userId = existingUser[0].user_id;
          
          await connection.execute(`
            UPDATE USERS SET 
              first_name = ?, last_name = ?, role = ?, 
              is_active = ?, language = ?, timezone = ?
            WHERE user_id = ?
          `, [
            userData.first_name, userData.last_name, userData.role,
            userData.is_active, userData.language, userData.timezone, userId
          ]);
          
          result.updated++;
        } else {
          // Insertar nuevo usuario (requiere contraseña)
          const defaultPassword = user.Password || user.password || 'cambiar123';
          const passwordHash = await bcrypt.hash(defaultPassword, 10);
          
          await connection.execute(`
            INSERT INTO USERS (
              first_name, last_name, email, role, password_hash,
              is_active, language, timezone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            userData.first_name, userData.last_name, userData.email,
            userData.role, passwordHash, userData.is_active,
            userData.language, userData.timezone
          ]);
          
          result.imported++;
        }
        
      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          row: i + 1,
          user: user.Email || user.email || 'Desconocido',
          error: error.message
        });
        console.error(`Error procesando usuario en fila ${i + 1}:`, error.message);
      }
    }
    
    await connection.commit();
    return result;
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Función para importar eventos
async function importEvents(tenantDb, eventsData, userId) {
  const connection = await tenantDb.getConnection();
  await connection.beginTransaction();
  
  const result = {
    imported: 0,
    updated: 0,
    errors: 0,
    errorDetails: []
  };
  
  try {
    for (let i = 0; i < eventsData.length; i++) {
      const event = eventsData[i];
      
      try {
        // Validar campos obligatorios
        if (!event.Nombre && !event.name) {
          throw new Error('Falta campo obligatorio: Nombre');
        }
        if (!event.Fecha_Evento && !event.event_date) {
          throw new Error('Falta campo obligatorio: Fecha_Evento');
        }
        if (!event.Numero_Invitados && !event.guests_count) {
          throw new Error('Falta campo obligatorio: Numero_Invitados');
        }
        
        // Validar estado
        const validStatuses = ['planned', 'confirmed', 'in_progress', 'completed', 'cancelled'];
        const status = event.Estado || event.status || 'planned';
        if (!validStatuses.includes(status)) {
          throw new Error(`Estado inválido: ${status}. Valores permitidos: ${validStatuses.join(', ')}`);
        }
        
        // Preparar datos del evento
        const eventData = {
          name: event.Nombre || event.name,
          description: event.Descripcion || event.description || null,
          event_date: parseEventDate(event.Fecha_Evento || event.event_date),
          event_time: event.Hora_Evento || event.event_time || null,
          guests_count: parseInt(event.Numero_Invitados || event.guests_count),
          location: event.Ubicacion || event.location || null,
          status: status,
          budget: parseFloat(event.Presupuesto || event.budget) || null,
          notes: event.Notas || event.notes || null,
          created_by_user_id: userId
        };
        
        // Verificar si el evento ya existe (por nombre y fecha)
        const [existingEvent] = await connection.execute(
          'SELECT event_id FROM EVENTS WHERE name = ? AND event_date = ?',
          [eventData.name, eventData.event_date]
        );
        
        if (existingEvent.length > 0) {
          // Actualizar evento existente
          const eventId = existingEvent[0].event_id;
          
          await connection.execute(`
            UPDATE EVENTS SET 
              description = ?, event_time = ?, guests_count = ?, 
              location = ?, status = ?, budget = ?, notes = ?
            WHERE event_id = ?
          `, [
            eventData.description, eventData.event_time, eventData.guests_count,
            eventData.location, eventData.status, eventData.budget,
            eventData.notes, eventId
          ]);
          
          result.updated++;
        } else {
          // Insertar nuevo evento
          await connection.execute(`
            INSERT INTO EVENTS (
              name, description, event_date, event_time, guests_count,
              location, status, budget, notes, created_by_user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            eventData.name, eventData.description, eventData.event_date,
            eventData.event_time, eventData.guests_count, eventData.location,
            eventData.status, eventData.budget, eventData.notes,
            eventData.created_by_user_id
          ]);
          
          result.imported++;
        }
        
      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          row: i + 1,
          event: event.Nombre || event.name || 'Desconocido',
          error: error.message
        });
        console.error(`Error procesando evento en fila ${i + 1}:`, error.message);
      }
    }
    
    await connection.commit();
    return result;
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Función helper para parsear fechas de eventos
function parseEventDate(dateString) {
  if (!dateString) return null;
  
  // Intentar varios formatos de fecha
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}$/ // DD-MM-YYYY
  ];
  
  for (const format of formats) {
    if (format.test(dateString)) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }
  
  // Si no coincide con ningún formato, intentar parsear directamente
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  throw new Error(`Formato de fecha inválido: ${dateString}`);
}

// Función para restaurar backup completo
async function restoreBackup(tenantDb, backupData, userId) {
  const bcrypt = require('bcryptjs');
  const connection = await tenantDb.getConnection();
  await connection.beginTransaction();
  
  const result = {
    restored: 0,
    errors: 0,
    errorDetails: [],
    tablesProcessed: []
  };
  
  try {
    console.log('🔄 Iniciando restauración de backup...');
    
    // Orden de restauración para respetar las dependencias
    const restoreOrder = [
      'users',
      'recipe_categories', 
      'ingredient_categories',
      'allergens',
      'suppliers',
      'ingredients',
      'recipes',
      'events',
      'recipe_ingredients',
      'supplier_ingredients',
      'ingredient_allergens',
      'recipe_category_assignments',
      'ingredient_category_assignments',
      'event_menus',
      'system_settings'
    ];
    
    // Procesar cada tabla en orden
    for (const tableName of restoreOrder) {
      const tableData = backupData.data[tableName];
      
      if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
        console.log(`⚠️ Saltando tabla ${tableName.toUpperCase()} - no hay datos`);
        continue;
      }
      
      try {
        console.log(`📝 Restaurando tabla ${tableName.toUpperCase()} (${tableData.length} registros)...`);
        
        // Limpiar tabla existente (excepto usuarios para evitar perder el admin actual)
        if (tableName === 'users') {
          // Para usuarios, mantener el usuario actual que está haciendo la restauración
          await connection.execute('DELETE FROM USERS WHERE user_id != ?', [userId]);
        } else {
          const upperTableName = tableName.toUpperCase();
          await connection.execute(`DELETE FROM ${upperTableName}`);
          
          // Resetear AUTO_INCREMENT si la tabla tiene ese campo
          try {
            await connection.execute(`ALTER TABLE ${upperTableName} AUTO_INCREMENT = 1`);
          } catch (error) {
            // Ignorar errores de AUTO_INCREMENT (puede que la tabla no lo tenga)
          }
        }
        
        // Insertar datos
        let inserted = 0;
        for (const record of tableData) {
          try {
            // Preparar datos según la tabla
            await insertRecordByTable(connection, tableName, record, userId);
            inserted++;
          } catch (error) {
            result.errors++;
            result.errorDetails.push({
              table: tableName,
              record: record,
              error: error.message
            });
            console.error(`❌ Error insertando en ${tableName}:`, error.message);
          }
        }
        
        result.restored++;
        result.tablesProcessed.push({
          table: tableName,
          records: inserted,
          total: tableData.length
        });
        
        console.log(`✅ Tabla ${tableName.toUpperCase()} restaurada: ${inserted}/${tableData.length} registros`);
        
      } catch (error) {
        result.errors++;
        result.errorDetails.push({
          table: tableName,
          error: error.message
        });
        console.error(`❌ Error restaurando tabla ${tableName}:`, error.message);
      }
    }
    
    await connection.commit();
    console.log('✅ Restauración de backup completada');
    return result;
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error durante la restauración:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Función helper para insertar registros según la tabla
async function insertRecordByTable(connection, tableName, record, currentUserId) {
  const bcrypt = require('bcryptjs');
  
  switch (tableName) {
    case 'users':
      // Solo insertar si no es el usuario actual
      if (record.user_id !== currentUserId) {
        // Generar nueva contraseña hasheada
        const passwordHash = await bcrypt.hash('cambiar123', 10);
        
        await connection.execute(`
          INSERT INTO USERS (first_name, last_name, email, role, password_hash, is_active, language, timezone)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          record.first_name, record.last_name, record.email, record.role,
          passwordHash, record.is_active || true, record.language || 'es', record.timezone || 'Europe/Madrid'
        ]);
      }
      break;
      
    case 'recipes':
      await connection.execute(`
        INSERT INTO RECIPES (name, servings, production_servings, cost_per_serving, net_price, prep_time, difficulty, instructions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        record.name, record.servings || 1, record.production_servings || record.servings || 1,
        record.cost_per_serving || 0, record.net_price || 0, record.prep_time, record.difficulty || 'medium', record.instructions
      ]);
      break;
      
    case 'ingredients':
      await connection.execute(`
        INSERT INTO INGREDIENTS (name, unit, base_price, waste_percent, stock, stock_minimum, season, expiration_date, is_available, comment, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        record.name, record.unit, record.base_price || 0, record.waste_percent || 0,
        record.stock || 0, record.stock_minimum || 0, record.season, record.expiration_date,
        record.is_available !== false, record.comment, record.calories_per_100g || 0,
        record.protein_per_100g || 0, record.carbs_per_100g || 0, record.fat_per_100g || 0
      ]);
      break;
      
    case 'suppliers':
      await connection.execute(`
        INSERT INTO SUPPLIERS (name, phone, email, website_url, address)
        VALUES (?, ?, ?, ?, ?)
      `, [record.name, record.phone, record.email, record.website_url, record.address]);
      break;
      
    case 'events':
      await connection.execute(`
        INSERT INTO EVENTS (name, description, event_date, event_time, guests_count, location, status, budget, notes, created_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        record.name, record.description, record.event_date, record.event_time,
        record.guests_count, record.location, record.status || 'planned',
        record.budget, record.notes, record.created_by_user_id || currentUserId
      ]);
      break;
      
    case 'recipe_categories':
      await connection.execute(`INSERT INTO RECIPE_CATEGORIES (name) VALUES (?)`, [record.name]);
      break;
      
    case 'ingredient_categories':
      await connection.execute(`INSERT INTO INGREDIENT_CATEGORIES (name) VALUES (?)`, [record.name]);
      break;
      
    case 'allergens':
      await connection.execute(`INSERT INTO ALLERGENS (name, severity) VALUES (?, ?)`, [record.name, record.severity || 'medium']);
      break;
      
    case 'recipe_ingredients':
      await connection.execute(`
        INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving)
        VALUES (?, ?, ?)
      `, [record.recipe_id, record.ingredient_id, record.quantity_per_serving]);
      break;
      
    case 'supplier_ingredients':
      await connection.execute(`
        INSERT INTO SUPPLIER_INGREDIENTS (supplier_id, ingredient_id, price, is_preferred_supplier, package_size, package_unit, minimum_order_quantity)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        record.supplier_id, record.ingredient_id, record.price || 0,
        record.is_preferred_supplier || false, record.package_size || 1,
        record.package_unit || 'unidad', record.minimum_order_quantity || 1
      ]);
      break;
      
    case 'ingredient_allergens':
      await connection.execute(`
        INSERT INTO INGREDIENT_ALLERGENS (ingredient_id, allergen_id)
        VALUES (?, ?)
      `, [record.ingredient_id, record.allergen_id]);
      break;
      
    case 'recipe_category_assignments':
      await connection.execute(`
        INSERT INTO RECIPE_CATEGORY_ASSIGNMENTS (recipe_id, category_id)
        VALUES (?, ?)
      `, [record.recipe_id, record.category_id]);
      break;
      
    case 'ingredient_category_assignments':
      await connection.execute(`
        INSERT INTO INGREDIENT_CATEGORY_ASSIGNMENTS (ingredient_id, category_id)
        VALUES (?, ?)
      `, [record.ingredient_id, record.category_id]);
      break;
      
    case 'event_menus':
      await connection.execute(`
        INSERT INTO EVENT_MENUS (event_id, recipe_id, portions, course_type, notes)
        VALUES (?, ?, ?, ?, ?)
      `, [record.event_id, record.recipe_id, record.portions || 1, record.course_type || 'main', record.notes]);
      break;
      
    case 'system_settings':
      await connection.execute(`
        INSERT INTO SYSTEM_SETTINGS (setting_key, setting_value, updated_at)
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = VALUES(updated_at)
      `, [record.setting_key, record.setting_value]);
      break;
      
    default:
      throw new Error(`Tabla no soportada para restauración: ${tableName}`);
  }
}

// Función helper para calcular la fecha del próximo backup
function calculateNextBackupDate(frequency, tenantId) {
  const now = new Date();
  const baseHour = 2; // Misma hora base que en BackupManager
  const maxWindow = 6; // Misma ventana que en BackupManager
  
  // Generar offset basado en hash del tenantId (mismo algoritmo que BackupManager)
  const hash = tenantId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const hourOffset = hash % maxWindow;
  const finalHour = baseHour + hourOffset;
  
  // Minutos aleatorios basados en tenant
  const minuteOffset = (hash * 7) % 60;
  
  let nextBackup = new Date();
  nextBackup.setHours(finalHour, minuteOffset, 0, 0);
  
  switch (frequency) {
    case 'daily':
      // Si ya pasó la hora de hoy, programar para mañana
      if (now.getHours() > finalHour || (now.getHours() === finalHour && now.getMinutes() >= minuteOffset)) {
        nextBackup.setDate(nextBackup.getDate() + 1);
      }
      break;
      
    case 'weekly':
      // Programar para el próximo domingo
      const daysUntilSunday = (7 - now.getDay()) % 7;
      if (daysUntilSunday === 0) {
        // Es domingo, verificar si ya pasó la hora
        if (now.getHours() > finalHour || (now.getHours() === finalHour && now.getMinutes() >= minuteOffset)) {
          nextBackup.setDate(nextBackup.getDate() + 7); // Próximo domingo
        }
      } else {
        nextBackup.setDate(nextBackup.getDate() + daysUntilSunday);
      }
      break;
      
    case 'monthly':
      // Programar para el día 1 del próximo mes
      nextBackup.setMonth(nextBackup.getMonth() + 1);
      nextBackup.setDate(1);
      
      // Si estamos en día 1 y no ha pasado la hora, usar este mes
      if (now.getDate() === 1 && (now.getHours() < finalHour || (now.getHours() === finalHour && now.getMinutes() < minuteOffset))) {
        nextBackup.setMonth(nextBackup.getMonth() - 1);
      }
      break;
      
    default:
      // Por defecto semanal
      const daysUntilDefaultSunday = (7 - now.getDay()) % 7;
      if (daysUntilDefaultSunday === 0) {
        if (now.getHours() > finalHour || (now.getHours() === finalHour && now.getMinutes() >= minuteOffset)) {
          nextBackup.setDate(nextBackup.getDate() + 7);
        }
      } else {
        nextBackup.setDate(nextBackup.getDate() + daysUntilDefaultSunday);
      }
  }
  
  return nextBackup.toISOString();
}

module.exports = router;