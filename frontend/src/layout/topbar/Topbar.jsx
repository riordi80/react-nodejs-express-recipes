import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaCog, FaUser, FaAlignJustify } from 'react-icons/fa';
import { useSidebar } from '../../context/SidebarContext';
import Logo from '../../components/logo/Logo';
import './Topbar.css'; // Importamos los estilos para el topbar

const Topbar = () => {
  const { toggleMobileMenu, isMobileMenuOpen } = useSidebar();

  return (
    <div className="topbar">
      <div className="topbar-left">
        <NavLink to="/dashboard" className="logo-container">
          <Logo className="logo-image" />
        </NavLink>
      </div>
      <div className="topbar-actions">
        <NavLink to="/settings" className="config-button" title="Configuración">
          <FaCog />
        </NavLink>
        <button 
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          title="Mostrar/Ocultar menú"
        >
          <FaAlignJustify />
        </button>
      </div>
    </div>
  );
};

export default Topbar;
