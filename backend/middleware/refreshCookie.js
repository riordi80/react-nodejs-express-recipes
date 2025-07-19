// middleware/refreshCookie.js
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// Configura la conexión a tu base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Cache para configuraciones de sesión (para evitar consultas constantes)
let sessionConfigCache = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 minutos de cache
};

async function getSessionConfig() {
  const now = Date.now();
  
  // Si tenemos configuración en cache y no ha expirado, usarla
  if (sessionConfigCache.data && (now - sessionConfigCache.timestamp) < sessionConfigCache.ttl) {
    return sessionConfigCache.data;
  }
  
  try {
    const [result] = await pool.execute(`
      SELECT setting_key, setting_value 
      FROM SYSTEM_SETTINGS 
      WHERE setting_key IN ('session_timeout', 'session_auto_close')
    `);
    
    const settings = {};
    result.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    // Valores por defecto si no existen
    const config = {
      session_timeout: parseInt(settings.session_timeout) || 120, // en minutos
      session_auto_close: settings.session_auto_close === 'true'
    };
    
    // Actualizar cache
    sessionConfigCache.data = config;
    sessionConfigCache.timestamp = now;
    
    return config;
  } catch (error) {
    console.error('Error obteniendo configuración de sesión:', error);
    // Valores por defecto en caso de error
    return {
      session_timeout: 120,
      session_auto_close: false
    };
  }
}

module.exports = async (req, res, next) => {
  // Si authenticateToken ha validado y dejó req.user...
  if (req.user && req.cookies.token) {
    try {
      const sessionConfig = await getSessionConfig();
      
      // Convertir minutos a milisegundos
      const sessionTimeoutMs = sessionConfig.session_timeout * 60 * 1000;
      
      // Volver a firmar un nuevo token con la configuración dinámica
      const newToken = jwt.sign(
        { user_id: req.user.user_id, role: req.user.role },
        process.env.JWT_SECRET,
        { expiresIn: `${sessionConfig.session_timeout}m` }
      );

      const isProd = process.env.NODE_ENV === 'production';
      const isCloudflare = process.env.USE_CLOUDFLARE === 'true';
      
      const cookieOptions = {
        httpOnly: true,
        maxAge: sessionTimeoutMs,
      };
      
      // Si session_auto_close está habilitado, no establecer maxAge 
      // para que la cookie sea de sesión (se elimine al cerrar navegador)
      if (sessionConfig.session_auto_close) {
        delete cookieOptions.maxAge;
      }
      
      if (isCloudflare) {
        // Configuración para Cloudflare tunnel (subdominios diferentes)
        cookieOptions.secure = true;
        cookieOptions.sameSite = 'none';
        cookieOptions.partitioned = true;
        // No especificar domain para que use el dominio actual (api.ordidev.com)
      } else {
        // Configuración para desarrollo local
        cookieOptions.secure = isProd;
        cookieOptions.sameSite = isProd ? 'none' : 'lax';
      }
      
      res.cookie('token', newToken, cookieOptions);
    } catch (error) {
      console.error('Error en refreshCookie:', error);
      // En caso de error, continuar sin refrescar la cookie
    }
  }
  next();
};
