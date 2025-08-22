// components/dashboard/widgets/SeasonalAlertsWidget.tsx

'use client';

import React from 'react';
import { Calendar, AlertCircle, Info, CheckCircle } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';
import { useSeasonalAlerts } from '@/hooks/useDashboardWidgets';
import { Badge, EmptyState } from '@/components/ui';

interface SeasonalAlertsWidgetProps {
  limit?: number;
  enabled?: boolean;
  compact?: boolean;
}

const urgencyConfig = {
  success: { icon: CheckCircle, color: 'bg-green-50 border-green-200', badgeColor: 'bg-green-100 text-green-800' },
  warning: { icon: AlertCircle, color: 'bg-yellow-50 border-yellow-200', badgeColor: 'bg-yellow-100 text-yellow-800' },
  info: { icon: Info, color: 'bg-blue-50 border-blue-200', badgeColor: 'bg-blue-100 text-blue-800' }
};

const SeasonalAlertsWidget: React.FC<SeasonalAlertsWidgetProps> = ({
  limit = 5,
  enabled = true,
  compact = false
}) => {
  const { data, currentMonth, loading, error, refetch } = useSeasonalAlerts(limit, enabled);

  return (
    <DashboardWidget
      id="seasonalAlerts"
      title="Alertas de Temporada"
      icon={Calendar}
      loading={loading}
      error={error}
      onRefresh={refetch}
      compact={compact}
    >
      {data.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Sin alertas de temporada"
          description="No hay cambios próximos en temporadas de ingredientes"
        />
      ) : (
        <div className="space-y-3">
          {data.map((alert) => {
            const config = urgencyConfig[alert.urgency];
            const IconComponent = config.icon;
            
            return (
              <div
                key={alert.ingredient_id}
                className={`p-3 border rounded-lg ${config.color}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${config.badgeColor.replace('text-', 'text-').replace('bg-', 'bg-').replace('100', '200')}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{alert.name}</h4>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Stock: {alert.stock} {alert.unit}
                  </span>
                  <Badge className={config.badgeColor} size="sm">
                    {alert.alert_type === 'in_season' ? 'En temporada' :
                     alert.alert_type === 'ending_season' ? 'Termina pronto' : 'Inicia pronto'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardWidget>
  );
};

export default SeasonalAlertsWidget;