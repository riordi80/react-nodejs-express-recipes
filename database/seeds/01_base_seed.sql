-- =======================================================
-- SCRIPT BASE - DATOS ESENCIALES
-- =======================================================
-- Este script contiene únicamente los datos indispensables:
-- - Usuario administrador
-- - 14 Alérgenos obligatorios UE
-- - 50 Ingredientes básicos con valores nutricionales
-- - Categorías de ingredientes y recetas
-- - Impuestos básicos
-- - Configuración del sistema
-- - Asignaciones de categorías y alérgenos con temporadas
-- =======================================================

USE recipes;

-- Limpiar datos existentes
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE AUDIT_LOGS;
TRUNCATE TABLE SUPPLIER_ORDER_ITEMS;
TRUNCATE TABLE SUPPLIER_ORDERS;
TRUNCATE TABLE EVENT_MENUS;
TRUNCATE TABLE EVENTS;
TRUNCATE TABLE SUPPLIER_INGREDIENTS;
TRUNCATE TABLE INGREDIENT_ALLERGENS;
TRUNCATE TABLE MENU_RECIPES;
TRUNCATE TABLE RECIPE_CATEGORY_ASSIGNMENTS;
TRUNCATE TABLE INGREDIENT_CATEGORY_ASSIGNMENTS;
TRUNCATE TABLE RECIPE_INGREDIENTS;
TRUNCATE TABLE RECIPE_SECTIONS;
TRUNCATE TABLE INVENTORY_MOVEMENTS;
TRUNCATE TABLE PRICE_HISTORY;
TRUNCATE TABLE INGREDIENT_LOGS;
TRUNCATE TABLE MENUS;
TRUNCATE TABLE RECIPES;
TRUNCATE TABLE SUPPLIERS;
TRUNCATE TABLE INGREDIENTS;
TRUNCATE TABLE RECIPE_CATEGORIES;
TRUNCATE TABLE INGREDIENT_CATEGORIES;
TRUNCATE TABLE ALLERGENS;
TRUNCATE TABLE TAXES;
TRUNCATE TABLE SYSTEM_SETTINGS;
TRUNCATE TABLE RESTAURANT_INFO;
TRUNCATE TABLE USERS;
SET FOREIGN_KEY_CHECKS = 1;

-- =======================================================
-- 1. USUARIO ADMINISTRADOR
-- =======================================================
INSERT INTO USERS (first_name, last_name, email, role, password_hash, is_active, language, timezone) VALUES
('Admin', 'Sistema', 'admin@example.com', 'admin', '$2b$12$WB8g2SbqdkGyOhZo5JKPfesy6WYXBZj4IzWhCVeJ4BPmAmDgcPyta', TRUE, 'es', 'Europe/Madrid');

-- =======================================================
-- 2. ALÉRGENOS OBLIGATORIOS (UE)
-- =======================================================
INSERT INTO ALLERGENS (name) VALUES
('Gluten'),
('Crustáceos'),
('Huevos'),
('Pescado'),
('Cacahuetes'),
('Soja'),
('Leche'),
('Frutos de cáscara'),
('Apio'),
('Mostaza'),
('Granos de sésamo'),
('Dióxido de azufre y sulfitos'),
('Altramuces'),
('Moluscos');

-- =======================================================
-- 3. CATEGORÍAS
-- =======================================================
INSERT INTO INGREDIENT_CATEGORIES (name) VALUES
('Carnes'),
('Pescados y mariscos'),
('Verduras y hortalizas'),
('Frutas'),
('Cereales y legumbres'),
('Lácteos y huevos'),
('Aceites y grasas'),
('Especias y condimentos'),
('Frutos secos'),
('Bebidas');

INSERT INTO RECIPE_CATEGORIES (name) VALUES
('Aperitivos'),
('Bebidas'),
('Comida asiática'),
('Comida italiana'),
('Comida mediterránea'),
('Comida mexicana'),
('Comida vegana'),
('Comida vegetariana'),
('Ensaladas'),
('Entrantes'),
('Guarniciones'),
('Pasta'),
('Platos principales'),
('Postres'),
('Salsas'),
('Sopas');

-- =======================================================
-- 4. IMPUESTOS
-- =======================================================
INSERT INTO TAXES (name, percent) VALUES
('IGIC', 7.00),
('IGIC Comercio Minorista', 0.00),
('IVA General', 21.00),
('IVA Reducido', 10.00),
('IVA Superreducido', 4.00),
('Sin IVA', 0.00);

-- =======================================================
-- 5. INGREDIENTES COMPLETOS (150 ingredientes comunes con datos reales)
-- =======================================================
INSERT INTO INGREDIENTS (name, unit, base_price, waste_percent, stock, stock_minimum, season, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, comment) VALUES
-- CARNES (1-20)
('Pollo (pechuga)', 'kg', 8.50, 0.15, 0, 2, 'todo el año', 165, 31.0, 0.0, 3.6, 'Proteína magra, versátil'),
('Ternera (solomillo)', 'kg', 25.00, 0.20, 0, 1, 'todo el año', 158, 26.0, 0.0, 5.4, 'Corte premium'),
('Cerdo (lomo)', 'kg', 12.00, 0.18, 0, 2, 'todo el año', 143, 26.8, 0.0, 3.5, 'Carne magra'),
('Cordero (pierna)', 'kg', 18.00, 0.22, 0, 1, 'octubre,noviembre,diciembre,enero,febrero', 294, 25.6, 0.0, 20.8, 'Sabor intenso'),
('Jamón serrano', 'kg', 35.00, 0.05, 0, 0.5, 'todo el año', 241, 30.5, 1.0, 12.8, 'Curado artesanal'),
('Pollo (muslo)', 'kg', 6.50, 0.18, 0, 2, 'todo el año', 209, 18.6, 0.0, 15.5, 'Jugoso y económico'),
('Ternera (entrecot)', 'kg', 22.00, 0.20, 0, 1, 'todo el año', 250, 26.0, 0.0, 15.0, 'Corte sabroso'),
('Cerdo (costilla)', 'kg', 9.50, 0.25, 0, 2, 'todo el año', 277, 19.3, 0.0, 21.9, 'Para guisos'),
('Pavo (pechuga)', 'kg', 11.00, 0.15, 0, 1, 'todo el año', 135, 30.1, 0.0, 0.7, 'Muy magro'),
('Conejo', 'kg', 14.00, 0.25, 0, 1, 'todo el año', 173, 33.0, 0.0, 3.5, 'Carne blanca'),
('Chorizo', 'kg', 16.00, 0.08, 0, 1, 'todo el año', 455, 24.1, 2.0, 38.1, 'Embutido español'),
('Morcilla', 'kg', 12.00, 0.10, 0, 0.5, 'todo el año', 379, 14.6, 1.3, 34.5, 'Embutido tradicional'),
('Panceta', 'kg', 10.00, 0.15, 0, 1, 'todo el año', 518, 9.3, 0.0, 53.0, 'Alto contenido graso'),
('Lomo embuchado', 'kg', 28.00, 0.05, 0, 0.5, 'todo el año', 230, 32.0, 1.2, 11.0, 'Embutido curado'),
('Salchichas frescas', 'kg', 8.00, 0.12, 0, 1, 'todo el año', 301, 13.0, 3.0, 26.0, 'Para parrilla'),
('Ternera (falda)', 'kg', 15.00, 0.20, 0, 1, 'todo el año', 162, 26.6, 0.0, 5.7, 'Para estofados'),
('Cordero (chuletas)', 'kg', 24.00, 0.15, 0, 1, 'octubre,noviembre,diciembre,enero,febrero', 294, 25.6, 0.0, 20.8, 'Corte premium'),
('Cerdo (secreto)', 'kg', 18.00, 0.10, 0, 1, 'todo el año', 250, 20.0, 0.0, 19.0, 'Corte ibérico'),
('Pollo (entero)', 'kg', 5.50, 0.20, 0, 2, 'todo el año', 239, 18.6, 0.0, 17.6, 'Económico'),
('Pato', 'kg', 20.00, 0.25, 0, 1, 'todo el año', 337, 18.9, 0.0, 28.4, 'Carne grasa'),

-- PESCADOS Y MARISCOS (21-35)
('Salmón', 'kg', 22.00, 0.25, 0, 1, 'todo el año', 208, 25.4, 0.0, 12.4, 'Rico en omega-3'),
('Merluza', 'kg', 16.00, 0.30, 0, 1, 'octubre,noviembre,diciembre,enero,febrero', 92, 17.8, 1.3, 2.2, 'Pescado blanco'),
('Atún', 'kg', 18.00, 0.20, 0, 1, 'julio,agosto,septiembre,octubre', 184, 30.0, 0.0, 6.3, 'Alto contenido proteico'),
('Gambas', 'kg', 28.00, 0.35, 0, 0.5, 'todo el año', 106, 18.0, 2.9, 2.4, 'Marisco premium'),
('Mejillones', 'kg', 8.00, 0.40, 0, 1, 'septiembre,octubre,noviembre,diciembre,enero,febrero', 172, 24.0, 7.4, 4.5, 'Rico en minerales'),
('Bacalao', 'kg', 14.00, 0.28, 0, 1, 'todo el año', 82, 17.8, 0.0, 0.7, 'Pescado magro'),
('Lubina', 'kg', 20.00, 0.30, 0, 1, 'todo el año', 82, 16.5, 0.0, 1.5, 'Pescado de calidad'),
('Dorada', 'kg', 18.00, 0.30, 0, 1, 'todo el año', 96, 19.8, 0.0, 1.2, 'Sabor delicado'),
('Sardinas', 'kg', 6.50, 0.25, 0, 1, 'mayo,junio,julio,agosto,septiembre', 208, 24.6, 0.0, 11.5, 'Pescado azul'),
('Langostinos', 'kg', 35.00, 0.40, 0, 0.5, 'todo el año', 106, 18.0, 2.9, 2.4, 'Marisco de lujo'),
('Almejas', 'kg', 25.00, 0.45, 0, 0.5, 'septiembre,octubre,noviembre,diciembre,enero,febrero', 148, 25.6, 5.1, 2.0, 'Molusco sabroso'),
('Pulpo', 'kg', 22.00, 0.20, 0, 0.5, 'todo el año', 164, 29.8, 4.4, 2.1, 'Textura especial'),
('Sepia', 'kg', 18.00, 0.25, 0, 0.5, 'todo el año', 134, 25.4, 1.5, 2.3, 'Cefalópodo'),
('Boquerones', 'kg', 8.00, 0.30, 0, 1, 'abril,mayo,junio,julio,agosto', 131, 20.1, 0.0, 4.8, 'Pescado pequeño'),
('Rape', 'kg', 24.00, 0.35, 0, 1, 'octubre,noviembre,diciembre,enero,febrero', 76, 17.0, 0.0, 0.9, 'Pescado firme'),

-- VERDURAS Y HORTALIZAS (36-75)
('Tomate', 'kg', 3.20, 0.10, 0, 3, 'mayo,junio,julio,agosto,septiembre', 18, 0.9, 3.9, 0.2, 'Base de muchas salsas'),
('Cebolla', 'kg', 1.80, 0.15, 0, 5, 'todo el año', 40, 1.1, 9.3, 0.1, 'Aromático fundamental'),
('Ajo', 'kg', 8.00, 0.20, 0, 0.5, 'junio,julio,agosto', 149, 6.4, 33.1, 0.5, 'Condimento esencial'),
('Pimiento rojo', 'kg', 4.50, 0.12, 0, 2, 'junio,julio,agosto,septiembre', 31, 1.0, 6.0, 0.3, 'Rico en vitamina C'),
('Zanahoria', 'kg', 2.20, 0.18, 0, 3, 'todo el año', 41, 0.9, 9.6, 0.2, 'Dulzor natural'),
('Patata', 'kg', 1.50, 0.25, 0, 10, 'todo el año', 77, 2.0, 17.0, 0.1, 'Versátil y nutritiva'),
('Calabacín', 'kg', 2.80, 0.15, 0, 2, 'mayo,junio,julio,agosto,septiembre', 17, 1.2, 3.1, 0.3, 'Bajo en calorías'),
('Berenjena', 'kg', 3.50, 0.20, 0, 2, 'junio,julio,agosto,septiembre', 25, 1.0, 6.0, 0.2, 'Absorbe sabores'),
('Espinacas', 'kg', 4.20, 0.30, 0, 1, 'octubre,noviembre,diciembre,enero,febrero,marzo', 23, 2.9, 3.6, 0.4, 'Rica en hierro'),
('Lechuga', 'kg', 2.50, 0.25, 0, 2, 'todo el año', 15, 1.4, 2.9, 0.2, 'Base de ensaladas'),
('Brócoli', 'kg', 4.80, 0.22, 0, 2, 'octubre,noviembre,diciembre,enero,febrero', 34, 2.8, 7.0, 0.4, 'Superalimento'),
('Apio', 'kg', 3.60, 0.28, 0, 1, 'octubre,noviembre,diciembre,enero,febrero', 16, 0.7, 3.0, 0.2, 'Aromático y crujiente'),
('Puerro', 'kg', 4.20, 0.30, 0, 1, 'octubre,noviembre,diciembre,enero,febrero', 61, 1.5, 14.2, 0.3, 'Sabor suave'),
('Champiñón', 'kg', 6.50, 0.20, 0, 1, 'todo el año', 22, 3.1, 3.3, 0.3, 'Textura carnosa'),
('Pepino', 'kg', 2.40, 0.15, 0, 2, 'mayo,junio,julio,agosto,septiembre', 16, 0.7, 4.0, 0.1, 'Refrescante'),
('Pimiento verde', 'kg', 3.80, 0.12, 0, 2, 'junio,julio,agosto,septiembre', 20, 0.9, 4.6, 0.2, 'Menos dulce que el rojo'),
('Coliflor', 'kg', 3.20, 0.25, 0, 2, 'octubre,noviembre,diciembre,enero,febrero', 25, 1.9, 5.0, 0.3, 'Crucífera versátil'),
('Judías verdes', 'kg', 4.50, 0.15, 0, 2, 'junio,julio,agosto,septiembre', 35, 1.8, 8.0, 0.1, 'Vaina tierna'),
('Acelgas', 'kg', 3.50, 0.30, 0, 1, 'octubre,noviembre,diciembre,enero,febrero,marzo', 19, 1.8, 3.7, 0.2, 'Hoja verde nutritiva'),
('Rúcula', 'kg', 8.50, 0.25, 0, 0.5, 'octubre,noviembre,diciembre,enero,febrero,marzo', 25, 2.6, 3.6, 0.7, 'Sabor picante'),
('Tomate cherry', 'kg', 5.50, 0.08, 0, 1, 'mayo,junio,julio,agosto,septiembre', 18, 0.9, 3.9, 0.2, 'Variedad pequeña'),
('Calabaza', 'kg', 2.00, 0.20, 0, 3, 'septiembre,octubre,noviembre', 26, 1.0, 6.5, 0.1, 'Dulce y versátil'),
('Remolacha', 'kg', 2.80, 0.15, 0, 2, 'octubre,noviembre,diciembre,enero,febrero', 43, 1.6, 9.6, 0.2, 'Color intenso'),
('Nabo', 'kg', 2.50, 0.20, 0, 2, 'octubre,noviembre,diciembre,enero,febrero', 28, 0.9, 6.4, 0.1, 'Raíz tradicional'),
('Cebolleta', 'kg', 4.80, 0.15, 0, 1, 'todo el año', 32, 1.8, 7.3, 0.2, 'Sabor suave'),
('Pimiento amarillo', 'kg', 4.80, 0.12, 0, 2, 'junio,julio,agosto,septiembre', 27, 1.0, 6.3, 0.2, 'Dulce y colorido'),
('Berros', 'kg', 9.50, 0.30, 0, 0.5, 'octubre,noviembre,diciembre,enero,febrero,marzo', 11, 2.3, 1.3, 0.1, 'Hoja picante'),
('Endivias', 'kg', 6.50, 0.20, 0, 1, 'octubre,noviembre,diciembre,enero,febrero', 17, 0.9, 4.0, 0.1, 'Amargor elegante'),
('Alcachofas', 'kg', 8.50, 0.35, 0, 1, 'noviembre,diciembre,enero,febrero,marzo,abril', 47, 3.3, 10.5, 0.2, 'Flor comestible'),
('Espárragos', 'kg', 12.00, 0.25, 0, 1, 'marzo,abril,mayo', 20, 2.2, 3.9, 0.1, 'Brote tierno'),
('Hinojo', 'kg', 4.50, 0.25, 0, 1, 'octubre,noviembre,diciembre,enero,febrero', 31, 1.2, 7.3, 0.2, 'Sabor anisado'),
('Col', 'kg', 2.20, 0.25, 0, 3, 'octubre,noviembre,diciembre,enero,febrero', 25, 1.3, 5.8, 0.1, 'Crucífera resistente'),
('Coles de Bruselas', 'kg', 5.50, 0.20, 0, 1, 'octubre,noviembre,diciembre,enero,febrero', 43, 3.4, 8.9, 0.3, 'Mini coles'),
('Guisantes', 'kg', 6.50, 0.30, 0, 1, 'abril,mayo,junio', 81, 5.4, 14.5, 0.4, 'Legumbre fresca'),
('Habas', 'kg', 7.00, 0.35, 0, 1, 'abril,mayo,junio', 88, 7.9, 17.6, 0.4, 'Legumbre primaveral'),
('Setas shiitake', 'kg', 18.00, 0.15, 0, 0.5, 'todo el año', 34, 2.2, 6.8, 0.5, 'Seta asiática'),
('Setas ostra', 'kg', 12.00, 0.15, 0, 0.5, 'todo el año', 33, 3.3, 6.1, 0.4, 'Seta cultivada'),
('Maíz dulce', 'kg', 3.50, 0.20, 0, 2, 'julio,agosto,septiembre', 86, 3.3, 19.0, 1.4, 'Cereal dulce'),
('Jengibre', 'kg', 15.00, 0.15, 0, 0.2, 'todo el año', 80, 1.8, 17.8, 0.8, 'Raíz picante'),
('Chalotas', 'kg', 8.50, 0.15, 0, 0.5, 'todo el año', 72, 2.5, 16.8, 0.1, 'Cebolla fina'),

-- FRUTAS (76-100)
('Limón', 'kg', 3.80, 0.12, 0, 2, 'todo el año', 29, 1.1, 9.3, 0.3, 'Acidez natural'),
('Naranja', 'kg', 2.60, 0.15, 0, 3, 'noviembre,diciembre,enero,febrero,marzo', 47, 0.9, 11.8, 0.1, 'Rica en vitamina C'),
('Manzana', 'kg', 3.20, 0.10, 0, 3, 'agosto,septiembre,octubre,noviembre', 52, 0.3, 13.8, 0.2, 'Fibra y frescor'),
('Plátano', 'kg', 2.80, 0.08, 0, 3, 'todo el año', 89, 1.1, 22.8, 0.3, 'Energía rápida'),
('Pera', 'kg', 3.60, 0.12, 0, 2, 'agosto,septiembre,octubre,noviembre', 57, 0.4, 15.2, 0.1, 'Dulce y jugosa'),
('Fresas', 'kg', 8.50, 0.10, 0, 1, 'marzo,abril,mayo,junio', 32, 0.7, 7.7, 0.3, 'Fruta primaveral'),
('Melocotón', 'kg', 4.50, 0.15, 0, 2, 'junio,julio,agosto,septiembre', 39, 0.9, 9.5, 0.3, 'Fruta de hueso'),
('Albaricoque', 'kg', 5.50, 0.15, 0, 1, 'mayo,junio,julio', 48, 1.4, 11.1, 0.4, 'Rico en betacaroteno'),
('Uvas', 'kg', 4.20, 0.08, 0, 2, 'agosto,septiembre,octubre', 69, 0.7, 17.2, 0.2, 'Dulces y jugosas'),
('Kiwi', 'kg', 6.50, 0.12, 0, 1, 'noviembre,diciembre,enero,febrero,marzo', 61, 1.1, 14.7, 0.5, 'Rico en vitamina C'),
('Mandarina', 'kg', 3.50, 0.15, 0, 2, 'noviembre,diciembre,enero,febrero', 53, 0.8, 13.3, 0.3, 'Cítrico dulce'),
('Pomelo', 'kg', 4.50, 0.20, 0, 1, 'noviembre,diciembre,enero,febrero,marzo', 42, 0.8, 10.7, 0.1, 'Cítrico amargo'),
('Piña', 'kg', 3.80, 0.25, 0, 1, 'todo el año', 50, 0.5, 13.1, 0.1, 'Tropical'),
('Mango', 'kg', 6.50, 0.20, 0, 1, 'marzo,abril,mayo,junio', 60, 0.8, 15.0, 0.4, 'Tropical cremoso'),
('Aguacate', 'kg', 8.50, 0.15, 0, 1, 'todo el año', 160, 2.0, 8.5, 14.7, 'Grasa saludable'),
('Cereza', 'kg', 12.00, 0.08, 0, 1, 'mayo,junio,julio', 63, 1.1, 16.0, 0.2, 'Fruta de temporada'),
('Ciruela', 'kg', 4.80, 0.12, 0, 1, 'julio,agosto,septiembre', 46, 0.7, 11.4, 0.3, 'Fruta de hueso'),
('Sandía', 'kg', 1.80, 0.15, 0, 5, 'junio,julio,agosto,septiembre', 30, 0.6, 7.6, 0.2, 'Refrescante'),
('Melón', 'kg', 2.50, 0.20, 0, 3, 'junio,julio,agosto,septiembre', 34, 0.8, 8.2, 0.2, 'Dulce y aromático'),
('Higos', 'kg', 9.50, 0.10, 0, 0.5, 'agosto,septiembre,octubre', 74, 0.8, 19.2, 0.3, 'Muy dulces'),
('Granada', 'kg', 7.50, 0.25, 0, 1, 'octubre,noviembre,diciembre', 83, 1.7, 18.7, 1.2, 'Rica en antioxidantes'),
('Coco', 'unit', 2.50, 0.30, 0, 5, 'todo el año', 354, 3.3, 15.2, 33.5, 'Tropical graso'),
('Papaya', 'kg', 5.50, 0.20, 0, 1, 'todo el año', 43, 0.5, 10.8, 0.3, 'Tropical digestiva'),
('Arándanos', 'kg', 18.50, 0.05, 0, 0.5, 'junio,julio,agosto', 57, 0.7, 14.5, 0.3, 'Antioxidantes'),
('Frambuesas', 'kg', 22.00, 0.08, 0, 0.2, 'junio,julio,agosto,septiembre', 52, 1.2, 11.9, 0.7, 'Frutos del bosque'),

-- CEREALES Y LEGUMBRES (101-115)
('Arroz bomba', 'kg', 4.20, 0.02, 0, 5, 'todo el año', 380, 7.0, 87.0, 0.7, 'Ideal para paellas'),
('Pasta (espaguetis)', 'kg', 2.80, 0.01, 0, 5, 'todo el año', 371, 13.0, 74.7, 1.5, 'Base italiana'),
('Harina de trigo', 'kg', 1.60, 0.01, 0, 10, 'todo el año', 364, 10.3, 76.3, 0.9, 'Panificación'),
('Garbanzos', 'kg', 3.20, 0.05, 0, 3, 'todo el año', 364, 19.3, 61.0, 6.0, 'Legumbre proteica'),
('Lentejas', 'kg', 2.80, 0.05, 0, 3, 'todo el año', 352, 24.6, 60.1, 1.1, 'Rica en hierro'),
('Judías blancas', 'kg', 3.60, 0.05, 0, 2, 'todo el año', 343, 23.0, 61.3, 0.9, 'Fibra y proteína'),
('Quinoa', 'kg', 8.50, 0.02, 0, 1, 'todo el año', 368, 14.1, 64.2, 6.1, 'Proteína completa'),
('Avena', 'kg', 3.20, 0.02, 0, 2, 'todo el año', 389, 16.9, 66.3, 6.9, 'Desayuno saludable'),
('Pan', 'unit', 1.20, 0.08, 0, 5, 'todo el año', 265, 9.0, 49.4, 3.2, 'Básico diario'),
('Couscous', 'kg', 4.80, 0.02, 0, 1, 'todo el año', 376, 12.8, 77.4, 0.6, 'Cereal nordafricano'),
('Arroz basmati', 'kg', 5.50, 0.02, 0, 3, 'todo el año', 365, 7.1, 78.0, 0.9, 'Aromático'),
('Pasta (macarrones)', 'kg', 2.90, 0.01, 0, 5, 'todo el año', 371, 13.0, 74.7, 1.5, 'Forma tubular'),
('Judías pintas', 'kg', 3.80, 0.05, 0, 2, 'todo el año', 347, 21.4, 62.4, 1.2, 'Legumbre moteada'),
('Trigo sarraceno', 'kg', 6.50, 0.02, 0, 1, 'todo el año', 343, 13.3, 71.5, 3.4, 'Sin gluten'),
('Cebada perlada', 'kg', 4.20, 0.02, 0, 2, 'todo el año', 354, 12.5, 73.5, 2.3, 'Cereal nutritivo'),

-- LÁCTEOS Y HUEVOS (116-125)
('Leche entera', 'l', 1.20, 0.02, 0, 10, 'todo el año', 61, 3.2, 4.8, 3.2, 'Rica en calcio'),
('Nata líquida', 'l', 3.80, 0.02, 0, 2, 'todo el año', 345, 2.1, 3.4, 36.1, 'Para salsas'),
('Queso manchego', 'kg', 18.00, 0.05, 0, 1, 'todo el año', 392, 32.0, 0.5, 29.4, 'Curado español'),
('Mantequilla', 'kg', 8.50, 0.02, 0, 1, 'todo el año', 717, 0.9, 0.6, 81.1, 'Grasa láctea'),
('Huevos', 'unit', 0.25, 0.08, 0, 30, 'todo el año', 155, 13.0, 1.1, 11.0, 'Proteína completa'),
('Yogur natural', 'kg', 3.50, 0.02, 0, 2, 'todo el año', 59, 3.5, 4.7, 3.3, 'Probióticos'),
('Queso mozzarella', 'kg', 12.00, 0.05, 0, 1, 'todo el año', 280, 28.0, 2.2, 17.1, 'Queso italiano'),
('Queso parmesano', 'kg', 35.00, 0.03, 0, 0.5, 'todo el año', 431, 38.5, 4.1, 28.4, 'Queso duro'),
('Leche desnatada', 'l', 1.10, 0.02, 0, 8, 'todo el año', 34, 3.4, 5.0, 0.1, 'Baja en grasa'),
('Queso fresco', 'kg', 8.50, 0.08, 0, 1, 'todo el año', 174, 13.7, 4.1, 11.5, 'Suave y cremoso'),

-- ACEITES Y GRASAS (126-133)
('Aceite de oliva virgen extra', 'l', 8.20, 0.01, 0, 2, 'todo el año', 884, 0.0, 0.0, 100.0, 'Grasa saludable'),
('Aceite de girasol', 'l', 3.50, 0.01, 0, 3, 'todo el año', 884, 0.0, 0.0, 100.0, 'Para freír'),
('Aceite de coco', 'kg', 12.00, 0.01, 0, 1, 'todo el año', 862, 0.0, 0.0, 99.1, 'Grasa saturada'),
('Aceite de sésamo', 'l', 15.00, 0.01, 0, 0.5, 'todo el año', 884, 0.0, 0.0, 100.0, 'Sabor intenso'),
('Manteca de cerdo', 'kg', 6.50, 0.02, 0, 1, 'todo el año', 897, 0.0, 0.0, 100.0, 'Grasa tradicional'),
('Margarina', 'kg', 4.50, 0.02, 0, 1, 'todo el año', 717, 0.9, 0.7, 80.5, 'Alternativa vegetal'),
('Aceite de maíz', 'l', 4.20, 0.01, 0, 2, 'todo el año', 884, 0.0, 0.0, 100.0, 'Neutro'),
('Ghee', 'kg', 18.00, 0.01, 0, 0.5, 'todo el año', 876, 0.3, 0.0, 99.5, 'Mantequilla clarificada'),

-- ESPECIAS Y CONDIMENTOS (134-145)
('Sal marina', 'kg', 2.20, 0.01, 0, 5, 'todo el año', 0, 0.0, 0.0, 0.0, 'Condimento básico'),
('Pimienta negra', 'kg', 25.00, 0.01, 0, 0.2, 'todo el año', 251, 10.4, 63.9, 3.3, 'Especia universal'),
('Perejil', 'kg', 8.00, 0.25, 0, 0.3, 'todo el año', 36, 3.0, 6.3, 0.8, 'Hierba aromática'),
('Vinagre de jerez', 'l', 4.50, 0.01, 0, 1, 'todo el año', 19, 0.0, 0.8, 0.0, 'Acidez elegante'),
('Azúcar', 'kg', 1.80, 0.01, 0, 5, 'todo el año', 387, 0.0, 99.8, 0.0, 'Endulzante'),
('Pimentón dulce', 'kg', 12.00, 0.01, 0, 0.5, 'todo el año', 282, 14.1, 53.9, 13.0, 'Especia española'),
('Comino', 'kg', 18.00, 0.01, 0, 0.2, 'todo el año', 375, 17.8, 44.2, 22.3, 'Especia aromática'),
('Orégano', 'kg', 15.00, 0.01, 0, 0.2, 'todo el año', 265, 9.0, 68.9, 4.3, 'Hierba mediterránea'),
('Tomillo', 'kg', 20.00, 0.01, 0, 0.2, 'todo el año', 276, 9.1, 63.9, 7.4, 'Hierba aromática'),
('Romero', 'kg', 18.00, 0.01, 0, 0.2, 'todo el año', 131, 3.3, 20.7, 5.9, 'Hierba intensa'),
('Laurel', 'kg', 22.00, 0.01, 0, 0.1, 'todo el año', 313, 7.6, 74.9, 8.4, 'Hoja aromática'),
('Canela', 'kg', 35.00, 0.01, 0, 0.1, 'todo el año', 247, 4.0, 80.6, 1.2, 'Especia dulce'),

-- FRUTOS SECOS (146-150)
('Almendras', 'kg', 12.00, 0.05, 0, 1, 'todo el año', 579, 21.2, 21.6, 49.9, 'Rico en vitamina E'),
('Nueces', 'kg', 15.00, 0.08, 0, 1, 'todo el año', 654, 15.2, 13.7, 65.2, 'Omega-3 vegetal'),
('Avellanas', 'kg', 18.00, 0.05, 0, 0.5, 'todo el año', 628, 15.0, 16.7, 60.8, 'Fruto seco cremoso'),
('Piñones', 'kg', 65.00, 0.03, 0, 0.2, 'todo el año', 673, 13.7, 13.1, 68.4, 'Muy premium'),
('Pistachos', 'kg', 22.00, 0.10, 0, 0.5, 'todo el año', 560, 20.2, 27.2, 45.3, 'Fruto seco salado');

-- Actualizar precios netos
UPDATE INGREDIENTS 
SET net_price = ROUND(base_price * (1 + IFNULL(waste_percent, 0)), 2) 
WHERE base_price IS NOT NULL;

-- =======================================================
-- 6. ASIGNACIÓN DE CATEGORÍAS A INGREDIENTES (150 ingredientes)
-- =======================================================
INSERT INTO INGREDIENT_CATEGORY_ASSIGNMENTS (ingredient_id, category_id) VALUES
-- Carnes (1-20)
(1, 1), (2, 1), (3, 1), (4, 1), (5, 1), (6, 1), (7, 1), (8, 1), (9, 1), (10, 1),
(11, 1), (12, 1), (13, 1), (14, 1), (15, 1), (16, 1), (17, 1), (18, 1), (19, 1), (20, 1),

-- Pescados y mariscos (21-35)
(21, 2), (22, 2), (23, 2), (24, 2), (25, 2), (26, 2), (27, 2), (28, 2), (29, 2), (30, 2),
(31, 2), (32, 2), (33, 2), (34, 2), (35, 2),

-- Verduras y hortalizas (36-75)
(36, 3), (37, 3), (38, 3), (39, 3), (40, 3), (41, 3), (42, 3), (43, 3), (44, 3), (45, 3),
(46, 3), (47, 3), (48, 3), (49, 3), (50, 3), (51, 3), (52, 3), (53, 3), (54, 3), (55, 3),
(56, 3), (57, 3), (58, 3), (59, 3), (60, 3), (61, 3), (62, 3), (63, 3), (64, 3), (65, 3),
(66, 3), (67, 3), (68, 3), (69, 3), (70, 3), (71, 3), (72, 3), (73, 3), (74, 3), (75, 3),

-- Frutas (76-100)
(76, 4), (77, 4), (78, 4), (79, 4), (80, 4), (81, 4), (82, 4), (83, 4), (84, 4), (85, 4),
(86, 4), (87, 4), (88, 4), (89, 4), (90, 4), (91, 4), (92, 4), (93, 4), (94, 4), (95, 4),
(96, 4), (97, 4), (98, 4), (99, 4), (100, 4),

-- Cereales y legumbres (101-115)
(101, 5), (102, 5), (103, 5), (104, 5), (105, 5), (106, 5), (107, 5), (108, 5), (109, 5), (110, 5),
(111, 5), (112, 5), (113, 5), (114, 5), (115, 5),

-- Lácteos y huevos (116-125)
(116, 6), (117, 6), (118, 6), (119, 6), (120, 6), (121, 6), (122, 6), (123, 6), (124, 6), (125, 6),

-- Aceites y grasas (126-133)
(126, 7), (127, 7), (128, 7), (129, 7), (130, 7), (131, 7), (132, 7), (133, 7),

-- Especias y condimentos (134-145)
(134, 8), (135, 8), (136, 8), (137, 8), (138, 8), (139, 8), (140, 8), (141, 8), (142, 8), (143, 8),
(144, 8), (145, 8),

-- Frutos secos (146-150)
(146, 9), (147, 9), (148, 9), (149, 9), (150, 9);

-- =======================================================
-- 7. ASIGNACIÓN DE ALÉRGENOS A INGREDIENTES (150 ingredientes)
-- =======================================================
INSERT INTO INGREDIENT_ALLERGENS (ingredient_id, allergen_id) VALUES
-- Gluten (1)
(102, 1), (103, 1), (109, 1), (112, 1), (114, 1), (115, 1), -- Pasta, harina, pan, pasta macarrones, trigo sarraceno, cebada
-- Crustáceo (2) 
(24, 2), (30, 2), -- Gambas, langostinos
-- Huevo (3)
(120, 3), -- Huevos
-- Pescado (4)
(21, 4), (22, 4), (23, 4), (26, 4), (27, 4), (28, 4), (29, 4), (34, 4), (35, 4), -- Todos los pescados
-- Cacahuete (5) - Ningún ingrediente común tiene cacahuete
-- Soja (6) - Ningún ingrediente directo, pero margarina puede contener
(131, 6), -- Margarina (puede contener soja)
-- Leche (7)
(116, 7), (117, 7), (118, 7), (119, 7), (121, 7), (122, 7), (123, 7), (124, 7), (125, 7), (131, 7), -- Todos los lácteos + margarina
-- Frutos de cáscara (8)
(146, 8), (147, 8), (148, 8), (149, 8), (150, 8), -- Todos los frutos secos
-- Apio (9)
(47, 9), -- Apio
-- Mostaza (10) - Normalmente en condimentos procesados, aquí no aplicable directamente
-- Granos de sésamo (11)
(129, 11), -- Aceite de sésamo
-- Dióxido de azufre y sulfitos (12) - Común en vinos y algunos procesados
(137, 12), -- Vinagre de jerez (puede contener sulfitos)
-- Altramuz (13) - No aplicable a ingredientes comunes
-- Molusco (14)
(25, 14), (31, 14), (32, 14), (33, 14); -- Mejillones, almejas, pulpo, sepia

-- =======================================================
-- 8. CONFIGURACIÓN DEL SISTEMA
-- =======================================================
INSERT INTO SYSTEM_SETTINGS (setting_key, setting_value) VALUES
('password_min_length', '8'),
('password_require_special', 'false'),
('password_require_numbers', 'true'),
('session_timeout', '120'),
('session_auto_close', 'false'),
('backup_auto_enabled', 'false'),
('backup_frequency', 'weekly'),
('restaurant_setup_completed', 'false'),
('allow_restaurant_info_edit_by_chef', 'false'),
('require_restaurant_info_for_reports', 'true')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- =======================================================
-- 9. INFORMACIÓN DEL RESTAURANTE (CONFIGURACIÓN INICIAL)
-- =======================================================
INSERT INTO RESTAURANT_INFO (
    name,
    description,
    country,
    vat_rate,
    target_food_cost_percentage,
    default_currency,
    default_language,
    timezone,
    primary_color,
    secondary_color,
    updated_by
) VALUES (
    'Mi Restaurante',
    'Configure la información completa de su restaurante desde el panel de administración (Settings > Restaurante)',
    'España',
    21.00,
    30.00,
    'EUR',
    'es',
    'Europe/Madrid',
    '#f97316',
    '#1f2937',
    1
);

-- =======================================================
-- MENSAJE DE CONFIRMACIÓN
-- =======================================================
SELECT 'BASE SEED COMPLETADO EXITOSAMENTE' as STATUS,
       (SELECT COUNT(*) FROM USERS) as USUARIOS,
       (SELECT COUNT(*) FROM ALLERGENS) as ALERGENOS,
       (SELECT COUNT(*) FROM INGREDIENTS) as INGREDIENTES,
       (SELECT COUNT(*) FROM INGREDIENT_CATEGORIES) as CATEGORIAS_INGR,
       (SELECT COUNT(*) FROM RECIPE_CATEGORIES) as CATEGORIAS_REC,
       (SELECT COUNT(*) FROM TAXES) as IMPUESTOS,
       (SELECT COUNT(*) FROM INGREDIENT_ALLERGENS) as ALERGENOS_ASIGNADOS,
       (SELECT COUNT(*) FROM INGREDIENT_CATEGORY_ASSIGNMENTS) as CATEGORIAS_ASIGNADAS,
       (SELECT COUNT(*) FROM SYSTEM_SETTINGS) as CONFIGURACIONES,
       (SELECT COUNT(*) FROM RESTAURANT_INFO) as RESTAURANTE;