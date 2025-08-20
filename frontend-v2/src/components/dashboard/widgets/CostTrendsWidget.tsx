// components/dashboard/widgets/CostTrendsWidget.tsx

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Euro } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';
import { useCostTrends } from '@/hooks/useDashboardWidgets';
import { Badge, EmptyState } from '@/components/ui';

interface CostTrendsWidgetProps {
  limit?: number;
  enabled?: boolean;
  compact?: boolean;
}

const CostTrendsWidget: React.FC<CostTrendsWidgetProps> = ({
  limit = 5,
  enabled = true,
  compact = false
}) => {
  const { data, loading, error, refetch } = useCostTrends(limit, enabled);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increase': return TrendingUp;
      case 'decrease': return TrendingDown;
      default: return Minus;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'increase': return 'text-red-600';
      case 'decrease': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getBadgeColor = (direction: string) => {
    switch (direction) {
      case 'increase': return 'bg-red-100 text-red-800';
      case 'decrease': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <DashboardWidget
      id="costTrends"
      title="Tendencias de Costos"
      icon={Euro}
      loading={loading}
      error={error}
      onRefresh={refetch}
      compact={compact}
    >
      {data.length === 0 ? (
        <EmptyState
          icon={Euro}
          title="Sin tendencias de precio"
          description="No hay cambios recientes en los precios de ingredientes"
        />
      ) : (
        <div className="space-y-3">
          {data.map((trend) => {
            const TrendIcon = getTrendIcon(trend.trend_direction);
            const trendColor = getTrendColor(trend.trend_direction);
            const badgeColor = getBadgeColor(trend.trend_direction);
            
            return (
              <div
                key={trend.ingredient_id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${badgeColor.replace('text-', 'text-').replace('bg-', 'bg-').replace('100', '200')}`}>
                      <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{trend.name}</h4>
                      <p className="text-xs text-gray-500">
                        Hace {trend.days_ago} días
                      </p>
                    </div>
                  </div>
                  
                  <Badge className={badgeColor} size="sm">
                    {Math.abs(trend.price_change_percent)}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <div>
                      <span className="text-gray-600">Precio anterior: </span>
                      <span className="font-medium">{formatPrice(trend.old_price)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Precio actual: </span>
                      <span className={`font-medium ${trendColor}`}>
                        {formatPrice(trend.current_price)}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`text-right ${trendColor}`}>
                    <div className="font-medium">
                      {trend.trend_direction === 'increase' ? '+' : 
                       trend.trend_direction === 'decrease' ? '-' : ''}
                      {formatPrice(Math.abs(trend.current_price - trend.old_price))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {!compact && data.length > 0 && (
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {data.length} ingredientes con cambios de precio
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardWidget>
  );
};

export default CostTrendsWidget;