'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Package, Euro, ShoppingCart } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { apiGet } from '@/lib/api'

interface NoSupplierIngredient {
  ingredient_id: number
  name: string
  category: string
  stock: number
  unit: string
  base_price?: number
  is_available: boolean
}

interface NoSupplierIngredientsModalProps {
  isOpen: boolean
  onClose: () => void
}

const NoSupplierIngredientsModal = ({ isOpen, onClose }: NoSupplierIngredientsModalProps) => {
  const [ingredients, setIngredients] = useState<NoSupplierIngredient[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAllNoSupplierIngredients()
    }
  }, [isOpen])

  const loadAllNoSupplierIngredients = async () => {
    try {
      setLoading(true)
      console.log('Cargando ingredientes sin proveedor asignado...')
      const response = await apiGet<NoSupplierIngredient[]>('/ingredients/no-suppliers/all')
      console.log('Respuesta de la API:', response.data)
      setIngredients(response.data || [])
    } catch {
      console.error('Fixed error in catch block')
      // Intentar con endpoint alternativo si el primero falla
      try {
        console.log('Intentando endpoint alternativo...')
        const fallbackResponse = await apiGet<NoSupplierIngredient[]>('/ingredients/dashboard-widgets')
        const widgetData = fallbackResponse.data as any
        if (widgetData && widgetData.noSuppliers) {
          console.log('Datos del widget:', widgetData.noSuppliers)
          setIngredients(widgetData.noSuppliers)
        }
      } catch (fallbackError) {
        console.error('Error en endpoint alternativo:', fallbackError)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (ingredient: NoSupplierIngredient) => {
    const price = ingredient.base_price
    return price ? price.toLocaleString('es-ES', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }) : 'Sin precio'
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Carnes': 'bg-red-50 text-red-600',
      'Pescados': 'bg-blue-50 text-blue-600',
      'Verduras': 'bg-green-50 text-green-600',
      'Frutas': 'bg-yellow-50 text-yellow-600',
      'Lácteos': 'bg-purple-50 text-purple-600',
      'Cereales': 'bg-orange-50 text-orange-600',
      'Especias': 'bg-pink-50 text-pink-600',
      'Bebidas': 'bg-cyan-50 text-cyan-600',
      'Otros': 'bg-gray-50 text-gray-600'
    }
    return colors[category] || 'bg-gray-50 text-gray-600'
  }

  const groupedByCategory = ingredients.reduce((acc, ingredient) => {
    const category = ingredient.category || 'Otros'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(ingredient)
    return acc
  }, {} as Record<string, NoSupplierIngredient[]>)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ingredientes sin Proveedor Asignado"
      size="lg"
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <ShoppingCart className="h-4 w-4" />
          <span>Ingredientes que necesitan un proveedor asignado</span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : ingredients.length > 0 ? (
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {Object.entries(groupedByCategory)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([category, categoryIngredients]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-gray-900">{category}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                    {categoryIngredients.length} ingrediente{categoryIngredients.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-2 ml-4">
                  {categoryIngredients
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((ingredient) => (
                    <div 
                      key={ingredient.ingredient_id}
                      className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                          <Package className="h-5 w-5 text-orange-600" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-medium text-gray-900 truncate">
                          {ingredient.name}
                        </h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            Stock: {ingredient.stock} {ingredient.unit}
                          </span>
                          {!ingredient.is_available && (
                            <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              No disponible
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-right">
                        {ingredient.base_price ? (
                          <div className="flex items-center text-sm text-gray-900">
                            <Euro className="h-3 w-3 mr-1 text-gray-400" />
                            {formatPrice(ingredient)}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sin precio</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Todos tienen proveedor asignado
            </h3>
            <p className="text-gray-500">
              Todos los ingredientes tienen un proveedor asignado correctamente
            </p>
          </div>
        )}

        {ingredients.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Total: {ingredients.length} ingredientes sin proveedor asignado
          </div>
        )}
      </div>
    </Modal>
  )
}

export default NoSupplierIngredientsModal