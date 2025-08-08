'use client'

import { useState, useEffect } from 'react'
import { History, Search, Calendar, Download, Filter, TrendingUp, Eye, Package, User } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { useToastHelpers } from '@/context/ToastContext'

interface HistoryOrder {
  order_id: number
  supplier_id: number | null
  supplier_name: string
  supplier_phone?: string
  supplier_email?: string
  order_date: string
  delivery_date?: string
  status: 'pending' | 'ordered' | 'delivered' | 'cancelled'
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
  items_count: number
  first_name?: string
  last_name?: string
  created_by_email?: string
}

interface HistoryFilters {
  startDate: string
  endDate: string
  supplierId: string
  status: string
  minAmount: string
  maxAmount: string
  createdBy: string
  orderBy: string
  sortDirection: 'ASC' | 'DESC'
  page: number
  limit: number
}

interface HistoryResponse {
  orders: HistoryOrder[]
  pagination: {
    currentPage: number
    totalPages: number
    totalRecords: number
    recordsPerPage: number
    hasNext: boolean
    hasPrev: boolean
  }
  statistics: {
    totalOrders: number
    totalAmount: number
    averageAmount: number
    statusBreakdown: {
      pending: number
      ordered: number
      delivered: number
      cancelled: number
    }
  }
}

interface HistorySectionProps {
  onOrderClick?: (orderId: number) => void
}

// Format currency helper
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount)
}

// Get status style
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'pending':
      return {
        label: 'Pendiente',
        className: 'bg-yellow-100 text-yellow-800'
      }
    case 'ordered':
      return {
        label: 'Confirmado',
        className: 'bg-blue-100 text-blue-800'
      }
    case 'delivered':
      return {
        label: 'Recibido',
        className: 'bg-green-100 text-green-800'
      }
    case 'cancelled':
      return {
        label: 'Cancelado',
        className: 'bg-red-100 text-red-800'
      }
    default:
      return {
        label: status,
        className: 'bg-gray-100 text-gray-800'
      }
  }
}

const defaultFilters: HistoryFilters = {
  startDate: '',
  endDate: '',
  supplierId: 'all',
  status: 'all',
  minAmount: '',
  maxAmount: '',
  createdBy: 'all',
  orderBy: 'order_date',
  sortDirection: 'DESC',
  page: 1,
  limit: 25
}

export default function HistorySection({ onOrderClick }: HistorySectionProps) {
  const { error: showError } = useToastHelpers()
  
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null)
  const [filters, setFilters] = useState<HistoryFilters>(defaultFilters)
  const [loading, setLoading] = useState(true)
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)

  // Load history data
  const loadHistory = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await apiGet<HistoryResponse>(`/supplier-orders/history?${params.toString()}`)
      setHistoryData(response.data)
    } catch (error) {
      console.error('Error loading history:', error)
      showError('Error al cargar el historial de pedidos', 'Error de Carga')
    } finally {
      setLoading(false)
    }
  }

  // Export history
  const handleExport = async () => {
    try {
      // Build query parameters for export
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== '' && key !== 'page' && key !== 'limit') {
          params.append(key, value.toString())
        }
      })
      params.append('format', 'csv')

      // Create download link
      const url = `/supplier-orders/export?${params.toString()}`
      const link = document.createElement('a')
      link.href = url
      link.download = `historial_pedidos_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error exporting history:', error)
      showError('Error al exportar el historial', 'Error de Exportación')
    }
  }

  // Update filters
  const updateFilter = <K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 })) // Reset to page 1 when filters change
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  useEffect(() => {
    loadHistory()
  }, [filters])

  const handleOrderClick = (orderId: number) => {
    if (onOrderClick) {
      onOrderClick(orderId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-2 rounded-lg">
            <History className="h-6 w-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Pedidos</h2>
        </div>
        
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <span className="font-medium text-gray-900">Filtros Avanzados</span>
            </div>
            <span className="text-gray-400">
              {isFiltersExpanded ? '−' : '+'}
            </span>
          </button>
        </div>

        {isFiltersExpanded && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="ordered">Confirmado</option>
                  <option value="delivered">Recibido</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importe Mínimo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.minAmount}
                  onChange={(e) => updateFilter('minAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Importe Máximo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={filters.maxAmount}
                  onChange={(e) => updateFilter('maxAmount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ordenar por
                </label>
                <select
                  value={filters.orderBy}
                  onChange={(e) => updateFilter('orderBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="order_date">Fecha</option>
                  <option value="total_amount">Importe</option>
                  <option value="supplier_name">Proveedor</option>
                  <option value="status">Estado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <select
                  value={filters.sortDirection}
                  onChange={(e) => updateFilter('sortDirection', e.target.value as 'ASC' | 'DESC')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="DESC">Descendente</option>
                  <option value="ASC">Ascendente</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      {historyData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{historyData.statistics.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Importe Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(historyData.statistics.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Promedio por Pedido</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(historyData.statistics.averageAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Estado Principal</p>
                <p className="text-lg font-bold text-gray-900">
                  {Object.entries(historyData.statistics.statusBreakdown)
                    .sort(([,a], [,b]) => b - a)[0]?.[0] === 'delivered' ? 'Recibido' :
                   Object.entries(historyData.statistics.statusBreakdown)
                    .sort(([,a], [,b]) => b - a)[0]?.[0] === 'ordered' ? 'Confirmado' :
                   Object.entries(historyData.statistics.statusBreakdown)
                    .sort(([,a], [,b]) => b - a)[0]?.[0] === 'pending' ? 'Pendiente' : 'Cancelado'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <span className="ml-3 text-gray-600">Cargando historial...</span>
        </div>
      )}

      {/* Orders Table */}
      {!loading && historyData && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pedido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Importe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creado por
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historyData.orders.map((order) => {
                    const statusStyle = getStatusStyle(order.status)
                    return (
                      <tr key={order.order_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">#{order.order_id}</div>
                            <div className="text-xs text-gray-500">{order.items_count} ingredientes</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{order.supplier_name}</div>
                          {order.supplier_email && (
                            <div className="text-xs text-gray-500">{order.supplier_email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.className}`}>
                            {statusStyle.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(order.order_date).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(order.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {(order.first_name || order.last_name) ? (
                            <div className="flex items-center text-sm text-gray-900">
                              <User className="h-4 w-4 mr-1 text-gray-400" />
                              {order.first_name} {order.last_name}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleOrderClick(order.order_id)}
                            className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {historyData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((historyData.pagination.currentPage - 1) * historyData.pagination.recordsPerPage) + 1} a{' '}
                {Math.min(historyData.pagination.currentPage * historyData.pagination.recordsPerPage, historyData.pagination.totalRecords)} de{' '}
                {historyData.pagination.totalRecords} resultados
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(historyData.pagination.currentPage - 1)}
                  disabled={!historyData.pagination.hasPrev}
                  className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                
                <span className="text-sm text-gray-700">
                  Página {historyData.pagination.currentPage} de {historyData.pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(historyData.pagination.currentPage + 1)}
                  disabled={!historyData.pagination.hasNext}
                  className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {historyData.orders.length === 0 && (
            <div className="text-center py-12">
              <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron pedidos</h3>
              <p className="text-gray-500">Intenta ajustar los filtros para encontrar más resultados</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}