'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import ToastContainer from '@/components/ui/ToastContainer'
import { ToastProps } from '@/components/ui/Toast'

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => string
  hideToast: (id: string) => void
  clearAllToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: React.ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxToasts?: number
  enableSound?: boolean
}

export const ToastProvider = ({ 
  children, 
  position = 'top-right',
  maxToasts = 5,
  enableSound = true
}: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const showToast = useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    
    const newToast: ToastProps = {
      ...toast,
      id,
      playSound: toast.playSound !== undefined ? toast.playSound : enableSound,
      onClose: (toastId: string) => hideToast(toastId)
    }

    setToasts(currentToasts => {
      const updatedToasts = [newToast, ...currentToasts]
      
      // Limitar el número máximo de toasts
      if (updatedToasts.length > maxToasts) {
        return updatedToasts.slice(0, maxToasts)
      }
      
      return updatedToasts
    })

    return id
  }, [maxToasts, enableSound])

  const hideToast = useCallback((id: string) => {
    setToasts(currentToasts => 
      currentToasts.filter(toast => toast.id !== id)
    )
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const value = {
    showToast,
    hideToast,
    clearAllToasts
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} position={position} />
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Hook conveniente para tipos específicos de toast
export const useToastHelpers = () => {
  const { showToast } = useToast()

  return {
    success: (message: string, title?: string, options?: Partial<ToastProps>) =>
      showToast({ message, title, type: 'success', ...options }),
    
    error: (message: string, title?: string, options?: Partial<ToastProps>) =>
      showToast({ message, title, type: 'error', ...options }),
    
    warning: (message: string, title?: string, options?: Partial<ToastProps>) =>
      showToast({ message, title, type: 'warning', ...options }),
    
    info: (message: string, title?: string, options?: Partial<ToastProps>) =>
      showToast({ message, title, type: 'info', ...options }),
  }
}