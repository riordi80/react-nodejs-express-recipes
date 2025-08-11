'use client'

import { Building, X } from 'lucide-react'
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
}

export default function EditIngredientModal({ 
  isOpen, 
  onClose, 
  ingredient
}: EditIngredientModalProps) {

  if (!isOpen || !ingredient) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Building className="h-6 w-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Gestión de Proveedores
              </h2>
              <p className="text-sm text-gray-500">
                {ingredient.name} ({ingredient.unit})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Supplier Manager Content */}
        <div className="p-6">
          <SupplierManager
            entityId={ingredient.ingredient_id}
            entityType="ingredient"
            disabled={false}
            title=""
            className="bg-transparent border-0 shadow-none p-0"
          />
        </div>
      </div>
    </div>
  )
}