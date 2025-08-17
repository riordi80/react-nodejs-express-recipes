'use client';

import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  footer?: React.ReactNode;
  className?: string;
  fullscreen?: boolean;
  mobileFullscreen?: boolean;
}

const maxWidthClasses = {
  xs: 'max-w-xs sm:max-w-sm',
  sm: 'max-w-xs sm:max-w-md',
  md: 'max-w-xs sm:max-w-lg md:max-w-xl',
  lg: 'max-w-xs sm:max-w-lg md:max-w-2xl',
  xl: 'max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl',
  '2xl': 'max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl',
  '3xl': 'max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-5xl'
};

export default function SuperAdminModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
  footer,
  className = '',
  fullscreen = false,
  mobileFullscreen = false
}: SuperAdminModalProps) {
  const { getThemeClasses } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();

  // ESC para cerrar
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = 'unset'; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMobileFullscreen = mobileFullscreen || fullscreen;
  const isDesktopFullscreen = fullscreen;

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
        isMobileFullscreen ? 'p-0 sm:p-4' : 'p-2 sm:p-4'
      } ${isDesktopFullscreen ? 'sm:p-0' : ''}`}
      onClick={onClose}
    >
      <div 
        className={`
          ${isMobileFullscreen && !isDesktopFullscreen
            ? 'w-full h-full max-w-none max-h-none sm:rounded-lg sm:shadow-xl sm:w-full sm:max-w-5xl sm:max-h-[90vh]'
            : isDesktopFullscreen
            ? 'w-full h-full max-w-none max-h-none'
            : `rounded-lg shadow-xl w-full ${maxWidthClasses[maxWidth]} max-h-[95vh] sm:max-h-[90vh]`
          } 
          overflow-hidden ${themeClasses.card} ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-start sm:items-center justify-between p-3 sm:p-6 border-b ${themeClasses.border}`}>
          <div className="flex-1 min-w-0">
            <h3 className={`text-base sm:text-lg font-medium ${themeClasses.text} truncate`}>
              {title}
            </h3>
            {subtitle && (
              <p className={`text-xs sm:text-sm ${themeClasses.textSecondary} mt-1`}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors ml-2 p-1 rounded-lg ${themeClasses.buttonHover}`}
            aria-label="Cerrar modal"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className={`overflow-y-auto ${
          isMobileFullscreen && !isDesktopFullscreen
            ? 'max-h-[calc(100vh-120px)] sm:max-h-[calc(90vh-140px)]'
            : isDesktopFullscreen
            ? 'max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-140px)]' 
            : 'max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-140px)]'
        }`}>
          <div className="p-3 sm:p-6">
            {children}
          </div>
        </div>

        {/* Footer */}
        {footer && (
          <div className={`px-3 sm:px-6 py-3 sm:py-4 border-t ${themeClasses.border} ${themeClasses.bgSecondary}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Hook para simplificar el uso del modal
export function useSuperAdminModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  
  return {
    isOpen,
    openModal,
    closeModal
  };
}