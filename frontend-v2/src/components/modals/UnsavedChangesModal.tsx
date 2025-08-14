'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from '../ui/Modal'

interface UnsavedChangesModalProps {
  /** Controla si la modal está visible */
  isOpen: boolean
  /** Función para guardar cambios y salir */
  onSaveAndExit: () => Promise<void> | void
  /** Función para descartar cambios y salir */
  onDiscardChanges: () => void
  /** Función para cerrar modal y continuar editando */
  onContinueEditing: () => void
  /** Título personalizado (opcional) */
  title?: string
  /** Mensaje personalizado (opcional) */
  message?: string
  /** Texto del botón guardar (opcional) */
  saveButtonText?: string
  /** Texto del botón descartar (opcional) */
  discardButtonText?: string
  /** Texto del botón cancelar (opcional) */
  cancelButtonText?: string
  /** Indica si se está guardando (para mostrar loading) */
  isSaving?: boolean
}

/**
 * Modal reutilizable para advertir sobre cambios sin guardar
 * 
 * @example
 * <UnsavedChangesModal
 *   isOpen={showUnsavedWarning}
 *   onSaveAndExit={handleSaveAndExit}
 *   onDiscardChanges={handleDiscardChanges}
 *   onContinueEditing={handleContinueEditing}
 * />
 */
export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onSaveAndExit,
  onDiscardChanges,
  onContinueEditing,
  title = 'Cambios sin guardar',
  message = 'Tienes cambios sin guardar. ¿Qué te gustaría hacer?',
  saveButtonText = 'Guardar',
  discardButtonText = 'Descartar',
  cancelButtonText = 'Cancelar',
  isSaving = false
}) => {
  const handleSaveAndExit = async () => {
    try {
      await onSaveAndExit()
    } catch (error) {
      // El error ya se maneja en el hook o componente padre
      console.error('Error in save and exit:', error)
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onContinueEditing} 
      size="sm" 
      closeOnOverlay={!isSaving}
      showCloseButton={false}
    >
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-yellow-100">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 mt-6">
          <button
            onClick={onContinueEditing}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {cancelButtonText}
          </button>
          <button
            onClick={onDiscardChanges}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-red-600 hover:bg-red-700 whitespace-nowrap"
          >
            {discardButtonText}
          </button>
          <button
            onClick={handleSaveAndExit}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-green-600 hover:bg-green-700 whitespace-nowrap"
          >
            {isSaving && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            )}
            {saveButtonText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default UnsavedChangesModal