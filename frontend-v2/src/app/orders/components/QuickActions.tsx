'use client'

import { ShoppingCart, ClipboardList, Building } from 'lucide-react'

interface QuickActionsProps {
  onNavigateToTab: (tabId: string) => void
}

export default function QuickActions({ onNavigateToTab }: QuickActionsProps) {
  const actions = [
    {
      label: 'Generar Lista de Compras',
      description: 'Crear lista basada en eventos activos',
      icon: ShoppingCart,
      onClick: () => onNavigateToTab('shopping-list')
    },
    {
      label: 'Ver Pedidos Activos',
      description: 'Revisar estado de pedidos pendientes',  
      icon: ClipboardList,
      onClick: () => onNavigateToTab('active-orders')
    },
    {
      label: 'Gestionar Proveedores',
      description: 'Ver resumen de pedidos por proveedor',
      icon: Building,
      onClick: () => onNavigateToTab('suppliers')
    }
  ]

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-orange-600" />
        Acciones Rápidas
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action, index) => {
          const IconComponent = action.icon
          return (
            <button
              key={index}
              onClick={action.onClick}
              className="group bg-white p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all duration-200 text-left"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-50 group-hover:bg-orange-100 transition-colors">
                  <IconComponent className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 group-hover:text-orange-700 transition-colors mb-1">
                    {action.label}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}