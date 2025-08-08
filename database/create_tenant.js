#!/usr/bin/env node
// database/create_tenant.js
/**
 * Script universal para crear tenants en el sistema SaaS
 * - Si es el primer tenant: crea BD maestra + primer tenant
 * - Si ya existe BD maestra: solo crea el nuevo tenant
 * Todos los tenants usan recipes.sql + 02_demo_seed.sql
 */

require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');

// Configuración
const MASTER_SCHEMA_FILE = path.join(__dirname, 'master_schema_fixed.sql');
const TENANT_SCHEMA_FILE = path.join(__dirname, 'recipes.sql');
const TENANT_SEEDS_FILE = path.join(__dirname, 'seeds/02_demo_seed.sql');

// Interface para input del usuario
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise(resolve => {
        rl.question(question, resolve);
    });
}

// Función principal
async function createTenant() {
    let connection = null;
    
    try {
        console.log('🚀 Creando nuevo tenant del sistema SaaS...\n');
        
        // Conectar a MySQL
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        console.log('✅ Conexión establecida con MySQL');

        // 1. Verificar archivos necesarios
        console.log('📋 Verificando archivos necesarios...');
        
        const files = [
            { path: MASTER_SCHEMA_FILE, name: 'master_schema_fixed.sql' },
            { path: TENANT_SCHEMA_FILE, name: 'recipes.sql' },
            { path: TENANT_SEEDS_FILE, name: '02_demo_seed.sql' }
        ];

        for (const file of files) {
            try {
                await fs.access(file.path);
                console.log(`✅ ${file.name} encontrado`);
            } catch (error) {
                throw new Error(`Archivo ${file.name} no encontrado en la ruta esperada`);
            }
        }

        // 2. Verificar si existe la BD maestra
        const [masterExists] = await connection.execute(
            'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
            ['recetario_master']
        );

        const isFirstTenant = masterExists.length === 0;

        if (isFirstTenant) {
            console.log('🆕 Primera ejecución detectada: creando BD maestra...');
        } else {
            console.log('✅ BD maestra existente: creando tenant adicional...');
        }

        // 3. Información del tenant por defecto para testing
        console.log('\n📝 Creando tenant de prueba...');
        const subdomain = 'demo';
        const businessName = 'Restaurante Demo';
        const adminEmail = 'admin@demo.local';
        const adminPassword = 'admin123';
        const adminFirstName = 'Admin';
        const adminLastName = 'Demo';
        
        console.log(`Subdominio: ${subdomain}`);
        console.log(`Negocio: ${businessName}`);
        console.log(`Admin: ${adminFirstName} ${adminLastName} (${adminEmail})`);

        // Validaciones básicas
        if (!subdomain || !businessName || !adminEmail || !adminPassword || !adminFirstName || !adminLastName) {
            throw new Error('Todos los campos son requeridos');
        }

        // Validar subdominio
        if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain.toLowerCase()) || subdomain.length < 3) {
            throw new Error('Subdominio inválido (solo letras minúsculas, números y guiones, mínimo 3 caracteres)');
        }

        // 4. Generar información del tenant
        const tenantId = generateTenantId();
        const newDbName = `recetario_${subdomain.toLowerCase()}`;
        const passwordHash = await bcrypt.hash(adminPassword, 12);

        console.log(`\n🔧 Creando tenant con ID: ${tenantId}`);
        console.log(`📁 Base de datos: ${newDbName}`);

        // 5. Crear BD maestra si es el primer tenant
        if (isFirstTenant) {
            console.log('\n📊 Creando base de datos maestra...');
            
            const masterSql = await fs.readFile(MASTER_SCHEMA_FILE, 'utf8');
            await executeSqlFile(connection, masterSql, 'Master DB');
            
            console.log('✅ Base de datos maestra creada');
        }

        // 6. Verificar que el subdominio no esté ocupado
        await connection.query('USE recetario_master');
        
        const [existingTenant] = await connection.execute(
            'SELECT tenant_id FROM TENANTS WHERE subdomain = ?',
            [subdomain.toLowerCase()]
        );

        if (existingTenant.length > 0) {
            throw new Error(`El subdominio '${subdomain}' ya está en uso`);
        }

        // 7. Verificar que el email no esté ocupado
        const [existingUser] = await connection.execute(
            'SELECT user_id FROM MASTER_USERS WHERE email = ?',
            [adminEmail.toLowerCase()]
        );

        if (existingUser.length > 0) {
            throw new Error(`El email '${adminEmail}' ya está registrado`);
        }

        // 8. Crear entrada en TENANTS
        await connection.execute(`
            INSERT INTO TENANTS (
                tenant_id, subdomain, database_name, business_name, admin_email,
                subscription_plan, subscription_status, trial_ends_at, is_active
            ) VALUES (?, ?, ?, ?, ?, 'free', 'trial', DATE_ADD(NOW(), INTERVAL 30 DAY), TRUE)
        `, [
            tenantId,
            subdomain.toLowerCase(),
            newDbName,
            businessName,
            adminEmail.toLowerCase()
        ]);

        console.log('✅ Tenant registrado en BD maestra');

        // 9. Crear usuario administrador
        await connection.execute(`
            INSERT INTO MASTER_USERS (
                tenant_id, email, password_hash, first_name, last_name,
                role, is_tenant_owner, email_verified_at, is_active
            ) VALUES (?, ?, ?, ?, ?, 'admin', TRUE, NOW(), TRUE)
        `, [
            tenantId,
            adminEmail.toLowerCase(),
            passwordHash,
            adminFirstName,
            adminLastName
        ]);

        console.log('✅ Usuario administrador creado en BD maestra');

        // 10. Crear base de datos del tenant
        console.log(`\n🏗️  Creando base de datos del tenant: ${newDbName}...`);
        
        // Leer y modificar recipes.sql
        const tenantSql = await fs.readFile(TENANT_SCHEMA_FILE, 'utf8');
        const modifiedTenantSql = tenantSql
            .replace(/CREATE DATABASE.*recetario.*;/i, `CREATE DATABASE \`${newDbName}\`;`)
            .replace(/USE recetario;/i, `USE \`${newDbName}\`;`);

        await executeSqlFile(connection, modifiedTenantSql, 'Tenant DB Structure');
        console.log('✅ Estructura de BD del tenant creada');

        // 11. Cargar datos iniciales
        console.log('\n📦 Cargando datos iniciales...');
        
        await connection.query(`USE \`${newDbName}\``);
        const seedsSql = await fs.readFile(TENANT_SEEDS_FILE, 'utf8');
        await executeSqlFile(connection, seedsSql, 'Seeds');

        // 12. Actualizar usuario admin en BD del tenant
        try {
            await connection.execute(
                `UPDATE USERS SET 
                    email = ?, 
                    first_name = ?, 
                    last_name = ?, 
                    password_hash = ?,
                    updated_at = NOW()
                WHERE role = 'admin' LIMIT 1`,
                [adminEmail.toLowerCase(), adminFirstName, adminLastName, passwordHash]
            );
            
            console.log('✅ Usuario administrador sincronizado en BD del tenant');
        } catch (error) {
            console.log('⚠️  Advertencia: No se pudo actualizar usuario admin en BD tenant');
        }

        console.log('✅ Datos iniciales cargados');

        // 13. Mostrar resumen
        console.log('\n🎉 ¡Tenant creado exitosamente!');
        console.log('\n📊 Resumen:');
        console.log(`   - Tenant ID: ${tenantId}`);
        console.log(`   - Subdominio: ${subdomain.toLowerCase()}`);
        console.log(`   - Base de datos: ${newDbName}`);
        console.log(`   - Admin: ${adminEmail.toLowerCase()}`);
        console.log(`   - Negocio: ${businessName}`);
        console.log(`   - Plan: Free Trial (30 días)`);
        
        console.log('\n🌐 Acceso:');
        console.log(`   - Desarrollo: http://${subdomain.toLowerCase()}.localhost:5173`);
        console.log(`   - Producción: http://${subdomain.toLowerCase()}.tuapp.com`);
        
        if (isFirstTenant) {
            console.log('\n🚀 Próximos pasos (primer tenant):');
            console.log('   1. Reiniciar el servidor backend');
            console.log('   2. Configurar DNS/hosts para subdominios');
            console.log('   3. El sistema está listo para multi-tenant');
        } else {
            console.log('\n✅ El nuevo tenant está listo para usar');
        }
        
    } catch (error) {
        console.error('\n❌ Error durante la creación:', error.message);
        console.error(error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
        rl.close();
    }
}

// Función helper para ejecutar archivos SQL
async function executeSqlFile(connection, sqlContent, label) {
    const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');

    let successCount = 0;
    let warningCount = 0;

    for (const statement of statements) {
        try {
            await connection.execute(statement);
            successCount++;
        } catch (error) {
            if (error.message.includes('already exists')) {
                // Ignorar errores de "ya existe"
                continue;
            }
            console.log(`  ⚠️  ${label} - Advertencia: ${error.message}`);
            warningCount++;
        }
    }

    console.log(`  📊 ${label}: ${successCount} statements ejecutados, ${warningCount} advertencias`);
}

// Función para generar tenant ID único
function generateTenantId() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    createTenant().catch(console.error);
}

module.exports = { createTenant };