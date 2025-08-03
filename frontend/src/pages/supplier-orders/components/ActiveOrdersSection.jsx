// src/pages/supplier-orders/components/ActiveOrdersSection.jsx
import React, { useState } from 'react';
import { FaTruck } from 'react-icons/fa';
import OrdersFilterPanel from './OrdersFilterPanel';
import OrdersTable from './OrdersTable';
import OrdersCardView from './OrdersCardView';

const ActiveOrdersSection = ({ 
  onOrderClick, 
  onUpdateOrderStatus, 
  onDeleteOrder,
  activeOrders,
  activeOrdersLoading,
  activeOrdersFilters,
  setActiveOrdersFilters,
  message,
  messageType
}) => {
  const [ordersViewMode, setOrdersViewMode] = useState('cards'); // 'cards' o 'table'

  // Los datos ahora vienen del hook principal

  // Función para manejar vista de pedido
  const handleViewOrder = async (orderId) => {
    await onOrderClick(orderId);
  };

  // Actualizar estado de pedido
  const handleUpdateOrderStatus = async (orderId, newStatus, notes = '') => {
    await onUpdateOrderStatus(orderId, newStatus, notes);
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

      {/* Mensaje de confirmación */}
      {message && (
        <div className={`page-header-message page-header-message-${messageType}`}>
          {message}
        </div>
      )}

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
          onDeleteOrder={onDeleteOrder}
        />
      )}
    </div>
  );
};

export default ActiveOrdersSection;