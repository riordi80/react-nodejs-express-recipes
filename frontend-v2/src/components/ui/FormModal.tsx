'use client'

import React from 'react'
import { Save, X } from 'lucide-react'
import Modal from './Modal'

interface FormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  title: string
  children: React.ReactNode
  submitText?: string
  cancelText?: string
  loading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  submitDisabled?: boolean
}

const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Guardar',
  cancelText = 'Cancelar',
  loading = false,
  size = 'md',
  submitDisabled = false
}: FormModalProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(e)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      size={size}
      closeOnOverlay={!loading}
    >
      <form onSubmit={handleSubmit}>
        {/* Form Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="submit"
            disabled={loading || submitDisabled}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {submitText}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default FormModal