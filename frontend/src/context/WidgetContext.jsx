import React, { createContext, useContext, useState, useEffect } from 'react';

const WidgetContext = createContext();

// Configuración predeterminada de widgets
const defaultWidgetConfig = {
  // Widgets activos por defecto
  stockAlerts: true,
  upcomingEvents: true,
  supplierOrders: true,
  seasonalAlerts: true,
  seasonalIngredients: true,
  latestRecipes: true,
  costTrends: true,
  
  // Widgets desactivados por defecto
  eventsWithMenus: false,
  recipesByCategory: false,
  
  // Widgets adicionales (desactivados)
  wasteManagement: false,
  supplierPerformance: false,
  nutritionalAnalysis: false,
  
  // Configuración de visualización
  itemsPerWidget: 5,
  autoRefresh: false,
  refreshInterval: 30000 // 30 segundos
};

// Orden predeterminado de widgets (según nueva configuración)
const defaultWidgetOrder = [
  'stockAlerts',           // Alertas de Stock
  'upcomingEvents',        // Próximos Eventos
  'supplierOrders',        // Órdenes de Compra Pendientes
  'seasonalAlerts',        // Alertas de Temporada
  'seasonalIngredients',   // Ingredientes de Temporada
  'eventsWithMenus',       // Eventos con Menús (desactivado por defecto)
  'latestRecipes',         // Últimas Recetas
  'costTrends',            // Tendencias de Costos
  'recipesByCategory'      // Recetas por Categoría (desactivado por defecto)
];

export const WidgetProvider = ({ children }) => {
  const [widgetConfig, setWidgetConfig] = useState(defaultWidgetConfig);
  const [widgetOrder, setWidgetOrder] = useState(defaultWidgetOrder);
  const [loading, setLoading] = useState(true);

  // Cargar configuración desde localStorage al iniciar
  useEffect(() => {
    const savedConfig = localStorage.getItem('widgetConfig');
    const savedOrder = localStorage.getItem('widgetOrder');
    
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setWidgetConfig({ ...defaultWidgetConfig, ...parsedConfig });
      } catch (error) {
        console.error('Error parsing widget config:', error);
      }
    }
    
    if (savedOrder) {
      try {
        const parsedOrder = JSON.parse(savedOrder);
        setWidgetOrder(parsedOrder);
      } catch (error) {
        console.error('Error parsing widget order:', error);
      }
    }
    
    setLoading(false);
  }, []);

  // Guardar configuración en localStorage cuando cambie
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('widgetConfig', JSON.stringify(widgetConfig));
    }
  }, [widgetConfig, loading]);

  // Guardar orden en localStorage cuando cambie
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('widgetOrder', JSON.stringify(widgetOrder));
    }
  }, [widgetOrder, loading]);

  // Función para actualizar la configuración de un widget
  const updateWidgetConfig = (widgetId, enabled) => {
    setWidgetConfig(prev => ({
      ...prev,
      [widgetId]: enabled
    }));
  };

  // Función para actualizar configuración de visualización
  const updateDisplayConfig = (key, value) => {
    setWidgetConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Función para resetear configuración
  const resetWidgetConfig = () => {
    setWidgetConfig(defaultWidgetConfig);
    setWidgetOrder(defaultWidgetOrder);
    localStorage.removeItem('widgetConfig');
    localStorage.removeItem('widgetOrder');
  };

  // Función para obtener widgets activos
  const getActiveWidgets = () => {
    return Object.entries(widgetConfig)
      .filter(([key, value]) => 
        typeof value === 'boolean' && value === true
      )
      .map(([key]) => key);
  };

  // Función para obtener widgets ordenados
  const getOrderedWidgets = () => {
    return widgetOrder.filter(widgetId => widgetConfig[widgetId] === true);
  };

  // Función para actualizar el orden completo de widgets
  const updateWidgetOrder = (newOrder) => {
    setWidgetOrder(newOrder);
  };

  // Función para mover un widget hacia arriba
  const moveWidgetUp = (widgetId) => {
    const currentIndex = widgetOrder.indexOf(widgetId);
    if (currentIndex > 0) {
      const newOrder = [...widgetOrder];
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
      setWidgetOrder(newOrder);
    }
  };

  // Función para mover un widget hacia abajo
  const moveWidgetDown = (widgetId) => {
    const currentIndex = widgetOrder.indexOf(widgetId);
    if (currentIndex < widgetOrder.length - 1) {
      const newOrder = [...widgetOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      setWidgetOrder(newOrder);
    }
  };

  const value = {
    widgetConfig,
    widgetOrder,
    updateWidgetConfig,
    updateDisplayConfig,
    resetWidgetConfig,
    getActiveWidgets,
    getOrderedWidgets,
    updateWidgetOrder,
    moveWidgetUp,
    moveWidgetDown,
    loading
  };

  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  );
};

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidget must be used within a WidgetProvider');
  }
  return context;
};

export default WidgetContext;