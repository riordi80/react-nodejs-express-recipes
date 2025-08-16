// routes/superadmin/tenants.js
const express = require('express');
const mysql = require('mysql2/promise');
const { requirePermission, auditLog } = require('../../middleware/superAdminMiddleware');

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
 * GET /api/superadmin/tenants
 * Listar todos los tenants con filtros y paginación
 */
router.get('/', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            status,
            plan,
            search,
            sort_by = 'created_at',
            sort_order = 'desc'
        } = req.query;

        // Validar sort_by para evitar SQL injection
        const allowedSortFields = ['created_at', 'business_name', 'subscription_status', 'subscription_plan', 'tenant_id'];
        const safeSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
        const safeSortOrder = ['asc', 'desc'].includes(sort_order.toLowerCase()) ? sort_order.toUpperCase() : 'DESC';

        const offset = (page - 1) * limit;
        
        // Construir WHERE clause dinámico
        let whereConditions = ['t.is_active = TRUE'];
        let queryParams = [];

        if (status && status !== 'all') {
            whereConditions.push('t.subscription_status = ?');
            queryParams.push(status);
        }

        if (plan && plan !== 'all') {
            whereConditions.push('t.subscription_plan = ?');
            queryParams.push(plan);
        }

        if (search) {
            whereConditions.push('(t.subdomain LIKE ? OR t.business_name LIKE ? OR t.admin_email LIKE ?)');
            const searchPattern = `%${search}%`;
            queryParams.push(searchPattern, searchPattern, searchPattern);
        }

        const whereClause = whereConditions.join(' AND ');
        let mainQuery, tenants;
        
        try {
            // WORKAROUND: Usar query directo para evitar problemas con prepared statements
            let directQuery = `
                SELECT t.* 
                FROM TENANTS t
                WHERE t.is_active = TRUE`;
            
            // Solo agregar filtros si existen para mantener la consulta simple
            if (status && status !== 'all') {
                directQuery += ` AND t.subscription_status = '${status.replace(/'/g, "''")}'`;
            }
            
            if (plan && plan !== 'all') {
                directQuery += ` AND t.subscription_plan = '${plan.replace(/'/g, "''")}'`;
            }
            
            if (search) {
                const safeSearch = search.replace(/'/g, "''");
                directQuery += ` AND (t.subdomain LIKE '%${safeSearch}%' OR t.business_name LIKE '%${safeSearch}%' OR t.admin_email LIKE '%${safeSearch}%')`;
            }
            
            directQuery += ` ORDER BY t.${safeSortBy} ${safeSortOrder} LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
            
            [tenants] = await masterPool.query(directQuery);
            
        } catch (queryError) {
            console.error('Error executing tenants query:', queryError.message);
            
            // Fallback a query simple
            const limitValue = parseInt(limit) || 50;
            const fallbackQuery = `
                SELECT tenant_id, subdomain, business_name, subscription_status, subscription_plan, created_at, is_active
                FROM TENANTS 
                WHERE is_active = TRUE 
                ORDER BY created_at DESC 
                LIMIT ${limitValue}
            `;
            
            [tenants] = await masterPool.query(fallbackQuery);
        }

        // Contar total para paginación
        let countQuery = `SELECT COUNT(*) as total FROM TENANTS t WHERE t.is_active = TRUE`;
        
        // Agregar los mismos filtros que en la consulta principal
        if (status && status !== 'all') {
            countQuery += ` AND t.subscription_status = '${status.replace(/'/g, "''")}'`;
        }
        
        if (plan && plan !== 'all') {
            countQuery += ` AND t.subscription_plan = '${plan.replace(/'/g, "''")}'`;
        }
        
        if (search) {
            const safeSearch = search.replace(/'/g, "''");
            countQuery += ` AND (t.subdomain LIKE '%${safeSearch}%' OR t.business_name LIKE '%${safeSearch}%' OR t.admin_email LIKE '%${safeSearch}%')`;
        }
        
        const [countResult] = await masterPool.query(countQuery);

        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                tenants,
                pagination: {
                    current_page: parseInt(page),
                    per_page: parseInt(limit),
                    total_items: total,
                    total_pages: totalPages,
                    has_next: page < totalPages,
                    has_prev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error obteniendo lista de tenants:', error.message);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener lista de tenants'
        });
    }
});

/**
 * GET /api/superadmin/tenants/stats
 * Obtener estadísticas generales de tenants
 */
router.get('/stats', requirePermission('access_monitoring'), async (req, res) => {
    try {
        // Obtener estadísticas generales
        const [statsResult] = await masterPool.execute(`
            SELECT 
                COUNT(*) as total_tenants,
                SUM(CASE WHEN subscription_status = 'active' THEN 1 ELSE 0 END) as active_tenants,
                SUM(CASE WHEN subscription_status = 'trial' THEN 1 ELSE 0 END) as trial_tenants,
                SUM(CASE WHEN subscription_status = 'suspended' THEN 1 ELSE 0 END) as suspended_tenants,
                SUM(CASE WHEN subscription_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_tenants
            FROM TENANTS 
            WHERE is_active = TRUE
        `);

        const stats = statsResult[0];

        res.json({
            success: true,
            data: {
                stats
            }
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener estadísticas'
        });
    }
});

/**
 * GET /api/superadmin/tenants/:tenantId
 * Obtener detalles de un tenant específico
 */
router.get('/:tenantId', requirePermission('access_monitoring'), async (req, res) => {
    try {
        const { tenantId } = req.params;

        // Información del tenant
        const [tenantRows] = await masterPool.execute(`
            SELECT * FROM TENANTS WHERE tenant_id = ? AND is_active = TRUE
        `, [tenantId]);

        if (tenantRows.length === 0) {
            return res.status(404).json({
                error: 'Tenant no encontrado',
                message: 'El tenant especificado no existe o está inactivo'
            });
        }

        const tenant = tenantRows[0];

        // Usuarios del tenant
        const [users] = await masterPool.execute(`
            SELECT user_id, email, first_name, last_name, role, is_active, 
                   created_at, last_login_at
            FROM MASTER_USERS 
            WHERE tenant_id = ?
            ORDER BY created_at DESC
        `, [tenantId]);

        // Métricas de uso (simuladas - en producción vendrían de la BD del tenant)
        const [usageMetrics] = await masterPool.execute(`
            SELECT 
                (SELECT COUNT(*) FROM MASTER_USERS WHERE tenant_id = ? AND is_active = TRUE) as users_count,
                0 as recipes_count,  -- Placeholder
                0 as events_count,   -- Placeholder
                0 as storage_mb      -- Placeholder
        `, [tenantId]);

        // Actividad reciente del tenant en audit log
        const [recentActivity] = await masterPool.execute(`
            SELECT al.*, mu.first_name, mu.last_name, mu.email
            FROM SUPERADMIN_AUDIT_LOG al
            JOIN MASTER_USERS mu ON al.user_id = mu.user_id
            WHERE al.target_tenant_id = ?
            ORDER BY al.performed_at DESC
            LIMIT 10
        `, [tenantId]);

        res.json({
            success: true,
            data: {
                tenant,
                users,
                usage_metrics: usageMetrics[0],
                recent_activity: recentActivity
            }
        });

    } catch (error) {
        console.error('Error obteniendo detalles del tenant:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al obtener detalles del tenant'
        });
    }
});

/**
 * PUT /api/superadmin/tenants/:tenantId
 * Actualizar información de un tenant
 */
router.put('/:tenantId', requirePermission('manage_tenants'), auditLog('update_tenant'), async (req, res) => {
    try {
        const { tenantId } = req.params;
        const {
            business_name,
            admin_email,
            subscription_plan,
            subscription_status,
            max_users,
            max_recipes,
            max_events,
            billing_email,
            billing_address,
            tax_number,
            backup_frequency,
            notes
        } = req.body;

        // Verificar que el tenant existe
        const [existingTenant] = await masterPool.execute(
            'SELECT * FROM TENANTS WHERE tenant_id = ?',
            [tenantId]
        );

        if (existingTenant.length === 0) {
            return res.status(404).json({
                error: 'Tenant no encontrado'
            });
        }

        // Construir query de actualización dinámico
        const updateFields = [];
        const updateValues = [];

        if (business_name !== undefined) {
            updateFields.push('business_name = ?');
            updateValues.push(business_name);
        }
        if (admin_email !== undefined) {
            updateFields.push('admin_email = ?');
            updateValues.push(admin_email);
        }
        if (subscription_plan !== undefined) {
            updateFields.push('subscription_plan = ?');
            updateValues.push(subscription_plan);
        }
        if (subscription_status !== undefined) {
            updateFields.push('subscription_status = ?');
            updateValues.push(subscription_status);
        }
        if (max_users !== undefined) {
            updateFields.push('max_users = ?');
            updateValues.push(max_users);
        }
        if (max_recipes !== undefined) {
            updateFields.push('max_recipes = ?');
            updateValues.push(max_recipes);
        }
        if (max_events !== undefined) {
            updateFields.push('max_events = ?');
            updateValues.push(max_events);
        }
        if (billing_email !== undefined) {
            updateFields.push('billing_email = ?');
            updateValues.push(billing_email);
        }
        if (billing_address !== undefined) {
            updateFields.push('billing_address = ?');
            updateValues.push(billing_address);
        }
        if (tax_number !== undefined) {
            updateFields.push('tax_number = ?');
            updateValues.push(tax_number);
        }
        if (backup_frequency !== undefined) {
            updateFields.push('backup_frequency = ?');
            updateValues.push(backup_frequency);
        }
        if (notes !== undefined) {
            updateFields.push('notes = ?');
            updateValues.push(notes);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({
                error: 'No hay campos para actualizar'
            });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(tenantId);

        await masterPool.execute(`
            UPDATE TENANTS 
            SET ${updateFields.join(', ')} 
            WHERE tenant_id = ?
        `, updateValues);

        // Obtener tenant actualizado
        const [updatedTenant] = await masterPool.execute(
            'SELECT * FROM TENANTS WHERE tenant_id = ?',
            [tenantId]
        );

        res.json({
            success: true,
            message: 'Tenant actualizado correctamente',
            data: updatedTenant[0]
        });

    } catch (error) {
        console.error('Error actualizando tenant:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al actualizar el tenant'
        });
    }
});

/**
 * POST /api/superadmin/tenants/:tenantId/suspend
 * Suspender un tenant
 */
router.post('/:tenantId/suspend', requirePermission(['manage_tenants', 'manage_billing']), auditLog('suspend_tenant'), async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { reason } = req.body;

        await masterPool.execute(`
            UPDATE TENANTS 
            SET subscription_status = 'suspended', 
                updated_at = CURRENT_TIMESTAMP,
                notes = CONCAT(COALESCE(notes, ''), '\n[', NOW(), '] Suspendido: ', ?)
            WHERE tenant_id = ?
        `, [reason || 'Sin razón especificada', tenantId]);

        res.json({
            success: true,
            message: 'Tenant suspendido correctamente'
        });

    } catch (error) {
        console.error('Error suspendiendo tenant:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al suspender el tenant'
        });
    }
});

/**
 * POST /api/superadmin/tenants/:tenantId/activate
 * Activar/reactivar un tenant
 */
router.post('/:tenantId/activate', requirePermission(['manage_tenants', 'manage_billing']), auditLog('activate_tenant'), async (req, res) => {
    try {
        const { tenantId } = req.params;

        await masterPool.execute(`
            UPDATE TENANTS 
            SET subscription_status = 'active', 
                updated_at = CURRENT_TIMESTAMP,
                notes = CONCAT(COALESCE(notes, ''), '\n[', NOW(), '] Reactivado')
            WHERE tenant_id = ?
        `, [tenantId]);

        res.json({
            success: true,
            message: 'Tenant activado correctamente'
        });

    } catch (error) {
        console.error('Error reactivando tenant:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al reactivar el tenant'
        });
    }
});

/**
 * POST /api/superadmin/tenants/:tenantId/impersonate
 * Generar token de impersonación para acceder al tenant
 */
router.post('/:tenantId/impersonate', requirePermission('impersonate_tenants'), auditLog('impersonate_tenant'), async (req, res) => {
    try {
        console.log('🎭 Iniciando impersonación para tenant:', req.params.tenantId);
        console.log('SuperAdmin info:', {
            user_id: req.superAdmin?.user_id,
            email: req.superAdmin?.email,
            permissions: req.superAdmin?.permissions
        });
        
        const { tenantId } = req.params;

        // Verificar que el tenant existe y está activo
        const [tenantResult] = await masterPool.execute(`
            SELECT tenant_id, subdomain, business_name, subscription_status, is_active
            FROM TENANTS 
            WHERE tenant_id = ? AND is_active = TRUE
        `, [tenantId]);

        if (tenantResult.length === 0) {
            return res.status(404).json({
                error: 'Tenant no encontrado',
                message: 'El tenant no existe o está inactivo'
            });
        }

        const tenant = tenantResult[0];

        // Verificar que el tenant no está suspendido
        if (tenant.subscription_status === 'suspended') {
            return res.status(403).json({
                error: 'Tenant suspendido',
                message: 'No se puede acceder a un tenant suspendido'
            });
        }

        // Obtener el usuario administrador del tenant
        const [adminResult] = await masterPool.execute(`
            SELECT user_id, email, first_name, last_name
            FROM MASTER_USERS 
            WHERE tenant_id = ? AND is_tenant_owner = TRUE AND is_active = TRUE
            LIMIT 1
        `, [tenantId]);

        if (adminResult.length === 0) {
            return res.status(404).json({
                error: 'Administrador no encontrado',
                message: 'No se encontró un administrador activo para este tenant'
            });
        }

        const admin = adminResult[0];

        // Generar token temporal de impersonación (30 minutos)
        const jwt = require('jsonwebtoken');
        const impersonationToken = jwt.sign({
            user_id: admin.user_id,
            email: admin.email,
            first_name: admin.first_name,
            last_name: admin.last_name,
            tenant_id: tenantId,
            role: 'admin',
            impersonated_by: req.superAdmin.user_id,
            impersonated_at: new Date().toISOString()
        }, process.env.JWT_SECRET, { 
            expiresIn: '30m' 
        });

        // Construir URL de redirección
        const protocol = process.env.PROTOCOL || 'https';
        const baseUrl = process.env.TENANT_BASE_URL || 'ordidev.com';
        const redirectUrl = `${protocol}://${tenant.subdomain}.${baseUrl}/dashboard?impersonation_token=${impersonationToken}`;

        res.json({
            success: true,
            message: 'Token de impersonación generado',
            data: {
                tenant: {
                    tenant_id: tenant.tenant_id,
                    subdomain: tenant.subdomain,
                    business_name: tenant.business_name
                },
                admin: {
                    email: admin.email,
                    first_name: admin.first_name,
                    last_name: admin.last_name
                },
                redirect_url: redirectUrl,
                token: impersonationToken,
                expires_in: 1800 // 30 minutos en segundos
            }
        });

    } catch (error) {
        console.error('Error impersonando tenant:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al generar token de impersonación'
        });
    }
});

/**
 * DELETE /api/superadmin/tenants/:tenantId
 * Eliminar un tenant (marca como inactivo)
 */
router.delete('/:tenantId', requirePermission('delete_tenants'), auditLog('delete_tenant'), async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { confirm_deletion } = req.body;

        if (!confirm_deletion) {
            return res.status(400).json({
                error: 'Confirmación requerida',
                message: 'Debe confirmar la eliminación del tenant'
            });
        }

        // Marcar como inactivo en lugar de eliminar
        await masterPool.execute(`
            UPDATE TENANTS 
            SET is_active = FALSE, 
                subscription_status = 'cancelled',
                updated_at = CURRENT_TIMESTAMP,
                notes = CONCAT(COALESCE(notes, ''), '\n[', NOW(), '] Eliminado por superadmin')
            WHERE tenant_id = ?
        `, [tenantId]);

        res.json({
            success: true,
            message: 'Tenant eliminado correctamente'
        });

    } catch (error) {
        console.error('Error eliminando tenant:', error);
        res.status(500).json({
            error: 'Error del servidor',
            message: 'Error al eliminar el tenant'
        });
    }
});

/**
 * POST /api/superadmin/tenants
 * Crear un nuevo tenant usando el script create_tenant.js
 */
router.post('/', requirePermission('create_tenants'), auditLog('create_tenant'), async (req, res) => {
    try {
        const {
            subdomain,
            business_name,
            admin_email,
            admin_password,
            admin_first_name,
            admin_last_name,
            subscription_plan = 'basic',
            billing_email,
            tax_number,
            notes
        } = req.body;
        
        // Validaciones más estrictas
        if (!subdomain || !business_name || !admin_email || !admin_password || !admin_first_name || !admin_last_name) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: subdomain, business_name, admin_email, admin_password, admin_first_name, admin_last_name'
            });
        }
        
        // Validar formato de subdomain
        if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain.toLowerCase()) || subdomain.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'El subdomain debe tener al menos 3 caracteres y solo contener letras minúsculas, números y guiones'
            });
        }
        
        // Validar email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(admin_email)) {
            return res.status(400).json({
                success: false,
                message: 'El email no tiene un formato válido'
            });
        }
        
        // Verificar que el subdomain no existe
        const [existingTenant] = await masterPool.execute(
            'SELECT tenant_id FROM TENANTS WHERE subdomain = ?',
            [subdomain.toLowerCase()]
        );
        
        if (existingTenant.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El subdomain ya existe'
            });
        }
        
        // Verificar que el email no existe
        const [existingUser] = await masterPool.execute(
            'SELECT user_id FROM MASTER_USERS WHERE email = ?',
            [admin_email.toLowerCase()]
        );
        
        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }
        
        // Usar el script create_tenant.js para crear el tenant completo
        const path = require('path');
        const bcrypt = require('bcryptjs');
        const fs = require('fs').promises;
        const { execSync } = require('child_process');
        
        // Función para buscar archivo en múltiples ubicaciones
        async function findSchemaFile(filename) {
            const possiblePaths = [
                path.resolve(__dirname, '../../../database', filename),
                path.resolve(__dirname, '../../database', filename),
                path.resolve(process.cwd(), 'database', filename),
                path.resolve('/var/www/recetasAPI/database', filename)
            ];
            
            for (const filePath of possiblePaths) {
                try {
                    await fs.access(filePath);
                    console.log(`✅ Archivo encontrado: ${filePath}`);
                    return filePath;
                } catch (error) {
                    console.log(`❌ No encontrado: ${filePath}`);
                }
            }
            
            throw new Error(`Archivo ${filename} no encontrado en ninguna ubicación esperada`);
        }
        
        // Configuración de archivos - buscar en múltiples ubicaciones
        console.log('Buscando archivos de database...');
        console.log('Working directory:', process.cwd());
        console.log('__dirname:', __dirname);
        
        const TENANT_SCHEMA_FILE = await findSchemaFile('01b_recipes_for_tenants.sql');
        let TENANT_SEEDS_FILE;
        try {
            TENANT_SEEDS_FILE = await findSchemaFile('seeds/03_extended_demo_seed_tenant.sql');
        } catch (error) {
            console.log('⚠️ Archivo de seeds no encontrado, se omitirá la carga de datos iniciales');
            TENANT_SEEDS_FILE = null;
        }
        
        // Función helper para generar tenant ID
        function generateTenantId() {
            const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < 8; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }
        
        // Función para ejecutar SQL con cliente MySQL
        async function executeSqlWithMysqlClient(sqlFilePath) {
            const command = `mysql -u${process.env.DB_USER} -h${process.env.DB_HOST} -e "SOURCE ${sqlFilePath}"`;
            
            try {
                const output = execSync(command, {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD },
                    encoding: 'utf8',
                    timeout: 120000
                });
                
                return output;
            } catch (error) {
                throw new Error(`Error ejecutando SQL: ${error.message}`);
            }
        }
        
        // Generar información del tenant
        const tenantId = generateTenantId();
        const newDbName = `recetario_${subdomain.toLowerCase()}`;
        const passwordHash = await bcrypt.hash(admin_password, 12);
        
        // Verificar que existe la BD maestra
        const [masterExists] = await masterPool.execute(
            'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
            ['recetario_master']
        );
        
        if (masterExists.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'La base de datos maestra no existe. Contacte al administrador del sistema.'
            });
        }
        
        // Crear entrada en TENANTS
        await masterPool.execute(`
            INSERT INTO TENANTS (
                tenant_id, subdomain, database_name, business_name, admin_email,
                subscription_plan, subscription_status, trial_ends_at, 
                billing_email, tax_number, notes, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, 'trial', DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?, ?, TRUE)
        `, [
            tenantId,
            subdomain.toLowerCase(),
            newDbName,
            business_name,
            admin_email.toLowerCase(),
            subscription_plan,
            billing_email || null,
            tax_number || null,
            notes || null
        ]);
        
        // Crear usuario administrador en BD maestra
        await masterPool.execute(`
            INSERT INTO MASTER_USERS (
                tenant_id, email, password_hash, first_name, last_name,
                role, is_tenant_owner, email_verified_at, is_active
            ) VALUES (?, ?, ?, ?, ?, 'admin', TRUE, NOW(), TRUE)
        `, [
            tenantId,
            admin_email.toLowerCase(),
            passwordHash,
            admin_first_name,
            admin_last_name
        ]);
        
        // Crear base de datos del tenant
        const tenantSql = await fs.readFile(TENANT_SCHEMA_FILE, 'utf8');
        const modifiedTenantSql = tenantSql
            .replace(/CREATE DATABASE.*recipes.*;/i, `CREATE DATABASE \`${newDbName}\`;`)
            .replace(/USE recipes;/i, `USE \`${newDbName}\`;`);
        
        // Crear archivo temporal en directorio accesible  
        const tempSqlFile = path.resolve(path.dirname(TENANT_SCHEMA_FILE), `temp_${newDbName}.sql`);
        await fs.writeFile(tempSqlFile, modifiedTenantSql);
        
        try {
            // Ejecutar estructura del tenant
            await executeSqlWithMysqlClient(tempSqlFile);
            
            // Cargar datos iniciales si existe el archivo de seeds
            if (TENANT_SEEDS_FILE) {
                try {
                
                // Conectar a la BD del tenant para cargar seeds
                const tenantConnection = await mysql.createConnection({
                    host: process.env.DB_HOST,
                    user: process.env.DB_USER,
                    password: process.env.DB_PASSWORD,
                    database: newDbName
                });
                
                const seedsSql = await fs.readFile(TENANT_SEEDS_FILE, 'utf8');
                const statements = seedsSql.split(';').filter(stmt => stmt.trim());
                
                for (const statement of statements) {
                    try {
                        await tenantConnection.execute(statement);
                    } catch (seedError) {
                        // Ignorar errores menores en seeds
                        console.log('Seed warning:', seedError.message);
                    }
                }
                
                // Actualizar usuario admin en BD del tenant
                await tenantConnection.execute(`
                    UPDATE USERS SET 
                        email = ?, 
                        first_name = ?, 
                        last_name = ?, 
                        password_hash = ?
                    WHERE role = 'admin' LIMIT 1
                `, [admin_email.toLowerCase(), admin_first_name, admin_last_name, passwordHash]);
                
                // Actualizar información del restaurante
                await tenantConnection.execute(`
                    UPDATE RESTAURANT_INFO SET 
                        name = ?, 
                        business_name = ?, 
                        email = ?
                    WHERE restaurant_id = 1
                `, [business_name, business_name, admin_email.toLowerCase()]);
                
                await tenantConnection.end();
                
                } catch (seedError) {
                    console.log('Error loading seeds:', seedError.message);
                }
            } else {
                console.log('⚠️ Seeds file not available, skipping initial data load');
            }
            
        } finally {
            // Limpiar archivo temporal
            try {
                await fs.unlink(tempSqlFile);
            } catch (unlinkError) {
                console.log('Error cleaning temp file:', unlinkError.message);
            }
        }
        
        res.status(201).json({
            success: true,
            message: 'Tenant creado exitosamente con base de datos completa',
            data: {
                tenant_id: tenantId,
                subdomain: subdomain.toLowerCase(),
                database_name: newDbName,
                business_name,
                admin_email: admin_email.toLowerCase(),
                admin_name: `${admin_first_name} ${admin_last_name}`,
                subscription_plan,
                subscription_status: 'trial',
                trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                access_url: `https://${subdomain.toLowerCase()}.${process.env.TENANT_BASE_URL || 'localhost:3000'}`
            }
        });
        
    } catch (error) {
        console.error('Error creando tenant:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear tenant: ' + error.message
        });
    }
});

module.exports = router;