'use client'

import React, { useState, useEffect } from 'react'
import { Sprout, Euro, Calendar, AlertTriangle, Clock, CheckCircle, Zap, Sparkles, Circle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { apiGet } from '@/lib/api'

interface SeasonalIngredient {
  ingredient_id: number
  name: string
  season: string
  stock: number
  unit: string
  base_price?: number
  net_price?: number
  preferred_supplier_price?: number
  is_available: boolean
}

interface SeasonalIngredientsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SeasonalIngredientsModal = ({ isOpen, onClose }: SeasonalIngredientsModalProps) => {
  const [ingredients, setIngredients] = useState<SeasonalIngredient[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAllSeasonalIngredients()
    }
  }, [isOpen])

  const loadAllSeasonalIngredients = async () => {
    try {
      setLoading(true)
      const response = await apiGet<SeasonalIngredient[]>('/ingredients/seasonal/all')
      setIngredients(response.data)
    } catch (error) {
      console.error('Error loading seasonal ingredients:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (ingredient: SeasonalIngredient) => {
    const price = ingredient.preferred_supplier_price || ingredient.net_price || ingredient.base_price
    return price ? price.toLocaleString('es-ES', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }) : 'Sin precio'
  }

  const formatSeasonMonths = (season: string) => {
    if (!season || season === 'todo_año' || season === 'todo el año') {
      return 'Todo el año'
    }
    
    const months = season.split(',').map(m => m.trim())
    
    if (months.length === 1) {
      return months[0]
    } else if (months.length === 2) {
      return `${months[0]} y ${months[1]}`
    } else {
      const allButLast = months.slice(0, -1)
      const last = months[months.length - 1]
      return `${allButLast.join(', ')} y ${last}`
    }
  }

  const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' })

  const getSeasonStatus = (season: string) => {
    if (!season || season === 'todo_año' || season === 'todo el año') {
      return { message: 'Todo el año', color: 'text-blue-600', bgColor: 'bg-blue-50', Icon: CheckCircle }
    }
    
    const months = season.toLowerCase().split(',').map(m => m.trim())
    const currentMonthLower = currentMonth.toLowerCase()
    const monthIndex = months.indexOf(currentMonthLower)
    
    if (monthIndex === -1) {
      return { message: 'Fuera de temporada', color: 'text-gray-500', bgColor: 'bg-gray-50', Icon: Circle }
    }
    
    const totalMonths = months.length
    
    // Lógica de fases de temporada
    if (totalMonths === 1) {
      return { message: '¡Finalizando este mes!', color: 'text-red-600', bgColor: 'bg-red-50', Icon: Zap }
    } else if (monthIndex === 0) {
      return { message: 'Empezando temporada', color: 'text-green-600', bgColor: 'bg-green-50', Icon: Sparkles }
    } else if (monthIndex === totalMonths - 1) {
      return { message: '¡Úsalo pronto!', color: 'text-orange-600', bgColor: 'bg-orange-50', Icon: AlertTriangle }
    } else if (monthIndex <= Math.floor(totalMonths * 0.3)) {
      return { message: 'Recién disponible', color: 'text-emerald-600', bgColor: 'bg-emerald-50', Icon: Sparkles }
    } else if (monthIndex >= Math.floor(totalMonths * 0.7)) {
      return { message: 'Últimas semanas', color: 'text-amber-600', bgColor: 'bg-amber-50', Icon: Clock }
    } else {
      return { message: 'En su mejor momento', color: 'text-blue-600', bgColor: 'bg-blue-50', Icon: CheckCircle }
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ingredientes Estacionales"
      size="lg"
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Temporada actual: <span className="font-medium capitalize">{currentMonth}</span></span>
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
                const statusA = getSeasonStatus(a.season)
                const statusB = getSeasonStatus(b.season)
                // Orden de prioridad: crítico, atención, óptimo, empezando
                const priorityOrder: Record<string, number> = {
                  '¡Finalizando este mes!': 1,
                  '¡Úsalo pronto!': 2,
                  'Últimas semanas': 3,
                  'En su mejor momento': 4,
                  'Recién disponible': 5,
                  'Empezando temporada': 6,
                  'Todo el año': 7,
                  'Fuera de temporada': 8
                }
                return (priorityOrder[statusA.message] || 9) - (priorityOrder[statusB.message] || 9)
              })
              .map((ingredient) => {
              const seasonStatus = getSeasonStatus(ingredient.season)
              return (
                <div 
                  key={ingredient.ingredient_id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${seasonStatus.bgColor}`}>
                      <seasonStatus.Icon className={`h-6 w-6 ${seasonStatus.color}`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {ingredient.name}
                    </h3>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">
                        Meses: <span className="capitalize">{formatSeasonMonths(ingredient.season)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Stock: {ingredient.stock} {ingredient.unit}
                        </span>
                        <span className={`text-xs font-medium flex items-center gap-1 ${seasonStatus.color}`}>
                          <seasonStatus.Icon className="h-3 w-3" />
                          {seasonStatus.message}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center text-sm text-gray-900">
                      <Euro className="h-3 w-3 mr-1 text-gray-400" />
                      {formatPrice(ingredient)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Sprout className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sin ingredientes estacionales
            </h3>
            <p className="text-gray-500">
              No hay ingredientes de temporada para {currentMonth}
            </p>
          </div>
        )}

        {ingredients.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Total: {ingredients.length} ingredientes estacionales
          </div>
        )}
      </div>
    </Modal>
  )
}

export default SeasonalIngredientsModal