// components/dashboard/widgets/PendingOrdersWidget.tsx
// Widget para pedidos pendientes

'use client';

import React from 'react';
import { Truck, Calendar, Euro, Package } from 'lucide-react';
import DashboardWidget from '../DashboardWidget';
import { usePendingOrders } from '@/hooks/useDashboardWidgets';
import { Badge, EmptyState } from '@/components/ui';

interface PendingOrdersWidgetProps {
  limit?: number;
  enabled?: boolean;
  compact?: boolean;
}

// Mapeo de estados de pedidos
const statusConfig = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
  ordered: { color: 'bg-blue-100 text-blue-800', label: 'Pedido' },
  shipped: { color: 'bg-purple-100 text-purple-800', label: 'Enviado' },
  delivered: { color: 'bg-green-100 text-green-800', label: 'Entregado' },
  cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelado' }
};

const PendingOrdersWidget: React.FC<PendingOrdersWidgetProps> = ({
  limit = 5,
  enabled = true,
  compact = false
}) => {
  const { data, loading, error, refetch } = usePendingOrders(limit, enabled);

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: undefined
    }).format(new Date(dateString));
  };

  const getUrgency = (deliveryDate?: string) => {
    if (!deliveryDate) return null;
    
    const delivery = new Date(deliveryDate);
    const now = new Date();
    const diffTime = delivery.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 2) return 'urgent';
    if (diffDays <= 7) return 'soon';
    return 'normal';
  };

  const getUrgencyColor = (urgency: string | null) => {
    switch (urgency) {
      case 'overdue': return 'border-red-300 bg-red-50';
      case 'urgent': return 'border-orange-300 bg-orange-50';
      case 'soon': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <DashboardWidget
      id="pendingOrders"
      title="Pedidos Pendientes"
      icon={Truck}
      loading={loading}
      error={error}
      onRefresh={refetch}
      compact={compact}
    >
      {data.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Sin pedidos pendientes"
          description="Todos los pedidos están al día"
        />
      ) : (
        <div className="space-y-3">
          {data.map((order) => {
            const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
            const urgency = getUrgency(order.delivery_date);
            const urgencyColor = getUrgencyColor(urgency);
            
            return (
              <div
                key={order.order_id}
                className={`p-3 border rounded-lg transition-colors ${urgencyColor}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900 truncate">
                      {order.supplier_name}
                    </h4>
                    <p className="text-xs text-gray-600">
                      Pedido #{order.order_id}
                    </p>
                  </div>
                  <Badge className={statusInfo.color} size="sm">
                    {statusInfo.label}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>Pedido: {formatDate(order.order_date)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Euro className="h-3 w-3" />
                      <span className="font-medium">
                        {typeof order.total_amount === 'number' ? order.total_amount.toLocaleString('es-ES') : '0'}€
                      </span>
                    </div>
                  </div>
                  
                  {order.delivery_date && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Package className="h-3 w-3" />
                        <span>Entrega: {formatDate(order.delivery_date)}</span>
                      </div>
                      
                      {urgency === 'overdue' && (
                        <Badge variant="danger" size="sm">Atrasado</Badge>
                      )}
                      {urgency === 'urgent' && (
                        <Badge variant="warning" size="sm">Urgente</Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    {order.items_count} artículo{order.items_count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            );
          })}
          
          {!compact && data.length > 0 && (
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                {data.length} pedidos pendientes
              </p>
            </div>
          )}
        </div>
      )}
    </DashboardWidget>
  );
};

export default PendingOrdersWidget;