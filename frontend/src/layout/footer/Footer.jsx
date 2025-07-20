// src/layout/footer/Footer.jsx
import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <span className="footer-app-name">RecipesAPI</span>
          <span className="footer-version">v1.0.0</span>
        </div>
        
        <div className="footer-copyright">
          <span>© {currentYear} RecipesAPI. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;