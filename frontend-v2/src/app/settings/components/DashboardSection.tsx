'use client'

import React, { useState } from 'react'
import { LayoutDashboard, ArrowUp, ArrowDown, Move, Eye, EyeOff, Package, Calendar, ChefHat, Truck, Monitor } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { useDashboardConfig } from '@/hooks/useDashboardConfig'

const DashboardSection = () => {
  const { showToast } = useToast()
  const [showReorderModal, setShowReorderModal] = useState(false)
  
  // Usar el hook de configuración del dashboard
  const {
    widgets,
    displaySettings,
    loading,
    totalWidgets,
    enabledCount,
    disabledCount,
    toggleWidget,
    moveWidget,
    updateDisplaySettings,
    resetToDefaults,
    getWidgetsByCategory
  } = useDashboardConfig()

  const categories = {
    inventory: { name: 'Gestión de Inventario', icon: Package, color: 'bg-gray-50' },
    events: { name: 'Eventos y Planificación', icon: Calendar, color: 'bg-gray-50' },
    recipes: { name: 'Recetas y Cocina', icon: ChefHat, color: 'bg-gray-50' },
    suppliers: { name: 'Proveedores y Pedidos', icon: Truck, color: 'bg-gray-50' }
  }

  const handleToggleWidget = (widgetId: string) => {
    toggleWidget(widgetId)
    showToast({ message: 'Configuración de widget actualizada', type: 'success' })
  }

  const handleMoveWidget = (widgetId: string, direction: 'up' | 'down') => {
    moveWidget(widgetId, direction)
    showToast({ message: 'Orden actualizado', type: 'success' })
  }

  const handleDisplaySettingChange = (key: string, value: string | boolean) => {
    updateDisplaySettings(key as any, value)
    showToast({ message: 'Configuración de visualización actualizada', type: 'success' })
  }

  const handleResetToDefaults = () => {
    resetToDefaults()
    showToast({ message: 'Configuraciones restablecidas a valores por defecto', type: 'success' })
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-orange-600" />
          Configuración del Dashboard
        </h2>
        <p className="text-gray-600">Personaliza los widgets y la visualización de tu dashboard</p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-orange-600 font-medium">Total de Widgets</p>
              <p className="text-2xl font-bold text-orange-900">{totalWidgets}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-orange-100 border border-orange-300 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Eye className="h-8 w-8 text-orange-700" />
            <div>
              <p className="text-sm text-orange-700 font-medium">Widgets Activos</p>
              <p className="text-2xl font-bold text-orange-900">{enabledCount}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <EyeOff className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Widgets Ocultos</p>
              <p className="text-2xl font-bold text-gray-900">{disabledCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración de Visualización */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Monitor className="h-5 w-5 text-orange-600" />
          Configuración de Visualización
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Elementos por Widget
            </label>
            <select
              value={displaySettings.itemsPerWidget}
              onChange={(e) => handleDisplaySettingChange('itemsPerWidget', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="3">3 elementos</option>
              <option value="5">5 elementos</option>
              <option value="10">10 elementos</option>
              <option value="15">15 elementos</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Actualización Automática
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDisplaySettingChange('autoRefresh', !displaySettings.autoRefresh)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  displaySettings.autoRefresh ? 'bg-orange-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    displaySettings.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {displaySettings.autoRefresh ? 'Activada' : 'Desactivada'}
              </span>
            </div>
          </div>

          {displaySettings.autoRefresh && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Intervalo (segundos)
              </label>
              <select
                value={displaySettings.refreshInterval}
                onChange={(e) => handleDisplaySettingChange('refreshInterval', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="15">15 segundos</option>
                <option value="30">30 segundos</option>
                <option value="60">1 minuto</option>
                <option value="300">5 minutos</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Widgets por Categoría */}
      {Object.entries(categories).map(([category, categoryData]) => {
        const categoryWidgets = getWidgetsByCategory(category as any)
        
        return (
          <div key={category} className={`rounded-lg p-6 ${categoryData.color}`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <categoryData.icon className="h-5 w-5 text-orange-600" />
              {categoryData.name}
            </h3>
            
            <div className="space-y-3">
              {categoryWidgets.map(widget => (
                <div key={widget.id} className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{widget.title}</h4>
                    <p className="text-sm text-gray-600">{widget.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleMoveWidget(widget.id, 'up')}
                      disabled={widget.order === 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleMoveWidget(widget.id, 'down')}
                      disabled={widget.order === widgets.length}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleWidget(widget.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        widget.enabled ? 'bg-orange-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          widget.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
        <Button 
          onClick={() => setShowReorderModal(true)}
          variant="outline"
          icon={Move}
        >
          Reordenar Widgets
        </Button>
        
        <Button 
          onClick={handleResetToDefaults}
          variant="outline"
        >
          Restablecer por Defecto
        </Button>
        
        <div className="flex-1"></div>
        <p className="text-sm text-gray-500 self-center">
          Los cambios se aplican inmediatamente
        </p>
      </div>

      {/* Modal de Reordenamiento */}
      <Modal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        title="Reordenar Widgets"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Usa las flechas para cambiar el orden de los widgets en tu dashboard.
          </p>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {widgets
              .filter(w => w.enabled)
              .sort((a, b) => a.order - b.order)
              .map((widget) => (
                <div key={widget.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-orange-600 min-w-6">#{widget.order}</span>
                    <div>
                      <p className="font-medium text-gray-900">{widget.title}</p>
                      <p className="text-sm text-gray-600">{widget.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMoveWidget(widget.id, 'up')}
                      disabled={widget.order === 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-300 rounded"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleMoveWidget(widget.id, 'down')}
                      disabled={widget.order === widgets.filter(w => w.enabled).length}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-300 rounded"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowReorderModal(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DashboardSection