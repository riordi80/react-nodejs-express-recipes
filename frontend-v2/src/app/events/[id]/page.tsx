'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Trash2, 
  Save, 
  X, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Euro, 
  Utensils,
  ChefHat,
  Info,
  Heart,
  Search,
  Edit
} from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import ConfirmModal from '@/components/ui/ConfirmModal'
import Modal from '@/components/ui/Modal'
// Tipo Recipe que coincide con la API del backend
interface Recipe {
  recipe_id: number
  name: string
  description?: string
  difficulty: 'easy' | 'medium' | 'hard'
  prep_time?: number
  servings: number
  production_servings?: number
  cost_per_serving?: number
  categories?: string
  instructions?: string
  image_url?: string
  allergens?: string[]
  created_at: string
  updated_at: string
}
import { useToastHelpers } from '@/context/ToastContext'

interface Event {
  event_id: number
  name: string
  description?: string
  event_date: string
  event_time?: string
  guests_count: number
  location?: string
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  budget?: number
  notes?: string
  created_at: string
  updated_at: string
}

interface EventRecipe {
  recipe_id: number
  recipe_name: string
  portions: number
  course_type: 'starter' | 'main' | 'side' | 'dessert' | 'beverage'
  notes?: string
  cost_per_serving?: number
  servings?: number // Porciones originales de la receta
  ingredients?: EventRecipeIngredient[]
}

interface EventRecipeIngredient {
  ingredient_id: number
  ingredient_name: string
  quantity_per_serving: number
  unit: string
  base_price: number
  waste_percent: number
}

const statusColors = {
  planned: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

const statusLabels = {
  planned: 'Planificado',
  confirmed: 'Confirmado',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado'
}

const courseTypeLabels = {
  starter: 'Entrante',
  main: 'Principal',
  side: 'Acompañamiento',
  dessert: 'Postre',
  beverage: 'Bebida'
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string
  const isNewEvent = eventId === 'new'

  // Toast helpers
  const { success, error: showError } = useToastHelpers()

  // State
  const [event, setEvent] = useState<Event | null>(null)
  const [eventRecipes, setEventRecipes] = useState<EventRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(true) // Siempre iniciar en modo edición
  
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  // Add recipe modal state
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false)
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([])
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<number[]>([])
  const [recipePortions, setRecipePortions] = useState<Record<number, number>>({})
  const [recipeCourseTypes, setRecipeCourseTypes] = useState<Record<number, string>>({})
  const [recipeNotes, setRecipeNotes] = useState<Record<number, string>>({})
  const [recipeSearchText, setRecipeSearchText] = useState('')
  const [loadingRecipes, setLoadingRecipes] = useState(false)
  
  // Edit recipe modal state
  const [isEditRecipeOpen, setIsEditRecipeOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<EventRecipe | null>(null)
  const [editFormData, setEditFormData] = useState({
    portions: 1,
    course_type: 'main' as 'starter' | 'main' | 'side' | 'dessert' | 'beverage',
    notes: ''
  })
  
  // Delete recipe modal state
  const [isDeleteRecipeOpen, setIsDeleteRecipeOpen] = useState(false)
  const [recipeToDelete, setRecipeToDelete] = useState<EventRecipe | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    event_time: '',
    guests_count: 1,
    location: '',
    status: 'planned' as 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
    budget: '',
    notes: ''
  })

  // Load event data
  useEffect(() => {
    if (!isNewEvent) {
      loadEventData()
    } else {
      setLoading(false)
    }
  }, [eventId, isNewEvent])

  const loadEventData = async () => {
    try {
      setLoading(true)
      const eventResponse = await apiGet<Event & { menu?: EventRecipe[] }>(`/events/${eventId}`)
      
      const eventData = eventResponse.data
      setEvent(eventData)
      setEventRecipes(eventData.menu || [])
      
      
      
      // Set form data
      setFormData({
        name: eventData.name,
        description: eventData.description || '',
        event_date: eventData.event_date,
        event_time: eventData.event_time || '',
        guests_count: eventData.guests_count,
        location: eventData.location || '',
        status: eventData.status,
        budget: eventData.budget?.toString() || '',
        notes: eventData.notes || ''
      })
    } catch (err: unknown) {
      showError('Error al cargar el evento', 'Error de Carga')
      console.error('Error loading event:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const eventData = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        guests_count: parseInt(formData.guests_count.toString())
      }

      if (isNewEvent) {
        const response = await apiPost<{ event_id: number }>('/events', eventData)
        router.push(`/events/${response.data.event_id}`)
      } else {
        await apiPut(`/events/${eventId}`, eventData)
        await loadEventData()
        success('Evento actualizado correctamente', 'Evento Actualizado')
      }
    } catch (err: unknown) {
      showError('Error al guardar el evento', 'Error al Guardar')
      console.error('Error saving event:', err)
    }
  }

  const openDeleteModal = () => {
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    try {
      await apiDelete(`/events/${eventId}`)
      router.push('/events')
    } catch (err: unknown) {
      showError('Error al eliminar el evento', 'Error al Eliminar')
      console.error('Error deleting event:', err)
      // Keep modal open on error
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    return timeString.slice(0, 5)
  }

  // Función para calcular el costo de una receta individual
  const calculateRecipeCost = (recipe: EventRecipe) => {
    // Si tenemos ingredientes, calcular basándose en ingredientes
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      const eventPortions = recipe.portions
      
      const recipeCost = recipe.ingredients.reduce((ingredientTotal, ingredient) => {
        const quantity = parseFloat(ingredient.quantity_per_serving?.toString()) || 0
        const price = parseFloat(ingredient.base_price?.toString()) || 0
        const wastePercent = parseFloat(ingredient.waste_percent?.toString()) || 0
        const wasteMultiplier = 1 + wastePercent
        
        // Cantidad total necesaria para las porciones del evento
        const totalQuantity = quantity * eventPortions
        // Costo total de este ingrediente (con desperdicio aplicado correctamente)
        const ingredientCost = totalQuantity * price * wasteMultiplier
        
        return ingredientTotal + ingredientCost
      }, 0)
      
      return recipeCost
    } else {
      // Fallback: usar cost_per_serving si no hay ingredientes
      return (Number(recipe.cost_per_serving) || 0) * recipe.portions
    }
  }

  const calculateTotalCost = () => {
    return eventRecipes.reduce((total, recipe) => {
      return total + calculateRecipeCost(recipe)
    }, 0)
  }

  const calculateCostMetrics = () => {
    const totalCost = calculateTotalCost()
    const budget = event?.budget || 0
    const costPerGuest = event?.guests_count ? totalCost / event.guests_count : 0
    const remainingBudget = budget - totalCost
    const budgetUsagePercent = budget > 0 ? (totalCost / budget) * 100 : 0
    const suggestedBudget = totalCost * 1.4 // 40% margin
    
    return {
      totalCost,
      budget,
      costPerGuest,
      remainingBudget,
      budgetUsagePercent,
      suggestedBudget
    }
  }

  // Recipe modal functions
  const openAddRecipeModal = async () => {
    setLoadingRecipes(true)
    setIsAddRecipeOpen(true)
    try {
      const response = await apiGet<Recipe[]>('/recipes')
      setAvailableRecipes(response.data)
    } catch (error) {
      console.error('Error loading recipes:', error)
      showError('Error al cargar las recetas disponibles', 'Error de Carga')
    } finally {
      setLoadingRecipes(false)
    }
  }

  const handleRecipeSelection = (recipeId: number) => {
    setSelectedRecipeIds(prev => {
      if (prev.includes(recipeId)) {
        // Remove from selection
        const newPortions = { ...recipePortions }
        const newCourseTypes = { ...recipeCourseTypes }
        const newNotes = { ...recipeNotes }
        delete newPortions[recipeId]
        delete newCourseTypes[recipeId]
        delete newNotes[recipeId]
        setRecipePortions(newPortions)
        setRecipeCourseTypes(newCourseTypes)
        setRecipeNotes(newNotes)
        return prev.filter(id => id !== recipeId)
      } else {
        // Add to selection with defaults
        setRecipePortions(prev => ({ ...prev, [recipeId]: event?.guests_count || 1 }))
        setRecipeCourseTypes(prev => ({ ...prev, [recipeId]: 'main' }))
        return [...prev, recipeId]
      }
    })
  }

  const handleAddRecipesToEvent = async () => {
    if (selectedRecipeIds.length === 0) return
    
    try {
      // Add recipes to event menu one by one (following original implementation)
      for (const recipeId of selectedRecipeIds) {
        const recipeData = {
          recipe_id: recipeId,
          portions: recipePortions[recipeId] || event?.guests_count || 1,
          course_type: recipeCourseTypes[recipeId] || 'main',
          notes: recipeNotes[recipeId] || ''
        }
        
        console.log('Sending individual recipe data:', recipeData)
        await apiPost(`/events/${eventId}/recipes`, recipeData)
      }
      
      // Reload event data to get updated menu
      await loadEventData()
      
      // Reset modal state
      setIsAddRecipeOpen(false)
      setSelectedRecipeIds([])
      setRecipePortions({})
      setRecipeCourseTypes({})
      setRecipeNotes({})
      setRecipeSearchText('')
      
      const count = selectedRecipeIds.length
      success(
        `${count} receta${count !== 1 ? 's' : ''} añadida${count !== 1 ? 's' : ''} al evento correctamente`,
        'Recetas Añadidas'
      )
    } catch (error: unknown) {
      console.error('Error adding recipes to event:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        console.error('Response data:', axiosError.response?.data)
        console.error('Response status:', axiosError.response?.status)
        console.error('Response headers:', axiosError.response?.headers)
      }
      showError('Error al añadir recetas al evento', 'Error al Añadir')
    }
  }

  // Filter available recipes based on search and exclude recipes already in the event menu
  const filteredAvailableRecipes = availableRecipes.filter(recipe => {
    // Exclude recipes that are already in the event menu
    const isAlreadyInMenu = eventRecipes.some(eventRecipe => eventRecipe.recipe_id === recipe.recipe_id)
    if (isAlreadyInMenu) return false
    
    // Filter by search text
    const matchesSearch = recipe.name.toLowerCase().includes(recipeSearchText.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(recipeSearchText.toLowerCase())
    
    return matchesSearch
  })

  // Edit recipe functions
  const openEditRecipeModal = (recipe: EventRecipe) => {
    setEditingRecipe(recipe)
    setEditFormData({
      portions: recipe.portions,
      course_type: recipe.course_type,
      notes: recipe.notes || ''
    })
    setIsEditRecipeOpen(true)
  }

  const handleUpdateRecipe = async () => {
    if (!editingRecipe) return
    
    try {
      await apiPut(`/events/${eventId}/recipes/${editingRecipe.recipe_id}`, editFormData)
      
      // Reload event data to get updated menu
      await loadEventData()
      
      // Reset modal state
      setIsEditRecipeOpen(false)
      setEditingRecipe(null)
      
      success('Receta actualizada correctamente', 'Receta Actualizada')
    } catch (error) {
      console.error('Error updating recipe:', error)
      showError('Error al actualizar la receta', 'Error al Actualizar')
    }
  }

  // Delete recipe functions
  const openDeleteRecipeModal = (recipe: EventRecipe) => {
    setRecipeToDelete(recipe)
    setIsDeleteRecipeOpen(true)
  }

  const handleDeleteRecipe = async () => {
    if (!recipeToDelete) return
    
    try {
      await apiDelete(`/events/${eventId}/recipes/${recipeToDelete.recipe_id}`)
      
      // Reload event data to get updated menu
      await loadEventData()
      
      // Reset modal state
      setIsDeleteRecipeOpen(false)
      setRecipeToDelete(null)
      
      success('Receta eliminada correctamente', 'Receta Eliminada')
    } catch (error) {
      console.error('Error deleting recipe:', error)
      showError('Error al eliminar la receta del evento', 'Error al Eliminar')
    }
  }

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-ES', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
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
              onClick={() => router.push('/events')}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1 pr-2">
              <h1 className="text-lg font-semibold text-gray-900 leading-tight break-words">
                {isNewEvent ? 'Nuevo Evento' : (event?.name || 'Cargando...')}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {!isNewEvent && (
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar evento"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={handleSave}
              className="p-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              title={isNewEvent ? 'Crear evento' : 'Guardar cambios'}
            >
              <Save className="h-4 w-4" />
            </button>
            
            {!isNewEvent && (
              <button
                onClick={() => router.push('/events')}
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
              onClick={() => router.push('/events')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNewEvent ? 'Nuevo Evento' : (event?.name || 'Cargando...')}
              </h1>
              {event && !isEditing && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status]}`}>
                    {statusLabels[event.status]}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(event.event_date)} 
                    {event.event_time && ` • ${formatTime(event.event_time)}`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {!isNewEvent && (
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
              {isNewEvent ? 'Crear' : 'Guardar'}
            </button>
            
            {!isNewEvent && (
              <button
                onClick={() => router.push('/events')}
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

      {/* Stats Cards siguiendo patrón de Recipes */}
      {event && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Comensales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{event.guests_count}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Estado</p>
                <p className={`text-2xl font-bold mt-1 ${(() => {
                  switch(event.status) {
                    case 'planned': return 'text-blue-600'
                    case 'confirmed': return 'text-green-600'
                    case 'in_progress': return 'text-yellow-600'
                    case 'completed': return 'text-gray-600'
                    case 'cancelled': return 'text-red-600'
                    default: return 'text-gray-900'
                  }
                })()}`}>
                  {statusLabels[event.status]}
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Presupuesto</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {event.budget ? `€${event.budget.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
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
                <p className="text-sm font-medium text-gray-600">Platos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {eventRecipes.length}
                </p>
                {(() => {
                  const counts = eventRecipes.reduce((acc, recipe) => {
                    acc[recipe.course_type] = (acc[recipe.course_type] || 0) + 1
                    return acc
                  }, {} as Record<string, number>)
                  
                  const getCourseIcon = (type: string) => {
                    switch(type) {
                      case 'starter': return 'E'
                      case 'main': return 'P'
                      case 'side': return 'A'
                      case 'dessert': return 'D'
                      case 'beverage': return 'B'
                      default: return '?'
                    }
                  }
                  
                  return (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(counts).map(([type, count]) => (
                        <span 
                          key={type} 
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                          title={courseTypeLabels[type as keyof typeof courseTypeLabels]}
                        >
                          {getCourseIcon(type)}{count}
                        </span>
                      ))}
                    </div>
                  )
                })()}
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <ChefHat className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Info className="h-5 w-5 text-orange-600" />
              </div>
              Detalles del Evento
            </h3>
            
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Evento <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nombre del evento"
                    required
                  />
                ) : (
                  <p className="text-gray-900">{event?.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Descripción del evento"
                  />
                ) : (
                  <p className="text-gray-900">{event?.description || 'Sin descripción'}</p>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{event && formatDate(event.event_date)}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora
                  </label>
                  {isEditing ? (
                    <input
                      type="time"
                      value={formData.event_time}
                      onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{event?.event_time ? formatTime(event.event_time) : 'Sin hora especificada'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Guests and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Comensales <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="1"
                      value={formData.guests_count}
                      onChange={(e) => setFormData({ ...formData, guests_count: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{event?.guests_count}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Ubicación del evento"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{event?.location || 'Sin ubicación especificada'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status and Budget */}
              {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="planned">Planificado</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="in_progress">En Progreso</option>
                      <option value="completed">Completado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Presupuesto (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Notas adicionales"
                  />
                ) : (
                  <p className="text-gray-900">{event?.notes || 'Sin notas'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Cost Analysis */}
          {event && (() => {
            const metrics = calculateCostMetrics()
            return (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Euro className="h-5 w-5 text-orange-600" />
                  </div>
                  Análisis de Costos
                </h3>
                
                <div className="space-y-4">
                  {/* Costo Total */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Coste Total Menú</p>
                        <p className="text-2xl font-bold text-gray-900">€{formatCurrency(metrics.totalCost)}</p>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-lg">
                        <Utensils className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Costo por Invitado */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Coste por Comensal</p>
                        <p className="text-2xl font-bold text-gray-900">€{formatCurrency(metrics.costPerGuest)}</p>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-lg">
                        <Users className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Presupuesto vs Costo */}
                  {event.budget && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-700">Presupuesto Restante</p>
                          <div className="flex items-baseline space-x-2">
                            <p className="text-2xl font-bold text-orange-800">
                              €{formatCurrency(metrics.remainingBudget)}
                            </p>
                            <span className="text-sm font-medium text-orange-600">
                              ({metrics.budgetUsagePercent.toFixed(1)}% usado)
                            </span>
                          </div>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-lg">
                          <Heart className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Presupuesto Sugerido */}
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700">Presupuesto Sugerido</p>
                        <p className="text-sm text-orange-600 mb-1">Margen 40%</p>
                        <p className="text-xl font-bold text-orange-800">€{formatCurrency(metrics.suggestedBudget)}</p>
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

          {/* Menu */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Utensils className="h-5 w-5 text-orange-600" />
                  </div>
                  Menú del Evento
                </h3>
                <button 
                  onClick={openAddRecipeModal}
                  className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Añadir
                </button>
              </div>
              
              <div>
                {eventRecipes.length > 0 ? (
                  <div className="space-y-4">
                    {eventRecipes.map((recipe) => (
                      <div key={recipe.recipe_id} className="group relative flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors overflow-hidden">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-100 p-2 rounded-full">
                            <ChefHat className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{recipe.recipe_name}</p>
                            <p className="text-sm text-gray-500">
                              {courseTypeLabels[recipe.course_type]} • {recipe.portions} raciones
                            </p>
                            {recipe.notes && (
                              <p className="text-xs text-gray-400 mt-1 italic">{recipe.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 flex-shrink-0 min-w-0">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              €{calculateRecipeCost(recipe).toLocaleString('es-ES', { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2 
                              })}
                            </p>
                          </div>
                          {/* Actions buttons - always visible on mobile, hover on desktop */}
                          <div className="flex items-center space-x-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={() => openEditRecipeModal(recipe)}
                              className="p-1.5 md:p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                              title="Editar receta"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteRecipeModal(recipe)}
                              className="p-1.5 md:p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                              title="Eliminar receta"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Utensils className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No hay recetas en el menú</p>
                    <button 
                      onClick={openAddRecipeModal}
                      className="mt-2 text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      Añadir primera receta
                    </button>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar el evento "${event?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Add Recipe Modal */}
      <Modal
        isOpen={isAddRecipeOpen}
        onClose={() => {
          setIsAddRecipeOpen(false)
          setSelectedRecipeIds([])
          setRecipePortions({})
          setRecipeCourseTypes({})
          setRecipeNotes({})
          setRecipeSearchText('')
        }}
        title="Añadir Recetas al Evento"
        size="xl"
      >
        <div className="p-6">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar recetas..."
                value={recipeSearchText}
                onChange={(e) => setRecipeSearchText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Loading State */}
          {loadingRecipes ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse space-y-4 w-full">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Recipe List */}
              <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
                {filteredAvailableRecipes.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <ChefHat className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {availableRecipes.length === 0 
                        ? 'No hay recetas disponibles'
                        : eventRecipes.length > 0 && recipeSearchText === ''
                          ? 'Todas las recetas ya están en el menú'
                          : 'No se encontraron recetas'
                      }
                    </h4>
                    <p className="text-gray-500 text-sm">
                      {availableRecipes.length === 0 
                        ? 'Primero necesitas crear algunas recetas.'
                        : eventRecipes.length > 0 && recipeSearchText === ''
                          ? 'Las recetas del menú actual no se muestran aquí.'
                          : 'Intenta con una búsqueda diferente.'
                      }
                    </p>
                  </div>
                ) : (
                  filteredAvailableRecipes.map((recipe) => {
                  const isSelected = selectedRecipeIds.includes(recipe.recipe_id)
                  return (
                    <div key={recipe.recipe_id} className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      isSelected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleRecipeSelection(recipe.recipe_id)}
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">{recipe.name}</h4>
                              {recipe.description && (
                                <p className="text-sm text-gray-500 mt-1">{recipe.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {recipe.prep_time ? `${recipe.prep_time} min` : 'N/A'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Utensils className="h-3 w-3" />
                                  {recipe.servings} porciones
                                </span>
                                <span className="flex items-center gap-1">
                                  <Euro className="h-3 w-3" />
                                  {(Number(recipe.cost_per_serving) || 0).toFixed(2)}€/porción
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Recipe Configuration */}
                          {isSelected && (
                            <div className="mt-4 pl-7 space-y-4 border-l-2 border-orange-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Porciones
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={recipePortions[recipe.recipe_id] || event?.guests_count || 1}
                                    onChange={(e) => setRecipePortions(prev => ({
                                      ...prev,
                                      [recipe.recipe_id]: parseInt(e.target.value) || 1
                                    }))}
                                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Plato
                                  </label>
                                  <select
                                    value={recipeCourseTypes[recipe.recipe_id] || 'main'}
                                    onChange={(e) => setRecipeCourseTypes(prev => ({
                                      ...prev,
                                      [recipe.recipe_id]: e.target.value
                                    }))}
                                    className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                  >
                                    <option value="starter">Entrante</option>
                                    <option value="main">Principal</option>
                                    <option value="side">Acompañamiento</option>
                                    <option value="dessert">Postre</option>
                                    <option value="beverage">Bebida</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Costo Total
                                  </label>
                                  <div className="px-3 py-1 text-sm bg-gray-50 border border-gray-200 rounded">
                                    €{((recipePortions[recipe.recipe_id] || event?.guests_count || 1) * (Number(recipe.cost_per_serving) || 0)).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Notas (opcional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="Notas especiales para esta receta..."
                                  value={recipeNotes[recipe.recipe_id] || ''}
                                  onChange={(e) => setRecipeNotes(prev => ({
                                    ...prev,
                                    [recipe.recipe_id]: e.target.value
                                  }))}
                                  className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                  })
                )}
              </div>

              {/* Summary */}
              {selectedRecipeIds.length > 0 && (
                <div className="border-t pt-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 mb-2">
                      Resumen: {selectedRecipeIds.length} receta{selectedRecipeIds.length !== 1 ? 's' : ''} seleccionada{selectedRecipeIds.length !== 1 ? 's' : ''}
                    </h4>
                    <div className="text-sm text-orange-700">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">Costo total estimado:</span> €
                          {selectedRecipeIds.reduce((total, recipeId) => {
                            const recipe = availableRecipes.find(r => r.recipe_id === recipeId)
                            const portions = recipePortions[recipeId] || event?.guests_count || 1
                            return total + (recipe ? (Number(recipe.cost_per_serving) || 0) * portions : 0)
                          }, 0).toFixed(2)}
                        </div>
                        <div>
                          <span className="font-medium">Porciones totales:</span> {selectedRecipeIds.reduce((total, recipeId) => 
                            total + (recipePortions[recipeId] || event?.guests_count || 1), 0
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={() => {
                setIsAddRecipeOpen(false)
                setSelectedRecipeIds([])
                setRecipePortions({})
                setRecipeCourseTypes({})
                setRecipeNotes({})
                setRecipeSearchText('')
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddRecipesToEvent}
              disabled={selectedRecipeIds.length === 0}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Añadir {selectedRecipeIds.length} Receta{selectedRecipeIds.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Recipe Modal */}
      <Modal
        isOpen={isEditRecipeOpen}
        onClose={() => {
          setIsEditRecipeOpen(false)
          setEditingRecipe(null)
        }}
        title={`Editar: ${editingRecipe?.recipe_name}`}
        size="md"
      >
        <div className="p-6">
          <div className="space-y-4">
            {/* Porciones */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Porciones
              </label>
              <input
                type="number"
                min="1"
                value={editFormData.portions}
                onChange={(e) => setEditFormData(prev => ({
                  ...prev,
                  portions: parseInt(e.target.value) || 1
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Tipo de Plato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Plato
              </label>
              <select
                value={editFormData.course_type}
                onChange={(e) => setEditFormData(prev => ({
                  ...prev,
                  course_type: e.target.value as 'starter' | 'main' | 'side' | 'dessert' | 'beverage'
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="starter">Entrante</option>
                <option value="main">Principal</option>
                <option value="side">Acompañamiento</option>
                <option value="dessert">Postre</option>
                <option value="beverage">Bebida</option>
              </select>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                rows={3}
                value={editFormData.notes}
                onChange={(e) => setEditFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Notas especiales para esta receta..."
              />
            </div>

            {/* Información de costo */}
            {editingRecipe && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-700">
                  <span className="font-medium">Costo total:</span> €{(() => {
                    // Usar el mismo cálculo que calculateRecipeCost pero con las porciones del formulario
                    if (editingRecipe.ingredients && editingRecipe.ingredients.length > 0) {
                      const recipeCost = editingRecipe.ingredients.reduce((ingredientTotal, ingredient) => {
                        const quantity = parseFloat(ingredient.quantity_per_serving?.toString()) || 0
                        const price = parseFloat(ingredient.base_price?.toString()) || 0
                        const wastePercent = parseFloat(ingredient.waste_percent?.toString()) || 0
                        const wasteMultiplier = 1 + wastePercent
                        
                        // Cantidad total necesaria para las porciones del formulario
                        const totalQuantity = quantity * editFormData.portions
                        // Costo total de este ingrediente
                        const ingredientCost = totalQuantity * price * wasteMultiplier
                        
                        return ingredientTotal + ingredientCost
                      }, 0)
                      return recipeCost.toFixed(2)
                    } else {
                      // Fallback: usar cost_per_serving
                      return ((Number(editingRecipe.cost_per_serving) || 0) * editFormData.portions).toFixed(2)
                    }
                  })()}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              onClick={() => {
                setIsEditRecipeOpen(false)
                setEditingRecipe(null)
              }}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdateRecipe}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Actualizar Receta
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Recipe Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteRecipeOpen}
        onClose={() => {
          setIsDeleteRecipeOpen(false)
          setRecipeToDelete(null)
        }}
        onConfirm={handleDeleteRecipe}
        title="Eliminar Receta del Evento"
        message={`¿Seguro que deseas eliminar "${recipeToDelete?.recipe_name}" del menú de este evento?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
      </div>
    </>
  )
}