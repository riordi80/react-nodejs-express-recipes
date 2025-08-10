'use client'

import { ShoppingListFilters } from '../hooks/useShoppingList'

interface ShoppingFiltersProps {
  filters: ShoppingListFilters
  onFiltersChange: (updater: (prev: ShoppingListFilters) => ShoppingListFilters) => void
  showEventSelection: boolean
  showManualOrder: boolean
}

export default function ShoppingFilters({ 
  filters, 
  onFiltersChange, 
  showEventSelection, 
  showManualOrder 
}: ShoppingFiltersProps) {
  const updateFilter = <K extends keyof ShoppingListFilters>(field: K, value: ShoppingListFilters[K]) => {
    onFiltersChange(prev => ({ ...prev, [field]: value }))
  }

  if (showManualOrder) {
    return null // Don't show filters in manual mode
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
      
      <div className={`grid gap-6 ${showEventSelection ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
        {/* Stock Filter */}
        <div className="space-y-2">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={filters.includeStock}
              onChange={(e) => updateFilter('includeStock', e.target.checked)}
              className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-900">
                Descontar stock actual
              </span>
              <p className="text-xs text-gray-500">
                Solo mostrar lo que necesitas comprar
              </p>
            </div>
          </label>
        </div>

        {/* Event Status Filters - Only show in automatic mode */}
        {!showEventSelection && (
          <>
            <div className="space-y-2">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={filters.includeConfirmed}
                  onChange={(e) => updateFilter('includeConfirmed', e.target.checked)}
                  className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Eventos confirmados
                  </span>
                  <p className="text-xs text-gray-500">
                    Incluir eventos con estado "confirmado"
                  </p>
                </div>
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={filters.includePlanned}
                  onChange={(e) => updateFilter('includePlanned', e.target.checked)}
                  className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Eventos planificados
                  </span>
                  <p className="text-xs text-gray-500">
                    Incluir eventos con estado "planificado"
                  </p>
                </div>
              </label>
            </div>
          </>
        )}

        {/* Time Period Filter */}
        <div className="space-y-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-900">
              Período de tiempo
            </span>
            <select
              value={filters.days}
              onChange={(e) => updateFilter('days', parseInt(e.target.value))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value={7}>Próximos 7 días</option>
              <option value={15}>Próximos 15 días</option>
              <option value={30}>Próximos 30 días</option>
              <option value={60}>Próximos 60 días</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {showEventSelection 
                ? 'Filtrar eventos mostrados en la selección' 
                : 'Rango de fechas para buscar eventos'
              }
            </p>
          </label>
        </div>
      </div>
    </div>
  )
}