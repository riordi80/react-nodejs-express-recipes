'use client'

import { useState } from 'react'
import { Calendar, Truck, Package, User, FileText, Check, Trash2, Eye } from 'lucide-react'
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

interface OrderCardProps {
  order: Order
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
        className: 'bg-yellow-100 text-yellow-800',
        bgColor: 'bg-yellow-50'
      }
    case 'ordered':
      return {
        label: 'Confirmado',
        className: 'bg-blue-100 text-blue-800',
        bgColor: 'bg-blue-50'
      }
    case 'delivered':
      return {
        label: 'Recibido',
        className: 'bg-green-100 text-green-800',
        bgColor: 'bg-green-50'
      }
    case 'cancelled':
      return {
        label: 'Cancelado',
        className: 'bg-red-100 text-red-800',
        bgColor: 'bg-red-50'
      }
    default:
      return {
        label: status,
        className: 'bg-gray-100 text-gray-800',
        bgColor: 'bg-gray-50'
      }
  }
}

export default function OrderCard({ order, onViewOrder, onUpdateStatus, onDeleteOrder }: OrderCardProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const statusStyle = getStatusStyle(order.status)

  const handleCardClick = () => {
    onViewOrder(order.order_id)
  }

  const handleConfirmOrder = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirmModal(true)
  }

  const handleConfirm = async () => {
    await onUpdateStatus(order.order_id, 'confirmed')
    setShowConfirmModal(false)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    await onDeleteOrder(order)
    setShowDeleteModal(false)
  }

  return (
    <>
      <div 
        className={`${statusStyle.bgColor} border border-gray-200 rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow`}
        onClick={handleCardClick}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{order.supplier_name}</h3>
            <p className="text-sm text-gray-500">Pedido #{order.order_id}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.className}`}>
            {statusStyle.label.toUpperCase()}
          </span>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Creado: {new Date(order.order_date).toLocaleDateString('es-ES')}</span>
          </div>

          {order.delivery_date && (
            <div className="flex items-center text-sm text-gray-600">
              <Truck className="h-4 w-4 mr-2" />
              <span>Entrega: {new Date(order.delivery_date).toLocaleDateString('es-ES')}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <Package className="h-4 w-4 mr-2" />
              <span>{order.items_count} ingredientes</span>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(order.total_amount)}
            </div>
          </div>

          {order.notes && (
            <div className="text-sm text-gray-600">
              <FileText className="h-4 w-4 inline mr-2" />
              <span className="italic">
                {order.notes.length > 50 ? `${order.notes.substring(0, 50)}...` : order.notes}
              </span>
            </div>
          )}

          {(order.first_name || order.last_name) && (
            <div className="flex items-center text-sm text-gray-500">
              <User className="h-4 w-4 mr-2" />
              <span>{order.first_name} {order.last_name}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-end space-x-2">
          {order.status === 'pending' && (
            <>
              <button 
                className="inline-flex items-center px-3 py-1 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                onClick={handleConfirmOrder}
              >
                <Check className="h-4 w-4 mr-1" />
                Confirmar
              </button>
              <button 
                className="inline-flex items-center px-3 py-1 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Eliminar
              </button>
            </>
          )}
          {order.status === 'ordered' && (
            <button 
              className="inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
              onClick={handleCardClick}
            >
              <Eye className="h-4 w-4 mr-1" />
              Revisar cantidades
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        title="Confirmar Pedido"
        message={`¿Confirmar el pedido #${order.order_id} al proveedor ${order.supplier_name}?`}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Eliminar Pedido"
        message={`¿Estás seguro de que deseas eliminar el pedido #${order.order_id} al proveedor ${order.supplier_name}?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </>
  )
}