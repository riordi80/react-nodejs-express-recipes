import React, { useState, useRef, useEffect } from 'react';
import { 
  FaUser, 
  FaTachometerAlt, 
  FaCog, 
  FaUsers, 
  FaShieldAlt, 
  FaDatabase,
  FaChevronDown 
} from 'react-icons/fa';
import ProfileSection from './components/ProfileSection';
import DashboardSection from './components/DashboardSection';
import SystemSection from './components/SystemSection';
import UsersSection from './components/UsersSection';
import SecuritySection from './components/SecuritySection';
import DataSection from './components/DataSection';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: FaUser },
    { id: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt },
    { id: 'system', label: 'Sistema', icon: FaCog },
    { id: 'users', label: 'Usuarios', icon: FaUsers },
    { id: 'security', label: 'Seguridad', icon: FaShieldAlt },
    { id: 'data', label: 'Datos', icon: FaDatabase },
  ];

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
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsDropdownOpen(false); // Cerrar dropdown al seleccionar
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection />;
      case 'dashboard':
        return <DashboardSection />;
      case 'system':
        return <SystemSection />;
      case 'users':
        return <UsersSection />;
      case 'security':
        return <SecuritySection />;
      case 'data':
        return <DataSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Configuración</h1>
        <p>Gestiona las preferencias de tu aplicación</p>
      </div>

      <div className="settings-content">
        <div className="settings-tabs">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <IconComponent className="tab-icon" />
                <span className="tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Dropdown para móvil */}
        <div className="settings-mobile-dropdown" ref={dropdownRef}>
          <button className="mobile-dropdown-trigger" onClick={toggleDropdown}>
            {(() => {
              const activeTabData = tabs.find(tab => tab.id === activeTab);
              const IconComponent = activeTabData?.icon;
              return (
                <>
                  <IconComponent className="mobile-dropdown-icon" />
                  <span className="mobile-dropdown-label">{activeTabData?.label}</span>
                  <FaChevronDown className={`mobile-dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                </>
              );
            })()}
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
                  <IconComponent className="mobile-dropdown-item-icon" />
                  <span className="mobile-dropdown-item-label">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="settings-panel">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;