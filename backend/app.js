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
const backupManager     = require('./utils/backupManager');

const app = express();

// Configuración de .env
const PORT          = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost`;


// 1) CORS y credenciales - origen específico según configuración
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origen (ej: mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // Para Cloudflare, también permitir orígenes que empiecen con https://dev.ordidev.com
    const isCloudflare = process.env.USE_CLOUDFLARE === 'true';
    if (isCloudflare && origin && origin.startsWith('https://dev.ordidev.com')) {
      return callback(null, true);
    }
    
    if (origin === CLIENT_ORIGIN) {
      callback(null, true);
    } else {
      callback(new Error(`No permitido por CORS. Origen: ${origin}, Esperado: ${CLIENT_ORIGIN}`));
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

// 4a) Rutas de auth (login, me, logout) — no renovamos la cookie aquí
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);

// 4b) Middleware global: autenticar y luego renovar cookie
app.use('/api', authenticateToken, refreshCookie);

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
