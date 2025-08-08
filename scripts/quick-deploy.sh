#!/bin/bash

# 🚀 Script de Despliegue Rápido VPS
# Despliegue rápido sin reinstalar dependencias

# Configuración desde variables de entorno (.env.backup)
if [ -f "../.env.backup" ]; then
    source ../.env.backup
elif [ -f "./.env.backup" ]; then
    source ./.env.backup
else
    echo "❌ Error: No se encontró el archivo .env.backup"
    exit 1
fi

# Validar variables requeridas
if [ -z "$VPS_USER" ] || [ -z "$VPS_IP" ]; then
    echo "❌ Error: Faltan variables VPS_USER o VPS_IP en .env.backup"
    exit 1
fi

VPS_PATH="/var/www/recetasAPI"

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

show_message() {
    echo -e "${BLUE}[QUICK-DEPLOY]${NC} $1"
}

show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo "🚀 ===== DESPLIEGUE RÁPIDO ====="

# Sincronizar archivos
show_message "Sincronizando backend..."
rsync -avz --progress \
    --exclude 'node_modules/' \
    --exclude '.env*' \
    --exclude '*.log' \
    ../backend/ $VPS_USER@$VPS_IP:$VPS_PATH/backend/

show_message "Sincronizando frontend..."
rsync -avz --progress \
    --exclude 'node_modules/' \
    --exclude '.next/' \
    --exclude '.env*' \
    ../frontend-v2/ $VPS_USER@$VPS_IP:$VPS_PATH/frontend/

# Reiniciar servicios
show_message "Reiniciando servicios..."
ssh $VPS_USER@$VPS_IP "cd $VPS_PATH && pm2 restart all"

show_success "🎉 Despliegue rápido completado!"
echo "🌐 Verifica en: https://recipes.ordidev.com"