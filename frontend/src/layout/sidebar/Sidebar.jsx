import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';  
import { useAuth } from '../../context/AuthContext';  
import { useSidebar } from '../../context/SidebarContext';
import './Sidebar.css';

// Importamos los iconos que necesitamos
import { FaTachometerAlt, FaTruck, FaSignOutAlt, FaAllergies, FaAlignJustify, FaCog, FaShoppingCart } from 'react-icons/fa';
import { FaBellConcierge, FaBasketShopping, FaCalendar } from "react-icons/fa6";

const Sidebar = () => {
  const { logout } = useAuth();  
  const { isMobileMenuOpen, closeMobileMenu } = useSidebar();
  const [isPinned, setIsPinned] = useState(false);

  const handleLogout = () => {
    logout();  
  };

  const togglePin = () => {
    setIsPinned(!isPinned);
  };

  const handleLinkClick = () => {
    // Cerrar el menú móvil cuando se hace clic en un enlace
    closeMobileMenu();
  };

  // Cerrar el menú móvil cuando se hace clic fuera del sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('#navbar') && !event.target.closest('.mobile-menu-toggle')) {
        closeMobileMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen, closeMobileMenu]);

  return (
    <nav id="navbar" className={`${isPinned ? 'pinned' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <ul className="navbar-items flexbox-col">
        <li className="navbar-item flexbox-left pin-button-container">
          <button className="pin-button navbar-item-inner flexbox-left" onClick={togglePin} title={isPinned ? 'Desfijar menú' : 'Fijar menú'}>
            <div className="navbar-item-inner-icon-wrapper flexbox">
              <FaAlignJustify className="pin-icon" />
            </div>
            <span className="link-text">{isPinned ? 'Ocultar Menú' : 'Fijar Menú'}</span>
          </button>
        </li>
        <li className="navbar-item flexbox-left">
          <NavLink to="/dashboard" className="navbar-item-inner flexbox-left" onClick={handleLinkClick}>
            <div className="navbar-item-inner-icon-wrapper flexbox">
              <FaTachometerAlt />
            </div>
            <span className="link-text">Dashboard</span>
          </NavLink>
        </li>
        <li className="navbar-item flexbox-left">
          <NavLink to="/events" className="navbar-item-inner flexbox-left" onClick={handleLinkClick}>
            <div className="navbar-item-inner-icon-wrapper flexbox">
              <FaCalendar />
            </div>
            <span className="link-text">Eventos</span>
          </NavLink>
        </li>
        <li className="navbar-item flexbox-left">
          <NavLink to="/recipes" className="navbar-item-inner flexbox-left" onClick={handleLinkClick}>
            <div className="navbar-item-inner-icon-wrapper flexbox">
              <FaBellConcierge />
            </div>
            <span className="link-text">Recetas</span>
          </NavLink>
        </li>
        <li className="navbar-item flexbox-left">
          <NavLink to="/ingredients" className="navbar-item-inner flexbox-left" onClick={handleLinkClick}>
            <div className="navbar-item-inner-icon-wrapper flexbox">
              <FaBasketShopping />
            </div>
            <span className="link-text">Ingredientes</span>
          </NavLink>
        </li>
        <li className="navbar-item flexbox-left">
          <NavLink to="/allergens" className="navbar-item-inner flexbox-left" onClick={handleLinkClick}>
            <div className="navbar-item-inner-icon-wrapper flexbox">
              <FaAllergies />
            </div>
            <span className="link-text">Alérgenos</span>
          </NavLink>
        </li>
        <li className="navbar-item flexbox-left">
          <NavLink to="/orders" className="navbar-item-inner flexbox-left" onClick={handleLinkClick}>
            <div className="navbar-item-inner-icon-wrapper flexbox">
              <FaShoppingCart />
            </div>
            <span className="link-text">Pedidos</span>
          </NavLink>
        </li>
        <li className="navbar-item flexbox-left">
          <NavLink to="/suppliers" className="navbar-item-inner flexbox-left" onClick={handleLinkClick}>
            <div className="navbar-item-inner-icon-wrapper flexbox">
              <FaTruck />
            </div>
            <span className="link-text">Proveedores</span>
          </NavLink>
        </li>
        <li className="navbar-item flexbox-left mobile-only-item">
          <NavLink to="/settings" className="navbar-item-inner flexbox-left" onClick={handleLinkClick}>
            <div className="navbar-item-inner-icon-wrapper flexbox">
              <FaCog />
            </div>
            <span className="link-text">Configuración</span>
          </NavLink>
        </li>
        
        <li className="navbar-item flexbox-left logout">
          <button className="navbar-item-inner flexbox-left" onClick={handleLogout}>
            <div className="navbar-item-inner-icon-wrapper flexbox">
              <FaSignOutAlt />
            </div>
            <span className="link-text">Salir</span>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;