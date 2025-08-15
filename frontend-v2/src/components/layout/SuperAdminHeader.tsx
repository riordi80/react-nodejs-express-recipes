'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSuperAdmin } from '@/context/SuperAdminContext'
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext'
import { 
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  ShieldCheckIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline'

export function SuperAdminHeader() {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { user, logout, isFullAdmin } = useSuperAdmin()
  const { toggleTheme, isDark, getThemeClasses } = useSuperAdminTheme()
  const router = useRouter()
  const themeClasses = getThemeClasses()

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
    <header className={`shadow-sm border-b ${themeClasses.header}`}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className={`md:hidden p-2 rounded-md ${themeClasses.button} ${themeClasses.buttonHover}`}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>

            {/* Breadcrumb/Page title */}
            <div className="ml-4 flex items-center">
              <h1 className={`text-xl font-semibold ${themeClasses.text}`}>
                Panel de Administración
              </h1>
              {isFullAdmin() && (
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                  <ShieldCheckIcon className="h-3 w-3 mr-1" />
                  Full Access
                </span>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-md ${themeClasses.button} ${themeClasses.buttonHover} transition-colors`}
              title={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                className={`p-2 relative ${themeClasses.button}`}
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
                <div className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 ${themeClasses.card}`}>
                  <div className="p-4">
                    <h3 className={`text-sm font-medium mb-3 ${themeClasses.text}`}>Notificaciones</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border ${
                            notification.unread 
                              ? (isDark ? 'bg-blue-900/30 border-blue-700' : 'bg-blue-50 border-blue-200')
                              : (isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200')
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className={`text-sm font-medium ${themeClasses.text}`}>
                                {notification.title}
                              </p>
                              <p className={`text-sm mt-1 ${themeClasses.textSecondary}`}>
                                {notification.message}
                              </p>
                            </div>
                            {notification.unread && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className={`text-xs mt-2 ${themeClasses.textSecondary}`}>{notification.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-3 pt-3 border-t ${themeClasses.border}`}>
                      <button className={`text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors`}>
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
                className={`flex items-center p-2 text-sm rounded-full ${themeClasses.button}`}
                onClick={() => {
                  setShowUserMenu(!showUserMenu)
                  setShowNotifications(false)
                }}
              >
                <UserCircleIcon className="h-8 w-8" />
                <span className={`ml-2 hidden sm:block ${themeClasses.text}`}>
                  {user?.first_name} {user?.last_name}
                </span>
              </button>

              {/* User dropdown */}
              {showUserMenu && (
                <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50 ${themeClasses.card}`}>
                  <div className="py-1">
                    <div className={`px-4 py-2 border-b ${themeClasses.border}`}>
                      <p className={`text-sm font-medium ${themeClasses.text}`}>
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className={`text-sm ${themeClasses.textSecondary}`}>{user?.email}</p>
                      <p className={`text-xs mt-1 ${themeClasses.textSecondary}`}>
                        Rol: {user?.superadmin_role === 'super_admin_full' ? 'Administrador Completo' :
                             user?.superadmin_role === 'super_admin_read' ? 'Solo Lectura' :
                             user?.superadmin_role === 'super_admin_billing' ? 'Facturación' :
                             user?.superadmin_role === 'super_admin_support' ? 'Soporte' :
                             user?.superadmin_role === 'super_admin_dev' ? 'Desarrollador' :
                             'Admin'}
                      </p>
                    </div>
                    
                    <button
                      className={`flex items-center w-full px-4 py-2 text-sm ${themeClasses.textSecondary} ${themeClasses.buttonHover}`}
                      onClick={() => router.push('/superadmin/profile')}
                    >
                      <CogIcon className="h-4 w-4 mr-2" />
                      Configuración
                    </button>
                    
                    <button
                      className={`flex items-center w-full px-4 py-2 text-sm ${isDark ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50'} transition-colors`}
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