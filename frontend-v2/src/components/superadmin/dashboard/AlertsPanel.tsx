'use client'

import { useEffect, useState } from 'react'
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext'
import { 
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline'

interface SystemAlert {
  alert_id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  title: string
  message: string
  created_at: string
  resolved_at?: string
  affected_tenants?: string[]
  action_required?: boolean
}

interface AlertsPanelProps {
  className?: string
}

export default function AlertsPanel({ className = '' }: AlertsPanelProps) {
  const { getThemeClasses, isDark } = useSuperAdminTheme()
  const themeClasses = getThemeClasses()
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'unresolved'>('unresolved')

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true)
        
        // Simular datos de alertas - en producción vendría de la API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const mockAlerts: SystemAlert[] = [
          {
            alert_id: '1',
            type: 'critical',
            title: 'Alto uso de CPU en servidor principal',
            message: 'El servidor DB-01 está experimentando un uso de CPU del 89% durante los últimos 15 minutos.',
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
            action_required: true,
            affected_tenants: ['tenant-restaurant-abc', 'tenant-pizzeria-roma']
          },
          {
            alert_id: '2',
            type: 'warning',
            title: 'Tenant con pagos pendientes',
            message: 'El tenant "restaurant-moroso" tiene 3 intentos de pago fallidos.',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            action_required: true,
            affected_tenants: ['tenant-restaurant-moroso']
          },
          {
            alert_id: '3',
            type: 'info',
            title: 'Backup programado completado',
            message: 'El backup diario de todas las bases de datos se completó exitosamente.',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
            resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          },
          {
            alert_id: '4',
            type: 'warning',
            title: 'Límite de almacenamiento próximo',
            message: 'El almacenamiento total está al 82% de capacidad. Considerar expansión.',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
          },
          {
            alert_id: '5',
            type: 'success',
            title: 'Actualización del sistema completada',
            message: 'La actualización de seguridad v2.1.4 se instaló correctamente en todos los servidores.',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            resolved_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          }
        ]
        
        setAlerts(mockAlerts)
      } catch {
        console.error('Fixed error in catch block')
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
    
    // Actualizar alertas cada 30 segundos
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'warning':
        return <ExclamationCircleIcon className="h-5 w-5" />
      case 'info':
        return <InformationCircleIcon className="h-5 w-5" />
      case 'success':
        return <CheckCircleIcon className="h-5 w-5" />
      default:
        return <BellIcon className="h-5 w-5" />
    }
  }

  const getAlertColor = (type: string) => {
    if (isDark) {
      switch (type) {
        case 'critical':
          return 'text-red-400 bg-red-900/30 border-red-600/30'
        case 'warning':
          return 'text-yellow-400 bg-yellow-900/30 border-yellow-600/30'
        case 'info':
          return 'text-blue-400 bg-blue-900/30 border-blue-600/30'
        case 'success':
          return 'text-green-400 bg-green-900/30 border-green-600/30'
        default:
          return 'text-gray-400 bg-gray-900/30 border-gray-600/30'
      }
    } else {
      switch (type) {
        case 'critical':
          return 'text-red-600 bg-red-50 border-red-200'
        case 'warning':
          return 'text-yellow-600 bg-yellow-50 border-yellow-200'
        case 'info':
          return 'text-blue-600 bg-blue-50 border-blue-200'
        case 'success':
          return 'text-green-600 bg-green-50 border-green-200'
        default:
          return 'text-gray-600 bg-gray-50 border-gray-200'
      }
    }
  }

  const formatDate = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `hace ${diffInMinutes} min`
    } else if (diffInMinutes < 1440) { // 24 hours
      return `hace ${Math.floor(diffInMinutes / 60)} h`
    } else {
      return `hace ${Math.floor(diffInMinutes / 1440)} d`
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    switch (filter) {
      case 'critical':
        return alert.type === 'critical'
      case 'warning':
        return alert.type === 'warning'
      case 'unresolved':
        return !alert.resolved_at
      default:
        return true
    }
  })

  const resolveAlert = async (alertId: string) => {
    try {
      // En producción haría la llamada a la API
      setAlerts(prev => prev.map(alert => 
        alert.alert_id === alertId 
          ? { ...alert, resolved_at: new Date().toISOString() }
          : alert
      ))
    } catch {
      console.error('Fixed error in catch block')
    }
  }

  const criticalCount = alerts.filter(a => a.type === 'critical' && !a.resolved_at).length
  const warningCount = alerts.filter(a => a.type === 'warning' && !a.resolved_at).length
  const unresolvedCount = alerts.filter(a => !a.resolved_at).length

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className={`h-64 ${isDark ? 'bg-slate-700' : 'bg-gray-200'} rounded-lg`}></div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header con contadores */}
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-medium ${themeClasses.text}`}>
          Alertas del Sistema
        </h3>
        <div className="flex items-center space-x-4">
          {criticalCount > 0 && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className={`text-sm ${themeClasses.textSecondary}`}>
                {criticalCount} críticas
              </span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
              <span className={`text-sm ${themeClasses.textSecondary}`}>
                {warningCount} advertencias
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className={`flex space-x-2 mb-4 p-1 rounded-lg ${themeClasses.bgSecondary}`}>
        {[
          { key: 'unresolved', label: `Sin resolver (${unresolvedCount})` },
          { key: 'all', label: 'Todas' },
          { key: 'critical', label: 'Críticas' },
          { key: 'warning', label: 'Advertencias' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              filter === key
                ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                : (isDark ? 'text-slate-300 hover:text-white hover:bg-slate-600' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de alertas */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map(alert => (
            <div
              key={alert.alert_id}
              className={`p-4 rounded-lg border ${getAlertColor(alert.type)} ${
                alert.resolved_at ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-current">
                        {alert.title}
                      </h4>
                      {alert.action_required && !alert.resolved_at && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Acción requerida
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-1 opacity-90">
                      {alert.message}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-75">
                        {formatDate(alert.created_at)}
                        {alert.resolved_at && ' • Resuelto'}
                      </span>
                      {alert.affected_tenants && alert.affected_tenants.length > 0 && (
                        <span className="text-xs opacity-75">
                          {alert.affected_tenants.length} tenant(s) afectado(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {!alert.resolved_at && (
                  <button
                    onClick={() => resolveAlert(alert.alert_id)}
                    className={`ml-4 p-1 rounded ${isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-200'} transition-colors`}
                    title="Marcar como resuelto"
                  >
                    <XMarkIcon className="h-4 w-4 opacity-60 hover:opacity-100" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className={`text-center py-8 ${themeClasses.textSecondary}`}>
            <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>No hay alertas que mostrar</p>
            {filter === 'unresolved' && (
              <p className="text-sm mt-1">¡Todo está funcionando correctamente!</p>
            )}
          </div>
        )}
      </div>

      {/* Footer con indicador de tiempo real */}
      <div className={`mt-4 pt-4 border-t ${themeClasses.border}`}>
        <div className="flex items-center justify-center space-x-2 text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className={themeClasses.textSecondary}>Monitoreando en tiempo real</span>
        </div>
      </div>
    </div>
  )
}