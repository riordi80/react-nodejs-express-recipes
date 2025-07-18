// middleware/refreshCookie.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Si authenticateToken ha validado y dejó req.user...
  if (req.user && req.cookies.token) {
    // Volver a firmar un nuevo token con la misma info
    const newToken = jwt.sign(
      { user_id: req.user.user_id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    const isProd = process.env.NODE_ENV === 'production';
    const isCloudflare = process.env.USE_CLOUDFLARE === 'true';
    
    const cookieOptions = {
      httpOnly: true,
      maxAge: 2 * 60 * 60 * 1000, // 2 horas
    };
    
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
  }
  next();
};
