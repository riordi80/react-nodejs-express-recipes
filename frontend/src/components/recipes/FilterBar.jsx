import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
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
  onAllergensChange
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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

  return (
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
        <option value="">Todas las categorías</option>
        {categoryOptions.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <select
        className="filter-select"
        value={selectedPrepTime || ''}
        onChange={e => onPrepTimeChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">Cualquier tiempo</option>
        {prepTimeOptions.map(t => (
          <option key={t} value={t}>{t} min</option>
        ))}
      </select>

      <select
        className="filter-select"
        value={selectedDifficulty}
        onChange={e => onDifficultyChange(e.target.value)}
      >
        <option value="">Cualquier dificultad</option>
        {difficultyOptions.map(d => (
          <option key={d.value || d} value={d.value || d}>{d.label || d}</option>
        ))}
      </select>

      <select
        className="filter-select"
        value={selectedIngredient}
        onChange={e => onIngredientChange(e.target.value)}
      >
        <option value="">Cualquier ingrediente</option>
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
};
