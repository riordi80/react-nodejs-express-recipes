// test-port.js - archivo temporal para ver el puerto
require('dotenv').config();

console.log('=== INFORMACIÓN DE PUERTO ===');
console.log('PORT desde .env:', process.env.PORT);
console.log('PORT desde process.env:', process.env.PORT || 'no definido');
console.log('Todos los process.env relacionados con puerto:');

Object.keys(process.env).forEach(key => {
  if (key.toLowerCase().includes('port') || 
      key.toLowerCase().includes('listen') ||
      key.toLowerCase().includes('bind')) {
    console.log(`${key}: ${process.env[key]}`);
  }
});

console.log('=== FIN INFO ===');