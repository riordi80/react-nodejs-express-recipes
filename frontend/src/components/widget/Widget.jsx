import React, { useState, useEffect } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Loading from '../loading';
import './Widget.css';

const Widget = ({
  icon: IconComponent,
  title,
  count = 0,
  type = 'default', // 'critical', 'warning', 'seasonal', 'info', 'default'
  loading = false,
  expanded = false,
  onToggle,
  collapsible = true,
  emptyMessage = 'No hay elementos',
  children
}) => {
  const [internalExpanded, setInternalExpanded] = useState(expanded);
  
  // Actualizar el estado interno cuando cambie la prop expanded
  useEffect(() => {
    setInternalExpanded(expanded);
  }, [expanded]);
  
  // Usar estado interno si no se proporciona onToggle (modo no controlado)
  const isExpanded = onToggle ? expanded : internalExpanded;
  
  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <div className={`widget-card ${type}`}>
      <div 
        className={`widget-header ${collapsible ? 'clickable' : ''}`}
        onClick={collapsible ? handleToggle : undefined}
      >
        <div className="widget-header-left">
          {IconComponent && <IconComponent className={`widget-icon ${type}`} />}
          <h3>{title}</h3>
          {count !== null && <span className="widget-count">{count}</span>}
        </div>
        {collapsible && (
          <div className="widget-toggle">
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </div>
        )}
      </div>
      
      {(isExpanded || !collapsible) && (
        <div className="widget-content">
          {loading ? (
            <Loading message="Cargando..." size="small" inline />
          ) : React.Children.count(children) > 0 ? (
            children
          ) : (
            <div className="widget-empty">{emptyMessage}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default Widget;