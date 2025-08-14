import { useState, useEffect, useRef, useCallback } from 'react'

interface UseUnsavedChangesOptions {
  /** Datos del formulario que se quieren monitorear */
  formData: any
  /** Lista de datos adicionales a monitorear (ej: ingredientes) */
  additionalData?: any[]
  /** Indica si la página está cargando inicialmente */
  isLoading: boolean
  /** Tiempo en ms para esperar antes de activar detección (por defecto: 1000) */
  initializationDelay?: number
}

interface UseUnsavedChangesReturn {
  /** Indica si hay cambios sin guardar */
  hasUnsavedChanges: boolean
  /** Función para actualizar valores iniciales después del guardado */
  updateInitialValues: () => void
}

/**
 * Hook simplificado solo para detectar cambios - botón gris/verde
 */
export const useUnsavedChanges = ({
  formData,
  additionalData = [],
  isLoading,
  initializationDelay = 1000
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn => {
  
  // Estados internos
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Refs para valores iniciales
  const initialFormData = useRef<any>(null)
  const initialAdditionalData = useRef<any[]>([])
  
  // Función para crear deep clone seguro
  const safeDeepClone = useCallback((obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (Array.isArray(obj)) return obj.map(safeDeepClone)
    
    const cloned: any = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = safeDeepClone(obj[key])
      }
    }
    return cloned
  }, [])
  
  // Función para comparar objetos de forma segura
  const deepEqual = useCallback((obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true
    if (obj1 === null || obj2 === null) return false
    if (typeof obj1 !== typeof obj2) return false
    
    if (obj1 instanceof Date && obj2 instanceof Date) {
      return obj1.getTime() === obj2.getTime()
    }
    
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false
      return obj1.every((item, index) => deepEqual(item, obj2[index]))
    }
    
    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1)
      const keys2 = Object.keys(obj2)
      
      if (keys1.length !== keys2.length) return false
      
      return keys1.every(key => 
        keys2.includes(key) && deepEqual(obj1[key], obj2[key])
      )
    }
    
    return false
  }, [])
  
  // Función para establecer valores iniciales
  const setInitialValues = useCallback(() => {
    initialFormData.current = safeDeepClone(formData)
    initialAdditionalData.current = safeDeepClone(additionalData)
  }, [formData, additionalData, safeDeepClone])
  
  // Función para actualizar valores iniciales después del guardado
  const updateInitialValues = useCallback(() => {
    setInitialValues()
    setHasUnsavedChanges(false)
  }, [setInitialValues])
  
  // Inicialización simple
  useEffect(() => {
    if (!isLoading && !isInitialized && initialFormData.current === null) {
      setInitialValues()
      
      const timeout = setTimeout(() => {
        setIsInitialized(true)
      }, initializationDelay)
      
      return () => clearTimeout(timeout)
    }
  }, [isLoading, isInitialized, setInitialValues, initializationDelay])
  
  // Detectar cuando volvemos a la página después de navegar
  useEffect(() => {
    if (!isLoading && initialFormData.current !== null && !isInitialized) {
      // Limpiar y reinicializar
      initialFormData.current = null
      setIsInitialized(false)
      
      setTimeout(() => {
        if (!isInitialized && initialFormData.current === null) {
          setInitialValues()
          setTimeout(() => setIsInitialized(true), initializationDelay)
        }
      }, 100)
    }
  }, [isLoading, isInitialized, setInitialValues, initializationDelay])
  
  // Detección de cambios
  useEffect(() => {
    if (!initialFormData.current || isLoading || !isInitialized) {
      return
    }
    
    const formChanged = !deepEqual(formData, initialFormData.current)
    const additionalChanged = !deepEqual(additionalData, initialAdditionalData.current)
    
    const hasChanges = formChanged || additionalChanged
    setHasUnsavedChanges(hasChanges)
  }, [formData, additionalData, isLoading, isInitialized, deepEqual])
  
  return {
    hasUnsavedChanges,
    updateInitialValues
  }
}