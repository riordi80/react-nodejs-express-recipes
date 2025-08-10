'use client'

import { AlertTriangle, X, ExternalLink, Settings } from 'lucide-react'

interface IngredientsWithoutProvider {
  ingredientId: number
  name: string
  quantity: number
  unit: string
  basePrice: number
}

interface SupplierWarningModalProps {
  isOpen: boolean
  onClose: () => void
  ingredientsWithoutProvider: IngredientsWithoutProvider[]
  onContinueAnyway?: () => void
  onGoToSuppliers?: () => void
}

// Format currency helper
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount)
}

// Format decimal helper
const formatDecimal = (number: number): string => {
  return new Intl.NumberFormat('es-ES', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 3 
  }).format(number)
}

export default function SupplierWarningModal({ 
  isOpen, 
  onClose, 
  ingredientsWithoutProvider = [],
  onContinueAnyway,
  onGoToSuppliers
}: SupplierWarningModalProps) {
  if (!isOpen) return null

  const totalEstimatedCost = ingredientsWithoutProvider.reduce(
    (total, ingredient) => total + (ingredient.quantity * ingredient.basePrice), 
    0
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Ingredientes sin Proveedor Asignado
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-yellow-800 mb-2">
                  ⚠️ Algunos ingredientes no tienen proveedor asignado
                </h3>
                <p className="text-sm text-yellow-700 mb-2">
                  Los siguientes ingredientes aparecerán como "Sin Proveedor Asignado" en los pedidos generados. 
                  Se usarán precios base para los cálculos, que pueden no ser precisos.
                </p>
                <p className="text-sm text-yellow-700">
                  <strong>Recomendación:</strong> Asigna proveedores antes de generar los pedidos para obtener cálculos exactos.
                </p>
              </div>
            </div>
          </div>

          {/* Ingredients List */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Ingredientes sin proveedor ({ingredientsWithoutProvider.length}):
            </h4>
            <div className="bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Ingrediente
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Cantidad
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Precio Base
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Costo Estimado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {ingredientsWithoutProvider.map(ingredient => (
                    <tr key={ingredient.ingredientId} className="hover:bg-gray-100">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {ingredient.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {formatDecimal(ingredient.quantity)} {ingredient.unit}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600">
                        {formatCurrency(ingredient.basePrice)}/{ingredient.unit}
                      </td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {formatCurrency(ingredient.quantity * ingredient.basePrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Total */}
            <div className="mt-3 p-3 bg-gray-100 rounded-lg flex justify-between items-center">
              <span className="font-medium text-gray-900">Costo Total Estimado:</span>
              <span className="font-bold text-gray-900">{formatCurrency(totalEstimatedCost)}</span>
            </div>
          </div>

          {/* Solutions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">💡 Opciones disponibles:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Configurar proveedores:</strong> Asigna proveedores a estos ingredientes para obtener precios exactos</li>
              <li>• <strong>Continuar de todos modos:</strong> Genera los pedidos usando precios base (menos preciso)</li>
              <li>• <strong>Cancelar:</strong> Vuelve a la lista para revisar los ingredientes</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 p-6 border-t border-gray-200">
          <button 
            type="button" 
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors order-3 sm:order-1" 
            onClick={onClose}
          >
            Cancelar
          </button>
          
          {onGoToSuppliers && (
            <button 
              type="button" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 order-1 sm:order-2"
              onClick={onGoToSuppliers}
            >
              <Settings className="h-4 w-4" />
              <span>Configurar Proveedores</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
          
          {onContinueAnyway && (
            <button 
              type="button" 
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors order-2 sm:order-3"
              onClick={onContinueAnyway}
            >
              Continuar de Todos Modos
            </button>
          )}
        </div>
      </div>
    </div>
  )
}