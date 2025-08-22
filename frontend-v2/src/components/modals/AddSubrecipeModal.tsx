'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Search } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'

interface Recipe {
  recipe_id: number
  name: string
  cost_per_serving?: number
  servings: number
  difficulty?: 'easy' | 'medium' | 'hard'
  prep_time?: number
}

interface AddSubrecipeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  recipeId: string
  currentSubrecipeIds: number[]
}

export default function AddSubrecipeModal({
  isOpen,
  onClose,
  onSuccess,
  recipeId,
  currentSubrecipeIds
}: AddSubrecipeModalProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [quantityPerServing, setQuantityPerServing] = useState<string>('1')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load available recipes
  useEffect(() => {
    const loadRecipes = async () => {
      if (!isOpen) return
      
      try {
        setIsLoading(true)
        // Solicitar muchas recetas para tener todas disponibles
        const response = await apiGet<{data: Recipe[], pagination: any}>('/recipes?limit=1000')
        
        // El endpoint devuelve {data: Recipe[], pagination: ...}
        const recipesData = Array.isArray(response.data?.data) ? response.data.data : []
        
        const availableRecipes = recipesData.filter(recipe => 
          recipe.recipe_id !== parseInt(recipeId) && // No puede usarse a sí misma
          !currentSubrecipeIds.includes(recipe.recipe_id) // No incluir recetas ya añadidas
        )
        setRecipes(availableRecipes)
        setFilteredRecipes(availableRecipes)
      } catch (error) {
        console.error('Error loading recipes:', error)
        setRecipes([])
        setFilteredRecipes([])
      } finally {
        setIsLoading(false)
      }
    }

    loadRecipes()
  }, [isOpen, recipeId, currentSubrecipeIds])

  // Filter recipes based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredRecipes(recipes)
    } else {
      const filtered = recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredRecipes(filtered)
    }
  }, [searchTerm, recipes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRecipe || !quantityPerServing) {
      return
    }

    const quantity = parseFloat(quantityPerServing)
    if (isNaN(quantity) || quantity <= 0) {
      return
    }

    try {
      setIsSubmitting(true)
      
      await apiPost(`/recipes/${recipeId}/subrecipes`, {
        subrecipe_id: selectedRecipe.recipe_id,
        quantity_per_serving: quantity,
        notes: notes.trim() || undefined
      })

      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Error adding subrecipe:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    setSelectedRecipe(null)
    setQuantityPerServing('1')
    setNotes('')
    onClose()
  }

  const difficultyColors = {
    easy: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    hard: 'bg-red-100 text-red-800'
  }

  const difficultyTranslations = {
    easy: 'Fácil',
    medium: 'Medio',
    hard: 'Difícil'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Añadir Sub-receta</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar receta
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Escribe el nombre de la receta..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Recipe List */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar receta ({filteredRecipes.length} disponibles)
              </label>
              
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">Cargando recetas...</div>
              ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  {searchTerm ? 'No se encontraron recetas' : 'No hay recetas disponibles'}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                  {filteredRecipes.map((recipe) => (
                    <div
                      key={recipe.recipe_id}
                      onClick={() => setSelectedRecipe(recipe)}
                      className={`p-3 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
                        selectedRecipe?.recipe_id === recipe.recipe_id
                          ? 'bg-orange-50 border-l-4 border-l-orange-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{recipe.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {recipe.difficulty && (
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${difficultyColors[recipe.difficulty]}`}>
                                {difficultyTranslations[recipe.difficulty]}
                              </span>
                            )}
                            {recipe.prep_time && (
                              <span className="text-xs text-gray-500">{recipe.prep_time}m</span>
                            )}
                            <span className="text-xs text-gray-500">{recipe.servings} raciones</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            €{parseFloat(recipe.cost_per_serving?.toString() || '0').toFixed(2)}/ración
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity */}
            {selectedRecipe && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad por porción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={quantityPerServing}
                    onChange={(e) => setQuantityPerServing(e.target.value)}
                    placeholder="1.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ¿Cuántas raciones de "{selectedRecipe.name}" necesitas por porción de esta receta?
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Añade alguna nota sobre el uso de esta sub-receta..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedRecipe || !quantityPerServing || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Añadiendo...' : 'Añadir Sub-receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}