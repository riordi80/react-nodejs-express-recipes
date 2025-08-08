'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Trash2, 
  Save, 
  X, 
  Package, 
  Euro,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Heart,
  Info,
  Building,
  Plus,
  Activity
} from 'lucide-react'
import { apiGet, apiPost, apiDelete, apiPut } from '@/lib/api'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { SeasonChips, AllergenChips } from '@/components/ui/Chips'
import { useToastHelpers } from '@/context/ToastContext'
import SupplierManager from '@/components/ui/SupplierManager'
import UnifiedTabs from '@/components/ui/DetailTabs'

interface Ingredient {
  ingredient_id: number
  name: string
  category?: string
  unit?: string
  cost_per_unit?: number
  base_price?: number
  waste_percent?: number
  stock?: number
  stock_minimum?: number
  is_available: boolean
  expiration_date?: string
  season?: string[]
  allergens?: string[]
  calories_per_100g?: number
  protein_per_100g?: number
  carbs_per_100g?: number
  fat_per_100g?: number
  comment?: string
  created_at: string
  updated_at: string
}

const seasonTranslations = {
  enero: 'Enero',
  febrero: 'Febrero',
  marzo: 'Marzo',
  abril: 'Abril',
  mayo: 'Mayo',
  junio: 'Junio',
  julio: 'Julio',
  agosto: 'Agosto',
  septiembre: 'Septiembre',
  octubre: 'Octubre',
  noviembre: 'Noviembre',
  diciembre: 'Diciembre',
  todo_el_año: 'Todo el año'
}

export default function IngredientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ingredientId = params.id as string
  const isNewIngredient = ingredientId === 'new'

  // Toast helpers
  const { success, error: showError } = useToastHelpers()
  

  // State
  const [ingredient, setIngredient] = useState<Ingredient | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing] = useState(true) // Siempre iniciar en modo edición
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [preferredSupplier, setPreferredSupplier] = useState<{id: number, name: string} | null>(null)
  
  // Tabs state
  const [activeTab, setActiveTab] = useState('general')
  
  
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    categories: [] as string[],
    allergens: [] as { allergen_id: number; name: string }[]
  })

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'kg',
    cost_per_unit: '',
    base_price: '',
    waste_percent: '',
    stock: '',
    stock_minimum: '',
    is_available: true,
    expiration_date: '',
    season: ['todo_el_año'] as string[],
    allergens: [] as number[],
    calories_per_100g: '',
    protein_per_100g: '',
    carbs_per_100g: '',
    fat_per_100g: '',
    comment: ''
  })

  // Options for select fields
  const unitOptions = [
    { value: 'kg', label: 'Kilogramos (kg)' },
    { value: 'g', label: 'Gramos (g)' },
    { value: 'l', label: 'Litros (l)' },
    { value: 'ml', label: 'Mililitros (ml)' },
    { value: 'ud', label: 'Unidades (ud)' },
    { value: 'paquete', label: 'Paquetes' },
    { value: 'lata', label: 'Latas' },
    { value: 'botella', label: 'Botellas' }
  ]


  // Load data
  useEffect(() => {
    const loadData = async () => {
      // Primero cargar opciones de filtro
      await loadFilterOptions()
      
      // Luego cargar datos del ingrediente
      if (!isNewIngredient) {
        await loadIngredientData()
      } else {
        initializeNewIngredient()
      }
    }
    
    loadData()
  }, [ingredientId, isNewIngredient])

  // Handle URL hash for direct tab navigation
  useEffect(() => {
    const hash = window.location.hash.substring(1) // Remove the #
    if (hash && ['general', 'stock', 'nutrition', 'suppliers'].includes(hash)) {
      setActiveTab(hash)
    }
  }, [])

  // Debug formData changes
  useEffect(() => {
    console.log('FormData changed:', {
      season: formData.season,
      allergens: formData.allergens,
      name: formData.name
    })
  }, [formData.season, formData.allergens, formData.name])


  const initializeNewIngredient = () => {
    setIngredient({
      ingredient_id: 0,
      name: '',
      category: '',
      unit: 'kg',
      cost_per_unit: 0,
      base_price: 0,
      waste_percent: 0,
      stock: 0,
      stock_minimum: 0,
      is_available: true,
      expiration_date: '',
      season: ['todo_el_año'],
      allergens: [],
      calories_per_100g: 0,
      protein_per_100g: 0,
      carbs_per_100g: 0,
      fat_per_100g: 0,
      comment: '',
      created_at: '',
      updated_at: ''
    })
    setLoading(false)
  }

  const loadFilterOptions = async () => {
    try {
      const [categoriesRes, allergensRes] = await Promise.all([
        apiGet('/ingredient-categories'),
        apiGet('/allergens')
      ])
      
      setFilterOptions({
        categories: categoriesRes.data.map((c: any) => c.name || c),
        allergens: allergensRes.data // Mantener objetos completos con ID y name
      })
    } catch (error) {
      console.error('Error loading filter options:', error)
      // Fallback to empty arrays
      setFilterOptions({
        categories: [],
        allergens: []
      })
    }
  }

  const loadIngredientData = async () => {
    try {
      setLoading(true)
      const response = await apiGet<Ingredient>(`/ingredients/${ingredientId}`)
      const ingredientData = response.data
      setIngredient(ingredientData)
      
      // Load preferred supplier info
      await loadPreferredSupplier()
      
      // Format date for input (YYYY-MM-DD)
      let expirationDate = ''
      if (ingredientData.expiration_date) {
        expirationDate = new Date(ingredientData.expiration_date).toISOString().split('T')[0]
      }
      
      // Procesar season data
      let seasonData: string[] = ['todo_el_año']
      if (ingredientData.season) {
        if (Array.isArray(ingredientData.season)) {
          seasonData = ingredientData.season.length > 0 ? ingredientData.season : ['todo_el_año']
        } else if (typeof ingredientData.season === 'string') {
          // Las temporadas se almacenan como string separado por comas
          const seasonString = ingredientData.season as string
          if (seasonString.includes(',')) {
            seasonData = seasonString.split(',').map((s: string) => s.trim()).filter((s: string) => s)
          } else {
            seasonData = [seasonString]
          }
        }
      }

      // Procesar allergens data  
      let allergensData: number[] = []
      if (ingredientData.allergens) {
        if (Array.isArray(ingredientData.allergens)) {
          // Puede ser array de objetos {allergen_id, name} o array de IDs
          allergensData = ingredientData.allergens.map((allergen: any) => {
            if (typeof allergen === 'object' && allergen.allergen_id) {
              return allergen.allergen_id
            } else if (typeof allergen === 'number') {
              return allergen
            } else if (typeof allergen === 'string') {
              // Si es nombre, buscar el ID correspondiente
              const found = filterOptions.allergens.find(a => a.name === allergen)
              return found ? found.allergen_id : null
            }
            return null
          }).filter(id => id !== null)
        } else if (typeof ingredientData.allergens === 'string') {
          const allergenString = ingredientData.allergens
          try {
            // Si es string, puede ser JSON serializado
            const parsed = JSON.parse(allergenString)
            if (Array.isArray(parsed)) {
              allergensData = parsed.map((allergen: any) => {
                if (typeof allergen === 'object' && allergen.allergen_id) {
                  return allergen.allergen_id
                } else if (typeof allergen === 'number') {
                  return allergen
                } else if (typeof allergen === 'string') {
                  const found = filterOptions.allergens.find(a => a.name === allergen)
                  return found ? found.allergen_id : null
                }
                return null
              }).filter(id => id !== null)
            }
          } catch {
            // Si no es JSON válido y es nombre, buscar ID
            const found = filterOptions.allergens.find(a => a.name === allergenString)
            if (found) allergensData = [found.allergen_id]
          }
        }
      }

      console.log('Loading ingredient data:', {
        originalSeason: ingredientData.season,
        processedSeason: seasonData,
        originalAllergens: ingredientData.allergens,
        processedAllergens: allergensData
      })

      // Set form data
      setFormData({
        name: ingredientData.name || '',
        category: ingredientData.category || '',
        unit: ingredientData.unit || 'kg',
        cost_per_unit: ingredientData.cost_per_unit?.toString() || '',
        base_price: ingredientData.base_price?.toString() || '',
        waste_percent: ingredientData.waste_percent ? (ingredientData.waste_percent * 100).toString() : '',
        stock: ingredientData.stock?.toString() || '',
        stock_minimum: ingredientData.stock_minimum?.toString() || '',
        is_available: ingredientData.is_available,
        expiration_date: expirationDate,
        season: seasonData,
        allergens: allergensData,
        calories_per_100g: ingredientData.calories_per_100g?.toString() || '',
        protein_per_100g: ingredientData.protein_per_100g?.toString() || '',
        carbs_per_100g: ingredientData.carbs_per_100g?.toString() || '',
        fat_per_100g: ingredientData.fat_per_100g?.toString() || '',
        comment: ingredientData.comment || ''
      })
      
      setError(null)
    } catch (err) {
      setError('Error al cargar el ingrediente')
      console.error('Error loading ingredient:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPreferredSupplier = async () => {
    try {
      const response = await apiGet(`/ingredients/${ingredientId}/suppliers`)
      const suppliers = response.data
      const preferred = suppliers.find((supplier: any) => supplier.is_preferred_supplier)
      if (preferred) {
        setPreferredSupplier({
          id: preferred.supplier_id,
          name: preferred.name
        })
      } else {
        setPreferredSupplier(null)
      }
    } catch (error) {
      console.error('Error loading preferred supplier:', error)
      setPreferredSupplier(null)
    }
  }

  const handleSave = async () => {
    try {
      // Validation
      const errors: Record<string, string> = {}
      
      if (!formData.name.trim()) {
        errors.name = 'El nombre del ingrediente es obligatorio'
      }
      
      if (!formData.unit) {
        errors.unit = 'La unidad de medida es obligatoria'
      }
      
      // Validación para campos numéricos
      const validateNumericField = (value: string, fieldName: string, allowZero: boolean = true): boolean => {
        if (!value || value.trim() === '') return true // Campos opcionales
        const num = Number(value)
        if (isNaN(num)) {
          errors[fieldName] = `${fieldName} debe ser un número válido`
          return false
        }
        if (!allowZero && num === 0) {
          errors[fieldName] = `${fieldName} debe ser mayor que cero`
          return false
        }
        if (num < 0) {
          errors[fieldName] = `${fieldName} debe ser un número positivo`
          return false
        }
        return true
      }

      validateNumericField(formData.cost_per_unit, 'Costo por unidad')
      validateNumericField(formData.base_price, 'Precio base')
      validateNumericField(formData.waste_percent, 'Porcentaje de merma')
      validateNumericField(formData.stock, 'Stock')
      validateNumericField(formData.stock_minimum, 'Stock mínimo')
      validateNumericField(formData.calories_per_100g, 'Calorías')
      validateNumericField(formData.protein_per_100g, 'Proteínas')
      validateNumericField(formData.carbs_per_100g, 'Carbohidratos')
      validateNumericField(formData.fat_per_100g, 'Grasas')
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        showError('Por favor, corrige los errores en el formulario', 'Error de Validación')
        return
      }

      // Log para depuración
      console.log('FormData before save:', formData)

      // Función helper para convertir strings a números o null
      const parseNumberOrNull = (value: string): number | null => {
        if (!value || value.trim() === '') return null
        const parsed = Number(value.trim())
        return isNaN(parsed) ? null : parsed
      }

      // Calcular el precio neto automáticamente
      const basePrice = parseNumberOrNull(formData.base_price)
      const wastePercent = parseNumberOrNull(formData.waste_percent)
      let calculatedCostPerUnit = parseNumberOrNull(formData.cost_per_unit)
      
      // Si tenemos precio base y merma, calcular el precio neto
      if (basePrice && wastePercent !== null) {
        calculatedCostPerUnit = basePrice * (1 + wastePercent / 100)
      }

      const ingredientData = {
        name: formData.name.trim(),
        category: formData.category.trim() || null,
        unit: formData.unit,
        cost_per_unit: calculatedCostPerUnit,
        base_price: basePrice,
        waste_percent: wastePercent !== null ? wastePercent / 100 : null,
        stock: parseNumberOrNull(formData.stock),
        stock_minimum: parseNumberOrNull(formData.stock_minimum),
        is_available: Boolean(formData.is_available),
        expiration_date: formData.expiration_date || null,
        season: Array.isArray(formData.season) && formData.season.length > 0 ? formData.season : null,
        allergens: Array.isArray(formData.allergens) ? formData.allergens : [],
        calories_per_100g: parseNumberOrNull(formData.calories_per_100g),
        protein_per_100g: parseNumberOrNull(formData.protein_per_100g),
        carbs_per_100g: parseNumberOrNull(formData.carbs_per_100g),
        fat_per_100g: parseNumberOrNull(formData.fat_per_100g),
        comment: formData.comment.trim() || null
      }

      // Log para depuración
      console.log('Ingredient data to send:', ingredientData)

      if (isNewIngredient) {
        const response = await apiPost<{ ingredient_id: number }>('/ingredients', ingredientData)
        success('Ingrediente creado correctamente', 'Ingrediente Creado')
        router.push(`/ingredients/${response.data.ingredient_id}`)
      } else {
        await apiPut(`/ingredients/${ingredientId}`, ingredientData)
        await loadIngredientData()
        success('Ingrediente actualizado correctamente', 'Ingrediente Actualizado')
      }
      
      setValidationErrors({})
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || (isNewIngredient ? 'Error al crear el ingrediente' : 'Error al guardar el ingrediente')
      console.error('Error saving ingredient:', err)
      console.error('Error details:', err?.response?.data)
      showError(errorMessage, 'Error al Guardar')
      setError(errorMessage)
    }
  }

  const openDeleteModal = () => {
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    try {
      await apiDelete(`/ingredients/${ingredientId}`)
      router.push('/ingredients')
    } catch (err) {
      setError('Error al eliminar el ingrediente')
      console.error('Error deleting ingredient:', err)
      // Keep modal open on error
    }
  }



  // Calculate metrics

  const calculateStockMetrics = () => {
    if (!ingredient) return null

    const stock = Number(formData.stock) || Number(ingredient.stock) || 0
    const stockMin = Number(formData.stock_minimum) || Number(ingredient.stock_minimum) || 0
    const costPerUnit = Number(formData.cost_per_unit) || Number(ingredient.cost_per_unit) || 0
    
    const totalValue = stock * costPerUnit
    const stockStatus = stock === 0 ? 'Sin stock' : stock < stockMin && stockMin > 0 ? 'Stock bajo' : 'Stock OK'
    const stockDeficit = stock < stockMin ? stockMin - stock : 0

    return {
      stock,
      stockMin,
      costPerUnit,
      totalValue,
      stockStatus,
      stockDeficit
    }
  }

  // Format functions
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getDaysUntilExpiry = (dateString?: string) => {
    if (!dateString) return null
    const expiry = new Date(dateString)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Tab content renderers
  const renderGeneralTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Basic Information - Takes 2/3 of the width */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
            Información Básica
          </h3>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del ingrediente <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nombre del ingrediente"
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-900">{ingredient?.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              {isEditing ? (
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Seleccionar categoría</option>
                  {filterOptions.categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900">
                  {ingredient?.category || 'Sin categoría'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="l">l</option>
                    <option value="ml">ml</option>
                    <option value="ud">unidad</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{ingredient?.unit || 'kg'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Porcentaje de merma (%)
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.waste_percent}
                    onChange={(e) => setFormData({ ...formData, waste_percent: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="0"
                  />
                ) : (
                  <p className="text-gray-900">{ingredient?.waste_percent || 0}%</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo por unidad (€)
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
                />
              ) : (
                <p className="text-gray-900">{formatCurrency(ingredient?.cost_per_unit)}</p>
              )}
            </div>

            {/* Availability */}
            {isEditing && (
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="is_available" className="text-sm font-medium text-gray-700">
                  Ingrediente disponible
                </label>
              </div>
            )}

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentarios
              </label>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Comentarios adicionales sobre el ingrediente..."
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {ingredient?.comment || 'Sin comentarios'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Additional Information - Takes 1/3 of the width */}
      <div className="lg:col-span-1 space-y-6">
        {ingredient && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Info className="h-5 w-5 text-orange-600" />
              </div>
              Información Adicional
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Disponibilidad:</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${ingredient.is_available ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'}`}>
                  {ingredient.is_available ? 'Disponible' : 'No disponible'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Proveedor:</span>
                {preferredSupplier ? (
                  <button
                    onClick={() => setActiveTab('suppliers')}
                    className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                  >
                    {preferredSupplier.name}
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('suppliers')}
                    className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="hidden md:inline">Configurar proveedores</span>
                    <span className="md:hidden">Configurar</span>
                  </button>
                )}
              </div>
              
              {ingredient.expiration_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Fecha de expiración:</span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(ingredient.expiration_date)}
                    </div>
                    <div className="text-xs font-medium mt-1">
                      {(() => {
                        const days = getDaysUntilExpiry(ingredient.expiration_date)
                        if (days === null) return null
                        if (days < 0) return <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full">Expirado hace {Math.abs(days)} días</span>
                        if (days === 0) return <span className="text-red-600 bg-red-100 px-2 py-1 rounded-full">Expira hoy</span>
                        if (days <= 7) return <span className="text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Expira en {days} días</span>
                        return <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full">Expira en {days} días</span>
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderStockTab = () => (
    <div className="space-y-6">
      {/* Stock Management */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="bg-orange-100 p-2 rounded-lg">
            <Package className="h-5 w-5 text-orange-600" />
          </div>
          Gestión de Stock
        </h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock actual
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0"
                />
              ) : (
                <p className="text-gray-900">{ingredient?.stock || 0} {ingredient?.unit || 'kg'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock mínimo
              </label>
              {isEditing ? (
                <input
                  type="number"
                  step="0.01"
                  value={formData.stock_minimum}
                  onChange={(e) => setFormData({ ...formData, stock_minimum: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0"
                />
              ) : (
                <p className="text-gray-900">{ingredient?.stock_minimum || 0} {ingredient?.unit || 'kg'}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de expiración
            </label>
            {isEditing ? (
              <input
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            ) : (
              <div>
                <p className="text-gray-900">{formatDate(ingredient?.expiration_date)}</p>
                {ingredient?.expiration_date && (
                  <p className="text-sm text-gray-500 mt-1">
                    {(() => {
                      const days = getDaysUntilExpiry(ingredient.expiration_date)
                      if (days === null) return null
                      if (days < 0) return <span className="text-red-600">Expirado hace {Math.abs(days)} días</span>
                      if (days === 0) return <span className="text-red-600">Expira hoy</span>
                      if (days <= 7) return <span className="text-yellow-600">Expira en {days} días</span>
                      return <span className="text-green-600">Expira en {days} días</span>
                    })()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Future: Stock History, Movements, etc. */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="bg-orange-100 p-2 rounded-lg">
            <Calendar className="h-4 w-4 text-orange-600" />
          </div>
          Historial de Movimientos
        </h4>
        <div className="text-center py-8">
          <Calendar className="h-8 w-8 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-sm">
            Próximamente: historial de entradas, salidas y ajustes de stock
          </p>
        </div>
      </div>
    </div>
  )

  const renderNutritionTab = () => (
    <div className="space-y-6">
      {/* Nutritional Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="bg-orange-100 p-2 rounded-lg">
            <Activity className="h-5 w-5 text-orange-600" />
          </div>
          Información Nutricional (por 100g)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calorías
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                value={formData.calories_per_100g}
                onChange={(e) => setFormData({ ...formData, calories_per_100g: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0"
              />
            ) : (
              <p className="text-gray-900">{ingredient?.calories_per_100g || 0} kcal</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proteínas (g)
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                value={formData.protein_per_100g}
                onChange={(e) => setFormData({ ...formData, protein_per_100g: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0"
              />
            ) : (
              <p className="text-gray-900">{ingredient?.protein_per_100g || 0}g</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Carbohidratos (g)
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                value={formData.carbs_per_100g}
                onChange={(e) => setFormData({ ...formData, carbs_per_100g: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0"
              />
            ) : (
              <p className="text-gray-900">{ingredient?.carbs_per_100g || 0}g</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grasas (g)
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                value={formData.fat_per_100g}
                onChange={(e) => setFormData({ ...formData, fat_per_100g: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0"
              />
            ) : (
              <p className="text-gray-900">{ingredient?.fat_per_100g || 0}g</p>
            )}
          </div>
        </div>
      </div>

      {/* Allergens and Season */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </div>
            Alérgenos
          </h4>
          {isEditing ? (
            <AllergenChips
              selected={formData.allergens}
              options={filterOptions.allergens}
              onChange={(allergens) => setFormData({ ...formData, allergens })}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {ingredient?.allergens && ingredient.allergens.length > 0 ? (
                ingredient.allergens.map((allergen, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {allergen}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">Sin alérgenos declarados</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
            Temporada
          </h4>
          {isEditing ? (
            <SeasonChips
              selected={formData.season}
              onChange={(season) => setFormData({ ...formData, season })}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {ingredient?.season && ingredient.season.length > 0 ? (
                ingredient.season.map((month, index) => (
                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {seasonTranslations[month as keyof typeof seasonTranslations] || month}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500">Temporada no especificada</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderSuppliersTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Building className="h-5 w-5 text-orange-600" />
            </div>
            Gestión de Proveedores
          </h3>
          
          {!isNewIngredient && (
            <button
              onClick={() => {
                // Buscar el botón de añadir del SupplierManager y hacer click
                const addButton = document.querySelector('[data-supplier-add-button]') as HTMLButtonElement
                if (addButton) {
                  addButton.click()
                }
              }}
              className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Añadir proveedor</span>
              <span className="md:hidden">Añadir</span>
            </button>
          )}
        </div>
        
        {!isNewIngredient ? (
          <SupplierManager
            entityId={parseInt(ingredientId)}
            entityType="ingredient"
            disabled={false}
            title=""
            className="bg-transparent border-0 shadow-none p-0"
          />
        ) : (
          <div className="text-center py-8">
            <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Gestión de Proveedores
            </h3>
            <p className="text-gray-500">
              Guarda el ingrediente primero para poder gestionar proveedores
            </p>
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

  if (!ingredient && !isNewIngredient) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">No se encontró el ingrediente</p>
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
              onClick={() => router.push('/ingredients')}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1 pr-2">
              <h1 className="text-lg font-semibold text-gray-900 leading-tight break-words">
                {isNewIngredient ? 'Nuevo Ingrediente' : (ingredient?.name || 'Cargando...')}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {!isNewIngredient && (
              <button
                onClick={openDeleteModal}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar ingrediente"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={handleSave}
              className="p-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              title={isNewIngredient ? 'Crear ingrediente' : 'Guardar cambios'}
            >
              <Save className="h-4 w-4" />
            </button>
            
            {!isNewIngredient && (
              <button
                onClick={() => router.push('/ingredients')}
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
              onClick={() => router.push('/ingredients')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNewIngredient ? 'Nuevo Ingrediente' : (ingredient?.name || 'Cargando...')}
              </h1>
              {ingredient && !isEditing && (
                <div className="flex items-center space-x-2 mt-1">
                  {ingredient.category && (
                    <span className="text-sm text-gray-500">{ingredient.category}</span>
                  )}
                  {ingredient.season && Array.isArray(ingredient.season) && ingredient.season.length > 0 && (
                    <>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        {ingredient.season.map(s => seasonTranslations[s as keyof typeof seasonTranslations] || s).join(', ')}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {!isNewIngredient && (
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
              {isNewIngredient ? 'Crear' : 'Guardar'}
            </button>
            
            {!isNewIngredient && (
              <button
                onClick={() => router.push('/ingredients')}
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
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        

        {/* Stats Cards siguiendo patrón TotXo */}
        {ingredient && !isNewIngredient && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stock Actual</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {ingredient.stock ?? 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{ingredient.unit || 'ud'}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Costo/Unidad</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {formatCurrency(ingredient.cost_per_unit)}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Euro className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  {(() => {
                    const metrics = calculateStockMetrics()
                    return (
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {metrics ? formatCurrency(metrics.totalValue) : formatCurrency(0)}
                      </p>
                    )
                  })()}
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  {(() => {
                    const metrics = calculateStockMetrics()
                    const statusColor = metrics?.stockStatus === 'Stock OK' ? 'text-green-600' : 
                                       metrics?.stockStatus === 'Stock bajo' ? 'text-yellow-600' : 'text-red-600'
                    return (
                      <p className={`text-lg font-bold mt-1 ${statusColor}`}>
                        {metrics?.stockStatus || 'Desconocido'}
                      </p>
                    )
                  })()}
                  {ingredient.is_available ? (
                    <p className="text-xs text-green-600 mt-1">Disponible</p>
                  ) : (
                    <p className="text-xs text-red-600 mt-1">No disponible</p>
                  )}
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  {(() => {
                    const metrics = calculateStockMetrics()
                    const IconComponent = metrics?.stockStatus === 'Stock OK' ? CheckCircle : AlertTriangle
                    return <IconComponent className="h-6 w-6 text-orange-600" />
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content with Tabs */}
        {!isNewIngredient && (
          <UnifiedTabs
            variant="detail"
            mobileStyle="orange"
            tabs={[
              { id: 'general', label: 'Información General', icon: Package },
              { id: 'stock', label: 'Stock y Gestión', icon: TrendingUp },
              { id: 'nutrition', label: 'Información Nutricional', icon: Activity },
              { id: 'suppliers', label: 'Proveedores', icon: Building }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'stock' && renderStockTab()}
            {activeTab === 'nutrition' && renderNutritionTab()}
            {activeTab === 'suppliers' && renderSuppliersTab()}
          </UnifiedTabs>
        )}

        {/* New ingredient form without tabs */}
        {isNewIngredient && <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                Información Básica
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del ingrediente <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Nombre del ingrediente"
                        />
                        {validationErrors.name && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-900">{ingredient?.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría
                    </label>
                    {isEditing ? (
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Seleccionar categoría</option>
                        {filterOptions.categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-gray-900">
                        {ingredient?.category || 'Sin categoría'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unidad <span className="text-red-500">*</span>
                    </label>
                    {isEditing ? (
                      <div>
                        <select
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        >
                          {unitOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {validationErrors.unit && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.unit}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-900">
                        {unitOptions.find(opt => opt.value === ingredient?.unit)?.label || ingredient?.unit || 'No especificada'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Precio base (€)
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="number"
                          step="0.0001"
                          value={formData.base_price}
                          onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0.0000"
                        />
                        {validationErrors.base_price && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.base_price}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-900">
                        {formatCurrency(ingredient?.base_price, 4)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Merma (%)
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.waste_percent}
                          onChange={(e) => setFormData({ ...formData, waste_percent: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        {validationErrors.waste_percent && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.waste_percent}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-900">
                        {ingredient?.waste_percent ? `${(ingredient.waste_percent * 100).toFixed(2)}%` : '0.00%'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Precio neto calculado */}
                {isEditing && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-orange-800 mb-2">💰 Precio Neto (Calculado automáticamente)</h4>
                    <p className="text-lg font-bold text-orange-900">
                      {(() => {
                        const basePrice = Number(formData.base_price) || 0
                        const wastePercent = Number(formData.waste_percent) || 0
                        const netPrice = basePrice * (1 + wastePercent / 100)
                        return netPrice > 0 ? formatCurrency(netPrice, 4) : 'Se calcula al introducir precio base'
                      })()}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Fórmula: Precio Base × (1 + Merma%)
                    </p>
                  </div>
                )}

                {/* Availability checkbox */}
                {isEditing && (
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="is_available"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="is_available" className="text-sm font-medium text-gray-700">
                      Disponible para uso
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Temporada y Alérgenos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Temporada */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  Temporada
                </h3>
                
                <div className="space-y-4">
                  {isEditing ? (
                    <SeasonChips
                      selected={formData.season}
                      onChange={(selected) => {
                        console.log('Season chips onChange:', selected)
                        setFormData({ ...formData, season: selected })
                      }}
                      size="sm"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {ingredient?.season && Array.isArray(ingredient.season) && ingredient.season.length > 0 ? (
                        ingredient.season.map((s) => (
                          <span key={s} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {seasonTranslations[s as keyof typeof seasonTranslations] || s}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No especificada</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Alérgenos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                  Alérgenos
                </h3>
                
                <div className="space-y-4">
                  {isEditing ? (
                    <AllergenChips
                      options={filterOptions.allergens}
                      selected={formData.allergens}
                      onChange={(selected) => {
                        console.log('Allergen chips onChange:', selected)
                        setFormData({ ...formData, allergens: selected })
                      }}
                      size="sm"
                      allowEmpty={true}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {ingredient?.allergens && ingredient.allergens.length > 0 ? (
                        ingredient.allergens.map((allergen) => {
                          // allergen puede ser string (nombre) o number (ID)
                          let allergenName = allergen
                          if (typeof allergen === 'number') {
                            const found = filterOptions.allergens.find(a => a.allergen_id === allergen)
                            allergenName = found ? found.name : `ID: ${allergen}`
                          }
                          return (
                            <span key={allergen} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {allergenName}
                            </span>
                          )
                        })
                      ) : (
                        <span className="text-sm text-gray-500">Sin alérgenos declarados</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stock Analysis */}
            {ingredient && !isEditing && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </div>
                  Análisis de Stock
                </h3>
                {(() => {
                  const metrics = calculateStockMetrics()
                  if (!metrics) return null
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Stock actual:</span>
                        <span className="font-medium text-gray-900">{metrics.stock} {ingredient.unit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Stock mínimo:</span>
                        <span className="font-medium text-gray-900">{metrics.stockMin} {ingredient.unit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Valor total:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(metrics.totalValue)}</span>
                      </div>
                      {metrics.stockDeficit > 0 && (
                        <div className="flex items-center justify-between border-t pt-4">
                          <span className="text-sm text-red-600">Déficit de stock:</span>
                          <span className="font-medium text-red-600">{metrics.stockDeficit} {ingredient.unit}</span>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Inventario */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                Inventario
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock actual
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        {validationErrors.stock && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.stock}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">
                        {ingredient?.stock ?? 0} {ingredient?.unit || 'ud'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock mínimo
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.stock_minimum}
                          onChange={(e) => setFormData({ ...formData, stock_minimum: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                        {validationErrors.stock_minimum && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors.stock_minimum}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900">
                        {ingredient?.stock_minimum ?? 0} {ingredient?.unit || 'ud'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de caducidad
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formData.expiration_date}
                        onChange={(e) => setFormData({ ...formData, expiration_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {formatDate(ingredient?.expiration_date)}
                        {ingredient?.expiration_date && (() => {
                          const daysLeft = getDaysUntilExpiry(ingredient.expiration_date)
                          if (daysLeft !== null) {
                            if (daysLeft < 0) {
                              return <span className="ml-2 text-xs text-red-600">(Caducado)</span>
                            } else if (daysLeft <= 7) {
                              return <span className="ml-2 text-xs text-yellow-600">({daysLeft} días)</span>
                            } else if (daysLeft <= 30) {
                              return <span className="ml-2 text-xs text-gray-500">({daysLeft} días)</span>
                            }
                          }
                          return null
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Suppliers Section */}
            {ingredient && !isNewIngredient && (
              <SupplierManager 
                entityId={ingredient.ingredient_id}
                entityType="ingredient"
                disabled={false}
                title="Proveedores"
              />
            )}

            {/* Información Nutricional */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Heart className="h-5 w-5 text-orange-600" />
                </div>
                Información Nutricional
              </h3>
              <p className="text-xs text-gray-500 mb-4">Por cada 100g del ingrediente</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Calorías (kcal)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.calories_per_100g}
                        onChange={(e) => setFormData({ ...formData, calories_per_100g: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {ingredient?.calories_per_100g ?? 0} kcal
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proteínas (g)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.protein_per_100g}
                        onChange={(e) => setFormData({ ...formData, protein_per_100g: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {ingredient?.protein_per_100g ?? 0}g
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Carbohidratos (g)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.carbs_per_100g}
                        onChange={(e) => setFormData({ ...formData, carbs_per_100g: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {ingredient?.carbs_per_100g ?? 0}g
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grasas (g)
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.fat_per_100g}
                        onChange={(e) => setFormData({ ...formData, fat_per_100g: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-sm text-gray-900">
                        {ingredient?.fat_per_100g ?? 0}g
                      </p>
                    )}
                  </div>
                </div>

                {/* Comentarios */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentarios
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Comentarios adicionales sobre el ingrediente..."
                    />
                  ) : (
                    <p className="text-sm text-gray-900">
                      {ingredient?.comment || 'Sin comentarios'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            {ingredient && !isEditing && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Info className="h-5 w-5 text-orange-600" />
                  </div>
                  Información Adicional
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Disponibilidad:</span>
                    <span className={`text-sm font-medium ${ingredient.is_available ? 'text-green-600' : 'text-red-600'}`}>
                      {ingredient.is_available ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Creado:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(ingredient.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Actualizado:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(ingredient.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        }
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar el ingrediente "${ingredient?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </>
  )
}

