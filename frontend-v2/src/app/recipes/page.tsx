'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePaginatedTable } from '@/hooks/usePaginatedTable'
import SortableTableHeader from '@/components/ui/SortableTableHeader'
import Pagination from '@/components/ui/Pagination'
import { 
  BookOpen, 
  Plus, 
  Clock, 
  Users, 
  Euro,
  Edit,
  Trash2,
  Grid3X3,
  List,
  ChefHat
} from 'lucide-react'
import { apiGet, apiDelete } from '@/lib/api'
import FilterBar from '@/components/modules/recipes/FilterBar'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToastHelpers } from '@/context/ToastContext'
import { useSettings } from '@/context/SettingsContext'

interface Recipe {
  recipe_id: number
  name: string
  description?: string
  difficulty: 'easy' | 'medium' | 'hard'
  prep_time?: number
  servings: number
  production_servings?: number
  cost_per_serving?: number
  net_price?: number
  categories?: string
  instructions?: string
  image_url?: string
  allergens?: string[]
  created_at: string
  updated_at: string
}

interface Category {
  category_id: number
  name: string
}

interface Allergen {
  allergen_id?: number
  name: string
}

interface Ingredient {
  ingredient_id: number
  name: string
}

interface FilterOptions {
  categories: string[]
  allergens: string[]
  ingredients: string[]
}

const difficultyLabels = {
  easy: 'Fácil',
  medium: 'Intermedio',
  hard: 'Difícil'
}

const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
}

export default function RecipesPage() {
  const router = useRouter()
  
  // Toast helpers
  const { success, error: showError } = useToastHelpers()
  
  // Settings context
  const { settings } = useSettings()
  
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Search input ref for autofocus  
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Advanced Filters
  const [searchText, setSearchText] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPrepTime, setSelectedPrepTime] = useState<number | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [selectedIngredient, setSelectedIngredient] = useState('')
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  
  // Filter Options from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    allergens: [],
    ingredients: []
  })
  
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null)
  
  // Filter constants
  const difficultyOptions = [
    { value: 'easy', label: 'Fácil' },
    { value: 'medium', label: 'Intermedio' },
    { value: 'hard', label: 'Difícil' }
  ]
  const prepTimeOptions = [15, 30, 45, 60, 90, 120]

  // Function to fetch paginated recipes
  const fetchRecipes = useCallback(async (params: { 
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
    
    // Apply all filters
    if (searchText.trim()) searchParams.append('search', searchText.trim())
    if (selectedCategories.length > 0) searchParams.append('categories', selectedCategories.join(','))
    if (selectedDifficulty) searchParams.append('difficulty', selectedDifficulty)
    if (selectedPrepTime) searchParams.append('prepTime', selectedPrepTime.toString())
    if (selectedIngredient) searchParams.append('ingredient', selectedIngredient)
    if (selectedAllergens.length > 0) searchParams.append('allergens', selectedAllergens.join(','))

    const response = await apiGet<{data: Recipe[], pagination: any}>(`/recipes?${searchParams.toString()}`)
    
    return {
      data: response.data.data,
      pagination: response.data.pagination
    }
  }, [searchText, selectedCategories, selectedDifficulty, selectedPrepTime, selectedIngredient, selectedAllergens])

  // Use paginated table hook
  const {
    sortedData: sortedRecipes,
    isLoading: loading,
    pagination,
    sortConfig,
    handlePageChange,
    handleSort,
    refresh
  } = usePaginatedTable(fetchRecipes, {
    initialPage: 1,
    itemsPerPage: settings.pageSize,
    initialSortKey: 'name',
    dependencies: [searchText, selectedCategories, selectedDifficulty, selectedPrepTime, selectedIngredient, selectedAllergens],
    storageKey: 'recipes-page'
  })

  // Initialize app - single effect to prevent multiple renders
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize view from localStorage
        const savedView = localStorage.getItem('recipes-view-preference') as 'list' | 'grid'
        if (savedView) {
          setView(savedView)
        }

        // Load filter options
        await loadFilterOptions()
      } catch (error) {
        console.error('Error initializing app:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeApp()
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

  // Load filter options from API
  const loadFilterOptions = async () => {
    try {
      const [categoriesRes, allergensRes, ingredientsRes] = await Promise.all([
        apiGet('/recipe-categories'),
        apiGet('/allergens'),
        apiGet('/ingredients')
      ])
      
      setFilterOptions({
        categories: (categoriesRes.data.data || categoriesRes.data || []).map((c: Category) => c.name || c),
        allergens: (allergensRes.data.data || allergensRes.data || []).map((a: Allergen) => a.name || a),
        ingredients: (ingredientsRes.data.data || ingredientsRes.data || []).map((i: Ingredient) => i.name || i)
      })
    } catch (error) {
      console.error('Error loading filter options:', error)
      // Fallback to empty arrays
      setFilterOptions({
        categories: [],
        allergens: [],
        ingredients: []
      })
    }
  }


  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A'
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const formatCurrency = (value: number | null | undefined, decimals: number = 2) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A'
    
    const numValue = parseFloat(value.toString())
    if (isNaN(numValue)) return 'N/A'
    
    const formatted = numValue.toLocaleString('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
    
    return `${formatted}€`
  }

  const getCostPerServing = (recipe: Recipe) => {
    // Ahora cost_per_serving viene calculado dinámicamente desde el backend
    if (recipe.cost_per_serving) {
      return recipe.cost_per_serving
    }
    
    // Fallback: calcular desde net_price si no hay cost_per_serving
    if (recipe.net_price && recipe.servings) {
      return recipe.net_price / recipe.servings
    }
    
    return null
  }

  const handleViewChange = (newView: 'list' | 'grid') => {
    setView(newView)
    if (typeof window !== 'undefined') {
      localStorage.setItem('recipes-view-preference', newView)
    }
  }

  const hasActiveFilters = searchText || selectedCategories.length > 0 || selectedDifficulty || 
                          selectedPrepTime || selectedIngredient || selectedAllergens.length > 0

  // Delete handlers
  const openDeleteModal = (recipe: Recipe) => {
    setCurrentRecipe(recipe)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!currentRecipe) return
    
    try {
      await apiDelete(`/recipes/${currentRecipe.recipe_id}`)
      // Refresh recipes after deletion
      refresh()
      setIsDeleteOpen(false)
      setCurrentRecipe(null)
      
      // Show success toast
      success(`Receta "${currentRecipe.name}" eliminada correctamente`, 'Receta Eliminada')
    } catch (error) {
      console.error('Error al eliminar receta:', error)
      // Show error toast
      showError('No se pudo eliminar la receta. Intente nuevamente.', 'Error al Eliminar')
      // Keep modal open on error
    }
  }

  if (!isInitialized) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
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
              <BookOpen className="h-5 w-5 text-orange-600" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Recetas</h1>
          </div>
          
          <Link
            href="/recipes/new"
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
                <BookOpen className="h-8 w-8 text-orange-600" />
                <h1 className="text-3xl font-bold text-gray-900">Recetas</h1>
              </div>
              <p className="text-gray-600">
                Descubre, crea y gestiona todas tus recetas favoritas
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* View Toggle */}
              <div className="bg-white border border-gray-200 rounded-lg p-1 flex">
                <button
                  onClick={() => handleViewChange('list')}
                  className={`p-2 rounded ${
                    view === 'list' 
                      ? 'bg-orange-100 text-orange-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleViewChange('grid')}
                  className={`p-2 rounded ${
                    view === 'grid' 
                      ? 'bg-orange-100 text-orange-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
              </div>

              <Link
                href="/recipes/new"
                className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Nueva Receta</span>
              </Link>
            </div>
          </div>
        </div>

      {/* Advanced Filters */}
      <FilterBar
        searchInputRef={searchInputRef}
        searchText={searchText}
        onSearchTextChange={setSearchText}
        categoryOptions={filterOptions.categories}
        selectedCategories={selectedCategories}
        onCategoriesChange={setSelectedCategories}
        prepTimeOptions={prepTimeOptions}
        selectedPrepTime={selectedPrepTime}
        onPrepTimeChange={setSelectedPrepTime}
        difficultyOptions={difficultyOptions}
        selectedDifficulty={selectedDifficulty}
        onDifficultyChange={setSelectedDifficulty}
        ingredientOptions={filterOptions.ingredients}
        selectedIngredient={selectedIngredient}
        onIngredientChange={setSelectedIngredient}
        allergenOptions={filterOptions.allergens}
        selectedAllergens={selectedAllergens}
        onAllergensChange={setSelectedAllergens}
      />

      {/* Content */}
      {view === 'list' ? (
        /* Table View */
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableTableHeader sortKey="name" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                    Receta
                  </SortableTableHeader>
                  <SortableTableHeader sortKey="difficulty" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                    Dificultad
                  </SortableTableHeader>
                  <SortableTableHeader sortKey="prep_time" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                    Tiempo
                  </SortableTableHeader>
                  <SortableTableHeader sortKey="servings" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                    Raciones
                  </SortableTableHeader>
                  <SortableTableHeader sortKey="cost_per_serving" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                    Coste/ración
                  </SortableTableHeader>
                  <SortableTableHeader sortKey="" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort} sortable={false} className="text-right">
                    Acciones
                  </SortableTableHeader>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRecipes.map((recipe) => (
                  <tr 
                    key={recipe.recipe_id} 
                    onClick={() => router.push(`/recipes/${recipe.recipe_id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                            <ChefHat className="h-6 w-6 text-orange-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <Link 
                            href={`/recipes/${recipe.recipe_id}`}
                            className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors"
                          >
                            {recipe.name}
                          </Link>
                          <div className="text-sm text-gray-500">
                            {recipe.categories || 'Sin categoría'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {recipe.difficulty ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColors[recipe.difficulty]}`}>
                          {difficultyLabels[recipe.difficulty]}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {formatTime(recipe.prep_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        {recipe.servings}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Euro className="h-4 w-4 mr-1 text-gray-400" />
                        {formatCurrency(getCostPerServing(recipe))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link 
                          href={`/recipes/${recipe.recipe_id}`} 
                          className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                          title="Editar receta"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button 
                          onClick={() => openDeleteModal(recipe)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                          title="Eliminar receta"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State - Table */}
          {sortedRecipes.length === 0 && isInitialized && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay recetas
              </h3>
              <p className="text-gray-500 mb-4">
                {hasActiveFilters
                  ? 'No se encontraron recetas con los filtros aplicados'
                  : 'Comienza creando tu primera receta'
                }
              </p>
              <Link
                href="/recipes/new"
                className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                {hasActiveFilters ? 'Crear Nueva Receta' : 'Crear Primera Receta'}
              </Link>
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedRecipes.map((recipe) => (
            <div key={recipe.recipe_id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-t-lg relative">
                <div className="h-48 bg-gradient-to-br from-orange-100 to-orange-200 rounded-t-lg flex items-center justify-center">
                  <ChefHat className="h-12 w-12 text-orange-600" />
                </div>
                <div className="absolute top-2 right-2">
                  {recipe.difficulty && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[recipe.difficulty]}`}>
                      {difficultyLabels[recipe.difficulty]}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="mb-2">
                  <Link 
                    href={`/recipes/${recipe.recipe_id}`}
                    className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1 hover:text-orange-600 transition-colors"
                  >
                    {recipe.name}
                  </Link>
                  <p className="text-sm text-gray-500">{recipe.categories || 'Sin categoría'}</p>
                </div>

                {recipe.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {recipe.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(recipe.prep_time)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{recipe.servings}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Euro className="h-4 w-4" />
                    <span>{formatCurrency(getCostPerServing(recipe))}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <Link
                    href={`/recipes/${recipe.recipe_id}`}
                    className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium mr-2 text-center"
                  >
                    Ver Receta
                  </Link>
                  <div className="flex space-x-1">
                    <Link 
                      href={`/recipes/${recipe.recipe_id}`} 
                      className="text-gray-600 hover:text-gray-900 p-2 rounded transition-colors"
                      title="Editar receta"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button 
                      onClick={() => openDeleteModal(recipe)}
                      className="text-gray-600 hover:text-gray-900 p-2 rounded transition-colors"
                      title="Eliminar receta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Empty State - Grid */}
          {sortedRecipes.length === 0 && isInitialized && (
            <div className="col-span-full text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay recetas
              </h3>
              <p className="text-gray-500 mb-4">
                {hasActiveFilters
                  ? 'No se encontraron recetas con los filtros aplicados'
                  : 'Comienza creando tu primera receta'
                }
              </p>
              <Link
                href="/recipes/new"
                className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                {hasActiveFilters ? 'Crear Nueva Receta' : 'Crear Primera Receta'}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Results Counter */}
      {/* Results Counter and Pagination */}
      {pagination && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-600">
            Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} recetas
            {hasActiveFilters && ' (filtradas)'}
          </div>
          
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Confirmar eliminación"
          message={`¿Seguro que deseas eliminar la receta "${currentRecipe?.name}"?`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </div>
    </>
  )
}