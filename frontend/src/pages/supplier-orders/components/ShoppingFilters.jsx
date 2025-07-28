// src/pages/supplier-orders/components/ShoppingFilters.jsx
import React from 'react';

const ShoppingFilters = ({ 
  filters, 
  onFiltersChange, 
  showEventSelection, 
  showManualOrder 
}) => {
  const updateFilter = (field, value) => {
    onFiltersChange(prev => ({ ...prev, [field]: value }));
  };

  if (showManualOrder) {
    return null; // No mostrar filtros en modo manual
  }

  return (
    <div className="shopping-filters">
      <div className={`filters-grid ${showEventSelection ? 'filters-grid-compact' : ''}`}>
        <div className="filter-group">
          <label className="toggle-label">
            <span className="toggle-text">
              <input
                type="checkbox"
                checked={filters.includeStock}
                onChange={(e) => updateFilter('includeStock', e.target.checked)}
              />
              Descontar stock actual
            </span>
            <small>Solo mostrar lo que necesitas comprar</small>
          </label>
        </div>

        {!showEventSelection && (
          <>
            <div className="filter-group">
              <label className="toggle-label">
                <span className="toggle-text">
                  <input
                    type="checkbox"
                    checked={filters.includeConfirmed}
                    onChange={(e) => updateFilter('includeConfirmed', e.target.checked)}
                  />
                  Eventos confirmados
                </span>
                <small>Incluir eventos con estado "confirmado"</small>
              </label>
            </div>

            <div className="filter-group">
              <label className="toggle-label">
                <span className="toggle-text">
                  <input
                    type="checkbox"
                    checked={filters.includePlanned}
                    onChange={(e) => updateFilter('includePlanned', e.target.checked)}
                  />
                  Eventos planificados
                </span>
                <small>Incluir eventos con estado "planificado"</small>
              </label>
            </div>
          </>
        )}

        <div className="filter-group">
          <label className="select-label">
            <span>
              Período de tiempo
            </span>
            <select
              value={filters.days}
              onChange={(e) => updateFilter('days', parseInt(e.target.value))}
              className="days-select"
            >
              <option value={7}>Próximos 7 días</option>
              <option value={15}>Próximos 15 días</option>
              <option value={30}>Próximos 30 días</option>
              <option value={60}>Próximos 60 días</option>
            </select>
            <small>
              {showEventSelection 
                ? 'Filtrar eventos mostrados en la selección' 
                : 'Rango de fechas para buscar eventos'
              }
            </small>
          </label>
        </div>
      </div>
    </div>
  );
};

export default ShoppingFilters;