// hooks/useDashboardConfig.ts
// Hook para gestionar la configuración de widgets del dashboard

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Widget {
  id: string;
  title: string;
  description: string;
  category: 'inventory' | 'events' | 'recipes' | 'suppliers';
  enabled: boolean;
  order: number;
}

export interface DisplaySettings {
  itemsPerWidget: string;
  autoRefresh: boolean;
  refreshInterval: string;
}

interface DashboardConfig {
  widgets: Widget[];
  displaySettings: DisplaySettings;
}

// Configuración por defecto de widgets
const DEFAULT_WIDGETS: Widget[] = [
  // Gestión de Inventario
  { 
    id: 'stockAlerts', 
    title: 'Alertas de Stock', 
    description: 'Ingredientes con stock bajo', 
    category: 'inventory', 
    enabled: true, 
    order: 1 
  },
  { 
    id: 'seasonalIngredients', 
    title: 'Ingredientes de Temporada', 
    description: 'Ingredientes actuales de temporada', 
    category: 'inventory', 
    enabled: true, 
    order: 2 
  },
  { 
    id: 'seasonalAlerts', 
    title: 'Alertas de Temporada', 
    description: 'Ingredientes próximos a cambiar temporada', 
    category: 'inventory', 
    enabled: false, 
    order: 3 
  },
  // Eventos y Planificación
  { 
    id: 'upcomingEvents', 
    title: 'Próximos Eventos', 
    description: 'Eventos programados próximamente', 
    category: 'events', 
    enabled: true, 
    order: 4 
  },
  { 
    id: 'eventsWithMenus', 
    title: 'Eventos con Menús', 
    description: 'Eventos que tienen menús asignados', 
    category: 'events', 
    enabled: true, 
    order: 5 
  },
  // Recetas y Cocina
  { 
    id: 'latestRecipes', 
    title: 'Últimas Recetas', 
    description: 'Recetas añadidas recientemente', 
    category: 'recipes', 
    enabled: true, 
    order: 6 
  },
  { 
    id: 'recipesByCategory', 
    title: 'Recetas por Categoría', 
    description: 'Distribución de recetas por categoría', 
    category: 'recipes', 
    enabled: false, 
    order: 7 
  },
  // Proveedores y Pedidos
  { 
    id: 'pendingOrders', 
    title: 'Pedidos Pendientes', 
    description: 'Órdenes de compra pendientes', 
    category: 'suppliers', 
    enabled: true, 
    order: 8 
  },
  { 
    id: 'costTrends', 
    title: 'Tendencias de Costos', 
    description: 'Evolución de precios de ingredientes', 
    category: 'suppliers', 
    enabled: false, 
    order: 9 
  }
];

const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  itemsPerWidget: '5',
  autoRefresh: true,
  refreshInterval: '30'
};

const STORAGE_KEY = 'dashboard_config';

export const useDashboardConfig = () => {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(DEFAULT_DISPLAY_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Cargar configuración del localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config: DashboardConfig = JSON.parse(stored);
        
        // Merge con defaults para asegurar compatibilidad con nuevos widgets
        const mergedWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
          const storedWidget = config.widgets?.find(w => w.id === defaultWidget.id);
          return storedWidget ? { ...defaultWidget, ...storedWidget } : defaultWidget;
        });
        
        // Añadir widgets nuevos que no existían antes
        const existingIds = mergedWidgets.map(w => w.id);
        const newWidgets = DEFAULT_WIDGETS.filter(w => !existingIds.includes(w.id));
        
        setWidgets([...mergedWidgets, ...newWidgets]);
        setDisplaySettings({ ...DEFAULT_DISPLAY_SETTINGS, ...config.displaySettings });
      }
    } catch (error) {
      console.warn('Error loading dashboard config:', error);
      // Usar valores por defecto
    } finally {
      setLoading(false);
    }
  }, []);

  // Guardar configuración en localStorage
  const saveConfig = useCallback((newWidgets?: Widget[], newDisplaySettings?: DisplaySettings) => {
    try {
      const config: DashboardConfig = {
        widgets: newWidgets || widgets,
        displaySettings: newDisplaySettings || displaySettings
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving dashboard config:', error);
    }
  }, [widgets, displaySettings]);

  // Activar/desactivar widget
  const toggleWidget = useCallback((widgetId: string) => {
    const newWidgets = widgets.map(widget => 
      widget.id === widgetId 
        ? { ...widget, enabled: !widget.enabled }
        : widget
    );
    setWidgets(newWidgets);
    saveConfig(newWidgets);
  }, [widgets, saveConfig]);

  // Mover widget en el orden
  const moveWidget = useCallback((widgetId: string, direction: 'up' | 'down') => {
    const currentIndex = widgets.findIndex(w => w.id === widgetId);
    if (
      (direction === 'up' && currentIndex > 0) ||
      (direction === 'down' && currentIndex < widgets.length - 1)
    ) {
      const newWidgets = [...widgets];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      // Intercambiar posiciones
      const temp = newWidgets[currentIndex].order;
      newWidgets[currentIndex].order = newWidgets[targetIndex].order;
      newWidgets[targetIndex].order = temp;
      
      // Reordenar array
      newWidgets.sort((a, b) => a.order - b.order);
      setWidgets(newWidgets);
      saveConfig(newWidgets);
    }
  }, [widgets, saveConfig]);

  // Actualizar configuración de visualización
  const updateDisplaySettings = useCallback((key: keyof DisplaySettings, value: string | boolean) => {
    const newSettings = { ...displaySettings, [key]: value };
    setDisplaySettings(newSettings);
    saveConfig(undefined, newSettings);
  }, [displaySettings, saveConfig]);

  // Restablecer a valores por defecto
  const resetToDefaults = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
    setDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
    saveConfig(DEFAULT_WIDGETS, DEFAULT_DISPLAY_SETTINGS);
  }, [saveConfig]);

  // Obtener widgets habilitados en orden
  const enabledWidgets = widgets.filter(w => w.enabled).sort((a, b) => a.order - b.order);

  // Obtener widgets por categoría
  const getWidgetsByCategory = useCallback((category: Widget['category']) => {
    return widgets.filter(w => w.category === category);
  }, [widgets]);

  // Verificar si un widget está habilitado
  const isWidgetEnabled = useCallback((widgetId: string) => {
    return widgets.find(w => w.id === widgetId)?.enabled ?? false;
  }, [widgets]);

  return {
    // Estado
    widgets,
    displaySettings,
    enabledWidgets,
    loading,
    
    // Estadísticas
    totalWidgets: widgets.length,
    enabledCount: enabledWidgets.length,
    disabledCount: widgets.length - enabledWidgets.length,
    
    // Acciones
    toggleWidget,
    moveWidget,
    updateDisplaySettings,
    resetToDefaults,
    
    // Utilidades
    getWidgetsByCategory,
    isWidgetEnabled
  };
};

export default useDashboardConfig;