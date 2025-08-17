'use client'

import React from 'react'
import { AlertTriangle, Check, Info, XCircle } from 'lucide-react'
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext'
import ThemedModal from './ThemedModal'

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  buttonText?: string
}

const MessageModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'Entendido'
}: MessageModalProps) => {
  const { getThemeClasses } = useSuperAdminTheme()
  const themeClasses = getThemeClasses()

  const icons = {
    success: Check,
    error: XCircle,
    warning: AlertTriangle,
    info: Info
  }

  const iconColors = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400'
  }

  const iconBgColors = {
    success: 'bg-green-100 dark:bg-green-900/20',
    error: 'bg-red-100 dark:bg-red-900/20',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20',
    info: 'bg-blue-100 dark:bg-blue-900/20'
  }

  const buttonColors = {
    success: 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700',
    error: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
  }

  const Icon = icons[type]

  return (
    <ThemedModal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="sm" 
      showCloseButton={false}
    >
      <div className="flex items-center space-x-4 mb-6">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconBgColors[type]}`}>
          <Icon className={`h-5 w-5 ${iconColors[type]}`} />
        </div>
        <div className="flex-1">
          {title && (
            <h3 className={`text-lg font-medium ${themeClasses.text} mb-2`}>{title}</h3>
          )}
          <p className={`text-sm ${themeClasses.textSecondary}`}>{message}</p>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={onClose}
          className={`px-4 py-2 text-white rounded-lg transition-colors ${buttonColors[type]}`}
        >
          {buttonText}
        </button>
      </div>
    </ThemedModal>
  )
}

export default MessageModal