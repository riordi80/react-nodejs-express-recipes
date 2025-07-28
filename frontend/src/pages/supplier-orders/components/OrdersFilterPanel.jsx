// src/pages/supplier-orders/components/OrdersFilterPanel.jsx
import React from 'react';
import { FaTh, FaTable } from 'react-icons/fa';
import MultiSelectDropdown from '../../../components/multi-select-dropdown';

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

const OrdersFilterPanel = ({ filters, onFiltersChange, viewMode, onViewModeChange }) => {
  const updateFilter = (field, value) => {
    onFiltersChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Preparar opciones para el dropdown de estados
  const statusOptions = Object.keys(filters.status).map(status => {
    const statusData = getStatusStyle(status);
    return {
      value: status,
      label: statusData.label,
      icon: statusData.icon
    };
  });

  // Obtener estados seleccionados
  const selectedStatuses = Object.entries(filters.status)
    .filter(([_, isActive]) => isActive)
    .map(([status, _]) => status);

  // Manejar cambios en el dropdown de estados
  const handleStatusChange = (selectedValues) => {
    const newStatusFilter = {};
    Object.keys(filters.status).forEach(status => {
      newStatusFilter[status] = selectedValues.includes(status);
    });
    
    onFiltersChange(prev => ({
      ...prev,
      status: newStatusFilter
    }));
  };

  // Renderizar contador personalizado para estados
  const renderStatusCount = (selectedValues) => {
    if (selectedValues.length === 0) {
      return "Todos los estados";
    }
    if (selectedValues.length === 1) {
      const status = statusOptions.find(opt => opt.value === selectedValues[0]);
      return `${status.icon} ${status.label}`;
    }
    return `${selectedValues.length} estados seleccionados`;
  };

  return (
    <div className="orders-filters">
      <div className="filters-grid">
        {/* Filtros de estado con dropdown */}
        <div className="filter-group">
          <label>Estados:</label>
          <MultiSelectDropdown
            options={statusOptions}
            selectedValues={selectedStatuses}
            onChange={handleStatusChange}
            placeholder="Seleccionar estados..."
            renderSelectedCount={renderStatusCount}
            className="status-dropdown"
          />
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

      {/* Toggle de vista - solo visible en móvil */}
      {viewMode && onViewModeChange && (
        <div className="mobile-view-toggle">
          <label>Vista:</label>
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => onViewModeChange('cards')}
            >
              <FaTh />
              Cards
            </button>
            <button
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => onViewModeChange('table')}
            >
              <FaTable />
              Tabla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersFilterPanel;