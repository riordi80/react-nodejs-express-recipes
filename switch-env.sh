#!/bin/bash

# Script para alternar entre configuraciones local, Cloudflare y producción
# Soporta tanto frontend original (Vite) como frontend-v2 (Next.js)

# Función para seleccionar frontend
select_frontend() {
  if [ -d "frontend" ] && [ -d "frontend-v2" ]; then
    echo "📂 Selecciona el frontend a configurar:"
    echo "  1) Vite Frontend (React + Vite) - frontend/"
    echo "  2) Next.js Frontend (Next.js + TypeScript) - frontend-v2/"
    echo ""
    read -p "Elige una opción (1 o 2): " choice
    
    case $choice in
      1)
        echo "✅ Configurando Vite Frontend (frontend/)..."
        FRONTEND_DIR="frontend"
        FRONTEND_TYPE="vite"
        FRONTEND_PORT="5173"
        ;;
      2)
        echo "✅ Configurando Next.js Frontend (frontend-v2/)..."
        FRONTEND_DIR="frontend-v2"
        FRONTEND_TYPE="nextjs"
        FRONTEND_PORT="3000"
        ;;
      *)
        echo "❌ Opción no válida. Usando frontend por defecto..."
        FRONTEND_DIR="frontend"
        FRONTEND_TYPE="vite"
        FRONTEND_PORT="5173"
        ;;
    esac
  elif [ -d "frontend-v2" ]; then
    echo "📂 Solo encontrado Next.js Frontend, configurando frontend-v2/..."
    FRONTEND_DIR="frontend-v2"
    FRONTEND_TYPE="nextjs"
    FRONTEND_PORT="3000"
  else
    echo "📂 Solo encontrado Vite Frontend, configurando frontend/..."
    FRONTEND_DIR="frontend"
    FRONTEND_TYPE="vite"
    FRONTEND_PORT="5173"
  fi
  
  echo ""
}

case "$1" in
  "local")
    echo "🔧 Cambiando a configuración LOCAL..."
    select_frontend
    
    # Configurar frontend según el tipo
    if [ "$FRONTEND_TYPE" = "vite" ]; then
      cp $FRONTEND_DIR/.env.local $FRONTEND_DIR/.env
      
      # Crear config.json para desarrollo local (Vite)
      cat > $FRONTEND_DIR/public/config.json << EOF
{
  "apiBaseUrl": "http://localhost:4000/api",
  "environment": "local"
}
EOF
    else
      # Next.js usa .env.local directamente
      cat > $FRONTEND_DIR/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000
NEXT_PUBLIC_ENVIRONMENT=local
EOF
    fi
    
    # Configurar backend con el CLIENT_ORIGIN correcto según el frontend elegido
    cp backend/.env.local backend/.env
    
    # Actualizar CLIENT_ORIGIN según el puerto del frontend seleccionado
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS
      sed -i '' "s|CLIENT_ORIGIN=.*|CLIENT_ORIGIN=http://localhost:$FRONTEND_PORT|" backend/.env
    else
      # Linux
      sed -i "s|CLIENT_ORIGIN=.*|CLIENT_ORIGIN=http://localhost:$FRONTEND_PORT|" backend/.env
    fi
    
    echo "✅ Frontend ($FRONTEND_TYPE) configurado para http://localhost:$FRONTEND_PORT"
    echo "✅ Backend configurado para cookies locales (acepta localhost:$FRONTEND_PORT)"
    echo "✅ API URL: http://localhost:4000/api"
    echo ""
    echo "⚠️  Reinicia el servidor backend para aplicar cambios"
    ;;
  "cloudflare")
    echo "☁️  Cambiando a configuración CLOUDFLARE..."
    select_frontend
    
    # Leer variables del archivo .env.cloudflare
    source backend/.env.cloudflare
    
    # Configurar frontend según el tipo
    if [ "$FRONTEND_TYPE" = "vite" ]; then
      cp $FRONTEND_DIR/.env.cloudflare $FRONTEND_DIR/.env
      
      # Crear config.json para Cloudflare (Vite) - Multi-tenant
      cat > $FRONTEND_DIR/public/config.json << EOF
{
  "apiBaseUrl": "/api",
  "environment": "cloudflare",
  "multitenant": true
}
EOF
      FRONTEND_URL="https://*.$BASE_DOMAIN (Multi-tenant)"
    else
      # Next.js para Cloudflare - Multi-tenant
      cat > $FRONTEND_DIR/.env.local << EOF
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_ENVIRONMENT=cloudflare
NEXT_PUBLIC_MULTITENANT=true
EOF
      FRONTEND_URL="https://*.$BASE_DOMAIN (Multi-tenant)"
    fi
    
    cp backend/.env.cloudflare backend/.env
    
    echo "✅ Frontend ($FRONTEND_TYPE) configurado para $FRONTEND_URL"
    echo "✅ Backend configurado para cookies cross-domain multi-tenant"
    echo "✅ API URL: https://<tenant>.$TENANT_BASE_URL/api"
    echo ""
    echo "⚠️  Reinicia el servidor backend para aplicar cambios"
    ;;
  "production")
    echo "🚀 Cambiando a configuración PRODUCCIÓN..."
    select_frontend
    
    # Leer variables del archivo .env.production
    source backend/.env.production
    
    # Configurar frontend según el tipo
    if [ "$FRONTEND_TYPE" = "vite" ]; then
      cp $FRONTEND_DIR/.env.production $FRONTEND_DIR/.env
      
      # Crear config.json para producción (Vite) - Multi-tenant
      cat > $FRONTEND_DIR/public/config.json << EOF
{
  "apiBaseUrl": "/api",
  "environment": "production",
  "multitenant": true
}
EOF
      FRONTEND_URL="https://*.$BASE_DOMAIN (Multi-tenant)"
      BUILD_CMD="npm run build"
    else
      # Next.js para producción - Multi-tenant
      cp $FRONTEND_DIR/.env.production $FRONTEND_DIR/.env.local
      
      # Usar plantilla multi-tenant para config.json
      if [ -f "$FRONTEND_DIR/config.json.production.template" ]; then
        cp $FRONTEND_DIR/config.json.production.template $FRONTEND_DIR/public/config.json
        echo "✅ Usando plantilla multi-tenant para producción"
      fi
      
      FRONTEND_URL="https://*.$BASE_DOMAIN (Multi-tenant)"
      BUILD_CMD="npm run build"
    fi
    
    cp backend/.env.production backend/.env
    
    API_URL="$PROTOCOL://$API_SUBDOMAIN.$BASE_DOMAIN/api"
    
    echo "✅ Frontend ($FRONTEND_TYPE) configurado para $FRONTEND_URL"
    echo "✅ Backend configurado para hosting en producción multi-tenant"
    echo "✅ API URL: https://<tenant>.$TENANT_BASE_URL/api"
    echo ""
    echo "📋 ACCIONES REQUERIDAS EN cPANEL:"
    echo "   1. Ve a Node.js Apps → Aplicación Backend ($API_SUBDOMAIN.$BASE_DOMAIN)"
    echo "   2. En Environment Variables, actualiza las variables de entorno"
    echo "   3. Restart la aplicación backend"
    echo "   4. Después ejecuta: cd $FRONTEND_DIR && npm run build"
    echo "   5. Sube los archivos del build al hosting"
    echo ""
    echo "⚠️  IMPORTANTE: Configurar variables de entorno en cPanel según .env.production"
    ;;
  "vps")
    echo "🔧 Cambiando a configuración VPS (Multi-tenant)..."
    
    # Configurar VITE Frontend (si existe) - Single tenant legacy
    if [ -d "frontend" ]; then
      cp frontend/.env.production frontend/.env
      
      # Crear config.json para VPS (Vite) - Single tenant
      cat > frontend/public/config.json << EOF
{
  "apiBaseUrl": "https://recipes.ordidev.com/api",
  "environment": "vps"
}
EOF
    fi
    
    # Configurar NEXT.JS Frontend (si existe) - Multi-tenant
    if [ -d "frontend-v2" ]; then
      cp frontend-v2/.env.vps frontend-v2/.env.local
      
      # Usar plantilla multi-tenant para config.json
      if [ -f "frontend-v2/config.json.vps.template" ]; then
        cp frontend-v2/config.json.vps.template frontend-v2/public/config.json
        echo "✅ Usando plantilla multi-tenant para config.json"
      else
        # Fallback: crear config.json multi-tenant manualmente
        cat > frontend-v2/public/config.json << EOF
{
  "apiBaseUrl": "/api",
  "environment": "vps",
  "multitenant": true
}
EOF
        echo "⚠️  Creado config.json multi-tenant (falta plantilla)"
      fi
    fi
    
    # Configurar backend
    cp backend/.env.vps backend/.env
    
    # Leer variables del archivo .env.vps
    source backend/.env.vps
    
    # Preguntar cuál frontend usar
    select_frontend
    
    FRONTEND_URL="https://*.$TENANT_BASE_URL (Multi-tenant)"
    
    echo ""
    echo "✅ Entorno configurado: VPS Multi-tenant"
    echo "✅ Frontend: $FRONTEND_TYPE ($FRONTEND_URL)"
    echo "✅ Backend API: https://<tenant>.$TENANT_BASE_URL/api"
    echo "✅ Backend configurado para multi-tenant (wildcard CORS)"
    echo "✅ Base de datos: MySQL local del VPS (separada por tenant)"
    echo ""
    echo "📋 PRÓXIMOS PASOS EN VPS:"
    echo "   1. Subir código actualizado al VPS"
    echo "   2. pm2 restart all"
    echo "   3. Probar: https://<tenant>.$TENANT_BASE_URL"
    echo "   4. Verificar que los certificados SSL cubren wildcard: *.$TENANT_BASE_URL"
    ;;
  *)
    echo "📋 Uso: ./switch-env.sh [local|cloudflare|production|vps]"
    echo ""
    echo "Configuraciones disponibles:"
    echo "  local      - localhost:5173 (Vite) / localhost:3000 (Next.js) → localhost:4000/api" 
    echo "  cloudflare - *.ordidev.com (Multi-tenant) → <tenant>.ordidev.com/api"
    echo "  production - *.ordidev.com (Multi-tenant) → <tenant>.ordidev.com/api"
    echo "  vps        - *.ordidev.com (Multi-tenant VPS) → <tenant>.ordidev.com/api"
    echo ""
    echo "📊 Estado actual:"
    
    # Verificar frontend Vite (.env)
    if [ -d "frontend" ]; then
      echo "  📱 Vite Frontend (frontend/):"
      if grep -q "localhost" frontend/.env 2>/dev/null; then
        echo "    Config: 🔧 LOCAL (localhost:5173 → localhost:4000)"
      elif grep -q "recipes.ordidev.com" frontend/.env 2>/dev/null; then
        echo "    Config: 🚀 PRODUCTION (recipes.ordidev.com)"
      else
        echo "    Config: ☁️  CLOUDFLARE (dev.ordidev.com → api.ordidev.com)"
      fi
      
      # Verificar runtime config (config.json)
      if [ -f "frontend/public/config.json" ]; then
        if grep -q "localhost" frontend/public/config.json 2>/dev/null; then
          echo "    Runtime: 🔧 LOCAL (config.json → localhost:4000)"
        elif grep -q '"multitenant": true' frontend/public/config.json 2>/dev/null; then
          if grep -q '"environment": "production"' frontend/public/config.json 2>/dev/null; then
            echo "    Runtime: 🚀 PRODUCTION MULTI-TENANT (config.json → <tenant>.ordidev.com/api)"
          elif grep -q '"environment": "cloudflare"' frontend/public/config.json 2>/dev/null; then
            echo "    Runtime: ☁️  CLOUDFLARE MULTI-TENANT (config.json → <tenant>.ordidev.com/api)"
          else
            echo "    Runtime: 🔧 VPS MULTI-TENANT (config.json → <tenant>.ordidev.com/api)"
          fi
        elif grep -q "api-recipes.ordidev.com" frontend/public/config.json 2>/dev/null; then
          echo "    Runtime: 🚀 PRODUCTION LEGACY (config.json → api-recipes.ordidev.com/api)"
        elif grep -q "recipes.ordidev.com/api" frontend/public/config.json 2>/dev/null; then
          echo "    Runtime: 🔧 VPS LEGACY (config.json → recipes.ordidev.com/api)"
        else
          echo "    Runtime: ☁️  CLOUDFLARE LEGACY (config.json → api.ordidev.com)"
        fi
      else
        echo "    Runtime: ❓ NO CONFIGURADO (falta config.json)"
      fi
    fi
    
    # Verificar frontend Next.js (.env.local)
    if [ -d "frontend-v2" ]; then
      echo "  ⚡ Next.js Frontend (frontend-v2/):"
      if [ -f "frontend-v2/.env.local" ]; then
        if grep -q "localhost:4000" frontend-v2/.env.local 2>/dev/null; then
          echo "    Config: 🔧 LOCAL (localhost:3000 → localhost:4000)"
        elif grep -q "NEXT_PUBLIC_MULTITENANT=true" frontend-v2/.env.local 2>/dev/null; then
          if grep -q "production" frontend-v2/.env.local 2>/dev/null; then
            echo "    Config: 🚀 PRODUCTION MULTI-TENANT (<tenant>.ordidev.com)"
          elif grep -q "cloudflare" frontend-v2/.env.local 2>/dev/null; then
            echo "    Config: ☁️  CLOUDFLARE MULTI-TENANT (<tenant>.ordidev.com)"
          else
            echo "    Config: 🔧 VPS MULTI-TENANT (<tenant>.ordidev.com)"
          fi
        elif grep -q "api-recipes.ordidev.com" frontend-v2/.env.local 2>/dev/null; then
          echo "    Config: 🚀 PRODUCTION LEGACY (recipes.ordidev.com)"
        elif grep -q "api.ordidev.com" frontend-v2/.env.local 2>/dev/null; then
          echo "    Config: ☁️  CLOUDFLARE LEGACY (dev-v2.ordidev.com → api.ordidev.com)"
        else
          echo "    Config: ❓ CONFIGURACIÓN DESCONOCIDA"
        fi
      else
        echo "    Config: ❓ NO CONFIGURADO (falta .env.local)"
      fi
    fi
    
    # Verificar backend
    echo "  🔧 Backend:"
    if grep -q "TENANT_BASE_URL" backend/.env 2>/dev/null; then
      if grep -q "NODE_ENV=production" backend/.env 2>/dev/null; then
        if grep -q "USE_CLOUDFLARE=true" backend/.env 2>/dev/null; then
          echo "    Config: ☁️  CLOUDFLARE MULTI-TENANT (acepta *.ordidev.com)"
        elif grep -q "api-recipes.ordidev.com" backend/.env 2>/dev/null; then
          echo "    Config: 🚀 PRODUCTION MULTI-TENANT (acepta *.ordidev.com)"
        else
          echo "    Config: 🔧 VPS MULTI-TENANT (acepta *.ordidev.com)"
        fi
      else
        echo "    Config: 🔧 DESARROLLO MULTI-TENANT (acepta *.ordidev.com)"
      fi
    elif grep -q "api-recipes.ordidev.com" backend/.env 2>/dev/null; then
      echo "    Config: 🚀 PRODUCTION LEGACY (acepta api-recipes.ordidev.com)"
    elif grep -q "CLIENT_ORIGIN=https://recipes.ordidev.com" backend/.env 2>/dev/null; then
      echo "    Config: 🔧 VPS LEGACY (acepta recipes.ordidev.com)"
    elif grep -q "USE_CLOUDFLARE=false" backend/.env 2>/dev/null && grep -q "localhost" backend/.env 2>/dev/null; then
      echo "    Config: 🔧 LOCAL (acepta localhost:5173/3000)"
    elif grep -q "USE_CLOUDFLARE=true" backend/.env 2>/dev/null; then
      echo "    Config: ☁️  CLOUDFLARE LEGACY (acepta dev.ordidev.com)"
    else
      echo "    Config: ❓ INDEFINIDO"
    fi
    
    echo ""
    echo "💡 Tips:"
    echo "  - El script detecta automáticamente qué frontends tienes disponibles"
    echo "  - Puedes tener ambos frontends configurados simultáneamente"
    echo "  - Recuerda reiniciar el backend después de cambiar configuración"
    ;;
esac