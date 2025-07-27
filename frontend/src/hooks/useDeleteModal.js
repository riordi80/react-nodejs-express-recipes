import { useState } from 'react';
import api from '../api/axios';

/**
 * Hook reutilizable para gestionar modales de eliminación
 * @param {Object} options - Configuraciones del hook
 * @param {string} options.endpoint - Endpoint base para la eliminación (ej: '/suppliers')
 * @param {string} options.idField - Campo que contiene el ID del item (ej: 'supplier_id')
 * @param {Function} options.onSuccess - Callback ejecutado tras eliminación exitosa
 * @param {Function} options.onError - Callback ejecutado en caso de error
 * @param {string} options.successMessage - Mensaje de éxito personalizado
 * @param {string} options.errorMessage - Mensaje de error personalizado
 * @returns {Object} Estado y funciones del modal de eliminación
 */
export const useDeleteModal = ({
  endpoint,
  idField = 'id',
  onSuccess = () => {},
  onError = () => {},
  successMessage = 'Elemento eliminado correctamente',
  errorMessage = 'Error al eliminar'
} = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Abre el modal de eliminación con el item especificado
   * @param {Object} item - Item a eliminar
   */
  const openModal = (item) => {
    setCurrentItem(item);
    setIsOpen(true);
  };

  /**
   * Cierra el modal y resetea el estado
   */
  const closeModal = () => {
    setIsOpen(false);
    setCurrentItem(null);
    setIsLoading(false);
  };

  /**
   * Ejecuta la eliminación del item actual
   */
  const handleDelete = async () => {
    if (!currentItem || !endpoint) return;

    setIsLoading(true);
    
    try {
      const itemId = currentItem[idField];
      await api.delete(`${endpoint}/${itemId}`);
      
      // Cerrar modal antes de ejecutar callbacks
      closeModal();
      
      // Ejecutar callback de éxito
      await onSuccess(currentItem, successMessage);
      
    } catch (error) {
      setIsLoading(false);
      console.error('Error deleting item:', error);
      
      // Ejecutar callback de error
      onError(error, errorMessage);
    }
  };

  return {
    // Estado del modal
    isOpen,
    currentItem,
    isLoading,
    
    // Acciones
    openModal,
    closeModal,
    handleDelete
  };
};