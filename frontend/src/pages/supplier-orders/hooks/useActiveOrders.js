// src/pages/supplier-orders/hooks/useActiveOrders.js
import { useState, useEffect } from 'react';
import api from '../../../api/axios';

export const useActiveOrders = () => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [activeOrdersLoading, setActiveOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
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

  // Eliminar pedido
  const deleteOrder = async (orderId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      return false;
    }

    try {
      await api.delete(`/supplier-orders/${orderId}`);
      await loadActiveOrders();
      
      // Limpiar pedido seleccionado si coincide
      if (selectedOrder && selectedOrder.order_id === orderId) {
        setSelectedOrder(null);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
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
    
    // Setters
    setActiveOrdersFilters,
    setSelectedOrder,
    
    // Actions
    loadActiveOrders,
    loadOrderDetail,
    updateOrderStatus,
    deleteOrder
  };
};