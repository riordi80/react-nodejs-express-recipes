#!/usr/bin/env node
/**
 * 🎛️ CONFIGURACIÓN SIMPLE PARA HOSTING SIN CONSOLA
 * 
 * Crea configuraciones básicas que funcionan solo subiendo archivos por FTP
 */

const fs = require('fs');
const path = require('path');

class SimpleHostingConfig {
  constructor() {
    this.backendPath = path.resolve('../backend');
    this.frontendV2Path = path.resolve('../frontend-v2');
  }

  generateAll() {
    console.log('🎛️ GENERANDO CONFIGURACIÓN SIMPLE PARA HOSTING\n');

    this.optimizePackageJson();
    this.createAutoMemoryConfig();
    this.createFileMonitor();
    this.createInstallGuide();
    
    console.log('\n✅ CONFIGURACIÓN COMPLETADA');
    this.showInstructions();
  }

  optimizePackageJson() {
    console.log('📦 Optimizando package.json para hosting...');
    
    // Backend
    const backendPackagePath = path.join(this.backendPath, 'package.json');
    if (fs.existsSync(backendPackagePath)) {
      const pkg = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
      
      pkg.scripts = {
        ...pkg.scripts,
        // Scripts optimizados para hosting compartido
        "start": "node --max-old-space-size=64 --optimize-for-size app.js",
        "start-hosting": "NODE_ENV=production LOG_LEVEL=error node --max-old-space-size=64 --optimize-for-size app.js"
      };
      
      fs.writeFileSync(backendPackagePath, JSON.stringify(pkg, null, 2));
      console.log('   ✓ Backend package.json optimizado');
    }

    // Frontend-v2
    const frontendPackagePath = path.join(this.frontendV2Path, 'package.json');
    if (fs.existsSync(frontendPackagePath)) {
      const pkg = JSON.parse(fs.readFileSync(frontendPackagePath, 'utf8'));
      
      pkg.scripts = {
        ...pkg.scripts,
        // Build y start optimizados
        "build-hosting": "NODE_OPTIONS=\"--max-old-space-size=128\" next build",
        "start-hosting": "NODE_OPTIONS=\"--max-old-space-size=96\" next start -p 3001"
      };
      
      fs.writeFileSync(frontendPackagePath, JSON.stringify(pkg, null, 2));
      console.log('   ✓ Frontend-v2 package.json optimizado');
    }
  }

  createAutoMemoryConfig() {
    console.log('🤖 Creando configuración automática de memoria...');
    
    const autoConfig = `/**
 * AUTO-CONFIGURACIÓN DE MEMORIA PARA HOSTING
 * Incluir al inicio de app.js
 */

// Configuración automática para hosting compartido
process.env.NODE_OPTIONS = '--max-old-space-size=64 --optimize-for-size';
process.env.UV_THREADPOOL_SIZE = '2';

// Monitor básico de memoria
setInterval(() => {
  const usage = process.memoryUsage();
  const memoryMB = Math.round(usage.rss / 1024 / 1024);
  
  // Solo log si hay problema
  if (memoryMB > 80) {
    console.warn(\`⚠️ Memoria alta: \${memoryMB}MB\`);
    
    // Forzar garbage collection si está disponible
    if (global.gc) {
      global.gc();
    }
  }
}, 60000); // Cada minuto

console.log('✅ Auto-optimización de memoria activada');
`;

    fs.writeFileSync('./auto-memory.js', autoConfig);
    console.log('   ✓ auto-memory.js creado');
  }

  createFileMonitor() {
    console.log('📊 Creando monitor de archivos...');
    
    const monitor = `/**
 * MONITOR SIMPLE PARA HOSTING
 * Escribe estado a archivos JSON
 */

const fs = require('fs');

function writeStatus() {
  const usage = process.memoryUsage();
  const status = {
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime() / 60), // minutos
    memory: {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heap: Math.round(usage.heapUsed / 1024 / 1024) // MB
    },
    status: usage.rss > 100 * 1024 * 1024 ? 'warning' : 'ok'
  };

  try {
    fs.writeFileSync('./status.json', JSON.stringify(status, null, 2));
  } catch (error) {
    // Ignorar errores de escritura
  }
}

// Escribir estado cada 2 minutos
setInterval(writeStatus, 120000);

// Estado inicial
writeStatus();

console.log('📊 Monitor de archivos iniciado');
`;

    fs.writeFileSync('./file-monitor.js', monitor);
    console.log('   ✓ file-monitor.js creado');
  }

  createInstallGuide() {
    console.log('📚 Creando guía de instalación...');
    
    const guide = `# 🚀 INSTALACIÓN SIMPLE EN HOSTING SIN CONSOLA

## Archivos generados:
- auto-memory.js (optimización automática)
- file-monitor.js (monitor de estado)
- package.json optimizados

## Pasos de instalación:

### 1. Modificar backend/app.js

Añadir al INICIO (después de require('dotenv').config()):

\`\`\`javascript
// Auto-optimización para hosting
require('./auto-memory');
require('./file-monitor');
\`\`\`

### 2. Subir archivos al hosting

Via FTP/File Manager subir:
- auto-memory.js (al directorio backend/)
- file-monitor.js (al directorio backend/)
- backend/ completo
- frontend-v2/ completo

### 3. Configurar en panel del hosting

**Para cPanel:**
- Node.js Apps → Crear aplicación
- Directorio: public_html/recetario/backend
- Archivo: app.js
- Variables de entorno:
  - NODE_ENV=production
  - LOG_LEVEL=error

**Para Hostinger:**
- Panel → Node.js
- Directorio: /domains/tudominio.com/public_html
- Script: npm run start-hosting

### 4. Instalar dependencias

En el panel ejecutar:
\`\`\`
npm install --only=production
\`\`\`

### 5. Verificar funcionamiento

- Revisar archivo status.json cada pocos minutos
- Debe mostrar: "status": "ok"
- Memoria RSS debe estar bajo 80MB

## Troubleshooting

**Si status.json muestra "warning":**
- Cambiar script a: node --max-old-space-size=32 app.js
- Reiniciar desde panel del hosting

**Si no se genera status.json:**
- Verificar permisos de escritura
- Comprobar que file-monitor.js está incluido

## ✅ Señales de funcionamiento correcto:
- status.json actualizado cada 2 minutos
- "status": "ok" en el archivo
- Aplicación responde sin errores
`;

    fs.writeFileSync('./HOSTING-INSTALL.md', guide);
    console.log('   ✓ HOSTING-INSTALL.md creado');
  }

  showInstructions() {
    console.log(`
🎯 PRÓXIMOS PASOS:

1. MODIFICAR CÓDIGO:
   Añadir al INICIO de backend/app.js:
   
   require('./auto-memory');
   require('./file-monitor');

2. SUBIR AL HOSTING:
   - auto-memory.js → backend/
   - file-monitor.js → backend/
   - Backend y frontend completos

3. CONFIGURAR PANEL:
   - Crear Node.js App
   - Script: npm run start-hosting
   - Variables: NODE_ENV=production

4. MONITOREAR:
   - Revisar status.json cada 5 minutos
   - Debe mostrar "status": "ok"

📖 Lee HOSTING-INSTALL.md para guía completa
`);
  }
}

if (require.main === module) {
  const config = new SimpleHostingConfig();
  config.generateAll();
}

module.exports = SimpleHostingConfig;