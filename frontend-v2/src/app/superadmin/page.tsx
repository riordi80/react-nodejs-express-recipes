'use client'

import { useEffect, useState } from 'react'
import { useSuperAdmin } from '@/context/SuperAdminContext'
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext'
import api from '@/lib/api'
import { 
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
  CogIcon
} from '@heroicons/react/24/outline'

// Importar componentes de gráficos
import MetricsGrid from '@/components/superadmin/dashboard/MetricsGrid'
import TenantGrowthChart from '@/components/superadmin/charts/TenantGrowthChart'
import RevenueChart from '@/components/superadmin/charts/RevenueChart'
import SystemHealthChart from '@/components/superadmin/charts/SystemHealthChart'
import AlertsPanel from '@/components/superadmin/dashboard/AlertsPanel'
import FinancialMetrics from '@/components/superadmin/dashboard/FinancialMetrics'

// Interfaces para los datos del dashboard
interface RecentActivity {
  type: string
  action_type: string
  performed_at: string
  target_tenant_id?: string
  target_user_id?: string
  first_name?: string
  last_name?: string
  email?: string
  tenant_name?: string
  subscription_plan?: string
}

export default function SuperAdminDashboard() {
  const { user, hasPermission } = useSuperAdmin()
  const { getThemeClasses, isDark } = useSuperAdminTheme()
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChartPeriod, setSelectedChartPeriod] = useState(30)
  const themeClasses = getThemeClasses()

  // Cargar datos de actividad reciente
  useEffect(() => {
    const fetchActivityFeed = async () => {
      try {
        setLoading(true)
        const response = await api.get('/superadmin/dashboard/activity-feed?limit=10')
        
        if (response.data.success) {
          setRecentActivity(response.data.data)
        }
      } catch {
        console.error('Fixed error in catch block')
      } finally {
        setLoading(false)
      }
    }

    fetchActivityFeed()
    
    // Actualizar cada 2 minutos
    const interval = setInterval(fetchActivityFeed, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES')
  }

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'create_tenant':
        return <ChartBarIcon className="h-5 w-5" />
      case 'suspend_tenant':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'impersonate_tenant':
        return <EyeIcon className="h-5 w-5" />
      case 'update_tenant':
        return <CogIcon className="h-5 w-5" />
      default:
        return <ClockIcon className="h-5 w-5" />
    }
  }

  const getActionColor = (actionType: string) => {
    if (isDark) {
      switch (actionType) {
        case 'create_tenant':
          return 'text-green-400 bg-green-900/30'
        case 'suspend_tenant':
          return 'text-red-400 bg-red-900/30'
        case 'update_tenant':
          return 'text-blue-400 bg-blue-900/30'
        default:
          return 'text-purple-400 bg-purple-900/30'
      }
    } else {
      switch (actionType) {
        case 'create_tenant':
          return 'text-green-600 bg-green-50'
        case 'suspend_tenant':
          return 'text-red-600 bg-red-50'
        case 'update_tenant':
          return 'text-blue-600 bg-blue-50'
        default:
          return 'text-purple-600 bg-purple-50'
      }
    }
  }

  const getActivityMessage = (activity: RecentActivity) => {
    const userName = activity.first_name && activity.last_name 
      ? `${activity.first_name} ${activity.last_name}`
      : activity.email || 'Usuario'
    
    const tenantName = activity.tenant_name || activity.target_tenant_id || 'tenant'
    
    switch (activity.action_type) {
      case 'create_tenant':
        return activity.type === 'new_tenant' 
          ? `Nuevo tenant "${tenantName}" registrado con plan ${activity.subscription_plan}`
          : `${userName} creó el tenant "${tenantName}"`
      case 'suspend_tenant':
        return `${userName} suspendió el tenant "${tenantName}"`
      case 'update_tenant':
        return `${userName} actualizó el tenant "${tenantName}"`
      case 'impersonate_tenant':
        return `${userName} accedió al panel del tenant "${tenantName}"`
      default:
        return `${userName} realizó: ${activity.action_type}`
    }
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>Dashboard SuperAdmin</h1>
          <p className={themeClasses.textSecondary}>
            Bienvenido, {user?.first_name}. Resumen del estado del sistema.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="mb-8">
          <MetricsGrid />
        </div>

        {/* Chart Period Selector */}
        <div className="mb-6 flex justify-end">
          <div className={`inline-flex rounded-lg ${themeClasses.bgSecondary} p-1`}>
            {[7, 30, 90].map((days) => (
              <button
                key={days}
                onClick={() => setSelectedChartPeriod(days)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  selectedChartPeriod === days
                    ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                    : (isDark ? 'text-slate-300 hover:text-white hover:bg-slate-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Tenant Growth Chart */}
          <div className={`rounded-lg shadow p-6 ${themeClasses.card}`}>
            <h3 className={`text-lg font-medium ${themeClasses.text} mb-4`}>
              Crecimiento de Tenants
            </h3>
            <TenantGrowthChart period={selectedChartPeriod} />
          </div>

          {/* Revenue Chart */}
          {hasPermission('manage_billing') && (
            <div className={`rounded-lg shadow p-6 ${themeClasses.card}`}>
              <h3 className={`text-lg font-medium ${themeClasses.text} mb-4`}>
                Ingresos Mensuales
              </h3>
              <RevenueChart period={12} />
            </div>
          )}

          {/* System Health Chart */}
          {hasPermission('access_monitoring') && (
            <div className={`rounded-lg shadow p-6 ${themeClasses.card}`}>
              <h3 className={`text-lg font-medium ${themeClasses.text} mb-4`}>
                Estado del Sistema
              </h3>
              <SystemHealthChart />
            </div>
          )}
        </div>

        {/* Financial Metrics Section */}
        {hasPermission('manage_billing') && (
          <div className="mb-8">
            <FinancialMetrics />
          </div>
        )}

        {/* Activity, Alerts and Quick Actions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

          {/* Recent Activity */}
          <div className={`rounded-lg shadow p-6 ${themeClasses.card}`}>
            <h3 className={`text-lg font-medium ${themeClasses.text} mb-4`}>
              Actividad Reciente
            </h3>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                    <div className="flex-1">
                      <div className={`h-4 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded w-3/4 mb-2`}></div>
                      <div className={`h-3 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded w-1/2`}></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <div key={`${activity.performed_at}-${index}`} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 p-2 rounded-full ${getActionColor(activity.action_type)}`}>
                      {getActivityIcon(activity.action_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${themeClasses.text}`}>
                        {getActivityMessage(activity)}
                      </p>
                      <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                        {formatDate(activity.performed_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className={`text-center py-8 ${themeClasses.textSecondary}`}>
                    <ClockIcon className="h-8 w-8 mx-auto mb-2" />
                    <p>No hay actividad reciente</p>
                  </div>
                )}
              </div>
            )}
            <div className={`mt-4 pt-4 border-t ${themeClasses.border}`}>
              <button className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors`}>
                Ver toda la actividad →
              </button>
            </div>
          </div>

          {/* System Alerts */}
          {hasPermission('access_monitoring') && (
            <div className={`rounded-lg shadow p-6 ${themeClasses.card}`}>
              <AlertsPanel />
            </div>
          )}

          {/* Quick Actions */}
          <div className={`rounded-lg shadow p-6 ${themeClasses.card}`}>
            <h3 className={`text-lg font-medium ${themeClasses.text} mb-4`}>Acciones Rápidas</h3>
            <div className="grid grid-cols-1 gap-3">
              {hasPermission('manage_tenants') && (
                <button className={`p-3 border ${themeClasses.border} rounded-lg ${themeClasses.buttonHover} text-left transition-all duration-200 hover:shadow-md flex items-center space-x-3`}>
                  <ChartBarIcon className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className={`font-medium ${themeClasses.text} text-sm`}>Gestionar Tenants</h4>
                    <p className={`text-xs ${themeClasses.textSecondary}`}>Ver y administrar restaurantes</p>
                  </div>
                </button>
              )}
              
              {hasPermission('manage_superadmins') && (
                <button className={`p-3 border ${themeClasses.border} rounded-lg ${themeClasses.buttonHover} text-left transition-all duration-200 hover:shadow-md flex items-center space-x-3`}>
                  <CogIcon className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className={`font-medium ${themeClasses.text} text-sm`}>Gestionar Usuarios</h4>
                    <p className={`text-xs ${themeClasses.textSecondary}`}>Administrar SuperAdmins</p>
                  </div>
                </button>
              )}
              
              {hasPermission('access_monitoring') && (
                <button className={`p-3 border ${themeClasses.border} rounded-lg ${themeClasses.buttonHover} text-left transition-all duration-200 hover:shadow-md flex items-center space-x-3`}>
                  <ExclamationTriangleIcon className="h-5 w-5 text-purple-600" />
                  <div>
                    <h4 className={`font-medium ${themeClasses.text} text-sm`}>Monitoreo</h4>
                    <p className={`text-xs ${themeClasses.textSecondary}`}>Estado del sistema</p>
                  </div>
                </button>
              )}
              
              {hasPermission('manage_billing') && (
                <button className={`p-3 border ${themeClasses.border} rounded-lg ${themeClasses.buttonHover} text-left transition-all duration-200 hover:shadow-md flex items-center space-x-3`}>
                  <ChartBarIcon className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h4 className={`font-medium ${themeClasses.text} text-sm`}>Facturación</h4>
                    <p className={`text-xs ${themeClasses.textSecondary}`}>Ingresos y suscripciones</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}