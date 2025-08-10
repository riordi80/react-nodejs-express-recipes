'use client'

import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Users, 
  Clock,
  Euro,
  Palette,
  Camera,
  Hash,
  Settings,
  Percent
} from 'lucide-react'
import { 
  Button, 
  Input, 
  Select, 
  TextArea, 
  Loading 
} from '@/components/ui'
import { useToastHelpers } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

interface RestaurantInfo {
  restaurant_id?: number
  name: string
  business_name: string
  description: string
  phone: string
  email: string
  website: string
  address: string
  city: string
  postal_code: string
  country: string
  tax_number: string
  vat_rate: number
  cuisine_type: string
  seating_capacity: number
  opening_hours: Record<string, { open: string; close: string; closed: boolean }> | null
  manager_name: string
  manager_phone: string
  emergency_contact: string
  emergency_phone: string
  default_currency: string
  default_language: string
  timezone: string
  target_food_cost_percentage: number
  labor_cost_per_hour: number
  rent_monthly: number
  instagram_handle: string
  facebook_page: string
  google_business_url: string
  logo_url: string
  primary_color: string
  secondary_color: string
}

const RestaurantSection = () => {
  const { success, error } = useToastHelpers()
  const { updateRestaurantName } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo>({
    name: '',
    business_name: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'España',
    tax_number: '',
    vat_rate: 21.00,
    cuisine_type: '',
    seating_capacity: 0,
    opening_hours: null,
    manager_name: '',
    manager_phone: '',
    emergency_contact: '',
    emergency_phone: '',
    default_currency: 'EUR',
    default_language: 'es',
    timezone: 'Europe/Madrid',
    target_food_cost_percentage: 30.00,
    labor_cost_per_hour: 0,
    rent_monthly: 0,
    instagram_handle: '',
    facebook_page: '',
    google_business_url: '',
    logo_url: '',
    primary_color: '#f97316',
    secondary_color: '#1f2937'
  })

  // Opciones para selects
  const cuisineTypes = [
    { value: '', label: 'Seleccionar tipo de cocina' },
    { value: 'española', label: 'Española' },
    { value: 'italiana', label: 'Italiana' },
    { value: 'francesa', label: 'Francesa' },
    { value: 'mexicana', label: 'Mexicana' },
    { value: 'asiática', label: 'Asiática' },
    { value: 'fusión', label: 'Fusión' },
    { value: 'mediterránea', label: 'Mediterránea' },
    { value: 'vegetariana', label: 'Vegetariana/Vegana' },
    { value: 'otro', label: 'Otro' }
  ]

  const currencies = [
    { value: 'EUR', label: 'Euro (€)' },
    { value: 'USD', label: 'Dólar ($)' },
    { value: 'GBP', label: 'Libra (£)' },
    { value: 'MXN', label: 'Peso Mexicano ($)' }
  ]

  const languages = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'it', label: 'Italiano' }
  ]

  const timezones = [
    { value: 'Europe/Madrid', label: 'Madrid (UTC+1)' },
    { value: 'Europe/London', label: 'London (UTC+0)' },
    { value: 'America/New_York', label: 'New York (UTC-5)' },
    { value: 'America/Mexico_City', label: 'México City (UTC-6)' }
  ]

  // Cargar información del restaurante
  useEffect(() => {
    const fetchRestaurantInfo = async () => {
      try {
        setLoading(true)
        const response = await api.get('/restaurant-info')
        
        if (response.data.success && response.data.data) {
          // Asegurar valores por defecto para todos los campos
          const safeData = {
            ...response.data.data,
            // Campos de texto - convertir null a string vacío
            name: response.data.data.name || '',
            business_name: response.data.data.business_name || '',
            description: response.data.data.description || '',
            phone: response.data.data.phone || '',
            email: response.data.data.email || '',
            website: response.data.data.website || '',
            address: response.data.data.address || '',
            city: response.data.data.city || '',
            postal_code: response.data.data.postal_code || '',
            country: response.data.data.country || 'España',
            tax_number: response.data.data.tax_number || '',
            cuisine_type: response.data.data.cuisine_type || '',
            manager_name: response.data.data.manager_name || '',
            manager_phone: response.data.data.manager_phone || '',
            emergency_contact: response.data.data.emergency_contact || '',
            emergency_phone: response.data.data.emergency_phone || '',
            default_currency: response.data.data.default_currency || 'EUR',
            default_language: response.data.data.default_language || 'es',
            timezone: response.data.data.timezone || 'Europe/Madrid',
            instagram_handle: response.data.data.instagram_handle || '',
            facebook_page: response.data.data.facebook_page || '',
            google_business_url: response.data.data.google_business_url || '',
            logo_url: response.data.data.logo_url || '',
            primary_color: response.data.data.primary_color || '#f97316',
            secondary_color: response.data.data.secondary_color || '#1f2937',
            // Campos numéricos
            seating_capacity: response.data.data.seating_capacity ?? 0,
            vat_rate: response.data.data.vat_rate ?? 21.00,
            target_food_cost_percentage: response.data.data.target_food_cost_percentage ?? 30.00,
            labor_cost_per_hour: response.data.data.labor_cost_per_hour ?? 0,
            rent_monthly: response.data.data.rent_monthly ?? 0
          }
          setRestaurantInfo(safeData)
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          error('Error al cargar la información del restaurante', 'Error de Carga')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurantInfo()
  }, [])

  const handleInputChange = (field: keyof RestaurantInfo, value: string | number | Record<string, { open: string; close: string; closed: boolean }> | null) => {
    setRestaurantInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Validaciones básicas
      if (!restaurantInfo.name.trim()) {
        error('El nombre del restaurante es obligatorio', 'Validación')
        return
      }

      if (restaurantInfo.email && !/\S+@\S+\.\S+/.test(restaurantInfo.email)) {
        error('El formato del email no es válido', 'Validación')
        return
      }

      const response = await api.put('/restaurant-info', restaurantInfo)
      
      if (response.data.success) {
        success('Información del restaurante actualizada correctamente', 'Guardado')
        // Actualizar solo el nombre del restaurante en el contexto sin hacer nueva petición al servidor
        updateRestaurantName(restaurantInfo.name)
      }
    } catch (err: any) {
      console.error('Error al guardar:', err)
      if (err.response?.data?.error) {
        error(err.response.data.error, 'Error al Guardar')
      } else {
        error('Error inesperado al guardar la información', 'Error')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading size="lg" text="Cargando información del restaurante..." />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-orange-600" />
            Información del Restaurante
          </h2>
          <p className="text-gray-600 mt-1">
            Configure los datos básicos y la información de contacto de su restaurante
          </p>
        </div>
        <Button 
          onClick={handleSave}
          loading={saving}
          icon={Save}
          disabled={saving}
        >
          Guardar Cambios
        </Button>
      </div>

      {/* Formulario */}
      <div className="space-y-8">
        {/* Información Básica */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nombre del Restaurante *"
              placeholder="Mi Restaurante"
              icon={Building2}
              value={restaurantInfo.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
            <Input
              label="Razón Social"
              placeholder="Mi Restaurante S.L."
              value={restaurantInfo.business_name}
              onChange={(e) => handleInputChange('business_name', e.target.value)}
            />
            <Select
              label="Tipo de Cocina"
              options={cuisineTypes}
              value={restaurantInfo.cuisine_type}
              onChange={(e) => handleInputChange('cuisine_type', e.target.value)}
            />
            <Input
              label="Aforo (número de comensales)"
              type="number"
              icon={Users}
              value={restaurantInfo.seating_capacity?.toString() || '0'}
              onChange={(e) => handleInputChange('seating_capacity', parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="mt-6">
            <TextArea
              label="Descripción"
              placeholder="Breve descripción de su restaurante..."
              value={restaurantInfo.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5 text-orange-600" />
            Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Teléfono Principal"
              placeholder="+34 123 456 789"
              icon={Phone}
              value={restaurantInfo.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              placeholder="contacto@mirestaurante.com"
              icon={Mail}
              value={restaurantInfo.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
            <Input
              label="Sitio Web"
              placeholder="https://www.mirestaurante.com"
              icon={Globe}
              value={restaurantInfo.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
            />
            <div></div> {/* Espaciador */}
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            Ubicación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Dirección"
                placeholder="Calle Principal, 123"
                icon={MapPin}
                value={restaurantInfo.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
            <Input
              label="Ciudad"
              placeholder="Madrid"
              value={restaurantInfo.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
            />
            <Input
              label="Código Postal"
              placeholder="28001"
              value={restaurantInfo.postal_code}
              onChange={(e) => handleInputChange('postal_code', e.target.value)}
            />
          </div>
        </div>

        {/* Información Fiscal */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-orange-600" />
            Información Fiscal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Número Fiscal (CIF/NIF)"
              placeholder="B12345678"
              value={restaurantInfo.tax_number}
              onChange={(e) => handleInputChange('tax_number', e.target.value)}
            />
            <Input
              label="IVA por Defecto (%)"
              type="number"
              step="0.01"
              icon={Euro}
              value={restaurantInfo.vat_rate?.toString() || '21.00'}
              onChange={(e) => handleInputChange('vat_rate', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Configuración de Costos */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Euro className="h-5 w-5 text-orange-600" />
            Objetivos de Costos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="Objetivo de Costos de Comida (%)"
              type="number"
              step="0.01"
              icon={Percent}
              value={restaurantInfo.target_food_cost_percentage?.toString() || '30.00'}
              onChange={(e) => handleInputChange('target_food_cost_percentage', parseFloat(e.target.value) || 0)}
              helperText="Porcentaje objetivo para el costo de ingredientes"
            />
            <Input
              label="Costo Laboral por Hora (€)"
              type="number"
              step="0.01"
              icon={Clock}
              value={restaurantInfo.labor_cost_per_hour?.toString() || '0'}
              onChange={(e) => handleInputChange('labor_cost_per_hour', parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Alquiler Mensual (€)"
              type="number"
              step="0.01"
              icon={Building2}
              value={restaurantInfo.rent_monthly?.toString() || '0'}
              onChange={(e) => handleInputChange('rent_monthly', parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Personal de Contacto */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" />
            Personal de Contacto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Nombre del Gerente"
              placeholder="Juan Pérez"
              value={restaurantInfo.manager_name}
              onChange={(e) => handleInputChange('manager_name', e.target.value)}
            />
            <Input
              label="Teléfono del Gerente"
              placeholder="+34 600 123 456"
              icon={Phone}
              value={restaurantInfo.manager_phone}
              onChange={(e) => handleInputChange('manager_phone', e.target.value)}
            />
            <Input
              label="Contacto de Emergencia"
              placeholder="María García"
              value={restaurantInfo.emergency_contact}
              onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
            />
            <Input
              label="Teléfono de Emergencia"
              placeholder="+34 600 987 654"
              icon={Phone}
              value={restaurantInfo.emergency_phone}
              onChange={(e) => handleInputChange('emergency_phone', e.target.value)}
            />
          </div>
        </div>

        {/* Configuración del Sistema */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" />
            Configuración del Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Select
              label="Moneda por Defecto"
              options={currencies}
              value={restaurantInfo.default_currency}
              onChange={(e) => handleInputChange('default_currency', e.target.value)}
            />
            <Select
              label="Idioma"
              options={languages}
              value={restaurantInfo.default_language}
              onChange={(e) => handleInputChange('default_language', e.target.value)}
            />
            <Select
              label="Zona Horaria"
              options={timezones}
              value={restaurantInfo.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
            />
          </div>
        </div>

        {/* Horarios de Apertura */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Horarios de Apertura
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuración de horarios */}
            <div className="lg:col-span-2 space-y-4">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
              const dayLabels: Record<string, string> = {
                monday: 'Lunes',
                tuesday: 'Martes',
                wednesday: 'Miércoles',
                thursday: 'Jueves',
                friday: 'Viernes',
                saturday: 'Sábado',
                sunday: 'Domingo'
              }
              
              const dayData = restaurantInfo.opening_hours?.[day] || { open: '09:00', close: '22:00', closed: false }
              
              return (
                <div key={day} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="sm:w-24 font-medium text-gray-900">
                    {dayLabels[day]}
                  </div>
                  
                  <div className="flex items-center gap-4 flex-1">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dayData.closed}
                        onChange={(e) => {
                          const newOpeningHours = {
                            ...restaurantInfo.opening_hours,
                            [day]: { ...dayData, closed: e.target.checked }
                          }
                          handleInputChange('opening_hours', newOpeningHours)
                        }}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Cerrado</span>
                    </label>
                    
                    {!dayData.closed && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={dayData.open}
                          onChange={(e) => {
                            const newOpeningHours = {
                              ...restaurantInfo.opening_hours,
                              [day]: { ...dayData, open: e.target.value }
                            }
                            handleInputChange('opening_hours', newOpeningHours)
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                        <span className="text-gray-500">a</span>
                        <input
                          type="time"
                          value={dayData.close}
                          onChange={(e) => {
                            const newOpeningHours = {
                              ...restaurantInfo.opening_hours,
                              [day]: { ...dayData, close: e.target.value }
                            }
                            handleInputChange('opening_hours', newOpeningHours)
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const defaultHours = { open: '09:00', close: '22:00', closed: false }
                    const newOpeningHours = {
                      monday: defaultHours,
                      tuesday: defaultHours,
                      wednesday: defaultHours,
                      thursday: defaultHours,
                      friday: defaultHours,
                      saturday: defaultHours,
                      sunday: { ...defaultHours, closed: true }
                    }
                    handleInputChange('opening_hours', newOpeningHours)
                  }}
                  className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                >
                  Horario Estándar (L-S 9:00-22:00)
                </button>
                <button
                  onClick={() => {
                    const extendedHours = { open: '08:00', close: '00:00', closed: false }
                    const newOpeningHours = {
                      monday: extendedHours,
                      tuesday: extendedHours,
                      wednesday: extendedHours,
                      thursday: extendedHours,
                      friday: extendedHours,
                      saturday: extendedHours,
                      sunday: { open: '10:00', close: '23:00', closed: false }
                    }
                    handleInputChange('opening_hours', newOpeningHours)
                  }}
                  className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
                >
                  Horario Extendido
                </button>
                <button
                  onClick={() => {
                    const closedDay = { open: '09:00', close: '22:00', closed: true }
                    const newOpeningHours = {
                      monday: closedDay,
                      tuesday: closedDay,
                      wednesday: closedDay,
                      thursday: closedDay,
                      friday: closedDay,
                      saturday: closedDay,
                      sunday: closedDay
                    }
                    handleInputChange('opening_hours', newOpeningHours)
                  }}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cerrar Todos los Días
                </button>
              </div>
            </div>
            </div>

            {/* Información adicional */}
            <div className="space-y-4">
              {/* Estado Actual */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Estado Actual</h4>
                <div className="space-y-2 text-sm">
                  <div className="text-green-600 font-medium flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Abierto ahora
                  </div>
                  <p className="text-gray-600">Cierra en: <span className="font-medium">4h 30min</span></p>
                  <p className="text-gray-600">Próxima apertura: <span className="font-medium">Mañana 9:00</span></p>
                </div>
              </div>

              {/* Resumen de Horarios */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Resumen Semanal</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total horas/semana:</span>
                    <span className="font-medium">78 horas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Días abiertos:</span>
                    <span className="font-medium">6 de 7 días</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Promedio/día:</span>
                    <span className="font-medium">13 horas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Día más largo:</span>
                    <span className="font-medium">Sábado (13h)</span>
                  </div>
                </div>
              </div>

              {/* Tips y Sugerencias */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-3">Consejos</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>• Los horarios se muestran automáticamente en tu página web</p>
                  <p>• Considera horarios especiales para días festivos</p>
                  <p>• Los horarios ayudan a los clientes a planificar sus visitas</p>
                  <p>• Actualiza si cambias temporalmente los horarios</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-orange-600" />
            Redes Sociales
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Instagram"
              placeholder="@mirestaurante"
              icon={Hash}
              value={restaurantInfo.instagram_handle}
              onChange={(e) => handleInputChange('instagram_handle', e.target.value)}
            />
            <Input
              label="Facebook"
              placeholder="https://facebook.com/mirestaurante"
              icon={Hash}
              value={restaurantInfo.facebook_page}
              onChange={(e) => handleInputChange('facebook_page', e.target.value)}
            />
            <div className="md:col-span-2">
              <Input
                label="Google Business"
                placeholder="https://business.google.com/..."
                icon={Globe}
                value={restaurantInfo.google_business_url}
                onChange={(e) => handleInputChange('google_business_url', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Personalización Visual */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5 text-orange-600" />
            Personalización Visual
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input
              label="URL del Logo"
              placeholder="https://ejemplo.com/logo.png"
              icon={Camera}
              value={restaurantInfo.logo_url}
              onChange={(e) => handleInputChange('logo_url', e.target.value)}
              helperText="URL de la imagen del logo"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Primario
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={restaurantInfo.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  placeholder="#f97316"
                  value={restaurantInfo.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Secundario
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={restaurantInfo.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  placeholder="#1f2937"
                  value={restaurantInfo.secondary_color}
                  onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botón de guardar final */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button 
          onClick={handleSave}
          loading={saving}
          icon={Save}
          size="lg"
          disabled={saving}
        >
          Guardar Toda la Información
        </Button>
      </div>
    </div>
  )
}

export default RestaurantSection