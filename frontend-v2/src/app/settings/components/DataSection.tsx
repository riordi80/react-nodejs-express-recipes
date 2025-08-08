'use client'

import React, { useState, useEffect } from 'react'
import { Database, Download, Upload, Calendar, Trash2, AlertTriangle, Clock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import api from '@/lib/api'

interface BackupSettings {
  enabled: boolean
  frequency: string
  time: string
}

interface BackupFile {
  filename: string
  size: number
  created_at: string
}

interface BackupStats {
  total_backups: number
  total_size: number
  last_backup: string
  next_backup: string
}

const DataSection = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(false)
  const [showBackupsList, setShowBackupsList] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    enabled: false,
    frequency: 'weekly',
    time: '02:00'
  })
  
  const [backupsList, setBackupsList] = useState<BackupFile[]>([])
  const [backupStats, setBackupStats] = useState<BackupStats>({
    total_backups: 0,
    total_size: 0,
    last_backup: '',
    next_backup: ''
  })

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      fetchBackupStatus()
    }
  }, [isAdmin])

  const fetchBackupStatus = async () => {
    try {
      const response = await api.get('/data/backup/status')
      setBackupSettings(response.data.settings || backupSettings)
      setBackupStats(response.data.stats || backupStats)
    } catch (error) {
      console.error('Error al cargar estado de backups:', error)
    }
  }

  const fetchBackupsList = async () => {
    try {
      setLoading(true)
      const response = await api.get('/data/backup/list')
      setBackupsList(response.data.backups || [])
    } catch (error: any) {
      showToast({ message: 'Error al cargar lista de backups', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: string, format: string) => {
    if (!isAdmin) {
      showToast({ message: 'Solo los administradores pueden exportar datos', type: 'error' })
      return
    }

    try {
      setLoading(true)
      const response = await api.get(`/data/export/${type}?format=${format}`, {
        responseType: 'blob'
      })
      
      // Crear y descargar archivo
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showToast({ message: `Exportación de ${type} completada`, type: 'success' })
    } catch (error: any) {
      showToast({ message: error.response?.data?.message || 'Error en la exportación', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (type: string, file: File) => {
    if (!isAdmin) {
      showToast({ message: 'Solo los administradores pueden importar datos', type: 'error' })
      return
    }

    if (!file) {
      showToast({ message: 'Por favor selecciona un archivo', type: 'error' })
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setLoading(true)
      const response = await api.post(`/data/import/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      const result = response.data
      showToast({ 
        message: `Importación completada: ${result.imported || 0} registros importados, ${result.errors || 0} errores`, 
        type: result.errors > 0 ? 'warning' : 'success'
      })
    } catch (error: any) {
      showToast({ message: error.response?.data?.message || 'Error en la importación', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const createManualBackup = async () => {
    if (!isAdmin) {
      showToast({ message: 'Solo los administradores pueden crear backups', type: 'error' })
      return
    }

    try {
      setLoading(true)
      await api.get('/data/backup')
      showToast({ message: 'Backup creado correctamente', type: 'success' })
      fetchBackupStatus()
    } catch (error: any) {
      showToast({ message: error.response?.data?.message || 'Error al crear backup', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const updateBackupSettings = async () => {
    if (!isAdmin) {
      showToast({ message: 'Solo los administradores pueden modificar configuraciones', type: 'error' })
      return
    }

    try {
      setLoading(true)
      await api.put('/data/backup/settings', backupSettings)
      showToast({ message: 'Configuración de backups actualizada', type: 'success' })
      fetchBackupStatus()
    } catch (error: any) {
      showToast({ message: error.response?.data?.message || 'Error al actualizar configuración', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const downloadBackup = async (filename: string) => {
    try {
      setLoading(true)
      const response = await api.get(`/data/backup/download/${filename}`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      showToast({ message: 'Descarga iniciada', type: 'success' })
    } catch (error: any) {
      showToast({ message: 'Error al descargar backup', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const deleteBackup = async (filename: string) => {
    try {
      setLoading(true)
      await api.delete(`/data/backup/${filename}`)
      showToast({ message: 'Backup eliminado', type: 'success' })
      fetchBackupsList()
      fetchBackupStatus()
    } catch (error: any) {
      showToast({ message: 'Error al eliminar backup', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!isAdmin) {
      showToast({ message: 'Solo los administradores pueden restablecer el sistema', type: 'error' })
      return
    }

    try {
      setLoading(true)
      await api.post('/data/reset')
      showToast({ message: 'Sistema restablecido correctamente', type: 'success' })
      // Recargar página después de reset
      setTimeout(() => window.location.reload(), 2000)
    } catch (error: any) {
      showToast({ message: error.response?.data?.message || 'Error al restablecer sistema', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const openBackupsList = () => {
    setShowBackupsList(true)
    fetchBackupsList()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No disponible'
    return new Date(dateString).toLocaleString('es-ES')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Database className="h-6 w-6 text-orange-600" />
          Gestión de Datos
        </h2>
        <p className="text-gray-600">Exporta, importa y gestiona los datos de tu aplicación de forma segura</p>
      </div>

      {/* Exportación de Datos */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Download className="h-6 w-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Exportación de Datos</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { type: 'recipes', label: 'Recetas', description: 'Todas las recetas con ingredientes' },
            { type: 'ingredients', label: 'Ingredientes', description: 'Catálogo completo de ingredientes' },
            { type: 'suppliers', label: 'Proveedores', description: 'Proveedores y relaciones' },
            { type: 'events', label: 'Eventos', description: 'Eventos y menús asociados' },
            { type: 'users', label: 'Usuarios', description: 'Usuarios del sistema' },
            { type: 'full', label: 'Completo', description: 'Exportación completa del sistema' }
          ].map(item => (
            <div key={item.type} className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">{item.label}</h4>
              <p className="text-sm text-gray-600 mb-4">{item.description}</p>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport(item.type, 'json')}
                  loading={loading}
                  disabled={!isAdmin}
                >
                  JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExport(item.type, 'csv')}
                  loading={loading}
                  disabled={!isAdmin}
                >
                  CSV
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Importación de Datos */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="h-6 w-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Importación de Datos</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { type: 'recipes', label: 'Recetas', description: 'Importar recetas en formato JSON/CSV', accept: '.json,.csv' },
            { type: 'ingredients', label: 'Ingredientes', description: 'Importar catálogo de ingredientes', accept: '.json,.csv' },
            { type: 'suppliers', label: 'Proveedores', description: 'Importar proveedores y datos de contacto', accept: '.json,.csv' },
            { type: 'events', label: 'Eventos', description: 'Importar eventos programados', accept: '.json,.csv' },
            { type: 'users', label: 'Usuarios', description: 'Importar usuarios del sistema', accept: '.json,.csv' },
            { type: 'backup', label: 'Backup Completo', description: 'Restaurar desde backup completo', accept: '.json' }
          ].map(item => (
            <div key={item.type} className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">{item.label}</h4>
              <p className="text-sm text-gray-600 mb-4">{item.description}</p>
              
              <div className="space-y-2">
                <input
                  type="file"
                  accept={item.accept}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImport(item.type, file)
                      // Limpiar el input después de la importación
                      e.target.value = ''
                    }
                  }}
                  disabled={!isAdmin || loading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">
                  Formatos: {item.accept.replace(/\./g, '').toUpperCase()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Información sobre importación */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-gray-900 mb-2">Información sobre Importación</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• <strong>JSON:</strong> Formato completo con todas las propiedades</p>
            <p>• <strong>CSV:</strong> Formato tabular para importaciones masivas</p>
            <p>• <strong>Duplicados:</strong> Los registros existentes se actualizarán</p>
            <p>• <strong>Errores:</strong> Se mostrarán los errores de validación al finalizar</p>
            <p>• <strong>Backup:</strong> Se recomienda crear un backup antes de importar</p>
          </div>
        </div>
      </div>

      {/* Gestión de Backups */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Backups</h3>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={openBackupsList} variant="outline" size="sm">
              Ver Backups
            </Button>
            <Button onClick={createManualBackup} loading={loading} size="sm" disabled={!isAdmin}>
              Crear Backup
            </Button>
          </div>
        </div>

        {/* Estadísticas de Backups */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Backups</p>
                <p className="text-2xl font-bold text-blue-900">{backupStats.total_backups}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-green-600 font-medium">Tamaño Total</p>
                <p className="text-2xl font-bold text-green-900">{formatFileSize(backupStats.total_size)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-orange-600 font-medium">Último Backup</p>
                <p className="text-sm font-semibold text-gray-900">
                  {backupStats.last_backup ? new Date(backupStats.last_backup).toLocaleDateString() : 'Nunca'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-purple-600 font-medium">Próximo Backup</p>
                <p className="text-sm font-semibold text-purple-900">
                  {backupStats.next_backup && backupSettings.enabled ? new Date(backupStats.next_backup).toLocaleDateString() : 'No programado'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de Backups Automáticos */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Configuración de Backups Automáticos</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Backups Automáticos
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setBackupSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                  disabled={!isAdmin}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    backupSettings.enabled ? 'bg-orange-600' : 'bg-gray-200'
                  } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      backupSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-gray-700">
                  {backupSettings.enabled ? 'Activados' : 'Desactivados'}
                </span>
              </div>
            </div>

            {backupSettings.enabled && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Frecuencia
                  </label>
                  <Select
                    value={backupSettings.frequency}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, frequency: e.target.value }))}
                    options={[
                      { value: 'daily', label: 'Diario' },
                      { value: 'weekly', label: 'Semanal' },
                      { value: 'monthly', label: 'Mensual' }
                    ]}
                    disabled={!isAdmin}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Hora
                  </label>
                  <Select
                    value={backupSettings.time}
                    onChange={(e) => setBackupSettings(prev => ({ ...prev, time: e.target.value }))}
                    options={[
                      { value: '00:00', label: '00:00' },
                      { value: '02:00', label: '02:00' },
                      { value: '04:00', label: '04:00' },
                      { value: '06:00', label: '06:00' }
                    ]}
                    disabled={!isAdmin}
                  />
                </div>
              </>
            )}
          </div>

          {isAdmin && (
            <div className="flex justify-end">
              <Button onClick={updateBackupSettings} loading={loading}>
                Guardar Configuración
              </Button>
            </div>
          )}
        </div>

        {/* Información de Horarios */}
        {backupSettings.enabled && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
            <h4 className="font-semibold text-gray-900 mb-2">Información de Horarios</h4>
            <div className="text-sm text-gray-600">
              <p>• <strong>Frecuencia:</strong> {
                backupSettings.frequency === 'daily' ? 'Cada día' :
                backupSettings.frequency === 'weekly' ? 'Cada semana (domingos)' :
                'Cada mes (día 1)'
              }</p>
              <p>• <strong>Hora:</strong> {backupSettings.time} (hora del servidor)</p>
              <p>• <strong>Retención:</strong> Se mantienen los últimos 10 backups automáticos</p>
            </div>
          </div>
        )}
      </div>

      {/* Zona Peligrosa */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-semibold text-red-900">Zona Peligrosa</h3>
        </div>

        <div className="bg-white rounded-lg p-4 border border-red-300">
          <h4 className="font-semibold text-red-900 mb-2">Restablecer Sistema</h4>
          <p className="text-sm text-red-800 mb-4">
            Esta acción eliminará todos los datos del sistema excepto tu cuenta de usuario. 
            <strong> Esta acción no se puede deshacer.</strong>
          </p>
          
          <Button 
            variant="danger" 
            onClick={() => setShowResetConfirm(true)}
            disabled={!isAdmin}
            icon={Trash2}
          >
            Restablecer Sistema
          </Button>
        </div>
      </div>

      {!isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <h4 className="font-medium text-yellow-800">Acceso Limitado</h4>
              <p className="text-sm text-yellow-700">
                Solo los administradores pueden exportar/importar datos, gestionar backups y restablecer el sistema.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lista de Backups */}
      <Modal
        isOpen={showBackupsList}
        onClose={() => setShowBackupsList(false)}
        title="Lista de Backups"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Gestiona los backups almacenados en el sistema.
          </p>
          
          <div className="max-h-96 overflow-y-auto">
            {backupsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {loading ? 'Cargando backups...' : 'No hay backups disponibles'}
              </div>
            ) : (
              <div className="space-y-2">
                {backupsList.map(backup => (
                  <div key={backup.filename} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-gray-900">{backup.filename}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{formatFileSize(backup.size)}</span>
                        <span>{formatDate(backup.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadBackup(backup.filename)}
                        loading={loading}
                        icon={Download}
                      >
                        Descargar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteBackup(backup.filename)}
                        loading={loading}
                        icon={Trash2}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end mt-6">
          <Button variant="outline" onClick={() => setShowBackupsList(false)}>
            Cerrar
          </Button>
        </div>
      </Modal>

      {/* Modal Confirmar Reset */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        title="⚠️ Restablecer Sistema"
        message="Esta acción eliminará TODOS los datos del sistema (recetas, ingredientes, proveedores, eventos, etc.) excepto tu cuenta de usuario. Esta acción NO SE PUEDE DESHACER. ¿Estás completamente seguro?"
        confirmText="SÍ, RESTABLECER TODO"
        loading={loading}
      />
    </div>
  )
}

export default DataSection