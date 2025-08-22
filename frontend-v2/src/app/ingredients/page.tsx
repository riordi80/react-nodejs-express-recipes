'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePaginatedTable } from '@/hooks/usePaginatedTable'
import SortableTableHeader from '@/components/ui/SortableTableHeader'
import Pagination from '@/components/ui/Pagination'
import { usePageSize } from '@/hooks/usePageSize'
import PaginationSelector from '@/components/ui/PaginationSelector'
import { 
  Package, 
  Plus, 
  Filter, 
  Search, 
  AlertTriangle, 
  Calendar, 
  Sprout,
  Euro,
  Edit,
  Ban,
  TrendingDown,
  Clock
} from 'lucide-react'
import { apiGet, apiPut } from '@/lib/api'
import ConfirmModal from '@/components/ui/ConfirmModal'
import IngredientsCarousel from '@/components/ui/IngredientsCarousel'
import SeasonalIngredientsModal from '@/components/modals/SeasonalIngredientsModal'
import LowStockIngredientsModal from '@/components/modals/LowStockIngredientsModal'
import ExpiringIngredientsModal from '@/components/modals/ExpiringIngredientsModal'
import NoSupplierIngredientsModal from '@/components/modals/NoSupplierIngredientsModal'
import { useToastHelpers } from '@/context/ToastContext'
import { useSettings } from '@/context/SettingsContext'

interface Ingredient {
  ingredient_id: number
  name: string
  category?: string
  unit?: string
  cost_per_unit?: number
  base_price?: number
  net_price?: number
  preferred_supplier_price?: number
  stock?: number
  stock_minimum?: number
  is_available: boolean
  expiration_date?: string
  season?: string
  allergens?: string[]
  created_at: string
  updated_at: string
}

interface DashboardWidget {
  lowStock: Array<{
    ingredient_id: number
    name: string
    stock: number
    stock_minimum: number
    unit: string
    deficit: number
    is_available: boolean
  }>
  expiringSoon: Array<{
    ingredient_id: number
    name: string
    expiration_date: string
    stock: number
    unit: string
    days_until_expiry: number
    is_available: boolean
  }>
  seasonal: Array<{
    ingredient_id: number
    name: string
    season: string
    stock: number
    unit: string
    base_price?: number
    net_price?: number
    preferred_supplier_price?: number
    is_available: boolean
  }>
  noSuppliers: Array<{
    ingredient_id: number
    name: string
    category: string
    stock: number
    unit: string
    base_price?: number
    is_available: boolean
  }>
  totals: {
    lowStock: number
    expiringSoon: number
    seasonal: number
    noSuppliers: number
  }
}

const availabilityOptions = [
  { value: 'all', label: 'Todas las disponibilidades' },
  { value: 'available', label: 'Solo disponibles' },
  { value: 'unavailable', label: 'Solo no disponibles' }
]

const stockStatusOptions = [
  { value: 'all', label: 'Todos los stocks' },
  { value: 'low', label: 'Stock bajo' },
  { value: 'withStock', label: 'Con stock' },
  { value: 'noStock', label: 'Sin stock' }
]

const expiryStatusOptions = [
  { value: 'all', label: 'Todas las caducidades' },
  { value: 'critical', label: 'Crítico (≤ 3 días)' },
  { value: 'warning', label: 'Próximo a caducar (4-7 días)' },
  { value: 'expired', label: 'Caducado' },
  { value: 'normal', label: 'Normal (> 7 días)' }
]

const seasonOptions = [
  { value: 'enero', label: 'Enero' },
  { value: 'febrero', label: 'Febrero' },
  { value: 'marzo', label: 'Marzo' },
  { value: 'abril', label: 'Abril' },
  { value: 'mayo', label: 'Mayo' },
  { value: 'junio', label: 'Junio' },
  { value: 'julio', label: 'Julio' },
  { value: 'agosto', label: 'Agosto' },
  { value: 'septiembre', label: 'Septiembre' },
  { value: 'octubre', label: 'Octubre' },
  { value: 'noviembre', label: 'Noviembre' },
  { value: 'diciembre', label: 'Diciembre' },
  { value: 'todo_año', label: 'Todo el año' }
]

export default function IngredientsPage() {
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Settings context - removed unused settings variable  
  useSettings()
  
  // Page-specific pageSize with localStorage persistence
  const { pageSize, setPageSize } = usePageSize('ingredients')
  
  const [widgets, setWidgets] = useState<DashboardWidget>({
    lowStock: [],
    expiringSoon: [],
    seasonal: [],
    noSuppliers: [],
    totals: {
      lowStock: 0,
      expiringSoon: 0,
      seasonal: 0,
      noSuppliers: 0
    }
  })
  const [widgetsLoading, setWidgetsLoading] = useState(true)
  
  // Toast helpers
  const { success, error: showError } = useToastHelpers()
  
  // Función para determinar si mostrar estático basado en cantidad de elementos
  const shouldShowStatic = (ingredients: any[], itemsPerSlide: number = 3) => {
    return ingredients.length <= itemsPerSlide
  }
  
  // Deactivate modal state
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false)
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient | null>(null)
  
  // Seasonal modal state
  const [isSeasonalModalOpen, setIsSeasonalModalOpen] = useState(false)
  
  // Low stock modal state
  const [isLowStockModalOpen, setIsLowStockModalOpen] = useState(false)
  
  // Expiring modal state
  const [isExpiringModalOpen, setIsExpiringModalOpen] = useState(false)
  
  // No suppliers modal state
  const [isNoSuppliersModalOpen, setIsNoSuppliersModalOpen] = useState(false)
  
  // Search input ref for autofocus
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('available')
  const [stockFilter, setStockFilter] = useState('all')
  const [expiryFilter, setExpiryFilter] = useState('all')
  const [seasonFilter, setSeasonFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Function to fetch paginated ingredients
  const fetchIngredients = useCallback(async (params: { 
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
    if (searchTerm.trim()) searchParams.append('search', searchTerm.trim())
    if (availabilityFilter !== 'all') searchParams.append('available', availabilityFilter === 'available' ? 'true' : 'false')
    if (stockFilter !== 'all') searchParams.append('stockStatus', stockFilter)
    if (expiryFilter !== 'all') searchParams.append('expiryStatus', expiryFilter)
    if (seasonFilter !== 'all') searchParams.append('season', seasonFilter)

    const response = await apiGet<{data: Ingredient[], pagination: any}>(`/ingredients?${searchParams.toString()}`)
    
    // Normalize data: convert string numbers to actual numbers
    const normalizedIngredients = response.data.data.map((ingredient: any) => ({
      ...ingredient,
      base_price: ingredient.base_price ? parseFloat(ingredient.base_price) : null,
      net_price: ingredient.net_price ? parseFloat(ingredient.net_price) : null,
      preferred_supplier_price: ingredient.preferred_supplier_price ? parseFloat(ingredient.preferred_supplier_price) : null,
      stock: ingredient.stock ? parseFloat(ingredient.stock) : null,
      stock_minimum: ingredient.stock_minimum ? parseFloat(ingredient.stock_minimum) : null,
      waste_percent: ingredient.waste_percent ? parseFloat(ingredient.waste_percent) : null,
      calories_per_100g: ingredient.calories_per_100g ? parseFloat(ingredient.calories_per_100g) : null,
      protein_per_100g: ingredient.protein_per_100g ? parseFloat(ingredient.protein_per_100g) : null,
      carbs_per_100g: ingredient.carbs_per_100g ? parseFloat(ingredient.carbs_per_100g) : null,
      fat_per_100g: ingredient.fat_per_100g ? parseFloat(ingredient.fat_per_100g) : null,
      is_available: Boolean(ingredient.is_available)
    }))
    
    return {
      data: normalizedIngredients,
      pagination: response.data.pagination
    }
  }, [searchTerm, availabilityFilter, stockFilter, expiryFilter, seasonFilter])

  // Use paginated table hook
  const {
    sortedData: sortedIngredients,
    isLoading: loading,
    pagination,
    sortConfig,
    handlePageChange,
    handleSort,
    refresh
  } = usePaginatedTable(fetchIngredients, {
    initialPage: 1,
    itemsPerPage: pageSize,
    initialSortKey: 'name',
    dependencies: [searchTerm, availabilityFilter, stockFilter, expiryFilter, seasonFilter, pageSize],
    storageKey: 'ingredients-page',
    tableId: 'ingredients'
  })

  // Autofocus search input on page load (desktop only)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        // Only autofocus on desktop devices
        const isMobile = window.innerWidth < 768 || 'ontouchstart' in window
        if (!isMobile) {
          searchInputRef.current.focus()
        }
      }
    }, 100) // Pequeño delay para asegurar que el DOM está listo
    
    return () => clearTimeout(timer)
  }, [])

  const loadWidgets = async () => {
    try {
      setWidgetsLoading(true)
      const response = await apiGet<DashboardWidget>('/ingredients/dashboard-widgets')
      setWidgets(response.data)
    } catch (err: unknown) {
      console.error('Error loading widgets:', err)
    } finally {
      setWidgetsLoading(false)
    }
  }

  // Initialize app - single effect to prevent multiple renders
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load widgets data
        await loadWidgets()
      } catch {
        console.error('Fixed error in catch block')
      } finally {
        setIsInitialized(true)
      }
    }

    initializeApp()
  }, [])

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  const getDaysUntilExpiry = (dateString?: string) => {
    if (!dateString) return null
    const expiry = new Date(dateString)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }


  const getStockStatus = (ingredient: Ingredient) => {
    const stock = ingredient.stock ?? 0
    const stockMin = ingredient.stock_minimum ?? 0
    
    if (stock === 0) return { label: 'Sin stock', color: 'bg-red-100 text-red-800' }
    if (stock < stockMin && stockMin > 0) return { label: 'Stock bajo', color: 'bg-yellow-100 text-yellow-800' }
    return { label: 'Stock OK', color: 'bg-green-100 text-green-800' }
  }

  const getExpiryStatusDisplay = (ingredient: Ingredient) => {
    if (!ingredient.expiration_date) return null
    const days = getDaysUntilExpiry(ingredient.expiration_date)
    if (days === null) return null
    
    if (days < 0) return { label: 'Caducado', color: 'bg-red-500 text-white' }
    if (days <= 3) return { label: `${days}d`, color: 'bg-red-100 text-red-800' }
    if (days <= 7) return { label: `${days}d`, color: 'bg-yellow-100 text-yellow-800' }
    return { label: `${days}d`, color: 'bg-green-100 text-green-800' }
  }

  // Deactivate handlers
  const openDeactivateModal = (ingredient: Ingredient) => {
    setCurrentIngredient(ingredient)
    setIsDeactivateOpen(true)
  }

  const handleDeactivate = async () => {
    if (!currentIngredient) return
    
    try {
      await apiPut(`/ingredients/${currentIngredient.ingredient_id}`, {
        is_available: false
      })
      // Refresh ingredients after deactivation
      refresh()
      setIsDeactivateOpen(false)
      setCurrentIngredient(null)
      
      // Show success toast
      success(`Ingrediente "${currentIngredient.name}" desactivado correctamente`, 'Ingrediente Desactivado')
    } catch {
      console.error('Fixed error in catch block')
      // Show error toast
      showError('No se pudo desactivar el ingrediente. Intente nuevamente.', 'Error al Desactivar')
      // Keep modal open on error
    }
  }

  if (!isInitialized) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-[60px] z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Ingredientes</h1>
          </div>
          
          <Link
            href="/ingredients/new"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="md:hidden">Añadir</span>
          </Link>
        </div>
      </div>

      <div className="p-6">
        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Package className="h-8 w-8 text-orange-600" />
                <h1 className="text-3xl font-bold text-gray-900">Ingredientes</h1>
              </div>
              <p className="text-gray-600">
                Gestiona tu inventario, controla stock y fechas de caducidad
              </p>
            </div>
            
            <Link
              href="/ingredients/new"
              className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Ingrediente</span>
            </Link>
          </div>
        </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        {/* 1º Próximos a Caducar */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              Próximos a Caducar
            </h3>
          </div>
          <IngredientsCarousel 
            ingredients={widgets.expiringSoon} 
            type="expiring"
            isLoading={widgetsLoading}
            itemsPerSlide={3}
            animationType="ticker"
            onViewAll={() => setIsExpiringModalOpen(true)}
            totalCount={widgets.totals.expiringSoon}
            showStatic={shouldShowStatic(widgets.expiringSoon, 3)}
          />
        </div>

        {/* 2º Estacionales */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Sprout className="h-5 w-5 text-orange-600" />
              </div>
              Estacionales
            </h3>
          </div>
          <IngredientsCarousel 
            ingredients={widgets.seasonal} 
            type="seasonal"
            isLoading={widgetsLoading}
            itemsPerSlide={3}
            animationType="ticker"
            onViewAll={() => setIsSeasonalModalOpen(true)}
            totalCount={widgets.totals.seasonal}
            showStatic={shouldShowStatic(widgets.seasonal, 3)}
          />
        </div>

        {/* 3º Stock Crítico */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              Stock Crítico
            </h3>
          </div>
          <IngredientsCarousel 
            ingredients={widgets.lowStock} 
            type="lowStock"
            isLoading={widgetsLoading}
            itemsPerSlide={3}
            animationType="ticker"
            onViewAll={() => setIsLowStockModalOpen(true)}
            totalCount={widgets.totals.lowStock}
            showStatic={shouldShowStatic(widgets.lowStock, 3)}
          />
        </div>

        {/* 4º Sin Proveedores */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              Sin Proveedor
            </h3>
          </div>
          <IngredientsCarousel 
            ingredients={widgets.noSuppliers} 
            type="noSuppliers"
            isLoading={widgetsLoading}
            itemsPerSlide={3}
            animationType="slide"
            onViewAll={() => setIsNoSuppliersModalOpen(true)}
            totalCount={widgets.totals.noSuppliers}
            showStatic={shouldShowStatic(widgets.noSuppliers, 3)}
          />
        </div>
      </div>

      {/* Filters - Similar to Recipes FilterBar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-4">
          <div className="flex flex-col 2xl:flex-row gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar ingredientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Mobile/Tablet: Only show dropdown */}
            <div className="2xl:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full flex items-center justify-center space-x-2 px-3 py-2 border rounded-lg text-sm transition-colors h-[42px] ${
                  showFilters || (availabilityFilter !== 'all' || stockFilter !== 'all' || expiryFilter !== 'all' || seasonFilter !== 'all')
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
                {(availabilityFilter !== 'all' || stockFilter !== 'all' || expiryFilter !== 'all' || seasonFilter !== 'all') && (
                  <span className="bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {[availabilityFilter !== 'all', stockFilter !== 'all', expiryFilter !== 'all', seasonFilter !== 'all'].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            {/* Very Large Desktop: All filters inline */}
            <div className="hidden 2xl:flex flex-wrap gap-2 flex-shrink-0">
              {/* Availability */}
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm whitespace-nowrap h-[42px]"
              >
                {availabilityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Stock */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm whitespace-nowrap h-[42px]"
              >
                {stockStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Expiry Status */}
              <select
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm whitespace-nowrap h-[42px]"
              >
                {expiryStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Season */}
              <select
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm whitespace-nowrap h-[42px]"
              >
                <option value="all">Temporadas</option>
                {seasonOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Advanced Filters - Only show when dropdown is open (all except very large desktop) */}
        {showFilters && (
          <div className="2xl:hidden border-t border-gray-200 p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Availability */}
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                {availabilityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Stock Status */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                {stockStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Expiry Status */}
              <select
                value={expiryFilter}
                onChange={(e) => setExpiryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                {expiryStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Season */}
              <select
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="all">Todas las temporadas</option>
                {seasonOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Ingredients Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableTableHeader sortKey="name" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                  Ingrediente
                </SortableTableHeader>
                <SortableTableHeader sortKey="stock" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                  Stock
                </SortableTableHeader>
                <SortableTableHeader sortKey="base_price" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                  Precio Base
                </SortableTableHeader>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Caducidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <SortableTableHeader sortKey="" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort} sortable={false} className="text-right">
                  Acciones
                </SortableTableHeader>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedIngredients.map((ingredient) => {
                const stockStatus = getStockStatus(ingredient)
                const expiryStatus = getExpiryStatusDisplay(ingredient)
                
                return (
                  <tr 
                    key={ingredient.ingredient_id} 
                    onClick={() => router.push(`/ingredients/${ingredient.ingredient_id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Package className="h-6 w-6 text-orange-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link 
                            href={`/ingredients/${ingredient.ingredient_id}`}
                            className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors"
                          >
                            {ingredient.name}
                          </Link>
                          <div className="text-sm text-gray-500">
                            {ingredient.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ingredient.stock ?? 0} {ingredient.unit || 'ud'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Mín: {ingredient.stock_minimum ?? 0} {ingredient.unit || 'ud'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Euro className="h-4 w-4 mr-1 text-gray-400" />
                        {(() => {
                          // Prioridad: precio proveedor preferido > precio base > precio neto
                          const price = ingredient.preferred_supplier_price || ingredient.base_price || ingredient.net_price
                          const isUsingBasePrice = !ingredient.preferred_supplier_price && ingredient.base_price
                          
                          if (price && typeof price === 'number') {
                            return (
                              <div>
                                <div>
                                  {Number(price).toLocaleString('es-ES', { 
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 4 
                                  })}
                                </div>
                                {isUsingBasePrice && (
                                  <div className="text-xs text-gray-500">Sin proveedor</div>
                                )}
                              </div>
                            )
                          }
                          return 'Sin precio'
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ingredient.expiration_date ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {formatDate(ingredient.expiration_date)}
                          </span>
                          {expiryStatus && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.color}`}>
                              {expiryStatus.label}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Sin fecha</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.label}
                        </span>
                        {!ingredient.is_available && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            No disponible
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link 
                          href={`/ingredients/${ingredient.ingredient_id}`} 
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeactivateModal(ingredient)
                          }}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded"
                          title="Desactivar ingrediente"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {sortedIngredients.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay ingredientes
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || availabilityFilter !== 'all' || stockFilter !== 'all'
                ? 'No se encontraron ingredientes con los filtros aplicados'
                : 'Comienza añadiendo tu primer ingrediente'
              }
            </p>
            <Link
              href="/ingredients/new"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              {searchTerm || availabilityFilter !== 'all' || stockFilter !== 'all' 
                ? 'Añadir Nuevo Ingrediente' 
                : 'Añadir Primer Ingrediente'
              }
            </Link>
          </div>
        )}
      </div>

      {/* Results Counter, Page Size Selector and Pagination */}
      {pagination && (
        <div className="mt-6 flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-sm text-gray-600">
              Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} ingredientes
            </div>
            
            <PaginationSelector
              currentPageSize={pageSize}
              onPageSizeChange={setPageSize}
              totalItems={pagination.totalItems}
            />
          </div>
          
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

        {/* Deactivate Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeactivateOpen}
          onClose={() => setIsDeactivateOpen(false)}
          onConfirm={handleDeactivate}
          title="Confirmar desactivación"
          message={`¿Seguro que deseas desactivar el ingrediente "${currentIngredient?.name}"? Podrás reactivarlo más tarde.`}
          confirmText="Desactivar"
          cancelText="Cancelar"
          type="warning"
        />

        {/* Seasonal Ingredients Modal */}
        <SeasonalIngredientsModal
          isOpen={isSeasonalModalOpen}
          onClose={() => setIsSeasonalModalOpen(false)}
        />

        {/* Low Stock Ingredients Modal */}
        <LowStockIngredientsModal
          isOpen={isLowStockModalOpen}
          onClose={() => setIsLowStockModalOpen(false)}
        />
        
        {/* Expiring Ingredients Modal */}
        <ExpiringIngredientsModal
          isOpen={isExpiringModalOpen}
          onClose={() => setIsExpiringModalOpen(false)}
        />
        
        {/* No Suppliers Ingredients Modal */}
        <NoSupplierIngredientsModal
          isOpen={isNoSuppliersModalOpen}
          onClose={() => setIsNoSuppliersModalOpen(false)}
        />
      </div>
    </>
  )
}