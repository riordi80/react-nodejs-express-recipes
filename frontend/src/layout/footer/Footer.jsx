// src/layout/footer/Footer.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LogoText from '../../components/logo/LogoText';
import { BRAND_CONFIG } from '../../config/branding';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  // Detectar si estamos en móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Determinar si estamos en la página de login
  const isLoginPage = location.pathname === '/login';
  
  // Determinar la variante del LogoText
  const logoVariant = isLoginPage && isMobile ? "footer-mobile-login" : "default";
  
  return (
    <footer className={`app-footer ${isLoginPage ? 'login-footer' : ''}`}>
      <div className="footer-content">
        <div className="footer-brand">
          <LogoText 
            className="footer-app-name" 
            variant={logoVariant}
          />
          <span className="footer-version">v1.0.0</span>
        </div>
        
        <div className="footer-copyright">
          <span>© {currentYear} {BRAND_CONFIG.name}. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;