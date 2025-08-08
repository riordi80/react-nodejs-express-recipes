'use client'

import { useState, useEffect } from 'react'
import { X, Search, Plus } from 'lucide-react'
import { apiGet, apiPost } from '@/lib/api'

interface Ingredient {
  ingredient_id: number
  name: string
  unit: string
}

interface IngredientDetail {
  price: string
  delivery_time: string
  package_size: string
  package_unit: string
  minimum_order_quantity: string
  is_preferred_supplier: boolean
}

interface AddSupplierIngredientModalProps {
  isOpen: boolean
  onClose: () => void
  supplierId: string
  supplierName: string
  onSave: () => void
}

export default function AddSupplierIngredientModal({
  isOpen,
  onClose,
  supplierId,
  supplierName,
  onSave
}: AddSupplierIngredientModalProps) {
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([])
  const [searchText, setSearchText] = useState('')
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([])
  const [ingredientDetails, setIngredientDetails] = useState<Record<number, IngredientDetail>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Package unit options
  const packageUnits = [
    'unidad', 'kg', 'gr', 'l', 'ml', 'caja', 'bolsa', 'paquete', 'docena'
  ]

  // Load available ingredients
  useEffect(() => {
    if (isOpen) {
      loadAvailableIngredients()
    }
  }, [isOpen, supplierId])

  const loadAvailableIngredients = async () => {
    try {
      setLoading(true)
      // Get all ingredients and supplier ingredients to filter out assigned ones
      const [allIngredientsRes, supplierIngredientsRes] = await Promise.all([
        apiGet<Ingredient[]>('/ingredients'),
        apiGet(`/suppliers/${supplierId}/ingredients`)
      ])
      
      const assignedIds = supplierIngredientsRes.data.map((si: any) => si.ingredient_id)
      const available = allIngredientsRes.data.filter(ing => !assignedIds.includes(ing.ingredient_id))
      setAvailableIngredients(available)
    } catch (err) {
      console.error('Error loading ingredients:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredIngredients = availableIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchText.toLowerCase())
  )

  const handleIngredientToggle = (ingredientId: number) => {
    if (selectedIngredients.includes(ingredientId)) {
      setSelectedIngredients(selectedIngredients.filter(id => id !== ingredientId))
      const newDetails = { ...ingredientDetails }
      delete newDetails[ingredientId]
      setIngredientDetails(newDetails)
    } else {
      setSelectedIngredients([...selectedIngredients, ingredientId])
      setIngredientDetails({
        ...ingredientDetails,
        [ingredientId]: {
          price: '',
          delivery_time: '',
          package_size: '1',
          package_unit: 'unidad',
          minimum_order_quantity: '1',
          is_preferred_supplier: false
        }
      })
    }
  }

  const updateIngredientDetail = (ingredientId: number, field: keyof IngredientDetail, value: string | boolean) => {
    setIngredientDetails({
      ...ingredientDetails,
      [ingredientId]: {
        ...ingredientDetails[ingredientId],
        [field]: value
      }
    })
  }

  const parseNumber = (str: string): number => {
    if (!str || str.trim() === '') return 0
    const cleaned = str.replace(',', '.')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const ingredients = selectedIngredients.map(ingredientId => ({
        ingredient_id: ingredientId,
        price: parseNumber(ingredientDetails[ingredientId].price),
        delivery_time: ingredientDetails[ingredientId].delivery_time ? parseInt(ingredientDetails[ingredientId].delivery_time) : null,
        package_size: parseNumber(ingredientDetails[ingredientId].package_size),
        package_unit: ingredientDetails[ingredientId].package_unit,
        minimum_order_quantity: parseNumber(ingredientDetails[ingredientId].minimum_order_quantity),
        is_preferred_supplier: ingredientDetails[ingredientId].is_preferred_supplier
      }))

      await apiPost(`/suppliers/${supplierId}/ingredients`, { ingredients })
      
      // Reset form
      setSelectedIngredients([])
      setIngredientDetails({})
      setSearchText('')
      
      onSave()
      onClose()
    } catch (err) {
      console.error('Error saving ingredients:', err)
    } finally {
      setSaving(false)
    }
  }

  const canSave = selectedIngredients.length > 0 && 
    selectedIngredients.every(id => 
      ingredientDetails[id]?.price && 
      ingredientDetails[id]?.package_size && 
      ingredientDetails[id]?.minimum_order_quantity
    )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Añadir ingredientes a {supplierName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ingredientes..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Cargando ingredientes...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIngredients.map(ingredient => {
                const isSelected = selectedIngredients.includes(ingredient.ingredient_id)
                const details = ingredientDetails[ingredient.ingredient_id]

                return (
                  <div key={ingredient.ingredient_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleIngredientToggle(ingredient.ingredient_id)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="font-medium text-gray-900">{ingredient.name}</span>
                      <span className="text-sm text-gray-500">({ingredient.unit})</span>
                    </div>

                    {isSelected && details && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Precio (€) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={details.price}
                            onChange={(e) => updateIngredientDetail(ingredient.ingredient_id, 'price', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="0,00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tiempo entrega (días)
                          </label>
                          <input
                            type="number"
                            value={details.delivery_time}
                            onChange={(e) => updateIngredientDetail(ingredient.ingredient_id, 'delivery_time', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="7"
                            min="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tamaño paquete <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={details.package_size}
                            onChange={(e) => updateIngredientDetail(ingredient.ingredient_id, 'package_size', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="1,0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Unidad paquete
                          </label>
                          <select
                            value={details.package_unit}
                            onChange={(e) => updateIngredientDetail(ingredient.ingredient_id, 'package_unit', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            {packageUnits.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cantidad mínima <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={details.minimum_order_quantity}
                            onChange={(e) => updateIngredientDetail(ingredient.ingredient_id, 'minimum_order_quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="1,0"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={details.is_preferred_supplier}
                            onChange={(e) => updateIngredientDetail(ingredient.ingredient_id, 'is_preferred_supplier', e.target.checked)}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <label className="ml-2 text-sm text-gray-700">
                            Proveedor preferido
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {filteredIngredients.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay ingredientes disponibles</p>
                </div>
              )}
            </div>
          )}
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
            disabled={!canSave || saving}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Guardando...' : `Añadir ${selectedIngredients.length} ingrediente${selectedIngredients.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  )
}