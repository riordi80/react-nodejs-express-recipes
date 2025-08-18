// routes/superadmin/monitoring.js
const express = require('express');
const mysql = require('mysql2/promise');
const os = require('os');
const fs = require('fs').promises;
const { requirePermission } = require('../../middleware/superAdminMiddleware');

const router = express.Router();

// Pool de conexiones a la base de datos maestra
const masterPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'recetario_master',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * GET /api/superadmin/monitoring/system-health
 * Estado de salud del sistema
 */
router.get('/system-health', requirePermission('access_monitoring'), async (req, res) => {
    try {
        // Métricas básicas del sistema
        const [dbMetrics] = await masterPool.execute(`
            SELECT 
                COUNT(*) as total_connections,
                VERSION() as mysql_version
            FROM INFORMATION_SCHEMA.PROCESSLIST
        `);

        // Tamaño de bases de datos
        const [dbSizes] = await masterPool.execute(`
            SELECT 
                TABLE_SCHEMA as database_name,
                ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA LIKE 'recetario_%'
            GROUP BY TABLE_SCHEMA
            ORDER BY size_mb DESC
        `);

        // Métricas del sistema operativo
        const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

        // Estado de la aplicación Node.js
        const nodeMemory = process.memoryUsage();
        
        // Verificar espacio en disco (Linux/Unix)
        let diskUsage = null;
        try {
            const stats = await fs.stat('/');
            diskUsage = {
                available: 'Estimación no disponible',
                status: 'ok'
            };
        } catch {
            diskUsage = { status: 'error', message: 'No se pudo obtener info del disco' };
        }

        // Calcular estado general del sistema
        const systemStatus = {
            overall: 'healthy',
            warnings: [],
            errors: []
        };

        if (cpuUsage > 80) {
            systemStatus.warnings.push('Alto uso de CPU');
            systemStatus.overall = 'warning';
        }
        if (memoryUsage > 85) {
            systemStatus.warnings.push('Uso de memoria elevado');
            systemStatus.overall = 'warning';
        }
        if (cpuUsage > 95 || memoryUsage > 95) {
            systemStatus.errors.push('Recursos del sistema críticos');
            systemStatus.overall = 'critical';
        }

        res.json({
            success: true,
            data: {
                database: {
                    ...dbMetrics[0],
                    sizes: dbSizes,
                    status: 'connected'
                },
                system: {
                    uptime: process.uptime(),
                    cpu_usage: Math.round(cpuUsage * 100) / 100,
                    memory_usage: Math.round(memoryUsage * 100) / 100,
                    memory_total_gb: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100,
                    memory_free_gb: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100,
                    node_version: process.version,
                    platform: os.platform(),
                    arch: os.arch(),
                    disk: diskUsage
                },
                node: {
                    memory: {
                        rss_mb: Math.round(nodeMemory.rss / 1024 / 1024),
                        heap_used_mb: Math.round(nodeMemory.heapUsed / 1024 / 1024),
                        heap_total_mb: Math.round(nodeMemory.heapTotal / 1024 / 1024),
                        external_mb: Math.round(nodeMemory.external / 1024 / 1024)
                    },
                    uptime_hours: Math.round(process.uptime() / 3600 * 100) / 100
                },
                status: systemStatus,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error obteniendo salud del sistema:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener estado del sistema'
        });
    }
});

/**
 * GET /api/superadmin/monitoring/alerts
 * Alertas del sistema
 */
router.get('/alerts', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const { filter = 'all' } = req.query;
        
        // Por ahora retornamos alertas simuladas
        // En producción estas vendrían de un sistema de monitoreo real
        const mockAlerts = [
            {
                alert_id: '1',
                type: 'critical',
                title: 'Alto uso de CPU en servidor principal',
                message: 'El servidor DB-01 está experimentando un uso de CPU del 89% durante los últimos 15 minutos.',
                created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                action_required: true,
                affected_tenants: ['tenant-restaurant-abc', 'tenant-pizzeria-roma']
            },
            {
                alert_id: '2',
                type: 'warning',
                title: 'Tenant con pagos pendientes',
                message: 'El tenant "restaurant-moroso" tiene 3 intentos de pago fallidos.',
                created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                action_required: true,
                affected_tenants: ['tenant-restaurant-moroso']
            }
        ];
        
        let filteredAlerts = mockAlerts;
        
        if (filter === 'critical') {
            filteredAlerts = mockAlerts.filter(a => a.type === 'critical');
        } else if (filter === 'warning') {
            filteredAlerts = mockAlerts.filter(a => a.type === 'warning');
        } else if (filter === 'unresolved') {
            filteredAlerts = mockAlerts.filter(a => !a.resolved_at);
        }
        
        res.json({
            success: true,
            data: filteredAlerts
        });
        
    } catch (error) {
        console.error('Error obteniendo alertas:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener alertas del sistema'
        });
    }
});

/**
 * POST /api/superadmin/monitoring/alerts/:id/resolve
 * Resolver una alerta
 */
router.post('/alerts/:id/resolve', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const { id } = req.params;
        
        // En producción actualizaría la alerta en la base de datos
        // Por ahora solo simulamos la respuesta
        
        res.json({
            success: true,
            message: 'Alerta marcada como resuelta'
        });
        
    } catch (error) {
        console.error('Error resolviendo alerta:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al resolver alerta'
        });
    }
});

/**
 * GET /api/superadmin/monitoring/system-metrics
 * Métricas detalladas del sistema
 */
router.get('/system-metrics', requirePermission('access_monitoring'), async (req, res) => {
    try {
        // Obtener métricas de la base de datos
        const [dbMetrics] = await masterPool.execute(`
            SELECT 
                COUNT(DISTINCT table_schema) as total_databases,
                ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as total_size_mb,
                COUNT(*) as total_tables
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA LIKE 'recetario_%'
        `);
        
        // Métricas de conexiones activas
        const [connectionMetrics] = await masterPool.execute(`
            SELECT COUNT(*) as active_connections
            FROM INFORMATION_SCHEMA.PROCESSLIST
            WHERE DB LIKE 'recetario_%'
        `);
        
        // Métricas REALES del sistema operativo
        const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
        
        const systemMetrics = {
            cpu_usage: Math.round(cpuUsage * 100) / 100, // CPU REAL
            memory_usage: Math.round(memoryUsage * 100) / 100, // MEMORIA REAL
            memory_total_gb: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100,
            memory_free_gb: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100,
            uptime_hours: process.uptime() / 3600,
            platform: os.platform(),
            arch: os.arch(),
            node_version: process.version
        };
        
        res.json({
            success: true,
            data: {
                database: {
                    ...dbMetrics[0],
                    ...connectionMetrics[0]
                },
                system: systemMetrics,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo métricas del sistema:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener métricas del sistema'
        });
    }
});

/**
 * GET /api/superadmin/monitoring/audit-logs
 * Logs de auditoría
 */
router.get('/audit-logs', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const { page = 1, limit = 50, action_type, user_id } = req.query;
        const offset = (page - 1) * limit;

        let whereConditions = [];
        let queryParams = [];

        if (action_type) {
            whereConditions.push('al.action_type = ?');
            queryParams.push(action_type);
        }

        if (user_id) {
            whereConditions.push('al.user_id = ?');
            queryParams.push(user_id);
        }

        const whereClause = whereConditions.length > 0 ? 
            `WHERE ${whereConditions.join(' AND ')}` : '';

        const [logs] = await masterPool.execute(`
            SELECT 
                al.*,
                mu.first_name,
                mu.last_name,
                mu.email,
                t.business_name as target_tenant_name
            FROM SUPERADMIN_AUDIT_LOG al
            JOIN MASTER_USERS mu ON al.user_id = mu.user_id
            LEFT JOIN TENANTS t ON al.target_tenant_id = t.tenant_id
            ${whereClause}
            ORDER BY al.performed_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, parseInt(limit), parseInt(offset)]);

        res.json({
            success: true,
            data: logs
        });

    } catch (error) {
        console.error('Error obteniendo logs de auditoría:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener logs de auditoría'
        });
    }
});

/**
 * GET /api/superadmin/monitoring/performance
 * Métricas de rendimiento de la API
 */
router.get('/performance', requirePermission('access_monitoring'), async (req, res) => {
    try {
        // Simular métricas de rendimiento
        // En producción estas vendrían de un sistema de monitoreo como Prometheus
        const performanceData = {
            api_calls_last_hour: Math.floor(Math.random() * 5000 + 1000),
            avg_response_time_ms: Math.random() * 200 + 50,
            error_rate_percent: Math.random() * 5,
            requests_per_minute: Math.floor(Math.random() * 100 + 20),
            popular_endpoints: [
                { endpoint: '/api/recipes', calls: 1250, avg_time: 145 },
                { endpoint: '/api/events', calls: 890, avg_time: 95 },
                { endpoint: '/api/suppliers', calls: 720, avg_time: 110 },
                { endpoint: '/api/auth/me', calls: 2100, avg_time: 25 },
                { endpoint: '/api/ingredients', calls: 650, avg_time: 130 }
            ],
            hourly_traffic: Array.from({ length: 24 }, (_, i) => ({
                hour: i,
                requests: Math.floor(Math.random() * 500 + 100)
            }))
        };
        
        res.json({
            success: true,
            data: performanceData
        });
        
    } catch (error) {
        console.error('Error obteniendo métricas de rendimiento:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener métricas de rendimiento'
        });
    }
});

/**
 * GET /api/superadmin/monitoring/tenants-health
 * Estado de salud de todos los tenants
 */
router.get('/tenants-health', requirePermission('access_monitoring'), async (req, res) => {
    try {
        // Obtener todos los tenants activos
        const [tenants] = await masterPool.execute(`
            SELECT tenant_id, subdomain, business_name, subscription_status, created_at
            FROM TENANTS 
            WHERE status = 'active'
            ORDER BY business_name
        `);

        const tenantsHealth = [];

        for (const tenant of tenants) {
            try {
                // Crear pool temporal para cada tenant
                const tenantPool = mysql.createPool({
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: `recetario_${tenant.subdomain}`,
                    waitForConnections: true,
                    connectionLimit: 2,
                    queueLimit: 0,
                    acquireTimeout: 5000,
                    timeout: 10000
                });

                // Obtener métricas básicas del tenant
                const [tableCount] = await tenantPool.execute('SHOW TABLES');
                const [userCount] = await tenantPool.execute('SELECT COUNT(*) as count FROM USERS WHERE is_active = TRUE');
                const [recipeCount] = await tenantPool.execute('SELECT COUNT(*) as count FROM RECIPES');
                
                // Verificar última actividad
                const [lastActivity] = await tenantPool.execute(`
                    SELECT MAX(created_at) as last_activity 
                    FROM AUDIT_LOGS 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                `);

                // Tamaño de la base de datos
                const [dbSize] = await tenantPool.execute(`
                    SELECT ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb
                    FROM INFORMATION_SCHEMA.TABLES
                    WHERE TABLE_SCHEMA = ?
                `, [`recetario_${tenant.subdomain}`]);

                await tenantPool.end();

                // Determinar estado de salud
                let healthStatus = 'healthy';
                const warnings = [];

                if (!lastActivity[0].last_activity) {
                    warnings.push('Sin actividad en 24h');
                    healthStatus = 'warning';
                }

                if (dbSize[0].size_mb > 500) {
                    warnings.push('Base de datos grande');
                }

                tenantsHealth.push({
                    tenant_id: tenant.tenant_id,
                    subdomain: tenant.subdomain,
                    business_name: tenant.business_name,
                    subscription_status: tenant.subscription_status,
                    health_status: healthStatus,
                    warnings: warnings,
                    metrics: {
                        tables: tableCount.length,
                        active_users: userCount[0].count,
                        recipes: recipeCount[0].count,
                        db_size_mb: dbSize[0].size_mb || 0,
                        last_activity: lastActivity[0].last_activity
                    },
                    created_at: tenant.created_at
                });

            } catch (error) {
                console.error(`Error checking health for tenant ${tenant.subdomain}:`, error.message);
                tenantsHealth.push({
                    tenant_id: tenant.tenant_id,
                    subdomain: tenant.subdomain,
                    business_name: tenant.business_name,
                    subscription_status: tenant.subscription_status,
                    health_status: 'error',
                    warnings: ['Error de conexión a la base de datos'],
                    metrics: null,
                    error: error.message,
                    created_at: tenant.created_at
                });
            }
        }

        res.json({
            success: true,
            data: {
                tenants: tenantsHealth,
                summary: {
                    total: tenantsHealth.length,
                    healthy: tenantsHealth.filter(t => t.health_status === 'healthy').length,
                    warning: tenantsHealth.filter(t => t.health_status === 'warning').length,
                    error: tenantsHealth.filter(t => t.health_status === 'error').length
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo salud de tenants:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener estado de los tenants'
        });
    }
});

/**
 * GET /api/superadmin/monitoring/real-time-metrics
 * Métricas en tiempo real del sistema
 */
router.get('/real-time-metrics', requirePermission('access_monitoring'), async (req, res) => {
    try {
        // Métricas del sistema en tiempo real
        const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

        // Métricas de la aplicación Node.js
        const nodeMemory = process.memoryUsage();
        const nodeUptime = process.uptime();

        // Métricas de base de datos
        const [dbConnections] = await masterPool.execute(`
            SELECT COUNT(*) as active_connections
            FROM INFORMATION_SCHEMA.PROCESSLIST
            WHERE DB LIKE 'recetario_%'
        `);

        const [slowQueries] = await masterPool.execute(`
            SELECT COUNT(*) as slow_queries
            FROM INFORMATION_SCHEMA.PROCESSLIST
            WHERE TIME > 5 AND DB LIKE 'recetario_%'
        `);

        // Simular métricas de API
        const currentTime = new Date();
        const apiMetrics = {
            requests_per_minute: Math.floor(Math.random() * 50 + 10),
            avg_response_time: Math.floor(Math.random() * 200 + 50),
            error_rate: Math.random() * 2,
            active_sessions: Math.floor(Math.random() * 100 + 20)
        };

        // Estado general
        let overallStatus = 'healthy';
        if (cpuUsage > 80 || memoryUsage > 85) {
            overallStatus = 'warning';
        }
        if (cpuUsage > 95 || memoryUsage > 95) {
            overallStatus = 'critical';
        }

        res.json({
            success: true,
            data: {
                timestamp: currentTime.toISOString(),
                status: overallStatus,
                system: {
                    cpu_usage: Math.round(cpuUsage * 100) / 100,
                    memory_usage: Math.round(memoryUsage * 100) / 100,
                    memory_available_gb: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100,
                    uptime_seconds: Math.floor(nodeUptime)
                },
                application: {
                    heap_used_mb: Math.round(nodeMemory.heapUsed / 1024 / 1024),
                    heap_total_mb: Math.round(nodeMemory.heapTotal / 1024 / 1024),
                    rss_mb: Math.round(nodeMemory.rss / 1024 / 1024),
                    external_mb: Math.round(nodeMemory.external / 1024 / 1024)
                },
                database: {
                    active_connections: dbConnections[0].active_connections,
                    slow_queries: slowQueries[0].slow_queries,
                    status: 'connected'
                },
                api: apiMetrics
            }
        });

    } catch (error) {
        console.error('Error obteniendo métricas en tiempo real:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener métricas en tiempo real'
        });
    }
});

/**
 * GET /api/superadmin/monitoring/security-events
 * Eventos de seguridad y intentos de login fallidos
 */
router.get('/security-events', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const { page = 1, limit = 50, event_type, severity } = req.query;
        const offset = (page - 1) * limit;

        // Por ahora simulamos eventos de seguridad
        // En producción esto vendría de logs de seguridad reales
        const mockSecurityEvents = [
            {
                event_id: '1',
                event_type: 'failed_login',
                severity: 'medium',
                ip_address: '192.168.1.100',
                user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                email_attempted: 'admin@test.com',
                tenant_subdomain: 'restaurant-test',
                timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
                details: 'Múltiples intentos de login fallidos desde la misma IP'
            },
            {
                event_id: '2',
                event_type: 'suspicious_activity',
                severity: 'high',
                ip_address: '10.0.0.50',
                user_agent: 'curl/7.68.0',
                email_attempted: null,
                tenant_subdomain: null,
                timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
                details: 'Intento de acceso a endpoint no autorizado desde bot'
            },
            {
                event_id: '3',
                event_type: 'brute_force',
                severity: 'high',
                ip_address: '203.0.113.195',
                user_agent: 'python-requests/2.25.1',
                email_attempted: 'admin@example.com',
                tenant_subdomain: 'pizzeria-roma',
                timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
                details: '15 intentos de login en 5 minutos desde la misma IP'
            }
        ];

        let filteredEvents = mockSecurityEvents;

        if (event_type && event_type !== 'all') {
            filteredEvents = filteredEvents.filter(e => e.event_type === event_type);
        }

        if (severity && severity !== 'all') {
            filteredEvents = filteredEvents.filter(e => e.severity === severity);
        }

        // Simular paginación
        const paginatedEvents = filteredEvents.slice(offset, offset + parseInt(limit));
        const total = filteredEvents.length;

        res.json({
            success: true,
            data: {
                events: paginatedEvents,
                pagination: {
                    current_page: parseInt(page),
                    per_page: parseInt(limit),
                    total_items: total,
                    total_pages: Math.ceil(total / limit)
                },
                summary: {
                    total_events: total,
                    high_severity: filteredEvents.filter(e => e.severity === 'high').length,
                    medium_severity: filteredEvents.filter(e => e.severity === 'medium').length,
                    low_severity: filteredEvents.filter(e => e.severity === 'low').length
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo eventos de seguridad:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener eventos de seguridad'
        });
    }
});

module.exports = router;