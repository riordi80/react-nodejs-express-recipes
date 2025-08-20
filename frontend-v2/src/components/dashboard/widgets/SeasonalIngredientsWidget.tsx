// components/dashboard/widgets/SeasonalIngredientsWidget.tsx
// Widget para ingredientes de temporada

'use client';

import React from 'react';
import { Leaf, Package } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';
import { useSeasonalIngredients } from '@/hooks/useDashboardWidgets';
import { Badge, EmptyState } from '@/components/ui';

interface SeasonalIngredientsWidgetProps {
  limit?: number;
  enabled?: boolean;
  compact?: boolean;
}

const SeasonalIngredientsWidget: React.FC<SeasonalIngredientsWidgetProps> = ({
  limit = 5,
  enabled = true,
  compact = false
}) => {
  const { data, currentMonth, loading, error, refetch } = useSeasonalIngredients(enabled);

  // Aplicar límite desde configuración
  const limitedData = data.slice(0, limit);

  return (
    <DashboardWidget
      id="seasonalIngredients"
      title={`Temporada de ${currentMonth}`}
      icon={Leaf}
      loading={loading}
      error={error}
      onRefresh={refetch}
      compact={compact}
    >
      {data.length === 0 ? (
        <EmptyState
          icon={Leaf}
          title="Sin ingredientes de temporada"
          description={`No hay ingredientes específicos para ${currentMonth}`}
        />
      ) : (
        <div className="space-y-3">
          {limitedData.map((ingredient) => (
            <div
              key={ingredient.ingredient_id}
              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <Leaf className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{ingredient.name}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {ingredient.stock} {ingredient.unit}
                  </p>
                </div>
              </div>
              <Badge variant="success" size="sm">
                En temporada
              </Badge>
            </div>
          ))}
          
          {!compact && data.length > limit && (
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Y {data.length - limit} ingredientes más de temporada
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardWidget>
  );
};

export default SeasonalIngredientsWidget;