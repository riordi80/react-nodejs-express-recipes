'use client'

import { Plus } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import SupplierManager from '@/components/ui/SupplierManager'

interface Ingredient {
  ingredient_id: number
  name: string
  unit: string
  base_price: number
  waste_percent: number
  net_price: number
  stock: number
  stock_minimum: number
  is_available: boolean
  comment?: string
}

interface EditIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  ingredient: Ingredient | null
  onSave?: (updatedIngredient: Ingredient) => Promise<boolean> // Opcional ya que no editamos ingrediente
  onDataChanged?: () => void // Callback para notificar cambios
}

export default function EditIngredientModal({ 
  isOpen, 
  onClose, 
  ingredient,
  onDataChanged
}: EditIngredientModalProps) {

  if (!isOpen || !ingredient) return null

  const handleClose = () => {
    // Notificar cambios antes de cerrar
    if (onDataChanged) {
      onDataChanged()
    }
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Gestión de Proveedores"
      size="xl"
    >
      <div className="p-6">
        {/* Nombre del ingrediente */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            {ingredient.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Configura los proveedores para este ingrediente
            </p>
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
          </div>
        </div>

        {/* Supplier Manager Content */}
        <SupplierManager
          entityId={ingredient.ingredient_id}
          entityType="ingredient"
          disabled={false}
          title=""
          className="bg-transparent border-0 shadow-none p-0"
        />
      </div>
    </Modal>
  )
}