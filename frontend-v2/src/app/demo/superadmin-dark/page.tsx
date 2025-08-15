'use client'

import React, { useState } from 'react'

export default function SuperAdminDarkDemoPage() {
  const [showModal, setShowModal] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState('tenants')
  
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🛡️ SuperAdmin Console - Demo Dark Theme
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Demostración del tema dark del SuperAdmin con la paleta de colores oficial documentada.
          </p>
        </div>

        {/* Color Palette Demo */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Paleta de Colores</h2>
          
          {/* Colores Base */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-300 mb-4">Colores Base</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-4 rounded border border-slate-600">
                <div className="text-sm text-slate-300">bg-slate-900</div>
                <div className="text-xs text-slate-400">Fondo principal</div>
              </div>
              <div className="bg-slate-800 p-4 rounded border border-slate-600">
                <div className="text-sm text-slate-300">bg-slate-800</div>
                <div className="text-xs text-slate-400">Sidebar</div>
              </div>
              <div className="bg-slate-700 p-4 rounded border border-slate-600">
                <div className="text-sm text-slate-300">bg-slate-700</div>
                <div className="text-xs text-slate-400">Cards/Modales</div>
              </div>
              <div className="bg-slate-50 p-4 rounded border border-slate-600">
                <div className="text-sm text-gray-900">bg-slate-50</div>
                <div className="text-xs text-gray-600">Contenido</div>
              </div>
            </div>
          </div>

          {/* Colores de Acento */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-300 mb-4">Colores de Acento</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-600 p-4 rounded">
                <div className="text-sm text-white">bg-blue-600</div>
                <div className="text-xs text-blue-100">Primario</div>
              </div>
              <div className="bg-green-600 p-4 rounded">
                <div className="text-sm text-white">bg-green-600</div>
                <div className="text-xs text-green-100">Éxito</div>
              </div>
              <div className="bg-yellow-600 p-4 rounded">
                <div className="text-sm text-white">bg-yellow-600</div>
                <div className="text-xs text-yellow-100">Advertencia</div>
              </div>
              <div className="bg-red-600 p-4 rounded">
                <div className="text-sm text-white">bg-red-600</div>
                <div className="text-xs text-red-100">Error</div>
              </div>
              <div className="bg-purple-600 p-4 rounded">
                <div className="text-sm text-white">bg-purple-600</div>
                <div className="text-xs text-purple-100">Info</div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Cards Demo */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Cards de Métricas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white">🏢</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-400 truncate">
                      Total Tenants
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      127
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-green-400 font-medium">119 activos</span>
                  <span className="text-slate-400 ml-2">/ 8 suspendidos</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white">👥</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-400 truncate">
                      Total Usuarios
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      1,456
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-green-400">
                  <span>↗ +12% este mes</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <span className="text-white">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-400 truncate">
                      Ingresos MRR
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      €15,750
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-green-400">
                  <span>↗ +8.2% vs mes anterior</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-700 rounded-lg p-6 border border-slate-600">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-400 truncate">
                      Estado Sistema
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      Funcionando
                    </dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm text-slate-400">
                  Último backup: Hoy 02:30
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forms Demo */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Formularios y Controles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email SuperAdmin
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@ejemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rol de SuperAdmin
                </label>
                <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="super_admin_full">Full Admin</option>
                  <option value="super_admin_read">Read Only</option>
                  <option value="super_admin_billing">Billing</option>
                  <option value="super_admin_support">Support</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notas de Administración
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notas internas del superadmin..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Buttons Demo */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Botones y Estados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Primario
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              Éxito
            </button>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors">
              Advertencia
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
              Eliminar
            </button>
            <button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 transition-colors">
              Secundario
            </button>
            <button className="px-4 py-2 border border-slate-600 text-slate-300 rounded-md hover:bg-slate-700 transition-colors">
              Outline
            </button>
            <button className="px-4 py-2 bg-slate-600 text-slate-400 rounded-md cursor-not-allowed" disabled>
              Deshabilitado
            </button>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
              Info
            </button>
          </div>
        </div>

        {/* Alerts Demo */}
        <div className="bg-slate-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Alertas y Notificaciones</h2>
          <div className="space-y-4">
            <div className="bg-blue-900/50 border border-blue-600 text-blue-200 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">ℹ️</div>
                <div className="ml-3">
                  <p className="text-sm">
                    Información: Nuevo tenant registrado exitosamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">✅</div>
                <div className="ml-3">
                  <p className="text-sm">
                    Éxito: Usuario SuperAdmin creado correctamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-900/50 border border-yellow-600 text-yellow-200 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">⚠️</div>
                <div className="ml-3">
                  <p className="text-sm">
                    Advertencia: El tenant tiene pagos pendientes.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">❌</div>
                <div className="ml-3">
                  <p className="text-sm">
                    Error: No se pudo conectar con la base de datos del tenant.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading States */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Estados de Carga</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-300">Verificando autenticación...</p>
            </div>
            
            <div className="text-center">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-slate-700 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-slate-700 rounded w-1/2 mx-auto"></div>
              </div>
              <p className="text-slate-300 mt-4">Cargando datos...</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-300">Procesando...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}