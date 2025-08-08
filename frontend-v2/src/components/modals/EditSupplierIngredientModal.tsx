'use client'

import { useState, useEffect } from 'react'
import { X, Package } from 'lucide-react'
import { apiPut } from '@/lib/api'

interface SupplierIngredient {
  ingredient_id: number
  ingredient_name: string
  price?: number
  delivery_time?: number
  package_size?: number
  package_unit?: string
  minimum_order_quantity?: number
  is_preferred_supplier: boolean
}

interface EditSupplierIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  supplierId: string
  ingredient: SupplierIngredient | null
  onSave: () => void
}

export default function EditSupplierIngredientModal({
  isOpen,
  onClose,
  supplierId,
  ingredient,
  onSave
}: EditSupplierIngredientModalProps) {
  const [formData, setFormData] = useState({
    price: '',
    delivery_time: '',
    package_size: '',
    package_unit: 'unidad',
    minimum_order_quantity: '',
    is_preferred_supplier: false
  })
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Package unit options
  const packageUnits = [
    'unidad', 'kg', 'gr', 'l', 'ml', 'caja', 'bolsa', 'paquete', 'docena'
  ]

  // Load ingredient data when modal opens
  useEffect(() => {
    if (isOpen && ingredient) {
      setFormData({
        price: ingredient.price?.toString().replace('.', ',') || '',
        delivery_time: ingredient.delivery_time?.toString() || '',
        package_size: ingredient.package_size?.toString().replace('.', ',') || '1',
        package_unit: ingredient.package_unit || 'unidad',
        minimum_order_quantity: ingredient.minimum_order_quantity?.toString().replace('.', ',') || '1',
        is_preferred_supplier: ingredient.is_preferred_supplier || false
      })
      setValidationErrors({})
    }
  }, [isOpen, ingredient])

  const parseNumber = (str: string): number => {
    if (!str || str.trim() === '') return 0
    const cleaned = str.replace(',', '.')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  const handleSave = async () => {
    if (!ingredient) return

    try {
      setSaving(true)
      setValidationErrors({})

      // Validation
      const errors: Record<string, string> = {}
      
      if (!formData.price.trim()) {
        errors.price = 'El precio es obligatorio'
      } else if (parseNumber(formData.price) <= 0) {
        errors.price = 'El precio debe ser mayor a 0'
      }
      
      if (!formData.package_size.trim()) {
        errors.package_size = 'El tamaño del paquete es obligatorio'
      } else if (parseNumber(formData.package_size) <= 0) {
        errors.package_size = 'El tamaño del paquete debe ser mayor a 0'
      }
      
      if (!formData.minimum_order_quantity.trim()) {
        errors.minimum_order_quantity = 'La cantidad mínima es obligatoria'
      } else if (parseNumber(formData.minimum_order_quantity) <= 0) {
        errors.minimum_order_quantity = 'La cantidad mínima debe ser mayor a 0'
      }

      if (formData.delivery_time && parseInt(formData.delivery_time) < 0) {
        errors.delivery_time = 'El tiempo de entrega no puede ser negativo'
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        return
      }

      const payload = {
        price: parseNumber(formData.price),
        delivery_time: formData.delivery_time ? parseInt(formData.delivery_time) : null,
        package_size: parseNumber(formData.package_size),
        package_unit: formData.package_unit,
        minimum_order_quantity: parseNumber(formData.minimum_order_quantity),
        is_preferred_supplier: formData.is_preferred_supplier
      }

      await apiPut(`/suppliers/${supplierId}/ingredients/${ingredient.ingredient_id}`, payload)
      onSave()
      onClose()
    } catch (err) {
      console.error('Error saving ingredient:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !ingredient) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Editar {ingredient.ingredient_name}
              </h3>
              <p className="text-sm text-gray-500">
                Configuración del proveedor para este ingrediente
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio (€) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  validationErrors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0,00"
              />
              {validationErrors.price && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de entrega (días)
              </label>
              <input
                type="number"
                value={formData.delivery_time}
                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  validationErrors.delivery_time ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="7"
                min="0"
              />
              {validationErrors.delivery_time && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.delivery_time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaño del paquete <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.package_size}
                onChange={(e) => setFormData({ ...formData, package_size: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  validationErrors.package_size ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1,0"
              />
              {validationErrors.package_size && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.package_size}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad del paquete
              </label>
              <select
                value={formData.package_unit}
                onChange={(e) => setFormData({ ...formData, package_unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {packageUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad mínima pedido <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.minimum_order_quantity}
                onChange={(e) => setFormData({ ...formData, minimum_order_quantity: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                  validationErrors.minimum_order_quantity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1,0"
              />
              {validationErrors.minimum_order_quantity && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.minimum_order_quantity}</p>
              )}
            </div>

            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                id="is_preferred"
                checked={formData.is_preferred_supplier}
                onChange={(e) => setFormData({ ...formData, is_preferred_supplier: e.target.checked })}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="is_preferred" className="ml-2 text-sm font-medium text-gray-700">
                Proveedor preferido para este ingrediente
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}