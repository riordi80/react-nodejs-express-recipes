'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Euro, 
  Truck, 
  AlertTriangle, 
  Info,
  TrendingUp,
  Package,
  Clock
} from 'lucide-react'
import { apiGet } from '@/lib/api'
import { useToastHelpers } from '@/context/ToastContext'
import QuickActions from './QuickActions'

interface DashboardMetrics {
  monthlySpending: number
  todayDeliveries: number
  potentialSavings: number
  lowStockItems: number
  savingsDetail: SavingsDetail[]
}

interface SavingsDetail {
  ingredient_name: string
  pedidos_afectados: string
  num_pedidos: number
  cantidad_total_necesaria: string
  package_size: string
  package_unit: string
  paquetes_separados: number
  paquetes_consolidados: number
  paquetes_ahorrados: number
  ahorro_euros: number
}

interface DashboardSectionProps {
  onNavigateToTab: (tabId: string) => void
}

export default function DashboardSection({ onNavigateToTab }: DashboardSectionProps) {
  const { error: showError } = useToastHelpers()
  
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    monthlySpending: 0,
    todayDeliveries: 0,
    potentialSavings: 0,
    lowStockItems: 0,
    savingsDetail: []
  })
  const [loading, setLoading] = useState(true)

  // Format quantity with correct unit
  const formatQuantity = (paquetes: number, packageSize: string, packageUnit: string) => {
    const totalQuantity = paquetes * parseFloat(packageSize)
    
    // If kg and quantity is less than 1, show in grams
    if (packageUnit === 'kg' && totalQuantity < 1) {
      return `${(totalQuantity * 1000).toFixed(0)}gr`
    }
    
    // If liter and quantity is less than 1, show in ml
    if (packageUnit === 'litro' && totalQuantity < 1) {
      return `${(totalQuantity * 1000).toFixed(0)}ml`
    }
    
    // For other cases, maintain original unit
    return `${totalQuantity.toFixed(2)}${packageUnit === 'kg' ? 'kg' : packageUnit === 'litro' ? 'L' : ` ${packageUnit}`}`
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await apiGet<DashboardMetrics>('/supplier-orders/dashboard')
      
      setMetrics({
        monthlySpending: response.data.monthlySpending || 0,
        todayDeliveries: response.data.todayDeliveries || 0,
        potentialSavings: response.data.potentialSavings || 0,
        lowStockItems: response.data.lowStockItems || 0,
        savingsDetail: response.data.savingsDetail || []
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      showError('Error al cargar los datos del dashboard', 'Error de Carga')
      
      // Fallback to default data on error
      setMetrics({
        monthlySpending: 0,
        todayDeliveries: 0,
        potentialSavings: 0,
        lowStockItems: 0,
        savingsDetail: []
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-orange-100 p-2 rounded-lg">
            <BarChart3 className="h-6 w-6 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Compras</h2>
        </div>
        
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-orange-100 p-2 rounded-lg">
          <BarChart3 className="h-6 w-6 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de Compras</h2>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Monthly Spending */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gasto Mensual</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(metrics.monthlySpending)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Último mes</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Euro className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Today Deliveries */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entregas Hoy</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {metrics.todayDeliveries}
              </p>
              <p className="text-xs text-gray-500 mt-1">Entregas completadas hoy</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <Truck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Potential Savings */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ahorro Potencial</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                {formatCurrency(metrics.potentialSavings)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Por consolidación de ingredientes</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {metrics.lowStockItems}
              </p>
              <p className="text-xs text-gray-500 mt-1">Requieren reposición</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Potential Savings Detail */}
      {metrics.savingsDetail.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Info className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Detalle del Ahorro Potencial
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Ingredientes que aparecen en múltiples pedidos pendientes y podrían consolidarse:
          </p>

          <div className="space-y-4">
            {metrics.savingsDetail.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="font-semibold text-gray-900 mb-2">
                  {item.ingredient_name}
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {item.pedidos_afectados}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Pedidos:</span>
                    <div className="text-gray-900">{item.num_pedidos}</div>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Necesario:</span>
                    <div className="text-blue-600">{parseFloat(item.cantidad_total_necesaria).toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Unidad venta:</span>
                    <div className="text-gray-600">{parseFloat(item.package_size).toFixed(2)} {item.package_unit}</div>
                  </div>
                  <div>
                    <span className="font-medium text-red-700">Separados:</span>
                    <div className="text-red-600">{formatQuantity(item.paquetes_separados, item.package_size, item.package_unit)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Consolidado:</span>
                    <div className="text-green-600">{formatQuantity(item.paquetes_consolidados, item.package_size, item.package_unit)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-orange-700">Ahorrados:</span>
                    <div className="text-orange-600 font-semibold">{formatQuantity(item.paquetes_ahorrados, item.package_size, item.package_unit)}</div>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Ahorro:</span>
                    <div className="text-green-600 font-semibold">{formatCurrency(item.ahorro_euros)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <span className="font-medium">Explicación:</span> El ahorro se calcula por consolidación de paquetes. 
                Si necesitas mantequilla en 2 pedidos separados (0.3kg + 0.4kg), tendrías que comprar 2 paquetes de 1kg. 
                Consolidando, solo necesitas 1 paquete de 1kg. El ahorro es el precio de los paquetes extras evitados.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions onNavigateToTab={onNavigateToTab} />
    </div>
  )
}