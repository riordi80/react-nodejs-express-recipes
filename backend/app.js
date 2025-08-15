// app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const authenticateToken = require('./middleware/authMiddleware');
const refreshCookie     = require('./middleware/refreshCookie');
const { resolveTenant, attachTenantDatabase } = require('./middleware/tenant');
const backupManager     = require('./utils/backupManager');

const app = express();

// Configuración de .env
const PORT          = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost`;
const TENANT_BASE_URL = process.env.TENANT_BASE_URL || 'localhost';
const MAIN_DOMAIN = process.env.MAIN_DOMAIN || 'localhost';
const PROTOCOL = process.env.PROTOCOL || 'http';


// 1) CORS y credenciales - multi-tenant con soporte para subdominios
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origen (ej: mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // Para multi-tenant: permitir cualquier subdominio del dominio base
    const allowedDomains = [
      CLIENT_ORIGIN, // Dominio principal configurado
      new RegExp(`^${PROTOCOL}:\\/\\/[a-z0-9-]+\\.${TENANT_BASE_URL.replace('.', '\\.')}$`), // Cualquier subdominio tenant
      /^http:\/\/[a-z0-9-]+\.localhost:5173$/, // Desarrollo local con subdominios
      /^http:\/\/localhost:3000$/, // Desarrollo local Next.js
      /^http:\/\/localhost:5173$/, // Desarrollo local Vite
    ];
    
    // Verificar si el origen coincide con algún patrón permitido
    const isAllowed = allowedDomains.some(domain => {
      if (typeof domain === 'string') {
        return origin === domain;
      } else {
        return domain.test(origin);
      }
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`No permitido por CORS. Origen: ${origin}`));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

// 2) Parsers
app.use(express.json());
app.use(cookieParser());

// 3) Swagger UI (ruta y archivo definidos en .env si quieres)
const swaggerDocument = YAML.load(
  path.join(__dirname, 'docs', 'swagger.yaml')
);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 4a) Middleware condicional para tenant - solo para subdominios
app.use('/api', (req, res, next) => {
  const hostname = req.get('host') || req.hostname;
  const cleanHostname = hostname.split(':')[0];
  
  // Si es el dominio principal, saltar tenant middleware para permitir /find-tenant
  if (cleanHostname === MAIN_DOMAIN) {
    return next();
  }
  
  // Si es console.ordidev.com, tratarlo como dominio principal (sin tenant)
  if (cleanHostname === `console.${TENANT_BASE_URL}`) {
    return next();
  }
  
  // Para subdominios, aplicar tenant middleware
  resolveTenant(req, res, (err) => {
    if (err) return next(err);
    attachTenantDatabase(req, res, next);
  });
});

// 4b) Rutas de auth públicas (login, find-tenant, logout) — NO requieren autenticación
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);

// 4c) Rutas de SuperAdmin - Sistema de administración (usa base de datos master)
app.use('/api/superadmin', require('./routes/superadmin'));

// 4d) Middleware de autenticación condicional - excluir rutas públicas
app.use('/api', (req, res, next) => {
  // Rutas públicas que NO requieren autenticación
  const publicPaths = ['/find-tenant', '/login', '/logout'];
  // SuperAdmin tiene su propio middleware de autenticación
  const isSuperAdminPath = req.path.startsWith('/superadmin');
  const isPublicPath = publicPaths.some(path => req.path === path);
  
  if (isPublicPath || isSuperAdminPath) {
    return next(); // Saltar autenticación para rutas públicas y SuperAdmin
  }
  
  // Para el resto de rutas, aplicar autenticación
  authenticateToken(req, res, (err) => {
    if (err) return next(err);
    refreshCookie(req, res, next);
  });
});

// 4c) Resto de routers ya protegidos y con sesión rolling
app.use('/api/users',          require('./routes/users'));
app.use('/api/ingredients',    require('./routes/ingredients'));
app.use('/api/recipes',        require('./routes/recipes'));
app.use('/api/recipe-categories', require('./routes/recipeCategories'));
app.use('/api/recipeSections', require('./routes/recipeSections'));
app.use('/api/menus',          require('./routes/menus'));
app.use('/api/suppliers',      require('./routes/suppliers'));
app.use('/api/inventory',      require('./routes/inventory'));
app.use('/api/taxes',          require('./routes/taxes'));
app.use('/api/allergens',      require('./routes/allergens'));
app.use('/api/ingredient-categories', require('./routes/ingredient-categories'));
app.use('/api/events',         require('./routes/events'));
app.use('/api/dashboard',      require('./routes/dashboard'));
app.use('/api/audit',          require('./routes/audit'));
app.use('/api/settings',       require('./routes/settings'));
app.use('/api/data',           require('./routes/data'));
app.use('/api/supplier-orders', require('./routes/supplier-orders'));
app.use('/api/restaurant-info', require('./routes/restaurant-info'));

// 4d) Rutas de SaaS existentes (mantener)
app.use('/api/saas', require('./routes/saas'));

// 5) Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'API Recetario - Servidor funcionando correctamente',
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      docs: '/docs',
      api: '/api/*'
    }
  });
});

// 6) Healthcheck
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    uptime:    process.uptime(),
    timestamp: Date.now(),
  });
});

// 7) Inicializar BackupManager
backupManager.initialize().catch(error => {
  console.error('Error initializing backup manager:', error);
});

// 8) Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor corriendo en ${BACKEND_URL}:${PORT}`);
});

// 9) Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  console.log(`\n🔄 ${signal} received, shutting down gracefully...`);
  
  // Timeout de seguridad - forzar cierre después de 10 segundos
  const forceTimeout = setTimeout(() => {
    console.log('⚠️  Force shutdown after 10s timeout');
    process.exit(1);
  }, 10000);
  
  try {
    // 1. Parar de aceptar nuevas conexiones
    console.log('🔒 Closing HTTP server...');
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          console.error('❌ Error closing HTTP server:', err);
          reject(err);
        } else {
          console.log('✅ HTTP server closed');
          resolve();
        }
      });
    });
    
    // 2. Cerrar conexiones de base de datos
    console.log('🗃️  Closing database connections...');
    
    // Cerrar masterPool de auth.js si existe
    try {
      const authModule = require('./routes/auth');
      if (authModule.masterPool && typeof authModule.masterPool.end === 'function') {
        console.log('🔄 Closing master database pool...');
        await authModule.masterPool.end();
        console.log('✅ Master database pool closed');
      } else {
        console.log('ℹ️  Master pool not available');
      }
    } catch (err) {
      console.log('⚠️  Error closing master pool:', err.message);
    }
    
    // Cerrar otros pools si existen (tenantResolver, etc.)
    try {
      const { closeTenantPools } = require('./middleware/tenant');
      if (typeof closeTenantPools === 'function') {
        await closeTenantPools();
        console.log('✅ Tenant database pools closed');
      }
    } catch (err) {
      console.log('ℹ️  Tenant pools cleanup not available');
    }
    
    // 3. Cleanup backupManager si tiene método de cierre
    try {
      if (backupManager && typeof backupManager.cleanup === 'function') {
        await backupManager.cleanup();
        console.log('✅ Backup manager cleaned up');
      }
    } catch (err) {
      console.log('ℹ️  Backup manager cleanup not available');
    }
    
    console.log('✅ Graceful shutdown completed');
    clearTimeout(forceTimeout);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    clearTimeout(forceTimeout);
    process.exit(1);
  }
};

// Escuchar señales de cierre
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM signal received');
  gracefulShutdown('SIGTERM');
}); // PM2 restart/stop

process.on('SIGINT', () => {
  console.log('📡 SIGINT signal received');
  gracefulShutdown('SIGINT');
}); // Ctrl+C manual

process.on('SIGUSR2', () => {
  console.log('📡 SIGUSR2 signal received');
  gracefulShutdown('SIGUSR2');
}); // Nodemon restart

// Debug: mostrar qué mantiene el proceso vivo
process.on('exit', (code) => {
  console.log(`🔚 Process exiting with code: ${code}`);
});

console.log('🎯 Graceful shutdown handlers registered');

// Manejar excepciones no capturadas
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});
