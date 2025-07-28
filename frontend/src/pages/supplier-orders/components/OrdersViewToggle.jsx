// src/pages/supplier-orders/components/OrdersViewToggle.jsx
import React from 'react';
import { FaTh, FaTable } from 'react-icons/fa';

const OrdersViewToggle = ({ viewMode, onViewModeChange }) => {
  return (
    <div className="view-toggle">
      <button
        className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
        onClick={() => onViewModeChange('cards')}
      >
        <FaTh /> Cards
      </button>
      <button
        className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
        onClick={() => onViewModeChange('table')}
      >
        <FaTable /> Tabla
      </button>
    </div>
  );
};

export default OrdersViewToggle;