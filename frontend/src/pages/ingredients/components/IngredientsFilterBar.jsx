import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaFilter } from 'react-icons/fa';
import Modal from '../../../components/modal/Modal';
import '../../../components/recipes/FilterBar.css'; // Reutilizar los mismos estilos

export default function IngredientsFilterBar({
  searchText,
  onSearchTextChange,

  availabilityOptions,
  selectedAvailability,
  onAvailabilityChange,

  expiryStatusOptions,
  selectedExpiryStatus,
  onExpiryStatusChange,

  stockStatusOptions,
  selectedStockStatus,
  onStockStatusChange,

  seasonOptions,
  selectedSeason,
  onSeasonChange,
}) {
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
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

  // Enfocar automáticamente el input de búsqueda cuando se monta el componente
  useEffect(() => {
    if (searchInputRef.current && !isMobile) {
      // Solo enfocar en desktop para evitar problemas con teclado móvil
      searchInputRef.current.focus();
    }
  }, [isMobile]);

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    onSearchTextChange('');
    onAvailabilityChange('');
    onExpiryStatusChange('');
    onStockStatusChange('');
    onSeasonChange('');
    setIsFilterModalOpen(false);
    // Scroll to top to show all results after clearing filters
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // Función específica para aplicar filtros
  const applyFilters = () => {
    setIsFilterModalOpen(false);
  };

  // Contar filtros activos
  const activeFiltersCount = [
    searchText,
    selectedAvailability,
    selectedExpiryStatus,
    selectedStockStatus,
    selectedSeason
  ].filter(Boolean).length;

  return (
    <>
      {/* Versión Desktop - Reutilizando misma estructura que recipes */}
      {!isMobile && (
        <div className="filter-bar">
          <input
            ref={searchInputRef}
            type="text"
            className="filter-input"
            placeholder="Buscar ingrediente…"
            value={searchText}
            onChange={e => onSearchTextChange(e.target.value)}
          />

          <select
            className="filter-select"
            value={selectedAvailability}
            onChange={e => onAvailabilityChange(e.target.value)}
          >
            {availabilityOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedExpiryStatus}
            onChange={e => onExpiryStatusChange(e.target.value)}
          >
            {expiryStatusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedStockStatus}
            onChange={e => onStockStatusChange(e.target.value)}
          >
            {stockStatusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={selectedSeason}
            onChange={e => onSeasonChange(e.target.value)}
          >
            <option value="">Temporadas</option>
            {seasonOptions.map(season => (
              <option key={season.value} value={season.value}>{season.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Versión Móvil - Igual que recipes */}
      {isMobile && (
        <div className="filter-bar">
          <input
            type="text"
            className="filter-input"
            placeholder="Buscar ingrediente…"
            value={searchText}
            onChange={e => onSearchTextChange(e.target.value)}
          />
          
          <div className="filter-mobile-controls">
            <button
              type="button"
              className={`filter-mobile-button ${activeFiltersCount > 0 ? 'active' : ''}`}
              onClick={() => setIsFilterModalOpen(true)}
              disabled={isApplyingFilters}
            >
              <FaFilter />
              <span>{isApplyingFilters ? 'Aplicando...' : 'Filtros'}</span>
              {activeFiltersCount > 0 && !isApplyingFilters && (
                <span className="filter-count">{activeFiltersCount}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal de filtros - SOLO para móvil */}
      {isMobile && (
        <Modal 
          isOpen={isFilterModalOpen} 
          title="Filtros de ingredientes" 
          onClose={() => setIsFilterModalOpen(false)}
          fullscreenMobile={true}
        >
          <div className="filter-modal-content">
            <div className="filter-section">
              <label className="filter-label">Disponibilidad</label>
              <select
                className="filter-modal-select"
                value={selectedAvailability}
                onChange={e => onAvailabilityChange(e.target.value)}
              >
                {availabilityOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-label">Estado de caducidad</label>
              <select
                className="filter-modal-select"
                value={selectedExpiryStatus}
                onChange={e => onExpiryStatusChange(e.target.value)}
              >
                {expiryStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-label">Estado de stock</label>
              <select
                className="filter-modal-select"
                value={selectedStockStatus}
                onChange={e => onStockStatusChange(e.target.value)}
              >
                {stockStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-section">
              <label className="filter-label">Temporada</label>
              <select
                className="filter-modal-select"
                value={selectedSeason}
                onChange={e => onSeasonChange(e.target.value)}
              >
                <option value="">Todas las temporadas</option>
                {seasonOptions.map(season => (
                  <option key={season.value} value={season.value}>{season.label}</option>
                ))}
              </select>
            </div>

            <div className="filter-modal-actions">
              <button 
                type="button" 
                className="btn cancel" 
                onClick={clearAllFilters}
              >
                Limpiar filtros
              </button>
              <button 
                type="button" 
                className="btn add" 
                onClick={applyFilters}
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

IngredientsFilterBar.propTypes = {
  searchText: PropTypes.string.isRequired,
  onSearchTextChange: PropTypes.func.isRequired,

  availabilityOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  selectedAvailability: PropTypes.string,
  onAvailabilityChange: PropTypes.func.isRequired,

  expiryStatusOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  selectedExpiryStatus: PropTypes.string,
  onExpiryStatusChange: PropTypes.func.isRequired,

  stockStatusOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  selectedStockStatus: PropTypes.string,
  onStockStatusChange: PropTypes.func.isRequired,

  seasonOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  selectedSeason: PropTypes.string,
  onSeasonChange: PropTypes.func.isRequired,
};