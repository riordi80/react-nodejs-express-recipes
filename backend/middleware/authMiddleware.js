// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// Configura la conexión a tu base de datos
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function authenticateToken(req, res, next) {
  const token = req.cookies.token; // Leer token desde la cookie

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.execute('SELECT user_id, role, email FROM USERS WHERE user_id = ?', [decoded.user_id]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    req.user = rows[0]; // Adjunta la información del usuario al objeto req
    next(); // Continúa a la ruta protegida
  } catch (err) {
    console.error('Error al verificar el token:', err);
    return res.status(403).json({ message: 'Token inválido' });
  }
}

module.exports = authenticateToken;
