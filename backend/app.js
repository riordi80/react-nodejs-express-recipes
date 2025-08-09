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
  
  // Para subdominios, aplicar tenant middleware
  resolveTenant(req, res, (err) => {
    if (err) return next(err);
    attachTenantDatabase(req, res, next);
  });
});

// 4b) Rutas de auth públicas (login, find-tenant, logout) — NO requieren autenticación
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);

// 4c) Middleware de autenticación condicional - excluir rutas públicas
app.use('/api', (req, res, next) => {
  // Rutas públicas que NO requieren autenticación
  const publicPaths = ['/find-tenant', '/login', '/logout'];
  const isPublicPath = publicPaths.some(path => req.path === path);
  
  if (isPublicPath) {
    return next(); // Saltar autenticación
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor corriendo en ${BACKEND_URL}:${PORT}`);
});
