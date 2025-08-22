// routes/settings.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Multi-tenant: usar req.tenantDb en lugar de pool estático

// GET /settings/password-policy - Obtener configuración de política de contraseñas
router.get('/password-policy', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [result] = await req.tenantDb.execute(`
      SELECT 
        setting_key, 
        setting_value 
      FROM SYSTEM_SETTINGS 
      WHERE setting_key IN ('password_min_length', 'password_require_special', 'password_require_numbers')
    `);
    
    // Convertir array de configuraciones a objeto
    const settings = {};
    result.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    // Valores por defecto si no existen
    const defaultSettings = {
      password_min_length: '8',
      password_require_special: 'false',
      password_require_numbers: 'true'
    };
    
    res.json({
      ...defaultSettings,
      ...settings,
      // Convertir strings a booleanos
      password_require_special: (settings.password_require_special || defaultSettings.password_require_special) === 'true',
      password_require_numbers: (settings.password_require_numbers || defaultSettings.password_require_numbers) === 'true'
    });
    
  } catch (error) {
    console.error('Error obteniendo configuración de contraseñas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /settings/password-policy - Actualizar configuración de política de contraseñas
router.put('/password-policy', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { password_min_length, password_require_special, password_require_numbers } = req.body;
    
    // Validar valores
    if (!password_min_length || isNaN(password_min_length) || password_min_length < 6 || password_min_length > 20) {
      return res.status(400).json({ message: 'La longitud mínima debe ser entre 6 y 20 caracteres' });
    }
    
    const settings = [
      { key: 'password_min_length', value: password_min_length.toString() },
      { key: 'password_require_special', value: password_require_special ? 'true' : 'false' },
      { key: 'password_require_numbers', value: password_require_numbers ? 'true' : 'false' }
    ];
    
    // Usar transacción para actualizar todas las configuraciones
    const connection = await req.tenantDb.getConnection();
    await connection.beginTransaction();
    
    try {
      for (const setting of settings) {
        await connection.execute(`
          INSERT INTO SYSTEM_SETTINGS (setting_key, setting_value, updated_at) 
          VALUES (?, ?, NOW())
          ON DUPLICATE KEY UPDATE 
          setting_value = VALUES(setting_value), 
          updated_at = VALUES(updated_at)
        `, [setting.key, setting.value]);
      }
      
      await connection.commit();
      
      // Registrar auditoría
      const auditDescription = `Configuración de política de contraseñas actualizada: longitud mínima=${password_min_length}, especiales=${password_require_special}, números=${password_require_numbers}`;
      await connection.execute(`
        INSERT INTO AUDIT_LOGS (user_id, action, table_name, record_id, description, timestamp) 
        VALUES (?, 'update', 'SYSTEM_SETTINGS', NULL, ?, NOW())
      `, [req.user.user_id, auditDescription]);
      
      res.json({ message: 'Configuración actualizada correctamente' });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error actualizando configuración de contraseñas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /settings/session-policy - Obtener configuración de política de sesiones
router.get('/session-policy', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [result] = await req.tenantDb.execute(`
      SELECT 
        setting_key, 
        setting_value 
      FROM SYSTEM_SETTINGS 
      WHERE setting_key IN ('session_duration', 'auto_logout', 'auto_logout_time')
    `);
    
    // Convertir array de configuraciones a objeto
    const settings = {};
    result.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    // Valores por defecto si no existen
    const defaultSettings = {
      session_duration: '3600', // 1 hora en segundos
      auto_logout: 'true',
      auto_logout_time: '1800' // 30 minutos en segundos
    };
    
    res.json({
      ...defaultSettings,
      ...settings,
      // Convertir string 'true'/'false' a boolean para auto_logout
      auto_logout: (settings.auto_logout || defaultSettings.auto_logout) === 'true'
    });
    
  } catch (error) {
    console.error('Error obteniendo configuración de sesiones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /settings/session-policy - Actualizar configuración de política de sesiones
router.put('/session-policy', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { session_duration, auto_logout, auto_logout_time } = req.body;
    
    // Validar valores
    if (!session_duration || isNaN(session_duration) || session_duration < 900 || session_duration > 86400) {
      return res.status(400).json({ message: 'La duración de sesión debe ser entre 15 minutos y 24 horas' });
    }
    
    if (auto_logout && auto_logout_time && (isNaN(auto_logout_time) || auto_logout_time < 300 || auto_logout_time > 7200)) {
      return res.status(400).json({ message: 'El tiempo de auto-logout debe ser entre 5 minutos y 2 horas' });
    }
    
    const settings = [
      { key: 'session_duration', value: session_duration.toString() },
      { key: 'auto_logout', value: auto_logout ? 'true' : 'false' }
    ];
    
    if (auto_logout && auto_logout_time) {
      settings.push({ key: 'auto_logout_time', value: auto_logout_time.toString() });
    }
    
    // Usar transacción para actualizar todas las configuraciones
    const connection = await req.tenantDb.getConnection();
    await connection.beginTransaction();
    
    try {
      for (const setting of settings) {
        await connection.execute(`
          INSERT INTO SYSTEM_SETTINGS (setting_key, setting_value, updated_at) 
          VALUES (?, ?, NOW())
          ON DUPLICATE KEY UPDATE 
          setting_value = VALUES(setting_value), 
          updated_at = VALUES(updated_at)
        `, [setting.key, setting.value]);
      }
      
      await connection.commit();
      
      // Registrar auditoría
      const auditDescription = `Configuración de política de sesiones actualizada: duration=${session_duration}s, auto-logout=${auto_logout}, logout-time=${auto_logout_time || 'N/A'}s`;
      await connection.execute(`
        INSERT INTO AUDIT_LOGS (user_id, action, table_name, record_id, description, timestamp) 
        VALUES (?, 'update', 'SYSTEM_SETTINGS', NULL, ?, NOW())
      `, [req.user.user_id, auditDescription]);
      
      res.json({ message: 'Configuración actualizada correctamente' });
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Error actualizando configuración de sesiones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;