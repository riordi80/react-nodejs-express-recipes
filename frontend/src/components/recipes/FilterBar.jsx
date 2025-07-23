import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaFilter } from 'react-icons/fa';
import Modal from '../modal/Modal';
import './FilterBar.css';

export default function FilterBar({
  searchText,
  onSearchTextChange,

  categoryOptions,
  selectedCategory,
  onCategoryChange,

  prepTimeOptions,
  selectedPrepTime,
  onPrepTimeChange,

  difficultyOptions,
  selectedDifficulty,
  onDifficultyChange,

  ingredientOptions,
  selectedIngredient,
  onIngredientChange,

  allergenOptions,
  selectedAllergens,
  onAllergensChange,

  // ViewToggle se renderiza ahora en el título de la página
  // viewToggleComponent (ya no se usa)
}) {
  const [open, setOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef(null);


  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Cerrar al clicar fuera
  useEffect(() => {
    const onClickOutside = e => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const toggleAllergen = al => {
    if (selectedAllergens.includes(al)) {
      onAllergensChange(selectedAllergens.filter(a => a !== al));
    } else {
      onAllergensChange([...selectedAllergens, al]);
    }
  };

  const label = 'Filtrar alérgenos';

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    onSearchTextChange('');
    onCategoryChange('');
    onPrepTimeChange(null);
    onDifficultyChange('');
    onIngredientChange('');
    onAllergensChange([]);
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
    selectedCategory,
    selectedPrepTime,
    selectedDifficulty,
    selectedIngredient,
    selectedAllergens.length > 0 ? 'allergens' : null
  ].filter(Boolean).length;

  return (
    <>
      {/* Versión Desktop - Original - SOLO renderizar en desktop */}
      {!isMobile && (
        <div className="filter-bar">
        <input
          type="text"
          className="filter-input"
          placeholder="Buscar receta…"
          value={searchText}
          onChange={e => onSearchTextChange(e.target.value)}
        />

        <select
          className="filter-select"
          value={selectedCategory}
          onChange={e => onCategoryChange(e.target.value)}
        >
          <option value="">Categorías</option>
          {categoryOptions.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedPrepTime || ''}
          onChange={e => onPrepTimeChange(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">Tiempo</option>
          {prepTimeOptions.map(t => (
            <option key={t} value={t}>{t} min</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedDifficulty}
          onChange={e => onDifficultyChange(e.target.value)}
        >
          <option value="">Dificultad</option>
          {difficultyOptions.map(d => (
            <option key={d.value || d} value={d.value || d}>{d.label || d}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedIngredient}
          onChange={e => onIngredientChange(e.target.value)}
        >
          <option value="">Ingrediente</option>
          {ingredientOptions.map(ing => (
            <option key={ing} value={ing}>{ing}</option>
          ))}
        </select>

        {/* Multiselect alérgenos */}
        <div className={`filter-multiselect ${open ? 'open' : ''}`} ref={ref}>
          <button
            type="button"
            className={`filter-select filter-multiselect-toggle ${selectedAllergens.length > 0 ? 'active' : ''}`}
            onClick={() => setOpen(o => !o)}
          >
            {label}
          </button>
          {open && (
            <div className="filter-multiselect-menu">
              {allergenOptions.map(al => (
                <label key={al} className="filter-multiselect-item">
                  <input
                    type="checkbox"
                    checked={selectedAllergens.includes(al)}
                    onChange={() => toggleAllergen(al)}
                  />
                  {al}
                </label>
              ))}
            </div>
          )}
        </div>
        </div>
      )}

      {/* Versión Móvil - Botón de filtros - SOLO renderizar en móvil */}
      {isMobile && (
        <div className="filter-bar">
          <input
            type="text"
            className="filter-input"
            placeholder="Buscar receta…"
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
          title="Filtros de búsqueda" 
          onClose={() => setIsFilterModalOpen(false)}
          fullscreenMobile={true}
        >
        <div className="filter-modal-content">
          <div className="filter-section">
            <label className="filter-label">Categoría</label>
            <select
              className="filter-modal-select"
              value={selectedCategory}
              onChange={e => onCategoryChange(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              {categoryOptions.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-label">Tiempo de preparación</label>
            <select
              className="filter-modal-select"
              value={selectedPrepTime || ''}
              onChange={e => onPrepTimeChange(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Cualquier tiempo</option>
              {prepTimeOptions.map(t => (
                <option key={t} value={t}>{t} min</option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-label">Dificultad</label>
            <select
              className="filter-modal-select"
              value={selectedDifficulty}
              onChange={e => onDifficultyChange(e.target.value)}
            >
              <option value="">Cualquier dificultad</option>
              {difficultyOptions.map(d => (
                <option key={d.value || d} value={d.value || d}>{d.label || d}</option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-label">Ingrediente</label>
            <select
              className="filter-modal-select"
              value={selectedIngredient}
              onChange={e => onIngredientChange(e.target.value)}
            >
              <option value="">Cualquier ingrediente</option>
              {ingredientOptions.map(ing => (
                <option key={ing} value={ing}>{ing}</option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <label className="filter-label">Alérgenos a evitar</label>
            <div className="filter-allergens-grid">
              {allergenOptions.map(al => (
                <label key={al} className="filter-allergen-item">
                  <input
                    type="checkbox"
                    checked={selectedAllergens.includes(al)}
                    onChange={() => toggleAllergen(al)}
                  />
                  <span>{al}</span>
                </label>
              ))}
            </div>
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

FilterBar.propTypes = {

  searchText: PropTypes.string.isRequired,
  onSearchTextChange: PropTypes.func.isRequired,

  categoryOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedCategory: PropTypes.string,
  onCategoryChange: PropTypes.func.isRequired,

  prepTimeOptions: PropTypes.arrayOf(PropTypes.number).isRequired,
  selectedPrepTime: PropTypes.number,
  onPrepTimeChange: PropTypes.func.isRequired,

  difficultyOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedDifficulty: PropTypes.string,
  onDifficultyChange: PropTypes.func.isRequired,

  ingredientOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedIngredient: PropTypes.string,
  onIngredientChange: PropTypes.func.isRequired,

  allergenOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedAllergens: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAllergensChange: PropTypes.func.isRequired,

  // ViewToggle se renderiza ahora en el título
  // viewToggleComponent: PropTypes.node, (ya no se usa)
};
