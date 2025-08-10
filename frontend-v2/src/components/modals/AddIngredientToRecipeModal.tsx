'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { apiGet } from '@/lib/api'
import FormModal from '@/components/ui/FormModal'
import { defaultIngredientValues } from '@/constants/forms'

interface Ingredient {
  ingredient_id: number
  name: string
  unit: string
  cost_per_unit?: number
}

interface Section {
  section_id: number
  name: string
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

interface AddIngredientToRecipeModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (ingredient: RecipeIngredient) => void
  sections: Section[]
  existingIngredients: RecipeIngredient[]
  onCreateSection?: (sectionName: string) => Promise<Section>
}

export default function AddIngredientToRecipeModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  sections,
  existingIngredients,
  onCreateSection
}: AddIngredientToRecipeModalProps) {
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  
  // Estados para crear secciones
  const [isCreatingSection, setIsCreatingSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [creatingSection, setCreatingSection] = useState(false)
  
  // Form data usando constantes exactas del frontend original
  const [formData, setFormData] = useState({
    ...defaultIngredientValues,
    section_id: sections.length > 0 ? sections[0].section_id : undefined
  })

  useEffect(() => {
    if (isOpen) {
      loadAvailableIngredients()
      resetForm()
    }
  }, [isOpen]) // Dependencies are intentionally limited

  const loadAvailableIngredients = async () => {
    try {
      setLoading(true)
      const response = await apiGet<Ingredient[]>('/ingredients')
      // Filtrar ingredientes que ya están en la receta
      const existingIds = existingIngredients.map(ing => ing.ingredient_id)
      const filtered = response.data?.filter(ing => !existingIds.includes(ing.ingredient_id)) || []
      setAvailableIngredients(filtered)
    } catch (error) {
      console.error('Error loading ingredients:', error)
      setAvailableIngredients([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedIngredient(null)
    setSearchTerm('')
    setIsCreatingSection(false)
    setNewSectionName('')
    setFormData({
      ...defaultIngredientValues,
      section_id: sections.length > 0 ? sections[0].section_id : undefined
    })
  }

  const handleCreateSection = async () => {
    if (!newSectionName.trim() || !onCreateSection) return
    
    try {
      setCreatingSection(true)
      const newSection = await onCreateSection(newSectionName.trim())
      
      // Seleccionar automáticamente la nueva sección
      setFormData({ ...formData, section_id: newSection.section_id })
      
      // Limpiar y cerrar el formulario de nueva sección
      setNewSectionName('')
      setIsCreatingSection(false)
    } catch (error) {
      console.error('Error creating section:', error)
      alert('Error al crear la sección')
    } finally {
      setCreatingSection(false)
    }
  }

  const filteredIngredients = availableIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleIngredientSelect = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedIngredient) {
      alert('Debes seleccionar un ingrediente')
      return
    }

    if (!formData.quantity_per_serving || parseFloat(formData.quantity_per_serving) <= 0) {
      alert('La cantidad por porción debe ser mayor a 0')
      return
    }


    // Formato exacto esperado por el backend usando datos del ingrediente seleccionado
    const ingredientData: RecipeIngredient = {
      ingredient_id: selectedIngredient.ingredient_id,
      name: selectedIngredient.name,
      quantity_per_serving: parseFloat(formData.quantity_per_serving),
      unit: selectedIngredient.unit,
      base_price: selectedIngredient.cost_per_unit || 0,
      waste_percent: 0, // Default waste percent
      section_id: formData.section_id
    }

    onAdd(ingredientData)
    onClose()
    resetForm()
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Añadir ingrediente a la receta"
      size="lg"
      loading={loading}
      submitText="Añadir Ingrediente"
      submitDisabled={!selectedIngredient}
    >
      <div className="space-y-6">
        {/* Búsqueda de ingrediente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar Ingrediente <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Buscar ingrediente..."
            />
          </div>

          {/* Lista de ingredientes disponibles */}
          <div className="mt-2 border border-gray-200 rounded-lg max-h-32 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Cargando ingredientes...</div>
            ) : filteredIngredients.length > 0 ? (
              filteredIngredients.map((ingredient) => (
                <button
                  key={ingredient.ingredient_id}
                  type="button"
                  onClick={() => handleIngredientSelect(ingredient)}
                  className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                    selectedIngredient?.ingredient_id === ingredient.ingredient_id
                      ? 'bg-orange-50 text-orange-700'
                      : 'text-gray-900'
                  }`}
                >
                  <div className="font-medium">{ingredient.name}</div>
                  <div className="text-sm text-gray-500">
                    {ingredient.cost_per_unit ? `${parseFloat(ingredient.cost_per_unit.toString()).toFixed(2).replace('.', ',')}€/${ingredient.unit}` : 'Sin precio'}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No se encontraron ingredientes disponibles' : 'Escribe para buscar ingredientes'}
              </div>
            )}
          </div>
        </div>

        {/* Ingrediente seleccionado */}
        {selectedIngredient && (
          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="font-medium text-orange-900 mb-2">Ingrediente Seleccionado</h4>
            <p className="text-orange-700">{selectedIngredient.name}</p>
          </div>
        )}

        {/* Sección */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Sección (opcional)
            </label>
            {onCreateSection && (
              <button
                type="button"
                onClick={() => setIsCreatingSection(true)}
                className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nueva sección
              </button>
            )}
          </div>
          
          {isCreatingSection ? (
            <div className="space-y-3 p-3 border border-orange-200 rounded-lg bg-orange-50">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Crear nueva sección</h4>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingSection(false)
                    setNewSectionName('')
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="Nombre de la sección"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateSection()
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateSection}
                  disabled={!newSectionName.trim() || creatingSection}
                  className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  {creatingSection ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </div>
          ) : (
            <select
              value={formData.section_id || ''}
              onChange={(e) => setFormData({ ...formData, section_id: e.target.value ? parseInt(e.target.value) : undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Sin sección</option>
              {sections.map((section) => (
                <option key={section.section_id} value={section.section_id}>
                  {section.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Datos del ingrediente en la receta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cantidad por porción <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.quantity_per_serving}
            onChange={(e) => setFormData({ ...formData, quantity_per_serving: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="0.00"
            required
          />
        </div>
      </div>
    </FormModal>
  )
}