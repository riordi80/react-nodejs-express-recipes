'use client'

import { useState, useEffect } from 'react'
import { Package, Star, TrendingUp, Clock, Mail, Phone, Eye } from 'lucide-react'
import { apiGet } from '@/lib/api'
import { useToastHelpers } from '@/context/ToastContext'

interface SupplierAnalysis {
  id: number
  name: string
  email?: string
  phone?: string
  totalOrders: number
  totalSpent: number
  averageDeliveryTime: number | null
  onTimeDeliveries: number
  qualityRating: number
  priceRating: number
  lastOrder: string | null
  ingredientsCount: number
  averageIngredientPrice: number
  ordersByStatus: {
    pending: number
    ordered: number
    delivered: number
    cancelled: number
  }
}

interface SuppliersSectionProps {
  onSupplierClick?: (supplierId: number) => void
}

// Format currency helper
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount)
}

// Get rating color
const getRatingColor = (rating: number) => {
  if (rating >= 4) return 'text-green-600'
  if (rating >= 3) return 'text-yellow-600'
  return 'text-red-600'
}

// Render star rating
const StarRating = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300'
          }`}
        />
      ))}
      <span className={`text-sm font-medium ml-1 ${getRatingColor(rating)}`}>
        {rating.toFixed(1)}
      </span>
    </div>
  )
}

export default function SuppliersSection({ onSupplierClick }: SuppliersSectionProps) {
  const { error: showError } = useToastHelpers()
  
  const [suppliers, setSuppliers] = useState<SupplierAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  // Load suppliers analysis
  const loadSuppliersAnalysis = async () => {
    try {
      setLoading(true)
      const response = await apiGet<SupplierAnalysis[]>('/supplier-orders/suppliers/analysis')
      setSuppliers(response.data)
    } catch (error) {
      console.error('Error loading suppliers analysis:', error)
      showError('Error al cargar el análisis de proveedores', 'Error de Carga')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliersAnalysis()
  }, [])

  const handleSupplierClick = (supplierId: number) => {
    if (onSupplierClick) {
      onSupplierClick(supplierId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="bg-green-100 p-2 rounded-lg">
          <Package className="h-6 w-6 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Análisis de Proveedores</h2>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Cargando análisis...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && suppliers.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proveedores con pedidos</h3>
          <p className="text-gray-500">Los proveedores aparecerán aquí una vez que tengan pedidos registrados</p>
        </div>
      )}

      {/* Suppliers Grid */}
      {!loading && suppliers.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
                  <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Gasto Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(suppliers.reduce((total, s) => total + s.totalSpent, 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tiempo Promedio Entrega</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {suppliers.length > 0 
                      ? Math.round(suppliers.reduce((sum, s) => sum + (s.averageDeliveryTime || 0), 0) / suppliers.length)
                      : 0} días
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Suppliers List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSupplierClick(supplier.id)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {supplier.name}
                      </h3>
                      {supplier.email && (
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Mail className="h-4 w-4 mr-1" />
                          {supplier.email}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-1" />
                          {supplier.phone}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSupplierClick(supplier.id)
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Pedidos</p>
                      <p className="text-lg font-semibold text-gray-900">{supplier.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Gasto Total</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(supplier.totalSpent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Ingredientes</p>
                      <p className="text-lg font-semibold text-gray-900">{supplier.ingredientsCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Entregas a Tiempo</p>
                      <p className="text-lg font-semibold text-gray-900">{supplier.onTimeDeliveries.toFixed(0)}%</p>
                    </div>
                  </div>

                  {/* Ratings */}
                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Calidad del Servicio</span>
                      </div>
                      <StarRating rating={supplier.qualityRating} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Competitividad de Precios</span>
                      </div>
                      <StarRating rating={supplier.priceRating} />
                    </div>
                  </div>

                  {/* Order Status Distribution */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Estado de Pedidos</p>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="text-center">
                        <div className="bg-yellow-100 text-yellow-800 rounded px-2 py-1">
                          {supplier.ordersByStatus.pending}
                        </div>
                        <div className="text-gray-500 mt-1">Pendiente</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-blue-100 text-blue-800 rounded px-2 py-1">
                          {supplier.ordersByStatus.ordered}
                        </div>
                        <div className="text-gray-500 mt-1">Confirmado</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-green-100 text-green-800 rounded px-2 py-1">
                          {supplier.ordersByStatus.delivered}
                        </div>
                        <div className="text-gray-500 mt-1">Recibido</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-red-100 text-red-800 rounded px-2 py-1">
                          {supplier.ordersByStatus.cancelled}
                        </div>
                        <div className="text-gray-500 mt-1">Cancelado</div>
                      </div>
                    </div>
                  </div>

                  {/* Last Order */}
                  {supplier.lastOrder && (
                    <div className="text-sm text-gray-500">
                      Último pedido: {new Date(supplier.lastOrder).toLocaleDateString('es-ES')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}