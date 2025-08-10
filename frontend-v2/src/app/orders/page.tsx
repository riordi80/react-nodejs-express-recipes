'use client'

import { useState, useEffect } from 'react'
import { 
  Truck, 
  Euro, 
  Building,
  AlertTriangle, 
  List, 
  History, 
  BarChart3,
  ChevronDown,
  CheckCircle,
  XCircle,
  HelpCircle,
  Clock,
  LayoutGrid,
  Table,
  Filter,
  Search
} from 'lucide-react'

// Components sections
import DashboardSection from './components/DashboardSection'
import ShoppingListSection from './components/ShoppingListSection' 
import ActiveOrdersSection from './components/ActiveOrdersSection'
import SuppliersSection from './components/SuppliersSection'
import HistorySection from './components/HistorySection'

// Modals
import EditIngredientModal from '@/components/modals/EditIngredientModal'
import GenerateOrderModal from '@/components/modals/GenerateOrderModal'
import SupplierWarningModal from '@/components/modals/SupplierWarningModal'
import OrderDetailModal from '@/components/modals/OrderDetailModal'
// import ReportsModal from '@/components/modals/ReportsModal'

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { useToastHelpers } from '@/context/ToastContext'
import { useActiveOrders } from './hooks/useActiveOrders'

// Types
interface Order {
  order_id: number
  supplier_id: number
  supplier_name: string
  status: 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled'
  order_date: string
  delivery_date?: string
  total_cost: number
  notes?: string
  created_at: string
  updated_at: string
}

interface Ingredient {
  ingredient_id: number
  name: string
  unit: string
  base_price: number
  waste_percent: number
  net_price: number
  stock: number
  stock_minimum: number
  is_available: boolean
}

export default function OrdersPage() {
  // Toast helpers
  const { success, error: showError } = useToastHelpers()

  // Active Orders hook
  const activeOrdersHook = useActiveOrders()

  // Main state
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false)

  // Modal states
  const [isEditIngredientOpen, setIsEditIngredientOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const [showGenerateOrderModal, setShowGenerateOrderModal] = useState(false)
  const [showSupplierWarningModal, setShowSupplierWarningModal] = useState(false)
  const [ingredientsWithoutProvider, setIngredientsWithoutProvider] = useState<any[]>([])

  // Order generation states
  const [isGeneratingOrders, setIsGeneratingOrders] = useState(false)
  const [orderGenerationData, setOrderGenerationData] = useState<any>(null)

  // Tab definitions
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'shopping-list', label: 'Lista de Compras', icon: List },
    { id: 'active-orders', label: 'Pedidos Activos', icon: Truck },
    { id: 'suppliers', label: 'Proveedores', icon: Building },
    { id: 'history', label: 'Historial', icon: History },
  ]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.mobile-dropdown')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Initialize data loading
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      // Load initial data here
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate loading
    } catch (error) {
      console.error('Error loading initial data:', error)
      showError('Error al cargar los datos iniciales', 'Error de Carga')
    } finally {
      setLoading(false)
    }
  }

  // Tab management
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    setIsDropdownOpen(false)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  // Ingredient management
  const handleIngredientRowClick = async (ingredientId: number) => {
    try {
      const response = await apiGet<Ingredient>(`/ingredients/${ingredientId}`)
      setSelectedIngredient(response.data)
      setIsEditIngredientOpen(true)
    } catch (error) {
      console.error('Error loading ingredient:', error)
      showError('Error al cargar el ingrediente', 'Error de Carga')
    }
  }

  const handleSaveIngredient = async (updatedIngredient: Ingredient): Promise<boolean> => {
    try {
      await apiPut(`/ingredients/${updatedIngredient.ingredient_id}`, updatedIngredient)
      setIsEditIngredientOpen(false)
      setSelectedIngredient(null)
      success('Ingrediente actualizado correctamente', 'Ingrediente Actualizado')
      return true
    } catch (error) {
      console.error('Error saving ingredient:', error)
      showError('Error al guardar el ingrediente', 'Error al Guardar')
      return false
    }
  }

  // Order generation management
  const handleGenerateOrders = (shoppingList: any, showEventSelection: boolean) => {
    if (!shoppingList?.ingredientsBySupplier?.length) {
      return
    }

    // Check for ingredients without supplier
    const suppliersWithoutProvider = shoppingList.ingredientsBySupplier.filter(
      (supplier: any) => supplier.supplierName === 'Sin Proveedor Asignado'
    )

    if (suppliersWithoutProvider.length > 0) {
      // Extract ingredients without provider for the modal
      const ingredientsWithoutProvider = suppliersWithoutProvider.flatMap((supplier: any) => 
        supplier.ingredients.map((ingredient: any) => ({
          ingredientId: ingredient.ingredientId,
          name: ingredient.name,
          quantity: ingredient.toBuy,
          unit: ingredient.unit,
          basePrice: ingredient.pricePerUnit
        }))
      )
      setIngredientsWithoutProvider(ingredientsWithoutProvider)
      
      // Prepare order data for potential "continue anyway" scenario
      setOrderGenerationData({
        suppliers: shoppingList.ingredientsBySupplier, // All suppliers including "Sin Proveedor"
        totalCost: shoppingList.totalCost,
        generatedFrom: shoppingList.filters?.manual ? 'manual' : 
                      (showEventSelection ? 'events' : 'shopping-list'),
        sourceEventIds: shoppingList.filters?.selectedEventIds || []
      })
      
      setShowSupplierWarningModal(true)
      return
    }

    // Filter real suppliers
    const realSuppliers = shoppingList.ingredientsBySupplier.filter(
      (supplier: any) => supplier.supplierName !== 'Sin Proveedor Asignado'
    )

    if (realSuppliers.length === 0) {
      showError('No hay proveedores válidos para generar pedidos', 'Sin Proveedores')
      return
    }

    setOrderGenerationData({
      suppliers: realSuppliers,
      totalCost: realSuppliers.reduce((total: number, supplier: any) => total + supplier.supplierTotal, 0),
      generatedFrom: shoppingList.filters?.manual ? 'manual' : 
                    (showEventSelection ? 'events' : 'shopping-list'),
      sourceEventIds: shoppingList.filters?.selectedEventIds || []
    })
    setShowGenerateOrderModal(true)
  }

  const confirmGenerateOrders = async (deliveryDate: string, notes: string) => {
    if (!orderGenerationData) return false

    try {
      setIsGeneratingOrders(true)
      
      const response = await apiPost('/supplier-orders/generate', {
        suppliers: orderGenerationData.suppliers,
        deliveryDate: deliveryDate || null,
        notes: notes || '',
        generatedFrom: orderGenerationData.generatedFrom,
        sourceEventIds: orderGenerationData.sourceEventIds || []
      })

      if (response.data.success) {
        // Reload active orders data
        activeOrdersHook.loadOrders()
        
        // Switch to active orders tab to see created orders
        setActiveTab('active-orders')
        
        // Close modal and clean data
        setShowGenerateOrderModal(false)
        setOrderGenerationData(null)
        
        success('Pedidos generados correctamente', 'Pedidos Creados')
        return true
      }
      return false
    } catch (error) {
      console.error('Error generating orders:', error)
      showError('Error al generar los pedidos', 'Error al Generar')
      return false
    } finally {
      setIsGeneratingOrders(false)
    }
  }

  // Active Orders handlers
  const handleOrderClick = (orderId: number) => {
    setSelectedOrderId(orderId)
    setShowOrderDetailModal(true)
  }

  const handleUpdateOrderStatus = async (orderId: number, status: string, notes?: string) => {
    await activeOrdersHook.updateOrderStatus(orderId, status, notes)
  }

  const handleDeleteOrder = async (order: any) => {
    await activeOrdersHook.deleteOrder(order)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Truck className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Pedidos</h1>
        </div>
        <p className="text-gray-600">
          Gestiona las compras de ingredientes de forma inteligente y optimizada
        </p>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden md:flex border-b border-gray-200 mb-6">
        {tabs.map(tab => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange(tab.id)}
            >
              <IconComponent className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Mobile Dropdown */}
      <div className="md:hidden mb-6">
        <div className="relative mobile-dropdown">
          <button
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            onClick={toggleDropdown}
          >
            <div className="flex items-center space-x-2">
              {(() => {
                const activeTabData = tabs.find(tab => tab.id === activeTab)
                const IconComponent = activeTabData?.icon || BarChart3
                return (
                  <>
                    <IconComponent className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{activeTabData?.label}</span>
                  </>
                )
              })()}
            </div>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {tabs.map(tab => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={`w-full flex items-center space-x-2 px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                      activeTab === tab.id ? 'bg-orange-50 text-orange-600' : 'text-gray-900'
                    }`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {activeTab === 'dashboard' && (
          <DashboardSection onNavigateToTab={setActiveTab} />
        )}
        
        {activeTab === 'shopping-list' && (
          <ShoppingListSection
            onIngredientRowClick={handleIngredientRowClick}
            onNavigateToActiveOrders={() => setActiveTab('active-orders')}
            isModeDropdownOpen={isModeDropdownOpen}
            setIsModeDropdownOpen={setIsModeDropdownOpen}
            onGenerateOrders={handleGenerateOrders}
          />
        )}
        
        {activeTab === 'active-orders' && (
          <ActiveOrdersSection
            orders={activeOrdersHook.orders}
            loading={activeOrdersHook.loading}
            filters={activeOrdersHook.filters}
            onFiltersChange={activeOrdersHook.setFilters}
            onOrderClick={handleOrderClick}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onDeleteOrder={handleDeleteOrder}
          />
        )}
        
        {activeTab === 'suppliers' && (
          <SuppliersSection
            onSupplierClick={(supplierId) => {
              // Navigate to supplier detail page with orders tab
              window.location.href = `/suppliers/${supplierId}#orders`
            }}
          />
        )}
        
        {activeTab === 'history' && (
          <HistorySection
            onOrderClick={handleOrderClick}
          />
        )}
      </div>

      {/* Modals */}
      <EditIngredientModal
        isOpen={isEditIngredientOpen}
        onClose={() => {
          setIsEditIngredientOpen(false)
          setSelectedIngredient(null)
        }}
        ingredient={selectedIngredient}
        onSave={handleSaveIngredient}
      />

      <GenerateOrderModal
        isOpen={showGenerateOrderModal}
        onClose={() => {
          setShowGenerateOrderModal(false)
          setOrderGenerationData(null)
        }}
        onConfirm={confirmGenerateOrders}
        orderData={orderGenerationData}
        isGenerating={isGeneratingOrders}
      />

      <SupplierWarningModal
        isOpen={showSupplierWarningModal}
        onClose={() => {
          setShowSupplierWarningModal(false)
          setIngredientsWithoutProvider([])
        }}
        ingredientsWithoutProvider={ingredientsWithoutProvider}
        onContinueAnyway={() => {
          setShowSupplierWarningModal(false)
          setIngredientsWithoutProvider([])
          // Order data is already prepared, just show the generate modal
          setShowGenerateOrderModal(true)
        }}
        onGoToSuppliers={() => {
          setShowSupplierWarningModal(false)
          // Navigate to suppliers page - would need router here
          // For now, just close the modal
        }}
      />

      <OrderDetailModal
        isOpen={showOrderDetailModal}
        onClose={() => {
          setShowOrderDetailModal(false)
          setSelectedOrderId(null)
        }}
        orderId={selectedOrderId}
        onOrderUpdated={() => {
          // Reload active orders when an order is updated
          activeOrdersHook.loadOrders()
        }}
      />
    </div>
  )
}