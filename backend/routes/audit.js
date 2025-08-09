// routes/audit.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Multi-tenant: usar req.tenantDb en lugar de pool estático

// GET /audit/logs - Obtener logs de auditoría (solo admin)
router.get('/logs', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action = null, 
      table_name = null,
      start_date = null,
      end_date = null 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereClause = '';
    let queryParams = [];

    // Construir filtros
    const filters = [];
    if (action && action !== 'null' && action !== '') {
      filters.push('action = ?');
      queryParams.push(action);
    }
    if (table_name && table_name !== 'null' && table_name !== '') {
      filters.push('table_name = ?');
      queryParams.push(table_name);
    }
    if (start_date && start_date !== 'null' && start_date !== '') {
      filters.push('timestamp >= ?');
      queryParams.push(start_date);
    }
    if (end_date && end_date !== 'null' && end_date !== '') {
      filters.push('timestamp <= ?');
      queryParams.push(end_date);
    }

    if (filters.length > 0) {
      whereClause = 'WHERE ' + filters.join(' AND ');
    }

    // Consulta principal con información del usuario
    const logsQuery = `
      SELECT 
        al.audit_id,
        al.user_id,
        al.action,
        al.table_name,
        al.record_id,
        al.description,
        al.timestamp,
        CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as user_name,
        u.email as user_email,
        u.role as user_role
      FROM AUDIT_LOGS al
      LEFT JOIN USERS u ON al.user_id = u.user_id
      ${whereClause}
      ORDER BY al.timestamp DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;

    // Consulta para contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM AUDIT_LOGS al
      ${whereClause}
    `;

    // Ejecutar consultas
    const [logsResult] = await req.tenantDb.execute(logsQuery, queryParams);
    const [countResult] = await req.tenantDb.execute(countQuery, queryParams);

    const totalRecords = countResult[0].total;
    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      logs: logsResult,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_records: totalRecords,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo logs de auditoría:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /audit/summary - Obtener resumen de actividad (solo admin)
router.get('/summary', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Resumen de actividad por acción
    const [actionSummary] = await req.tenantDb.execute(`
      SELECT 
        action,
        COUNT(*) as count
      FROM AUDIT_LOGS 
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY action
      ORDER BY count DESC
    `, [days]);

    // Resumen de actividad por tabla
    const [tableSummary] = await req.tenantDb.execute(`
      SELECT 
        table_name,
        COUNT(*) as count
      FROM AUDIT_LOGS 
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY table_name
      ORDER BY count DESC
    `, [days]);

    // Resumen de actividad por usuario
    const [userSummary] = await req.tenantDb.execute(`
      SELECT 
        al.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email,
        COUNT(*) as count
      FROM AUDIT_LOGS al
      LEFT JOIN USERS u ON al.user_id = u.user_id
      WHERE al.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY al.user_id, u.first_name, u.last_name, u.email
      ORDER BY count DESC
      LIMIT 10
    `, [days]);

    // Actividad reciente
    const [recentActivity] = await req.tenantDb.execute(`
      SELECT 
        al.action,
        al.table_name,
        al.description,
        al.timestamp,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM AUDIT_LOGS al
      LEFT JOIN USERS u ON al.user_id = u.user_id
      WHERE al.timestamp >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY al.timestamp DESC
      LIMIT 20
    `, [days]);

    res.json({
      period_days: parseInt(days),
      summary: {
        by_action: actionSummary,
        by_table: tableSummary,
        by_user: userSummary,
        recent_activity: recentActivity
      }
    });

  } catch (error) {
    console.error('Error obteniendo resumen de auditoría:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /audit/test - Verificar si hay datos en AUDIT_LOGS (solo admin)
router.get('/test', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Verificar si existe la tabla
    const [tableCheck] = await req.tenantDb.execute("SHOW TABLES LIKE 'AUDIT_LOGS'");
    
    if (tableCheck.length === 0) {
      return res.json({ 
        message: 'La tabla AUDIT_LOGS no existe',
        table_exists: false 
      });
    }
    
    // Contar registros totales
    const [countResult] = await req.tenantDb.execute('SELECT COUNT(*) as total FROM AUDIT_LOGS');
    
    // Obtener algunos registros de ejemplo
    const [sampleResult] = await req.tenantDb.execute('SELECT * FROM AUDIT_LOGS ORDER BY timestamp DESC LIMIT 5');
    
    res.json({
      table_exists: true,
      total_records: countResult[0].total,
      sample_records: sampleResult
    });
    
  } catch (error) {
    console.error('Error en audit test:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
});

module.exports = router;