// src/pages/supplier-orders/components/OrdersFilterPanel.jsx
import React from 'react';

const getStatusStyle = (status) => {
  switch (status) {
    case 'pending':
      return { className: 'status-pending', label: 'Pendiente', icon: '📝' };
    case 'ordered':
      return { className: 'status-ordered', label: 'Enviado', icon: '📤' };
    case 'delivered':
      return { className: 'status-delivered', label: 'Entregado', icon: '✅' };
    case 'cancelled':
      return { className: 'status-cancelled', label: 'Cancelado', icon: '❌' };
    default:
      return { className: 'status-unknown', label: status, icon: '❓' };
  }
};

const OrdersFilterPanel = ({ filters, onFiltersChange }) => {
  const updateFilter = (field, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateStatusFilter = (status, isActive) => {
    onFiltersChange(prev => ({
      ...prev,
      status: {
        ...prev.status,
        [status]: isActive
      }
    }));
  };

  return (
    <div className="orders-filters">
      <div className="filters-grid">
        {/* Filtros de estado */}
        <div className="filter-group">
          <label>Estados:</label>
          <div className="status-filters">
            {Object.entries(filters.status).map(([status, isActive]) => (
              <label key={status} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => updateStatusFilter(status, e.target.checked)}
                />
                {getStatusStyle(status).label}
              </label>
            ))}
          </div>
        </div>

        {/* Búsqueda */}
        <div className="filter-group">
          <label>Buscar:</label>
          <input
            type="text"
            placeholder="Nº pedido o proveedor..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="input-field"
          />
        </div>

        {/* Fechas */}
        <div className="filter-group">
          <label>Desde:</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
            className="input-field"
          />
        </div>

        <div className="filter-group">
          <label>Hasta:</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
            className="input-field"
          />
        </div>
      </div>
    </div>
  );
};

export default OrdersFilterPanel;