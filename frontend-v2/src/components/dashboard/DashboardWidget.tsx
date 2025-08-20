// components/dashboard/DashboardWidget.tsx
// Componente base para todos los widgets del dashboard

'use client';

import React, { ReactNode } from 'react';
import { LucideIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui';
import { LoadingCard } from '@/components/ui';

interface DashboardWidgetProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  className?: string;
  compact?: boolean;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  id,
  title,
  icon: Icon,
  children,
  loading = false,
  error = null,
  onRefresh,
  className = '',
  compact = false
}) => {
  if (loading) {
    return <LoadingCard className={className} />;
  }

  if (error) {
    return (
      <Card className={`${className} border-red-200 bg-red-50`}>
        <Card.Header className="pb-3">
          <div className="flex items-center justify-between">
            <Card.Title className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Error
            </Card.Title>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                title="Reintentar"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </Card.Header>
        <Card.Content>
          <p className="text-sm text-red-700">{error}</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className={`${className} hover:shadow-md transition-shadow duration-200`} hover>
      <Card.Header className={compact ? "pb-3" : "pb-4"}>
        <div className="flex items-center justify-between">
          <Card.Title className="flex items-center gap-2 text-gray-900">
            {Icon && <Icon className="h-5 w-5 text-orange-600" />}
            {title}
          </Card.Title>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Actualizar"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </div>
      </Card.Header>
      <Card.Content className={compact ? "pt-0" : ""}>
        {children}
      </Card.Content>
    </Card>
  );
};

export default DashboardWidget;