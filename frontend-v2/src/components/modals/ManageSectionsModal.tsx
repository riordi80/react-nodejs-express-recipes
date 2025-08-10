'use client'

import { useState } from 'react'
import { Plus, Edit3, Trash2, Save, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Section {
  section_id: number
  name: string
}

interface ManageSectionsModalProps {
  isOpen: boolean
  onClose: () => void
  sections: Section[]
  onAddSection: (name: string) => void
  onUpdateSection: (section: Section) => void
  onDeleteSection: (sectionId: number) => void
}

export default function ManageSectionsModal({
  isOpen,
  onClose,
  sections,
  onAddSection,
  onUpdateSection,
  onDeleteSection
}: ManageSectionsModalProps) {
  const [newSectionName, setNewSectionName] = useState('')
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [editSectionName, setEditSectionName] = useState('')
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  const handleAddSection = () => {
    if (!newSectionName.trim()) {
      alert('El nombre de la sección es obligatorio')
      return
    }

    onAddSection(newSectionName.trim())
    setNewSectionName('')
  }

  const handleStartEdit = (section: Section) => {
    setEditingSection(section)
    setEditSectionName(section.name)
  }

  const handleSaveEdit = () => {
    if (!editSectionName.trim()) {
      alert('El nombre de la sección es obligatorio')
      return
    }

    if (editingSection) {
      onUpdateSection({
        ...editingSection,
        name: editSectionName.trim()
      })
      setEditingSection(null)
      setEditSectionName('')
    }
  }

  const handleCancelEdit = () => {
    setEditingSection(null)
    setEditSectionName('')
  }

  const handleDeleteClick = (section: Section) => {
    setSectionToDelete(section)
    setIsDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = () => {
    if (sectionToDelete) {
      onDeleteSection(sectionToDelete.section_id)
      setSectionToDelete(null)
      setIsDeleteConfirmOpen(false)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gestionar secciones de ingredientes"
        size="md"
      >
        <div className="p-6">
          <div className="space-y-6">
            {/* Añadir nueva sección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Sección
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Nombre de la sección..."
                />
                <button
                  onClick={handleAddSection}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir
                </button>
              </div>
            </div>

            {/* Lista de secciones existentes */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Secciones Existentes</h4>
              {sections.length > 0 ? (
                <div className="space-y-2">
                  {sections.map((section) => (
                    <div key={section.section_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      {editingSection?.section_id === section.section_id ? (
                        // Modo edición
                        <div className="flex items-center space-x-2 flex-1">
                          <input
                            type="text"
                            value={editSectionName}
                            onChange={(e) => setEditSectionName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="text-green-600 hover:text-green-800 transition-colors"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        // Modo vista
                        <>
                          <span className="text-sm font-medium text-gray-900">{section.name}</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleStartEdit(section)}
                              className="text-orange-600 hover:text-orange-800 transition-colors"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(section)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay secciones creadas</p>
                  <p className="text-sm">Las secciones te ayudan a organizar los ingredientes de la receta</p>
                </div>
              )}
            </div>
          </div>

          {/* Botones del modal */}
          <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false)
          setSectionToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Eliminar Sección"
        message={`¿Estás seguro de que quieres eliminar la sección "${sectionToDelete?.name}"? Los ingredientes de esta sección no se eliminarán, pero perderán su agrupación.`}
        confirmText="Eliminar"
        type="danger"
      />
    </>
  )
}