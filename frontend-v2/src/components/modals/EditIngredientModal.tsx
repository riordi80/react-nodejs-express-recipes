'use client'

import { useState, useEffect } from 'react'
import { Package, X, Save, AlertCircle } from 'lucide-react'

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
  onSave: (updatedIngredient: Ingredient) => Promise<boolean>
}

// Format currency helper
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount)
}

// Format decimal helper
const formatDecimal = (number: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('es-ES', { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  }).format(number)
}

// Parse European number format (1.234,56 -> 1234.56)
const parseEuropeanNumber = (str: string): number => {
  if (!str || str.trim() === '') return 0
  // Replace dots with empty string, then replace comma with dot
  const cleaned = str.replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export default function EditIngredientModal({ 
  isOpen, 
  onClose, 
  ingredient, 
  onSave 
}: EditIngredientModalProps) {
  const [editedItem, setEditedItem] = useState<Ingredient | null>(null)
  const [wastePercentInput, setWastePercentInput] = useState('')
  const [basePriceInput, setBasePriceInput] = useState('')
  const [stockInput, setStockInput] = useState('')
  const [stockMinimumInput, setStockMinimumInput] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (ingredient && isOpen) {
      setEditedItem({ ...ingredient })
      setWastePercentInput(ingredient.waste_percent ? formatDecimal(ingredient.waste_percent * 100, 2) : '')
      setBasePriceInput(ingredient.base_price ? formatDecimal(ingredient.base_price, 4) : '')
      setStockInput(ingredient.stock ? formatDecimal(ingredient.stock, 2) : '')
      setStockMinimumInput(ingredient.stock_minimum ? formatDecimal(ingredient.stock_minimum, 2) : '')
    }
  }, [ingredient, isOpen])

  const handleSave = async () => {
    if (!editedItem) return

    setIsSaving(true)
    try {
      const processedItem: Ingredient = {
        ...editedItem,
        base_price: parseEuropeanNumber(basePriceInput),
        waste_percent: parseEuropeanNumber(wastePercentInput) / 100,
        stock: parseEuropeanNumber(stockInput),
        stock_minimum: parseEuropeanNumber(stockMinimumInput)
      }

      // Calculate net price
      processedItem.net_price = processedItem.base_price * (1 + processedItem.waste_percent)

      const success = await onSave(processedItem)
      if (success) {
        handleClose()
      }
    } catch (error) {
      console.error('Error saving ingredient:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      setEditedItem(null)
      setWastePercentInput('')
      setBasePriceInput('')
      setStockInput('')
      setStockMinimumInput('')
      onClose()
    }
  }

  if (!isOpen || !editedItem) return null

  // Calculate net price in real time
  const basePrice = parseEuropeanNumber(basePriceInput)
  const wastePercent = parseEuropeanNumber(wastePercentInput) / 100
  const netPrice = basePrice * (1 + wastePercent)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Editar Ingrediente
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Ingredient Name (readonly) */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">{editedItem.name}</h3>
            <p className="text-sm text-gray-500">Unidad: {editedItem.unit}</p>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Base (€/{editedItem.unit}) *
                </label>
                <input
                  type="text"
                  value={basePriceInput}
                  onChange={(e) => {
                    const value = e.target.value
                    if (/^[\d.,]*$/.test(value)) {
                      setBasePriceInput(value)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: 1,2345"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merma (%)
                </label>
                <input
                  type="text"
                  value={wastePercentInput}
                  onChange={(e) => {
                    const value = e.target.value
                    if (/^[\d.,]*$/.test(value)) {
                      setWastePercentInput(value)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: 5,43"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Actual ({editedItem.unit})
                </label>
                <input
                  type="text"
                  value={stockInput}
                  onChange={(e) => {
                    const value = e.target.value
                    if (/^[\d.,]*$/.test(value)) {
                      setStockInput(value)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: 10,5"
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Neto (calculado)
                </label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
                  {netPrice > 0 ? formatCurrency(netPrice) : 'Se calcula automáticamente'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Precio base + merma = precio final por {editedItem.unit}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Mínimo ({editedItem.unit})
                </label>
                <input
                  type="text"
                  value={stockMinimumInput}
                  onChange={(e) => {
                    const value = e.target.value
                    if (/^[\d.,]*$/.test(value)) {
                      setStockMinimumInput(value)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ej: 2,0"
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cantidad mínima para generar alerta
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={editedItem.is_available}
                  onChange={(e) => setEditedItem({ ...editedItem, is_available: e.target.checked })}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  disabled={isSaving}
                />
                <label htmlFor="is_available" className="ml-2 text-sm font-medium text-gray-700">
                  Ingrediente disponible
                </label>
              </div>
            </div>
          </div>

          {/* Warning about stock */}
          {parseEuropeanNumber(stockInput) > 0 && parseEuropeanNumber(stockMinimumInput) > 0 && 
           parseEuropeanNumber(stockInput) <= parseEuropeanNumber(stockMinimumInput) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                El stock actual está por debajo o igual al stock mínimo
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button 
            type="button" 
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50" 
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}