'use client'

import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import { apiPut } from '@/lib/api'

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

interface EditSubrecipeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  subrecipe: SubRecipe | null
  recipeId: string
}

export default function EditSubrecipeModal({
  isOpen,
  onClose,
  onSuccess,
  subrecipe,
  recipeId
}: EditSubrecipeModalProps) {
  const [quantityPerServing, setQuantityPerServing] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with subrecipe data
  useEffect(() => {
    if (subrecipe && isOpen) {
      setQuantityPerServing(subrecipe.quantity_per_serving.toString())
      setNotes(subrecipe.notes || '')
    }
  }, [subrecipe, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subrecipe || !quantityPerServing) {
      return
    }

    const quantity = parseFloat(quantityPerServing)
    if (isNaN(quantity) || quantity <= 0) {
      return
    }

    try {
      setIsSubmitting(true)
      
      await apiPut(`/recipes/${recipeId}/subrecipes/${subrecipe.subrecipe_id}`, {
        quantity_per_serving: quantity,
        notes: notes.trim() || undefined
      })

      onSuccess()
      handleClose()
    } catch (error) {
      console.error('Error updating subrecipe:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setQuantityPerServing('')
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

  if (!isOpen || !subrecipe) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Editar Sub-receta</h2>
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
            
            {/* Selected Recipe Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">{subrecipe.subrecipe_name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {subrecipe.subrecipe_difficulty && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[subrecipe.subrecipe_difficulty]}`}>
                    {difficultyTranslations[subrecipe.subrecipe_difficulty]}
                  </span>
                )}
                {subrecipe.subrecipe_prep_time && (
                  <span>{subrecipe.subrecipe_prep_time}m</span>
                )}
                <span>{subrecipe.subrecipe_servings} raciones</span>
                <span>€{parseFloat(subrecipe.subrecipe_cost?.toString() || '0').toFixed(2)}/ración</span>
              </div>
            </div>

            {/* Quantity */}
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
                ¿Cuántas raciones de "{subrecipe.subrecipe_name}" necesitas por porción de esta receta?
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

            {/* Cost Preview */}
            {quantityPerServing && !isNaN(parseFloat(quantityPerServing)) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Vista previa del costo</h4>
                <div className="text-sm text-blue-800">
                  <p>Cantidad: {quantityPerServing} raciones</p>
                  <p>Costo por ración: €{parseFloat(subrecipe.subrecipe_cost?.toString() || '0').toFixed(2)}</p>
                  <p className="font-medium">
                    Costo total: €{(parseFloat(quantityPerServing) * parseFloat(subrecipe.subrecipe_cost?.toString() || '0')).toFixed(2)}
                  </p>
                </div>
              </div>
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
              disabled={!quantityPerServing || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                'Guardando...'
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}