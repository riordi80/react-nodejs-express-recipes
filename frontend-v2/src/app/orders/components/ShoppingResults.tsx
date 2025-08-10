'use client'

import { Plus, XCircle, AlertTriangle, CheckCircle } from 'lucide-react'
import { ShoppingList, ShoppingListIngredient, SupplierGroup } from '../hooks/useShoppingList'

interface ShoppingResultsProps {
  shoppingList: ShoppingList
  isGeneratingOrders: boolean
  onIngredientRowClick: (ingredientId: number) => void
  onGenerateOrders: () => void
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

// Get supplier status indicator
const getSupplierStatusIndicator = (status: 'complete' | 'incomplete' | 'missing') => {
  switch (status) {
    case 'complete':
      return { 
        icon: CheckCircle, 
        className: 'text-green-500', 
        title: 'Proveedor configurado correctamente' 
      }
    case 'incomplete':
      return { 
        icon: AlertTriangle, 
        className: 'text-yellow-500', 
        title: 'Proveedor asignado pero sin precio configurado' 
      }
    case 'missing':
    default:
      return { 
        icon: XCircle, 
        className: 'text-red-500', 
        title: 'Sin proveedor asignado' 
      }
  }
}

export default function ShoppingResults({ 
  shoppingList, 
  isGeneratingOrders, 
  onIngredientRowClick, 
  onGenerateOrders 
}: ShoppingResultsProps) {
  if (!shoppingList) {
    return null
  }

  // Calculate supplier stats
  const supplierStats = shoppingList.ingredientsBySupplier.reduce((stats, supplier) => {
    supplier.ingredients.forEach(ingredient => {
      if (ingredient.supplierStatus === 'missing') stats.missing++
      else if (ingredient.supplierStatus === 'incomplete') stats.incomplete++
    })
    return stats
  }, { missing: 0, incomplete: 0 })

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="space-y-4">
          {/* Stats Row */}
          <div className="flex flex-wrap justify-center md:justify-evenly items-center gap-6 md:gap-8">
            {!shoppingList.filters?.manual && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{shoppingList.totalEvents}</div>
                <div className="text-sm text-gray-500">Eventos</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {shoppingList.filters?.manual 
                  ? shoppingList.ingredientsBySupplier.reduce((total, supplier) => total + supplier.ingredients.length, 0)
                  : formatCurrency(shoppingList.totalCost)
                }
              </div>
              <div className="text-sm text-gray-500">
                {shoppingList.filters?.manual ? 'Items' : 'Costo Total'}
              </div>
            </div>
            {shoppingList.filters?.manual && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(shoppingList.totalCost)}</div>
                <div className="text-sm text-gray-500">Costo Total</div>
              </div>
            )}
            {!shoppingList.filters?.manual && (
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{shoppingList.ingredientsBySupplier.length}</div>
                <div className="text-sm text-gray-500">Proveedores</div>
              </div>
            )}
          </div>
          
          {/* Date Range Row */}
          {shoppingList.dateRange.from && shoppingList.dateRange.to && (
            <div className="text-center md:text-right border-t border-gray-100 pt-3">
              <div className="text-sm text-gray-500">
                Período: {new Date(shoppingList.dateRange.from).toLocaleDateString()} - {new Date(shoppingList.dateRange.to).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Supplier Configuration Warnings */}
      {(supplierStats.incomplete > 0 || supplierStats.missing > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
          {supplierStats.missing > 0 && (
            <div className="flex items-center space-x-2 text-red-700">
              <XCircle className="h-5 w-5" />
              <span>
                <strong>{supplierStats.missing} ingredientes</strong> sin proveedor asignado - usando precios base
              </span>
            </div>
          )}
          {supplierStats.incomplete > 0 && (
            <div className="flex items-center space-x-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              <span>
                <strong>{supplierStats.incomplete} ingredientes</strong> con proveedor asignado pero sin precio configurado
              </span>
            </div>
          )}
          <div className="text-sm text-yellow-600">
            El costo total puede no ser preciso. Configura los proveedores y precios para obtener cálculos exactos.
          </div>
        </div>
      )}

      {/* Generate Orders Button */}
      {shoppingList.ingredientsBySupplier.length > 0 && (
        <div className="text-center space-y-2">
          <button 
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto"
            onClick={onGenerateOrders}
            disabled={isGeneratingOrders}
          >
            <Plus className="h-5 w-5" />
            <span>{isGeneratingOrders ? 'Generando Pedidos...' : 'Generar Pedidos por Proveedor'}</span>
          </button>
          <p className="text-sm text-gray-500">
            Se creará un pedido separado para cada proveedor con estado "pendiente"
          </p>
        </div>
      )}

      {/* Suppliers List */}
      {shoppingList.ingredientsBySupplier.length > 0 ? (
        <div className="space-y-6">
          {shoppingList.ingredientsBySupplier.map(supplier => (
            <SupplierGroupComponent 
              key={supplier.supplierId}
              supplier={supplier}
              shoppingList={shoppingList}
              onIngredientRowClick={onIngredientRowClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <Plus className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-500">No hay ingredientes que comprar con los filtros seleccionados</p>
        </div>
      )}
    </div>
  )
}

interface SupplierGroupComponentProps {
  supplier: SupplierGroup
  shoppingList: ShoppingList
  onIngredientRowClick: (ingredientId: number) => void
}

function SupplierGroupComponent({ supplier, shoppingList, onIngredientRowClick }: SupplierGroupComponentProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Supplier Header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">{supplier.supplierName}</h3>
          <span className="text-lg font-bold text-orange-600">{formatCurrency(supplier.supplierTotal)}</span>
        </div>
      </div>

      {/* Ingredients Table */}
      <div className="overflow-x-auto">
        <table className="shopping-table">
          <colgroup>
            <col /><col /><col /><col /><col /><col /><col /><col />
          </colgroup>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ingrediente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Necesario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">En Stock</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">A Comprar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unidad Venta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Real</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Real</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Real</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {supplier.ingredients.map(ingredient => {
              const statusIndicator = getSupplierStatusIndicator(ingredient.supplierStatus)
              const StatusIcon = statusIndicator.icon
              return (
                <tr 
                  key={ingredient.ingredientId}
                  onClick={() => onIngredientRowClick(ingredient.ingredientId)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{ingredient.name}</span>
                      <div className="relative group">
                        <StatusIcon 
                          className={`h-4 w-4 ${statusIndicator.className}`}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {statusIndicator.title}
                        </div>
                      </div>
                    </div>
                    {ingredient.packageSize && ingredient.packageUnit && ingredient.packageSize !== 1 && 
                     !['kg', 'g', 'litros', 'ml', 'unit', 'unidad', 'unidades'].includes(ingredient.packageUnit.toLowerCase()) && (
                      <div className="text-xs text-gray-500 italic mt-1">
                        {formatDecimal(ingredient.packageSize)} {ingredient.unit} por {ingredient.packageUnit}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {shoppingList.filters?.manual && ingredient.packageSize && ingredient.packageUnit && ingredient.packageSize > 1 ? (
                      <div>
                        <div>{formatDecimal(Math.ceil(ingredient.needed / ingredient.packageSize))} {ingredient.packageUnit}</div>
                        <div className="text-xs text-gray-500 italic">
                          ({formatDecimal(Math.ceil(ingredient.needed / ingredient.packageSize) * ingredient.packageSize)} {ingredient.unit})
                        </div>
                      </div>
                    ) : shoppingList.filters?.manual ? (
                      <div>{formatDecimal(ingredient.needed)} {ingredient.packageUnit || ingredient.unit}</div>
                    ) : (
                      <div>
                        <div>{formatDecimal(ingredient.needed)} {ingredient.unit}</div>
                        {ingredient.wastePercent > 0 && (
                          <div className="text-xs text-gray-500 italic">
                            Base: {formatDecimal(ingredient.neededBase)} + {(ingredient.wastePercent * 100).toFixed(1)}% merma
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDecimal(ingredient.inStock)} {ingredient.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-orange-600">
                    {shoppingList.filters?.manual && ingredient.packageSize && ingredient.packageUnit && ingredient.packageSize > 1 ? (
                      `${formatDecimal(Math.ceil(ingredient.toBuy / ingredient.packageSize))} ${ingredient.packageUnit}`
                    ) : (
                      `${formatDecimal(ingredient.toBuy)} ${ingredient.unit}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ingredient.packageSize && ingredient.packageSize > 1 ? (
                      `${formatDecimal(ingredient.packageSize)} ${ingredient.unit}`
                    ) : (
                      `1 ${ingredient.unit}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ingredient.packagesToBuy > 0 ? (
                      `${formatDecimal(ingredient.realQuantity)} ${ingredient.unit}`
                    ) : (
                      `${formatDecimal(ingredient.toBuy)} ${ingredient.unit}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ingredient.supplierPrice ? (
                      ingredient.packageSize > 0 ? (
                        `${formatCurrency(ingredient.supplierPrice / ingredient.packageSize)}/${ingredient.unit}`
                      ) : (
                        `${formatCurrency(ingredient.supplierPrice)}/${ingredient.packageUnit || 'unidad'}`
                      )
                    ) : (
                      `${formatCurrency(ingredient.pricePerUnit)}/${ingredient.unit}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {ingredient.realTotalCost > 0 ? (
                      formatCurrency(ingredient.realTotalCost)
                    ) : (
                      formatCurrency(ingredient.totalCost)
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}