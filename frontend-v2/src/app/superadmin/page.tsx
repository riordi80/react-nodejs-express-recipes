'use client'

import { useEffect, useState } from 'react'
import { useSuperAdmin } from '@/context/SuperAdminContext'
import { 
  UsersIcon, 
  BuildingOfficeIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

// Interfaces para los datos del dashboard
interface DashboardMetrics {
  totalTenants: number
  activeTenants: number
  suspendedTenants: number
  totalUsers: number
  monthlyRevenue: number
  yearlyRevenue: number
  systemHealth: string
  lastBackup: string
}

interface RecentActivity {
  id: number
  type: 'tenant_created' | 'tenant_suspended' | 'payment_received' | 'system_alert'
  message: string
  timestamp: string
  severity?: 'info' | 'warning' | 'error' | 'success'
}

export default function SuperAdminDashboard() {
  const { user, hasPermission } = useSuperAdmin()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  // Simulación de datos - en producción vendría de la API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data
      setMetrics({
        totalTenants: 127,
        activeTenants: 119,
        suspendedTenants: 8,
        totalUsers: 1456,
        monthlyRevenue: 15750.00,
        yearlyRevenue: 189000.00,
        systemHealth: 'good',
        lastBackup: '2024-01-15T02:30:00Z'
      })

      setRecentActivity([
        {
          id: 1,
          type: 'tenant_created',
          message: 'Nuevo tenant "restaurant-nueva-cocina" creado exitosamente',
          timestamp: '2024-01-15T10:30:00Z',
          severity: 'success'
        },
        {
          id: 2,
          type: 'payment_received',
          message: 'Pago recibido de $89.99 del tenant "restaurant-abc"',
          timestamp: '2024-01-15T09:15:00Z',
          severity: 'success'
        },
        {
          id: 3,
          type: 'tenant_suspended',
          message: 'Tenant "restaurant-moroso" suspendido por falta de pago',
          timestamp: '2024-01-15T08:45:00Z',
          severity: 'warning'
        },
        {
          id: 4,
          type: 'system_alert',
          message: 'Alta carga en el servidor DB-02, revisión recomendada',
          timestamp: '2024-01-15T07:20:00Z',
          severity: 'warning'
        }
      ])
      
      setLoading(false)
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-300 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES')
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'tenant_created':
        return <BuildingOfficeIcon className="h-5 w-5" />
      case 'payment_received':
        return <CurrencyDollarIcon className="h-5 w-5" />
      case 'tenant_suspended':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'system_alert':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      default:
        return <ClockIcon className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      case 'error':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-blue-600 bg-blue-50'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard SuperAdmin</h1>
        <p className="text-gray-600 mt-1">
          Bienvenido, {user?.first_name}. Resumen del estado del sistema.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tenants */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Tenants
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {metrics?.totalTenants}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm">
              <span className="text-green-600 font-medium">
                {metrics?.activeTenants} activos
              </span>
              <span className="text-gray-500 ml-2">
                / {metrics?.suspendedTenants} suspendidos
              </span>
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UsersIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Usuarios
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {metrics?.totalUsers}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-green-600">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              <span>+12% este mes</span>
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        {hasPermission('view_billing') && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ingresos Mensuales
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(metrics?.monthlyRevenue || 0)}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-green-600">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                <span>+8.2% vs mes anterior</span>
              </div>
            </div>
          </div>
        )}

        {/* System Health */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {metrics?.systemHealth === 'good' ? (
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              )}
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Estado del Sistema
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {metrics?.systemHealth === 'good' ? 'Funcionando' : 'Problemas'}
                </dd>
              </dl>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-500">
              Último backup: {formatDate(metrics?.lastBackup || '')}
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart Placeholder */}
        {hasPermission('view_metrics') && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ingresos por Mes
            </h3>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-2" />
                <p>Gráfico de ingresos</p>
                <p className="text-sm">(Implementar con Chart.js)</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Actividad Reciente
          </h3>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`flex-shrink-0 p-2 rounded-full ${getSeverityColor(activity.severity)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button className="text-sm text-blue-600 hover:text-blue-500">
              Ver toda la actividad →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hasPermission('manage_tenants') && (
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <BuildingOfficeIcon className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="font-medium text-gray-900">Crear Tenant</h4>
              <p className="text-sm text-gray-500">Nuevo restaurante</p>
            </button>
          )}
          
          {hasPermission('manage_users') && (
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <UsersIcon className="h-6 w-6 text-green-600 mb-2" />
              <h4 className="font-medium text-gray-900">Gestionar Usuarios</h4>
              <p className="text-sm text-gray-500">Administrar accesos</p>
            </button>
          )}
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <ChartBarIcon className="h-6 w-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">Ver Métricas</h4>
            <p className="text-sm text-gray-500">Analíticas detalladas</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mb-2" />
            <h4 className="font-medium text-gray-900">Estado Sistema</h4>
            <p className="text-sm text-gray-500">Monitoreo en vivo</p>
          </button>
        </div>
      </div>
    </div>
  )
}