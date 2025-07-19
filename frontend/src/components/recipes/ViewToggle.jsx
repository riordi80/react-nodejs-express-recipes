// src/components/recipes/ViewToggle.jsx
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import './ViewToggle.css';

export default function ViewToggle({ view, onChange }) {
  const inputRef = useRef(null);

  const handleChange = () => {
    const newView = view === 'list' ? 'card' : 'list';
    onChange(newView);
    
    // Quitar focus después del click para evitar el contorno azul persistente
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }, 100);
  };

  return (
    <div className="view-toggle-switch">
      <label className="switch">
        <input
          ref={inputRef}
          type="checkbox"
          checked={view === 'card'}
          onChange={handleChange}
        />
        <span className="slider" />
      </label>
      <span className="switch-label">{view === 'list' ? 'Lista' : 'Tarjetas'}</span>
    </div>
  );
}

ViewToggle.propTypes = {
  view: PropTypes.oneOf(['list','card']).isRequired,
  onChange: PropTypes.func.isRequired,
};
