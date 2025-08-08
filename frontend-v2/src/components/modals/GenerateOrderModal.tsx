'use client'

import { useState } from 'react'
import { Truck, Euro, X, Calendar, FileText, Info } from 'lucide-react'

interface SupplierOrderData {
  supplierId: number
  supplierName: string
  ingredients: any[]
  supplierTotal: number
}

interface OrderGenerationData {
  suppliers: SupplierOrderData[]
  totalCost: number
  generatedFrom: 'manual' | 'events' | 'shopping-list'
  sourceEventIds?: number[]
}

interface GenerateOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (deliveryDate: string, notes: string) => Promise<boolean>
  orderData: OrderGenerationData | null
  isGenerating?: boolean
}

// Format currency helper
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount)
}

export default function GenerateOrderModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  orderData, 
  isGenerating = false 
}: GenerateOrderModalProps) {
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await onConfirm(deliveryDate, notes)
    if (success) {
      setDeliveryDate('')
      setNotes('')
    }
  }

  const handleClose = () => {
    if (!isGenerating) {
      setDeliveryDate('')
      setNotes('')
      onClose()
    }
  }

  if (!isOpen || !orderData) return null

  // Calculate minimum date (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  const getOriginLabel = (origin: string) => {
    switch (origin) {
      case 'manual':
        return 'Pedido Manual'
      case 'events':
        return 'Eventos Específicos'
      default:
        return 'Lista Automática'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Truck className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Confirmar Generación de Pedidos
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Resumen de Pedidos a Generar
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{orderData.suppliers.length}</div>
                  <div className="text-sm text-gray-500">Proveedores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{formatCurrency(orderData.totalCost)}</div>
                  <div className="text-sm text-gray-500">Costo Total</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900">{getOriginLabel(orderData.generatedFrom)}</div>
                  <div className="text-sm text-gray-500">Origen</div>
                </div>
              </div>
            </div>
          </div>

          {/* Suppliers Preview */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Pedidos por Proveedor:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {orderData.suppliers.map(supplier => (
                <div key={supplier.supplierId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{supplier.supplierName}</div>
                    <div className="text-sm text-gray-500">
                      {supplier.ingredients.length} ingredientes
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(supplier.supplierTotal)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha de Entrega Deseada (opcional)
              </label>
              <input
                type="date"
                id="deliveryDate"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={minDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-500 mt-1">
                Si no se especifica, el proveedor determinará la fecha de entrega
              </p>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                Notas Adicionales (opcional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={3}
                placeholder="Ej: Pedido urgente, instrucciones especiales de entrega..."
                disabled={isGenerating}
              />
            </div>
          </form>

          {/* Important Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-blue-900 mb-2">
                  Información importante:
                </div>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Se creará un pedido separado para cada proveedor</li>
                  <li>• Todos los pedidos comenzarán con estado "Pendiente"</li>
                  <li>• Podrás gestionar cada pedido individualmente en "Pedidos Activos"</li>
                  <li>• Los proveedores sin asignación aparecerán como "Sin Proveedor Asignado"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button 
            type="button" 
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50" 
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            onClick={handleSubmit}
            disabled={isGenerating}
          >
            <Euro className="h-4 w-4" />
            <span>
              {isGenerating ? 'Generando...' : `Generar ${orderData.suppliers.length} Pedidos`}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}