'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { SuperAdminProvider } from '@/context/SuperAdminContext'
import { SuperAdminThemeProvider, useSuperAdminTheme } from '@/context/SuperAdminThemeContext'
import { SuperAdminAuthGuard } from '@/components/layout/SuperAdminAuthGuard'
import { SuperAdminSidebar } from '@/components/layout/SuperAdminSidebar'
import { SuperAdminHeader } from '@/components/layout/SuperAdminHeader'

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
    <SuperAdminThemeProvider>
      <SuperAdminProvider>
        <SuperAdminLayoutContent>
          {children}
        </SuperAdminLayoutContent>
      </SuperAdminProvider>
    </SuperAdminThemeProvider>
  )
}