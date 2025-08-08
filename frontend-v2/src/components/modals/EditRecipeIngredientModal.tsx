'use client'

import { useState, useEffect } from 'react'
import FormModal from '@/components/ui/FormModal'
import { Plus, X } from 'lucide-react'

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

interface EditRecipeIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (ingredientData: RecipeIngredient) => void
  ingredient: RecipeIngredient | null
  sections: Section[]
  onCreateSection?: (sectionName: string) => Promise<Section>
}

export default function EditRecipeIngredientModal({ 
  isOpen, 
  onClose, 
  onUpdate, 
  ingredient,
  sections,
  onCreateSection
}: EditRecipeIngredientModalProps) {
  const [formData, setFormData] = useState({
    quantity_per_serving: '',
    section_id: undefined as number | undefined
  })
  
  const [isCreatingSection, setIsCreatingSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [creatingSection, setCreatingSection] = useState(false)

  // Cargar datos del ingrediente cuando se abre el modal
  useEffect(() => {
    if (isOpen && ingredient) {
      setFormData({
        quantity_per_serving: ingredient.quantity_per_serving.toString(),
        section_id: ingredient.section_id
      })
    }
  }, [isOpen, ingredient])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!ingredient) return

    if (!formData.quantity_per_serving || parseFloat(formData.quantity_per_serving) <= 0) {
      alert('La cantidad por porción debe ser mayor a 0')
      return
    }

    // Crear objeto con datos actualizados (mantener valores existentes para campos eliminados)
    const updatedIngredient: RecipeIngredient = {
      ...ingredient,
      quantity_per_serving: parseFloat(formData.quantity_per_serving),
      section_id: formData.section_id
    }

    onUpdate(updatedIngredient)
    onClose()
  }

  if (!ingredient) return null

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Editar ingrediente en receta"
      size="md"
      submitText="Actualizar"
    >
      <div className="space-y-6">
        {/* Información del ingrediente */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Ingrediente</h4>
          <p className="text-gray-700">{ingredient.name}</p>
        </div>

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

        {/* Datos editables */}
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