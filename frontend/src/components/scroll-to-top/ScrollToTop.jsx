// src/components/scroll-to-top/ScrollToTop.jsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Buscar el contenedor principal de scroll
    const contentElement = document.querySelector('.content');
    
    if (contentElement) {
      // Scroll suave al top del contenedor principal
      contentElement.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    } else {
      // Fallback para scroll de la ventana completa con efecto suave
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
  }, [pathname]);

  return null;
};

export default ScrollToTop;