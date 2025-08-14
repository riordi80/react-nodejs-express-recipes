'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { apiGet } from '@/lib/api'

interface SidebarCountersContextType {
  activeEventsCount: number
  isLoading: boolean
  error: string | null
  refetchActiveEvents: () => Promise<void>
}

const SidebarCountersContext = createContext<SidebarCountersContextType | undefined>(undefined)

interface SidebarCountersProviderProps {
  children: ReactNode
}

export const SidebarCountersProvider: React.FC<SidebarCountersProviderProps> = ({ children }) => {
  const [activeEventsCount, setActiveEventsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActiveEventsCount = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Intentar endpoint optimizado primero
      try {
        const response = await apiGet<{planned: number, confirmed: number, total: number}>('/events/count?status=planned,confirmed')
        const activeCount = response.data.planned + response.data.confirmed
        setActiveEventsCount(activeCount)
        return
      } catch (optimizedErr) {
        // Endpoint específico no disponible, usar fallback
      }
      
      // Fallback: obtener todos los eventos y filtrar
      const fallbackResponse = await apiGet<{data: any[], pagination: any}>('/events?limit=1000')
      
      const events = fallbackResponse.data.data || []
      const activeEvents = events.filter(
        (event: any) => event.status === 'planned' || event.status === 'confirmed'
      )
      
      // Development log removed
      
      setActiveEventsCount(activeEvents.length)
      
    } catch (err: any) {
      console.error('❌ Error fetching active events count:', err)
      setError('Error al obtener el conteo de eventos')
      // No resetear el contador en caso de error, mantener el último valor conocido
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar datos inicialmente
  useEffect(() => {
    fetchActiveEventsCount()
  }, [])

  // Auto-refrescar cada 5 minutos
  useEffect(() => {
    const interval = setInterval(fetchActiveEventsCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Exponer función para refrescar manualmente
  const refetchActiveEvents = async () => {
    await fetchActiveEventsCount()
  }

  const value = {
    activeEventsCount,
    isLoading,
    error,
    refetchActiveEvents
  }

  return (
    <SidebarCountersContext.Provider value={value}>
      {children}
    </SidebarCountersContext.Provider>
  )
}

// Hook para usar el contexto
export const useSidebarCounters = (): SidebarCountersContextType => {
  const context = useContext(SidebarCountersContext)
  if (!context) {
    throw new Error('useSidebarCounters must be used within a SidebarCountersProvider')
  }
  return context
}