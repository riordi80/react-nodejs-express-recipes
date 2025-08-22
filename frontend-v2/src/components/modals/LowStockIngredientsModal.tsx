'use client'

import React, { useState, useEffect } from 'react'
import { TrendingDown, Package, Euro, AlertTriangle, Zap, AlertCircle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { apiGet } from '@/lib/api'

interface LowStockIngredient {
  ingredient_id: number
  name: string
  stock: number
  stock_minimum: number
  unit: string
  deficit: number
  is_available: boolean
  base_price?: number
  net_price?: number
}

interface LowStockIngredientsModalProps {
  isOpen: boolean
  onClose: () => void
}

const LowStockIngredientsModal = ({ isOpen, onClose }: LowStockIngredientsModalProps) => {
  const [ingredients, setIngredients] = useState<LowStockIngredient[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAllLowStockIngredients()
    }
  }, [isOpen])

  const loadAllLowStockIngredients = async () => {
    try {
      setLoading(true)
      const response = await apiGet<LowStockIngredient[]>('/ingredients/low-stock/all')
      setIngredients(response.data)
    } catch {
      console.error('Fixed error in catch block')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (ingredient: LowStockIngredient) => {
    const price = ingredient.net_price || ingredient.base_price
    return price ? price.toLocaleString('es-ES', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }) : 'Sin precio'
  }

  const getCriticalityStatus = (ingredient: LowStockIngredient) => {
    const deficitPercentage = (ingredient.deficit / ingredient.stock_minimum) * 100
    
    if (ingredient.stock === 0) {
      return { 
        message: '¡Sin stock!', 
        color: 'text-red-700', 
        bgColor: 'bg-red-100', 
        Icon: AlertTriangle,
        priority: 1
      }
    } else if (deficitPercentage >= 80) {
      return { 
        message: 'Crítico', 
        color: 'text-red-600', 
        bgColor: 'bg-red-50', 
        Icon: Zap,
        priority: 2
      }
    } else if (deficitPercentage >= 50) {
      return { 
        message: 'Muy bajo', 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-50', 
        Icon: AlertCircle,
        priority: 3
      }
    } else {
      return { 
        message: 'Bajo', 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-50', 
        Icon: TrendingDown,
        priority: 4
      }
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ingredientes en Stock Crítico"
      size="lg"
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <TrendingDown className="h-4 w-4" />
          <span>Ingredientes por debajo del stock mínimo</span>
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
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {ingredients
              .sort((a, b) => {
                const statusA = getCriticalityStatus(a)
                const statusB = getCriticalityStatus(b)
                // Ordenar por prioridad primero, luego por déficit
                if (statusA.priority !== statusB.priority) {
                  return statusA.priority - statusB.priority
                }
                return b.deficit - a.deficit
              })
              .map((ingredient) => {
              const criticalityStatus = getCriticalityStatus(ingredient)
              return (
                <div 
                  key={ingredient.ingredient_id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${criticalityStatus.bgColor}`}>
                      <Package className={`h-6 w-6 ${criticalityStatus.color}`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {ingredient.name}
                    </h3>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">
                        Stock: {ingredient.stock} {ingredient.unit} / Mínimo: {ingredient.stock_minimum} {ingredient.unit}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Faltan: {ingredient.deficit} {ingredient.unit}
                        </span>
                        <span className={`text-xs font-medium flex items-center gap-1 ${criticalityStatus.color}`}>
                          <criticalityStatus.Icon className="h-3 w-3" />
                          {criticalityStatus.message}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center text-sm text-gray-900">
                      <Euro className="h-3 w-3 mr-1 text-gray-400" />
                      {formatPrice(ingredient)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Total: €{((ingredient.net_price || ingredient.base_price || 0) * ingredient.deficit).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingDown className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Stock controlado
            </h3>
            <p className="text-gray-500">
              Todos los ingredientes están por encima del stock mínimo
            </p>
          </div>
        )}

        {ingredients.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Total: {ingredients.length} ingredientes en stock crítico
          </div>
        )}
      </div>
    </Modal>
  )
}

export default LowStockIngredientsModal