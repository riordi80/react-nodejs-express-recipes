// src/components/scroll-to-top/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Pequeño delay para asegurar que el DOM esté completamente renderizado
    const timer = setTimeout(() => {
      // Buscar el contenedor principal de scroll
      const contentElement = document.querySelector('.content');
      
      if (contentElement) {
        // Buscar el primer elemento de contenido real (típicamente PageHeader o similar)
        const firstContentElement = contentElement.querySelector('.page-header, .common-page-container, .suppliers-container, .recipes-container, h1, .page-title, [class*="container"]');
        
        if (firstContentElement) {
          // Hacer scroll al primer elemento de contenido
          firstContentElement.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          });
        } else {
          // Fallback: scroll directo al contenedor
          contentElement.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
        }
      } else {
        // Fallback para scroll de la ventana completa
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }
    }, 100); // 100ms delay para asegurar renderizado completo

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
};

export default ScrollToTop;