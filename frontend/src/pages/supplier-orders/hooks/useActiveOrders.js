// src/pages/supplier-orders/hooks/useActiveOrders.js
import { useState, useEffect } from 'react';
import api from '../../../api/axios';

export const useActiveOrders = () => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [activeOrdersLoading, setActiveOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [activeOrdersFilters, setActiveOrdersFilters] = useState({
    status: {
      pending: true,
      ordered: true,
      delivered: true,
      cancelled: false
    },
    dateFrom: '',
    dateTo: '',
    search: '',
    amountMin: '',
    amountMax: ''
  });

  // Cargar pedidos activos con filtros
  const loadActiveOrders = async () => {
    try {
      setActiveOrdersLoading(true);
      
      // Construir parámetros de filtro solo si tienen valores
      const params = new URLSearchParams();
      
      // Filtros de estado - solo enviar si no están todos activos
      const activeStatuses = Object.entries(activeOrdersFilters.status)
        .filter(([_, isActive]) => isActive)
        .map(([status, _]) => status);
      
      if (activeStatuses.length > 0 && activeStatuses.length < 4) {
        params.append('status', activeStatuses.join(','));
      }
      
      // Filtros de fecha
      if (activeOrdersFilters.dateFrom) {
        params.append('dateFrom', activeOrdersFilters.dateFrom);
      }
      if (activeOrdersFilters.dateTo) {
        params.append('dateTo', activeOrdersFilters.dateTo);
      }
      
      // Búsqueda de texto
      if (activeOrdersFilters.search.trim()) {
        params.append('search', activeOrdersFilters.search.trim());
      }
      
      // Filtros de importe
      if (activeOrdersFilters.amountMin) {
        params.append('amountMin', activeOrdersFilters.amountMin);
      }
      if (activeOrdersFilters.amountMax) {
        params.append('amountMax', activeOrdersFilters.amountMax);
      }
      
      const queryString = params.toString();
      const url = queryString ? `/supplier-orders/active?${queryString}` : '/supplier-orders/active';
      
      const response = await api.get(url);
      setActiveOrders(response.data);
      setActiveOrdersLoading(false);
    } catch (error) {
      console.error('Error loading active orders:', error);
      setActiveOrdersLoading(false);
    }
  };

  // Cargar detalle de pedido
  const loadOrderDetail = async (orderId) => {
    try {
      const response = await api.get(`/supplier-orders/${orderId}`);
      setSelectedOrder(response.data);
      return response.data;
    } catch (error) {
      console.error('Error loading order detail:', error);
      return null;
    }
  };

  // Actualizar estado de pedido
  const updateOrderStatus = async (orderId, newStatus, notes = '') => {
    try {
      await api.put(`/supplier-orders/${orderId}/status`, {
        status: newStatus,
        notes: notes
      });
      
      // Recargar pedidos activos
      await loadActiveOrders();
      
      // Si es el pedido seleccionado, actualizar también el detalle
      if (selectedOrder && selectedOrder.order_id === orderId) {
        await loadOrderDetail(orderId);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating order status:', error);
      return false;
    }
  };

  // Abrir modal de eliminación
  const openDeleteModal = (order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  // Función para mostrar mensajes
  const notify = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  // Cerrar modal de eliminación
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  // Confirmar eliminación del pedido
  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return false;

    try {
      await api.delete(`/supplier-orders/${orderToDelete.order_id}`);
      await loadActiveOrders();
      
      // Limpiar pedido seleccionado si coincide
      if (selectedOrder && selectedOrder.order_id === orderToDelete.order_id) {
        setSelectedOrder(null);
      }
      
      // Mostrar mensaje de confirmación con el número del pedido
      notify(`Pedido #${orderToDelete.order_id} eliminado correctamente`, 'success');
      
      closeDeleteModal();
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      notify(`Error al eliminar el pedido #${orderToDelete.order_id}`, 'error');
      return false;
    }
  };

  // Función legacy para mantener compatibilidad (será reemplazada)
  const deleteOrder = (order) => {
    openDeleteModal(order);
  };

  // Efecto para recargar pedidos cuando cambian los filtros
  useEffect(() => {
    loadActiveOrders();
  }, [activeOrdersFilters]);

  return {
    // State
    activeOrders,
    activeOrdersLoading,
    selectedOrder,
    activeOrdersFilters,
    isDeleteModalOpen,
    orderToDelete,
    message,
    messageType,
    
    // Setters
    setActiveOrdersFilters,
    setSelectedOrder,
    
    // Actions
    loadActiveOrders,
    loadOrderDetail,
    updateOrderStatus,
    deleteOrder,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteOrder,
    notify
  };
};