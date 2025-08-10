/**
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
    console.warn(`⚠️ Memoria alta: ${memoryMB}MB`);
    
    // Forzar garbage collection si está disponible
    if (global.gc) {
      global.gc();
    }
  }
}, 60000); // Cada minuto

console.log('✅ Auto-optimización de memoria activada');
