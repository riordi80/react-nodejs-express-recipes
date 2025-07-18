// src/components/recipes/ViewToggle.jsx
import React from 'react';
import PropTypes from 'prop-types';
import './ViewToggle.css';

export default function ViewToggle({ view, onChange }) {
  return (
    <div className="view-toggle-switch">
      <label className="switch">
        <input
          type="checkbox"
          checked={view === 'card'}
          onChange={() => onChange(view === 'list' ? 'card' : 'list')}
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
