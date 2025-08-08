'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ChefHat } from 'lucide-react'

const AppFooter = () => {
  const currentYear = new Date().getFullYear()
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  
  // Detectar si estamos en móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Determinar si estamos en la página de login
  const isLoginPage = pathname === '/login'

  return (
    <footer className={`w-full border-t mt-auto ${
      isLoginPage 
        ? isMobile 
          ? 'bg-orange-50 border-orange-200' // Móvil login: fondo naranja claro
          : 'bg-white border-gray-200'       // Desktop login: fondo blanco
        : 'bg-white border-gray-200'         // Páginas normales: fondo blanco
    }`}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
        isMobile ? 'py-4' : 'py-3'
      }`}>
        <div className={`flex items-center justify-between ${
          isMobile ? 'flex-col gap-3 text-center' : 'flex-row'
        }`}>
          {/* Brand */}
          <div className="flex items-center space-x-2">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <ChefHat className="h-5 w-5 text-orange-600" />
              <span className={`font-semibold ${
                isLoginPage && isMobile 
                  ? 'text-orange-900 font-bold' // Móvil login: naranja oscuro y más bold
                  : 'text-gray-900'             // Resto: gris oscuro normal
              }`}>
                <span className="text-orange-600">
                  Recetas
                </span>
                <span className={`${
                  isLoginPage && isMobile ? 'text-orange-900' : 'text-gray-900'
                }`}>
                  API
                </span>
              </span>
            </div>
            
            {/* Version badge */}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              isLoginPage && isMobile
                ? 'bg-orange-600 text-white border border-orange-700 font-semibold' // Móvil login: naranja con border
                : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'       // Resto: gradiente naranja
            }`}>
              v2.00
            </span>
          </div>
          
          {/* Copyright */}
          <div className={`text-sm ${
            isLoginPage && isMobile 
              ? 'text-orange-700 font-medium' // Móvil login: texto naranja más marcado
              : 'text-gray-600'               // Resto: gris normal
          }`}>
            © {currentYear} RecetasAPI. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  )
}

export default AppFooter