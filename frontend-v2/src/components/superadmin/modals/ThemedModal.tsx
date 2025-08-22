'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext'

interface ThemedModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlay?: boolean
  className?: string
  footer?: React.ReactNode
}

const ThemedModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlay = true,
  className,
  footer
}: ThemedModalProps) => {
  const { getThemeClasses } = useSuperAdminTheme()
  const themeClasses = getThemeClasses()

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div 
        className={clsx(
          `${themeClasses.card} rounded-lg shadow-xl w-full max-h-[85vh] overflow-hidden`,
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${themeClasses.border}`}>
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className={`text-lg sm:text-xl font-semibold ${themeClasses.text}`}>{title}</h2>
              )}
              {subtitle && (
                <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors p-1 rounded-lg ${themeClasses.buttonHover} ml-2`}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className={`px-4 sm:px-6 py-3 sm:py-4 border-t ${themeClasses.border} ${themeClasses.bgSecondary}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default ThemedModal