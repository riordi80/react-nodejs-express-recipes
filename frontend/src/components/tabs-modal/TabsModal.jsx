// src/components/tabs-modal/TabsModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaChevronDown } from 'react-icons/fa';
import './TabsModal.css';

const TabsModal = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  children,
  className = '',
  mobileDropdownRef 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const internalDropdownRef = useRef(null);
  const dropdownRef = mobileDropdownRef || internalDropdownRef;

  // Efecto para cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const handleTabChange = (tabId) => {
    onTabChange(tabId);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={`tabs-modal-container ${className}`}>
      {/* Pestañas para desktop */}
      <div className="modal-tabs">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button 
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              <IconComponent className="tab-icon" />
              <span className="tab-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Dropdown para móvil */}
      <div className="modal-mobile-dropdown" ref={dropdownRef}>
        <button className="mobile-dropdown-trigger" onClick={toggleDropdown}>
          <div className="mobile-dropdown-icon">
            {activeTabData?.icon && <activeTabData.icon />}
          </div>
          <span className="mobile-dropdown-label">{activeTabData?.label}</span>
          <div className={`mobile-dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>
            <FaChevronDown />
          </div>
        </button>
        
        <div className={`mobile-dropdown-menu ${isDropdownOpen ? 'open' : ''}`}>
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`mobile-dropdown-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <div className="mobile-dropdown-item-icon">
                  <IconComponent />
                </div>
                <span className="mobile-dropdown-item-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido de las pestañas */}
      <div className="tab-content">
        {children}
      </div>
    </div>
  );
};

TabsModal.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired
  })).isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  mobileDropdownRef: PropTypes.object
};

export default TabsModal;