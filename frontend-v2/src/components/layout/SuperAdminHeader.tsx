'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSuperAdmin } from '@/context/SuperAdminContext'
import { 
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export function SuperAdminHeader() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { user, logout, isFullAdmin } = useSuperAdmin()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/superadmin/login')
  }

  // Mock notifications para demo
  const notifications = [
    {
      id: 1,
      type: 'warning',
      title: 'Tenant suspendido',
      message: 'El tenant "restaurant-abc" fue suspendido por falta de pago',
      time: '5 min ago',
      unread: true
    },
    {
      id: 2,
      type: 'info',
      title: 'Nuevo tenant creado',
      message: 'Se creó el tenant "restaurant-xyz" exitosamente',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 3,
      type: 'success',
      title: 'Backup completado',
      message: 'Backup automático completado para todos los tenants',
      time: '2 hours ago',
      unread: false
    }
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Breadcrumb/Page title */}
            <div className="ml-4 flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Panel de Administración
              </h1>
              {isFullAdmin() && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <ShieldCheckIcon className="h-3 w-3 mr-1" />
                  Full Access
                </span>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-500 relative"
                onClick={() => {
                  setShowNotifications(!showNotifications)
                  setShowUserMenu(false)
                }}
              >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Notificaciones</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border ${
                            notification.unread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                            </div>
                            {notification.unread && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button className="text-sm text-blue-600 hover:text-blue-500">
                        Ver todas las notificaciones
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center p-2 text-sm rounded-full text-gray-400 hover:text-gray-500"
                onClick={() => {
                  setShowUserMenu(!showUserMenu)
                  setShowNotifications(false)
                }}
              >
                <UserCircleIcon className="h-8 w-8" />
                <span className="ml-2 text-gray-700 hidden sm:block">
                  {user?.first_name} {user?.last_name}
                </span>
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Rol: {user?.superadmin_role === 'super_admin_full' ? 'Administrador Completo' :
                             user?.superadmin_role === 'super_admin_read' ? 'Solo Lectura' :
                             user?.superadmin_role === 'super_admin_billing' ? 'Facturación' :
                             user?.superadmin_role === 'super_admin_support' ? 'Soporte' :
                             user?.superadmin_role === 'super_admin_dev' ? 'Desarrollador' :
                             'Admin'}
                      </p>
                    </div>
                    
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => router.push('/superadmin/profile')}
                    >
                      <CogIcon className="h-4 w-4 mr-2" />
                      Configuración
                    </button>
                    
                    <button
                      className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false)
            setShowNotifications(false)
          }}
        />
      )}
    </header>
  )
}