'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Plus, 
  Clock, 
  Users, 
  Euro,
  ChefHat,
  AlertTriangle,
  Heart,
  Package,
  Info,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import { useToastHelpers } from '@/context/ToastContext'
import { useUnsavedChanges } from '@/hooks/useUnsavedChangesSimple'
import { 
  difficultyOptions, 
  difficultyTranslations, 
  difficultyColors, 
  defaultRecipeValues 
} from '@/constants/forms'

// Component imports
import AddIngredientToRecipeModal from '@/components/modals/AddIngredientToRecipeModal'
import EditRecipeIngredientModal from '@/components/modals/EditRecipeIngredientModal'
import ManageSectionsModal from '@/components/modals/ManageSectionsModal'
import AddSubrecipeModal from '@/components/modals/AddSubrecipeModal'
import EditSubrecipeModal from '@/components/modals/EditSubrecipeModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import UnifiedTabs from '@/components/ui/DetailTabs'

interface Recipe {
  recipe_id: number
  name: string
  instructions?: string
  prep_time?: number
  servings: number
  production_servings: number
  difficulty?: 'easy' | 'medium' | 'hard'
  net_price: number
  is_featured_recipe: boolean
  tax_id: number
  cost_per_serving?: number
  categories?: string
  created_at: string
  updated_at: string
}

interface RecipeIngredient {
  ingredient_id: number
  name: string
  quantity_per_serving: number
  unit: string
  base_price: number
  waste_percent: number
  section_id?: number
}

interface Category {
  category_id: number
  name: string
}

interface Nutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface Allergen {
  name: string
}

interface Section {
  section_id: number
  name: string
}

interface SubRecipe {
  id: number
  recipe_id: number
  subrecipe_id: number
  quantity_per_serving: number
  notes?: string
  subrecipe_name: string
  subrecipe_cost?: number
  subrecipe_servings: number
  subrecipe_prep_time?: number
  subrecipe_difficulty?: 'easy' | 'medium' | 'hard'
}

interface SubrecipeCardProps {
  subrecipe: SubRecipe
  totalCost: number
  formatCurrency: (value: number) => string
  formatDecimal: (value: number, decimals?: number) => string
  difficultyColors: Record<string, string>
  difficultyTranslations: Record<string, string>
  isEditing: boolean
  onEdit: () => void
  onDelete: () => void
}

// Componente para mostrar cada sub-receta con detalles expandibles
function SubrecipeCard({ 
  subrecipe, 
  totalCost, 
  formatCurrency, 
  formatDecimal, 
  difficultyColors, 
  difficultyTranslations, 
  isEditing, 
  onEdit, 
  onDelete 
}: SubrecipeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [subrecipeIngredients, setSubrecipeIngredients] = useState<RecipeIngredient[]>([])
  const [loading, setLoading] = useState(false)

  const loadSubrecipeIngredients = async () => {
    if (isExpanded && subrecipeIngredients.length === 0) {
      try {
        setLoading(true)
        const response = await apiGet<RecipeIngredient[]>(`/recipes/${subrecipe.subrecipe_id}/ingredients`)
        setSubrecipeIngredients(response.data || [])
      } catch (error) {
        console.error('Error loading subrecipe ingredients:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    loadSubrecipeIngredients()
  }, [isExpanded])

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header de la sub-receta */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <h4 className="text-sm font-medium text-gray-900">{subrecipe.subrecipe_name}</h4>
            </div>
            <div className="ml-6 text-xs text-gray-500 mt-1">
              <div className="font-medium">
                {formatDecimal(subrecipe.quantity_per_serving, 2)} raciones
              </div>
              <div className="flex items-center gap-2 mt-1">
                {subrecipe.subrecipe_difficulty && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${difficultyColors[subrecipe.subrecipe_difficulty]}`}>
                    {difficultyTranslations[subrecipe.subrecipe_difficulty]}
                  </span>
                )}
                {subrecipe.subrecipe_prep_time && (
                  <span className="text-gray-400">
                    {subrecipe.subrecipe_prep_time}m
                  </span>
                )}
              </div>
              {subrecipe.notes && (
                <div className="text-xs text-gray-400 mt-1 italic">
                  {subrecipe.notes}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{formatCurrency(totalCost)}</p>
              <p className="text-xs text-gray-500">{formatCurrency(subrecipe.subrecipe_cost || 0)}/ración</p>
            </div>
            {isEditing && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={onEdit}
                  className="text-orange-600 hover:text-orange-800 transition-colors p-1"
                  title="Editar sub-receta"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={onDelete}
                  className="text-red-600 hover:text-red-800 transition-colors p-1"
                  title="Eliminar sub-receta"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenido expandible con ingredientes */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-4 pb-4">
          <div className="pt-3">
            <h5 className="text-xs font-medium text-gray-600 mb-2">Ingredientes de esta sub-receta:</h5>
            {loading ? (
              <div className="text-xs text-gray-400">Cargando ingredientes...</div>
            ) : subrecipeIngredients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {subrecipeIngredients.map((ingredient, index) => {
                  const wastePercent = parseFloat(ingredient.waste_percent?.toString()) || 0
                  const wasteMultiplier = 1 + wastePercent
                  const quantityPerServing = parseFloat(ingredient.quantity_per_serving?.toString()) || 0
                  const price = parseFloat(ingredient.base_price?.toString()) || 0
                  
                  // Cantidad total considerando las raciones de la sub-receta
                  const totalQuantityForSubrecipe = quantityPerServing * subrecipe.quantity_per_serving
                  const ingredientCost = totalQuantityForSubrecipe * price * wasteMultiplier
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-700 truncate">{ingredient.name}</p>
                        <p className="text-gray-500">
                          {formatDecimal(totalQuantityForSubrecipe, 2)} {ingredient.unit}
                          {wastePercent > 0 && (
                            <span className="text-orange-500"> (+{formatDecimal(wastePercent * 100, 1)}%)</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right ml-2">
                        <p className="font-medium text-gray-700">{formatCurrency(ingredientCost)}</p>
                        <p className="text-gray-400">{formatCurrency(price)}/{ingredient.unit}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-xs text-gray-400">Esta sub-receta no tiene ingredientes detallados</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const recipeId = params.id as string
  const isNewRecipe = recipeId === 'new'

  // State
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [availableCategories, setAvailableCategories] = useState<Category[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([])
  const [nutrition, setNutrition] = useState<Nutrition | null>(null)
  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [subrecipes, setSubrecipes] = useState<SubRecipe[]>([])
  const [targetFoodCostPercentage, setTargetFoodCostPercentage] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing] = useState(true) // Siempre iniciar en modo edición
  
  // State para detectar cambios sin guardar
  const [, setIsSaving] = useState(false)
  
  // Tabs state
  const [activeTab, setActiveTab] = useState('general')
  
  // Toast helpers
  const { success, error: showError } = useToastHelpers()
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Modal states
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false)
  const [isEditIngredientOpen, setIsEditIngredientOpen] = useState(false)
  const [isManageSectionsOpen, setIsManageSectionsOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeleteRecipeOpen, setIsDeleteRecipeOpen] = useState(false)
  const [ingredientToEdit, setIngredientToEdit] = useState<RecipeIngredient | null>(null)
  const [ingredientToDelete, setIngredientToDelete] = useState<RecipeIngredient | null>(null)
  
  // Sub-recipe modal states
  const [isAddSubrecipeOpen, setIsAddSubrecipeOpen] = useState(false)
  const [isEditSubrecipeOpen, setIsEditSubrecipeOpen] = useState(false)
  const [isDeleteSubrecipeOpen, setIsDeleteSubrecipeOpen] = useState(false)
  const [subrecipeToEdit, setSubrecipeToEdit] = useState<SubRecipe | null>(null)
  const [subrecipeToDelete, setSubrecipeToDelete] = useState<SubRecipe | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    ...defaultRecipeValues,
    difficulty: '' as '' | 'easy' | 'medium' | 'hard',
    price_per_serving: '', // Nuevo campo para precio por comensal
    // Campos nutricionales
    calories: '',
    protein: '',
    carbs: '',
    fat: ''
  })
  
  // Unsaved changes detection
  const {
    hasUnsavedChanges,
    updateInitialValues
  } = useUnsavedChanges({
    formData,
    additionalData: [ingredients, selectedCategoryIds],
    isLoading: loading
  })

  // Load recipe data function
  const loadRecipeData = async () => {
    try {
      setLoading(true)
      
      // Load basic recipe data, ingredients, sections, and subrecipes
      const [recipeResponse, ingredientsResponse, sectionsResponse, subrecipesResponse] = await Promise.all([
        apiGet<Recipe>(`/recipes/${recipeId}`),
        apiGet<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`),
        apiGet<Section[]>(`/recipes/${recipeId}/sections`),
        apiGet<SubRecipe[]>(`/recipes/${recipeId}/subrecipes`)
      ])
      
      const recipeData = recipeResponse.data
      setRecipe(recipeData)
      setIngredients(ingredientsResponse.data || [])
      setSections(sectionsResponse.data || [])
      setSubrecipes(subrecipesResponse.data || [])
      
      // Set form data
      const newFormData = {
        name: recipeData.name,
        instructions: recipeData.instructions || '',
        prep_time: recipeData.prep_time?.toString() || '',
        servings: recipeData.servings,
        production_servings: recipeData.production_servings,
        difficulty: (recipeData.difficulty || '') as '' | 'easy' | 'medium' | 'hard',
        net_price: recipeData.net_price.toString(),
        price_per_serving: (recipeData.net_price / recipeData.servings).toString(),
        is_featured_recipe: recipeData.is_featured_recipe,
        tax_id: recipeData.tax_id,
        // Campos nutricionales - se cargarán cuando esté disponible nutrition
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      }
      setFormData(newFormData)
      
      // Process categories from recipe data
      if (recipeData.categories) {
        const cats = typeof recipeData.categories === 'string' 
          ? recipeData.categories.split(', ').map((cat: string) => cat.trim())
          : Array.isArray(recipeData.categories) 
          ? recipeData.categories 
          : [recipeData.categories]
        setCategories(cats)
      } else {
        setCategories([])
      }
      
      // Load additional data (non-blocking)
      loadAdditionalData()
      
      // Error cleared, no need for action with Toast system
    } catch (err) {
      showError('Error al cargar la receta')
      console.error('Error loading recipe:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load data
  useEffect(() => {
    if (!isNewRecipe) {
      loadRecipeData()
    } else {
      initializeNewRecipe()
    }
    loadAvailableCategories()
    loadRestaurantSettings()
  }, [recipeId, isNewRecipe]) // Removed loadRecipeData from dependencies

  // Handle URL hash for direct tab navigation
  useEffect(() => {
    const hash = window.location.hash.substring(1) // Remove the #
    if (hash && ['general', 'ingredients'].includes(hash)) {
      setActiveTab(hash)
    }
  }, [])

  const initializeNewRecipe = () => {
    setRecipe({
      recipe_id: 0,
      name: '',
      instructions: '',
      prep_time: undefined,
      servings: 1,
      production_servings: 1,
      difficulty: undefined,
      net_price: 0,
      is_featured_recipe: false,
      tax_id: 1,
      created_at: '',
      updated_at: ''
    })
    setIngredients([])
    setCategories([])
    setSelectedCategoryIds([])
    setNutrition(null)
    setAllergens([])
    setLoading(false)
    
    // Initial data setup for new recipe is handled by default values
    
  }

  const loadAvailableCategories = async () => {
    try {
      const response = await apiGet<Category[]>('/recipe-categories')
      setAvailableCategories(response.data)
    } catch {
      // Fallback categories
      setAvailableCategories([
        { category_id: 1, name: 'Entrante' },
        { category_id: 2, name: 'Principal' },
        { category_id: 3, name: 'Postre' },
        { category_id: 4, name: 'Bebida' },
        { category_id: 5, name: 'Comida vegetariana' },
        { category_id: 6, name: 'Ensaladas' }
      ])
    }
  }

  const loadRestaurantSettings = async () => {
    try {
      const response = await apiGet<{success: boolean, data: {target_food_cost_percentage: number}}>('/restaurant-info')
      if (response.data?.success && response.data?.data?.target_food_cost_percentage) {
        setTargetFoodCostPercentage(response.data.data.target_food_cost_percentage)
      } else {
        setTargetFoodCostPercentage(30) // Fallback si no hay configuración
      }
    } catch {
      setTargetFoodCostPercentage(30) // Fallback en caso de error
    }
  }

  const loadAdditionalData = async () => {
    // Load nutrition
    try {
      const nutritionResponse = await apiGet<Nutrition>(`/recipes/${recipeId}/nutrition`)
      const nutritionData = nutritionResponse.data
      setNutrition(nutritionData)
      
      // Update form data with nutrition values
      const nutritionFormData = {
        calories: nutritionData.calories?.toString() || '',
        protein: nutritionData.protein?.toString() || '',
        carbs: nutritionData.carbs?.toString() || '',
        fat: nutritionData.fat?.toString() || ''
      }
      
      setFormData(prev => ({
        ...prev,
        ...nutritionFormData
      }))
      
    } catch {
      setNutrition(null)
    }
    
    // Load allergens
    try {
      const allergensResponse = await apiGet<Allergen[]>(`/recipes/${recipeId}/allergens`)
      setAllergens(allergensResponse.data || [])
    } catch {
      setAllergens([])
    }
  }

  // Sync selectedCategoryIds when categories and availableCategories are loaded
  useEffect(() => {
    if (categories.length > 0 && availableCategories.length > 0) {
      const categoryIds = categories
        .map(catName => availableCategories.find(ac => ac.name === catName)?.category_id)
        .filter((id): id is number => id !== undefined)
      setSelectedCategoryIds(categoryIds)
    }
  }, [categories, availableCategories])





  const handleSave = async () => {
    try {
      setIsSaving(true)
      // Validation
      const errors: Record<string, string> = {}
      
      if (!formData.name.trim()) {
        errors.name = 'El nombre de la receta es obligatorio'
      }
      
      if (!formData.servings || formData.servings <= 0) {
        errors.servings = 'El número de comensales es obligatorio y debe ser mayor a 0'
      }
      
      if (!formData.production_servings || formData.production_servings <= 0) {
        errors.production_servings = 'Las raciones mínimas son obligatorias y deben ser mayor a 0'
      }
      
      if (!formData.price_per_serving || parseFloat(formData.price_per_serving) <= 0) {
        errors.price_per_serving = 'El precio por comensal es obligatorio y debe ser mayor a 0'
      }
      
      if (formData.servings < formData.production_servings) {
        errors.servings = `Los comensales (${formData.servings}) no pueden ser menores que las raciones mínimas (${formData.production_servings})`
      }
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        showError('Por favor, corrige los errores en el formulario')
        return
      }

      const recipeData = {
        ...formData,
        prep_time: formData.prep_time ? parseInt(formData.prep_time) : null,
        net_price: parseFloat(formData.price_per_serving) * formData.servings, // Calcular precio total automáticamente
        difficulty: formData.difficulty || null
      }

      console.log('📊 RecipeData preparado:', JSON.stringify(recipeData, null, 2));
      console.log('🆕 Es nueva receta:', isNewRecipe);

      if (isNewRecipe) {
        console.log('🍽️ Creando nueva receta con apiPost...');
        const response = await apiPost<{ id: number }>('/recipes', recipeData)
        const newRecipeId = response.data.id
        
        // Save categories
        if (selectedCategoryIds.length > 0) {
          try {
            await apiPut(`/recipes/${newRecipeId}/categories`, { 
              categoryIds: selectedCategoryIds 
            })
          } catch (categoryErr) {
            console.warn('Error saving categories:', categoryErr)
          }
        }
        
        // Recalculate costs
        try {
          await apiPut(`/recipes/${newRecipeId}/costs`)
        } catch (costErr) {
          console.warn('Error calculating costs:', costErr)
        }
        
        // Save nutrition data if provided
        if (formData.calories || formData.protein || formData.carbs || formData.fat) {
          try {
            const nutritionData = {
              calories: formData.calories ? parseInt(formData.calories) : 0,
              protein: formData.protein ? parseFloat(formData.protein) : 0,
              carbs: formData.carbs ? parseFloat(formData.carbs) : 0,
              fat: formData.fat ? parseFloat(formData.fat) : 0
            }
            await apiPut(`/recipes/${newRecipeId}/nutrition`, nutritionData)
          } catch (nutritionErr) {
            console.warn('Error saving nutrition data:', nutritionErr)
          }
        }
        
        // Show success toast for new recipe
        success('Receta creada correctamente', 'Receta Creada')
        router.push(`/recipes/${newRecipeId}`)
      } else {
        await apiPut(`/recipes/${recipeId}`, recipeData)
        
        // Save categories
        try {
          await apiPut(`/recipes/${recipeId}/categories`, { 
            categoryIds: selectedCategoryIds 
          })
        } catch (categoryErr) {
          console.warn('Error saving categories:', categoryErr)
        }
        
        // Recalculate costs
        await apiPut(`/recipes/${recipeId}/costs`)
        
        // Save nutrition data if provided
        if (formData.calories || formData.protein || formData.carbs || formData.fat) {
          try {
            const nutritionData = {
              calories: formData.calories ? parseInt(formData.calories) : 0,
              protein: formData.protein ? parseFloat(formData.protein) : 0,
              carbs: formData.carbs ? parseFloat(formData.carbs) : 0,
              fat: formData.fat ? parseFloat(formData.fat) : 0
            }
            await apiPut(`/recipes/${recipeId}/nutrition`, nutritionData)
          } catch (nutritionErr) {
            console.warn('Error saving nutrition data:', nutritionErr)
          }
        }
        
        // Resetear cambios sin guardar ANTES de navegar para evitar modal
        updateInitialValues()
        
        success('Receta actualizada correctamente', 'Receta Actualizada')
        router.back()
      }
      
      setValidationErrors({})
      
      // Para nuevas recetas solo resetear el flag (ya navega automáticamente)
      if (isNewRecipe) {
        updateInitialValues()
      }
      // Para recetas existentes, los valores iniciales ya se actualizaron antes de router.back()
      
    } catch (err: any) {
      console.error('❌ Error detallado saving recipe:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error stack:', err.stack);
      showError(isNewRecipe ? 'Error al crear la receta' : 'Error al guardar la receta')
    } finally {
      setIsSaving(false)
    }
  }

  const openDeleteModal = () => {
    setIsDeleteRecipeOpen(true)
  }

  const handleDelete = async () => {
    try {
      await apiDelete(`/recipes/${recipeId}`)
      router.push('/recipes')
    } catch (err) {
      showError('Error al eliminar la receta')
      console.error('Error deleting recipe:', err)
      // Keep modal open on error
    }
  }

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    if (checked) {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId])
    } else {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== categoryId))
    }
  }


  // Función para añadir ingrediente a la receta
  const handleAddIngredient = async (ingredientData: RecipeIngredient) => {
    try {
      if (isNewRecipe) {
        // Para recetas nuevas, añadir al estado temporal
        setIngredients([...ingredients, ingredientData])
      } else {
        // Para recetas existentes, hacer llamada al backend
        await apiPost(`/recipes/${recipeId}/ingredients`, ingredientData)
        // Recargar ingredientes
        const response = await apiGet<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`)
        setIngredients(response.data || [])
        // Recalcular costes
        await apiPut(`/recipes/${recipeId}/costs`)
        await loadRecipeData()
      }
      success('Ingrediente añadido correctamente', 'Ingrediente Añadido')
    } catch {
      console.error('Fixed error in catch block')
      showError('Error al añadir el ingrediente')
    }
  }

  // Función para editar ingrediente de la receta
  const handleEditIngredient = async (updatedIngredient: RecipeIngredient) => {
    try {
      if (isNewRecipe) {
        // Para recetas nuevas, actualizar en el estado temporal
        setIngredients(ingredients.map(ing => 
          ing.ingredient_id === updatedIngredient.ingredient_id ? updatedIngredient : ing
        ))
      } else {
        // Encontrar el ingrediente original para obtener la sección actual
        const originalIngredient = ingredients.find(ing => ing.ingredient_id === updatedIngredient.ingredient_id)
        
        // Preparar datos para el backend según la estructura esperada
        const updateData = {
          quantity_per_serving: updatedIngredient.quantity_per_serving,
          section_id: updatedIngredient.section_id,
          current_section_id: originalIngredient?.section_id || null,
          // Agregar otros campos que podrían ser necesarios
          base_price: updatedIngredient.base_price,
          waste_percent: updatedIngredient.waste_percent,
          unit: updatedIngredient.unit
        }
        
        // Para recetas existentes, hacer llamada al backend
        await apiPut(`/recipes/${recipeId}/ingredients/${updatedIngredient.ingredient_id}`, updateData)
        // Recargar ingredientes
        const response = await apiGet<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`)
        setIngredients(response.data || [])
        // Recalcular costes
        await apiPut(`/recipes/${recipeId}/costs`)
        await loadRecipeData()
      }
      success('Ingrediente actualizado correctamente', 'Ingrediente Actualizado')
    } catch {
      console.error('Fixed error in catch block')
      showError('Error al actualizar el ingrediente')
    }
  }

  // Función para eliminar ingrediente
  const handleDeleteIngredient = async () => {
    if (!ingredientToDelete) return

    try {
      if (isNewRecipe) {
        // Para recetas nuevas, eliminar del estado temporal
        setIngredients(ingredients.filter(ing => ing.ingredient_id !== ingredientToDelete.ingredient_id))
      } else {
        // Para recetas existentes, hacer llamada al backend
        await apiDelete(`/recipes/${recipeId}/ingredients/${ingredientToDelete.ingredient_id}`)
        // Recargar ingredientes
        const response = await apiGet<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`)
        setIngredients(response.data || [])
        // Recalcular costes
        await apiPut(`/recipes/${recipeId}/costs`)
        await loadRecipeData()
      }
      success('Ingrediente eliminado correctamente', 'Ingrediente Eliminado')
    } catch {
      console.error('Fixed error in catch block')
      showError('Error al eliminar el ingrediente')
    } finally {
      setIsDeleteConfirmOpen(false)
      setIngredientToDelete(null)
    }
  }

  // Funciones para gestionar secciones
  const handleAddSection = async (sectionName: string): Promise<Section> => {
    try {
      if (isNewRecipe) {
        // Para recetas nuevas, crear sección temporal
        const newSection: Section = {
          section_id: Date.now(), // ID temporal
          name: sectionName
        }
        setSections([...sections, newSection])
        success('Sección creada correctamente', 'Sección Creada')
        return newSection
      } else {
        // Para recetas existentes, crear en el backend
        const response = await apiPost<Section>(`/recipes/${recipeId}/sections`, { name: sectionName })
        const newSection = response.data
        
        // Recargar tanto secciones como ingredientes para actualizar la vista
        const [sectionsResponse, ingredientsResponse] = await Promise.all([
          apiGet<Section[]>(`/recipes/${recipeId}/sections`),
          apiGet<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`)
        ])
        setSections(sectionsResponse.data || [])
        setIngredients(ingredientsResponse.data || [])
        
        success('Sección creada correctamente', 'Sección Creada')
        return newSection
      }
    } catch (error) {
      console.error('Fixed error in catch block')
      showError('Error al crear la sección')
      throw error
    }
  }

  const handleUpdateSection = async (updatedSection: Section) => {
    try {
      if (isNewRecipe) {
        // Para recetas nuevas, actualizar en estado temporal
        setSections(sections.map(sec => 
          sec.section_id === updatedSection.section_id ? updatedSection : sec
        ))
      } else {
        // Para recetas existentes, actualizar en el backend
        await apiPut(`/recipes/${recipeId}/sections/${updatedSection.section_id}`, { name: updatedSection.name })
        // Recargar secciones
        const response = await apiGet<Section[]>(`/recipes/${recipeId}/sections`)
        setSections(response.data || [])
      }
      success('Sección actualizada correctamente', 'Sección Actualizada')
    } catch {
      console.error('Fixed error in catch block')
      showError('Error al actualizar la sección')
    }
  }

  const handleDeleteSection = async (sectionId: number) => {
    try {
      if (isNewRecipe) {
        // Para recetas nuevas, eliminar del estado temporal
        setSections(sections.filter(sec => sec.section_id !== sectionId))
        // También actualizar ingredientes para quitar la sección
        setIngredients(ingredients.map(ing => 
          ing.section_id === sectionId ? { ...ing, section_id: undefined } : ing
        ))
      } else {
        // Para recetas existentes, eliminar del backend
        await apiDelete(`/recipes/${recipeId}/sections/${sectionId}`)
        // Recargar secciones e ingredientes
        const [sectionsResponse, ingredientsResponse] = await Promise.all([
          apiGet<Section[]>(`/recipes/${recipeId}/sections`),
          apiGet<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`)
        ])
        setSections(sectionsResponse.data || [])
        setIngredients(ingredientsResponse.data || [])
      }
      success('Sección eliminada correctamente', 'Sección Eliminada')
    } catch {
      console.error('Fixed error in catch block')
      showError('Error al eliminar la sección')
    }
  }

  // Función para obtener los ingredientes a mostrar (igual que en el original)
  const getDisplayIngredients = () => {
    return ingredients
  }

  // Calcular métricas de coste basadas en datos reales (EXACTO del original)
  const calculateCostMetrics = () => {
    if (!recipe) return null

    const netPrice = parseFloat(formData.net_price) || parseFloat(recipe.net_price?.toString()) || 0
    const servings = parseInt(formData.servings?.toString()) || parseInt(recipe.servings?.toString()) || 1
    const productionServings = parseInt(formData.production_servings?.toString()) || parseInt(recipe.production_servings?.toString()) || 1
    
    // Calcular coste total directamente para el número de servings
    let totalCost = 0
    let costPerServing = 0
    
    const displayIngredients = getDisplayIngredients()
    if (displayIngredients && displayIngredients.length > 0) {
      totalCost = displayIngredients.reduce((total, ingredient) => {
        const quantity = parseFloat(ingredient.quantity_per_serving?.toString()) || 0
        const price = parseFloat(ingredient.base_price?.toString()) || 0
        const wastePercent = parseFloat(ingredient.waste_percent?.toString()) || 0
        const wasteMultiplier = 1 + wastePercent
        // Coste para todos los servings
        return total + (quantity * price * wasteMultiplier * servings)
      }, 0)
      
      // Calcular coste por porción a partir del total
      costPerServing = servings > 0 ? totalCost / servings : 0
    }
    
    // Calcular margen y precio sugerido
    // net_price ya es el precio total de la receta, no por porción
    const totalNetPrice = netPrice
    const pricePerServing = netPrice / servings // Calcular precio por porción para mostrar
    const currentMargin = totalNetPrice - totalCost
    const currentMarginPercent = totalNetPrice > 0 ? ((totalNetPrice - totalCost) / totalNetPrice) * 100 : 0
    // Usar el porcentaje objetivo configurado en el restaurante
    const foodCostPercent = targetFoodCostPercentage || 30
    const suggestedPrice = costPerServing > 0 ? costPerServing / (foodCostPercent / 100) : 0

    return {
      totalCost,
      costPerServing,
      netPrice,
      totalNetPrice,
      pricePerServing,
      currentMargin,
      currentMarginPercent,
      suggestedPrice,
      foodCostPercent,
      productionServings,
      servings
    }
  }

  // Funciones de formateo EXACTAS del original
  const formatCurrency = (value: number | null | undefined, decimals: number = 2) => {
    if (value === null || value === undefined || isNaN(value)) return '0,' + '0'.repeat(decimals) + '€'
    
    const numValue = parseFloat(value.toString())
    if (isNaN(numValue)) return '0,' + '0'.repeat(decimals) + '€'
    
    const formatted = numValue.toLocaleString('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
    
    return `${formatted}€`
  }

  const formatDecimal = (value: number | null | undefined, decimals: number = 2) => {
    if (value === null || value === undefined || isNaN(value)) return decimals > 0 ? '0,' + '0'.repeat(decimals) : '0'
    
    const numValue = parseFloat(value.toString())
    if (isNaN(numValue)) return decimals > 0 ? '0,' + '0'.repeat(decimals) : '0'
    
    return numValue.toLocaleString('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: false // Sin separadores de miles para números simples
    })
  }

  // Sub-recipe management functions
  const handleAddSubrecipeSuccess = useCallback(() => {
    loadRecipeData()
    success('Sub-receta añadida correctamente')
  }, [success])

  const handleEditSubrecipeSuccess = useCallback(() => {
    loadRecipeData()
    success('Sub-receta actualizada correctamente')
  }, [success])

  const handleDeleteSubrecipe = async (subrecipe: SubRecipe) => {
    try {
      await apiDelete(`/recipes/${recipeId}/subrecipes/${subrecipe.subrecipe_id}`)
      await loadRecipeData()
      success('Sub-receta eliminada correctamente')
    } catch (err) {
      showError('Error al eliminar la sub-receta')
      console.error('Error deleting subrecipe:', err)
    }
  }

  // Tab content renderers
  const renderGeneralTab = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="bg-orange-100 p-2 rounded-lg">
            <Info className="h-5 w-5 text-orange-600" />
          </div>
          Información Básica
        </h3>
        
        <div className="space-y-6">
          {/* Name and Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la receta <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nombre de la receta"
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-900">{recipe?.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorías
              </label>
              {isEditing ? (
                <div className="space-y-2 max-h-24 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {availableCategories.map((category) => (
                    <label key={category.category_id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedCategoryIds.includes(category.category_id)}
                        onChange={(e) => handleCategoryChange(category.category_id, e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-900">
                  {categories.length > 0 ? categories.join(', ') : 'Sin categoría'}
                </p>
              )}
            </div>
          </div>

          {/* Time, Difficulty, Production Servings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo (min)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.prep_time}
                  onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Minutos"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {recipe?.prep_time ? `${recipe.prep_time} min` : 'No especificado'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dificultad
              </label>
              {isEditing ? (
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as '' | 'easy' | 'medium' | 'hard' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Seleccionar</option>
                  {difficultyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-900">
                  {recipe?.difficulty ? difficultyTranslations[recipe.difficulty] : 'No especificado'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raciones mínimas <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="number"
                    min="1"
                    value={formData.production_servings}
                    onChange={(e) => setFormData({ ...formData, production_servings: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {validationErrors.production_servings && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.production_servings}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-900">{recipe?.production_servings}</p>
              )}
            </div>
          </div>

          {/* Servings and Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comensales <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="number"
                    min={recipe?.production_servings || 1}
                    value={formData.servings}
                    onChange={(e) => {
                      const newServings = parseInt(e.target.value) || 1
                      setFormData({ 
                        ...formData, 
                        servings: newServings,
                        net_price: formData.price_per_serving 
                          ? (parseFloat(formData.price_per_serving) * newServings).toString()
                          : formData.net_price
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {validationErrors.servings && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.servings}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-900">{recipe?.servings}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio por comensal <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_per_serving}
                    onChange={(e) => {
                      const newPricePerServing = e.target.value
                      setFormData({ 
                        ...formData, 
                        price_per_serving: newPricePerServing,
                        net_price: newPricePerServing && formData.servings 
                          ? (parseFloat(newPricePerServing) * formData.servings).toString()
                          : formData.net_price
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  {validationErrors.price_per_serving && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.price_per_serving}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-900">
                  {recipe?.net_price && recipe.servings 
                    ? formatCurrency(recipe.net_price / recipe.servings)
                    : formatCurrency(0)
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions - Moved from Preparation tab */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="bg-orange-100 p-2 rounded-lg">
            <ChefHat className="h-5 w-5 text-orange-600" />
          </div>
          Instrucciones de Preparación
        </h3>
        
        {isEditing ? (
          <textarea
            rows={8}
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Instrucciones paso a paso..."
          />
        ) : (
          <div className="prose max-w-none">
            {recipe?.instructions ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">
                {recipe.instructions}
              </pre>
            ) : (
              <p className="text-gray-500 italic">No hay instrucciones registradas</p>
            )}
          </div>
        )}
      </div>

    </div>
  )

  const renderIngredientsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
            Ingredientes
          </h3>
          {isEditing && (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setIsManageSectionsOpen(true)}
                className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Secciones
              </button>
              <button 
                onClick={() => setIsAddIngredientOpen(true)}
                className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Añadir ingrediente</span>
                <span className="md:hidden">Añadir</span>
              </button>
            </div>
          )}
        </div>
        
        {ingredients.length > 0 || sections.length > 0 ? (
          <div className="space-y-8">
            {(() => {
              // Crear un mapa de ingredientes por sección
              const ingredientsBySection = ingredients.reduce((acc, ingredient) => {
                const sectionId = ingredient.section_id || 'no-section'
                if (!acc[sectionId]) {
                  acc[sectionId] = []
                }
                acc[sectionId].push(ingredient)
                return acc
              }, {} as Record<string, RecipeIngredient[]>)

              // Asegurar que todas las secciones aparezcan, incluso si están vacías
              sections.forEach(section => {
                const sectionId = section.section_id.toString()
                if (!ingredientsBySection[sectionId]) {
                  ingredientsBySection[sectionId] = []
                }
              })

              return Object.entries(ingredientsBySection).map(([sectionId, sectionIngredients]) => {
                const section = sectionId === 'no-section' ? null : sections.find(s => s.section_id === parseInt(sectionId))
                
                return (
                  <div key={sectionId} className="space-y-4">
                    {/* Encabezado de sección */}
                    {section ? (
                      <h4 className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-2 rounded-lg">
                        {section.name}
                      </h4>
                    ) : sections.length > 0 ? (
                      <h4 className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                        Sin sección
                      </h4>
                    ) : null}
                    
                    {/* Ingredientes de la sección en grid horizontal de 3 columnas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sectionIngredients.length > 0 ? sectionIngredients.map((ingredient, index) => {
                        const wastePercent = parseFloat(ingredient.waste_percent?.toString()) || 0
                        const wasteMultiplier = 1 + wastePercent
                        const quantityPerServing = parseFloat(ingredient.quantity_per_serving?.toString()) || 0
                        const price = parseFloat(ingredient.base_price?.toString()) || 0
                        
                        // Calcular cantidad total para el número actual de porciones
                        const currentServings = parseInt(formData.servings?.toString() || '') || parseInt(recipe?.servings?.toString() || '') || 1
                        const totalQuantity = quantityPerServing * currentServings
                        const ingredientCost = totalQuantity * price * wasteMultiplier
                        
                        return (
                          <div key={`${sectionId}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{ingredient.name || 'Sin nombre'}</p>
                              <div className="text-xs text-gray-500">
                                <div className="font-medium">
                                  {formatDecimal(totalQuantity, 2)} {ingredient.unit || ''}
                                </div>
                                <div className="text-xs" style={{ color: '#64748b' }}>
                                  ({quantityPerServing} {ingredient.unit || ''} por porción)
                                </div>
                                {wastePercent > 0 && (
                                  <span className="text-orange-600"> (+{formatDecimal(wastePercent * 100, 1)}% merma)</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{formatCurrency(ingredientCost)}</p>
                                <p className="text-xs text-gray-500">{formatCurrency(price)}/{ingredient.unit}</p>
                              </div>
                              {isEditing && (
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => {
                                      setIngredientToEdit(ingredient)
                                      setIsEditIngredientOpen(true)
                                    }}
                                    className="text-orange-600 hover:text-orange-800 transition-colors p-1"
                                    title="Editar ingrediente"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIngredientToDelete(ingredient)
                                      setIsDeleteConfirmOpen(true)
                                    }}
                                    className="text-red-600 hover:text-red-800 transition-colors p-1"
                                    title="Eliminar ingrediente"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }) : (
                        <div className="text-center py-4 text-gray-400 text-sm">
                          Sección vacía
                          {isEditing && (
                            <div className="mt-2">
                              <button 
                                onClick={() => setIsAddIngredientOpen(true)}
                                className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                              >
                                Añadir ingrediente
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">🥕</div>
            <p className="text-sm text-gray-500">No hay ingredientes registrados</p>
            {isEditing && (
              <button 
                onClick={() => setIsAddIngredientOpen(true)}
                className="mt-2 text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                Añadir primer ingrediente
              </button>
            )}
          </div>
        )}
      </div>

      {/* Allergens */}
      {allergens.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            Alérgenos Detectados
          </h3>
          <div className="flex flex-wrap gap-2">
            {allergens.map((allergen) => (
              <span key={allergen.name} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {allergen.name}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Los alérgenos se detectan automáticamente basándose en los ingredientes de la receta
          </p>
        </div>
      )}

    </div>
  )

  const renderSubrecipesTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Heart className="h-5 w-5 text-orange-600" />
            </div>
            Sub-recetas
          </h3>
          {isEditing && (
            <button 
              onClick={() => setIsAddSubrecipeOpen(true)}
              className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Añadir sub-receta</span>
              <span className="md:hidden">Añadir</span>
            </button>
          )}
        </div>
        
        {subrecipes.length > 0 ? (
          <div className="space-y-4">
            {subrecipes.map((subrecipe) => {
              const totalCost = (subrecipe.subrecipe_cost || 0) * subrecipe.quantity_per_serving
              
              return (
                <SubrecipeCard 
                  key={subrecipe.id}
                  subrecipe={subrecipe}
                  totalCost={totalCost}
                  formatCurrency={formatCurrency}
                  formatDecimal={formatDecimal}
                  difficultyColors={difficultyColors}
                  difficultyTranslations={difficultyTranslations}
                  isEditing={isEditing}
                  onEdit={() => {
                    setSubrecipeToEdit(subrecipe)
                    setIsEditSubrecipeOpen(true)
                  }}
                  onDelete={() => {
                    setSubrecipeToDelete(subrecipe)
                    setIsDeleteSubrecipeOpen(true)
                  }}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">🍽️</div>
            <p className="text-sm text-gray-500">No hay sub-recetas registradas</p>
            <p className="text-xs text-gray-400 mt-1">Las sub-recetas permiten usar otras recetas como componentes</p>
            {isEditing && (
              <button 
                onClick={() => setIsAddSubrecipeOpen(true)}
                className="mt-2 text-orange-600 hover:text-orange-700 text-sm font-medium"
              >
                Añadir primera sub-receta
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!recipe && !isNewRecipe) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">No se encontró la receta</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Fixed Action Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-[60px] z-40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <button
              onClick={() => router.push('/recipes')}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1 pr-2">
              <h1 className="text-lg font-semibold text-gray-900 leading-tight break-words">
                {isNewRecipe ? 'Nueva Receta' : (recipe?.name || 'Cargando...')}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {!isNewRecipe && (
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar receta"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges && !isNewRecipe}
              className={`p-2 rounded-lg transition-colors ${
                hasUnsavedChanges || isNewRecipe 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200 cursor-not-allowed'
              }`}
              title={isNewRecipe ? 'Crear receta' : hasUnsavedChanges ? 'Guardar cambios' : 'Sin cambios que guardar'}
            >
              <Save className="h-4 w-4" />
            </button>
            
            {!isNewRecipe && (
              <button
                onClick={() => router.push('/recipes')}
                className="hidden md:flex p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cerrar y volver"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <header className="hidden md:block bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/recipes')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNewRecipe ? 'Nueva Receta' : (recipe?.name || 'Cargando...')}
              </h1>
              {recipe && !isEditing && recipe.difficulty && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[recipe.difficulty]}`}>
                    {difficultyTranslations[recipe.difficulty]}
                  </span>
                  {categories.length > 0 && (
                    <span className="text-sm text-gray-500">• {categories.join(', ')}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {!isNewRecipe && (
              <button
                onClick={openDeleteModal}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </button>
            )}
            
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges && !isNewRecipe}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                hasUnsavedChanges || isNewRecipe 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200 cursor-not-allowed'
              }`}
            >
              <Save className="h-4 w-4 mr-2" />
              {isNewRecipe ? 'Crear' : 'Guardar'}
            </button>
            
            {!isNewRecipe && (
              <button
                onClick={() => router.push('/recipes')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Cerrar
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="p-6 md:p-6 pt-4 md:pt-6">
        {/* Stats Cards siguiendo patrón TotXo */}
        {recipe && !isNewRecipe && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Raciones mínimas</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{recipe.production_servings}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tiempo Prep.</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {recipe.prep_time ? `${recipe.prep_time}m` : 'N/A'}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Alérgenos</p>
                  {allergens.length > 0 ? (
                    <div className="mt-1">
                      <p className="text-2xl font-bold text-red-600">
                        {allergens.length}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1 max-w-[140px]">
                        {allergens.slice(0, 3).map((allergen) => (
                          <span key={allergen.name} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700 truncate">
                            {allergen.name}
                          </span>
                        ))}
                        {allergens.length > 3 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                            +{allergens.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <p className="text-2xl font-bold text-green-600">0</p>
                      <p className="text-xs text-gray-500 mt-1">Sin alérgenos</p>
                    </div>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-orange-100">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Info. Nutricional</p>
                  {(nutrition && nutrition.calories) || formData.calories ? (
                    <div className="mt-1">
                      <p className={`text-2xl font-bold ${(() => {
                        const calories = parseInt(formData.calories) || nutrition?.calories || 0
                        if (!calories) return 'text-gray-500'
                        if (calories < 250) return 'text-green-600'
                        if (calories <= 500) return 'text-yellow-600'
                        return 'text-red-600'
                      })()}`}>
                        {formData.calories || nutrition?.calories || 0} kcal
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        <span>P: {formData.protein || nutrition?.protein || 0}g</span>
                        <span>C: {formData.carbs || nutrition?.carbs || 0}g</span>
                        <span>G: {formData.fat || nutrition?.fat || 0}g</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-500 mt-1">N/A</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-orange-100">
                  <Heart className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content with Tabs */}
          <div className="lg:col-span-2">
            <UnifiedTabs
              tabs={[
                { id: 'general', label: 'Información General', icon: ChefHat },
                { id: 'ingredients', label: 'Ingredientes', icon: Package },
                { id: 'subrecipes', label: 'Sub-recetas', icon: Heart }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="detail"
              mobileStyle="orange"
            >
              {activeTab === 'general' && renderGeneralTab()}
              {activeTab === 'ingredients' && renderIngredientsTab()}
              {activeTab === 'subrecipes' && renderSubrecipesTab()}
            </UnifiedTabs>

            {/* Cost Analysis - Mobile only */}
            {(() => {
              const metrics = calculateCostMetrics()
              if (!metrics) return null
              
              return (
                <div className="lg:hidden mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Euro className="h-5 w-5 text-orange-600" />
                    </div>
                    Análisis de Costos
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Coste Total:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(metrics.totalCost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Coste por Comensal:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(metrics.costPerServing)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Precio de Venta:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(metrics.netPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="text-sm text-gray-600">Margen:</span>
                      <div className="text-right">
                        <span className="font-medium text-orange-600">
                          {formatCurrency(metrics.currentMargin)}
                        </span>
                        <p className="text-xs text-gray-500">
                          {formatDecimal(metrics.currentMarginPercent, 1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-orange-50 p-3 rounded-lg">
                      <span className="text-sm text-orange-700">Precio Sugerido ({metrics.foodCostPercent}%):</span>
                      <span className="font-medium text-orange-700">{formatCurrency(metrics.suggestedPrice)}</span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Sidebar - Cost Analysis */}
          <div className="space-y-6">
            {/* Cost Analysis */}
            {(() => {
              const metrics = calculateCostMetrics()
              if (!metrics) return null
              
              return (
                <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Euro className="h-5 w-5 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Análisis de Costos</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Coste Total */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Coste Total</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalCost)}</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-lg">
                          <Package className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </div>

                    {/* Coste por Comensal */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Coste por Comensal</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.costPerServing)}</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-lg">
                          <Users className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </div>

                    {/* Precio de Venta */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Precio Venta</p>
                          <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.netPrice)}</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-lg">
                          <Euro className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </div>

                    {/* Margen */}
                    <div className="rounded-lg p-4 bg-orange-50 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-700">
                            Margen de Beneficio
                          </p>
                          <div className="flex items-baseline space-x-2">
                            <p className="text-2xl font-bold text-orange-800">
                              {formatCurrency(metrics.currentMargin)}
                            </p>
                            <span className="text-sm font-medium text-orange-600">
                              ({formatDecimal(metrics.currentMarginPercent, 1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-orange-100">
                          <Heart className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </div>

                    {/* Precio Sugerido */}
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-700">Precio Sugerido</p>
                          <p className="text-sm text-orange-600 mb-1">Food Cost {metrics.foodCostPercent}%</p>
                          <p className="text-xl font-bold text-orange-800">{formatCurrency(metrics.suggestedPrice)}</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-lg">
                          <ChefHat className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()} 

          </div>
        </div>
      </div>

      {/* Modales */}
      <AddIngredientToRecipeModal
        isOpen={isAddIngredientOpen}
        onClose={() => setIsAddIngredientOpen(false)}
        onAdd={handleAddIngredient}
        sections={sections}
        existingIngredients={ingredients}
        onCreateSection={handleAddSection}
      />

      <EditRecipeIngredientModal
        isOpen={isEditIngredientOpen}
        onClose={() => {
          setIsEditIngredientOpen(false)
          setIngredientToEdit(null)
        }}
        onUpdate={handleEditIngredient}
        ingredient={ingredientToEdit}
        sections={sections}
        onCreateSection={handleAddSection}
      />

      <ManageSectionsModal
        isOpen={isManageSectionsOpen}
        onClose={() => setIsManageSectionsOpen(false)}
        sections={sections}
        onAddSection={handleAddSection}
        onUpdateSection={handleUpdateSection}
        onDeleteSection={handleDeleteSection}
      />

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false)
          setIngredientToDelete(null)
        }}
        onConfirm={handleDeleteIngredient}
        title="Eliminar Ingrediente"
        message={`¿Estás seguro de que quieres eliminar "${ingredientToDelete?.name}" de esta receta?`}
        confirmText="Eliminar"
        type="danger"
      />

      <ConfirmModal
        isOpen={isDeleteRecipeOpen}
        onClose={() => setIsDeleteRecipeOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar la receta "${recipe?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Sub-recipe Modals */}
      <AddSubrecipeModal
        isOpen={isAddSubrecipeOpen}
        onClose={() => setIsAddSubrecipeOpen(false)}
        onSuccess={handleAddSubrecipeSuccess}
        recipeId={recipeId}
        currentSubrecipeIds={subrecipes.map(sr => sr.subrecipe_id)}
      />

      <EditSubrecipeModal
        isOpen={isEditSubrecipeOpen}
        onClose={() => {
          setIsEditSubrecipeOpen(false)
          setSubrecipeToEdit(null)
        }}
        onSuccess={handleEditSubrecipeSuccess}
        subrecipe={subrecipeToEdit}
        recipeId={recipeId}
      />

      <ConfirmModal
        isOpen={isDeleteSubrecipeOpen}
        onClose={() => {
          setIsDeleteSubrecipeOpen(false)
          setSubrecipeToDelete(null)
        }}
        onConfirm={() => {
          if (subrecipeToDelete) {
            handleDeleteSubrecipe(subrecipeToDelete)
            setIsDeleteSubrecipeOpen(false)
            setSubrecipeToDelete(null)
          }
        }}
        title="Eliminar Sub-receta"
        message={`¿Estás seguro de que quieres eliminar "${subrecipeToDelete?.subrecipe_name}" de esta receta?`}
        confirmText="Eliminar"
        type="danger"
      />

    </>
  )
}
