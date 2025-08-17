import { useState, useCallback } from 'react'
import { apiPut, apiDelete, apiGet } from '@/lib/api'
import { useToastHelpers } from '@/context/ToastContext'
import { usePaginatedTable } from '@/hooks/usePaginatedTable'
import { useSettings } from '@/context/SettingsContext'

export interface Order {
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

export interface OrderFilters {
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

const defaultFilters: OrderFilters = {
  search: '',
  status: {
    pending: true,
    ordered: true,
    delivered: false,
    cancelled: false
  },
  dateFrom: '',
  dateTo: ''
}

export const useActiveOrders = () => {
  const { success, error: showError } = useToastHelpers()
  const { settings } = useSettings()
  const [filters, setFilters] = useState<OrderFilters>(defaultFilters)

  // Function to fetch paginated orders
  const fetchOrders = useCallback(async (params: { 
    page: number; 
    limit: number; 
    sortKey?: string; 
    sortOrder?: 'asc' | 'desc' 
  }) => {
    const searchParams = new URLSearchParams()
    
    // Add pagination params
    searchParams.append('page', params.page.toString())
    searchParams.append('limit', params.limit.toString())
    
    // Add sorting params
    if (params.sortKey && params.sortOrder) {
      searchParams.append('sortKey', params.sortKey)
      searchParams.append('sortOrder', params.sortOrder)
    }
    
    // Add filter params
    if (filters.search.trim()) {
      searchParams.append('search', filters.search.trim())
    }
    
    // Convert status object to comma-separated string for backend
    const selectedStatuses = Object.entries(filters.status)
      .filter(([, isSelected]) => isSelected)
      .map(([status]) => status)
    
    if (selectedStatuses.length > 0) {
      searchParams.append('status', selectedStatuses.join(','))
    }
    
    if (filters.dateFrom) {
      searchParams.append('dateFrom', filters.dateFrom)
    }
    
    if (filters.dateTo) {
      searchParams.append('dateTo', filters.dateTo)
    }
    
    const response = await apiGet<{data: Order[], pagination: any}>(`/supplier-orders/active?${searchParams.toString()}`)
    
    return {
      data: response.data.data,
      pagination: response.data.pagination
    }
  }, [filters])

  // Use paginated table hook
  const {
    sortedData: orders,
    isLoading: loading,
    pagination,
    sortConfig,
    handlePageChange,
    handleSort,
    refresh
  } = usePaginatedTable(fetchOrders, {
    initialPage: 1,
    itemsPerPage: settings.pageSize,
    initialSortKey: 'order_id',
    initialSortDirection: 'desc',
    dependencies: [filters],
    storageKey: 'active-orders-page'
  })

  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: string, notes?: string) => {
    try {
      await apiPut(`/supplier-orders/${orderId}/status`, {
        status: newStatus,
        notes: notes || ''
      })
      
      // Refresh data after update
      refresh()
      
      success(`Pedido #${orderId} actualizado correctamente`, 'Pedido Actualizado')
    } catch {
      console.error('Fixed error in catch block')
      showError('Error al actualizar el estado del pedido', 'Error de Actualización')
    }
  }

  // Delete order
  const deleteOrder = async (order: Order) => {
    try {
      await apiDelete(`/supplier-orders/${order.order_id}`)
      
      // Refresh data after deletion
      refresh()
      
      success(`Pedido #${order.order_id} eliminado correctamente`, 'Pedido Eliminado')
    } catch {
      console.error('Fixed error in catch block')
      showError('Error al eliminar el pedido', 'Error de Eliminación')
    }
  }

  // Load orders (alias for refresh for backwards compatibility)
  const loadOrders = refresh

  // View order details (placeholder for future implementation)
  const viewOrderDetails = async (orderId: number) => {
    try {
      // This would typically open a modal or navigate to a detail page
      console.log('Viewing order details for:', orderId)
    } catch {
      console.error('Fixed error in catch block')
      showError('Error al ver los detalles del pedido', 'Error de Vista')
    }
  }

  return {
    // Data
    orders,
    loading,
    filters,
    pagination,
    sortConfig,

    // Actions
    setFilters,
    loadOrders,
    updateOrderStatus,
    deleteOrder,
    viewOrderDetails,
    handlePageChange,
    handleSort,
    refresh
  }
}