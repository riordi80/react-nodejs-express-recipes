'use client'

import { useState, useEffect } from 'react'
import { X, Package, Calendar, User, FileText, Truck, Edit3, Save, AlertCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { apiGet, apiPut } from '@/lib/api'
import { useToastHelpers } from '@/context/ToastContext'

interface OrderItem {
  ingredient_id: number
  ingredient_name: string
  unit: string
  quantity: number
  unit_price: number
  total_price: number
  current_stock: number
}

interface OrderDetail {
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
  first_name?: string
  last_name?: string
  items: OrderItem[]
}

interface OrderDetailModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: number | null
  onOrderUpdated?: () => void
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
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      }
    case 'ordered':
      return {
        label: 'Confirmado',
        className: 'bg-blue-100 text-blue-800 border-blue-200'
      }
    case 'delivered':
      return {
        label: 'Recibido',
        className: 'bg-green-100 text-green-800 border-green-200'
      }
    case 'cancelled':
      return {
        label: 'Cancelado',
        className: 'bg-red-100 text-red-800 border-red-200'
      }
    default:
      return {
        label: status,
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      }
  }
}

export default function OrderDetailModal({ isOpen, onClose, orderId, onOrderUpdated }: OrderDetailModalProps) {
  const { success, error: showError } = useToastHelpers()
  
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedItems, setEditedItems] = useState<OrderItem[]>([])
  const [saving, setSaving] = useState(false)

  // Load order details
  const loadOrderDetail = async () => {
    if (!orderId) return

    try {
      setLoading(true)
      const response = await apiGet<OrderDetail>(`/supplier-orders/${orderId}`)
      setOrderDetail(response.data)
      setEditedItems(response.data.items || [])
    } catch (error) {
      console.error('Error loading order detail:', error)
      showError('Error al cargar los detalles del pedido', 'Error de Carga')
    } finally {
      setLoading(false)
    }
  }

  // Save edited items
  const saveOrderItems = async () => {
    if (!orderDetail) return

    try {
      setSaving(true)
      await apiPut(`/supplier-orders/${orderDetail.order_id}/items`, {
        items: editedItems.map(item => ({
          ingredient_id: item.ingredient_id,
          quantity: item.quantity,
          unit_price: item.unit_price
        }))
      })
      
      // Reload order detail to get updated totals
      await loadOrderDetail()
      setIsEditing(false)
      success('Cantidades del pedido actualizadas correctamente', 'Pedido Actualizado')
      
      if (onOrderUpdated) {
        onOrderUpdated()
      }
    } catch (error) {
      console.error('Error saving order items:', error)
      showError('Error al actualizar las cantidades', 'Error al Guardar')
    } finally {
      setSaving(false)
    }
  }

  // Handle item quantity change
  const handleQuantityChange = (itemIndex: number, newQuantity: number) => {
    if (newQuantity < 0) return
    
    setEditedItems(prev => prev.map((item, index) => {
      if (index === itemIndex) {
        const updatedItem = { ...item, quantity: newQuantity }
        updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
        return updatedItem
      }
      return item
    }))
  }

  // Handle item price change
  const handlePriceChange = (itemIndex: number, newPrice: number) => {
    if (newPrice < 0) return
    
    setEditedItems(prev => prev.map((item, index) => {
      if (index === itemIndex) {
        const updatedItem = { ...item, unit_price: newPrice }
        updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price
        return updatedItem
      }
      return item
    }))
  }

  // Calculate edited total
  const getEditedTotal = () => {
    return editedItems.reduce((total, item) => total + item.total_price, 0)
  }

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetail()
      setIsEditing(false)
    }
  }, [isOpen, orderId])

  if (!isOpen) return null

  const statusStyle = orderDetail ? getStatusStyle(orderDetail.status) : { label: '', className: '' }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Detalles del Pedido #{orderId}
              </h2>
              {orderDetail && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle.className} mt-1`}>
                  {statusStyle.label}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando detalles...</span>
          </div>
        ) : orderDetail ? (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Truck className="h-4 w-4 mr-2" />
                    <span className="font-medium">Proveedor:</span>
                  </div>
                  <p className="text-gray-900 font-medium">{orderDetail.supplier_name}</p>
                  {orderDetail.supplier_email && (
    
                    <p className="text-sm text-gray-600">{orderDetail.supplier_email}</p>
                  )}
                  {orderDetail.supplier_phone && (
                    <p className="text-sm text-gray-600">{orderDetail.supplier_phone}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">Fechas:</span>
                  </div>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">Pedido:</span> {new Date(orderDetail.order_date).toLocaleDateString('es-ES')}
                  </p>
                  {orderDetail.delivery_date && (
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Entrega:</span> {new Date(orderDetail.delivery_date).toLocaleDateString('es-ES')}
                    </p>
                  )}
                </div>

                {(orderDetail.first_name || orderDetail.last_name) && (
                  <div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <User className="h-4 w-4 mr-2" />
                      <span className="font-medium">Creado por:</span>
                    </div>
                    <p className="text-gray-900">{orderDetail.first_name} {orderDetail.last_name}</p>
                  </div>
                )}

                {orderDetail.notes && (
                  <div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="font-medium">Notas:</span>
                    </div>
                    <p className="text-sm text-gray-900">{orderDetail.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Ingredientes ({orderDetail.items?.length || 0})
                </h3>
                {orderDetail.status === 'ordered' && (
                  <button
                    onClick={() => {
                      if (isEditing) {
                        setEditedItems(orderDetail.items || [])
                        setIsEditing(false)
                      } else {
                        setIsEditing(true)
                      }
                    }}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    {isEditing ? 'Cancelar' : 'Editar Cantidades'}
                  </button>
                )}
              </div>

              {orderDetail.items && orderDetail.items.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ingrediente
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cantidad
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Precio Unit.
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock Actual
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(isEditing ? editedItems : orderDetail.items).map((item, index) => (
                          <tr key={item.ingredient_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.ingredient_name}</div>
                                <div className="text-xs text-gray-500">{item.unit}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              ) : (
                                <span className="text-sm text-gray-900">{item.quantity}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unit_price}
                                  onChange={(e) => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              ) : (
                                <span className="text-sm text-gray-900">{formatCurrency(item.unit_price)}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium text-gray-900">
                                {formatCurrency(item.total_price)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`text-sm ${item.current_stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.current_stock}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No hay ingredientes en este pedido</p>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total del Pedido:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {isEditing 
                    ? formatCurrency(getEditedTotal())
                    : formatCurrency(orderDetail.total_amount)
                  }
                </span>
              </div>
              {isEditing && getEditedTotal() !== orderDetail.total_amount && (
                <div className="mt-2 text-sm text-orange-600">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  El total ha cambiado de {formatCurrency(orderDetail.total_amount)} a {formatCurrency(getEditedTotal())}
                </div>
              )}
            </div>

            {/* Actions */}
            {isEditing && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setEditedItems(orderDetail.items || [])
                    setIsEditing(false)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveOrderItems}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  )}
                  <Save className="h-4 w-4 mr-1" />
                  Guardar Cambios
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No se pudo cargar la información del pedido</p>
          </div>
        )}
      </div>
    </Modal>
  )
}