'use client'

import { useState, useEffect } from 'react'
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
  BookOpen
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import AddIngredientToRecipeModal from '@/components/modals/AddIngredientToRecipeModal'
import EditRecipeIngredientModal from '@/components/modals/EditRecipeIngredientModal'
import ManageSectionsModal from '@/components/modals/ManageSectionsModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToastHelpers } from '@/context/ToastContext'
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

import { 
  difficultyOptions, 
  difficultyTranslations, 
  difficultyColors, 
  defaultRecipeValues 
} from '@/constants/forms'

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
  const [targetFoodCostPercentage, setTargetFoodCostPercentage] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(true) // Siempre iniciar en modo edición
  
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

  // Load data
  useEffect(() => {
    if (!isNewRecipe) {
      loadRecipeData()
    } else {
      initializeNewRecipe()
    }
    loadAvailableCategories()
    loadRestaurantSettings()
  }, [recipeId, isNewRecipe]) // Dependencies are intentionally limited to avoid infinite loops

  // Handle URL hash for direct tab navigation
  useEffect(() => {
    const hash = window.location.hash.substring(1) // Remove the #
    if (hash && ['general', 'ingredients', 'preparation'].includes(hash)) {
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
  }

  const loadAvailableCategories = async () => {
    try {
      const response = await apiGet<Category[]>('/recipe-categories')
      setAvailableCategories(response.data)
    } catch (err) {
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
      const response = await apiGet<{target_food_cost_percentage: number}>('/restaurant-info')
      if (response.data?.target_food_cost_percentage) {
        setTargetFoodCostPercentage(response.data.target_food_cost_percentage)
      } else {
        setTargetFoodCostPercentage(30) // Fallback si no hay configuración
      }
    } catch (err) {
      setTargetFoodCostPercentage(30) // Fallback en caso de error
    }
  }

  const loadRecipeData = async () => {
    try {
      setLoading(true)
      
      // Load basic recipe data, ingredients, and sections
      const [recipeResponse, ingredientsResponse, sectionsResponse] = await Promise.all([
        apiGet<Recipe>(`/recipes/${recipeId}`),
        apiGet<RecipeIngredient[]>(`/recipes/${recipeId}/ingredients`),
        apiGet<Section[]>(`/recipes/${recipeId}/sections`)
      ])
      
      const recipeData = recipeResponse.data
      setRecipe(recipeData)
      setIngredients(ingredientsResponse.data || [])
      setSections(sectionsResponse.data || [])
      
      // Set form data
      setFormData({
        name: recipeData.name,
        instructions: recipeData.instructions || '',
        prep_time: recipeData.prep_time?.toString() || '',
        servings: recipeData.servings,
        production_servings: recipeData.production_servings,
        difficulty: recipeData.difficulty || '',
        net_price: recipeData.net_price.toString(),
        price_per_serving: (recipeData.net_price / recipeData.servings).toString(),
        is_featured_recipe: recipeData.is_featured_recipe,
        tax_id: recipeData.tax_id,
        // Campos nutricionales - se cargarán cuando esté disponible nutrition
        calories: '',
        protein: '',
        carbs: '',
        fat: ''
      })
      
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

  const loadAdditionalData = async () => {
    // Load nutrition
    try {
      const nutritionResponse = await apiGet<Nutrition>(`/recipes/${recipeId}/nutrition`)
      const nutritionData = nutritionResponse.data
      setNutrition(nutritionData)
      
      // Update form data with nutrition values
      setFormData(prev => ({
        ...prev,
        calories: nutritionData.calories?.toString() || '',
        protein: nutritionData.protein?.toString() || '',
        carbs: nutritionData.carbs?.toString() || '',
        fat: nutritionData.fat?.toString() || ''
      }))
    } catch (nutritionErr) {
      setNutrition(null)
    }
    
    // Load allergens
    try {
      const allergensResponse = await apiGet<Allergen[]>(`/recipes/${recipeId}/allergens`)
      setAllergens(allergensResponse.data || [])
    } catch (allergensErr) {
      setAllergens([])
    }
    
    // Load categories
    try {
      const recipesListResponse = await apiGet<Array<{recipe_id: number, categories: string | string[]}>>('/recipes')
      const recipeWithCategories = recipesListResponse.data.find(r => r.recipe_id === parseInt(recipeId))
      if (recipeWithCategories?.categories) {
        const cats = typeof recipeWithCategories.categories === 'string' 
          ? recipeWithCategories.categories.split(', ').map((cat: string) => cat.trim())
          : Array.isArray(recipeWithCategories.categories) 
          ? recipeWithCategories.categories 
          : [recipeWithCategories.categories]
        setCategories(cats)
      }
    } catch (categoriesErr) {
      setCategories([])
    }
  }

  const handleSave = async () => {
    try {
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

      if (isNewRecipe) {
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
        
        await loadRecipeData()
        success('Receta actualizada correctamente', 'Receta Actualizada')
      }
      
      setValidationErrors({})
    } catch (err) {
      showError(isNewRecipe ? 'Error al crear la receta' : 'Error al guardar la receta')
      console.error('Error saving recipe:', err)
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
    } catch (error) {
      console.error('Error adding ingredient:', error)
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
    } catch (error) {
      console.error('Error updating ingredient:', error)
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
    } catch (error) {
      console.error('Error deleting ingredient:', error)
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
      console.error('Error creating section:', error)
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
    } catch (error) {
      console.error('Error updating section:', error)
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
    } catch (error) {
      console.error('Error deleting section:', error)
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <div key={sectionId} className="space-y-3">
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
                    
                    {/* Ingredientes de la sección */}
                    <div className="space-y-2">
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

  const renderPreparationTab = () => (
    <div className="space-y-6">
      {/* Instructions */}
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
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
              className="p-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              title={isNewRecipe ? 'Crear receta' : 'Guardar cambios'}
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
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
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
                { id: 'preparation', label: 'Preparación', icon: BookOpen }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="detail"
              mobileStyle="orange"
            >
              {activeTab === 'general' && renderGeneralTab()}
              {activeTab === 'ingredients' && renderIngredientsTab()}
              {activeTab === 'preparation' && renderPreparationTab()}
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
    </>
  )
}
