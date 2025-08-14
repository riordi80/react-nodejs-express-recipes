// utils/backupManager.js
const fs = require('fs').promises;
const path = require('path');
// Multi-tenant system - no necesitamos mysql pool global
const cron = require('node-cron');

class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.cronJobs = new Map(); // Map de cronJobs por tenant
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

    console.log('✅ BackupManager inicializado para sistema multi-tenant');
    this.isInitialized = true;
  }

  async initializeSchedulerForTenant(tenantDb, tenantId) {
    try {
      // Solo inicializar si no existe ya un scheduler para este tenant
      if (this.cronJobs.has(tenantId)) {
        console.log(`⏭️ Scheduler ya existe para tenant ${tenantId}, saltando inicialización`);
        return;
      }
      
      // Obtener configuración actual del tenant
      const settings = await this.getBackupSettings(tenantDb);
      
      if (settings.backup_auto_enabled === 'true') {
        this.startSchedulerForTenant(tenantDb, tenantId, settings.backup_frequency);
      }
    } catch (error) {
      console.error(`Error inicializando scheduler para tenant ${tenantId}:`, error);
    }
  }

  async getBackupSettings(tenantDb) {
    const [rows] = await tenantDb.execute(`
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

  getCronPatternWithDistribution(frequency, tenantId) {
    const baseHour = 2; // Hora base: 2:00 AM
    const maxWindow = 6; // Ventana de 6 horas (2-8 AM)
    
    // Generar offset basado en hash del tenantId para distribución consistente
    const hash = tenantId.toString().split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const hourOffset = hash % maxWindow;
    const finalHour = baseHour + hourOffset;
    
    // Minutos aleatorios basados en tenant para mayor distribución
    const minuteOffset = (hash * 7) % 60; // 0-59 minutos
    
    console.log(`🕐 Tenant ${tenantId} programado para: ${finalHour}:${minuteOffset.toString().padStart(2, '0')}`);
    
    switch (frequency) {
      case 'daily':
        return `${minuteOffset} ${finalHour} * * *`; // Cada día entre 2-8 AM
      case 'weekly':
        return `${minuteOffset} ${finalHour} * * 0`; // Domingos entre 2-8 AM
      case 'monthly':
        return `${minuteOffset} ${finalHour} 1 * *`; // Primer día entre 2-8 AM
      default:
        return `${minuteOffset} ${finalHour} * * 0`; // Por defecto semanal
    }
  }

  startSchedulerForTenant(tenantDb, tenantId, frequency) {
    // Detener scheduler existente para este tenant
    this.stopSchedulerForTenant(tenantId);
    
    const cronPattern = this.getCronPatternWithDistribution(frequency, tenantId);
    
    const cronJob = cron.schedule(cronPattern, async () => {
      console.log(`🔄 Ejecutando backup automático para tenant ${tenantId} (${frequency})`);
      try {
        await this.createAutomaticBackupForTenant(tenantDb, tenantId);
      } catch (error) {
        console.error(`Error en backup automático para tenant ${tenantId}:`, error);
      }
    }, {
      scheduled: true,
      timezone: 'Europe/Madrid'
    });
    
    this.cronJobs.set(tenantId, cronJob);
    console.log(`⏰ Scheduler iniciado para tenant ${tenantId}: ${frequency} (${cronPattern})`);
  }

  stopSchedulerForTenant(tenantId) {
    const cronJob = this.cronJobs.get(tenantId);
    if (cronJob) {
      cronJob.destroy();
      this.cronJobs.delete(tenantId);
      console.log(`⏹️ Scheduler detenido para tenant ${tenantId}`);
    }
  }

  async updateSchedulerForTenant(tenantDb, tenantId, autoEnabled, frequency) {
    if (autoEnabled) {
      this.startSchedulerForTenant(tenantDb, tenantId, frequency);
    } else {
      this.stopSchedulerForTenant(tenantId);
    }
  }

  async createAutomaticBackupForTenant(tenantDb, tenantId, userId = null) {
    try {
      // Usar UTC tanto para filename como para API - dejar que frontend convierta
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const filename = `${tenantId}_backup_${timestamp}.json`;
      const filepath = path.join(this.backupDir, filename);
      
      // Generar datos de backup
      const backupData = await this.generateBackupDataForTenant(tenantDb, tenantId);
      
      // Guardar archivo
      await fs.writeFile(filepath, JSON.stringify(backupData, null, 2));
      
      // Registrar en audit logs
      await tenantDb.execute(
        'INSERT INTO AUDIT_LOGS (user_id, action, table_name, description, timestamp) VALUES (?, ?, ?, ?, NOW())',
        [userId, 'backup', 'SYSTEM', `Backup automático creado: ${filename}`]
      );
      
      // Actualizar fecha de último backup
      await tenantDb.execute(`
        INSERT INTO SYSTEM_SETTINGS (setting_key, setting_value, updated_at) 
        VALUES ('backup_last_date', NOW(), NOW())
        ON DUPLICATE KEY UPDATE 
        setting_value = VALUES(setting_value), 
        updated_at = VALUES(updated_at)
      `);
      
      console.log(`✅ Backup automático creado para tenant ${tenantId}: ${filename}`);
      
      // Limpiar backups antiguos para este tenant
      await this.cleanupOldBackupsForTenant(tenantId);
      
      return {
        success: true,
        filename,
        filepath,
        size: (await fs.stat(filepath)).size,
        tenantId
      };
      
    } catch (error) {
      console.error(`Error creando backup automático para tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async generateBackupDataForTenant(tenantDb, tenantId) {
    // Obtener datos de todas las tablas principales
    const [recipes] = await tenantDb.execute('SELECT * FROM RECIPES');
    const [ingredients] = await tenantDb.execute('SELECT * FROM INGREDIENTS');
    const [suppliers] = await tenantDb.execute('SELECT * FROM SUPPLIERS');
    const [users] = await tenantDb.execute('SELECT user_id, first_name, last_name, email, role, is_active, language, timezone FROM USERS');
    const [recipeIngredients] = await tenantDb.execute('SELECT * FROM RECIPE_INGREDIENTS');
    const [supplierIngredients] = await tenantDb.execute('SELECT * FROM SUPPLIER_INGREDIENTS');
    const [settings] = await tenantDb.execute('SELECT * FROM SYSTEM_SETTINGS');
    const [categories] = await tenantDb.execute('SELECT * FROM RECIPE_CATEGORIES');
    const [ingredientCategories] = await tenantDb.execute('SELECT * FROM INGREDIENT_CATEGORIES');
    const [events] = await tenantDb.execute('SELECT * FROM EVENTS');
    const [eventMenus] = await tenantDb.execute('SELECT * FROM EVENT_MENUS');
    const [allergens] = await tenantDb.execute('SELECT * FROM ALLERGENS');
    const [ingredientAllergens] = await tenantDb.execute('SELECT * FROM INGREDIENT_ALLERGENS');
    const [recipeCategoryAssignments] = await tenantDb.execute('SELECT * FROM RECIPE_CATEGORY_ASSIGNMENTS');
    const [ingredientCategoryAssignments] = await tenantDb.execute('SELECT * FROM INGREDIENT_CATEGORY_ASSIGNMENTS');
    
    return {
      metadata: {
        version: '1.0',
        created_at: new Date().toISOString(),
        type: 'automatic',
        tenant_id: tenantId,
        tables: [
          'recipes', 'ingredients', 'suppliers', 'users', 'events',
          'recipe_ingredients', 'supplier_ingredients', 'event_menus', 'allergens',
          'ingredient_allergens', 'recipe_category_assignments', 'ingredient_category_assignments',
          'system_settings', 'recipe_categories', 'ingredient_categories'
        ]
      },
      data: {
        recipes,
        ingredients,
        suppliers,
        users,
        events,
        recipe_ingredients: recipeIngredients,
        supplier_ingredients: supplierIngredients,
        event_menus: eventMenus,
        allergens,
        ingredient_allergens: ingredientAllergens,
        recipe_category_assignments: recipeCategoryAssignments,
        ingredient_category_assignments: ingredientCategoryAssignments,
        system_settings: settings,
        recipe_categories: categories,
        ingredient_categories: ingredientCategories
      }
    };
  }

  async cleanupOldBackupsForTenant(tenantId) {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith(`${tenantId}_backup_`) && file.endsWith('.json'))
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
      
      // Mantener solo los últimos 30 backups por tenant
      const maxBackups = 30;
      if (filesWithStats.length > maxBackups) {
        const filesToDelete = filesWithStats.slice(maxBackups);
        
        for (const file of filesToDelete) {
          await fs.unlink(file.path);
          console.log(`🗑️ Backup antiguo eliminado para tenant ${tenantId}: ${file.name}`);
        }
      }
      
      console.log(`🧹 Limpieza completada para tenant ${tenantId}. ${Math.min(filesWithStats.length, maxBackups)} backups mantenidos.`);
    } catch (error) {
      console.error(`Error limpiando backups antiguos para tenant ${tenantId}:`, error);
    }
  }

  async listBackupsForTenant(tenantId) {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith(`${tenantId}_backup_`) && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file)
        }));
      
      const filesWithStats = await Promise.all(
        backupFiles.map(async (file) => {
          const stats = await fs.stat(file.path);
          
          // Extraer fecha del filename en lugar de usar stats.mtime
          // Formato: tenantId_backup_2025-08-14T23-00-06-641Z.json
          const dateMatch = file.name.match(/_backup_(.+)\.json$/);
          let createdAt = stats.mtime; // Fallback a mtime si no se puede extraer
          
          if (dateMatch) {
            try {
              // Convertir filename UTC de vuelta a fecha ISO estándar
              const isoString = dateMatch[1].replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z');
              createdAt = new Date(isoString);
              
              // Verificar que la fecha es válida
              if (isNaN(createdAt.getTime())) {
                throw new Error('Fecha inválida');
              }
            } catch (error) {
              console.warn(`No se pudo parsear fecha del filename ${file.name}:`, error.message);
              createdAt = stats.mtime; // Usar mtime como fallback
            }
          }
          
          return {
            filename: file.name,
            size: stats.size,
            created_at: createdAt,
            path: file.path
          };
        })
      );
      
      // Ordenar por fecha (más reciente primero)
      return filesWithStats.sort((a, b) => b.created_at - a.created_at);
    } catch (error) {
      console.error(`Error listando backups para tenant ${tenantId}:`, error);
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

  async getBackupStatsForTenant(tenantId) {
    try {
      const backups = await this.listBackupsForTenant(tenantId);
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      
      return {
        total_backups: backups.length,
        total_size: totalSize,
        oldest_backup: backups.length > 0 ? backups[backups.length - 1].created_at : null,
        newest_backup: backups.length > 0 ? backups[0].created_at : null
      };
    } catch (error) {
      console.error(`Error obteniendo estadísticas de backup para tenant ${tenantId}:`, error);
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