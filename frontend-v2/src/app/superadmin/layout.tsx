'use client'

import React, { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { notFound } from 'next/navigation'
import { SuperAdminProvider } from '@/context/SuperAdminContext'
import { SuperAdminThemeProvider, useSuperAdminTheme } from '@/context/SuperAdminThemeContext'
import { SuperAdminAuthGuard } from '@/components/layout/SuperAdminAuthGuard'
import { SuperAdminSidebar } from '@/components/layout/SuperAdminSidebar'
import { SuperAdminHeader } from '@/components/layout/SuperAdminHeader'

// Componente para verificar subdominio
function SubdomainGuard({ children }: { children: React.ReactNode }) {
  // Hook para verificar hostname inmediatamente
  const [isValidSubdomain, setIsValidSubdomain] = React.useState<boolean | null>(null)

  useEffect(() => {
    // Solo ejecutar en el browser
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      console.log(`🔐 SuperAdmin SubdomainGuard checking: ${hostname}`)
      
      // Si NO es console.*, bloquear acceso
      const isValid = hostname.startsWith('console.') || hostname.includes('localhost')
      
      if (!isValid) {
        console.log(`❌ BLOCKING SuperAdmin - hostname: ${hostname}`)
        notFound() // Usar 404 nativo de Next.js
        return
      }
      
      console.log(`✅ ALLOWING SuperAdmin - console hostname: ${hostname}`)
      setIsValidSubdomain(true)
    }
  }, [])

  // Mientras verificamos, no renderizar nada
  if (isValidSubdomain === null) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-gray-600">Verificando acceso...</div>
    </div>
  }

  // Si no es válido, ya se ejecutó notFound() en el useEffect
  if (isValidSubdomain === false) {
    return null // No debería llegar aquí, pero por si acaso
  }

  // Si es válido, renderizar children
  return <>{children}</>
}

interface SuperAdminLayoutProps {
  children: React.ReactNode
}

// Componente interno que usa el tema
function SuperAdminLayoutContent({ children }: SuperAdminLayoutProps) {
  const pathname = usePathname()
  const { getThemeClasses } = useSuperAdminTheme()
  const themeClasses = getThemeClasses()
  
  // Páginas que NO necesitan AuthGuard (páginas públicas del SuperAdmin)
  const isPublicPage = pathname === '/superadmin/login'

  if (isPublicPage) {
    return (
      <div className={`min-h-screen ${themeClasses.bg}`}>
        {children}
      </div>
    )
  }

  return (
    <SuperAdminAuthGuard>
      <div className={`min-h-screen ${themeClasses.bg}`}>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <SuperAdminSidebar />
          
          {/* Contenido principal */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <SuperAdminHeader />
            
            {/* Contenido */}
            <main className={`flex-1 overflow-auto ${themeClasses.bgSecondary}`}>
              <div className="h-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </SuperAdminAuthGuard>
  )
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <SubdomainGuard>
      <SuperAdminThemeProvider>
        <SuperAdminProvider>
          <SuperAdminLayoutContent>
            {children}
          </SuperAdminLayoutContent>
        </SuperAdminProvider>
      </SuperAdminThemeProvider>
    </SubdomainGuard>
  )
}