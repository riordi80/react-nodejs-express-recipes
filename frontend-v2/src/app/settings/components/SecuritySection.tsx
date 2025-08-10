'use client'

import React, { useState, useEffect } from 'react'
import { Shield, Clock, Key, FileText, Eye } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import api from '@/lib/api'

interface PasswordPolicy {
  password_min_length: string
  password_require_special: boolean
  password_require_numbers: boolean
}

interface SessionPolicy {
  session_duration: string
  auto_logout: boolean
  auto_logout_time: string
}

interface AuditLog {
  id: number
  user_id: number
  user_name: string
  user_email: string
  action: string
  table_name: string
  record_id: string
  changes: string
  ip_address: string
  user_agent: string
  timestamp: string
}

interface AuditSummary {
  actions: Record<string, number>
  tables: Record<string, number>
  total: number
}

const SecuritySection = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>({
    password_min_length: '8',
    password_require_special: false,
    password_require_numbers: true
  })
  
  const [sessionPolicy, setSessionPolicy] = useState<SessionPolicy>({
    session_duration: '3600',
    auto_logout: true,
    auto_logout_time: '1800'
  })
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditSummary, setAuditSummary] = useState<AuditSummary>({
    actions: {},
    tables: {},
    total: 0
  })
  
  const [logsFilter, setLogsFilter] = useState({
    action: '',
    table: '',
    period: '7'
  })

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetchPolicies()
  }, [])

  const fetchPolicies = async () => {
    try {
      const [passwordRes, sessionRes] = await Promise.all([
        api.get('/settings/password-policy'),
        api.get('/settings/session-policy')
      ])
      
      setPasswordPolicy(passwordRes.data)
      setSessionPolicy(sessionRes.data)
    } catch (error) {
      console.error('Error al cargar políticas:', error)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (logsFilter.action) params.append('action', logsFilter.action)
      if (logsFilter.table) params.append('table', logsFilter.table)
      if (logsFilter.period) params.append('period', logsFilter.period)
      
      const [logsRes, summaryRes] = await Promise.all([
        api.get(`/audit/logs?${params.toString()}`),
        api.get(`/audit/summary?${params.toString()}`)
      ])
      
      setAuditLogs(logsRes.data.logs || [])
      setAuditSummary(summaryRes.data || { actions: {}, tables: {}, total: 0 })
    } catch (error: any) {
      showToast({ message: 'Error al cargar logs de auditoría', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const updatePasswordPolicy = async () => {
    if (!isAdmin) {
      showToast({ message: 'Solo los administradores pueden modificar políticas', type: 'error' })
      return
    }

    try {
      setLoading(true)
      await api.put('/settings/password-policy', passwordPolicy)
      showToast({ message: 'Política de contraseñas actualizada', type: 'success' })
    } catch (error: any) {
      showToast({ message: error.response?.data?.message || 'Error al actualizar política', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const updateSessionPolicy = async () => {
    if (!isAdmin) {
      showToast({ message: 'Solo los administradores pueden modificar políticas', type: 'error' })
      return
    }

    try {
      setLoading(true)
      await api.put('/settings/session-policy', sessionPolicy)
      showToast({ message: 'Política de sesión actualizada', type: 'success' })
    } catch (error: any) {
      showToast({ message: error.response?.data?.message || 'Error al actualizar política', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const openLogsModal = () => {
    if (!isAdmin) {
      showToast({ message: 'Solo los administradores pueden ver logs de auditoría', type: 'error' })
      return
    }
    setShowLogsModal(true)
    fetchAuditLogs()
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'success'
      case 'update': return 'warning'
      case 'delete': return 'danger'
      default: return 'default'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Shield className="h-6 w-6 text-orange-600" />
          Configuración de Seguridad
        </h2>
        <p className="text-gray-600">Gestiona las políticas de seguridad y auditoría del sistema</p>
      </div>

      {/* Políticas de Contraseña */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Key className="h-6 w-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Política de Contraseñas</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Longitud Mínima
            </label>
            <Select
              value={passwordPolicy.password_min_length}
              onChange={(e) => setPasswordPolicy(prev => ({ ...prev, password_min_length: e.target.value }))}
              options={[
                { value: '6', label: '6 caracteres' },
                { value: '8', label: '8 caracteres' },
                { value: '10', label: '10 caracteres' },
                { value: '12', label: '12 caracteres' }
              ]}
              disabled={!isAdmin}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Requiere Números
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPasswordPolicy(prev => ({ ...prev, password_require_numbers: !prev.password_require_numbers }))}
                disabled={!isAdmin}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  passwordPolicy.password_require_numbers ? 'bg-orange-600' : 'bg-gray-200'
                } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    passwordPolicy.password_require_numbers ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {passwordPolicy.password_require_numbers ? 'Activado' : 'Desactivado'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Requiere Caracteres Especiales
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPasswordPolicy(prev => ({ ...prev, password_require_special: !prev.password_require_special }))}
                disabled={!isAdmin}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  passwordPolicy.password_require_special ? 'bg-orange-600' : 'bg-gray-200'
                } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    passwordPolicy.password_require_special ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {passwordPolicy.password_require_special ? 'Activado' : 'Desactivado'}
              </span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={updatePasswordPolicy} loading={loading}>
              Guardar Política de Contraseñas
            </Button>
          </div>
        )}
      </div>

      {/* Políticas de Sesión */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="h-6 w-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Política de Sesión</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Duración de Sesión
            </label>
            <Select
              value={sessionPolicy.session_duration}
              onChange={(e) => setSessionPolicy(prev => ({ ...prev, session_duration: e.target.value }))}
              options={[
                { value: '1800', label: '30 minutos' },
                { value: '3600', label: '1 hora' },
                { value: '7200', label: '2 horas' },
                { value: '14400', label: '4 horas' },
                { value: '28800', label: '8 horas' }
              ]}
              disabled={!isAdmin}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Cierre Automático
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSessionPolicy(prev => ({ ...prev, auto_logout: !prev.auto_logout }))}
                disabled={!isAdmin}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  sessionPolicy.auto_logout ? 'bg-orange-600' : 'bg-gray-200'
                } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    sessionPolicy.auto_logout ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {sessionPolicy.auto_logout ? 'Activado' : 'Desactivado'}
              </span>
            </div>
          </div>

          {sessionPolicy.auto_logout && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tiempo de Inactividad
              </label>
              <Select
                value={sessionPolicy.auto_logout_time}
                onChange={(e) => setSessionPolicy(prev => ({ ...prev, auto_logout_time: e.target.value }))}
                options={[
                  { value: '300', label: '5 minutos' },
                  { value: '600', label: '10 minutos' },
                  { value: '900', label: '15 minutos' },
                  { value: '1800', label: '30 minutos' }
                ]}
                disabled={!isAdmin}
              />
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex justify-end">
            <Button onClick={updateSessionPolicy} loading={loading}>
              Guardar Política de Sesión
            </Button>
          </div>
        )}
      </div>

      {/* Auditoría */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Auditoría del Sistema</h3>
          </div>
          
          <Button onClick={openLogsModal} icon={Eye} variant="outline">
            Ver Logs de Auditoría
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Registro de Actividad</h4>
            <p className="text-sm text-gray-600 mb-3">
              Todas las acciones de usuarios son registradas automáticamente
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-600 font-medium">Activo</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Retención de Logs</h4>
            <p className="text-sm text-gray-600 mb-3">
              Los logs se conservan durante 90 días por defecto
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-blue-600 font-medium">90 días</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">Acceso a Logs</h4>
            <p className="text-sm text-gray-600 mb-3">
              Solo administradores pueden acceder a los logs
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-orange-600 font-medium">Restringido</span>
            </div>
          </div>
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-yellow-600" />
            <div>
              <h4 className="font-medium text-yellow-800">Acceso Limitado</h4>
              <p className="text-sm text-yellow-700">
                Solo puedes visualizar las configuraciones de seguridad. Los administradores pueden modificarlas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Logs de Auditoría */}
      <Modal
        isOpen={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        title="Logs de Auditoría"
        size="lg"
      >
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Acción</label>
                <Select
                  value={logsFilter.action}
                  onChange={(e) => setLogsFilter(prev => ({ ...prev, action: e.target.value }))}
                  options={[
                    { value: '', label: 'Todas las acciones' },
                    { value: 'create', label: 'Crear' },
                    { value: 'update', label: 'Actualizar' },
                    { value: 'delete', label: 'Eliminar' }
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tabla</label>
                <Select
                  value={logsFilter.table}
                  onChange={(e) => setLogsFilter(prev => ({ ...prev, table: e.target.value }))}
                  options={[
                    { value: '', label: 'Todas las tablas' },
                    { value: 'USERS', label: 'Usuarios' },
                    { value: 'RECIPES', label: 'Recetas' },
                    { value: 'INGREDIENTS', label: 'Ingredientes' },
                    { value: 'SUPPLIERS', label: 'Proveedores' },
                    { value: 'EVENTS', label: 'Eventos' }
                  ]}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                <Select
                  value={logsFilter.period}
                  onChange={(e) => setLogsFilter(prev => ({ ...prev, period: e.target.value }))}
                  options={[
                    { value: '1', label: 'Último día' },
                    { value: '7', label: 'Última semana' },
                    { value: '30', label: 'Último mes' },
                    { value: '90', label: 'Últimos 3 meses' }
                  ]}
                />
              </div>
              
              <div className="flex items-end">
                <Button onClick={fetchAuditLogs} loading={loading} fullWidth>
                  Filtrar
                </Button>
              </div>
            </div>
          </div>

          {/* Resumen */}
          {auditSummary.total > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Acciones</h4>
                <div className="space-y-2">
                  {Object.entries(auditSummary.actions).map(([action, count]) => (
                    <div key={action} className="flex items-center justify-between">
                      <Badge variant={getActionBadgeVariant(action)} size="sm">
                        {action.toUpperCase()}
                      </Badge>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Tablas</h4>
                <div className="space-y-2">
                  {Object.entries(auditSummary.tables).map(([table, count]) => (
                    <div key={table} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{table}</span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lista de Logs */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {loading ? 'Cargando logs...' : 'No hay logs disponibles para los filtros seleccionados'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                              {log.action.toUpperCase()}
                            </Badge>
                            <span className="text-sm font-medium text-gray-900">{log.table_name}</span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            <strong>{log.user_name}</strong> ({log.user_email})
                          </div>
                          {log.changes && (
                            <div className="text-xs text-gray-500 bg-gray-100 rounded p-2 mt-2 font-mono">
                              {log.changes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setShowLogsModal(false)}>
            Cerrar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default SecuritySection