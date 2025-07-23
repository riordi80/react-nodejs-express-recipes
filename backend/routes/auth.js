// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/authMiddleware');

// Configura la conexión a tu base de datos
const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Función para obtener configuración de sesión
async function getSessionConfig() {
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
    return {
      session_timeout: parseInt(settings.session_timeout) || 120, // en minutos
      session_auto_close: settings.session_auto_close === 'true'
    };
  } catch (error) {
    console.error('Error obteniendo configuración de sesión:', error);
    // Valores por defecto en caso de error
    return {
      session_timeout: 120,
      session_auto_close: false
    };
  }
}

// POST /login — Iniciar sesión
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1) Buscar usuario
    const [rows] = await pool.execute(
      'SELECT user_id, first_name, last_name, email, password_hash, role, language, timezone FROM USERS WHERE email = ?',
      [email]
    );
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }
    const user = rows[0];

    // 2) Verificar contraseña
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }

    // 3) Obtener configuración de sesión
    const sessionConfig = await getSessionConfig();
    
    // 4) Generar JWT con configuración dinámica
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: `${sessionConfig.session_timeout}m` }
    );

    // 5) Enviar cookie
    const isProd = process.env.NODE_ENV === 'production';
    const isCloudflare = process.env.USE_CLOUDFLARE === 'true';
    const userAgent = req.headers['user-agent'] || '';
    const isAndroidMobile = /Android.*Mobile/i.test(userAgent);
    
    const cookieOptions = {
      httpOnly: true,
      maxAge: sessionConfig.session_timeout * 60 * 1000, // convertir minutos a milisegundos
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
      
      // Para móviles Android, omitir partitioned que puede causar problemas
      if (!isAndroidMobile) {
        cookieOptions.partitioned = true;
      }
      // No especificar domain para que use el dominio actual (api.ordidev.com)
    } else {
      // Configuración para desarrollo local
      cookieOptions.secure = isProd;
      cookieOptions.sameSite = isProd ? 'none' : 'lax';
    }
    
    res
      .cookie('token', token, cookieOptions)
      .json({
        ok: true,
        user: {
          user_id: user.user_id,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          email: user.email,
          language: user.language,
          timezone: user.timezone
        },
      });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// GET /me — Verificar sesión activa
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Obtener información completa del usuario
    const [rows] = await pool.execute(
      'SELECT user_id, first_name, last_name, email, role, language, timezone FROM USERS WHERE user_id = ?',
      [req.user.user_id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    const user = rows[0];
    res.json({ 
      authenticated: true, 
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        language: user.language,
        timezone: user.timezone
      }
    });
  } catch (err) {
    console.error('Error en /me:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /profile — Actualizar perfil del usuario
router.put('/profile', authenticateToken, async (req, res) => {
  const { first_name, last_name, email, language, timezone } = req.body;
  
  try {
    // Validar datos requeridos
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ 
        message: 'Nombre, apellidos y email son obligatorios' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Formato de email inválido' 
      });
    }

    // Verificar si el email ya existe (solo si cambió)
    const [currentUser] = await pool.execute(
      'SELECT email FROM USERS WHERE user_id = ?',
      [req.user.user_id]
    );

    if (currentUser[0].email !== email) {
      const [existingUser] = await pool.execute(
        'SELECT user_id FROM USERS WHERE email = ? AND user_id != ?',
        [email, req.user.user_id]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ 
          message: 'Este email ya está en uso por otro usuario' 
        });
      }
    }

    // Actualizar el perfil
    await pool.execute(
      'UPDATE USERS SET first_name = ?, last_name = ?, email = ?, language = ?, timezone = ? WHERE user_id = ?',
      [first_name, last_name, email, language || 'es', timezone || 'Europe/Madrid', req.user.user_id]
    );

    // Obtener los datos actualizados
    const [updatedUser] = await pool.execute(
      'SELECT user_id, first_name, last_name, email, role, language, timezone FROM USERS WHERE user_id = ?',
      [req.user.user_id]
    );

    res.json({
      message: 'Perfil actualizado correctamente',
      user: {
        user_id: updatedUser[0].user_id,
        first_name: updatedUser[0].first_name,
        last_name: updatedUser[0].last_name,
        email: updatedUser[0].email,
        role: updatedUser[0].role,
        language: updatedUser[0].language,
        timezone: updatedUser[0].timezone
      }
    });

  } catch (err) {
    console.error('Error actualizando perfil:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// PUT /password — Cambiar contraseña
router.put('/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    // Validar datos requeridos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Contraseña actual y nueva contraseña son obligatorias' 
      });
    }

    // Obtener políticas de contraseña
    const [policyRows] = await pool.execute(`
      SELECT setting_key, setting_value 
      FROM SYSTEM_SETTINGS 
      WHERE setting_key IN ('password_min_length', 'password_require_special', 'password_require_numbers')
    `);
    
    const policies = {};
    policyRows.forEach(row => {
      policies[row.setting_key] = row.setting_value;
    });
    
    // Valores por defecto si no existen
    const minLength = parseInt(policies.password_min_length || '8');
    const requireSpecial = policies.password_require_special === 'true';
    const requireNumbers = policies.password_require_numbers === 'true';
    
    // Validar nueva contraseña según políticas
    if (newPassword.length < minLength) {
      return res.status(400).json({ 
        message: `La nueva contraseña debe tener al menos ${minLength} caracteres` 
      });
    }
    
    if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return res.status(400).json({ 
        message: 'La nueva contraseña debe incluir al menos un carácter especial' 
      });
    }
    
    if (requireNumbers && !/\d/.test(newPassword)) {
      return res.status(400).json({ 
        message: 'La nueva contraseña debe incluir al menos un número' 
      });
    }

    // Obtener la contraseña actual del usuario
    const [rows] = await pool.execute(
      'SELECT password_hash FROM USERS WHERE user_id = ?',
      [req.user.user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña actual
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    // Generar hash de la nueva contraseña
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Actualizar contraseña
    await pool.execute(
      'UPDATE USERS SET password_hash = ? WHERE user_id = ?',
      [newPasswordHash, req.user.user_id]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });

  } catch (err) {
    console.error('Error cambiando contraseña:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// POST /logout — Cerrar sesión
router.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const isCloudflare = process.env.USE_CLOUDFLARE === 'true';
  const userAgent = req.headers['user-agent'] || '';
  const isAndroidMobile = /Android.*Mobile/i.test(userAgent);
  
  
  // Para Android móviles, intentar borrar con múltiples configuraciones
  if (isCloudflare && isAndroidMobile) {
    // Múltiples intentos de borrado para Android
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none' });
    res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'none', partitioned: true });
    res.clearCookie('token', { httpOnly: true });
    res.clearCookie('token');
  } else {
    // Configuración normal para otros dispositivos
    const clearCookieOptions = {
      httpOnly: true,
    };
    
    if (isCloudflare) {
      clearCookieOptions.secure = true;
      clearCookieOptions.sameSite = 'none';
      if (!isAndroidMobile) {
        clearCookieOptions.partitioned = true;
      }
    } else {
      clearCookieOptions.secure = isProd;
      clearCookieOptions.sameSite = isProd ? 'none' : 'lax';
    }
    
    res.clearCookie('token', clearCookieOptions);
  }
  
  res.json({ message: 'Sesión cerrada correctamente' });
});

module.exports = router;
