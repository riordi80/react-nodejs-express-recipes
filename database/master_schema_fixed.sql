-- =====================================================
-- SCHEMA DE BASE DE DATOS MAESTRA PARA SAAS MULTI-TENANT
-- VERSION COMPLETA CON SINTAXIS CORREGIDA
-- Siguiendo los patrones exactos de la BD principal
-- =====================================================

DROP DATABASE IF EXISTS recetario_master;
CREATE DATABASE recetario_master;
USE recetario_master;

-- =====================================================
-- TABLA: TENANTS
-- Registro principal de todos los restaurantes/tenants
-- =====================================================
CREATE TABLE TENANTS (
    tenant_id VARCHAR(50) NOT NULL,
    subdomain VARCHAR(50) NOT NULL,
    database_name VARCHAR(100) NOT NULL,
    business_name VARCHAR(200) NOT NULL,
    admin_email VARCHAR(100) NOT NULL,
    
    -- Configuración del Tenant
    subscription_plan ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
    subscription_status ENUM('active', 'suspended', 'cancelled', 'trial') DEFAULT 'trial',
    max_users INT DEFAULT 5 COMMENT 'Máximo de usuarios permitidos según plan',
    max_recipes INT DEFAULT 100 COMMENT 'Máximo de recetas permitidas',
    max_events INT DEFAULT 10 COMMENT 'Máximo de eventos por mes',
    
    -- Facturación
    billing_email VARCHAR(100),
    billing_address TEXT,
    tax_number VARCHAR(50) COMMENT 'CIF/NIF para facturación',
    
    -- Configuración Técnica
    custom_domain VARCHAR(200) COMMENT 'Dominio personalizado opcional',
    ssl_enabled BOOLEAN DEFAULT FALSE,
    backup_frequency ENUM('daily', 'weekly', 'monthly') DEFAULT 'weekly',
    
    -- Metadatos
    trial_ends_at DATE COMMENT 'Fecha de fin del periodo de prueba',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Constraints siguiendo tus patrones exactos
    CONSTRAINT pk_tenants PRIMARY KEY (tenant_id),
    CONSTRAINT uq_tenants_subdomain UNIQUE (subdomain),
    CONSTRAINT uq_tenants_database_name UNIQUE (database_name),
    CONSTRAINT uq_tenants_admin_email UNIQUE (admin_email),
    CONSTRAINT uq_tenants_custom_domain UNIQUE (custom_domain)
) ENGINE=InnoDB COMMENT='Registro principal de todos los restaurantes/tenants del sistema';

-- =====================================================
-- TABLA: MASTER_USERS
-- Usuarios de todos los tenants para login centralizado
-- =====================================================
CREATE TABLE MASTER_USERS (
    user_id INT AUTO_INCREMENT NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Información Personal (igual que tu tabla USERS)
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('admin', 'chef', 'inventory_manager', 'waiter', 'supplier_manager') NOT NULL,
    
    -- Configuración Personal (igual que tus patrones)
    language VARCHAR(5) DEFAULT 'es',
    timezone VARCHAR(50) DEFAULT 'Europe/Madrid',
    
    -- Estado del Usuario
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    
    -- Configuración SaaS
    is_tenant_owner BOOLEAN DEFAULT FALSE COMMENT 'Si es el propietario del tenant',
    invited_by_user_id INT NULL COMMENT 'Usuario que invitó a este usuario',
    invitation_accepted_at TIMESTAMP NULL,
    
    -- Metadatos (siguiendo tus patrones)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints siguiendo tus patrones exactos
    CONSTRAINT pk_master_users PRIMARY KEY (user_id),
    CONSTRAINT fk_master_users_tenant FOREIGN KEY (tenant_id) REFERENCES TENANTS(tenant_id) ON DELETE CASCADE,
    CONSTRAINT fk_master_users_invited_by FOREIGN KEY (invited_by_user_id) REFERENCES MASTER_USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT uq_master_users_email_tenant UNIQUE (email, tenant_id),
    
    -- Índices para performance
    INDEX idx_master_users_email (email),
    INDEX idx_master_users_tenant (tenant_id),
    INDEX idx_master_users_last_login (last_login)
) ENGINE=InnoDB COMMENT='Usuarios de todos los tenants para autenticación centralizada';

-- =====================================================
-- TABLA: SUBSCRIPTION_PLANS
-- Definición de planes de suscripción
-- =====================================================
CREATE TABLE SUBSCRIPTION_PLANS (
    plan_id VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Límites del Plan (siguiendo tu patrón de configuración)
    max_users INT NOT NULL,
    max_recipes INT NOT NULL,
    max_events_per_month INT NOT NULL,
    max_suppliers INT NOT NULL,
    max_storage_mb INT NOT NULL,
    
    -- Características del Plan
    has_custom_domain BOOLEAN DEFAULT FALSE,
    has_advanced_reports BOOLEAN DEFAULT FALSE,
    has_api_access BOOLEAN DEFAULT FALSE,
    has_priority_support BOOLEAN DEFAULT FALSE,
    
    -- Precio (siguiendo tu patrón DECIMAL para precios)
    monthly_price DECIMAL(10,2) NOT NULL,
    yearly_price DECIMAL(10,2) NOT NULL,
    setup_fee DECIMAL(10,2) DEFAULT 0.00,
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT pk_subscription_plans PRIMARY KEY (plan_id),
    CONSTRAINT uq_subscription_plans_name UNIQUE (name)
) ENGINE=InnoDB COMMENT='Definición de planes de suscripción disponibles';

-- =====================================================
-- TABLA: BILLING_HISTORY
-- Historial de facturación por tenant
-- =====================================================
CREATE TABLE BILLING_HISTORY (
    billing_id INT AUTO_INCREMENT NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    plan_id VARCHAR(20) NOT NULL,
    
    -- Información de Facturación (siguiendo tus patrones de decimal)
    amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Periodo Facturado
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    billing_cycle ENUM('monthly', 'yearly') NOT NULL,
    
    -- Estado y Fechas (siguiendo tus patrones)
    status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    invoice_number VARCHAR(50),
    paid_at TIMESTAMP NULL,
    due_date DATE NOT NULL,
    
    -- Información de Pago
    payment_method ENUM('card', 'transfer', 'paypal') NULL,
    transaction_id VARCHAR(100),
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints siguiendo tus patrones
    CONSTRAINT pk_billing_history PRIMARY KEY (billing_id),
    CONSTRAINT fk_billing_history_tenant FOREIGN KEY (tenant_id) REFERENCES TENANTS(tenant_id) ON DELETE CASCADE,
    CONSTRAINT fk_billing_history_plan FOREIGN KEY (plan_id) REFERENCES SUBSCRIPTION_PLANS(plan_id),
    CONSTRAINT uq_billing_history_invoice UNIQUE (invoice_number),
    
    -- Índices para reportes
    INDEX idx_billing_history_tenant_date (tenant_id, created_at),
    INDEX idx_billing_history_status (status)
) ENGINE=InnoDB COMMENT='Historial de facturación y pagos por tenant';

-- =====================================================
-- TABLA: LOGIN_AUDIT
-- Registro de intentos de login (seguridad)
-- =====================================================
CREATE TABLE LOGIN_AUDIT (
    audit_id INT AUTO_INCREMENT NOT NULL,
    user_id INT NULL COMMENT 'NULL si el login falló',
    tenant_id VARCHAR(50) NULL,
    email VARCHAR(100) NOT NULL,
    
    -- Información del Intento
    login_type ENUM('central', 'direct', 'api') DEFAULT 'central',
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100) NULL COMMENT 'Razón del fallo si success=FALSE',
    
    -- Información de Seguridad (siguiendo tus patrones de audit)
    ip_address VARCHAR(45),
    user_agent TEXT,
    country VARCHAR(50),
    
    -- Metadatos
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT pk_login_audit PRIMARY KEY (audit_id),
    CONSTRAINT fk_login_audit_user FOREIGN KEY (user_id) REFERENCES MASTER_USERS(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_login_audit_tenant FOREIGN KEY (tenant_id) REFERENCES TENANTS(tenant_id) ON DELETE SET NULL,
    
    -- Índices para seguridad y reportes
    INDEX idx_login_audit_email_time (email, attempted_at),
    INDEX idx_login_audit_ip_time (ip_address, attempted_at),
    INDEX idx_login_audit_tenant_time (tenant_id, attempted_at)
) ENGINE=InnoDB COMMENT='Registro de todos los intentos de login para auditoría de seguridad';

-- =====================================================
-- TABLA: TENANT_USAGE_STATS
-- Estadísticas de uso por tenant para facturación
-- =====================================================
CREATE TABLE TENANT_USAGE_STATS (
    stat_id INT AUTO_INCREMENT NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    
    -- Período de la Estadística
    year YEAR NOT NULL,
    month TINYINT NOT NULL,
    
    -- Contadores de Uso (siguiendo tu patrón de campos numéricos)
    total_users INT DEFAULT 0,
    total_recipes INT DEFAULT 0,
    total_events INT DEFAULT 0,
    total_suppliers INT DEFAULT 0,
    total_orders INT DEFAULT 0,
    
    -- Uso de Recursos
    storage_used_mb DECIMAL(10,2) DEFAULT 0.00,
    api_calls INT DEFAULT 0,
    
    -- Actividad
    active_days TINYINT DEFAULT 0 COMMENT 'Días con actividad en el mes',
    last_activity_date DATE,
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT pk_tenant_usage_stats PRIMARY KEY (stat_id),
    CONSTRAINT fk_tenant_usage_stats_tenant FOREIGN KEY (tenant_id) REFERENCES TENANTS(tenant_id) ON DELETE CASCADE,
    CONSTRAINT uq_tenant_usage_stats_period UNIQUE (tenant_id, year, month),
    
    -- Índice para reportes
    INDEX idx_tenant_usage_stats_period (year, month)
) ENGINE=InnoDB COMMENT='Estadísticas de uso mensual por tenant para facturación y análisis';

-- =====================================================
-- TABLA: SYSTEM_NOTIFICATIONS
-- Notificaciones del sistema para tenants
-- =====================================================
CREATE TABLE SYSTEM_NOTIFICATIONS (
    notification_id INT AUTO_INCREMENT NOT NULL,
    tenant_id VARCHAR(50) NULL COMMENT 'NULL para notificaciones globales',
    
    -- Contenido de la Notificación
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'error', 'success') DEFAULT 'info',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    
    -- Estado y Entrega
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL COMMENT 'Fecha de expiración de la notificación',
    
    -- Acción Asociada (opcional)
    action_url VARCHAR(500) NULL COMMENT 'URL de acción si la notificación requiere acción',
    action_label VARCHAR(100) NULL COMMENT 'Texto del botón de acción',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_system BOOLEAN DEFAULT TRUE COMMENT 'TRUE si es automática, FALSE si es manual',
    
    -- Constraints
    CONSTRAINT pk_system_notifications PRIMARY KEY (notification_id),
    CONSTRAINT fk_system_notifications_tenant FOREIGN KEY (tenant_id) REFERENCES TENANTS(tenant_id) ON DELETE CASCADE,
    
    -- Índices para performance
    INDEX idx_system_notifications_tenant_read (tenant_id, is_read),
    INDEX idx_system_notifications_created (created_at)
) ENGINE=InnoDB COMMENT='Notificaciones del sistema para tenants';

-- =====================================================
-- EVENTOS PROGRAMADOS (siguiendo tu patrón EXACTO)
-- =====================================================

-- Activar el programador de eventos ANTES de crear eventos
SET GLOBAL event_scheduler = ON;

-- Limpiar eventos existentes si existen
DROP EVENT IF EXISTS cleanup_login_audit_6months;
DROP EVENT IF EXISTS cleanup_expired_notifications;
DROP EVENT IF EXISTS update_monthly_usage_stats;

-- Limpieza automática de logs de login antiguos (6 meses)
DELIMITER $$
CREATE EVENT cleanup_login_audit_6months
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  DELETE FROM LOGIN_AUDIT 
  WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 6 MONTH);
END$$
DELIMITER ;

-- Limpieza de notificaciones expiradas
DELIMITER $$
CREATE EVENT cleanup_expired_notifications
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  DELETE FROM SYSTEM_NOTIFICATIONS 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END$$
DELIMITER ;

-- Actualización de estadísticas de uso mensual
DELIMITER $$
CREATE EVENT update_monthly_usage_stats
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    -- Actualizar estadísticas del mes actual para todos los tenants activos
    INSERT INTO TENANT_USAGE_STATS (tenant_id, year, month, last_activity_date)
    SELECT 
        tenant_id, 
        YEAR(CURDATE()), 
        MONTH(CURDATE()),
        CURDATE()
    FROM TENANTS 
    WHERE is_active = TRUE
    ON DUPLICATE KEY UPDATE 
        last_activity_date = CURDATE(),
        updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Planes de suscripción por defecto
INSERT INTO SUBSCRIPTION_PLANS (plan_id, name, description, max_users, max_recipes, max_events_per_month, max_suppliers, max_storage_mb, monthly_price, yearly_price) VALUES
('free', 'Plan Gratuito', 'Plan básico para probar la plataforma', 2, 50, 5, 10, 100, 0.00, 0.00),
('basic', 'Plan Básico', 'Ideal para restaurantes pequeños', 5, 200, 20, 25, 500, 29.99, 299.90),
('premium', 'Plan Premium', 'Para restaurantes en crecimiento', 15, 1000, 50, 100, 2000, 79.99, 799.90),
('enterprise', 'Plan Enterprise', 'Para cadenas de restaurantes', 50, 9999, 200, 500, 10000, 199.99, 1999.90);

-- =====================================================
-- VERIFICACIONES FINALES
-- =====================================================

-- Mostrar resumen de tablas creadas
SELECT 'TABLAS CREADAS EXITOSAMENTE:' as message;
SHOW TABLES;

-- Mostrar eventos creados
SELECT 'EVENTOS PROGRAMADOS:' as message;
SHOW EVENTS;

-- Mostrar planes insertados
SELECT 'PLANES DE SUSCRIPCIÓN:' as message;
SELECT plan_id, name, max_users, monthly_price FROM SUBSCRIPTION_PLANS;