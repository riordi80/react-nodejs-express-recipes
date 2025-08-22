// components/dashboard/DynamicWidget.tsx
// Componente que renderiza dinámicamente widgets según configuración

'use client';

import React from 'react';
import { Widget } from '@/hooks/useDashboardConfig';
import {
  StockAlertsWidget,
  SeasonalIngredientsWidget,
  SeasonalAlertsWidget,
  UpcomingEventsWidget,
  EventsWithMenusWidget,
  LatestRecipesWidget,
  RecipesByCategoryWidget,
  PendingOrdersWidget,
  CostTrendsWidget
} from './widgets';

interface DynamicWidgetProps {
  widget: Widget;
  itemsPerWidget: string;
  compact?: boolean;
}

const DynamicWidget: React.FC<DynamicWidgetProps> = ({
  widget,
  itemsPerWidget,
  compact = false
}) => {
  // No renderizar si está deshabilitado
  if (!widget.enabled) {
    return null;
  }

  // Mapeo de IDs de widgets a componentes
  const widgetComponents: Record<string, React.ComponentType<any>> = {
    stockAlerts: StockAlertsWidget,
    seasonalIngredients: SeasonalIngredientsWidget,
    seasonalAlerts: SeasonalAlertsWidget,
    upcomingEvents: UpcomingEventsWidget,
    eventsWithMenus: EventsWithMenusWidget,
    latestRecipes: LatestRecipesWidget,
    recipesByCategory: RecipesByCategoryWidget,
    pendingOrders: PendingOrdersWidget,
    costTrends: CostTrendsWidget
  };

  const WidgetComponent = widgetComponents[widget.id];

  // Si no existe el componente, no renderizar nada
  if (!WidgetComponent) {
    console.warn(`Widget component not found for ID: ${widget.id}`);
    return null;
  }

  // Props comunes para todos los widgets
  const commonProps = {
    enabled: widget.enabled,
    compact,
    limit: parseInt(itemsPerWidget, 10)
  };

  // Props específicos según el tipo de widget
  const getSpecificProps = () => {
    switch (widget.id) {
      case 'upcomingEvents':
        return { period: 'week' as const };
      case 'seasonalAlerts':
        return {}; // Usar el limit de commonProps, no forzar mínimo
      default:
        return {};
    }
  };

  const specificProps = getSpecificProps();
  const finalProps = { ...commonProps, ...specificProps };

  return <WidgetComponent {...finalProps} />;
};

export default DynamicWidget;