// utils/backupManager.js
const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const cron = require('node-cron');

class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    
    this.cronJob = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    // Crear directorio de backups si no existe
    try {
      await fs.access(this.backupDir);
    } catch (error) {
      await fs.mkdir(this.backupDir, { recursive: true });
      console.log('📁 Directorio de backups creado:', this.backupDir);
    }

    // Inicializar scheduler
    await this.initializeScheduler();
    this.isInitialized = true;
    
  }

  async initializeScheduler() {
    try {
      // Obtener configuración actual
      const settings = await this.getBackupSettings();
      
      if (settings.backup_auto_enabled === 'true') {
        this.startScheduler(settings.backup_frequency);
      }
    } catch (error) {
      console.error('Error inicializando scheduler:', error);
    }
  }

  async getBackupSettings() {
    const [rows] = await this.pool.execute(`
      SELECT setting_key, setting_value 
      FROM SYSTEM_SETTINGS 
      WHERE setting_key IN ('backup_auto_enabled', 'backup_frequency')
    `);
    
    const settings = {};
    rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    return {
      backup_auto_enabled: settings.backup_auto_enabled || 'false',
      backup_frequency: settings.backup_frequency || 'weekly'
    };
  }

  getCronPattern(frequency) {
    switch (frequency) {
      case 'daily':
        return '0 2 * * *'; // Todos los días a las 2:00 AM
      case 'weekly':
        return '0 2 * * 0'; // Domingos a las 2:00 AM
      case 'monthly':
        return '0 2 1 * *'; // Primer día del mes a las 2:00 AM
      default:
        return '0 2 * * 0'; // Por defecto semanal
    }
  }

  startScheduler(frequency) {
    // Detener scheduler existente
    this.stopScheduler();
    
    const cronPattern = this.getCronPattern(frequency);
    
    this.cronJob = cron.schedule(cronPattern, async () => {
      console.log(`🔄 Ejecutando backup automático (${frequency})`);
      try {
        await this.createAutomaticBackup();
      } catch (error) {
        console.error('Error en backup automático:', error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Madrid'
    });
    
  }

  stopScheduler() {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
    }
  }

  async updateScheduler(autoEnabled, frequency) {
    if (autoEnabled) {
      this.startScheduler(frequency);
    } else {
      this.stopScheduler();
    }
  }

  async createAutomaticBackup(userId = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `recetario_backup_${timestamp}.json`;
      const filepath = path.join(this.backupDir, filename);
      
      // Generar datos de backup
      const backupData = await this.generateBackupData();
      
      // Guardar archivo
      await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));
      
      // Registrar en audit logs
      await this.pool.execute(
        'INSERT INTO AUDIT_LOGS (user_id, action, table_name, description, timestamp) VALUES (?, ?, ?, ?, NOW())',
        [userId, 'backup', 'SYSTEM', `Backup automático creado: ${filename}`]
      );
      
      // Actualizar fecha de último backup
      await this.pool.execute(`
        INSERT INTO SYSTEM_SETTINGS (setting_key, setting_value, updated_at) 
        VALUES ('backup_last_date', NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
        setting_value = VALUES(setting_value), 
        updated_at = VALUES(updated_at)
      `);
      
      console.log(`✅ Backup automático creado: ${filename}`);
      
      // Limpiar backups antiguos
      await this.cleanupOldBackups();
      
      return {
        success: true,
        filename,
        filepath,
        size: (await fs.stat(filepath)).size
      };
      
    } catch (error) {
      console.error('Error creando backup automático:', error);
      throw error;
    }
  }

  async generateBackupData() {
    // Obtener datos de todas las tablas principales
    const [recipes] = await this.pool.execute('SELECT * FROM RECIPES');
    const [ingredients] = await this.pool.execute('SELECT * FROM INGREDIENTS');
    const [suppliers] = await this.pool.execute('SELECT * FROM SUPPLIERS');
    const [users] = await this.pool.execute('SELECT user_id, first_name, last_name, email, role, is_active, language, timezone FROM USERS');
    const [recipeIngredients] = await this.pool.execute('SELECT * FROM RECIPE_INGREDIENTS');
    const [supplierIngredients] = await this.pool.execute('SELECT * FROM SUPPLIER_INGREDIENTS');
    const [settings] = await this.pool.execute('SELECT * FROM SYSTEM_SETTINGS');
    const [categories] = await this.pool.execute('SELECT * FROM RECIPE_CATEGORIES');
    const [ingredientCategories] = await this.pool.execute('SELECT * FROM INGREDIENT_CATEGORIES');
    const [menus] = await this.pool.execute('SELECT * FROM MENUS');
    
    return {
      metadata: {
        version: '1.0',
        created_at: new Date().toISOString(),
        type: 'automatic',
        tables: [
          'recipes', 'ingredients', 'suppliers', 'users', 
          'recipe_ingredients', 'supplier_ingredients', 'system_settings',
          'recipe_categories', 'ingredient_categories', 'menus'
        ]
      },
      data: {
        recipes,
        ingredients,
        suppliers,
        users,
        recipe_ingredients: recipeIngredients,
        supplier_ingredients: supplierIngredients,
        system_settings: settings,
        recipe_categories: categories,
        ingredient_categories: ingredientCategories,
        menus
      }
    };
  }

  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('recetario_backup_') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file)
        }));
      
      // Obtener información de archivos
      const filesWithStats = await Promise.all(
        backupFiles.map(async (file) => {
          const stats = await fs.stat(file.path);
          return {
            ...file,
            mtime: stats.mtime,
            size: stats.size
          };
        })
      );
      
      // Ordenar por fecha (más reciente primero)
      filesWithStats.sort((a, b) => b.mtime - a.mtime);
      
      // Mantener solo los últimos 30 backups
      const maxBackups = 30;
      if (filesWithStats.length > maxBackups) {
        const filesToDelete = filesWithStats.slice(maxBackups);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          console.log(`🗑️ Backup antiguo eliminado: ${file.name}`);
        }
      }
      
      console.log(`🧹 Limpieza completada. ${filesWithStats.length} backups mantenidos.`);
    } catch (error) {
      console.error('Error limpiando backups antiguos:', error);
    }
  }

  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('recetario_backup_') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file)
        }));
      
      const filesWithStats = await Promise.all(
        backupFiles.map(async (file) => {
          const stats = await fs.stat(file.path);
          return {
            filename: file.name,
            size: stats.size,
            created_at: stats.mtime,
            path: file.path
          };
        })
      );
      
      // Ordenar por fecha (más reciente primero)
      return filesWithStats.sort((a, b) => b.created_at - a.created_at);
    } catch (error) {
      console.error('Error listando backups:', error);
      return [];
    }
  }

  async getBackupFile(filename) {
    const filepath = path.join(this.backupDir, filename);
    try {
      await fs.access(filepath);
      return filepath;
    } catch (error) {
      throw new Error('Archivo de backup no encontrado');
    }
  }

  async deleteBackup(filename) {
    const filepath = path.join(this.backupDir, filename);
    try {
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      throw new Error('Error eliminando archivo de backup');
    }
  }

  async getBackupStats() {
    try {
      const backups = await this.listBackups();
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      
      return {
        total_backups: backups.length,
        total_size: totalSize,
        oldest_backup: backups.length > 0 ? backups[backups.length - 1].created_at : null,
        newest_backup: backups.length > 0 ? backups[0].created_at : null
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de backup:', error);
      return {
        total_backups: 0,
        total_size: 0,
        oldest_backup: null,
        newest_backup: null
      };
    }
  }
}

// Crear instancia singleton
const backupManager = new BackupManager();

module.exports = backupManager;