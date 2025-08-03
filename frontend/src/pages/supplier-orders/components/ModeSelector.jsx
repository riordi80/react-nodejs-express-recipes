// src/pages/supplier-orders/components/ModeSelector.jsx
import React, { useRef, useEffect } from 'react';
import { FaListUl, FaPlus, FaBoxOpen, FaChevronDown } from 'react-icons/fa';

const ModeSelector = ({ 
  showEventSelection, 
  showManualOrder, 
  onModeChange,
  isModeDropdownOpen,
  setIsModeDropdownOpen
}) => {
  const modeDropdownRef = useRef(null);

  // Efecto para cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target)) {
        setIsModeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [setIsModeDropdownOpen]);

  const toggleModeDropdown = () => {
    setIsModeDropdownOpen(!isModeDropdownOpen);
  };

  // Opciones de modo para el dropdown móvil
  const modeOptions = [
    { 
      id: 'automatic', 
      label: 'Automático por Filtros', 
      icon: FaListUl,
      isActive: !showEventSelection && !showManualOrder,
      onClick: () => onModeChange('automatic')
    },
    { 
      id: 'events', 
      label: 'Seleccionar Eventos Específicos', 
      icon: FaPlus,
      isActive: showEventSelection && !showManualOrder,
      onClick: () => onModeChange('events')
    },
    { 
      id: 'manual', 
      label: 'Pedido Manual', 
      icon: FaBoxOpen,
      isActive: showManualOrder,
      onClick: () => onModeChange('manual')
    }
  ];

  return (
    <div className="selection-mode">
      {/* Desktop Mode Toggle */}
      <div className="mode-toggle">
        <button 
          className={`mode-btn ${!showEventSelection && !showManualOrder ? 'active' : ''}`}
          onClick={() => onModeChange('automatic')}
        >
          <FaListUl /> Automático por Filtros
        </button>
        <button 
          className={`mode-btn ${showEventSelection && !showManualOrder ? 'active' : ''}`}
          onClick={() => onModeChange('events')}
        >
          <FaPlus /> Seleccionar Eventos Específicos
        </button>
        <button 
          className={`mode-btn ${showManualOrder ? 'active' : ''}`}
          onClick={() => onModeChange('manual')}
        >
          <FaBoxOpen /> Pedido Manual
        </button>
      </div>

      {/* Mobile Dropdown */}
      <div className="mode-mobile-dropdown" ref={modeDropdownRef}>
        <button className="mode-mobile-dropdown-trigger" onClick={toggleModeDropdown}>
          {(() => {
            const activeMode = modeOptions.find(mode => mode.isActive);
            const IconComponent = activeMode?.icon || FaListUl;
            return (
              <>
                <IconComponent className="mode-mobile-dropdown-icon" />
                <span className="mode-mobile-dropdown-label">{activeMode?.label || 'Seleccionar Modo'}</span>
                <FaChevronDown className={`mode-mobile-dropdown-arrow ${isModeDropdownOpen ? 'open' : ''}`} />
              </>
            );
          })()}
        </button>
        <div className={`mode-mobile-dropdown-menu ${isModeDropdownOpen ? 'open' : ''}`}>
          {modeOptions.map(mode => {
            const IconComponent = mode.icon;
            return (
              <button
                key={mode.id}
                className={`mode-mobile-dropdown-item ${mode.isActive ? 'active' : ''}`}
                onClick={() => {
                  mode.onClick();
                  setIsModeDropdownOpen(false);
                }}
              >
                <IconComponent className="mode-mobile-dropdown-item-icon" />
                <span className="mode-mobile-dropdown-item-label">{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;