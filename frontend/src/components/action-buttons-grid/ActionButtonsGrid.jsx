// src/components/action-buttons-grid/ActionButtonsGrid.jsx
import React from 'react';
import './ActionButtonsGrid.css';

const ActionButtonsGrid = ({ title, actions, className = '' }) => {
  return (
    <div className={`action-buttons-grid ${className}`}>
      {title && <h3>{title}</h3>}
      <div className="actions-grid">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <button 
              key={index}
              className={`btn ${action.variant || 'primary'}`}
              onClick={action.onClick}
              disabled={action.disabled}
              title={action.title}
            >
              {IconComponent && <IconComponent />}
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActionButtonsGrid;