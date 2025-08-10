import { useState, useEffect } from 'react'
import { apiGet, apiPut, apiDelete } from '@/lib/api'
import { useToastHelpers } from '@/context/ToastContext'

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
  
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<OrderFilters>(defaultFilters)

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await apiGet<Order[]>('/supplier-orders/active')
      setOrders(response.data)
    } catch (error) {
      console.error('Error loading orders:', error)
      showError('Error al cargar los pedidos', 'Error de Carga')
    } finally {
      setLoading(false)
    }
  }

  // Filter orders based on current filters
  const applyFilters = () => {
    let filtered = [...orders]

    // Filter by search term
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(order => 
        order.order_id.toString().includes(searchTerm) ||
        order.supplier_name.toLowerCase().includes(searchTerm)
      )
    }

    // Filter by status
    const selectedStatuses = Object.entries(filters.status)
      .filter(([_, isSelected]) => isSelected)
      .map(([status, _]) => status)
    
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(order => selectedStatuses.includes(order.status))
    }

    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(order => new Date(order.order_date) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(order => new Date(order.order_date) <= toDate)
    }

    setFilteredOrders(filtered)
  }

  // Update order status
  const updateOrderStatus = async (orderId: number, newStatus: string, notes?: string) => {
    try {
      await apiPut(`/supplier-orders/${orderId}/status`, {
        status: newStatus,
        notes: notes || ''
      })
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.order_id === orderId 
            ? { ...order, status: newStatus as Order['status'], notes: notes || order.notes }
            : order
        )
      )
      
      success(`Pedido #${orderId} actualizado correctamente`, 'Pedido Actualizado')
    } catch (error) {
      console.error('Error updating order status:', error)
      showError('Error al actualizar el estado del pedido', 'Error de Actualización')
    }
  }

  // Delete order
  const deleteOrder = async (order: Order) => {
    try {
      await apiDelete(`/supplier-orders/${order.order_id}`)
      
      // Remove from local state
      setOrders(prevOrders => 
        prevOrders.filter(o => o.order_id !== order.order_id)
      )
      
      success(`Pedido #${order.order_id} eliminado correctamente`, 'Pedido Eliminado')
    } catch (error) {
      console.error('Error deleting order:', error)
      showError('Error al eliminar el pedido', 'Error de Eliminación')
    }
  }

  // View order details (placeholder for future implementation)
  const viewOrderDetails = async (orderId: number) => {
    try {
      // This would typically open a modal or navigate to a detail page
      console.log('Viewing order details for:', orderId)
    } catch (error) {
      console.error('Error viewing order details:', error)
      showError('Error al ver los detalles del pedido', 'Error de Vista')
    }
  }

  // Effects
  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [orders, filters])

  return {
    // Data
    orders: filteredOrders,
    loading,
    filters,

    // Actions
    setFilters,
    loadOrders,
    updateOrderStatus,
    deleteOrder,
    viewOrderDetails
  }
}