'use client'

import React, { useState } from 'react'
import { Globe, Calendar, DollarSign, Search, FileText, Settings } from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import { useToast } from '@/context/ToastContext'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'

const SystemSection = () => {
  const { settings, updateSetting } = useSettings()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSettingChange = (key: keyof typeof settings, value: string | boolean) => {
    updateSetting(key, value)
    showToast({ message: 'Configuración actualizada', type: 'success' })
  }

  const resetToDefaults = () => {
    const defaults = {
      units: 'metric' as const,
      dateFormat: 'dd/mm/yyyy' as const,
      currency: 'EUR' as const,
      pageSize: 25,
      autoSearch: true
    }
    
    Object.entries(defaults).forEach(([key, value]) => {
      updateSetting(key as keyof typeof settings, value)
    })
    
    showToast({ message: 'Configuraciones restablecidas a valores por defecto', type: 'success' })
  }

  const unitsOptions = [
    { value: 'metric', label: 'Métrico (kg, g, l, ml)' },
    { value: 'imperial', label: 'Imperial (lb, oz, gal, fl oz)' }
  ]

  const dateFormatOptions = [
    { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY (31/12/2024)' },
    { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY (12/31/2024)' },
    { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD (2024-12-31)' }
  ]

  const currencyOptions = [
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'USD', label: 'Dólar estadounidense ($)' },
    { value: 'GBP', label: 'Libra esterlina (£)' }
  ]

  const pageSizeOptions = [
    { value: '10', label: '10 elementos por página' },
    { value: '25', label: '25 elementos por página' },
    { value: '50', label: '50 elementos por página' },
    { value: '100', label: '100 elementos por página' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Settings className="h-6 w-6 text-orange-600" />
          Configuración del Sistema
        </h2>
        <p className="text-gray-600">Personaliza las preferencias generales de la aplicación</p>
      </div>

      {/* Configuración Regional */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="h-6 w-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Configuración Regional</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Sistema de Unidades
            </label>
            <Select
              value={settings.units}
              onChange={(e) => handleSettingChange('units', e.target.value)}
              options={unitsOptions}
            />
            <p className="text-sm text-gray-500">
              Define las unidades de medida para ingredientes y recetas
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Formato de Fecha
            </label>
            <Select
              value={settings.dateFormat}
              onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
              options={dateFormatOptions}
            />
            <p className="text-sm text-gray-500">
              Cómo se mostrarán las fechas en la aplicación
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Moneda
            </label>
            <Select
              value={settings.currency}
              onChange={(e) => handleSettingChange('currency', e.target.value)}
              options={currencyOptions}
            />
            <p className="text-sm text-gray-500">
              Moneda utilizada para precios y costos
            </p>
          </div>
        </div>
      </div>

      {/* Configuración de Interfaz */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Configuración de Interfaz</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Elementos por Página
            </label>
            <Select
              value={settings.pageSize}
              onChange={(e) => handleSettingChange('pageSize', parseInt(e.target.value))}
              options={pageSizeOptions}
            />
            <p className="text-sm text-gray-500">
              Número de elementos mostrados en tablas y listas
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Búsqueda Automática
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSettingChange('autoSearch', !settings.autoSearch)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoSearch ? 'bg-orange-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoSearch ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-700">
                {settings.autoSearch ? 'Activada' : 'Desactivada'}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Realizar búsquedas automáticamente mientras escribes
            </p>
          </div>
        </div>
      </div>

      {/* Previsualización de Configuraciones */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Previsualización</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Ejemplos de formato:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Fecha: {
                settings.dateFormat === 'dd/mm/yyyy' ? '31/12/2024' :
                settings.dateFormat === 'mm/dd/yyyy' ? '12/31/2024' : '2024-12-31'
              }</div>
              <div>• Peso: {settings.units === 'metric' ? '1.5 kg' : '3.3 lb'}</div>
              <div>• Volumen: {settings.units === 'metric' ? '500 ml' : '16.9 fl oz'}</div>
              <div>• Precio: {
                settings.currency === 'EUR' ? '€15.50' :
                settings.currency === 'USD' ? '$15.50' : '£15.50'
              }</div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Configuraciones activas:</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Paginación: {settings.pageSize} elementos</div>
              <div>• Búsqueda: {settings.autoSearch ? 'Automática' : 'Manual'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
        <Button 
          onClick={resetToDefaults}
          variant="outline"
          loading={loading}
        >
          Restablecer Valores por Defecto
        </Button>
        <div className="flex-1"></div>
        <p className="text-sm text-gray-500 self-center">
          Los cambios se guardan automáticamente
        </p>
      </div>
    </div>
  )
}

export default SystemSection