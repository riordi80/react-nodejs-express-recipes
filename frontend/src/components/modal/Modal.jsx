import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useSidebar } from '../../context/SidebarContext';
import './Modal.css';

export default function Modal({ isOpen, title, children, onClose, fullscreenMobile = false }) {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  // Obtener estado del sidebar para adaptar la modal
  const { isMobileMenuOpen } = useSidebar();

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShouldRender(true);
    } else {
      // Si es fullscreen móvil Y estamos en móvil, no ocultar aquí (se maneja en handleClose)
      if (fullscreenMobile && window.innerWidth <= 768) {
        // No hacer nada, se maneja en handleClose con animación
      } else {
        // Para todo lo demás, ocultar inmediatamente
        setShouldRender(false);
      }
    }
  }, [isOpen, fullscreenMobile]);

  const handleClose = () => {
    // Para fullscreen en móvil, usar animación
    if (fullscreenMobile && window.innerWidth <= 768) {
      setIsClosing(true);
      setTimeout(() => {
        setShouldRender(false);
        onClose();
        setIsClosing(false);
      }, 400);
    } else {
      // Para todo lo demás, cerrar directamente
      onClose();
    }
  };

  // Función para cerrar al hacer clic en overlay (sin animación en desktop)
  const handleOverlayClick = () => {
    if (fullscreenMobile && window.innerWidth <= 768) {
      handleClose();
    } else {
      onClose();
    }
  };

  if (!shouldRender) return null;

  let modalClasses = `modal-window`;
  let overlayClasses = `modal-overlay`;

  if (fullscreenMobile) {
    modalClasses += ` fullscreen-mobile`;
    overlayClasses += ` fullscreen-mobile-overlay`;
    
    // Añadir clase cuando el sidebar móvil está abierto
    if (isMobileMenuOpen) {
      modalClasses += ` sidebar-open`;
      overlayClasses += ` sidebar-open`;
    }
    
    // Añadir clase para animación de salida
    if (isClosing) {
      modalClasses += ` closing`;
      overlayClasses += ` closing`;
    }
  }

  return ReactDOM.createPortal(
    <div className={overlayClasses} onClick={handleOverlayClick}>
      <div className={modalClasses} onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h3>{title}</h3>
          <button 
            className="modal-close" 
            onClick={handleClose}
            type="button"
          >
            &times;
          </button>
        </header>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
