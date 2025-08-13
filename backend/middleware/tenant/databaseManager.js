// middleware/tenant/databaseManager.js
const mysql = require('mysql2/promise');

// Cache de pools de conexión por tenant
const tenantPools = new Map();

/**
 * Obtiene o crea un pool de conexiones para un tenant específico
 * @param {Object} tenant - Información del tenant
 * @returns {mysql.Pool} - Pool de conexiones para el tenant
 */
function getTenantPool(tenant) {
    const poolKey = tenant.database_name;
    
    // Si ya existe el pool, devolverlo
    if (tenantPools.has(poolKey)) {
        return tenantPools.get(poolKey);
    }
    
    // Crear nuevo pool de conexiones para el tenant
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: tenant.database_name,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        idleTimeout: 600000, // 10 minutos antes de cerrar conexiones inactivas
        enableKeepAlive: true,
        keepAliveInitialDelay: 0
    });
    
    // Guardar en cache
    tenantPools.set(poolKey, pool);
    
    console.log(`✅ Pool de conexiones creado para tenant: ${tenant.tenant_id} (DB: ${tenant.database_name})`);
    
    return pool;
}

/**
 * Middleware para agregar la conexión del tenant al request
 * Debe ejecutarse después de resolveTenant
 */
async function attachTenantDatabase(req, res, next) {
    try {
        // Verificar que el tenant esté resuelto
        if (!req.tenant) {
            return res.status(500).json({
                error: 'Error de configuración',
                message: 'Tenant no resuelto. Debe usar resolveTenant primero.',
                code: 'TENANT_NOT_RESOLVED'
            });
        }
        
        // Obtener pool de conexiones del tenant
        const pool = getTenantPool(req.tenant);
        
        // Agregar pool al request
        req.tenantDb = pool;
        
        // Función helper para ejecutar consultas del tenant
        req.tenantQuery = async (sql, params = []) => {
            try {
                const [rows] = await pool.execute(sql, params);
                return rows;
            } catch (error) {
                console.error(`Error en query para tenant ${req.tenant.tenant_id}:`, error);
                throw error;
            }
        };
        
        next();
        
    } catch (error) {
        console.error('Error adjuntando base de datos del tenant:', error);
        res.status(500).json({
            error: 'Error de base de datos',
            message: 'Error al conectar con la base de datos del tenant',
            code: 'DATABASE_CONNECTION_ERROR'
        });
    }
}

/**
 * Verifica si la base de datos del tenant existe
 * @param {string} databaseName - Nombre de la base de datos
 * @returns {Promise<boolean>} - true si existe, false si no
 */
async function checkTenantDatabase(databaseName) {
    try {
        // Crear conexión temporal sin especificar base de datos
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        
        // Verificar si la base de datos existe
        const [rows] = await connection.execute(
            'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
            [databaseName]
        );
        
        await connection.end();
        
        return rows.length > 0;
        
    } catch (error) {
        console.error('Error verificando base de datos del tenant:', error);
        return false;
    }
}

/**
 * Crea la base de datos para un nuevo tenant
 * @param {string} databaseName - Nombre de la base de datos a crear
 * @param {string} sourceDatabase - Base de datos fuente para clonar estructura (opcional)
 * @returns {Promise<boolean>} - true si se creó exitosamente
 */
async function createTenantDatabase(databaseName, sourceDatabase = 'recetario') {
    try {
        // Crear conexión temporal sin especificar base de datos
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });
        
        // Crear la base de datos
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
        
        console.log(`✅ Base de datos creada: ${databaseName}`);
        
        // Si se especifica una base de datos fuente, clonar estructura
        if (sourceDatabase) {
            await cloneDatabaseStructure(connection, sourceDatabase, databaseName);
        }
        
        await connection.end();
        
        return true;
        
    } catch (error) {
        console.error('Error creando base de datos del tenant:', error);
        return false;
    }
}

/**
 * Clona la estructura de una base de datos a otra
 * @param {mysql.Connection} connection - Conexión MySQL
 * @param {string} sourceDb - Base de datos fuente
 * @param {string} targetDb - Base de datos destino
 */
async function cloneDatabaseStructure(connection, sourceDb, targetDb) {
    try {
        // Obtener todas las tablas de la base de datos fuente
        const [tables] = await connection.execute(
            'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
            [sourceDb]
        );
        
        for (const table of tables) {
            const tableName = table.table_name;
            
            // Obtener CREATE TABLE statement
            const [createTable] = await connection.execute(
                `SHOW CREATE TABLE \`${sourceDb}\`.\`${tableName}\``
            );
            
            if (createTable.length > 0) {
                let createStatement = createTable[0]['Create Table'];
                
                // Reemplazar nombre de la tabla para incluir la nueva base de datos
                createStatement = createStatement.replace(
                    `CREATE TABLE \`${tableName}\``,
                    `CREATE TABLE \`${targetDb}\`.\`${tableName}\``
                );
                
                // Ejecutar CREATE TABLE en la nueva base de datos
                await connection.execute(createStatement);
                
                console.log(`  ✅ Tabla clonada: ${tableName}`);
            }
        }
        
        console.log(`✅ Estructura clonada de ${sourceDb} a ${targetDb}`);
        
    } catch (error) {
        console.error('Error clonando estructura de base de datos:', error);
        throw error;
    }
}

/**
 * Cierra el pool de conexiones de un tenant específico
 * @param {string} databaseName - Nombre de la base de datos
 */
async function closeTenantPool(databaseName) {
    try {
        const pool = tenantPools.get(databaseName);
        if (pool) {
            await pool.end();
            tenantPools.delete(databaseName);
            console.log(`🔒 Pool cerrado para base de datos: ${databaseName}`);
        }
    } catch (error) {
        console.error('Error cerrando pool del tenant:', error);
    }
}

/**
 * Cierra todos los pools de conexiones de tenants
 */
async function closeAllTenantPools() {
    try {
        const promises = Array.from(tenantPools.keys()).map(databaseName => 
            closeTenantPool(databaseName)
        );
        
        await Promise.all(promises);
        console.log('🔒 Todos los pools de tenants cerrados');
        
    } catch (error) {
        console.error('Error cerrando pools de tenants:', error);
    }
}

/**
 * Obtiene estadísticas de conexiones de todos los tenants
 * @returns {Object} - Estadísticas de conexiones
 */
function getTenantPoolStats() {
    const stats = {};
    
    for (const [databaseName, pool] of tenantPools.entries()) {
        stats[databaseName] = {
            activeConnections: pool._allConnections.length,
            freeConnections: pool._freeConnections.length,
            queuedConnections: pool._connectionQueue.length
        };
    }
    
    return stats;
}

// Cleanup cuando el proceso termina
process.on('SIGTERM', closeAllTenantPools);
process.on('SIGINT', closeAllTenantPools);

module.exports = {
    getTenantPool,
    attachTenantDatabase,
    checkTenantDatabase,
    createTenantDatabase,
    closeTenantPool,
    closeAllTenantPools,
    getTenantPoolStats
};