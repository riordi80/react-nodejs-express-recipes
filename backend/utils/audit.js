// utils/audit.js
const mysql = require('mysql2/promise');

// Configura la conexión a tu base de datos
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/**
 * Registra una acción en la tabla AUDIT_LOGS
 * @param {number|null} user_id - ID del usuario (puede ser null si no hay token)
 * @param {string} action - 'create', 'update', 'delete', 'login'
 * @param {string} table_name - Nombre de la tabla afectada (ej. 'INGREDIENTS')
 * @param {number|null} record_id - ID del registro afectado (puede ser null)
 * @param {string} description - Descripción opcional
 */
async function logAudit(user_id, action, table_name, record_id, description) {
  try {
    await pool.query(`
      INSERT INTO AUDIT_LOGS (user_id, action, table_name, record_id, description)
      VALUES (?, ?, ?, ?, ?)
    `, [user_id, action, table_name, record_id, description]);
  } catch (err) {
    console.error('Error al registrar auditoría:', err);
    // No lanzar error para no interrumpir flujo principal
  }
}

module.exports = logAudit;
