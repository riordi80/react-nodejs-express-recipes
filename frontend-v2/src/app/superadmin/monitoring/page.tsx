'use client';

import { useState, useEffect } from 'react';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';
import api from '@/lib/api';
import { 
  CpuChipIcon,
  CircleStackIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ShieldExclamationIcon,
  BuildingOfficeIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

// Interfaces
interface SystemHealth {
  database: {
    total_connections: number;
    mysql_version: string;
    sizes: Array<{
      database_name: string;
      size_mb: number;
    }>;
    status: string;
  };
  system: {
    uptime: number;
    cpu_usage: number;
    memory_usage: number;
    memory_total_gb: number;
    memory_free_gb: number;
    node_version: string;
    platform: string;
    arch: string;
  };
  node: {
    memory: {
      rss_mb: number;
      heap_used_mb: number;
      heap_total_mb: number;
      external_mb: number;
    };
    uptime_hours: number;
  };
  status: {
    overall: string;
    warnings: string[];
    errors: string[];
  };
  timestamp: string;
}

interface Alert {
  alert_id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  action_required: boolean;
  affected_tenants: string[];
}

interface TenantHealth {
  tenant_id: number;
  subdomain: string;
  business_name: string;
  subscription_status: string;
  health_status: string;
  warnings: string[];
  metrics: {
    tables: number;
    active_users: number;
    recipes: number;
    db_size_mb: number;
    last_activity: string | null;
  } | null;
  error?: string;
}

interface SecurityEvent {
  event_id: string;
  event_type: string;
  severity: string;
  ip_address: string;
  user_agent: string;
  email_attempted: string | null;
  tenant_subdomain: string | null;
  timestamp: string;
  details: string;
}

export default function MonitoringPage() {
  const { user, loading: authLoading } = useSuperAdmin();
  const { getThemeClasses, isDark } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();
  
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tenantsHealth, setTenantsHealth] = useState<TenantHealth[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Cargar datos iniciales
  useEffect(() => {
    if (!authLoading && user) {
      loadAllData();
    }
  }, [authLoading, user]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadAllData = async () => {
    try {
      await Promise.all([
        loadSystemHealth(),
        loadAlerts(),
        loadTenantsHealth(),
        loadSecurityEvents()
      ]);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemHealth = async () => {
    try {
      const response = await api.get('/superadmin/monitoring/system-health');
      if (response.data.success) {
        setSystemHealth(response.data.data);
      }
    } catch (error) {
      console.error('Error loading system health:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await api.get('/superadmin/monitoring/alerts');
      if (response.data.success) {
        setAlerts(response.data.data);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadTenantsHealth = async () => {
    try {
      const response = await api.get('/superadmin/monitoring/tenants-health');
      if (response.data.success) {
        setTenantsHealth(response.data.data.tenants);
      }
    } catch (error) {
      console.error('Error loading tenants health:', error);
    }
  };

  const loadSecurityEvents = async () => {
    try {
      const response = await api.get('/superadmin/monitoring/security-events?limit=10');
      if (response.data.success) {
        setSecurityEvents(response.data.data.events);
      }
    } catch (error) {
      console.error('Error loading security events:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return isDark ? 'text-green-400' : 'text-green-600';
      case 'warning':
        return isDark ? 'text-yellow-400' : 'text-yellow-600';
      case 'critical':
      case 'error':
        return isDark ? 'text-red-400' : 'text-red-600';
      default:
        return isDark ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'critical':
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return isDark ? 'text-red-400 bg-red-900/20' : 'text-red-700 bg-red-50';
      case 'medium':
        return isDark ? 'text-yellow-400 bg-yellow-900/20' : 'text-yellow-700 bg-yellow-50';
      case 'low':
        return isDark ? 'text-blue-400 bg-blue-900/20' : 'text-blue-700 bg-blue-50';
      default:
        return isDark ? 'text-gray-400 bg-gray-900/20' : 'text-gray-700 bg-gray-50';
    }
  };

  if (authLoading || loading) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center`}>
        <div className={`text-center ${themeClasses.text}`}>
          <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando monitoreo del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>Monitoreo del Sistema</h1>
            <p className={themeClasses.textSecondary}>Panel de monitoreo y métricas en tiempo real</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-sm ${themeClasses.textSecondary}`}>
              Última actualización: {lastRefresh.toLocaleTimeString()}
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                autoRefresh 
                  ? 'bg-green-600 text-white' 
                  : `${themeClasses.bgSecondary} ${themeClasses.text} border ${themeClasses.border}`
              }`}
            >
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={loadAllData}
              className={`p-2 rounded-md ${themeClasses.buttonHover} transition-colors`}
              title="Actualizar manualmente"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Estado General del Sistema */}
        {systemHealth && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CPU */}
            <div className={`rounded-lg shadow p-6 ${themeClasses.card}`}>
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-md ${
                  systemHealth.system.cpu_usage > 80 
                    ? 'bg-red-100 text-red-600' 
                    : systemHealth.system.cpu_usage > 60
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-green-100 text-green-600'
                }`}>
                  <CpuChipIcon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className={`text-sm font-medium ${themeClasses.textSecondary}`}>Uso de CPU</h3>
                  <p className={`text-2xl font-semibold ${themeClasses.text}`}>
                    {systemHealth.system.cpu_usage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Memoria */}
            <div className={`rounded-lg shadow p-6 ${themeClasses.card}`}>
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-md ${
                  systemHealth.system.memory_usage > 85 
                    ? 'bg-red-100 text-red-600' 
                    : systemHealth.system.memory_usage > 70
                    ? 'bg-yellow-100 text-yellow-600'
                    : 'bg-green-100 text-green-600'
                }`}>
                  <CircleStackIcon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className={`text-sm font-medium ${themeClasses.textSecondary}`}>Memoria</h3>
                  <p className={`text-2xl font-semibold ${themeClasses.text}`}>
                    {systemHealth.system.memory_usage.toFixed(1)}%
                  </p>
                  <p className={`text-xs ${themeClasses.textSecondary}`}>
                    {systemHealth.system.memory_free_gb.toFixed(1)}GB libre
                  </p>
                </div>
              </div>
            </div>

            {/* Base de Datos */}
            <div className={`rounded-lg shadow p-6 ${themeClasses.card}`}>
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-md bg-blue-100 text-blue-600">
                  <ServerIcon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className={`text-sm font-medium ${themeClasses.textSecondary}`}>Conexiones DB</h3>
                  <p className={`text-2xl font-semibold ${themeClasses.text}`}>
                    {systemHealth.database.total_connections}
                  </p>
                  <p className={`text-xs ${themeClasses.textSecondary}`}>
                    {systemHealth.database.status}
                  </p>
                </div>
              </div>
            </div>

            {/* Uptime */}
            <div className={`rounded-lg shadow p-6 ${themeClasses.card}`}>
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 rounded-md bg-purple-100 text-purple-600">
                  <ClockIcon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className={`text-sm font-medium ${themeClasses.textSecondary}`}>Uptime</h3>
                  <p className={`text-2xl font-semibold ${themeClasses.text}`}>
                    {formatUptime(systemHealth.system.uptime)}
                  </p>
                  <p className={`text-xs ${themeClasses.textSecondary}`}>
                    {systemHealth.system.platform}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alertas y Estado de Tenants */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Alertas Activas */}
          <div className={`rounded-lg shadow p-6 ${themeClasses.card}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-medium ${themeClasses.text}`}>
                <ExclamationTriangleIcon className="h-5 w-5 inline mr-2" />
                Alertas Activas
              </h3>
              <span className={`text-sm px-2 py-1 rounded-full ${
                alerts.length > 0 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {alerts.length} alertas
              </span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div key={alert.alert_id} className={`p-3 rounded-lg border ${
                    alert.type === 'critical' 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-yellow-200 bg-yellow-50'
                  }`}>
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 ${
                        alert.type === 'critical' ? 'text-red-500' : 'text-yellow-500'
                      }`}>
                        <ExclamationTriangleIcon className="h-5 w-5" />
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {new Date(alert.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`text-center py-8 ${themeClasses.textSecondary}`}>
                  <CheckCircleIcon className="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>No hay alertas activas</p>
                  <p className="text-sm">El sistema está funcionando correctamente</p>
                </div>
              )}
            </div>
          </div>

          {/* Estado de Tenants */}
          <div className={`rounded-lg shadow p-6 ${themeClasses.card}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-medium ${themeClasses.text}`}>
                <BuildingOfficeIcon className="h-5 w-5 inline mr-2" />
                Estado de Tenants
              </h3>
              <span className={`text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-800`}>
                {tenantsHealth.length} tenants
              </span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {tenantsHealth.map((tenant) => (
                <div key={tenant.tenant_id} className={`p-3 rounded-lg border ${themeClasses.border} ${themeClasses.bgSecondary}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 ${getStatusColor(tenant.health_status)}`}>
                        {getStatusIcon(tenant.health_status)}
                      </div>
                      <div className="ml-3">
                        <h4 className={`text-sm font-medium ${themeClasses.text}`}>
                          {tenant.business_name}
                        </h4>
                        <p className={`text-xs ${themeClasses.textSecondary}`}>
                          {tenant.subdomain}.dominio.com
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {tenant.metrics && (
                        <>
                          <p className={`text-sm ${themeClasses.text}`}>
                            {tenant.metrics.active_users} usuarios
                          </p>
                          <p className={`text-xs ${themeClasses.textSecondary}`}>
                            {tenant.metrics.db_size_mb}MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  {tenant.warnings.length > 0 && (
                    <div className="mt-2">
                      {tenant.warnings.map((warning, idx) => (
                        <span key={idx} className="inline-block text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 mr-1">
                          {warning}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Eventos de Seguridad */}
        <div className={`rounded-lg shadow p-6 ${themeClasses.card}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-medium ${themeClasses.text}`}>
              <ShieldExclamationIcon className="h-5 w-5 inline mr-2" />
              Eventos de Seguridad Recientes
            </h3>
            <button className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors`}>
              Ver todos →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className={`border-b ${themeClasses.border}`}>
                  <th className={`text-left py-3 px-4 font-medium ${themeClasses.textSecondary}`}>Evento</th>
                  <th className={`text-left py-3 px-4 font-medium ${themeClasses.textSecondary}`}>Severidad</th>
                  <th className={`text-left py-3 px-4 font-medium ${themeClasses.textSecondary}`}>IP</th>
                  <th className={`text-left py-3 px-4 font-medium ${themeClasses.textSecondary}`}>Tenant</th>
                  <th className={`text-left py-3 px-4 font-medium ${themeClasses.textSecondary}`}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {securityEvents.map((event) => (
                  <tr key={event.event_id} className={`border-b ${themeClasses.border}`}>
                    <td className="py-3 px-4">
                      <div>
                        <p className={`text-sm font-medium ${themeClasses.text}`}>
                          {event.event_type.replace('_', ' ').toUpperCase()}
                        </p>
                        <p className={`text-xs ${themeClasses.textSecondary}`}>
                          {event.details}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(event.severity)}`}>
                        {event.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className={`py-3 px-4 text-sm ${themeClasses.text}`}>
                      {event.ip_address}
                    </td>
                    <td className={`py-3 px-4 text-sm ${themeClasses.text}`}>
                      {event.tenant_subdomain || 'N/A'}
                    </td>
                    <td className={`py-3 px-4 text-sm ${themeClasses.textSecondary}`}>
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}