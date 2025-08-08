'use client'

import { usePathname } from 'next/navigation'
import PublicFooter from './PublicFooter'
import AppFooter from './AppFooter'

const FooterWrapper = () => {
  const pathname = usePathname()

  // Verificar si estamos en rutas del dashboard (aplicación SaaS)
  const isDashboardRoute = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/recipes') || 
                          pathname.startsWith('/ingredients') ||
                          pathname.startsWith('/suppliers') ||
                          pathname.startsWith('/events') ||
                          pathname.startsWith('/orders') ||
                          pathname.startsWith('/settings')

  // Si estamos en páginas de autenticación, no mostrar footer
  if (pathname === '/login' || pathname === '/recovery-password') {
    return null
  }

  // Si estamos en el dashboard, mostrar AppFooter
  if (isDashboardRoute) {
    return <AppFooter />
  }

  // Páginas públicas: PublicFooter
  return <PublicFooter />
}

export default FooterWrapper