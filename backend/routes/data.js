// routes/data.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const backupManager = require('../utils/backupManager');

// Configura la conexión a tu base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ===== EXPORTACIÓN DE DATOS =====

// GET /data/export/recipes - Exportar recetas
router.get('/export/recipes', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    // Consulta completa de recetas con ingredientes
    const [recipes] = await pool.execute(`
      SELECT 
        r.recipe_id,
        r.name,
        r.servings,
        r.production_servings,
        r.cost_per_serving,
        r.net_price,
        r.prep_time,
        r.difficulty,
        r.instructions,
        r.created_at,
        GROUP_CONCAT(
          CONCAT(i.name, ':', ri.quantity_per_serving, ' ', i.unit) 
          SEPARATOR '; '
        ) as ingredients
      FROM RECIPES r
      LEFT JOIN RECIPE_INGREDIENTS ri ON r.recipe_id = ri.recipe_id
      LEFT JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
      GROUP BY r.recipe_id
      ORDER BY r.name
    `);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=recipes.json');
      res.json(recipes);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=recipes.csv');
      
      const csvHeader = 'ID,Nombre,Porciones,Porciones_Produccion,Costo_Porcion,Precio_Neto,Tiempo_Prep,Dificultad,Ingredientes\n';
      const csvData = recipes.map(recipe => 
        `${recipe.recipe_id},"${recipe.name}",${recipe.servings},${recipe.production_servings},${recipe.cost_per_serving || 0},${recipe.net_price},${recipe.prep_time || 0},"${recipe.difficulty}","${recipe.ingredients || ''}"`
      ).join('\n');
      
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
    
    const [ingredients] = await pool.execute(`
      SELECT 
        ingredient_id,
        name,
        unit,
        base_price,
        stock,
        stock_minimum,
        is_available,
        comment
      FROM INGREDIENTS
      ORDER BY name
    `);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=ingredients.json');
      res.json(ingredients);
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=ingredients.csv');
      
      const csvHeader = 'ID,Nombre,Unidad,Precio_Base,Stock,Stock_Minimo,Disponible,Comentario\n';
      const csvData = ingredients.map(ingredient => 
        `${ingredient.ingredient_id},"${ingredient.name}","${ingredient.unit}",${ingredient.base_price},${ingredient.stock},${ingredient.stock_minimum},${ingredient.is_available ? 'Si' : 'No'},"${ingredient.comment || ''}"`
      ).join('\n');
      
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
    
    const [suppliers] = await pool.execute(`
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

// ===== BACKUP Y RESTORE =====

// GET /data/backup - Crear backup completo
router.get('/backup', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    
    // Obtener datos de todas las tablas principales
    const [recipes] = await pool.execute('SELECT * FROM RECIPES');
    const [ingredients] = await pool.execute('SELECT * FROM INGREDIENTS');
    const [suppliers] = await pool.execute('SELECT * FROM SUPPLIERS');
    const [users] = await pool.execute('SELECT user_id, first_name, last_name, email, role, is_active, language, timezone FROM USERS');
    const [recipeIngredients] = await pool.execute('SELECT * FROM RECIPE_INGREDIENTS');
    const [supplierIngredients] = await pool.execute('SELECT * FROM SUPPLIER_INGREDIENTS');
    const [settings] = await pool.execute('SELECT * FROM SYSTEM_SETTINGS');
    
    const backupData = {
      metadata: {
        version: '1.0',
        created_at: new Date().toISOString(),
        tables: ['recipes', 'ingredients', 'suppliers', 'users', 'recipe_ingredients', 'supplier_ingredients', 'system_settings']
      },
      data: {
        recipes,
        ingredients,
        suppliers,
        users,
        recipe_ingredients: recipeIngredients,
        supplier_ingredients: supplierIngredients,
        system_settings: settings
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=recetario_backup_${timestamp}.json`);
    res.json(backupData);
    
    // Registrar en audit logs
    await pool.execute(
      'INSERT INTO AUDIT_LOGS (user_id, action, table_name, description, timestamp) VALUES (?, ?, ?, ?, NOW())',
      [req.user.user_id, 'backup', 'SYSTEM', 'Backup completo creado']
    );
    
  } catch (error) {
    console.error('Error creando backup:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /data/backup/status - Obtener estado del backup
router.get('/backup/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Obtener configuración de backup
    const [settings] = await pool.execute(`
      SELECT setting_key, setting_value 
      FROM SYSTEM_SETTINGS 
      WHERE setting_key IN ('backup_auto_enabled', 'backup_frequency', 'backup_last_date')
    `);
    
    const backupSettings = {};
    settings.forEach(row => {
      backupSettings[row.setting_key] = row.setting_value;
    });
    
    // Obtener último backup desde audit logs
    const [lastBackup] = await pool.execute(`
      SELECT timestamp 
      FROM AUDIT_LOGS 
      WHERE action = 'backup' AND table_name = 'SYSTEM'
      ORDER BY timestamp DESC 
      LIMIT 1
    `);
    
    res.json({
      auto_enabled: backupSettings.backup_auto_enabled === 'true',
      frequency: backupSettings.backup_frequency || 'weekly',
      last_backup: lastBackup[0]?.timestamp || null,
      last_backup_formatted: lastBackup[0]?.timestamp ? 
        new Date(lastBackup[0].timestamp).toLocaleString('es-ES') : 'Nunca'
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
      await pool.execute(`
        INSERT INTO SYSTEM_SETTINGS (setting_key, setting_value, updated_at) 
        VALUES (?, ?, NOW())
        ON DUPLICATE KEY UPDATE 
        setting_value = VALUES(setting_value), 
        updated_at = VALUES(updated_at)
      `, [setting.key, setting.value]);
    }
    
    // Actualizar scheduler del BackupManager
    await backupManager.updateScheduler(auto_enabled, frequency);
    
    // Registrar en audit logs
    await pool.execute(
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
    const backups = await backupManager.listBackups();
    const stats = await backupManager.getBackupStats();
    
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
    await pool.execute(
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
    
    const connection = await pool.getConnection();
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

module.exports = router;