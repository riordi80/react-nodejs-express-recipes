// src/components/view-toggle/ViewToggle.jsx
import React from 'react';
import './ViewToggle.css';

const ViewToggle = ({ options, value, onChange, className = '' }) => {
  return (
    <div className={`view-toggle ${className}`}>
      {options.map((option) => {
        const IconComponent = option.icon;
        return (
          <button
            key={option.value}
            className={`toggle-btn ${value === option.value ? 'active' : ''}`}
            onClick={() => onChange(option.value)}
            title={option.label}
          >
            {IconComponent && <IconComponent />}
            <span className="toggle-label">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewToggle;