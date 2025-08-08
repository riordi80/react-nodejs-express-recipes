'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Search, X, Package, Info } from 'lucide-react'
import { ManualOrderItem, AvailableIngredient } from '../hooks/useShoppingList'

interface ManualOrderFormProps {
  manualOrderItems: ManualOrderItem[]
  availableIngredients: AvailableIngredient[]
  ingredientsLoading: boolean
  onAddItem: () => void
  onUpdateItem: (id: number, field: keyof ManualOrderItem, value: string) => void
  onRemoveItem: (id: number) => void
  onGenerateList: () => void
}

// Helper function for accent-insensitive filtering
const normalizeText = (text: string) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

export default function ManualOrderForm({ 
  manualOrderItems,
  availableIngredients,
  ingredientsLoading,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onGenerateList
}: ManualOrderFormProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-ES', { 
      style: 'currency', 
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Crear Pedido Manual</h3>
        <div className="flex items-center space-x-3">
          <button 
            className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
            onClick={onAddItem}
          >
            <Plus className="h-4 w-4" />
            <span>Añadir Ingrediente</span>
          </button>
          <button 
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              manualOrderItems.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
            onClick={onGenerateList}
            disabled={manualOrderItems.length === 0}
          >
            Generar Lista
          </button>
        </div>
      </div>
      
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <strong>Pedidos independientes:</strong> Especifica la cantidad exacta que necesitas de cada ingrediente. 
            Si el ingrediente tiene proveedor asignado, verás información sobre el tamaño de paquete y precios reales.
          </div>
        </div>
      </div>

      {/* Items List */}
      {manualOrderItems.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sin ingredientes</h3>
          <p className="text-gray-500">Añade ingredientes para crear un pedido manual</p>
        </div>
      ) : (
        <div className="space-y-4">
          {manualOrderItems.map(item => (
            <ManualOrderItemComponent
              key={item.id}
              item={item}
              availableIngredients={availableIngredients}
              onUpdateItem={onUpdateItem}
              onRemoveItem={onRemoveItem}
              formatCurrency={formatCurrency}
            />
          ))}
        </div>
      )}

      {ingredientsLoading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">Cargando ingredientes disponibles...</span>
        </div>
      )}
    </div>
  )
}

interface ManualOrderItemComponentProps {
  item: ManualOrderItem
  availableIngredients: AvailableIngredient[]
  onUpdateItem: (id: number, field: keyof ManualOrderItem, value: string) => void
  onRemoveItem: (id: number) => void
  formatCurrency: (value: number) => string
}

function ManualOrderItemComponent({ 
  item, 
  availableIngredients, 
  onUpdateItem, 
  onRemoveItem,
  formatCurrency 
}: ManualOrderItemComponentProps) {
  const [searchText, setSearchText] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get currently selected ingredient
  const selectedIngredient = availableIngredients.find(ing => ing.ingredient_id === parseInt(item.ingredientId))

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
        setSearchText('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filter ingredients based on search
  const filteredIngredients = availableIngredients.filter(ingredient => {
    if (!searchText) return true
    return normalizeText(ingredient.name).includes(normalizeText(searchText))
  })

  const handleIngredientSelect = (ingredientId: number) => {
    onUpdateItem(item.id, 'ingredientId', ingredientId.toString())
    setSearchText('')
    setShowDropdown(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchText(value)
    setShowDropdown(value.length > 0)
  }

  const calculateEstimatedCost = () => {
    if (!selectedIngredient || !item.quantity) return 0
    const quantity = parseFloat(item.quantity.replace(',', '.'))
    if (isNaN(quantity)) return 0
    
    const preferredSupplier = selectedIngredient.preferredSupplier
    if (preferredSupplier && preferredSupplier.package_size > 1) {
      const packagesToBuy = Math.ceil(quantity / preferredSupplier.package_size)
      return packagesToBuy * preferredSupplier.price
    }
    
    return quantity * selectedIngredient.base_price
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Ingredient Selector */}
        <div className="md:col-span-5 relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ingrediente
          </label>
          
          {/* Show selected ingredient or search input */}
          {selectedIngredient && !showDropdown ? (
            <div 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setShowDropdown(true)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{selectedIngredient.name}</span>
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ) : (
            <input
              type="text"
              placeholder="Buscar ingrediente..."
              value={searchText}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          )}
          
          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {filteredIngredients.length === 0 ? (
                <div className="p-3 text-sm text-gray-500 text-center">
                  No se encontraron ingredientes
                </div>
              ) : (
                filteredIngredients.map(ingredient => (
                  <button
                    key={ingredient.ingredient_id}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg"
                    onClick={() => handleIngredientSelect(ingredient.ingredient_id)}
                  >
                    <div className="text-sm">{ingredient.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(ingredient.base_price)}/{ingredient.unit}
                      {ingredient.preferredSupplier && (
                        <span className="ml-2 text-green-600">
                          • {ingredient.preferredSupplier.supplier_name}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quantity Input */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cantidad
          </label>
          <input
            type="text"
            placeholder="0.00"
            value={item.quantity}
            onChange={(e) => onUpdateItem(item.id, 'quantity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {selectedIngredient && (
            <div className="text-xs text-gray-500 mt-1">
              en {selectedIngredient.unit}
            </div>
          )}
        </div>

        {/* Notes Input */}
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notas (opcional)
          </label>
          <input
            type="text"
            placeholder="Notas adicionales..."
            value={item.notes}
            onChange={(e) => onUpdateItem(item.id, 'notes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Cost and Actions */}
        <div className="md:col-span-2 flex flex-col items-end space-y-2">
          {selectedIngredient && item.quantity && (
            <div className="text-sm text-gray-900 font-medium">
              {formatCurrency(calculateEstimatedCost())}
            </div>
          )}
          <button
            onClick={() => onRemoveItem(item.id)}
            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Eliminar ingrediente"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Supplier Info */}
      {selectedIngredient?.preferredSupplier && item.quantity && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-800">
            <div className="font-medium mb-1">
              Proveedor: {selectedIngredient.preferredSupplier.supplier_name}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="font-medium">Paquete:</span> {selectedIngredient.preferredSupplier.package_size} {selectedIngredient.preferredSupplier.package_unit}
              </div>
              <div>
                <span className="font-medium">Precio:</span> {formatCurrency(selectedIngredient.preferredSupplier.price)}
              </div>
              {selectedIngredient.preferredSupplier.delivery_time && (
                <div>
                  <span className="font-medium">Entrega:</span> {selectedIngredient.preferredSupplier.delivery_time} días
                </div>
              )}
              <div>
                <span className="font-medium">Paquetes necesarios:</span> {Math.ceil(parseFloat(item.quantity.replace(',', '.')) / selectedIngredient.preferredSupplier.package_size)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}