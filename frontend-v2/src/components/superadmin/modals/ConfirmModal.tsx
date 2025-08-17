'use client'

import React from 'react'
import { AlertTriangle, Check, Info, X } from 'lucide-react'
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext'
import ThemedModal from './ThemedModal'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  loading?: boolean
}

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  loading = false
}: ConfirmModalProps) => {
  const { getThemeClasses } = useSuperAdminTheme()
  const themeClasses = getThemeClasses()

  const icons = {
    danger: AlertTriangle,
    warning: AlertTriangle,
    info: Info,
    success: Check
  }

  const iconColors = {
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400'
  }

  const iconBgColors = {
    danger: 'bg-red-100 dark:bg-red-900/20',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20',
    info: 'bg-blue-100 dark:bg-blue-900/20',
    success: 'bg-green-100 dark:bg-green-900/20'
  }

  const buttonColors = {
    danger: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700'
  }

  const Icon = icons[type]

  const handleConfirm = () => {
    onConfirm()
    if (!loading) {
      onClose()
    }
  }

  return (
    <ThemedModal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="sm" 
      closeOnOverlay={!loading}
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

      <div className="flex items-center justify-end space-x-3">
        <button
          onClick={onClose}
          disabled={loading}
          className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`inline-flex items-center px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${buttonColors[type]}`}
        >
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
          )}
          {confirmText}
        </button>
      </div>
    </ThemedModal>
  )
}

export default ConfirmModal