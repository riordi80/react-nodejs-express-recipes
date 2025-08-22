#!/usr/bin/env node
// delete_tenant.js
/**
 * Script para eliminar un tenant específico del sistema multi-tenant
 * Adaptado de cleanup_master.js para uso desde API SuperAdmin
 * 
 * Puede usarse desde:
 * 1. CLI: node delete_tenant.js
 * 2. API: deleteTenant(tenantId, { silent: true })
 */

const mysql = require('mysql2/promise');

// Función para eliminar un tenant específico
async function deleteTenant(tenantIdOrSubdomain, options = {}) {
    const { silent = false, userId = null } = options;
    let connection = null;
    
    const log = (message) => {
        if (!silent) console.log(message);
    };
    
    const logError = (message) => {
        if (!silent) console.error(message);
    };
    
    try {
        log('🗑️  Iniciando eliminación de tenant...');
        
        // Conectar a MySQL
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        log('✅ Conexión establecida con MySQL');

        // Verificar si existe la BD maestra
        const [masterExists] = await connection.execute(
            'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
            ['recetario_master']
        );

        if (masterExists.length === 0) {
            throw new Error('La base de datos master no existe');
        }

        await connection.query('USE recetario_master');

        // Buscar el tenant (por ID o subdomain)
        let tenant;
        if (typeof tenantIdOrSubdomain === 'string' && isNaN(tenantIdOrSubdomain)) {
            // Es un subdomain
            const [tenants] = await connection.execute(
                'SELECT * FROM TENANTS WHERE subdomain = ?',
                [tenantIdOrSubdomain]
            );
            tenant = tenants[0];
        } else {
            // Es un tenant_id
            const [tenants] = await connection.execute(
                'SELECT * FROM TENANTS WHERE tenant_id = ?',
                [tenantIdOrSubdomain]
            );
            tenant = tenants[0];
        }

        if (!tenant) {
            throw new Error(`Tenant "${tenantIdOrSubdomain}" no encontrado`);
        }

        // Verificar si existe la base de datos del tenant
        const dbName = `recetario_${tenant.subdomain}`;
        const [dbExists] = await connection.execute(
            'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
            [dbName]
        );
        const hasTenantDB = dbExists.length > 0;

        // Obtener usuarios del tenant
        const [tenantUsers] = await connection.execute(
            'SELECT * FROM MASTER_USERS WHERE tenant_id = ?',
            [tenant.tenant_id]
        );

        log(`\n🎯 Tenant a eliminar:`);
        log(`   📂 Subdomain: ${tenant.subdomain}`);
        log(`   🏢 Empresa: ${tenant.business_name}`);
        log(`   📊 Status: ${tenant.subscription_status}`);
        log(`   💾 Base de datos: ${hasTenantDB ? `${dbName} ✅` : `${dbName} ❌ No existe`}`);
        log(`   👥 Usuarios: ${tenantUsers.length}`);

        if (tenantUsers.length > 0 && !silent) {
            tenantUsers.forEach(user => {
                log(`      - ${user.email} (${user.role})`);
            });
        }

        // Proceso de eliminación

        // 1. Eliminar usuarios del tenant
        if (tenantUsers.length > 0) {
            const [deletedUsers] = await connection.execute(
                'DELETE FROM MASTER_USERS WHERE tenant_id = ?',
                [tenant.tenant_id]
            );
            log(`✅ Eliminados ${deletedUsers.affectedRows} usuario(s) del master`);
        }

        // 2. Eliminar tenant del registro
        const [deletedTenant] = await connection.execute(
            'DELETE FROM TENANTS WHERE tenant_id = ?',
            [tenant.tenant_id]
        );
        log(`✅ Eliminado tenant "${tenant.subdomain}" del registro master`);

        // 3. Eliminar base de datos del tenant
        if (hasTenantDB) {
            try {
                await connection.execute(`DROP DATABASE \`${dbName}\``);
                log(`✅ Eliminada base de datos: ${dbName}`);
            } catch (error) {
                logError(`⚠️  Error eliminando BD ${dbName}: ${error.message}`);
                // No lanzar error aquí, continuar con el registro de auditoría
            }
        } else {
            log(`ℹ️  Base de datos ${dbName} no existía`);
        }

        // 4. Registrar en audit log si se proporcionó userId (llamada desde API)
        if (userId) {
            try {
                await connection.execute(
                    `INSERT INTO SUPERADMIN_AUDIT_LOG 
                     (user_id, action_type, target_tenant_id, action_details, ip_address, user_agent) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        userId,
                        'delete_tenant',
                        tenant.tenant_id,
                        JSON.stringify({
                            subdomain: tenant.subdomain,
                            business_name: tenant.business_name,
                            users_deleted: tenantUsers.length,
                            database_deleted: hasTenantDB
                        }),
                        'SuperAdmin API',
                        'delete_tenant.js script'
                    ]
                );
            } catch (auditError) {
                logError(`⚠️  Error registrando en audit log: ${auditError.message}`);
            }
        }

        log(`\n🎉 Tenant "${tenant.subdomain}" eliminado exitosamente!`);
        
        const result = {
            success: true,
            tenant: {
                tenant_id: tenant.tenant_id,
                subdomain: tenant.subdomain,
                business_name: tenant.business_name
            },
            deleted: {
                users: tenantUsers.length,
                database: hasTenantDB
            }
        };

        if (!silent) {
            log('\n📋 Resumen de la eliminación:');
            log(`   ✅ Tenant: ${tenant.business_name}`);
            log(`   ✅ Usuarios: ${tenantUsers.length}`);
            log(`   ✅ Base de datos: ${hasTenantDB ? 'Eliminada' : 'No existía'}`);
        }

        return result;

    } catch (error) {
        logError(`\n❌ Error eliminando tenant: ${error.message}`);
        
        return {
            success: false,
            error: error.message
        };
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Modo CLI interactivo (solo si se ejecuta directamente)
async function cliMode() {
    const readline = require('readline');
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    function askQuestion(question) {
        return new Promise(resolve => {
            rl.question(question, resolve);
        });
    }

    try {
        console.log('🗑️  Eliminación de tenant específico\n');
        
        // Conectar para mostrar tenants disponibles
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'recetario_master'
        });

        // Mostrar tenants disponibles
        const [tenants] = await connection.execute('SELECT * FROM TENANTS ORDER BY subdomain');
        
        if (tenants.length === 0) {
            console.log('❌ No hay tenants registrados.');
            return;
        }
        
        console.log('📋 Tenants disponibles:');
        tenants.forEach((tenant, index) => {
            console.log(`   ${index + 1}. ${tenant.subdomain} (${tenant.business_name})`);
            console.log(`      Status: ${tenant.subscription_status} | Creado: ${tenant.created_at}`);
        });
        
        await connection.end();
        
        const tenantChoice = await askQuestion('\n🔍 Introduce el SUBDOMAIN del tenant a eliminar: ');
        
        if (!tenantChoice.trim()) {
            console.log('❌ Subdomain vacío. Operación cancelada.');
            return;
        }
        
        // Confirmación
        console.log(`\n⚠️  ATENCIÓN: Vas a eliminar PERMANENTEMENTE el tenant "${tenantChoice}"`);
        console.log('   Esta operación es IRREVERSIBLE');
        
        const confirm = await askQuestion(`\n¿Confirmar eliminación? (escribir "${tenantChoice.trim()}" para confirmar): `);
        
        if (confirm !== tenantChoice.trim()) {
            console.log('❌ Operación cancelada');
            return;
        }
        
        // Ejecutar eliminación
        const result = await deleteTenant(tenantChoice.trim());
        
        if (result.success) {
            console.log('\n✅ Eliminación completada exitosamente!');
        } else {
            console.log('\n❌ Error durante la eliminación:', result.error);
        }

    } catch (error) {
        console.error('\n❌ Error en modo CLI:', error.message);
    } finally {
        rl.close();
    }
}

// Ejecutar modo CLI si se llama directamente
if (require.main === module) {
    // Cargar dotenv solo en modo CLI
    require('dotenv').config();
    cliMode().catch(console.error);
}

// Exportar función para uso desde API
module.exports = { deleteTenant };