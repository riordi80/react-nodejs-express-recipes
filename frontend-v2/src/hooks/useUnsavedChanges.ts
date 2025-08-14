import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface UseUnsavedChangesOptions {
  /** Datos del formulario que se quieren monitorear */
  formData: any
  /** Lista de datos adicionales a monitorear (ej: ingredientes) */
  additionalData?: any[]
  /** Indica si la página está cargando inicialmente */
  isLoading: boolean
  /** Indica si se está guardando actualmente */
  isSaving?: boolean
  /** Tiempo en ms para esperar antes de activar detección (por defecto: 1000) */
  initializationDelay?: number
}

interface UseUnsavedChangesReturn {
  /** Indica si hay cambios sin guardar */
  hasUnsavedChanges: boolean
  /** Indica si se debe mostrar la modal de advertencia */
  showUnsavedWarning: boolean
  /** URL de navegación pendiente */
  pendingNavigation: string | null
  /** Función para marcar que se está guardando */
  setIsSaving: (saving: boolean) => void
  /** Función para actualizar valores iniciales después del guardado */
  updateInitialValues: () => void
  /** Funciones para manejar la modal */
  handleSaveAndExit: (saveFunction: () => Promise<void>) => Promise<void>
  handleDiscardChanges: () => void
  handleContinueEditing: () => void
}

/**
 * Hook personalizado para detectar cambios sin guardar y manejar la navegación
 * 
 * @example
 * const unsavedChanges = useUnsavedChanges({
 *   formData,
 *   additionalData: [ingredients, selectedCategories],
 *   isLoading,
 *   isSaving
 * })
 * 
 * // En el JSX:
 * <UnsavedChangesModal {...unsavedChanges} />
 */
export const useUnsavedChanges = ({
  formData,
  additionalData = [],
  isLoading,
  isSaving: externalIsSaving = false,
  initializationDelay = 1000
}: UseUnsavedChangesOptions): UseUnsavedChangesReturn => {
  const router = useRouter()
  
  // Estados internos
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [internalIsSaving, setInternalIsSaving] = useState(false)
  
  // Refs para valores iniciales
  const initialFormData = useRef<any>(null)
  const initialAdditionalData = useRef<any[]>([])
  
  // Combinar flags de guardado
  const isSaving = externalIsSaving || internalIsSaving
  
  // Función para establecer valores iniciales
  const setInitialValues = (newFormData: any, newAdditionalData: any[] = []) => {
    initialFormData.current = JSON.parse(JSON.stringify(newFormData))
    initialAdditionalData.current = JSON.parse(JSON.stringify(newAdditionalData))
  }
  
  // Función para actualizar valores iniciales después del guardado
  const updateInitialValues = () => {
    setInitialValues(formData, additionalData)
    setHasUnsavedChanges(false)
  }
  
  // Inicialización con delay
  useEffect(() => {
    if (!isLoading && initialFormData.current === null) {
      setInitialValues(formData, additionalData)
      
      const timeout = setTimeout(() => {
        setIsInitializing(false)
      }, initializationDelay)
      
      return () => clearTimeout(timeout)
    }
  }, [isLoading, formData, additionalData, initializationDelay])
  
  // Detección de cambios
  useEffect(() => {
    if (!initialFormData.current || isLoading || isInitializing) return
    
    const formChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData.current)
    const additionalChanged = JSON.stringify(additionalData) !== JSON.stringify(initialAdditionalData.current)
    
    const hasChanges = formChanged || additionalChanged
    setHasUnsavedChanges(hasChanges)
  }, [formData, additionalData, isLoading, isInitializing])
  
  // Interceptación de navegación
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSaving) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    // Interceptar clics en enlaces <Link> de Next.js
    const handleLinkClick = (e: MouseEvent) => {
      if (hasUnsavedChanges && !isSaving) {
        const target = e.target as HTMLElement
        // Buscar el elemento <a> más cercano
        const linkElement = target.closest('a[href]') as HTMLAnchorElement
        
        if (linkElement && linkElement.href) {
          const url = new URL(linkElement.href)
          const currentUrl = new URL(window.location.href)
          
          // Solo interceptar navegación interna y que sea diferente a la página actual
          if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
            e.preventDefault()
            e.stopPropagation()
            setPendingNavigation(url.pathname + url.search + url.hash)
            setShowUnsavedWarning(true)
          }
        }
      }
    }

    const originalPush = router.push
    const originalBack = router.back

    // Interceptar router.push
    router.push = function(url: string, options?: any) {
      if (hasUnsavedChanges && !isSaving && url !== window.location.pathname) {
        setPendingNavigation(url)
        setShowUnsavedWarning(true)
        return Promise.resolve(true)
      }
      return originalPush.call(this, url, options)
    }

    // Interceptar router.back
    router.back = function() {
      if (hasUnsavedChanges && !isSaving) {
        setPendingNavigation('/back')
        setShowUnsavedWarning(true)
        return
      }
      return originalBack.call(this)
    }

    // Agregar event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleLinkClick, true)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleLinkClick, true)
      router.push = originalPush
      router.back = originalBack
    }
  }, [hasUnsavedChanges, router, isSaving])
  
  // Función para guardar y salir
  const handleSaveAndExit = async (saveFunction: () => Promise<void>) => {
    try {
      setInternalIsSaving(true)
      await saveFunction()
      setShowUnsavedWarning(false)
      
      // Siempre navegar después de guardar desde la modal
      if (pendingNavigation) {
        if (pendingNavigation === '/back') {
          router.back()
        } else {
          router.push(pendingNavigation)
        }
        setPendingNavigation(null)
      } else {
        router.back()
      }
    } catch (error) {
      console.error('Error saving before exit:', error)
      throw error // Re-throw para que el componente pueda manejarlo si es necesario
    } finally {
      setInternalIsSaving(false)
    }
  }
  
  // Función para descartar cambios
  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false)
    setShowUnsavedWarning(false)
    
    setTimeout(() => {
      if (pendingNavigation) {
        if (pendingNavigation === '/back') {
          router.back()
        } else {
          router.push(pendingNavigation)
        }
        setPendingNavigation(null)
      } else {
        router.back()
      }
    }, 0)
  }
  
  // Función para continuar editando
  const handleContinueEditing = () => {
    setShowUnsavedWarning(false)
    setPendingNavigation(null)
  }
  
  return {
    hasUnsavedChanges,
    showUnsavedWarning,
    pendingNavigation,
    setIsSaving: setInternalIsSaving,
    updateInitialValues,
    handleSaveAndExit,
    handleDiscardChanges,
    handleContinueEditing
  }
}