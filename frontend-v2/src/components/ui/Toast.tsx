'use client'

import React, { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

export interface ToastProps {
  id: string
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  onClose: (id: string) => void
  action?: {
    label: string
    onClick: () => void
  }
  playSound?: boolean
}

const Toast = ({
  id,
  title,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  action,
  playSound = true
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Aparecer inmediatamente
    setIsVisible(true)

    // Reproducir sonido de notificación si está habilitado
    if (playSound) {
      playNotificationSound(type)
    }

    // Auto close después de duration
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, playSound, type])

  const playNotificationSound = (toastType: 'success' | 'error' | 'warning' | 'info') => {
    try {
      // Crear un contexto de audio solo cuando se necesite
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Diferentes frecuencias para diferentes tipos de notificación
      const frequencies = {
        success: [523.25, 659.25, 783.99], // C5, E5, G5 (acorde mayor alegre)
        error: [220, 196, 174.61], // A3, G3, F3 (descendente, más grave)
        warning: [440, 523.25], // A4, C5 (dos tonos)
        info: [523.25, 440] // C5, A4 (neutro)
      }
      
      const notesFreq = frequencies[toastType]
      const duration = 0.15 // Duración de cada nota en segundos
      
      notesFreq.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
          oscillator.type = 'sine' // Sonido suave tipo campana
          
          // Envelope para suavizar el sonido
          gainNode.gain.setValueAtTime(0, audioContext.currentTime)
          gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01) // Volumen bajo
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + duration)
          
          // Limpiar después de usar
          oscillator.onended = () => {
            oscillator.disconnect()
            gainNode.disconnect()
          }
        }, index * 100) // 100ms entre notas
      })
      
      // Cerrar el contexto después de un tiempo
      setTimeout(() => {
        audioContext.close()
      }, (notesFreq.length * 100) + (duration * 1000) + 100)
      
    } catch (error) {
      console.warn('No se pudo reproducir el sonido de notificación:', error)
    }
  }

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose(id)
    }, 300) // Duración de la animación de salida
  }

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  }

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  }

  const backgroundColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }

  const Icon = icons[type]

  return (
    <div
      className={clsx(
        'flex items-start p-4 mb-3 border rounded-lg shadow-lg max-w-md w-full transition-all duration-300 ease-in-out transform',
        backgroundColors[type],
        {
          'translate-y-0 opacity-100': isVisible && !isLeaving,
          'translate-y-full opacity-0': !isVisible || isLeaving,
        }
      )}
      role="alert"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <Icon className={clsx('h-5 w-5', iconColors[type])} />
      </div>

      {/* Content */}
      <div className="ml-3 flex-1">
        {title && (
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            {title}
          </h4>
        )}
        <p className="text-sm text-gray-700">
          {message}
        </p>
        
        {/* Action button */}
        {action && (
          <div className="mt-3">
            <button
              onClick={action.onClick}
              className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {/* Close button */}
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={handleClose}
          className="inline-flex text-gray-400 hover:text-gray-600 transition-colors"
        >
          <span className="sr-only">Cerrar</span>
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default Toast