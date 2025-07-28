// src/pages/supplier-orders/components/ActiveOrdersSection.jsx
import React, { useState, useEffect } from 'react';
import { FaTruck } from 'react-icons/fa';
import OrdersFilterPanel from './OrdersFilterPanel';
import OrdersTable from './OrdersTable';
import OrdersCardView from './OrdersCardView';
import api from '../../../api/axios';

const ActiveOrdersSection = ({ 
  onOrderClick, 
  onUpdateOrderStatus, 
  onDeleteOrder 
}) => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [activeOrdersLoading, setActiveOrdersLoading] = useState(false);
  const [ordersViewMode, setOrdersViewMode] = useState('cards'); // 'cards' o 'table'
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

  // Efecto para recargar pedidos cuando cambian los filtros
  useEffect(() => {
    loadActiveOrders();
  }, [activeOrdersFilters]);

  // Función para manejar vista de pedido
  const handleViewOrder = async (orderId) => {
    await onOrderClick(orderId);
  };

  // Actualizar estado de pedido
  const handleUpdateOrderStatus = async (orderId, newStatus, notes = '') => {
    await onUpdateOrderStatus(orderId, newStatus, notes);
    // Recargar pedidos después de actualizar
    await loadActiveOrders();
  };

  // Eliminar pedido
  const handleDeleteOrder = async (orderId) => {
    await onDeleteOrder(orderId);
    // Recargar pedidos después de eliminar
    await loadActiveOrders();
  };

  return (
    <div className="active-orders-section">
      {/* Header consistente */}
      <div className="section-header">
        <h2 className="section-title">
          <FaTruck />
          Pedidos Activos
        </h2>
      </div>

      {/* Filtros consistentes */}
      <OrdersFilterPanel 
        filters={activeOrdersFilters}
        onFiltersChange={setActiveOrdersFilters}
        viewMode={ordersViewMode}
        onViewModeChange={setOrdersViewMode}
      />

      {/* Vista según el modo seleccionado */}
      {ordersViewMode === 'table' ? (
        <OrdersTable
          orders={activeOrders}
          loading={activeOrdersLoading}
          onViewOrder={handleViewOrder}
        />
      ) : (
        <OrdersCardView
          orders={activeOrders}
          loading={activeOrdersLoading}
          onViewOrder={handleViewOrder}
          onUpdateStatus={handleUpdateOrderStatus}
          onDeleteOrder={handleDeleteOrder}
        />
      )}
    </div>
  );
};

export default ActiveOrdersSection;