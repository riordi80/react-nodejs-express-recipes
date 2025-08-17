'use client'

import { useEffect, useState } from 'react'
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext'
import { useSuperAdmin } from '@/context/SuperAdminContext'
import { 
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface DashboardMetrics {
  tenants: {
    total_tenants: number
    active_tenants: number
    trial_tenants: number
    suspended_tenants: number
    cancelled_tenants: number
    new_today: number
  }
  revenue: {
    mrr: number
    arr: number
    paying_tenants: number
  }
  system: {
    total_api_calls?: number
    avg_response_time_ms?: number
    total_database_size_mb?: number
  }
  alerts: {
    critical_alerts: number
  }
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down'
  }
  loading?: boolean
}

function MetricCard({ title, value, subtitle, icon: Icon, color, trend, loading = false }: MetricCardProps) {
  const { getThemeClasses, isDark } = useSuperAdminTheme()
  const themeClasses = getThemeClasses()

  const colorClasses = {
    blue: {
      icon: 'text-blue-600',
      bg: isDark ? 'bg-blue-600/10' : 'bg-blue-50',
      trend: isDark ? 'text-blue-400' : 'text-blue-600'
    },
    green: {
      icon: 'text-green-600',
      bg: isDark ? 'bg-green-600/10' : 'bg-green-50',
      trend: isDark ? 'text-green-400' : 'text-green-600'
    },
    yellow: {
      icon: 'text-yellow-600',
      bg: isDark ? 'bg-yellow-600/10' : 'bg-yellow-50',
      trend: isDark ? 'text-yellow-400' : 'text-yellow-600'
    },
    red: {
      icon: 'text-red-600',
      bg: isDark ? 'bg-red-600/10' : 'bg-red-50',
      trend: isDark ? 'text-red-400' : 'text-red-600'
    },
    purple: {
      icon: 'text-purple-600',
      bg: isDark ? 'bg-purple-600/10' : 'bg-purple-50',
      trend: isDark ? 'text-purple-400' : 'text-purple-600'
    },
    indigo: {
      icon: 'text-indigo-600',
      bg: isDark ? 'bg-indigo-600/10' : 'bg-indigo-50',
      trend: isDark ? 'text-indigo-400' : 'text-indigo-600'
    }
  }

  if (loading) {
    return (
      <div className={`${themeClasses.card} rounded-lg shadow p-6`}>
        <div className="animate-pulse">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
            <div className="ml-4 flex-1">
              <div className={`h-4 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded w-3/4 mb-2`}></div>
              <div className={`h-6 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded w-1/2`}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`${themeClasses.card} rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color].bg}`}>
          <Icon className={`h-6 w-6 ${colorClasses[color].icon}`} />
        </div>
        <div className="ml-4 flex-1">
          <dt className={`text-sm font-medium ${themeClasses.textSecondary} truncate`}>
            {title}
          </dt>
          <dd className={`text-2xl font-bold ${themeClasses.text} mt-1`}>
            {typeof value === 'number' ? value.toLocaleString('es-ES') : value}
          </dd>
          {subtitle && (
            <div className={`text-sm ${themeClasses.textSecondary} mt-1`}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center">
          <div className={`flex items-center text-sm ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.direction === 'up' ? (
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
            )}
            <span className="font-medium">
              {trend.direction === 'up' ? '+' : ''}{trend.value}%
            </span>
          </div>
          <span className={`ml-2 text-sm ${themeClasses.textSecondary}`}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  )
}

export default function MetricsGrid() {
  const { hasPermission } = useSuperAdmin()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Temporalmente usar datos mock hasta que los endpoints estén listos
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simular delay
        
        const mockData: DashboardMetrics = {
          tenants: {
            total_tenants: 127,
            active_tenants: 119,
            trial_tenants: 5,
            suspended_tenants: 3,
            cancelled_tenants: 0,
            new_today: 2
          },
          revenue: {
            mrr: 24750,
            arr: 297000,
            paying_tenants: 119
          },
          system: {
            total_api_calls: 45000,
            avg_response_time_ms: 145,
            total_database_size_mb: 2048
          },
          alerts: {
            critical_alerts: 1
          }
        }
        
        setMetrics(mockData)
        
        // TODO: Cuando los endpoints estén listos, descomentar esta línea:
        // const response = await api.get('/superadmin/dashboard/metrics')
        // if (response.data.success) {
        //   setMetrics(response.data.data)
        // } else {
        //   setError('Error al cargar métricas')
        // }
        
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err)
        setError('Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    
    // Actualizar métricas cada 5 minutos
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (error) {
    return (
      <div className="col-span-full p-6 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-2" />
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Tenants */}
      <MetricCard
        title="Total Tenants"
        value={metrics?.tenants.total_tenants || 0}
        subtitle={`${metrics?.tenants.active_tenants || 0} activos, ${metrics?.tenants.suspended_tenants || 0} suspendidos`}
        icon={BuildingOfficeIcon}
        color="blue"
        trend={{
          value: 12.5,
          label: 'este mes',
          direction: 'up'
        }}
        loading={loading}
      />

      {/* New Tenants Today */}
      <MetricCard
        title="Nuevos Hoy"
        value={metrics?.tenants.new_today || 0}
        subtitle={`${metrics?.tenants.trial_tenants || 0} en trial`}
        icon={ArrowTrendingUpIcon}
        color="green"
        trend={{
          value: 8.2,
          label: 'vs ayer',
          direction: 'up'
        }}
        loading={loading}
      />

      {/* Monthly Recurring Revenue */}
      {hasPermission('manage_billing') && (
        <MetricCard
          title="MRR"
          value={formatCurrency(metrics?.revenue.mrr || 0)}
          subtitle={`${metrics?.revenue.paying_tenants || 0} clientes de pago`}
          icon={CurrencyDollarIcon}
          color="yellow"
          trend={{
            value: 15.3,
            label: 'vs mes anterior',
            direction: 'up'
          }}
          loading={loading}
        />
      )}

      {/* Annual Recurring Revenue */}
      {hasPermission('manage_billing') && (
        <MetricCard
          title="ARR"
          value={formatCurrency(metrics?.revenue.arr || 0)}
          subtitle="Ingresos anuales proyectados"
          icon={ChartBarIcon}
          color="purple"
          trend={{
            value: 22.1,
            label: 'crecimiento anual',
            direction: 'up'
          }}
          loading={loading}
        />
      )}

      {/* System Performance */}
      {hasPermission('access_monitoring') && (
        <MetricCard
          title="Tiempo Respuesta"
          value={`${Math.round(metrics?.system.avg_response_time_ms || 0)}ms`}
          subtitle="Promedio API"
          icon={ClockIcon}
          color="indigo"
          trend={{
            value: 5.2,
            label: 'mejora esta semana',
            direction: 'down'
          }}
          loading={loading}
        />
      )}

      {/* Critical Alerts */}
      {hasPermission('access_monitoring') && (
        <MetricCard
          title="Alertas Críticas"
          value={metrics?.alerts.critical_alerts || 0}
          subtitle="Últimos 7 días"
          icon={ExclamationTriangleIcon}
          color={metrics?.alerts.critical_alerts && metrics.alerts.critical_alerts > 0 ? 'red' : 'green'}
          loading={loading}
        />
      )}

      {/* Database Size */}
      {hasPermission('access_monitoring') && (
        <MetricCard
          title="Tamaño BD"
          value={`${Math.round((metrics?.system.total_database_size_mb || 0) / 1024)}GB`}
          subtitle="Total todas las bases"
          icon={ChartBarIcon}
          color="blue"
          trend={{
            value: 3.8,
            label: 'crecimiento mensual',
            direction: 'up'
          }}
          loading={loading}
        />
      )}

      {/* API Calls */}
      {hasPermission('access_monitoring') && (
        <MetricCard
          title="Llamadas API"
          value={`${Math.round((metrics?.system.total_api_calls || 0) / 1000)}K`}
          subtitle="Hoy"
          icon={ChartBarIcon}
          color="green"
          trend={{
            value: 18.4,
            label: 'vs ayer',
            direction: 'up'
          }}
          loading={loading}
        />
      )}
    </div>
  )
}