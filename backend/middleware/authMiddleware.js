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
  console.log('🍪 Cookies recibidas:', req.cookies);
  const token = req.cookies.token; // Leer token desde la cookie
  console.log('🔑 Token extraído:', token ? 'EXISTE' : 'NO EXISTE');

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    console.log('🔐 Verificando token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decodificado:', decoded);
    
    let rows = [];
    
    // Intentar primero con la base de datos del tenant si está disponible
    if (req.tenantDb) {
      console.log('🏢 Buscando usuario en tenant DB...');
      try {
        [rows] = await req.tenantDb.execute('SELECT user_id, role, email FROM USERS WHERE user_id = ?', [decoded.user_id]);
        console.log('👤 Usuario encontrado en tenant DB:', rows.length > 0);
      } catch (tenantErr) {
        console.log('⚠️ Error buscando en tenant DB:', tenantErr.message);
      }
    }
    
    // Si no se encontró en el tenant DB, buscar en la DB principal
    if (rows.length === 0) {
      console.log('🔍 Buscando usuario en DB principal...');
      [rows] = await pool.execute('SELECT user_id, role, email FROM USERS WHERE user_id = ?', [decoded.user_id]);
      console.log('👤 Usuario encontrado en DB principal:', rows.length > 0);
    }

    if (rows.length === 0) {
      console.log('❌ Usuario no encontrado en ninguna DB');
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    console.log('✅ Usuario autenticado:', rows[0]);
    req.user = rows[0]; // Adjunta la información del usuario al objeto req
    next(); // Continúa a la ruta protegida
  } catch (err) {
    console.error('❌ Error al verificar el token:', err);
    return res.status(403).json({ message: 'Token inválido' });
  }
}

module.exports = authenticateToken;
