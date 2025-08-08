'use client'

import React, { useState } from 'react'
import { LayoutDashboard, ArrowUp, ArrowDown, Move, Eye, EyeOff, Package, Calendar, ChefHat, Truck, Monitor, Settings } from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Widget {
  id: string
  title: string
  description: string
  category: string
  enabled: boolean
  order: number
}

const DashboardSection = () => {
  const { showToast } = useToast()
  const [showReorderModal, setShowReorderModal] = useState(false)
  
  // Estado inicial de widgets (normalmente vendría de contexto o API)
  const [widgets, setWidgets] = useState<Widget[]>([
    // Gestión de Inventario
    { id: 'stockAlerts', title: 'Alertas de Stock', description: 'Ingredientes con stock bajo', category: 'inventory', enabled: true, order: 1 },
    { id: 'seasonalIngredients', title: 'Ingredientes de Temporada', description: 'Ingredientes actuales de temporada', category: 'inventory', enabled: true, order: 2 },
    { id: 'seasonalAlerts', title: 'Alertas de Temporada', description: 'Ingredientes próximos a cambiar temporada', category: 'inventory', enabled: false, order: 3 },
    // Eventos y Planificación
    { id: 'upcomingEvents', title: 'Próximos Eventos', description: 'Eventos programados próximamente', category: 'events', enabled: true, order: 4 },
    { id: 'eventsWithMenus', title: 'Eventos con Menús', description: 'Eventos que tienen menús asignados', category: 'events', enabled: true, order: 5 },
    // Recetas y Cocina
    { id: 'latestRecipes', title: 'Últimas Recetas', description: 'Recetas añadidas recientemente', category: 'recipes', enabled: true, order: 6 },
    { id: 'recipesByCategory', title: 'Recetas por Categoría', description: 'Distribución de recetas por categoría', category: 'recipes', enabled: false, order: 7 },
    // Proveedores y Pedidos
    { id: 'pendingOrders', title: 'Pedidos Pendientes', description: 'Órdenes de compra pendientes', category: 'suppliers', enabled: true, order: 8 },
    { id: 'costTrends', title: 'Tendencias de Costos', description: 'Evolución de precios de ingredientes', category: 'suppliers', enabled: false, order: 9 }
  ])

  const [displaySettings, setDisplaySettings] = useState({
    itemsPerWidget: '5',
    autoRefresh: true,
    refreshInterval: '30'
  })

  const categories = {
    inventory: { name: 'Gestión de Inventario', icon: Package, color: 'bg-gray-50' },
    events: { name: 'Eventos y Planificación', icon: Calendar, color: 'bg-gray-50' },
    recipes: { name: 'Recetas y Cocina', icon: ChefHat, color: 'bg-gray-50' },
    suppliers: { name: 'Proveedores y Pedidos', icon: Truck, color: 'bg-gray-50' }
  }

  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, enabled: !widget.enabled }
        : widget
    ))
    showToast({ message: 'Configuración de widget actualizada', type: 'success' })
  }

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    const currentIndex = widgets.findIndex(w => w.id === widgetId)
    if (
      (direction === 'up' && currentIndex > 0) ||
      (direction === 'down' && currentIndex < widgets.length - 1)
    ) {
      const newWidgets = [...widgets]
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      
      // Intercambiar posiciones
      const temp = newWidgets[currentIndex].order
      newWidgets[currentIndex].order = newWidgets[targetIndex].order
      newWidgets[targetIndex].order = temp
      
      // Reordenar array
      newWidgets.sort((a, b) => a.order - b.order)
      setWidgets(newWidgets)
      showToast({ message: 'Orden actualizado', type: 'success' })
    }
  }

  const handleDisplaySettingChange = (key: string, value: string | boolean) => {
    setDisplaySettings(prev => ({ ...prev, [key]: value }))
    showToast({ message: 'Configuración de visualización actualizada', type: 'success' })
  }

  const resetToDefaults = () => {
    setWidgets(prev => prev.map(widget => ({ ...widget, enabled: true })))
    setDisplaySettings({
      itemsPerWidget: '5',
      autoRefresh: true,
      refreshInterval: '30'
    })
    showToast({ message: 'Configuraciones restablecidas a valores por defecto', type: 'success' })
  }

  const enabledWidgets = widgets.filter(w => w.enabled).length
  const totalWidgets = widgets.length

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
              <p className="text-2xl font-bold text-orange-900">{enabledWidgets}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <EyeOff className="h-8 w-8 text-gray-600" />
            <div>
              <p className="text-sm text-gray-600 font-medium">Widgets Ocultos</p>
              <p className="text-2xl font-bold text-gray-900">{totalWidgets - enabledWidgets}</p>
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
        const categoryWidgets = widgets.filter(w => w.category === category)
        
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
                      onClick={() => moveWidget(widget.id, 'up')}
                      disabled={widget.order === 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => moveWidget(widget.id, 'down')}
                      disabled={widget.order === widgets.length}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => toggleWidget(widget.id)}
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
          onClick={resetToDefaults}
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
                      onClick={() => moveWidget(widget.id, 'up')}
                      disabled={widget.order === 1}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-300 rounded"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => moveWidget(widget.id, 'down')}
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