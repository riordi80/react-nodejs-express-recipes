'use client'

import { useState } from 'react'
import { Truck, LayoutGrid, Table, Search, Calendar, Filter } from 'lucide-react'
import OrderCard from './OrderCard'
import OrdersTable from './OrdersTable'

interface Order {
  order_id: number
  supplier_id: number
  supplier_name: string
  status: 'pending' | 'ordered' | 'delivered' | 'cancelled'
  order_date: string
  delivery_date?: string
  total_amount: number
  items_count: number
  notes?: string
  created_at: string
  updated_at: string
  first_name?: string
  last_name?: string
}

interface OrderFilters {
  search: string
  status: {
    pending: boolean
    ordered: boolean
    delivered: boolean
    cancelled: boolean
  }
  dateFrom: string
  dateTo: string
}

interface ActiveOrdersSectionProps {
  orders: Order[]
  loading: boolean
  filters: OrderFilters
  onFiltersChange: (filters: OrderFilters) => void
  onOrderClick: (orderId: number) => void
  onUpdateOrderStatus: (orderId: number, status: string, notes?: string) => Promise<void>
  onDeleteOrder: (order: Order) => Promise<void>
}

export default function ActiveOrdersSection({
  orders,
  loading,
  filters,
  onFiltersChange,
  onOrderClick,
  onUpdateOrderStatus,
  onDeleteOrder
}: ActiveOrdersSectionProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const updateFilter = <K extends keyof OrderFilters>(field: K, value: OrderFilters[K]) => {
    onFiltersChange({ ...filters, [field]: value })
  }

  const handleStatusFilterChange = (status: keyof OrderFilters['status'], checked: boolean) => {
    onFiltersChange({
      ...filters,
      status: {
        ...filters.status,
        [status]: checked
      }
    })
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      ordered: 'Confirmado',
      delivered: 'Recibido',
      cancelled: 'Cancelado'
    }
    return labels[status as keyof typeof labels] || status
  }

  const selectedStatusCount = Object.values(filters.status).filter(Boolean).length
  const totalStatusCount = Object.keys(filters.status).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Truck className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Pedidos Activos</h2>
      </div>


      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="h-4 w-4 inline mr-1" />
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nº pedido o proveedor..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="h-4 w-4 inline mr-1" />
              Estados ({selectedStatusCount}/{totalStatusCount})
            </label>
            <div className="relative">
              <details className="relative">
                <summary className="w-full px-3 py-2 border border-gray-300 rounded-lg cursor-pointer focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  {selectedStatusCount === totalStatusCount ? 'Todos los estados' : 
                   selectedStatusCount === 1 ? getStatusLabel(Object.entries(filters.status).find(([_, active]) => active)?.[0] || '') :
                   `${selectedStatusCount} seleccionados`}
                </summary>
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-2">
                  {Object.entries(filters.status).map(([status, checked]) => (
                    <label key={status} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => handleStatusFilterChange(status as keyof OrderFilters['status'], e.target.checked)}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="text-sm">{getStatusLabel(status)}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Desde
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hasta
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {orders.length} pedidos encontrados
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Vista:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'cards' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Tarjetas</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Table className="h-4 w-4" />
                <span>Tabla</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">Cargando pedidos activos...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos activos</h3>
          <p className="text-gray-500">Los pedidos generados desde la Lista de Compras aparecerán aquí</p>
        </div>
      ) : (
        <>
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.map(order => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  onViewOrder={onOrderClick}
                  onUpdateStatus={onUpdateOrderStatus}
                  onDeleteOrder={onDeleteOrder}
                />
              ))}
            </div>
          ) : (
            <OrdersTable
              orders={orders}
              onViewOrder={onOrderClick}
              onUpdateStatus={onUpdateOrderStatus}
              onDeleteOrder={onDeleteOrder}
            />
          )}
        </>
      )}
    </div>
  )
}