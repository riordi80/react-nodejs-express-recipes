// components/dashboard/widgets/EventsWithMenusWidget.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ChefHat, Users } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';
import { useEventsWithMenus } from '@/hooks/useDashboardWidgets';
import { Badge, EmptyState } from '@/components/ui';

interface EventsWithMenusWidgetProps {
  limit?: number;
  enabled?: boolean;
  compact?: boolean;
}

const EventsWithMenusWidget: React.FC<EventsWithMenusWidgetProps> = ({
  limit = 5,
  enabled = true,
  compact = false
}) => {
  const { data, loading, error, refetch } = useEventsWithMenus(limit, enabled);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      weekday: 'short'
    }).format(new Date(dateString));
  };

  return (
    <DashboardWidget
      id="eventsWithMenus"
      title="Eventos con Menús"
      icon={Calendar}
      loading={loading}
      error={error}
      onRefresh={refetch}
      compact={compact}
    >
      {data.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Sin eventos con menús"
          description="No hay eventos próximos con menús asignados"
        />
      ) : (
        <div className="space-y-3">
          {data.map((event) => (
            <Link
              key={event.event_id}
              href={`/events/${event.event_id}`}
              className="block p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900 hover:text-orange-600 transition-colors">{event.event_name}</h4>
                  <p className="text-sm text-gray-600 flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(event.event_date)}</span>
                    <Users className="h-3 w-3 ml-2" />
                    <span>{event.guests_count} pers.</span>
                  </p>
                </div>
                <Badge variant="success" size="sm">
                  Menú listo
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center space-x-2 mb-2">
                  <ChefHat className="h-3 w-3 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {event.menu_items.length} platos preparados
                  </span>
                </div>
                
                <div className="grid grid-cols-1 gap-1">
                  {event.menu_items.slice(0, compact ? 2 : 3).map((item, index) => (
                    <div key={index} className="text-xs text-gray-600 flex justify-between">
                      <span>{item.recipe_name}</span>
                      <span>{item.portions} porc.</span>
                    </div>
                  ))}
                  
                  {event.menu_items.length > (compact ? 2 : 3) && (
                    <div className="text-xs text-gray-500">
                      Y {event.menu_items.length - (compact ? 2 : 3)} platos más...
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardWidget>
  );
};

export default EventsWithMenusWidget;