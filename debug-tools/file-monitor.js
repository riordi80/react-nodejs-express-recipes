/**
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
