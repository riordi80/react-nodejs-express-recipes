// src/components/PageHeader/PageHeader.jsx
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaPlus, FaFilter, FaTimes } from 'react-icons/fa';
import './PageHeader.css';

export default function PageHeader({
  title,
  subtitle,
  // Search functionality
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  showSearch = true,
  autoFocusSearch = false,
  
  // Simple filters (select dropdowns)
  filters = [],
  
  // Complex filters (custom components like FilterBar)
  customFilters,
  
  // Add button
  onAdd,
  addButtonText = 'Añadir',
  
  // Additional actions
  actions,
  
  // Layout options
  layout = 'standard', // 'standard', 'compact', 'mobile-modal'
  
  // Mobile filter modal
  enableMobileModal = true,
  
  // Messages
  message,
  messageType = 'success',
  
  // Children (custom content between title and header)
  children
}) {
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const searchInputRef = useRef(null);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto-enfocar el input de búsqueda si está habilitado
  useEffect(() => {
    if (autoFocusSearch && searchInputRef.current && !isMobile && showSearch && onSearchChange) {
      // Solo enfocar en desktop para evitar problemas con teclado móvil
      searchInputRef.current.focus();
    }
  }, [autoFocusSearch, isMobile, showSearch, onSearchChange]);
  
  // Count active filters for mobile badge
  const activeFiltersCount = filters.filter(filter => {
    if (Array.isArray(filter.value)) {
      return filter.value.length > 0;
    }
    return filter.value && filter.value !== '' && filter.value !== 'all';
  }).length;

  // Render simple filter
  const renderFilter = (filter) => (
    <select
      key={filter.key}
      className="page-header-select"
      value={filter.value}
      onChange={(e) => filter.onChange(e.target.value)}
      title={filter.label}
    >
      {filter.options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  // Mobile filters modal content
  const renderMobileFiltersModal = () => (
    <div className="page-header-mobile-modal">
      <div className="page-header-mobile-modal-content">
        <div className="page-header-mobile-modal-header">
          <h3>Filtros</h3>
          <button 
            className="page-header-modal-close"
            onClick={() => setIsMobileFiltersOpen(false)}
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="page-header-mobile-modal-body">
          {/* Simple filters in mobile modal */}
          {filters.map(filter => (
            <div key={filter.key} className="page-header-mobile-filter">
              <label>{filter.label}</label>
              {renderFilter(filter)}
            </div>
          ))}
          
          {/* Custom filters in mobile modal */}
          {customFilters && (
            <div className="page-header-mobile-custom-filters">
              {customFilters}
            </div>
          )}
        </div>
        
        <div className="page-header-mobile-modal-footer">
          <button 
            type="button" 
            className="btn cancel" 
            onClick={() => {
              // Clear all filters
              filters.forEach(filter => {
                if (Array.isArray(filter.value)) {
                  filter.onChange([]);
                } else {
                  filter.onChange('');
                }
              });
              setIsMobileFiltersOpen(false);
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`page-header page-header-${layout}`}>
      {/* Title */}
      <div className="page-header-title-section">
        <div className="page-header-title-row">
          <h1 className="page-header-title">{title}</h1>
          {/* Actions in title row (for mobile ViewToggle) */}
          {actions && (
            <div className="page-header-title-actions">
              {actions}
            </div>
          )}
        </div>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="page-header-subtitle">{subtitle}</p>
        )}
        
        {/* Messages */}
        {message && (
          <div className={`page-header-message page-header-message-${messageType}`}>
            {message}
          </div>
        )}
      </div>

      {/* Children (custom content between title and controls) */}
      {children && (
        <div className="page-header-children">
          {children}
        </div>
      )}

      {/* Custom filters (complex filters like FilterBar) */}
      {customFilters && (
        <div className="page-header-custom-filters">
          {customFilters}
        </div>
      )}

      {/* Main header controls */}
      <div className="page-header-controls">
        {/* Desktop layout */}
        <div className="page-header-desktop">
          {/* Search */}
          {showSearch && onSearchChange && (
            <input
              ref={searchInputRef}
              type="text"
              className="page-header-input page-header-search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          )}
          
          {/* Simple filters */}
          {filters.map(renderFilter)}
          
          {/* Additional actions - Removed to avoid duplicate ViewToggle */}
          
          {/* Add button */}
          {onAdd && (
            <button className="btn add page-header-add-btn" onClick={onAdd}>
              <FaPlus className="btn-icon" />
              {addButtonText}
            </button>
          )}
        </div>

        {/* Mobile layout */}
        <div className="page-header-mobile">
          {/* Search (always visible on mobile if enabled - consistent with Recipes page) */}
          {showSearch && onSearchChange && (
            <input
              type="text"
              className="page-header-input page-header-search"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          )}
          
          <div className="page-header-mobile-actions">
            {/* Filter button (only if we have filters and mobile modal is enabled) */}
            {(filters.length > 0 || customFilters) && enableMobileModal && (
              <button 
                className={`page-header-filter-btn ${activeFiltersCount > 0 ? 'active' : ''}`}
                onClick={() => setIsMobileFiltersOpen(true)}
              >
                <FaFilter />
                <span>Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="page-header-filter-badge">{activeFiltersCount}</span>
                )}
              </button>
            )}
            
            {/* Additional actions - Removed to avoid duplicate ViewToggle */}
            
            {/* Add button */}
            {onAdd && (
              <button className="btn add page-header-add-btn" onClick={onAdd}>
                <FaPlus className="btn-icon" />
                {layout === 'compact' ? '' : addButtonText}
              </button>
            )}
          </div>

          {/* Mobile filters (inline) - when modal is disabled */}
          {!enableMobileModal && filters.length > 0 && (
            <div className="page-header-mobile-filters-inline">
              {filters.map(renderFilter)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters modal */}
      {isMobileFiltersOpen && enableMobileModal && renderMobileFiltersModal()}
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  
  // Search
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  showSearch: PropTypes.bool,
  autoFocusSearch: PropTypes.bool,
  
  // Simple filters
  filters: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    options: PropTypes.arrayOf(PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })).isRequired,
    onChange: PropTypes.func.isRequired
  })),
  
  // Complex filters
  customFilters: PropTypes.node,
  
  // Add functionality
  onAdd: PropTypes.func,
  addButtonText: PropTypes.string,
  
  // Additional actions
  actions: PropTypes.node,
  
  // Layout
  layout: PropTypes.oneOf(['standard', 'compact', 'mobile-modal']),
  enableMobileModal: PropTypes.bool,
  
  // Messages
  message: PropTypes.string,
  messageType: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  
  // Children
  children: PropTypes.node
};