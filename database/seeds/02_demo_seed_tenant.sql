-- =======================================================
-- SCRIPT DEMO - DATOS DE DEMOSTRACIÓN COMPLETOS
-- =======================================================
-- Este script es INDEPENDIENTE e incluye:
-- - Todos los datos base (alérgenos, categorías, ingredientes, etc.)
-- - Usuarios de demostración de diferentes roles
-- - Proveedores con relaciones a ingredientes
-- - 10 Recetas variadas con ingredientes correctamente asociados
-- - Secciones de recetas organizadas
-- - Menús temáticos para demostrar la funcionalidad
-- IMPORTANTE: Este script es autosuficiente, no requiere otros scripts
-- =======================================================

USE recetario_demo;

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
-- 1. ALÉRGENOS OBLIGATORIOS (UE)
-- =======================================================
INSERT INTO ALLERGENS (name, severity) VALUES
('Gluten', 'medium'),
('Crustáceo', 'critical'),
('Huevo', 'high'),
('Pescado', 'high'),
('Cacahuete', 'critical'),
('Soja', 'high'),
('Leche', 'high'),
('Frutos de cáscara', 'critical'),
('Apio', 'low'),
('Mostaza', 'medium'),
('Granos de sésamo', 'medium'),
('Dióxido de azufre y sulfitos', 'low'),
('Altramuz', 'low'),
('Molusco', 'critical');

-- =======================================================
-- 2. CATEGORÍAS
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
-- 3. IMPUESTOS
-- =======================================================
INSERT INTO TAXES (name, percent) VALUES
('IGIC', 7.00),
('IGIC Comercio minorista', 0.00),
('IVA General', 21.00),
('IVA Reducido', 10.00),
('IVA Superreducido', 4.00),
('Sin IVA', 0.00);

-- =======================================================
-- 4. INGREDIENTES COMPLETOS (150 ingredientes comunes con datos reales)
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
-- 5. ASIGNACIÓN DE CATEGORÍAS A INGREDIENTES (150 ingredientes)
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
-- 6. ASIGNACIÓN DE ALÉRGENOS A INGREDIENTES (150 ingredientes)
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
-- 7. CONFIGURACIÓN DEL SISTEMA
-- =======================================================
INSERT INTO SYSTEM_SETTINGS (setting_key, setting_value) VALUES
('password_min_length', '8'),
('password_require_special', 'false'),
('password_require_numbers', 'true'),
('session_timeout', '120'),
('session_auto_close', 'false'),
('backup_auto_enabled', 'false'),
('backup_frequency', 'weekly'),
('restaurant_setup_completed', 'true'),
('allow_restaurant_info_edit_by_chef', 'false'),
('require_restaurant_info_for_reports', 'true')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);


-- =======================================================
-- 8. USUARIOS DE DEMOSTRACIÓN
-- =======================================================
INSERT INTO USERS (first_name, last_name, email, role, password_hash, is_active, language, timezone) VALUES
('Admin', 'Sistema', 'admin@example.com', 'admin', '$2b$12$WB8g2SbqdkGyOhZo5JKPfesy6WYXBZj4IzWhCVeJ4BPmAmDgcPyta', TRUE, 'es', 'Europe/Madrid'),
('Carlos', 'Martínez', 'chef@demo.com', 'chef', '$2b$12$WB8g2SbqdkGyOhZo5JKPfesy6WYXBZj4IzWhCVeJ4BPmAmDgcPyta', TRUE, 'es', 'Europe/Madrid'),
('Ana', 'García', 'supplier@demo.com', 'supplier_manager', '$2b$12$WB8g2SbqdkGyOhZo5JKPfesy6WYXBZj4IzWhCVeJ4BPmAmDgcPyta', TRUE, 'es', 'Europe/Madrid'),
('Luis', 'Rodríguez', 'waiter@demo.com', 'waiter', '$2b$12$WB8g2SbqdkGyOhZo5JKPfesy6WYXBZj4IzWhCVeJ4BPmAmDgcPyta', TRUE, 'es', 'Europe/Madrid'),
('María', 'López', 'inventory@demo.com', 'inventory_manager', '$2b$12$WB8g2SbqdkGyOhZo5JKPfesy6WYXBZj4IzWhCVeJ4BPmAmDgcPyta', TRUE, 'es', 'Europe/Madrid');

-- =======================================================
-- 8.1 INFORMACIÓN DEL RESTAURANTE DEMO (MOVIDO AQUÍ PARA EVITAR ERRORES FK)
-- =======================================================
INSERT INTO RESTAURANT_INFO (
    name,
    business_name,
    description,
    phone,
    email,
    website,
    address,
    city,
    postal_code,
    country,
    tax_number,
    vat_rate,
    cuisine_type,
    seating_capacity,
    opening_hours,
    manager_name,
    manager_phone,
    emergency_contact,
    emergency_phone,
    default_currency,
    default_language,
    timezone,
    target_food_cost_percentage,
    labor_cost_per_hour,
    rent_monthly,
    instagram_handle,
    facebook_page,
    google_business_url,
    logo_url,
    primary_color,
    secondary_color,
    updated_by
) VALUES (
    'Restaurante La Cocina Demo',
    'La Cocina Demo S.L.',
    'Un restaurante de demostración que combina la tradición mediterránea con toques modernos. Especializado en cocina española contemporánea con ingredientes de temporada y proveedores locales.',
    '+34 912 345 678',
    'info@lacocinademio.com',
    'https://www.lacocinademio.com',
    'Plaza Mayor, 1',
    'Madrid',
    '28013',
    'España',
    'B12345678',
    21.00,
    'mediterránea',
    45,
    JSON_OBJECT(
        'lunes', JSON_OBJECT('open', '12:00', 'close', '16:00', 'closed', false),
        'martes', JSON_OBJECT('open', '12:00', 'close', '23:30', 'closed', false),
        'miercoles', JSON_OBJECT('open', '12:00', 'close', '23:30', 'closed', false),
        'jueves', JSON_OBJECT('open', '12:00', 'close', '23:30', 'closed', false),
        'viernes', JSON_OBJECT('open', '12:00', 'close', '01:00', 'closed', false),
        'sabado', JSON_OBJECT('open', '12:00', 'close', '01:00', 'closed', false),
        'domingo', JSON_OBJECT('open', '12:00', 'close', '23:00', 'closed', false)
    ),
    'Carlos Martínez',
    '+34 600 123 456',
    'Ana García',
    '+34 600 987 654',
    'EUR',
    'es',
    'Europe/Madrid',
    28.50,
    15.50,
    3200.00,
    '@lacocinademio',
    'https://facebook.com/lacocinademio',
    'https://business.google.com/lacocinademio',
    'https://example.com/logo-lacocinademio.png',
    '#f97316',
    '#1f2937',
    1
);

-- =======================================================
-- 2. PROVEEDORES DE DEMOSTRACIÓN
-- =======================================================
INSERT INTO SUPPLIERS (name, phone, email, website_url, address) VALUES
('Carnicería Premium', '912345678', 'pedidos@carniceriapremium.com', 'www.carniceriapremium.com', 'Calle Mayor 15, Madrid'),
('Pescadería Mar Azul', '913456789', 'ventas@marazul.com', 'www.marazul.com', 'Puerto Pesquero 8, Madrid'),
('Frutas y Verduras El Huerto', '914567890', 'pedidos@elhuerto.com', 'www.elhuerto.com', 'Mercado Central 22, Madrid'),
('Lácteos San Miguel', '915678901', 'info@sanmiguel.com', 'www.sanmiguel.com', 'Polígono Industrial Norte, Madrid'),
('Distribuciones Gourmet', '916789012', 'comercial@gourmet.com', 'www.gourmet.com', 'Avenida Comercial 45, Madrid'),
('Especias del Mundo', '917890123', 'ventas@especiasmundo.com', 'www.especiasmundo.com', 'Calle Especias 33, Madrid');

-- =======================================================
-- 3. RELACIONES PROVEEDOR-INGREDIENTE (150 ingredientes)
-- =======================================================
INSERT INTO SUPPLIER_INGREDIENTS (supplier_id, ingredient_id, price, delivery_time, is_preferred_supplier, package_size, package_unit, minimum_order_quantity) VALUES
-- Carnicería Premium (1) - Carnes (1-20)
(1, 1, 8.20, 24, TRUE, 1.0, 'kg', 2.0), (1, 2, 24.50, 24, TRUE, 1.0, 'kg', 1.0), (1, 3, 11.80, 24, TRUE, 1.0, 'kg', 2.0), (1, 4, 17.50, 48, TRUE, 1.0, 'kg', 1.0), (1, 5, 34.00, 24, TRUE, 1.0, 'kg', 0.5),
(1, 6, 6.30, 24, TRUE, 1.0, 'kg', 2.0), (1, 7, 21.50, 24, TRUE, 1.0, 'kg', 1.0), (1, 8, 9.30, 24, TRUE, 1.0, 'kg', 2.0), (1, 9, 10.80, 24, TRUE, 1.0, 'kg', 1.0), (1, 10, 13.50, 48, TRUE, 1.0, 'kg', 1.0),
(1, 11, 15.50, 24, TRUE, 1.0, 'kg', 1.0), (1, 12, 11.80, 24, TRUE, 1.0, 'kg', 0.5), (1, 13, 9.80, 24, TRUE, 1.0, 'kg', 1.0), (1, 14, 27.50, 24, TRUE, 1.0, 'kg', 0.5), (1, 15, 7.80, 24, TRUE, 1.0, 'kg', 1.0),
(1, 16, 14.80, 24, TRUE, 1.0, 'kg', 1.0), (1, 17, 23.50, 48, TRUE, 1.0, 'kg', 1.0), (1, 18, 17.50, 24, TRUE, 1.0, 'kg', 1.0), (1, 19, 5.30, 24, TRUE, 1.0, 'kg', 2.0), (1, 20, 19.50, 48, TRUE, 1.0, 'kg', 1.0),

-- Pescadería Mar Azul (2) - Pescados y mariscos (21-35)
(2, 21, 21.50, 12, TRUE, 1.0, 'kg', 1.0), (2, 22, 15.80, 12, TRUE, 1.0, 'kg', 1.0), (2, 23, 17.50, 12, TRUE, 1.0, 'kg', 1.0), (2, 24, 27.50, 12, TRUE, 1.0, 'kg', 0.5), (2, 25, 7.80, 12, TRUE, 1.0, 'kg', 1.0),
(2, 26, 13.80, 12, TRUE, 1.0, 'kg', 1.0), (2, 27, 19.50, 12, TRUE, 1.0, 'kg', 1.0), (2, 28, 17.80, 12, TRUE, 1.0, 'kg', 1.0), (2, 29, 6.30, 12, TRUE, 1.0, 'kg', 1.0), (2, 30, 34.50, 12, TRUE, 1.0, 'kg', 0.5),
(2, 31, 24.50, 12, TRUE, 1.0, 'kg', 0.5), (2, 32, 21.50, 12, TRUE, 1.0, 'kg', 0.5), (2, 33, 17.80, 12, TRUE, 1.0, 'kg', 0.5), (2, 34, 7.80, 12, TRUE, 1.0, 'kg', 1.0), (2, 35, 23.50, 12, TRUE, 1.0, 'kg', 1.0),

-- Frutas y Verduras El Huerto (3) - Verduras (36-75) y Frutas (76-100)
(3, 36, 3.10, 24, TRUE, 1.0, 'kg', 3.0), (3, 37, 1.70, 24, TRUE, 1.0, 'kg', 5.0), (3, 38, 7.80, 24, TRUE, 1.0, 'kg', 0.5), (3, 39, 4.30, 24, TRUE, 1.0, 'kg', 2.0), (3, 40, 2.10, 24, TRUE, 1.0, 'kg', 3.0),
(3, 41, 1.40, 24, TRUE, 1.0, 'kg', 10.0), (3, 42, 2.70, 24, TRUE, 1.0, 'kg', 2.0), (3, 43, 3.40, 24, TRUE, 1.0, 'kg', 2.0), (3, 44, 4.10, 24, TRUE, 1.0, 'kg', 1.0), (3, 45, 2.40, 24, TRUE, 1.0, 'kg', 2.0),
(3, 46, 4.70, 24, TRUE, 1.0, 'kg', 2.0), (3, 47, 3.50, 24, TRUE, 1.0, 'kg', 1.0), (3, 48, 4.10, 24, TRUE, 1.0, 'kg', 1.0), (3, 49, 6.30, 24, TRUE, 1.0, 'kg', 1.0), (3, 50, 2.30, 24, TRUE, 1.0, 'kg', 2.0),
(3, 51, 3.70, 24, TRUE, 1.0, 'kg', 2.0), (3, 52, 3.10, 24, TRUE, 1.0, 'kg', 2.0), (3, 53, 4.40, 24, TRUE, 1.0, 'kg', 2.0), (3, 54, 3.40, 24, TRUE, 1.0, 'kg', 1.0), (3, 55, 8.30, 24, TRUE, 1.0, 'kg', 0.5),
(3, 56, 5.40, 24, TRUE, 1.0, 'kg', 1.0), (3, 57, 1.90, 24, TRUE, 1.0, 'kg', 3.0), (3, 58, 2.70, 24, TRUE, 1.0, 'kg', 2.0), (3, 59, 2.40, 24, TRUE, 1.0, 'kg', 2.0), (3, 60, 4.70, 24, TRUE, 1.0, 'kg', 2.0),
(3, 61, 9.30, 24, TRUE, 1.0, 'kg', 0.5), (3, 62, 6.30, 24, TRUE, 1.0, 'kg', 1.0), (3, 63, 8.30, 24, TRUE, 1.0, 'kg', 1.0), (3, 64, 11.80, 24, TRUE, 1.0, 'kg', 1.0), (3, 65, 4.40, 24, TRUE, 1.0, 'kg', 1.0),
(3, 66, 2.10, 24, TRUE, 1.0, 'kg', 3.0), (3, 67, 5.40, 24, TRUE, 1.0, 'kg', 1.0), (3, 68, 6.40, 24, TRUE, 1.0, 'kg', 1.0), (3, 69, 6.80, 24, TRUE, 1.0, 'kg', 1.0), (3, 70, 17.80, 24, TRUE, 1.0, 'kg', 0.5),
(3, 71, 11.80, 24, TRUE, 1.0, 'kg', 0.5), (3, 72, 3.40, 24, TRUE, 1.0, 'kg', 2.0), (3, 73, 14.80, 24, TRUE, 1.0, 'kg', 0.2), (3, 74, 8.30, 24, TRUE, 1.0, 'kg', 0.5), (3, 75, 8.30, 24, TRUE, 1.0, 'kg', 0.5),
-- Frutas (76-100)
(3, 76, 3.70, 24, TRUE, 1.0, 'kg', 2.0), (3, 77, 2.50, 24, TRUE, 1.0, 'kg', 3.0), (3, 78, 3.10, 24, TRUE, 1.0, 'kg', 3.0), (3, 79, 2.70, 24, TRUE, 1.0, 'kg', 3.0), (3, 80, 3.50, 24, TRUE, 1.0, 'kg', 2.0),
(3, 81, 8.30, 24, TRUE, 1.0, 'kg', 1.0), (3, 82, 4.40, 24, TRUE, 1.0, 'kg', 2.0), (3, 83, 5.40, 24, TRUE, 1.0, 'kg', 1.0), (3, 84, 4.10, 24, TRUE, 1.0, 'kg', 2.0), (3, 85, 6.30, 24, TRUE, 1.0, 'kg', 1.0),
(3, 86, 3.40, 24, TRUE, 1.0, 'kg', 2.0), (3, 87, 4.40, 24, TRUE, 1.0, 'kg', 1.0), (3, 88, 3.70, 24, TRUE, 1.0, 'kg', 1.0), (3, 89, 6.40, 24, TRUE, 1.0, 'kg', 1.0), (3, 90, 8.30, 24, TRUE, 1.0, 'kg', 1.0),
(3, 91, 11.80, 24, TRUE, 1.0, 'kg', 1.0), (3, 92, 4.70, 24, TRUE, 1.0, 'kg', 1.0), (3, 93, 1.70, 24, TRUE, 1.0, 'kg', 5.0), (3, 94, 2.40, 24, TRUE, 1.0, 'kg', 3.0), (3, 95, 9.30, 24, TRUE, 1.0, 'kg', 0.5),
(3, 96, 7.40, 24, TRUE, 1.0, 'kg', 1.0), (3, 97, 2.40, 24, TRUE, 1.0, 'unidad', 5.0), (3, 98, 5.40, 24, TRUE, 1.0, 'kg', 1.0), (3, 99, 18.30, 24, TRUE, 1.0, 'kg', 0.5), (3, 100, 21.80, 24, TRUE, 1.0, 'kg', 0.2),

-- Lácteos San Miguel (4) - Lácteos y huevos (116-125)
(4, 116, 1.15, 48, TRUE, 1.0, 'l', 10.0), (4, 117, 3.70, 48, TRUE, 1.0, 'l', 2.0), (4, 118, 17.50, 48, TRUE, 1.0, 'kg', 1.0), (4, 119, 8.30, 48, TRUE, 1.0, 'kg', 1.0), (4, 120, 0.24, 48, TRUE, 1.0, 'docena', 30.0),
(4, 121, 3.40, 48, TRUE, 1.0, 'kg', 2.0), (4, 122, 11.80, 48, TRUE, 1.0, 'kg', 1.0), (4, 123, 34.50, 48, TRUE, 1.0, 'kg', 0.5), (4, 124, 1.08, 48, TRUE, 1.0, 'l', 8.0), (4, 125, 8.30, 48, TRUE, 1.0, 'kg', 1.0),

-- Distribuciones Gourmet (5) - Cereales y legumbres (101-115) + Aceites básicos
(5, 101, 4.10, 24, TRUE, 1.0, 'kg', 5.0), (5, 102, 2.70, 24, TRUE, 1.0, 'kg', 5.0), (5, 103, 1.55, 24, TRUE, 1.0, 'kg', 10.0), (5, 104, 3.10, 24, TRUE, 1.0, 'kg', 3.0), (5, 105, 2.70, 24, TRUE, 1.0, 'kg', 3.0),
(5, 106, 3.50, 24, TRUE, 1.0, 'kg', 2.0), (5, 107, 8.30, 24, TRUE, 1.0, 'kg', 1.0), (5, 108, 3.10, 24, TRUE, 1.0, 'kg', 2.0), (5, 109, 1.15, 24, TRUE, 1.0, 'unidad', 5.0), (5, 110, 4.70, 24, TRUE, 1.0, 'kg', 1.0),
(5, 111, 5.40, 24, TRUE, 1.0, 'kg', 3.0), (5, 112, 2.80, 24, TRUE, 1.0, 'kg', 5.0), (5, 113, 3.70, 24, TRUE, 1.0, 'kg', 2.0), (5, 114, 6.40, 24, TRUE, 1.0, 'kg', 1.0), (5, 115, 4.10, 24, TRUE, 1.0, 'kg', 2.0),
-- Aceites básicos
(5, 126, 8.00, 24, TRUE, 1.0, 'l', 2.0), (5, 127, 3.40, 24, TRUE, 1.0, 'l', 3.0), (5, 131, 4.40, 24, TRUE, 1.0, 'kg', 1.0), (5, 132, 4.10, 24, TRUE, 1.0, 'l', 2.0),

-- Especias del Mundo (6) - Condimentos, especias (134-145) + aceites especiales + frutos secos
(6, 128, 11.80, 24, TRUE, 1.0, 'kg', 1.0), (6, 129, 14.80, 24, TRUE, 1.0, 'l', 0.5), (6, 130, 6.40, 24, TRUE, 1.0, 'kg', 1.0), (6, 133, 17.80, 24, TRUE, 1.0, 'kg', 0.5),
(6, 134, 2.10, 24, TRUE, 1.0, 'kg', 5.0), (6, 135, 24.50, 24, TRUE, 1.0, 'kg', 0.2), (6, 136, 7.80, 24, TRUE, 1.0, 'kg', 0.3), (6, 137, 4.40, 24, TRUE, 1.0, 'l', 1.0), (6, 138, 1.70, 24, TRUE, 1.0, 'kg', 5.0),
(6, 139, 11.80, 24, TRUE, 1.0, 'kg', 0.5), (6, 140, 17.80, 24, TRUE, 1.0, 'kg', 0.2), (6, 141, 14.80, 24, TRUE, 1.0, 'kg', 0.2), (6, 142, 19.80, 24, TRUE, 1.0, 'kg', 0.2), (6, 143, 17.80, 24, TRUE, 1.0, 'kg', 0.2),
(6, 144, 21.80, 24, TRUE, 1.0, 'kg', 0.1), (6, 145, 34.50, 24, TRUE, 1.0, 'kg', 0.1),
-- Frutos secos
(6, 146, 11.80, 24, TRUE, 1.0, 'kg', 1.0), (6, 147, 14.80, 24, TRUE, 1.0, 'kg', 1.0), (6, 148, 17.80, 24, TRUE, 1.0, 'kg', 0.5), (6, 149, 64.50, 24, TRUE, 1.0, 'kg', 0.2), (6, 150, 21.80, 24, TRUE, 1.0, 'kg', 0.5);

-- =======================================================
-- 4. RECETAS DE DEMOSTRACIÓN (10 recetas variadas)
-- =======================================================
INSERT INTO RECIPES (name, servings, production_servings, net_price, prep_time, difficulty, instructions, tax_id) VALUES
('Pollo al Ajillo', 4, 4, 34.00, 15, 'easy', 'Saltear el pollo con ajo y perejil hasta dorar', 2),
('Salmón a la Plancha con Verduras', 2, 2, 25.00, 20, 'medium', 'Planchar el salmón y acompañar con verduras salteadas', 2),
('Paella Valenciana', 6, 6, 90.00, 30, 'hard', 'Cocinar el arroz bomba con pollo y verduras tradicionales', 2),
('Ensalada Mediterránea', 4, 4, 32.00, 15, 'easy', 'Mezclar verduras frescas con aliño mediterráneo', 4),
('Pasta Carbonara', 4, 4, 36.00, 10, 'medium', 'Cocinar espaguetis con salsa carbonara cremosa', 2),
('Sopa de Lentejas', 6, 6, 32.50, 15, 'easy', 'Cocer lentejas con verduras hasta obtener textura cremosa', 2),
('Ternera con Salsa de Champiñones', 4, 4, 72.00, 25, 'hard', 'Sellar ternera y preparar salsa cremosa de champiñones', 2),
('Ensalada de Quinoa', 4, 4, 30.00, 20, 'easy', 'Cocer quinoa y mezclar con verduras frescas', 4),
('Merluza al Horno', 4, 4, 44.00, 20, 'medium', 'Hornear merluza con patatas y verduras mediterráneas', 2),
('Crema de Brócoli', 4, 4, 18.00, 15, 'easy', 'Cocer brócoli y triturar con nata hasta textura suave', 2);

-- =======================================================
-- 5. SECCIONES DE RECETAS
-- =======================================================
INSERT INTO RECIPE_SECTIONS (recipe_id, name, `section_order`) VALUES
-- Pollo al Ajillo (1)
(1, 'Ingredientes principales', 1), (1, 'Condimentos', 2),
-- Salmón a la Plancha (2)
(2, 'Pescado', 1), (2, 'Verduras', 2), (2, 'Condimentos', 3),
-- Paella Valenciana (3)
(3, 'Base de arroz', 1), (3, 'Carnes', 2), (3, 'Verduras', 3), (3, 'Condimentos', 4),
-- Ensalada Mediterránea (4)
(4, 'Verduras frescas', 1), (4, 'Frutas', 2), (4, 'Aliño', 3),
-- Pasta Carbonara (5)
(5, 'Pasta', 1), (5, 'Salsa', 2), (5, 'Condimentos', 3),
-- Sopa de Lentejas (6)
(6, 'Legumbres', 1), (6, 'Verduras', 2), (6, 'Condimentos', 3),
-- Ternera con Champiñones (7)
(7, 'Carne', 1), (7, 'Salsa', 2), (7, 'Condimentos', 3),
-- Ensalada de Quinoa (8)
(8, 'Base', 1), (8, 'Verduras', 2), (8, 'Aliño', 3),
-- Merluza al Horno (9)
(9, 'Pescado', 1), (9, 'Guarnición', 2), (9, 'Condimentos', 3),
-- Crema de Brócoli (10)
(10, 'Verduras', 1), (10, 'Base cremosa', 2), (10, 'Condimentos', 3);

-- =======================================================
-- 6. INGREDIENTES DE RECETAS CON SECCIONES CONSISTENTES
-- =======================================================
-- SOLUCION ROBUSTA: Usar tabla temporal para asegurar asignación correcta
-- de ingredientes a secciones reales del backend
-- =======================================================

-- Crear tabla temporal para mapear section_ids reales
CREATE TEMPORARY TABLE temp_section_mapping (
    recipe_id INT,
    section_name VARCHAR(100),
    section_id INT,
    section_order INT
);

-- Capturar los section_ids reales que acabamos de crear
INSERT INTO temp_section_mapping (recipe_id, section_name, section_id, section_order)
SELECT recipe_id, name, section_id, section_order 
FROM RECIPE_SECTIONS 
WHERE recipe_id BETWEEN 1 AND 10;

-- =======================================================
-- INSERTAR INGREDIENTES USANDO LOS IDs CORRECTOS
-- =======================================================

-- Pollo al Ajillo (1)
INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 1, 1, 0.20, section_id FROM temp_section_mapping WHERE recipe_id = 1 AND section_name = 'Ingredientes principales';

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 1, ingredient_id, quantity, section_id 
FROM (
    SELECT 38 as ingredient_id, 0.01 as quantity
    UNION SELECT 136, 0.005
    UNION SELECT 126, 0.02
    UNION SELECT 134, 0.002
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 1 AND section_name = 'Condimentos') AS section;

-- Salmón a la Plancha (2)
INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 2, 21, 0.15, section_id FROM temp_section_mapping WHERE recipe_id = 2 AND section_name = 'Pescado';

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 2, ingredient_id, quantity, section_id 
FROM (
    SELECT 42 as ingredient_id, 0.10 as quantity
    UNION SELECT 39, 0.08
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 2 AND section_name = 'Verduras') AS section;

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 2, ingredient_id, quantity, section_id 
FROM (
    SELECT 126 as ingredient_id, 0.015 as quantity
    UNION SELECT 76, 0.02
    UNION SELECT 134, 0.002
    UNION SELECT 135, 0.001
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 2 AND section_name = 'Condimentos') AS section;

-- Paella Valenciana (3)
INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 3, 101, 0.08, section_id FROM temp_section_mapping WHERE recipe_id = 3 AND section_name = 'Base de arroz';

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 3, 1, 0.12, section_id FROM temp_section_mapping WHERE recipe_id = 3 AND section_name = 'Carnes';

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 3, ingredient_id, quantity, section_id 
FROM (
    SELECT 41 as ingredient_id, 0.10 as quantity
    UNION SELECT 36, 0.08
    UNION SELECT 39, 0.06
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 3 AND section_name = 'Verduras') AS section;

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 3, ingredient_id, quantity, section_id 
FROM (
    SELECT 126 as ingredient_id, 0.025 as quantity
    UNION SELECT 38, 0.005
    UNION SELECT 134, 0.003
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 3 AND section_name = 'Condimentos') AS section;

-- Ensalada Mediterránea (4)
INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 4, ingredient_id, quantity, section_id 
FROM (
    SELECT 45 as ingredient_id, 0.08 as quantity
    UNION SELECT 36, 0.10
    UNION SELECT 50, 0.06
    UNION SELECT 37, 0.03
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 4 AND section_name = 'Verduras frescas') AS section;

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 4, 77, 0.08, section_id FROM temp_section_mapping WHERE recipe_id = 4 AND section_name = 'Frutas';

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 4, ingredient_id, quantity, section_id 
FROM (
    SELECT 126 as ingredient_id, 0.02 as quantity
    UNION SELECT 137, 0.01
    UNION SELECT 134, 0.002
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 4 AND section_name = 'Aliño') AS section;

-- Pasta Carbonara (5)
INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 5, 102, 0.10, section_id FROM temp_section_mapping WHERE recipe_id = 5 AND section_name = 'Pasta';

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 5, ingredient_id, quantity, section_id 
FROM (
    SELECT 120 as ingredient_id, 1 as quantity
    UNION SELECT 119, 0.05
    UNION SELECT 117, 0.05
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 5 AND section_name = 'Salsa') AS section;

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 5, ingredient_id, quantity, section_id 
FROM (
    SELECT 135 as ingredient_id, 0.001 as quantity
    UNION SELECT 134, 0.002
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 5 AND section_name = 'Condimentos') AS section;

-- Sopa de Lentejas (6)
INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 6, 105, 0.08, section_id FROM temp_section_mapping WHERE recipe_id = 6 AND section_name = 'Legumbres';

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 6, ingredient_id, quantity, section_id 
FROM (
    SELECT 37 as ingredient_id, 0.05 as quantity
    UNION SELECT 40, 0.06
    UNION SELECT 47, 0.04
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 6 AND section_name = 'Verduras') AS section;

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 6, ingredient_id, quantity, section_id 
FROM (
    SELECT 126 as ingredient_id, 0.015 as quantity
    UNION SELECT 134, 0.003
    UNION SELECT 136, 0.003
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 6 AND section_name = 'Condimentos') AS section;

-- Ternera con Champiñones (7)
INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 7, 2, 0.15, section_id FROM temp_section_mapping WHERE recipe_id = 7 AND section_name = 'Carne';

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 7, ingredient_id, quantity, section_id 
FROM (
    SELECT 49 as ingredient_id, 0.08 as quantity
    UNION SELECT 117, 0.06
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 7 AND section_name = 'Salsa') AS section;

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 7, ingredient_id, quantity, section_id 
FROM (
    SELECT 126 as ingredient_id, 0.02 as quantity
    UNION SELECT 134, 0.003
    UNION SELECT 135, 0.001
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 7 AND section_name = 'Condimentos') AS section;

-- Ensalada de Quinoa (8) - LA RECETA PROBLEMÁTICA CORREGIDA
INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 8, 107, 0.06, section_id FROM temp_section_mapping WHERE recipe_id = 8 AND section_name = 'Base';

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 8, ingredient_id, quantity, section_id 
FROM (
    SELECT 36 as ingredient_id, 0.08 as quantity
    UNION SELECT 50, 0.05
    UNION SELECT 39, 0.05
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 8 AND section_name = 'Verduras') AS section;

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 8, ingredient_id, quantity, section_id 
FROM (
    SELECT 126 as ingredient_id, 0.02 as quantity
    UNION SELECT 76, 0.015
    UNION SELECT 134, 0.002
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 8 AND section_name = 'Aliño') AS section;

-- Merluza al Horno (9)
INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 9, 22, 0.15, section_id FROM temp_section_mapping WHERE recipe_id = 9 AND section_name = 'Pescado';

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 9, ingredient_id, quantity, section_id 
FROM (
    SELECT 41 as ingredient_id, 0.12 as quantity
    UNION SELECT 37, 0.04
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 9 AND section_name = 'Guarnición') AS section;

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 9, ingredient_id, quantity, section_id 
FROM (
    SELECT 126 as ingredient_id, 0.02 as quantity
    UNION SELECT 76, 0.02
    UNION SELECT 134, 0.003
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 9 AND section_name = 'Condimentos') AS section;

-- Crema de Brócoli (10)
INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 10, ingredient_id, quantity, section_id 
FROM (
    SELECT 46 as ingredient_id, 0.15 as quantity
    UNION SELECT 41, 0.08
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 10 AND section_name = 'Verduras') AS section;

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 10, ingredient_id, quantity, section_id 
FROM (
    SELECT 117 as ingredient_id, 0.05 as quantity
    UNION SELECT 116, 0.10
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 10 AND section_name = 'Base cremosa') AS section;

INSERT INTO RECIPE_INGREDIENTS (recipe_id, ingredient_id, quantity_per_serving, section_id)
SELECT 10, ingredient_id, quantity, section_id 
FROM (
    SELECT 134 as ingredient_id, 0.003 as quantity
    UNION SELECT 135, 0.001
) AS ingredients
CROSS JOIN (SELECT section_id FROM temp_section_mapping WHERE recipe_id = 10 AND section_name = 'Condimentos') AS section;

-- Limpiar tabla temporal
DROP TEMPORARY TABLE temp_section_mapping;

-- =======================================================
-- 7. ASIGNACIÓN DE CATEGORÍAS A RECETAS
-- =======================================================
INSERT INTO RECIPE_CATEGORY_ASSIGNMENTS (recipe_id, category_id) VALUES
(1, 13),  -- Pollo al Ajillo -> Platos principales
(2, 13),  -- Salmón -> Platos principales  
(3, 5),   -- Paella -> Comida mediterránea
(4, 9),   -- Ensalada Mediterránea -> Ensaladas
(5, 4),   -- Pasta Carbonara -> Comida italiana
(6, 16),  -- Sopa de Lentejas -> Sopas
(7, 13),  -- Ternera -> Platos principales
(8, 8),   -- Ensalada Quinoa -> Comida vegetariana
(9, 13),  -- Merluza -> Platos principales
(10, 16); -- Crema Brócoli -> Sopas

-- =======================================================
-- 8. MENÚS TEMÁTICOS DE DEMOSTRACIÓN
-- =======================================================
INSERT INTO MENUS (name, menu_date) VALUES
('Menú Mediterráneo', '2024-08-01'),
('Menú Ejecutivo', '2024-08-02'),
('Menú Vegetariano', '2024-08-03'),
('Menú Gourmet', '2024-08-04');

INSERT INTO MENU_RECIPES (menu_id, recipe_id) VALUES
-- Menú Mediterráneo
(1, 4), (1, 3), (1, 2),
-- Menú Ejecutivo  
(2, 6), (2, 1), (2, 9),
-- Menú Vegetariano
(3, 8), (3, 10), (3, 4),
-- Menú Gourmet
(4, 4), (4, 7), (4, 2);

-- =======================================================
-- 9. ACTUALIZAR COSTOS DE RECETAS
-- =======================================================
UPDATE RECIPES r
SET cost_per_serving = (
    SELECT ROUND(SUM(ri.quantity_per_serving * i.net_price), 2)
    FROM RECIPE_INGREDIENTS ri
    JOIN INGREDIENTS i ON ri.ingredient_id = i.ingredient_id
    WHERE ri.recipe_id = r.recipe_id
)
WHERE r.recipe_id BETWEEN 1 AND 10;

-- =======================================================
-- 10. EVENTOS DE DEMOSTRACIÓN
-- =======================================================
INSERT INTO EVENTS (name, description, event_date, event_time, guests_count, location, status, budget, notes, created_by_user_id) VALUES
('Banquete de Empresa Navideño', 'Celebración navideña anual de la empresa con menú gourmet y ambiente festivo', '2025-08-12', '19:30:00', 45, 'Salón Principal - Hotel Gran Madrid', 'confirmed', 2250.00, 'Incluye decoración navideña, música en vivo y regalos corporativos. Menú completo con entrante, plato principal y postre', 1),
('Cena Romántica San Valentín', 'Velada íntima para parejas con menú degustación y ambiente romántico', '2025-08-11', '20:00:00', 20, 'Sala Privada - Restaurante El Jardín Secreto', 'planned', 1800.00, 'Ambiente íntimo con velas, música suave y servicio personalizado. Menú de 4 tiempos con maridaje opcional', 2);

-- =======================================================
-- 11. ASIGNACIÓN DE RECETAS A EVENTOS
-- =======================================================
INSERT INTO EVENT_MENUS (event_id, recipe_id, portions, course_type, notes) VALUES
-- Banquete de Empresa Navideño (Event ID: 1)
(1, 4, 45, 'starter', 'Ensalada fresca como aperitivo ligero'),
(1, 7, 45, 'main', 'Plato principal elegante con ternera premium'),
(1, 2, 45, 'side', 'Acompañamiento de salmón como alternativa'),
(1, 10, 45, 'dessert', 'Crema suave para finalizar'),

-- Cena Romántica San Valentín (Event ID: 2)  
(2, 8, 20, 'starter', 'Entrante saludable y colorido'),
(2, 6, 20, 'starter', 'Sopa caliente para crear ambiente acogedor'),
(2, 3, 20, 'main', 'Paella como plato estrella para compartir'),
(2, 9, 20, 'main', 'Alternativa de pescado para mayor variedad'),
(2, 1, 20, 'side', 'Pollo como opción adicional');

-- =======================================================
-- 12. PEDIDOS A PROVEEDORES DE DEMOSTRACIÓN  
-- =======================================================
INSERT INTO SUPPLIER_ORDERS (supplier_id, order_date, delivery_date, status, total_amount, notes, source_events, created_by_user_id) VALUES
-- Pedido pendiente - Carnicería Premium
(1, '2024-08-01', '2024-08-03', 'pending', 485.50, 'Pedido semanal de carnes para restaurante - Pendiente de confirmación', NULL, 3),

-- Pedido realizado - Pescadería Mar Azul (relacionado con eventos)
(2, '2024-12-10', '2024-12-12', 'ordered', 892.75, 'Pedido especial para eventos navideños - Ya confirmado con proveedor', '[1]', 3),

-- Pedido entregado - Frutas y Verduras El Huerto
(3, '2024-07-28', '2024-07-29', 'delivered', 156.80, 'Pedido de verduras frescas - Entregado en perfectas condiciones', NULL, 3),

-- Pedido cancelado - Lácteos San Miguel
(4, '2024-07-25', NULL, 'cancelled', 0.00, 'Pedido cancelado por problemas de calidad del proveedor', NULL, 3),

-- Pedido entregado - Distribuciones Gourmet (para eventos San Valentín)
(5, '2024-02-10', '2024-02-12', 'delivered', 234.60, 'Cereales y básicos para cena romántica - Entrega perfecta', '[2]', 3),

-- Pedido realizado - Especias del Mundo
(6, '2024-08-02', '2024-08-04', 'ordered', 78.90, 'Reposición de especias y condimentos - Confirmado', NULL, 3);

-- =======================================================
-- 13. ITEMS DE PEDIDOS A PROVEEDORES
-- =======================================================
INSERT INTO SUPPLIER_ORDER_ITEMS (order_id, ingredient_id, quantity, unit_price, total_price) VALUES
-- Pedido 1: Carnicería Premium (pendiente)
(1, 1, 5.0, 8.20, 41.00),    -- Pollo 5kg
(1, 2, 2.0, 24.50, 49.00),   -- Ternera 2kg  
(1, 3, 4.0, 11.80, 47.20),   -- Cerdo 4kg
(1, 4, 3.0, 17.50, 52.50),   -- Cordero 3kg
(1, 5, 1.0, 34.00, 34.00),   -- Jamón 1kg   

-- Pedido 2: Pescadería Mar Azul (ordenado - para eventos)
(2, 6, 8.0, 21.50, 172.00),  -- Salmón 8kg
(2, 7, 12.0, 15.80, 189.60), -- Merluza 12kg  
(2, 8, 6.0, 17.50, 105.00),  -- Atún 6kg
(2, 9, 4.0, 27.50, 110.00),  -- Gambas 4kg
(2, 10, 8.0, 7.80, 62.40),   -- Mejillones 8kg

-- Pedido 3: Frutas y Verduras El Huerto (entregado)
(3, 11, 10.0, 3.10, 31.00),  -- Tomate 10kg
(3, 12, 8.0, 1.70, 13.60),   -- Cebolla 8kg
(3, 14, 5.0, 4.30, 21.50),   -- Pimiento 5kg
(3, 15, 6.0, 2.10, 12.60),   -- Zanahoria 6kg
(3, 20, 12.0, 2.40, 28.80),  -- Lechuga 12kg
(3, 26, 8.0, 3.70, 29.60),   -- Limón 8kg
(3, 27, 6.0, 2.50, 15.00),   -- Naranja 6kg

-- Pedido 4: Lácteos San Miguel (cancelado) - Sin items por cancelación

-- Pedido 5: Distribuciones Gourmet (entregado - para San Valentín)
(5, 31, 5.0, 4.10, 20.50),   -- Arroz bomba 5kg
(5, 32, 8.0, 2.70, 21.60),   -- Pasta 8kg
(5, 33, 10.0, 1.55, 15.50),  -- Harina 10kg
(5, 34, 5.0, 3.10, 15.50),   -- Garbanzos 5kg
(5, 35, 6.0, 2.70, 16.20),   -- Lentejas 6kg
(5, 37, 2.0, 8.30, 16.60),   -- Quinoa 2kg
(5, 39, 20.0, 1.15, 23.00),  -- Pan 20 unidades

-- Pedido 6: Especias del Mundo (ordenado)
(6, 46, 2.0, 8.00, 16.00),   -- Aceite oliva 2L
(6, 47, 1.0, 4.40, 4.40),    -- Vinagre jerez 1L
(6, 48, 5.0, 2.10, 10.50),   -- Sal marina 5kg
(6, 49, 0.5, 24.50, 12.25),  -- Pimienta 0.5kg
(6, 50, 1.0, 7.80, 7.80);    -- Perejil 1kg

-- Actualizar totales reales de pedidos
UPDATE SUPPLIER_ORDERS SET total_amount = 223.70 WHERE order_id = 1;
UPDATE SUPPLIER_ORDERS SET total_amount = 639.00 WHERE order_id = 2;
UPDATE SUPPLIER_ORDERS SET total_amount = 152.10 WHERE order_id = 3;
UPDATE SUPPLIER_ORDERS SET total_amount = 128.90 WHERE order_id = 5;
UPDATE SUPPLIER_ORDERS SET total_amount = 50.95 WHERE order_id = 6;

-- =======================================================
-- MENSAJE DE CONFIRMACIÓN
-- =======================================================
SELECT 'DEMO SEED COMPLETADO EXITOSAMENTE' as STATUS,
       (SELECT COUNT(*) FROM USERS) as USUARIOS_TOTALES,
       (SELECT COUNT(*) FROM SUPPLIERS) as PROVEEDORES,
       (SELECT COUNT(*) FROM SUPPLIER_INGREDIENTS) as RELACIONES_PROVEEDOR,
       (SELECT COUNT(*) FROM RECIPES) as RECETAS,
       (SELECT COUNT(*) FROM RECIPE_SECTIONS) as SECCIONES_RECETA,
       (SELECT COUNT(*) FROM RECIPE_INGREDIENTS) as INGREDIENTES_RECETA,
       (SELECT COUNT(*) FROM MENUS) as MENUS,
       (SELECT COUNT(*) FROM MENU_RECIPES) as RECETAS_EN_MENUS,
       (SELECT COUNT(*) FROM RESTAURANT_INFO) as RESTAURANTE,
       (SELECT name FROM RESTAURANT_INFO LIMIT 1) as NOMBRE_RESTAURANTE,
       (SELECT CONCAT('€', MIN(cost_per_serving), ' - €', MAX(cost_per_serving)) FROM RECIPES WHERE cost_per_serving IS NOT NULL) as RANGO_COSTOS;