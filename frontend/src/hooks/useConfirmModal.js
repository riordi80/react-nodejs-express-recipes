import { useState } from 'react';

/**
 * Hook reutilizable para gestionar modales de confirmación
 * @param {Object} options - Configuraciones del hook
 * @param {Function} options.onConfirm - Callback ejecutado tras confirmación
 * @param {Function} options.onCancel - Callback ejecutado al cancelar (opcional)
 * @param {string} options.title - Título de la modal
 * @param {string} options.message - Mensaje de confirmación
 * @param {string} options.confirmText - Texto del botón de confirmación
 * @param {string} options.cancelText - Texto del botón de cancelar
 * @returns {Object} Estado y funciones del modal de confirmación
 */
export const useConfirmModal = ({
  onConfirm = () => {},
  onCancel = () => {},
  title = 'Confirmar Acción',
  message = '¿Estás seguro de que quieres continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
} = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Abre el modal de confirmación
   */
  const openModal = () => {
    setIsOpen(true);
  };

  /**
   * Cierra el modal y resetea el estado
   */
  const closeModal = () => {
    setIsOpen(false);
    setIsLoading(false);
  };

  /**
   * Ejecuta la confirmación
   */
  const handleConfirm = async () => {
    setIsLoading(true);
    
    try {
      await onConfirm();
      closeModal();
    } catch (error) {
      console.error('Error en confirmación:', error);
      setIsLoading(false);
    }
  };

  /**
   * Ejecuta la cancelación
   */
  const handleCancel = () => {
    onCancel();
    closeModal();
  };

  return {
    // Estado del modal
    isOpen,
    isLoading,
    title,
    message,
    confirmText,
    cancelText,
    
    // Acciones
    openModal,
    closeModal,
    handleConfirm,
    handleCancel
  };
};