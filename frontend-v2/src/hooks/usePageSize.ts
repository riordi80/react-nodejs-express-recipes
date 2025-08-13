'use client'

import { useState, useEffect } from 'react'
import { useSettings } from '@/context/SettingsContext'

/**
 * Hook para gestionar el tamaño de página específico por cada listado
 * Usa localStorage para persistir la configuración por página
 * Fallback al valor global de configuración
 */
export const usePageSize = (storageKey: string) => {
  const { settings } = useSettings()
  
  // Función para obtener el pageSize guardado o usar el default global
  const getStoredPageSize = (): number => {
    if (typeof window === 'undefined') return settings.pageSize
    
    try {
      const stored = localStorage.getItem(`pageSize-${storageKey}`)
      return stored ? parseInt(stored, 10) : settings.pageSize
    } catch {
      return settings.pageSize
    }
  }
  
  const [pageSize, setPageSizeState] = useState<number>(() => getStoredPageSize())
  
  // Función para cambiar el pageSize y persistirlo
  const setPageSize = (newSize: number) => {
    setPageSizeState(newSize)
    
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`pageSize-${storageKey}`, newSize.toString())
      } catch {
        // Silently fail if localStorage is not available
      }
    }
  }
  
  // Global prevalece: actualizar todas las páginas cuando cambie configuración global
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      // Obtener la configuración global guardada previamente
      const globalSettingKey = 'app-pageSize'
      const previousGlobalSetting = localStorage.getItem('previous-global-pageSize')
      const currentGlobalSetting = settings.pageSize.toString()
      
      // Si la configuración global cambió, actualizar esta página específica
      if (previousGlobalSetting && previousGlobalSetting !== currentGlobalSetting) {
        // Global cambió, actualizar todas las páginas
        setPageSizeState(settings.pageSize)
        localStorage.setItem(`pageSize-${storageKey}`, currentGlobalSetting)
      } else {
        // Primera vez o global no cambió, usar valor específico o global
        const stored = localStorage.getItem(`pageSize-${storageKey}`)
        if (!stored) {
          setPageSizeState(settings.pageSize)
        }
      }
      
      // Guardar el valor global actual para la próxima comparación
      localStorage.setItem('previous-global-pageSize', currentGlobalSetting)
    } catch {
      // Fallback to global setting
      setPageSizeState(settings.pageSize)
    }
  }, [settings.pageSize, storageKey])
  
  return {
    pageSize,
    setPageSize
  }
}