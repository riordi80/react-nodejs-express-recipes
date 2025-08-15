'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSuperAdmin } from '@/context/SuperAdminContext'
import { 
  HomeIcon, 
  UsersIcon, 
  BuildingOfficeIcon,
  CreditCardIcon,
  ChartBarIcon,
  CogIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
  requiredRoles?: string[]
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/superadmin',
    icon: HomeIcon,
  },
  {
    name: 'Tenants',
    href: '/superadmin/tenants',
    icon: BuildingOfficeIcon,
    permission: 'manage_tenants'
  },
  {
    name: 'Usuarios',
    href: '/superadmin/users',
    icon: UsersIcon,
    permission: 'manage_users'
  },
  {
    name: 'Facturación',
    href: '/superadmin/billing',
    icon: CreditCardIcon,
    permission: 'view_billing'
  },
  {
    name: 'Métricas',
    href: '/superadmin/metrics',
    icon: ChartBarIcon,
    permission: 'view_metrics'
  },
  {
    name: 'Monitoreo',
    href: '/superadmin/monitoring',
    icon: ExclamationTriangleIcon,
    permission: 'view_system_health'
  },
  {
    name: 'Configuración',
    href: '/superadmin/settings',
    icon: CogIcon,
    permission: 'manage_system_config'
  },
  {
    name: 'Logs de Auditoría',
    href: '/superadmin/audit',
    icon: DocumentTextIcon,
    permission: 'view_audit_logs'
  },
  {
    name: 'Seguridad',
    href: '/superadmin/security',
    icon: ShieldCheckIcon,
    permission: 'manage_security',
    requiredRoles: ['super_admin_full']
  }
]

export function SuperAdminSidebar() {
  const pathname = usePathname()
  const { user, hasPermission, isFullAdmin } = useSuperAdmin()

  const canAccessItem = (item: NavItem): boolean => {
    // Si requiere roles específicos
    if (item.requiredRoles && !item.requiredRoles.includes(user?.superadmin_role || '')) {
      return false
    }
    
    // Si requiere permiso específico
    if (item.permission && !hasPermission(item.permission)) {
      return false
    }
    
    return true
  }

  const filteredNavigation = navigation.filter(canAccessItem)

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-slate-800 overflow-y-auto">
        {/* Logo/Brand */}
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShieldCheckIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-white">SuperAdmin</h1>
              <p className="text-xs text-slate-400">Console</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 mb-6">
          <div className="bg-slate-700 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.first_name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.superadmin_role === 'super_admin_full' ? 'Full Admin' :
                   user?.superadmin_role === 'super_admin_read' ? 'Read Only' :
                   user?.superadmin_role === 'super_admin_billing' ? 'Billing' :
                   user?.superadmin_role === 'super_admin_support' ? 'Support' :
                   user?.superadmin_role === 'super_admin_dev' ? 'Developer' :
                   'Admin'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/superadmin' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }
                `}
              >
                <item.icon
                  className={`
                    mr-3 flex-shrink-0 h-5 w-5 transition-colors
                    ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}
                  `}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-slate-700">
          <div className="text-xs text-slate-400 text-center">
            <p>Console v1.0.0</p>
            <p className="mt-1">© 2024 SuperAdmin</p>
          </div>
        </div>
      </div>
    </div>
  )
}