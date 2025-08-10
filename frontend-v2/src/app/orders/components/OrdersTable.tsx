'use client'

import { useState } from 'react'
import { Eye, Check, Trash2, Calendar, Package, User } from 'lucide-react'
import ConfirmModal from '@/components/ui/ConfirmModal'

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

interface OrdersTableProps {
  orders: Order[]
  onViewOrder: (orderId: number) => void
  onUpdateStatus: (orderId: number, status: string, notes?: string) => Promise<void>
  onDeleteOrder: (order: Order) => Promise<void>
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

export default function OrdersTable({ orders, onViewOrder, onUpdateStatus, onDeleteOrder }: OrdersTableProps) {
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null)
  const [deleteOrder, setDeleteOrder] = useState<Order | null>(null)

  const handleConfirmOrder = async () => {
    if (confirmOrder) {
      await onUpdateStatus(confirmOrder.order_id, 'ordered')
      setConfirmOrder(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (deleteOrder) {
      await onDeleteOrder(deleteOrder)
      setDeleteOrder(null)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <colgroup>
              <col className="w-[15%]" /> {/* Pedido */}
              <col className="w-[20%]" /> {/* Proveedor */}
              <col className="w-[12%]" /> {/* Estado */}
              <col className="w-[12%]" /> {/* Fecha */}
              <col className="w-[12%]" /> {/* Entrega */}
              <col className="w-[10%]" /> {/* Items */}
              <col className="w-[12%]" /> {/* Total */}
              <col className="w-[7%]" />  {/* Acciones */}
            </colgroup>
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
                  Entrega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map(order => {
                const statusStyle = getStatusStyle(order.status)
                return (
                  <tr key={order.order_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">#{order.order_id}</div>
                        {(order.first_name || order.last_name) && (
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <User className="h-3 w-3 mr-1" />
                            {order.first_name} {order.last_name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.supplier_name}</div>
                      {order.notes && (
                        <div className="text-xs text-gray-500 mt-1 italic">
                          {order.notes.length > 30 ? `${order.notes.substring(0, 30)}...` : order.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.className}`}>
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(order.order_date).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.delivery_date ? (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {new Date(order.delivery_date).toLocaleDateString('es-ES')}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-1 text-gray-400" />
                        {order.items_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onViewOrder(order.order_id)}
                          className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => setConfirmOrder(order)}
                              className="p-1 rounded text-green-600 hover:bg-green-50 transition-colors"
                              title="Confirmar pedido"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteOrder(order)}
                              className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar pedido"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmOrder}
        onClose={() => setConfirmOrder(null)}
        onConfirm={handleConfirmOrder}
        title="Confirmar Pedido"
        message={`¿Confirmar el pedido #${confirmOrder?.order_id} al proveedor ${confirmOrder?.supplier_name}?`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        type="info"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteOrder}
        onClose={() => setDeleteOrder(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Pedido"
        message={`¿Estás seguro de que deseas eliminar el pedido #${deleteOrder?.order_id} al proveedor ${deleteOrder?.supplier_name}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </>
  )
}