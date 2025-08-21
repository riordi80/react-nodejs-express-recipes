'use client'

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'
import { LayoutDashboard, BookOpen, Package, Users, Calendar, Clock, Plus, Settings } from 'lucide-react'
import Link from 'next/link'
import { useDashboardConfig } from '@/hooks/useDashboardConfig';
import { useDashboardSummary } from '@/hooks/useDashboardWidgets';
import DynamicWidget from '@/components/dashboard/DynamicWidget';
import BentoGrid from '@/components/dashboard/BentoGrid';
import { EmptyState, LoadingCard } from '@/components/ui';

export default function DashboardPage() {
  const { user } = useAuth();
  const { 
    enabledWidgets, 
    displaySettings, 
    loading: configLoading 
  } = useDashboardConfig();
  
  const { 
    data: summaryData, 
    loading: summaryLoading, 
    error: summaryError,
    refetch: refetchSummary 
  } = useDashboardSummary(true);

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (!displaySettings.autoRefresh) return;

    const intervalMs = parseInt(displaySettings.refreshInterval) * 1000;
    const interval = setInterval(() => {
      refetchSummary();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [displaySettings.autoRefresh, displaySettings.refreshInterval, refetchSummary]);

  // Stats dinámicas desde el resumen - evitar parpadeo manteniendo valores previos
  const stats = [
    {
      name: 'Total Recetas',
      value: summaryData?.totalRecipes?.toString() || (summaryLoading ? '...' : '0'),
      icon: BookOpen
    },
    {
      name: 'Ingredientes',
      value: summaryData?.totalIngredients?.toString() || (summaryLoading ? '...' : '0'),
      icon: Package
    },
    {
      name: 'Proveedores',
      value: summaryData?.totalSuppliers?.toString() || (summaryLoading ? '...' : '0'),
      icon: Users
    },
    {
      name: 'Eventos',
      value: summaryData?.totalEvents?.toString() || (summaryLoading ? '...' : '0'),
      icon: Calendar
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <LayoutDashboard className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Bienvenido de vuelta, {user?.first_name}. Aquí tienes un resumen de tu sistema de gestión de recetas.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <stat.icon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {configLoading ? (
        <div className="mb-8">
          <BentoGrid>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <LoadingCard key={i} />
            ))}
          </BentoGrid>
        </div>
      ) : enabledWidgets.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={LayoutDashboard}
            title="Dashboard sin configurar"
            description="No tienes widgets habilitados. Ve a Configuración → Dashboard para activar widgets."
            action={{
              label: 'Configurar Dashboard',
              onClick: () => window.location.href = '/settings',
              variant: 'primary'
            }}
          />
        </div>
      ) : (
        <>
          {/* Dynamic Widgets Bento Layout */}
          <div className="mb-8">
            <BentoGrid>
              {enabledWidgets.map((widget) => (
                <DynamicWidget
                  key={widget.id}
                  widget={widget}
                  itemsPerWidget={displaySettings.itemsPerWidget}
                  compact={false}
                />
              ))}
            </BentoGrid>
          </div>

          {/* Quick Actions - Solo si hay espacio después de widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Plus className="h-5 w-5 text-orange-600" />
                  </div>
                  Acciones Rápidas
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Link href="/recipes/new" className="flex flex-col items-center justify-center text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">Nueva Receta</span>
                  </Link>
                  <Link href="/ingredients/new" className="flex flex-col items-center justify-center text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Package className="h-8 w-8 text-green-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">Añadir Ingrediente</span>
                  </Link>
                  <Link href="/suppliers/new" className="flex flex-col items-center justify-center text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Users className="h-8 w-8 text-purple-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">Nuevo Proveedor</span>
                  </Link>
                  <Link href="/events/new" className="flex flex-col items-center justify-center text-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Calendar className="h-8 w-8 text-orange-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900">Crear Evento</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Info sobre configuración */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <LayoutDashboard className="h-6 w-6 text-orange-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-orange-900 mb-2">
                    Dashboard Personalizado
                  </h3>
                  <p className="text-sm text-orange-800 mb-4">
                    Tienes {enabledWidgets.length} widgets activos. Personaliza tu dashboard en cualquier momento.
                  </p>
                  <div className="space-y-2 text-sm text-orange-700">
                    <div>• Auto-refresh: {displaySettings.autoRefresh ? `Cada ${displaySettings.refreshInterval}s` : 'Desactivado'}</div>
                    <div>• Elementos por widget: {displaySettings.itemsPerWidget}</div>
                  </div>
                  <div className="mt-4">
                    <Link
                      href="/settings"
                      className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar widgets
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}