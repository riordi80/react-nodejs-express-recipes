'use client'

import React from 'react'
import { ToastProvider } from '@/context/ToastContext'
import { useSettings } from '@/context/SettingsContext'

interface ToastProviderWithSettingsProps {
  children: React.ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxToasts?: number
}

export const ToastProviderWithSettings = ({ 
  children, 
  position = 'top-right',
  maxToasts = 5 
}: ToastProviderWithSettingsProps) => {
  const { soundEnabled } = useSettings()

  return (
    <ToastProvider 
      position={position} 
      enableSound={soundEnabled}
      maxToasts={maxToasts}
    >
      {children}
    </ToastProvider>
  )
}