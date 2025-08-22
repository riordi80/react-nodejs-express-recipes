'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Calendar, AlertTriangle, Zap, AlertCircle, CheckCircle2 } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { apiGet } from '@/lib/api'

interface ExpiringIngredient {
  ingredient_id: number
  name: string
  expiration_date: string
  stock: number
  unit: string
  days_until_expiry: number
  is_available: boolean
}

interface ExpiringIngredientsModalProps {
  isOpen: boolean
  onClose: () => void
}

const ExpiringIngredientsModal = ({ isOpen, onClose }: ExpiringIngredientsModalProps) => {
  const [ingredients, setIngredients] = useState<ExpiringIngredient[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAllExpiringIngredients()
    }
  }, [isOpen])

  const loadAllExpiringIngredients = async () => {
    try {
      setLoading(true)
      const response = await apiGet<ExpiringIngredient[]>('/ingredients/expiring/all')
      setIngredients(response.data)
    } catch {
      console.error('Fixed error in catch block')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  const getExpiryStatus = (days: number) => {
    if (days < 0) {
      return { 
        message: '¡Ya caducado!', 
        color: 'text-red-700', 
        bgColor: 'bg-red-100', 
        Icon: AlertTriangle,
        priority: 1
      }
    } else if (days === 0) {
      return { 
        message: '¡Caduca hoy!', 
        color: 'text-red-600', 
        bgColor: 'bg-red-50', 
        Icon: Zap,
        priority: 2
      }
    } else if (days <= 3) {
      return { 
        message: 'Crítico', 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-50', 
        Icon: AlertCircle,
        priority: 3
      }
    } else if (days <= 7) {
      return { 
        message: 'Próximo', 
        color: 'text-yellow-600', 
        bgColor: 'bg-yellow-50', 
        Icon: Clock,
        priority: 4
      }
    } else {
      return { 
        message: 'Normal', 
        color: 'text-green-600', 
        bgColor: 'bg-green-50', 
        Icon: CheckCircle2,
        priority: 5
      }
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ingredientes Próximos a Caducar"
      size="lg"
    >
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Ingredientes que caducan en los próximos 15 días</span>
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
                const statusA = getExpiryStatus(a.days_until_expiry)
                const statusB = getExpiryStatus(b.days_until_expiry)
                // Ordenar por prioridad primero, luego por días hasta caducidad
                if (statusA.priority !== statusB.priority) {
                  return statusA.priority - statusB.priority
                }
                return a.days_until_expiry - b.days_until_expiry
              })
              .map((ingredient) => {
              const expiryStatus = getExpiryStatus(ingredient.days_until_expiry)
              return (
                <div 
                  key={ingredient.ingredient_id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${expiryStatus.bgColor}`}>
                      <expiryStatus.Icon className={`h-6 w-6 ${expiryStatus.color}`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {ingredient.name}
                    </h3>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">
                        Caduca: {formatDate(ingredient.expiration_date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Stock: {ingredient.stock} {ingredient.unit}
                        </span>
                        <span className={`text-xs font-medium flex items-center gap-1 ${expiryStatus.color}`}>
                          <expiryStatus.Icon className="h-3 w-3" />
                          {expiryStatus.message}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className={`text-sm font-medium ${expiryStatus.color}`}>
                      {ingredient.days_until_expiry >= 0 
                        ? `${ingredient.days_until_expiry} día${ingredient.days_until_expiry !== 1 ? 's' : ''}`
                        : `${Math.abs(ingredient.days_until_expiry)} día${Math.abs(ingredient.days_until_expiry) !== 1 ? 's' : ''} vencido`
                      }
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nada próximo a caducar
            </h3>
            <p className="text-gray-500">
              No hay ingredientes que caduquen en los próximos 15 días
            </p>
          </div>
        )}

        {ingredients.length > 0 && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Total: {ingredients.length} ingredientes próximos a caducar
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ExpiringIngredientsModal