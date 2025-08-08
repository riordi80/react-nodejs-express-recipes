'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { 
  Package, 
  Plus, 
  Filter, 
  Search, 
  AlertTriangle, 
  Calendar, 
  Sprout,
  Euro,
  Eye,
  Edit,
  Trash2,
  TrendingDown,
  Clock
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToastHelpers } from '@/context/ToastContext'

interface Ingredient {
  ingredient_id: number
  name: string
  category?: string
  unit?: string
  cost_per_unit?: number
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
  }>
  expiringSoon: Array<{
    ingredient_id: number
    name: string
    expiration_date: string
    stock: number
    unit: string
    days_until_expiry: number
  }>
  seasonal: Array<{
    ingredient_id: number
    name: string
    season: string
    is_available: boolean
  }>
  noSuppliers: Array<{
    ingredient_id: number
    name: string
    category: string
  }>
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
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [widgets, setWidgets] = useState<DashboardWidget>({
    lowStock: [],
    expiringSoon: [],
    seasonal: [],
    noSuppliers: []
  })
  const [loading, setLoading] = useState(true)
  const [widgetsLoading, setWidgetsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Toast helpers
  const { success, error: showError } = useToastHelpers()
  
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient | null>(null)
  
  // Search input ref for autofocus
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState('available')
  const [stockFilter, setStockFilter] = useState('all')
  const [expiryFilter, setExpiryFilter] = useState('all')
  const [seasonFilter, setSeasonFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Load data
  useEffect(() => {
    loadIngredients()
    loadWidgets()
  }, [])

  // Autofocus search input on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 100) // Pequeño delay para asegurar que el DOM está listo
    
    return () => clearTimeout(timer)
  }, [])

  const loadIngredients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      // Removido searchTerm - la búsqueda ahora es solo local
      if (availabilityFilter !== 'all') params.append('available', availabilityFilter)
      if (stockFilter !== 'all') params.append('stockStatus', stockFilter)
      if (expiryFilter !== 'all') params.append('expiryStatus', expiryFilter)
      if (seasonFilter !== 'all') params.append('season', seasonFilter)

      const response = await apiGet<Ingredient[]>(`/ingredients?${params.toString()}`)
      setIngredients(response.data)
      setError(null)
    } catch (err: unknown) {
      setError('Error al cargar ingredientes')
      console.error('Error loading ingredients:', err)
    } finally {
      setLoading(false)
    }
  }

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

  // Reload data when NON-SEARCH filters change
  useEffect(() => {
    loadIngredients()
  }, [availabilityFilter, stockFilter, expiryFilter, seasonFilter]) // Removido searchTerm para evitar re-renderizados

  // Filter ingredients locally for real-time filtering (memoized)
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ingredient => {
      const matchesSearch = (ingredient.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (ingredient.category || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchesAvailability = true
      if (availabilityFilter === 'available') matchesAvailability = ingredient.is_available
      if (availabilityFilter === 'unavailable') matchesAvailability = !ingredient.is_available
      
      const stock = ingredient.stock ?? 0
      const stockMin = ingredient.stock_minimum ?? 0
      
      let matchesStock = true
      if (stockFilter === 'low') matchesStock = stock < stockMin && stockMin > 0
      if (stockFilter === 'withStock') matchesStock = stock > 0
      if (stockFilter === 'noStock') matchesStock = stock === 0
      
      // Expiry filter
      let matchesExpiry = true
      if (expiryFilter !== 'all') {
        const expiryStatus = getExpiryStatus(ingredient.expiration_date)
        if (expiryFilter === 'critical') matchesExpiry = expiryStatus === 'critical'
        else if (expiryFilter === 'warning') matchesExpiry = expiryStatus === 'warning'
        else if (expiryFilter === 'expired') matchesExpiry = expiryStatus === 'expired'
        else if (expiryFilter === 'normal') matchesExpiry = expiryStatus === 'normal'
      }
      
      // Season filter
      let matchesSeason = true
      if (seasonFilter !== 'all') {
        const ingredientSeasons = getSeasonStatus(ingredient.season)
        if (ingredientSeasons) {
          if (seasonFilter === 'todo_año') {
            matchesSeason = ingredientSeasons.includes('todo_año')
          } else {
            matchesSeason = ingredientSeasons.includes(seasonFilter)
          }
        } else {
          matchesSeason = false
        }
      }
      
      return matchesSearch && matchesAvailability && matchesStock && matchesExpiry && matchesSeason
    })
  }, [ingredients, searchTerm, availabilityFilter, stockFilter, expiryFilter, seasonFilter])

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

  const getExpiryStatus = (dateString?: string) => {
    if (!dateString) return null
    const days = getDaysUntilExpiry(dateString)
    if (days === null) return null
    
    if (days < 0) return 'expired'
    if (days <= 3) return 'critical'
    if (days <= 7) return 'warning'
    return 'normal'
  }

  const getSeasonStatus = (season?: string) => {
    if (!season) return null
    if (season === 'todo_año') return 'todo_año'
    
    // Si es una cadena separada por comas (múltiples temporadas)
    if (typeof season === 'string' && season.includes(',')) {
      return season.split(',').map(s => s.trim())
    }
    
    return [season]
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

  // Delete handlers
  const openDeleteModal = (ingredient: Ingredient) => {
    setCurrentIngredient(ingredient)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!currentIngredient) return
    
    try {
      await apiDelete(`/ingredients/${currentIngredient.ingredient_id}`)
      // Refresh ingredients after deletion
      await loadIngredients()
      setIsDeleteOpen(false)
      setCurrentIngredient(null)
      
      // Show success toast
      success(`Ingrediente "${currentIngredient.name}" eliminado correctamente`, 'Ingrediente Eliminado')
    } catch (error) {
      console.error('Error al eliminar ingrediente:', error)
      // Show error toast
      showError('No se pudo eliminar el ingrediente. Intente nuevamente.', 'Error al Eliminar')
      // Keep modal open on error
    }
  }

  if (loading) {
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
        {/* Stock Bajo */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
              Stock Crítico
            </h3>
          </div>
          <div className="p-4">
            {widgetsLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : widgets.lowStock.length > 0 ? (
              <div className="space-y-2">
                {widgets.lowStock.slice(0, 3).map((item) => (
                  <div key={item.ingredient_id} className="text-sm">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-red-600">
                      Faltan {item.deficit} {item.unit}
                    </div>
                  </div>
                ))}
                {widgets.lowStock.length > 3 && (
                  <div className="text-xs text-gray-500 pt-2">
                    +{widgets.lowStock.length - 3} más
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Todo en orden</p>
            )}
          </div>
        </div>

        {/* Próximos a Caducar */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              Próximos a Caducar
            </h3>
          </div>
          <div className="p-4">
            {widgetsLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : widgets.expiringSoon.length > 0 ? (
              <div className="space-y-2">
                {widgets.expiringSoon.slice(0, 3).map((item) => (
                  <div key={item.ingredient_id} className="text-sm">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-yellow-600">
                      {item.days_until_expiry} días restantes
                    </div>
                  </div>
                ))}
                {widgets.expiringSoon.length > 3 && (
                  <div className="text-xs text-gray-500 pt-2">
                    +{widgets.expiringSoon.length - 3} más
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nada próximo a caducar</p>
            )}
          </div>
        </div>

        {/* Estacionales */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Sprout className="h-5 w-5 text-orange-600" />
              </div>
              Estacionales
            </h3>
          </div>
          <div className="p-4">
            {widgetsLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : widgets.seasonal.length > 0 ? (
              <div className="space-y-2">
                {widgets.seasonal.slice(0, 3).map((item) => (
                  <div key={item.ingredient_id} className="text-sm">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-green-600 capitalize">
                      {item.season}
                    </div>
                  </div>
                ))}
                {widgets.seasonal.length > 3 && (
                  <div className="text-xs text-gray-500 pt-2">
                    +{widgets.seasonal.length - 3} más
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin ingredientes estacionales</p>
            )}
          </div>
        </div>

        {/* Sin Proveedores */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              Sin Proveedores
            </h3>
          </div>
          <div className="p-4">
            {widgetsLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : widgets.noSuppliers.length > 0 ? (
              <div className="space-y-2">
                {widgets.noSuppliers.slice(0, 3).map((item) => (
                  <div key={item.ingredient_id} className="text-sm">
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-blue-600">
                      {item.category}
                    </div>
                  </div>
                ))}
                {widgets.noSuppliers.length > 3 && (
                  <div className="text-xs text-gray-500 pt-2">
                    +{widgets.noSuppliers.length - 3} más
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Todos tienen proveedores</p>
            )}
          </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingrediente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio/Unidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Caducidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIngredients.map((ingredient) => {
                const stockStatus = getStockStatus(ingredient)
                const expiryStatus = getExpiryStatusDisplay(ingredient)
                
                return (
                  <tr key={ingredient.ingredient_id} className="hover:bg-gray-50">
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
                        {ingredient.cost_per_unit ? 
                          ingredient.cost_per_unit.toLocaleString('es-ES', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2 
                          }) : 
                          'Sin precio'
                        }
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
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link 
                          href={`/ingredients/${ingredient.ingredient_id}`} 
                          className="text-orange-600 hover:text-orange-900 p-1 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => openDeleteModal(ingredient)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
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
        {filteredIngredients.length === 0 && !loading && (
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
              Añadir Primer Ingrediente
            </Link>
          </div>
        )}
      </div>

      {/* Results Counter */}
      {filteredIngredients.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredIngredients.length} de {ingredients.length} ingredientes
        </div>
      )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Confirmar eliminación"
          message={`¿Seguro que deseas eliminar el ingrediente "${currentIngredient?.name}"?`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </div>
    </>
  )
}