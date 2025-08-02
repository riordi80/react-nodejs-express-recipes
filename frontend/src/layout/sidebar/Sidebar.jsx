import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';  
import { useAuth } from '../../context/AuthContext';  
import { useSidebar } from '../../context/SidebarContext';
import './Sidebar.css';

// Importamos los iconos que necesitamos
import { FaTruck, FaSignOutAlt, FaAlignJustify, FaCog, FaShoppingCart, FaChevronDown, FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { FaHouse, FaBellConcierge, FaCalendar, FaFish } from "react-icons/fa6";
import { MdCategory } from 'react-icons/md';

const Sidebar = () => {
  const { logout } = useAuth();  
  const { isMobileMenuOpen, closeMobileMenu } = useSidebar();
  const [isPinned, setIsPinned] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const location = useLocation();

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

  const toggleSubmenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  const handleMainMenuClick = (e, path) => {
    // En móvil, navegar directamente; en desktop, solo expandir
    if (window.innerWidth <= 756) {
      // Es móvil, navegar directamente
      handleLinkClick();
      window.location.href = path;
    } else {
      // Es desktop, prevenir navegación y solo expandir
      e.preventDefault();
    }
  };

  // Verificar si estamos en la sección de ingredientes
  const isInIngredientsSection = () => {
    const ingredientsRoutes = ['/ingredients', '/allergens', '/ingredient-categories'];
    return ingredientsRoutes.some(route => location.pathname.startsWith(route));
  };

  // Gestionar apertura/cierre automático del submenú según la ruta
  useEffect(() => {
    const isInSection = isInIngredientsSection();
    
    setExpandedMenus(prev => ({
      ...prev,
      ingredients: isInSection
    }));
  }, [location.pathname]);

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
              <FaHouse />
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
          <NavLink to="/supplier-orders" className="navbar-item-inner flexbox-left" onClick={handleLinkClick}>
            <div className="navbar-item-inner-icon-wrapper flexbox">
              <FaShoppingCart />
            </div>
            <span className="link-text">Pedidos</span>
          </NavLink>
        </li>
        <li className="navbar-item flexbox-left">
          <div className="navbar-item-with-submenu">
            <NavLink 
              to="/ingredients"
              className={`navbar-item-inner flexbox-left ${isInIngredientsSection() ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              <div className="navbar-item-inner-icon-wrapper flexbox">
                <FaFish />
              </div>
              <span className="link-text">Ingredientes</span>
              <div 
                className="chevron-wrapper" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSubmenu('ingredients');
                }}
              >
                {expandedMenus.ingredients ? <FaChevronDown /> : <FaChevronRight />}
              </div>
            </NavLink>
            <div className={`submenu ${expandedMenus.ingredients ? 'expanded' : ''}`}>
              <NavLink to="/allergens" className="submenu-item" onClick={handleLinkClick}>
                <div className="submenu-item-icon-wrapper flexbox">
                  <FaExclamationTriangle />
                </div>
                <span className="submenu-link-text">Alérgenos</span>
              </NavLink>
              <NavLink to="/ingredient-categories" className="submenu-item" onClick={handleLinkClick}>
                <div className="submenu-item-icon-wrapper flexbox">
                  <MdCategory />
                </div>
                <span className="submenu-link-text">Categorías</span>
              </NavLink>
            </div>
          </div>
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