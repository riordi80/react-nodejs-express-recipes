# Configuración del Entorno de Desarrollo

## Configuración Inicial

### 1. Variables de Entorno

#### Backend
```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de base de datos y JWT secret
```

#### Frontend
```bash
cd frontend  
cp .env.example .env
# El archivo .env se configurará automáticamente con el script
```

### 2. Configuración de Base de Datos
- Crear base de datos MySQL llamada `recipes`
- Configurar usuario y contraseña en `backend/.env`

### 3. Instalación de Dependencias
```bash
# Backend
cd backend && npm install

# Frontend  
cd frontend && npm install
```

## Modos de Desarrollo

### Desarrollo Local
```bash
# Cambiar a configuración local
./switch-env.sh local

# Iniciar servidores
cd backend && node app.js
cd frontend && npm run dev

# Acceder en: http://localhost:5173
```

### Desarrollo con Cloudflare Tunnel
```bash
# Cambiar a configuración Cloudflare
./switch-env.sh cloudflare

# Iniciar tunnel
cloudflared tunnel run

# Iniciar servidores  
cd backend && node app.js
cd frontend && npm run dev

# Acceder en: https://dev.ordidev.com
```

## Script de Configuración

El script `switch-env.sh` permite alternar entre configuraciones:

- `./switch-env.sh local` - Configuración para desarrollo local
- `./switch-env.sh cloudflare` - Configuración para Cloudflare tunnel
- `./switch-env.sh` - Mostrar estado actual y ayuda

**Importante**: Reiniciar el backend después de cambiar configuración.

## Archivos Sensibles

Los siguientes archivos contienen información sensible y NO deben subirse al repositorio:
- `**/.env*` (todas las variantes)
- `.cloudflared/` (configuraciones de Cloudflare)
- Certificados y claves privadas

Usar los archivos `.env.example` como plantillas.