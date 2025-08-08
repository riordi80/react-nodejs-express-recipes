# Scripts de Seeding para Base de Datos Recetario

Este directorio contiene scripts SQL organizados para poblar la base de datos con diferentes niveles de datos según las necesidades de desarrollo y testing.

## 📁 Estructura de Scripts

### 1. `01_base_seed.sql` - Datos Mínimos Esenciales
**Propósito**: Base de datos limpia con elementos indispensables
**Contenido**:
- ✅ 1 Usuario administrador (admin@example.com / admin123)
- ✅ 14 Alérgenos obligatorios de la UE
- ✅ 50 Ingredientes básicos con valores nutricionales completos
- ✅ 10 Categorías de ingredientes + 10 categorías de recetas
- ✅ 4 Tipos de impuestos (IVA)
- ✅ Configuración del sistema
- ✅ Asignaciones de categorías y alérgenos básicos

**Usar cuando**: 
- Nueva instalación
- Testing de funcionalidades básicas
- Desarrollo inicial

### 2. `02_extended_seed.sql` - Datos de Desarrollo
**Propósito**: Ambiente de desarrollo con datos funcionales
**Incluye todo de base_seed.sql más**:
- ✅ 2 Usuarios adicionales (chef, supplier_manager)
- ✅ 3 Proveedores con relaciones completas
- ✅ 5 Recetas completas con ingredientes y secciones
- ✅ 2 Eventos de ejemplo
- ✅ Menús semanales
- ✅ Movimientos de inventario básicos
- ✅ Pedidos a proveedores de ejemplo

**Usar cuando**:
- Desarrollo de funcionalidades
- Testing de workflows completos
- Demos y presentaciones

### 3. `03_production_seed.sql` - Datos Completos de Producción
**Propósito**: Base de datos completa para testing exhaustivo
**Incluye todo de extended_seed.sql más**:
- ✅ 5 Usuarios completos del equipo
- ✅ 8 Proveedores especializados
- ✅ 150 Ingredientes (100 adicionales con categorización completa)
- ✅ 15 Recetas variadas con dificultades diferentes
- ✅ 8 Eventos históricos de 3 meses
- ✅ Datos históricos de pedidos e inventario
- ✅ Relaciones completas proveedor-ingrediente

**Usar cuando**:
- Testing de rendimiento
- Simulación de ambiente real
- Validación de reportes y estadísticas

## 🚀 Instrucciones de Uso

### Ejecución Básica
```bash
# Acceder a MySQL
mysql -u root -p

# Ejecutar script base (ejemplo)
SOURCE /path/to/seeds/01_base_seed.sql;
```

### Ejecución con Docker (si aplica)
```bash
# Si usas contenedor de MySQL
docker exec -i mysql_container mysql -u root -p recipes < 01_base_seed.sql
```

### Orden de Ejecución
⚠️ **IMPORTANTE**: Los scripts están diseñados para ejecutarse de forma independiente:
- `01_base_seed.sql` - Ejecutar solo
- `02_extended_seed.sql` - Ejecuta automáticamente `01_base_seed.sql`
- `03_production_seed.sql` - Ejecuta automáticamente `02_extended_seed.sql`

## 📊 Datos de Acceso por Script

### Script Base (01)
```
Usuario: admin@example.com
Contraseña: admin123
Rol: admin
```

### Script Extendido (02)
```
Usuarios adicionales:
- chef@recetario.com / chef123 (chef)
- compras@recetario.com / supplier123 (supplier_manager)
```

### Script Producción (03)
```
Usuarios completos del equipo:
- inventory@recetario.com / inventory123 (inventory_manager)
- camarero@recetario.com / waiter123 (waiter)
- sous.chef@recetario.com / souschef123 (chef)
```

## 🏗️ Estructura de Datos por Script

| Elemento | Base | Extendido | Producción |
|----------|------|-----------|------------|
| Usuarios | 1 | 3 | 6 |
| Alérgenos | 14 | 14 | 14 |
| Ingredientes | 50 | 50 | 150 |
| Categorías Ingr. | 10 | 10 | 10 |
| Proveedores | 0 | 3 | 8 |
| Recetas | 0 | 5 | 15 |
| Eventos | 0 | 2 | 8 |
| Pedidos | 0 | 3 | 9 |

## 🔄 Procedimientos y Triggers

Todos los scripts incluyen automáticamente:
- ✅ Procedimientos almacenados para cálculo de costes
- ✅ Triggers para actualización automática de precios
- ✅ Eventos programados para limpieza de logs
- ✅ Actualización de `net_price` automática
- ✅ Cálculo de costes de recetas al final

## 🧪 Testing y Validación

Cada script incluye al final una consulta de validación que muestra:
- Número de registros insertados por tabla
- Status de finalización exitosa
- Información de stock total (en scripts avanzados)

## 📝 Notas Importantes

1. **Limpieza Automática**: Todos los scripts limpian datos existentes antes de insertar
2. **Integridad Referencial**: Se desactiva temporalmente `FOREIGN_KEY_CHECKS` durante la limpieza
3. **Contraseñas**: Usan hash bcrypt real, seguras para producción
4. **Datos Nutricionales**: Valores reales por 100g de cada ingrediente
5. **Precios**: Basados en precios reales de mercado español (€)
6. **Alérgenos**: Cumple normativa europea de 14 alérgenos obligatorios

## 🛠️ Personalización

Para crear variaciones personalizadas:
1. Copia el script base que más se ajuste
2. Modifica los datos según necesidades
3. Mantén la estructura de limpieza inicial
4. Incluye la validación final
5. Actualiza este README con tu nueva versión