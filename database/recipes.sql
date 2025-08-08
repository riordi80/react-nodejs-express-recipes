DROP DATABASE IF EXISTS recipes;
CREATE DATABASE recipes;
USE recipes;

-- Tabla: USERS
CREATE TABLE USERS (
    user_id INT AUTO_INCREMENT NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    role ENUM('admin', 'chef', 'inventory_manager', 'waiter', 'supplier_manager') NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    language VARCHAR(5) DEFAULT 'es',
    timezone VARCHAR(50) DEFAULT 'Europe/Madrid',
    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

-- Tabla: INGREDIENTS
-- TODO: Añadir campos stock_minimum y season para dashboard
CREATE TABLE INGREDIENTS (
    ingredient_id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(100) NOT NULL,
    unit ENUM('gr', 'kg', 'ml', 'l', 'unit', 'tbsp', 'tsp') NOT NULL,
    base_price DECIMAL(10,4) NOT NULL,
    waste_percent DECIMAL(5,4) DEFAULT 0.0000,
    net_price DECIMAL(10,4),
    stock DECIMAL(10,2) DEFAULT 0.00,
    stock_minimum DECIMAL(10,2) DEFAULT 0.00,
    season VARCHAR(100),
    expiration_date DATE,
    is_available BOOLEAN DEFAULT TRUE,
    comment TEXT,
    calories_per_100g DECIMAL(8,2) DEFAULT 0.00,
    protein_per_100g DECIMAL(8,2) DEFAULT 0.00,
    carbs_per_100g DECIMAL(8,2) DEFAULT 0.00,
    fat_per_100g DECIMAL(8,2) DEFAULT 0.00,
    CONSTRAINT pk_ingredients PRIMARY KEY (ingredient_id),
    CONSTRAINT uq_ingredients_name UNIQUE (name)
) ENGINE=InnoDB;

-- Tabla: INGREDIENT_CATEGORIES
CREATE TABLE INGREDIENT_CATEGORIES (
    category_id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(100) NOT NULL,
    CONSTRAINT pk_ingredient_categories PRIMARY KEY (category_id),
    CONSTRAINT uq_ingredient_categories_name UNIQUE (name)
) ENGINE=InnoDB;

-- Tabla: RECIPE_CATEGORIES
CREATE TABLE RECIPE_CATEGORIES (
    category_id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(100) NOT NULL,
    CONSTRAINT pk_recipe_categories PRIMARY KEY (category_id),
    CONSTRAINT uq_recipe_categories_name UNIQUE (name)
) ENGINE=InnoDB;

-- Tabla: ALLERGENS
CREATE TABLE ALLERGENS (
    allergen_id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(100) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    CONSTRAINT pk_allergens PRIMARY KEY (allergen_id),
    CONSTRAINT uq_allergens_name UNIQUE (name)
) ENGINE=InnoDB;

-- Tabla: TAXES
CREATE TABLE TAXES (
    tax_id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(50) NOT NULL,
    percent DECIMAL(5,2) NOT NULL,
    CONSTRAINT pk_taxes PRIMARY KEY (tax_id),
    CONSTRAINT uq_taxes_name UNIQUE (name)
) ENGINE=InnoDB;

-- Tabla: RECIPES
-- TODO: Añadir campo created_at para dashboard (últimas recetas añadidas)
CREATE TABLE RECIPES (
    recipe_id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(100) NOT NULL,
    servings INT NOT NULL,
    production_servings INT NOT NULL,
    cost_per_serving DECIMAL(10,2),
    cost_percentage DECIMAL(6,2),
    net_price DECIMAL(10,2) NOT NULL,
    prep_time INT,
    difficulty ENUM('easy', 'medium', 'hard'),
    is_featured_recipe BOOLEAN DEFAULT FALSE,
    instructions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tax_id INT,
    CONSTRAINT pk_recipes PRIMARY KEY (recipe_id),
    CONSTRAINT uq_recipes_name UNIQUE (name),
    CONSTRAINT fk_recipes_tax FOREIGN KEY (tax_id) REFERENCES TAXES(tax_id)
) ENGINE=InnoDB;

-- Tabla: RECIPE_SECTIONS
CREATE TABLE RECIPE_SECTIONS (
    section_id INT AUTO_INCREMENT NOT NULL,
    recipe_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    section_order INT,  -- en produccion no permite "order" (palabra reservada). Hemos puesto "section_order" en banahosting
    CONSTRAINT pk_recipe_sections PRIMARY KEY (section_id),
    CONSTRAINT fk_recipe_sections_recipe FOREIGN KEY (recipe_id) REFERENCES RECIPES(recipe_id)
) ENGINE=InnoDB;

-- Tabla: MENUS
CREATE TABLE MENUS (
    menu_id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(100) NOT NULL,
    menu_date DATE NOT NULL,
    CONSTRAINT pk_menus PRIMARY KEY (menu_id),
    CONSTRAINT uq_menus_name_date UNIQUE (name, menu_date)
) ENGINE=InnoDB;

-- Tabla: INVENTORY_MOVEMENTS
CREATE TABLE INVENTORY_MOVEMENTS (
    movement_id INT AUTO_INCREMENT NOT NULL,
    ingredient_id INT NOT NULL,
    date DATE NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    movement_type ENUM('entry', 'exit', 'adjustment', 'transfer') NOT NULL,
    comment TEXT,
    recorded_by_user_id INT,
    CONSTRAINT pk_inventory_movements PRIMARY KEY (movement_id),
    CONSTRAINT fk_inventory_movements_ingredient FOREIGN KEY (ingredient_id) REFERENCES INGREDIENTS(ingredient_id),
    CONSTRAINT fk_inventory_movements_user FOREIGN KEY (recorded_by_user_id) REFERENCES USERS(user_id)
) ENGINE=InnoDB;

-- Tabla: SUPPLIERS
CREATE TABLE SUPPLIERS (
    supplier_id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    website_url VARCHAR(200),
    address TEXT,
    CONSTRAINT pk_suppliers PRIMARY KEY (supplier_id),
    CONSTRAINT uq_suppliers_name UNIQUE (name)
) ENGINE=InnoDB;

-- Tabla: PRICE_HISTORY (Registro de logs)
CREATE TABLE PRICE_HISTORY (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    ingredient_id INT NOT NULL,
    old_price DECIMAL(10,2) NOT NULL,
    new_price DECIMAL(10,2) NOT NULL,
    changed_by_user_id INT NOT NULL,
    change_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ph_ingredient FOREIGN KEY (ingredient_id) REFERENCES INGREDIENTS(ingredient_id),
    CONSTRAINT fk_ph_user FOREIGN KEY (changed_by_user_id) REFERENCES USERS(user_id)
) ENGINE=InnoDB;

-- Tabla: INGREDIENT_LOGS (Registro de logs)
CREATE TABLE INGREDIENT_LOGS (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    ingredient_id INT,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by_user_id INT,
    log_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_il_ingredient FOREIGN KEY (ingredient_id) REFERENCES INGREDIENTS(ingredient_id),
    CONSTRAINT fk_il_user FOREIGN KEY (changed_by_user_id) REFERENCES USERS(user_id)
) ENGINE=InnoDB;

-- Tabla intermedia: RECIPE_INGREDIENTS
CREATE TABLE RECIPE_INGREDIENTS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    quantity_per_serving DECIMAL(10,2) NOT NULL,
    section_id INT,
    CONSTRAINT unique_recipe_ingredient_section UNIQUE (recipe_id, ingredient_id, section_id),
    CONSTRAINT fk_recipe_ingredients_recipe FOREIGN KEY (recipe_id) REFERENCES RECIPES(recipe_id),
    CONSTRAINT fk_recipe_ingredients_ingredient FOREIGN KEY (ingredient_id) REFERENCES INGREDIENTS(ingredient_id),
    CONSTRAINT fk_recipe_ingredients_section FOREIGN KEY (section_id) REFERENCES RECIPE_SECTIONS(section_id)
) ENGINE=InnoDB;

-- Tabla intermedia: INGREDIENT_CATEGORY_ASSIGNMENTS
CREATE TABLE INGREDIENT_CATEGORY_ASSIGNMENTS (
    ingredient_id INT NOT NULL,
    category_id INT NOT NULL,
    CONSTRAINT pk_ingredient_category_assignments PRIMARY KEY (ingredient_id, category_id),
    CONSTRAINT fk_ingredient_category_assignments_ingredient FOREIGN KEY (ingredient_id) REFERENCES INGREDIENTS(ingredient_id),
    CONSTRAINT fk_ingredient_category_assignments_category FOREIGN KEY (category_id) REFERENCES INGREDIENT_CATEGORIES(category_id)
) ENGINE=InnoDB;

-- Tabla intermedia: RECIPE_CATEGORY_ASSIGNMENTS
CREATE TABLE RECIPE_CATEGORY_ASSIGNMENTS (
    recipe_id INT NOT NULL,
    category_id INT NOT NULL,
    CONSTRAINT pk_recipe_category_assignments PRIMARY KEY (recipe_id, category_id),
    CONSTRAINT fk_recipe_category_assignments_recipe FOREIGN KEY (recipe_id) REFERENCES RECIPES(recipe_id),
    CONSTRAINT fk_recipe_category_assignments_category FOREIGN KEY (category_id) REFERENCES RECIPE_CATEGORIES(category_id)
) ENGINE=InnoDB;

-- Tabla intermedia: MENU_RECIPES
CREATE TABLE MENU_RECIPES (
    menu_id INT NOT NULL,
    recipe_id INT NOT NULL,
    CONSTRAINT pk_menu_recipes PRIMARY KEY (menu_id, recipe_id),
    CONSTRAINT fk_menu_recipes_menu FOREIGN KEY (menu_id) REFERENCES MENUS(menu_id),
    CONSTRAINT fk_menu_recipes_recipe FOREIGN KEY (recipe_id) REFERENCES RECIPES(recipe_id)
) ENGINE=InnoDB;

-- Tabla intermedia: INGREDIENT_ALLERGENS
CREATE TABLE INGREDIENT_ALLERGENS (
    ingredient_id INT NOT NULL,
    allergen_id INT NOT NULL,
    CONSTRAINT pk_ingredient_allergens PRIMARY KEY (ingredient_id, allergen_id),
    CONSTRAINT fk_ingredient_allergens_ingredient FOREIGN KEY (ingredient_id) REFERENCES INGREDIENTS(ingredient_id),
    CONSTRAINT fk_ingredient_allergens_allergen FOREIGN KEY (allergen_id) REFERENCES ALLERGENS(allergen_id)
) ENGINE=InnoDB;

-- Tabla intermedia: SUPPLIER_INGREDIENTS
CREATE TABLE SUPPLIER_INGREDIENTS (
    supplier_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    price DECIMAL(10,4) NOT NULL,
    delivery_time INT,
    is_preferred_supplier BOOLEAN DEFAULT FALSE,
    package_size DECIMAL(10,4) NOT NULL DEFAULT 1.0 COMMENT 'Tamaño del paquete/unidad de venta (ej: 2.0 para botella de 2L)',
    package_unit VARCHAR(50) NOT NULL DEFAULT 'unidad' COMMENT 'Unidad del paquete (ej: botella, saco, caja, etc.)',
    minimum_order_quantity DECIMAL(10,2) NOT NULL DEFAULT 1.0 COMMENT 'Cantidad mínima de pedido en unidades del paquete',
    CONSTRAINT pk_supplier_ingredients PRIMARY KEY (supplier_id, ingredient_id),
    CONSTRAINT fk_supplier_ingredients_supplier FOREIGN KEY (supplier_id) REFERENCES SUPPLIERS(supplier_id),
    CONSTRAINT fk_supplier_ingredients_ingredient FOREIGN KEY (ingredient_id) REFERENCES INGREDIENTS(ingredient_id)
) ENGINE=InnoDB;

CREATE TABLE AUDIT_LOGS (
    audit_id INT AUTO_INCREMENT NOT NULL,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT,
    description TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_audit_logs PRIMARY KEY (audit_id),
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES USERS(user_id)
) ENGINE=InnoDB;

-- Tabla: SYSTEM_SETTINGS
-- Nueva tabla para configuración del sistema (políticas de contraseñas, sesiones, etc.)
CREATE TABLE SYSTEM_SETTINGS (
    setting_id INT AUTO_INCREMENT NOT NULL,
    setting_key VARCHAR(50) NOT NULL,
    setting_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_system_settings PRIMARY KEY (setting_id),
    CONSTRAINT uq_system_settings_key UNIQUE (setting_key)
) ENGINE=InnoDB;

-- Tabla: RESTAURANT_INFO
-- Información general del restaurante/negocio
CREATE TABLE RESTAURANT_INFO (
    restaurant_id INT AUTO_INCREMENT NOT NULL,
    
    -- Información Básica
    name VARCHAR(150) NOT NULL,
    business_name VARCHAR(150) NULL COMMENT 'Razón social oficial',
    description TEXT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(100) NULL,
    website VARCHAR(255) NULL,
    
    -- Dirección
    address VARCHAR(200) NULL,
    city VARCHAR(100) NULL,
    postal_code VARCHAR(20) NULL,
    country VARCHAR(50) DEFAULT 'España',
    
    -- Información Fiscal
    tax_number VARCHAR(50) NULL COMMENT 'CIF/NIF del negocio',
    vat_rate DECIMAL(5,2) DEFAULT 21.00 COMMENT 'IVA por defecto del país/región',
    
    -- Configuración del Negocio
    cuisine_type VARCHAR(100) NULL COMMENT 'Tipo de cocina: italiana, española, fusión, etc.',
    seating_capacity INT NULL COMMENT 'Aforo máximo del restaurante',
    opening_hours JSON NULL COMMENT 'Horarios por día de la semana en formato JSON',
    
    -- Información de Contacto Adicional
    manager_name VARCHAR(100) NULL COMMENT 'Nombre del gerente/responsable',
    manager_phone VARCHAR(20) NULL,
    emergency_contact VARCHAR(100) NULL,
    emergency_phone VARCHAR(20) NULL,
    
    -- Configuración del Sistema
    default_currency VARCHAR(3) DEFAULT 'EUR',
    default_language VARCHAR(5) DEFAULT 'es',
    timezone VARCHAR(50) DEFAULT 'Europe/Madrid',
    
    -- Configuración de Costos y Objetivos
    target_food_cost_percentage DECIMAL(5,2) DEFAULT 30.00 COMMENT 'Porcentaje objetivo de costos de comida',
    labor_cost_per_hour DECIMAL(10,2) NULL COMMENT 'Costo de mano de obra por hora',
    rent_monthly DECIMAL(10,2) NULL COMMENT 'Alquiler mensual del local',
    
    -- Social Media y Marketing
    instagram_handle VARCHAR(100) NULL,
    facebook_page VARCHAR(255) NULL,
    google_business_url VARCHAR(255) NULL,
    
    -- Configuración Visual
    logo_url VARCHAR(255) NULL COMMENT 'URL del logo del restaurante',
    primary_color VARCHAR(7) DEFAULT '#f97316' COMMENT 'Color primario en hex para la interfaz',
    secondary_color VARCHAR(7) DEFAULT '#1f2937' COMMENT 'Color secundario en hex',
    
    -- Metadatos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NULL,
    
    -- Constraints
    CONSTRAINT pk_restaurant_info PRIMARY KEY (restaurant_id),
    CONSTRAINT fk_restaurant_updated_by FOREIGN KEY (updated_by) REFERENCES USERS(user_id),
    CONSTRAINT uq_restaurant_email UNIQUE (email),
    CONSTRAINT uq_restaurant_tax_number UNIQUE (tax_number)
) ENGINE=InnoDB COMMENT='Información general del restaurante/negocio';

-- =====================================================
-- NUEVAS TABLAS PARA DASHBOARD Y GESTIÓN DE EVENTOS
-- =====================================================

-- Tabla: EVENTS
-- Nueva tabla para gestión de eventos y planificación
CREATE TABLE EVENTS (
    event_id INT AUTO_INCREMENT NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    guests_count INT NOT NULL DEFAULT 0,
    location VARCHAR(255),
    status ENUM('planned', 'confirmed', 'in_progress', 'completed', 'cancelled') DEFAULT 'planned',
    budget DECIMAL(10,2),
    notes TEXT,
    created_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_events PRIMARY KEY (event_id),
    CONSTRAINT fk_events_created_by FOREIGN KEY (created_by_user_id) REFERENCES USERS(user_id)
) ENGINE=InnoDB;

-- Tabla intermedia: EVENT_MENUS
-- Nueva tabla para relacionar eventos con recetas (menús de eventos)
CREATE TABLE EVENT_MENUS (
    event_id INT NOT NULL,
    recipe_id INT NOT NULL,
    portions INT NOT NULL DEFAULT 1,
    course_type ENUM('starter', 'main', 'dessert', 'beverage', 'side') NOT NULL,
    notes TEXT,
    CONSTRAINT pk_event_menus PRIMARY KEY (event_id, recipe_id),
    CONSTRAINT fk_event_menus_event FOREIGN KEY (event_id) REFERENCES EVENTS(event_id) ON DELETE CASCADE,
    CONSTRAINT fk_event_menus_recipe FOREIGN KEY (recipe_id) REFERENCES RECIPES(recipe_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Tabla: SUPPLIER_ORDERS
-- Nueva tabla para recordatorios de pedidos a proveedores
CREATE TABLE SUPPLIER_ORDERS (
    order_id INT AUTO_INCREMENT NOT NULL,
    supplier_id INT NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    status ENUM('pending', 'ordered', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(10,2),
    notes TEXT,
    source_events JSON NULL COMMENT 'Array de event_ids que generaron este pedido',
    created_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_supplier_orders PRIMARY KEY (order_id),
    CONSTRAINT fk_supplier_orders_supplier FOREIGN KEY (supplier_id) REFERENCES SUPPLIERS(supplier_id),
    CONSTRAINT fk_supplier_orders_created_by FOREIGN KEY (created_by_user_id) REFERENCES USERS(user_id)
) ENGINE=InnoDB;

-- Tabla intermedia: SUPPLIER_ORDER_ITEMS
-- Detalle de los items de cada pedido a proveedores
CREATE TABLE SUPPLIER_ORDER_ITEMS (
    order_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    CONSTRAINT pk_supplier_order_items PRIMARY KEY (order_id, ingredient_id),
    CONSTRAINT fk_supplier_order_items_order FOREIGN KEY (order_id) REFERENCES SUPPLIER_ORDERS(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_supplier_order_items_ingredient FOREIGN KEY (ingredient_id) REFERENCES INGREDIENTS(ingredient_id)
) ENGINE=InnoDB;


-----------------------------------------------------
---------------------- EVENTOS ----------------------
-----------------------------------------------------

-- Evento para limpiar registros de auditoría de más de 6 meses
CREATE EVENT cleanup_audit_logs_6months
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO
  DELETE FROM AUDIT_LOGS 
  WHERE timestamp < DATE_SUB(NOW(), INTERVAL 6 MONTH);

-- Activar el programador de eventos
SET GLOBAL event_scheduler = ON;

-- Para verificar eventos creados: SHOW EVENTS;
-- Para limpieza manual: DELETE FROM AUDIT_LOGS WHERE timestamp < DATE_SUB(NOW(), INTERVAL 6 MONTH);



-----------------------------------------------------
---------------- PROCEDIMIENTOS ---------------------
-----------------------------------------------------


-- 1º. Procedimiento: sp_update_cost_per_serving
DELIMITER $$

CREATE PROCEDURE sp_update_cost_per_serving(IN p_recipe_id INT)
BEGIN
    DECLARE v_total_cost DECIMAL(10,2);
    DECLARE v_production_servings INT;

    -- Calcular el coste total de ingredientes de la receta
    SELECT 
        SUM(ri.quantity_per_serving * i.base_price * (1 + i.waste_percent))
    INTO v_total_cost
    FROM RECIPE_INGREDIENTS ri
    JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
    WHERE ri.recipe_id = p_recipe_id;

    -- Obtener número de raciones para producción
    SELECT production_servings
    INTO v_production_servings
    FROM RECIPES
    WHERE recipe_id = p_recipe_id;

    -- Actualizar el coste por ración
    UPDATE RECIPES
    SET cost_per_serving = IFNULL(v_total_cost / v_production_servings, 0)
    WHERE recipe_id = p_recipe_id;
END$$

DELIMITER ;

-- 2º. Procedimiento: sp_update_cost_percentage
DELIMITER $$

CREATE PROCEDURE sp_update_cost_percentage(IN p_recipe_id INT)
BEGIN
    DECLARE v_cost_per_serving DECIMAL(10,2);
    DECLARE v_net_price DECIMAL(10,2);
    DECLARE v_percentage DECIMAL(6,2);

    -- Obtener los valores actuales
    SELECT cost_per_serving, net_price
    INTO v_cost_per_serving, v_net_price
    FROM RECIPES
    WHERE recipe_id = p_recipe_id;

    -- Calcular el porcentaje de costo
    IF v_net_price > 0 THEN
        SET v_percentage = (v_cost_per_serving / v_net_price) * 100;
    ELSE
        SET v_percentage = 0;
    END IF;

    -- Actualizar el campo en la receta
    UPDATE RECIPES
    SET cost_percentage = v_percentage
    WHERE recipe_id = p_recipe_id;
END$$

DELIMITER ;

-- 3º. Procedimiento MAESTRO: sp_update_recipe_costs (ejecuta los dos procedimientos anteriores con este único procedimiento).
-- Se ejecuta con el comando. Sustituir el 5 por el id de la receta: CALL sp_update_recipe_costs(5); 
DELIMITER $$

CREATE PROCEDURE sp_update_recipe_costs(IN p_recipe_id INT)
BEGIN
    -- Primero actualizamos el coste por ración
    CALL sp_update_cost_per_serving(p_recipe_id);

    -- Luego actualizamos el porcentaje de coste
    CALL sp_update_cost_percentage(p_recipe_id);
END$$

DELIMITER ;

-- 4º Procedimiento que actualiza recetas que usan un ingrediente específico
DELIMITER $$

CREATE PROCEDURE sp_update_all_recipes_for_ingredient(IN p_ingredient_id INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE recipe_id_target INT;

    DECLARE cur CURSOR FOR
        SELECT recipe_id
        FROM RECIPE_INGREDIENTS
        WHERE ingredient_id = p_ingredient_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO recipe_id_target;
        IF done THEN
            LEAVE read_loop;
        END IF;

        CALL sp_update_recipe_costs(recipe_id_target);
    END LOOP;

    CLOSE cur;
END$$

DELIMITER ;

-- 5º Procedimiento que Actualiza todas las recetas del sistema
DELIMITER $$

CREATE PROCEDURE sp_update_all_recipes()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE recipe_id_target INT;

    DECLARE cur CURSOR FOR
        SELECT recipe_id FROM RECIPES;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO recipe_id_target;
        IF done THEN
            LEAVE read_loop;
        END IF;

        CALL sp_update_recipe_costs(recipe_id_target);
    END LOOP;

    CLOSE cur;
END$$

DELIMITER ;

-----------------------------------------------------
-------------------- TRIGGERS -----------------------
-----------------------------------------------------


-- 1º Trigger: trg_update_recipe_costs. Para que se actualicen al instante los campos (cost_percentage y cost_per_serving) cada vez que se inserta, actualiza o elimina un ingrediente de una receta (RECIPE_INGREDIENTS)
-- Necesitamos crear un trigger separado para cada evento. En total 3 Triggers (Se ejecutan después de un INSERT, de un UPDATE y de un DELETE) para trg_update_recipe_costs.
-- 1 de 3. Trigger trg_update_recipe_costs para AFTER INSERT
DELIMITER $$

CREATE TRIGGER trg_update_recipe_costs_after_insert
AFTER INSERT ON RECIPE_INGREDIENTS
FOR EACH ROW
BEGIN
    CALL sp_update_recipe_costs(NEW.recipe_id);
END$$

DELIMITER ;

-- 2 de 3. Trigger trg_update_recipe_costs para AFTER UPDATE
DELIMITER $$

CREATE TRIGGER trg_update_recipe_costs_after_update
AFTER UPDATE ON RECIPE_INGREDIENTS
FOR EACH ROW
BEGIN
    CALL sp_update_recipe_costs(NEW.recipe_id);
END$$

DELIMITER ;

-- 3 de 3. Trigger trg_update_recipe_costs para AFTER DELETE
DELIMITER $$

CREATE TRIGGER trg_update_recipe_costs_after_delete
AFTER DELETE ON RECIPE_INGREDIENTS
FOR EACH ROW
BEGIN
    CALL sp_update_recipe_costs(OLD.recipe_id);
END$$

DELIMITER ;


-----------------------------------------------------------------------


-- 2º Trigger: trg_update_recipe_costs_on_price_change. Cada vez que un ingrediente cambia de precio, actualiza los costes de todas las recetas.
DELIMITER $$

CREATE TRIGGER trg_update_recipe_costs_on_price_change
AFTER UPDATE ON INGREDIENTS
FOR EACH ROW
BEGIN
    -- Solo si cambió el precio base
    IF NEW.base_price <> OLD.base_price THEN
        -- Actualizar todas las recetas que usen este ingrediente
        UPDATE RECIPES
        SET cost_per_serving = NULL -- para forzar el backend o proceso a recalcular
        WHERE recipe_id IN (
            SELECT recipe_id
            FROM RECIPE_INGREDIENTS
            WHERE ingredient_id = NEW.ingredient_id
        );
    END IF;
END$$

DELIMITER ;

-----------------------------------------------------------------------

-- 3º Trigger: trg_calculate_net_price_before_insert. Calcula automáticamente el net_price antes de insertar un ingrediente
DELIMITER $$

CREATE TRIGGER trg_calculate_net_price_before_insert
BEFORE INSERT ON INGREDIENTS
FOR EACH ROW
BEGIN
    -- Calcular net_price = base_price * (1 + waste_percent) con redondeo a 2 decimales
    IF NEW.base_price IS NOT NULL AND NEW.waste_percent IS NOT NULL THEN
        SET NEW.net_price = ROUND(NEW.base_price * (1 + NEW.waste_percent), 2);
    ELSEIF NEW.base_price IS NOT NULL AND NEW.waste_percent IS NULL THEN
        SET NEW.net_price = NEW.base_price;
    ELSE
        SET NEW.net_price = NULL;
    END IF;
END$$

DELIMITER ;

-- 4º Trigger: trg_calculate_net_price_before_update. Calcula automáticamente el net_price antes de actualizar un ingrediente
DELIMITER $$

CREATE TRIGGER trg_calculate_net_price_before_update
BEFORE UPDATE ON INGREDIENTS
FOR EACH ROW
BEGIN
    -- Calcular net_price = base_price * (1 + waste_percent) con redondeo a 2 decimales
    IF NEW.base_price IS NOT NULL AND NEW.waste_percent IS NOT NULL THEN
        SET NEW.net_price = ROUND(NEW.base_price * (1 + NEW.waste_percent), 2);
    ELSEIF NEW.base_price IS NOT NULL AND NEW.waste_percent IS NULL THEN
        SET NEW.net_price = NEW.base_price;
    ELSE
        SET NEW.net_price = NULL;
    END IF;
END$$

DELIMITER ;

-- Comando para actualizar todos los net_price existentes con la nueva fórmula
-- EJECUTAR DESPUÉS DE CREAR LOS TRIGGERS:
-- UPDATE INGREDIENTS SET net_price = ROUND(base_price * (1 + IFNULL(waste_percent, 0)), 2) WHERE base_price IS NOT NULL;