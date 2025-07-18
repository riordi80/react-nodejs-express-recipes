#!/bin/bash

# Script para alternar entre configuraciones local y Cloudflare

case "$1" in
  "local")
    echo "🔧 Cambiando a configuración LOCAL..."
    cp frontend/.env.local frontend/.env
    cp backend/.env.local backend/.env
    
    # Crear config.json para desarrollo local
    cat > frontend/public/config.json << EOF
{
  "apiBaseUrl": "http://localhost:4000/api",
  "environment": "local"
}
EOF
    
    echo "✅ Frontend configurado para http://localhost:5173"
    echo "✅ Backend configurado para cookies locales"
    echo "✅ Runtime config: http://localhost:4000/api"
    echo ""
    echo "⚠️  Reinicia el servidor backend para aplicar cambios"
    ;;
  "cloudflare")
    echo "☁️  Cambiando a configuración CLOUDFLARE..."
    cp frontend/.env.cloudflare frontend/.env
    cp backend/.env.cloudflare backend/.env
    
    # Crear config.json para Cloudflare
    cat > frontend/public/config.json << EOF
{
  "apiBaseUrl": "https://api.ordidev.com/api",
  "environment": "cloudflare"
}
EOF
    
    echo "✅ Frontend configurado para https://dev.ordidev.com"
    echo "✅ Backend configurado para cookies cross-domain"
    echo "✅ Runtime config: https://api.ordidev.com/api"
    echo ""
    echo "⚠️  Reinicia el servidor backend para aplicar cambios"
    ;;
  *)
    echo "📋 Uso: ./switch-env.sh [local|cloudflare]"
    echo ""
    echo "Configuraciones disponibles:"
    echo "  local      - http://localhost:5173 → http://localhost:4000/api"
    echo "  cloudflare - https://dev.ordidev.com → https://api.ordidev.com/api"
    echo ""
    echo "📊 Estado actual:"
    
    # Verificar frontend (.env)
    if grep -q "localhost" frontend/.env 2>/dev/null; then
      echo "  Frontend: 🔧 LOCAL (localhost:5173 → localhost:4000)"
    else
      echo "  Frontend: ☁️  CLOUDFLARE (dev.ordidev.com → api.ordidev.com)"
    fi
    
    # Verificar runtime config (config.json)
    if [ -f "frontend/public/config.json" ]; then
      if grep -q "localhost" frontend/public/config.json 2>/dev/null; then
        echo "  Runtime:  🔧 LOCAL (config.json → localhost:4000)"
      else
        echo "  Runtime:  ☁️  CLOUDFLARE (config.json → api.ordidev.com)"
      fi
    else
      echo "  Runtime:  ❓ NO CONFIGURADO (falta config.json)"
    fi
    
    # Verificar backend
    if grep -q "USE_CLOUDFLARE=false" backend/.env 2>/dev/null; then
      echo "  Backend:  🔧 LOCAL (acepta localhost:5173)"
    elif grep -q "USE_CLOUDFLARE=true" backend/.env 2>/dev/null; then
      echo "  Backend:  ☁️  CLOUDFLARE (acepta dev.ordidev.com)"
    else
      echo "  Backend:  ❓ INDEFINIDO"
    fi
    
    # Verificar consistencia entre .env y config.json
    fe_local=$(grep -q "localhost" frontend/.env 2>/dev/null && echo "true" || echo "false")
    config_local=$(grep -q "localhost" frontend/public/config.json 2>/dev/null && echo "true" || echo "false")
    be_local=$(grep -q "USE_CLOUDFLARE=false" backend/.env 2>/dev/null && echo "true" || echo "false")
    
    if [[ "$fe_local" == "$config_local" && "$fe_local" == "$be_local" ]]; then
      echo "  Estado:   ✅ CONSISTENTE"
    else
      echo "  Estado:   ⚠️  INCONSISTENTE - ejecuta el script para sincronizar"
    fi
    
    echo ""
    echo "⚠️  Recuerda reiniciar el backend después de cambiar configuración"
    ;;
esac