'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useSettings } from '@/context/SettingsContext'
import { useMobileMenu } from '@/context/MobileMenuContext'
import { 
  LayoutDashboard, 
  ChefHat, 
  Package, 
  Calendar,
  Settings, 
  User, 
  HelpCircle,
  LogOut,
  BookOpen,
  Palette,
  Volume2,
  VolumeX,
  Menu,
  Truck,
  Building,
  X
} from 'lucide-react'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { 
    name: 'Eventos', 
    href: '/events', 
    icon: Calendar
  },
  { 
    name: 'Recetas', 
    href: '/recipes', 
    icon: BookOpen
  },
  { 
    name: 'Pedidos', 
    href: '/orders', 
    icon: Truck
  },
  { 
    name: 'Ingredientes', 
    href: '/ingredients', 
    icon: Package,
    children: [
      { name: 'Alérgenos', href: '/ingredients/allergens' }
    ]
  },
  { 
    name: 'Proveedores', 
    href: '/suppliers', 
    icon: Building
  },
]

const bottomNavigation = [
  { name: 'Demo Componentes', href: '/demo/components', icon: Palette },
  { name: 'Configuración', href: '/settings', icon: Settings },
  { name: 'Ayuda', href: '/dashboard/help', icon: HelpCircle },
]

export default function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { soundEnabled, setSoundEnabled } = useSettings()
  const { isMobileMenuOpen, setIsMobileMenuOpen, toggleMobileMenu } = useMobileMenu()

  const isNavItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="hidden lg:flex items-center px-6 py-4 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <ChefHat className="h-8 w-8 text-orange-600" />
          <span className="text-xl font-bold text-gray-900">RecetasAPI</span>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-6 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-100 p-2 rounded-full">
            <User className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.restaurant_name || 
               (user?.role === 'admin' ? 'Administrador' : 
                user?.role === 'chef' ? 'Chef' : 
                user?.role === 'supplier_manager' ? 'Gestor de Proveedores' : user?.role)}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = isNavItemActive(item.href)
          
          return (
            <div key={item.name}>
              <Link
                href={item.href}
                className={clsx(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  {
                    'bg-orange-100 text-orange-700': isActive,
                    'text-gray-700 hover:bg-gray-100': !isActive
                  }
                )}
                onClick={() => {
                  if (isMobileMenuOpen) {
                    setIsMobileMenuOpen(false)
                  }
                }}
              >
                <item.icon 
                  className={clsx('mr-3 h-5 w-5', {
                    'text-orange-600': isActive,
                    'text-gray-500': !isActive
                  })} 
                />
                {item.name}
              </Link>
              
              {/* Subnavigation */}
              {item.children && isActive && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={clsx(
                        'block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors',
                        {
                          'text-orange-600 bg-orange-50': pathname === child.href
                        }
                      )}
                      onClick={() => {
                        if (isMobileMenuOpen) {
                          setIsMobileMenuOpen(false)
                        }
                      }}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 px-3 py-4 space-y-1">
                {/* Sound Toggle */}
                <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="w-full group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {soundEnabled ? (
            <Volume2 className="mr-3 h-5 w-5 text-gray-500" />
          ) : (
            <VolumeX className="mr-3 h-5 w-5 text-gray-500" />
          )}
          <span className="flex-1 text-left">
            Sonido {soundEnabled ? 'activado' : 'desactivado'}
          </span>
          <div className={clsx(
            'relative inline-flex h-4 w-7 items-center rounded-full transition-colors',
            soundEnabled ? 'bg-orange-500' : 'bg-gray-300'
          )}>
            <div className={clsx(
              'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
              soundEnabled ? 'translate-x-3.5' : 'translate-x-0.5'
            )} />
          </div>
        </button>
        
        {/* Demo Componentes */}
        <Link
          href="/demo/components"
          className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => {
            if (isMobileMenuOpen) {
              setIsMobileMenuOpen(false)
            }
          }}
        >
          <Palette className="mr-3 h-5 w-5 text-gray-500" />
          Demo componentes
        </Link>

        {/* Configuración y Ayuda */}
        {bottomNavigation.slice(1).map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => {
              if (isMobileMenuOpen) {
                setIsMobileMenuOpen(false)
              }
            }}
          >
            <item.icon className="mr-3 h-5 w-5 text-gray-500" />
            {item.name}
          </Link>
        ))}
        
        <button 
          onClick={handleLogout}
          className="w-full group flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Header with Logo - GLOBAL */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChefHat className="h-6 w-6 text-orange-600" />
            <span className="text-lg font-bold text-gray-900">RecetasAPI</span>
          </div>
          <button 
            onClick={toggleMobileMenu}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="lg:hidden fixed inset-0 z-[45] bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed top-[60px] bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-200 overflow-y-auto">
            <SidebarContent />
          </div>
        </>
      )}
    </>
  )
}