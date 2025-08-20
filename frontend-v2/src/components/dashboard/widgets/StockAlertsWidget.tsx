// components/dashboard/widgets/StockAlertsWidget.tsx
// Widget para alertas de stock bajo

'use client';

import React from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';
import { useStockAlerts } from '@/hooks/useDashboardWidgets';
import { Badge, EmptyState } from '@/components/ui';

interface StockAlertsWidgetProps {
  limit?: number;
  enabled?: boolean;
  compact?: boolean;
}

const StockAlertsWidget: React.FC<StockAlertsWidgetProps> = ({
  limit = 5,
  enabled = true,
  compact = false
}) => {
  const { data, loading, error, refetch } = useStockAlerts(limit, enabled);

  return (
    <DashboardWidget
      id="stockAlerts"
      title="Alertas de Stock"
      icon={Package}
      loading={loading}
      error={error}
      onRefresh={refetch}
      compact={compact}
    >
      {data.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sin alertas de stock"
          description="Todos los ingredientes tienen stock suficiente"
        />
      ) : (
        <div className="space-y-3">
          {data.map((alert) => (
            <div
              key={alert.ingredient_id}
              className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{alert.name}</p>
                  <p className="text-sm text-gray-600">
                    Stock: {alert.stock} {alert.unit}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="danger" size="sm">
                  Crítico
                </Badge>
                <p className="text-xs text-red-600 mt-1">
                  Mínimo: {alert.stock_minimum} {alert.unit}
                </p>
              </div>
            </div>
          ))}
          
          {!compact && data.length > 3 && (
            <div className="text-center pt-2">
              <p className="text-sm text-gray-500">
                Mostrando {data.length} de {data.length} alertas
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardWidget>
  );
};

export default StockAlertsWidget;