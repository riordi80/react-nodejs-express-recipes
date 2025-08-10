#!/bin/bash

# 🚀 Script de Despliegue VPS - RecetasAPI
# Automatiza el despliegue de cambios al VPS

# Configuración desde variables de entorno (.env.backup)
if [ -f ".env.backup" ]; then
    source .env.backup
else
    echo "❌ Error: No se encontró el archivo .env.backup"
    echo "📋 Crea el archivo .env.backup con:"
    echo "    VPS_USER=tu_usuario"
    echo "    VPS_IP=tu_ip_vps"
    exit 1
fi

# Validar variables requeridas
if [ -z "$VPS_USER" ] || [ -z "$VPS_IP" ]; then
    echo "❌ Error: Faltan variables VPS_USER o VPS_IP en .env.backup"
    exit 1
fi

VPS_PATH="${VPS_PATH:-/var/www/recetasAPI}"
LOCAL_PROJECT_PATH="$(pwd)"

# Configuración SSH ControlMaster para reutilizar conexión
SSH_CONTROL_PATH="/tmp/ssh_control_${VPS_USER}_${VPS_IP}"
SSH_OPTS="-o ControlMaster=auto -o ControlPath=${SSH_CONTROL_PATH} -o ControlPersist=300"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes con colores
show_message() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

show_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Función para ejecutar comandos en VPS (con ControlMaster)
run_vps_command() {
    ssh $SSH_OPTS $VPS_USER@$VPS_IP "$1"
}

# Verificar conectividad y establecer master connection
check_vps_connection() {
    show_message "Verificando conexión con VPS..."
    if ssh $SSH_OPTS -o ConnectTimeout=5 $VPS_USER@$VPS_IP "echo 'Conexión exitosa'" >/dev/null 2>&1; then
        show_success "Conexión VPS establecida (master session iniciada)"
    else
        show_error "No se pudo conectar al VPS. Verifica la conexión SSH"
    fi
}

# Configurar entorno local
setup_local_env() {
    show_message "Configurando entorno local para VPS..."
    
    # Verificar que estemos en el directorio correcto
    if [ ! -f "switch-env.sh" ]; then
        show_error "No se encuentra switch-env.sh. Ejecuta desde la raíz del proyecto"
    fi
    
    # Aplicar configuración VPS
    ./switch-env.sh vps
    
    if [ $? -eq 0 ]; then
        show_success "Configuración VPS aplicada localmente"
    else
        show_error "Error al aplicar configuración VPS"
    fi
}

# Función para desplegar backend
deploy_backend() {
    show_message "Desplegando Backend..."
    
    # Excluir archivos innecesarios (usando SSH ControlMaster)
    rsync -avz --progress \
        -e "ssh $SSH_OPTS" \
        --exclude 'node_modules/' \
        --exclude '.env*' \
        --exclude '*.log' \
        --exclude '*.sql' \
        --exclude '*.dump' \
        --exclude 'backups/' \
        ./backend/ $VPS_USER@$VPS_IP:$VPS_PATH/backend/
    
    if [ $? -eq 0 ]; then
        show_success "Backend subido exitosamente"
    else
        show_error "Error al subir backend"
    fi
}

# Función para desplegar frontend
deploy_frontend() {
    show_message "Desplegando Frontend (Multi-tenant)..."
    
    # Incluir plantillas de configuración para multi-tenant (usando SSH ControlMaster)
    rsync -avz --progress \
        -e "ssh $SSH_OPTS" \
        --exclude 'node_modules/' \
        --exclude '.next/' \
        --exclude '.env*' \
        --exclude '*.template' \
        --exclude '*.log' \
        --exclude '*.sql' \
        --exclude '*.dump' \
        --exclude 'backups/' \
        --include 'config.json.*' \
        ./frontend-v2/ $VPS_USER@$VPS_IP:$VPS_PATH/frontend/
    
    if [ $? -eq 0 ]; then
        show_success "Frontend multi-tenant subido exitosamente"
        show_message "✅ Plantillas de configuración incluidas"
    else
        show_error "Error al subir frontend"
    fi
}

# Función para instalar dependencias en VPS
install_dependencies() {
    show_message "Instalando dependencias en VPS..."
    
    # Backend dependencies
    show_message "Instalando dependencias del backend..."
    run_vps_command "cd $VPS_PATH/backend && npm install --production"
    
    # Frontend dependencies + build
    show_message "Instalando dependencias del frontend y construyendo..."
    run_vps_command "cd $VPS_PATH/frontend && npm install"
    run_vps_command "cd $VPS_PATH/frontend && npm run build"
    
    if [ $? -eq 0 ]; then
        show_success "Dependencias instaladas y build completado"
    else
        show_error "Error en instalación de dependencias o build"
    fi
}

# Función para reiniciar servicios
restart_services() {
    show_message "Reiniciando servicios PM2..."
    
    # Reiniciar PM2
    run_vps_command "cd $VPS_PATH && pm2 restart all"
    
    # Verificar estado
    show_message "Verificando estado de servicios..."
    run_vps_command "pm2 status"
    
    show_success "Servicios reiniciados"
}

# Función para probar el despliegue
test_deployment() {
    show_message "Probando despliegue..."
    
    # Esperar un poco para que se inicien los servicios
    sleep 5
    
    # Probar conectividad local en VPS
    show_message "Probando servicios localmente en VPS..."
    run_vps_command "curl -I http://localhost:3000 2>/dev/null | head -1"
    run_vps_command "curl -I http://localhost:4000 2>/dev/null | head -1"
    
    # Probar conectividad pública
    show_message "Probando acceso público..."
    if curl -I ${DOMAIN_URL:-https://recipes.ordidev.com} 2>/dev/null | head -1; then
        show_success "✅ Despliegue exitoso! Aplicación accesible en ${DOMAIN_URL:-https://recipes.ordidev.com}"
    else
        show_warning "La aplicación puede tardar unos segundos en estar disponible"
    fi
}

# Función para mostrar logs
show_logs() {
    show_message "Últimos logs de la aplicación:"
    run_vps_command "pm2 logs --lines 10"
}

# Función de ayuda
show_help() {
    echo ""
    echo "🚀 Script de Despliegue VPS - RecetasAPI"
    echo ""
    echo "Uso: ./deploy-vps.sh [opción]"
    echo ""
    echo "Opciones:"
    echo "  full        Despliegue completo (por defecto)"
    echo "  backend     Solo desplegar backend"
    echo "  frontend    Solo desplegar frontend"
    echo "  quick       Despliegue rápido (sin reinstalar dependencias)"
    echo "  logs        Ver logs de la aplicación"
    echo "  status      Ver estado de servicios"
    echo "  test        Solo probar conectividad"
    echo "  help        Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./deploy-vps.sh              # Despliegue completo"
    echo "  ./deploy-vps.sh frontend     # Solo frontend"
    echo "  ./deploy-vps.sh quick        # Sin reinstalar dependencias"
    echo ""
    echo "📋 CONFIGURACIÓN REQUERIDA:"
    echo "  Crea un archivo .env.backup con:"
    echo "    VPS_USER=tu_usuario_vps"
    echo "    VPS_IP=tu_ip_vps"
    echo ""
}

# Función para limpiar conexiones SSH
cleanup_ssh() {
    show_message "Cerrando conexión SSH master..."
    ssh -O exit $SSH_OPTS $VPS_USER@$VPS_IP 2>/dev/null
    if [ -S "$SSH_CONTROL_PATH" ]; then
        rm -f "$SSH_CONTROL_PATH"
    fi
    show_success "Conexión SSH cerrada"
}

# Función principal
main() {
    echo ""
    echo "🚀 ===== DESPLIEGUE VPS RECETASAPI ====="
    echo ""
    
    # Trap para limpiar conexiones al salir
    trap cleanup_ssh EXIT
    
    # Verificar argumentos
    case "${1:-full}" in
        "help"|"--help"|"-h")
            show_help
            exit 0
            ;;
        "logs")
            check_vps_connection
            show_logs
            ;;
        "status")
            check_vps_connection
            run_vps_command "pm2 status"
            ;;
        "test")
            check_vps_connection
            test_deployment
            ;;
        "backend")
            check_vps_connection
            setup_local_env
            deploy_backend
            restart_services
            test_deployment
            ;;
        "frontend")
            check_vps_connection
            setup_local_env
            deploy_frontend
            install_dependencies
            restart_services
            test_deployment
            ;;
        "quick")
            check_vps_connection
            setup_local_env
            deploy_backend
            deploy_frontend
            restart_services
            test_deployment
            ;;
        "full")
            check_vps_connection
            setup_local_env
            deploy_backend
            deploy_frontend
            install_dependencies
            restart_services
            test_deployment
            ;;
        *)
            show_error "Opción desconocida: $1. Usa './deploy-vps.sh help' para ver opciones disponibles"
            ;;
    esac
    
    echo ""
    show_success "🎉 Despliegue completado!"
    echo ""
}

# Ejecutar función principal
main "$@"