'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import Toast, { ToastProps } from './Toast'

interface ToastContainerProps {
  toasts: ToastProps[]
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

const ToastContainer = ({ 
  toasts, 
  position = 'top-right' 
}: ToastContainerProps) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  }

  // Solo renderizar si hay toasts
  if (toasts.length === 0) return null

  // Renderizar en un portal para que aparezca por encima de todo
  if (typeof window === 'undefined') return null

  return createPortal(
    <div 
      className={`fixed z-50 ${positionClasses[position]} pointer-events-none`}
      aria-live="polite"
      aria-label="Notificaciones"
    >
      <div className={`flex flex-col space-y-2 pointer-events-auto ${
        position.includes('bottom') ? 'flex-col-reverse' : ''
      }`}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
          />
        ))}
      </div>
    </div>,
    document.body
  )
}

export default ToastContainer