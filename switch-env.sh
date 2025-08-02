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
    
    # Configurar frontend según el tipo
    if [ "$FRONTEND_TYPE" = "vite" ]; then
      cp $FRONTEND_DIR/.env.cloudflare $FRONTEND_DIR/.env
      
      # Crear config.json para Cloudflare (Vite)
      cat > $FRONTEND_DIR/public/config.json << EOF
{
  "apiBaseUrl": "https://api.ordidev.com/api",
  "environment": "cloudflare"
}
EOF
      FRONTEND_URL="https://dev.ordidev.com"
    else
      # Next.js para Cloudflare
      cat > $FRONTEND_DIR/.env.local << EOF
NEXT_PUBLIC_API_URL=https://api.ordidev.com
NEXT_PUBLIC_CLIENT_URL=https://dev-v2.ordidev.com
NEXT_PUBLIC_ENVIRONMENT=cloudflare
EOF
      FRONTEND_URL="https://dev-v2.ordidev.com"
    fi
    
    cp backend/.env.cloudflare backend/.env
    
    echo "✅ Frontend ($FRONTEND_TYPE) configurado para $FRONTEND_URL"
    echo "✅ Backend configurado para cookies cross-domain"
    echo "✅ API URL: https://api.ordidev.com/api"
    echo ""
    echo "⚠️  Reinicia el servidor backend para aplicar cambios"
    ;;
  "production")
    echo "🚀 Cambiando a configuración PRODUCCIÓN..."
    select_frontend
    
    # Configurar frontend según el tipo
    if [ "$FRONTEND_TYPE" = "vite" ]; then
      cp $FRONTEND_DIR/.env.production $FRONTEND_DIR/.env
      
      # Crear config.json para producción (Vite)
      cat > $FRONTEND_DIR/public/config.json << EOF
{
  "apiBaseUrl": "https://api-recipes.ordidev.com/api",
  "environment": "production"
}
EOF
      FRONTEND_URL="https://recipes.ordidev.com"
      BUILD_CMD="npm run build"
    else
      # Next.js para producción
      cat > $FRONTEND_DIR/.env.local << EOF
NEXT_PUBLIC_API_URL=https://api-recipes.ordidev.com
NEXT_PUBLIC_CLIENT_URL=https://recipes.ordidev.com
NEXT_PUBLIC_ENVIRONMENT=production
EOF
      FRONTEND_URL="https://recipes.ordidev.com"
      BUILD_CMD="npm run build"
    fi
    
    cp backend/.env.production backend/.env
    
    echo "✅ Frontend ($FRONTEND_TYPE) configurado para $FRONTEND_URL"
    echo "✅ Backend configurado para hosting en producción"
    echo "✅ API URL: https://api-recipes.ordidev.com/api"
    echo ""
    echo "⚠️  Después ejecuta 'cd $FRONTEND_DIR && $BUILD_CMD' y sube los archivos al hosting"
    ;;
  *)
    echo "📋 Uso: ./switch-env.sh [local|cloudflare|production]"
    echo ""
    echo "Configuraciones disponibles:"
    echo "  local      - localhost:5173 (Vite) / localhost:3000 (Next.js) → localhost:4000/api"
    echo "  cloudflare - dev.ordidev.com (Vite) / dev-v2.ordidev.com (Next.js) → api.ordidev.com/api"
    echo "  production - recipes.ordidev.com → api-recipes.ordidev.com/api"
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
        elif grep -q "api-recipes.ordidev.com" frontend/public/config.json 2>/dev/null; then
          echo "    Runtime: 🚀 PRODUCTION (config.json → api-recipes.ordidev.com/api)"
        else
          echo "    Runtime: ☁️  CLOUDFLARE (config.json → api.ordidev.com)"
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
        elif grep -q "api-recipes.ordidev.com" frontend-v2/.env.local 2>/dev/null; then
          echo "    Config: 🚀 PRODUCTION (recipes.ordidev.com)"
        elif grep -q "api.ordidev.com" frontend-v2/.env.local 2>/dev/null; then
          echo "    Config: ☁️  CLOUDFLARE (dev-v2.ordidev.com → api.ordidev.com)"
        else
          echo "    Config: ❓ CONFIGURACIÓN DESCONOCIDA"
        fi
      else
        echo "    Config: ❓ NO CONFIGURADO (falta .env.local)"
      fi
    fi
    
    # Verificar backend
    echo "  🔧 Backend:"
    if grep -q "api-recipes.ordidev.com" backend/.env 2>/dev/null; then
      echo "    Config: 🚀 PRODUCTION (acepta api-recipes.ordidev.com)"
    elif grep -q "USE_CLOUDFLARE=false" backend/.env 2>/dev/null; then
      echo "    Config: 🔧 LOCAL (acepta localhost:5173/3000)"
    elif grep -q "USE_CLOUDFLARE=true" backend/.env 2>/dev/null; then
      echo "    Config: ☁️  CLOUDFLARE (acepta dev.ordidev.com)"
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