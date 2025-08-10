# 🚀 INSTALACIÓN SIMPLE EN HOSTING SIN CONSOLA

## 📋 Archivos generados por hosting-simple.js:
- `auto-memory.js` - Optimización automática de memoria
- `file-monitor.js` - Monitor que escribe a `status.json` 
- Scripts optimizados en `package.json`

---

## 🔧 PREPARACIÓN LOCAL (antes de subir)

### 1. Modificar backend/app.js

Añadir al **INICIO** (después de `require('dotenv').config()`):

```javascript
// Auto-optimización para hosting
require('./auto-memory');
require('./file-monitor');
```

### 2. Build optimizado del frontend

```bash
cd frontend-v2
npm run build-hosting
```

Este comando usa solo 128MB de RAM durante el build (perfecto para local).

---

## 📁 SUBIR AL HOSTING (via FTP/File Manager)

Subir estos archivos/carpetas:

```
📁 Tu hosting/
├── backend/
│   ├── app.js (modificado con require)
│   ├── auto-memory.js (generado)
│   ├── file-monitor.js (generado)
│   ├── package.json (optimizado)
│   └── ...resto de archivos backend
├── frontend-v2/
│   ├── .next/ (generado por build-hosting)
│   ├── package.json (optimizado)
│   └── ...resto de archivos frontend
└── .env (con datos de tu hosting)
```

---

## 🎛️ CONFIGURAR EN PANEL DEL HOSTING

### **cPanel:**
1. Panel → Node.js Apps → "Crear aplicación"
2. Configurar:
   - **Directorio:** `public_html/recetario/backend`
   - **Archivo principal:** `app.js`
   - **Variables de entorno:**
     ```
     NODE_ENV=production
     LOG_LEVEL=error
     ```
3. **Script de inicio:** `npm run start-hosting`

### **Hostinger:**
1. Panel → Advanced → Node.js
2. Configurar:
   - **Directorio:** `/domains/tudominio.com/public_html/backend`
   - **Versión Node:** 18.x o superior
   - **Script:** `npm run start-hosting`

---

## ⚙️ INSTALAR Y ARRANCAR

### 1. Instalar dependencias
En el panel del hosting ejecutar:
```bash
npm install --only=production
```

### 2. Iniciar aplicación
```bash
npm run start-hosting
```

Este comando usa solo 64MB de RAM (perfecto para hosting compartido).

---

## 📊 VERIFICAR FUNCIONAMIENTO

### Archivo status.json
Se genera automáticamente cada 2 minutos en la carpeta backend:

```json
{
  "timestamp": "2025-01-08T10:30:00.000Z",
  "uptime": 15,
  "memory": {
    "rss": 67,
    "heap": 45
  },
  "status": "ok"
}
```

### ✅ Señales de funcionamiento correcto:
- `status.json` se actualiza cada 2 minutos
- `"status": "ok"` en el archivo
- Memoria RSS bajo 80MB
- Aplicación responde sin errores

---

## 🚨 TROUBLESHOOTING

### **status.json muestra "warning":**
```bash
# Reducir límites de memoria aún más
# En package.json cambiar a:
"start-hosting": "NODE_ENV=production node --max-old-space-size=32 --optimize-for-size app.js"
# Reiniciar desde el panel
```

### **No se genera status.json:**
- Verificar que `file-monitor.js` está en `/backend/`
- Verificar que `require('./file-monitor')` está en `app.js`
- Comprobar permisos de escritura en el directorio

### **Error "memoria insuficiente":**
```bash
# Opción 1: Usar solo backend (sin frontend Next.js)
# Opción 2: Reducir a 32MB de límite
"start": "node --max-old-space-size=32 app.js"
```

### **No arranca la aplicación:**
1. Verificar archivo `.env` con datos correctos del hosting
2. Comprobar que `auto-memory.js` está incluido
3. Revisar logs del panel del hosting

---

## 🔄 COMANDOS DE REFERENCIA RÁPIDA

### Para preparar localmente:
```bash
# 1. Build frontend optimizado
cd frontend-v2 && npm run build-hosting

# 2. Subir por FTP todo el proyecto + archivos generados
```

### En el hosting:
```bash
# 1. Instalar dependencias
npm install --only=production

# 2. Iniciar aplicación
npm run start-hosting

# 3. Verificar estado
# Revisar archivo status.json cada 5 minutos
```

---

## 💡 NOTAS IMPORTANTES

- **NO ejecutes comandos de build en el servidor** - solo en local
- **El frontend se sirve como archivos estáticos** después del build
- **Solo el backend Node.js corre en el servidor** con límites ultra-bajos
- **Monitoreo automático** - no necesitas herramientas adicionales

**¡Con esta configuración tu aplicación funcionará establemente en hosting compartido sin volcados de memoria!**