// components/dashboard/widgets/UpcomingEventsWidget.tsx
// Widget para próximos eventos

'use client';

import React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';
import { useUpcomingEvents } from '@/hooks/useDashboardWidgets';
import { Badge, EmptyState } from '@/components/ui';

interface UpcomingEventsWidgetProps {
  limit?: number;
  period?: 'week' | 'month';
  enabled?: boolean;
  compact?: boolean;
}

// Mapeo de estados a colores y labels
const statusConfig = {
  planned: { color: 'bg-blue-100 text-blue-800', label: 'Planificado' },
  confirmed: { color: 'bg-green-100 text-green-800', label: 'Confirmado' },
  in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'En Progreso' },
  completed: { color: 'bg-gray-100 text-gray-800', label: 'Completado' },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelado' }
};

const UpcomingEventsWidget: React.FC<UpcomingEventsWidgetProps> = ({
  limit = 5,
  period = 'week',
  enabled = true,
  compact = false
}) => {
  const { data, loading, error, refetch } = useUpcomingEvents(limit, period, enabled);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: undefined
    }).format(new Date(dateString));
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return null;
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(`2000-01-01 ${timeString}`));
  };

  return (
    <DashboardWidget
      id="upcomingEvents"
      title="Próximos Eventos"
      icon={Calendar}
      loading={loading}
      error={error}
      onRefresh={refetch}
      compact={compact}
    >
      {data.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Sin eventos próximos"
          description={`No hay eventos programados para esta ${period === 'week' ? 'semana' : 'mes'}`}
        />
      ) : (
        <div className="space-y-3">
          {data.map((event) => {
            const statusInfo = statusConfig[event.status] || statusConfig.planned;
            
            return (
              <div
                key={event.event_id}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate mr-2">
                    {event.name}
                  </h4>
                  <Badge className={statusInfo.color} size="sm">
                    {statusInfo.label}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDate(event.event_date)}
                      {event.event_time && ` - ${formatTime(event.event_time)}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Users className="h-3 w-3" />
                    <span>{event.guests_count} invitados</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                  
                  {event.budget && typeof event.budget === 'number' && (
                    <div className="text-right">
                      <span className="font-medium text-orange-600">
                        {event.budget.toLocaleString('es-ES')}€
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {!compact && data.length > 0 && (
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {data.length} eventos esta {period === 'week' ? 'semana' : 'mes'}
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardWidget>
  );
};

export default UpcomingEventsWidget;