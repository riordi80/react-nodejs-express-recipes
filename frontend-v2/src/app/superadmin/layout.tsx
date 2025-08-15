'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { SuperAdminProvider } from '@/context/SuperAdminContext'
import { SuperAdminAuthGuard } from '@/components/layout/SuperAdminAuthGuard'
import { SuperAdminSidebar } from '@/components/layout/SuperAdminSidebar'
import { SuperAdminHeader } from '@/components/layout/SuperAdminHeader'

interface SuperAdminLayoutProps {
  children: React.ReactNode
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const pathname = usePathname()
  
  // Páginas que NO necesitan AuthGuard (páginas públicas del SuperAdmin)
  const isPublicPage = pathname === '/superadmin/login'

  return (
    <SuperAdminProvider>
      {isPublicPage ? (
        // Para páginas públicas: solo el contexto, sin AuthGuard ni layout
        <div className="min-h-screen bg-slate-900">
          {children}
        </div>
      ) : (
        // Para páginas protegidas: AuthGuard + layout completo
        <SuperAdminAuthGuard>
          <div className="min-h-screen bg-slate-900">
            {/* Layout con tema dark específico para superadmin */}
            <div className="flex h-screen overflow-hidden">
              {/* Sidebar */}
              <SuperAdminSidebar />
              
              {/* Contenido principal */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <SuperAdminHeader />
                
                {/* Contenido */}
                <main className="flex-1 overflow-auto bg-slate-50">
                  <div className="h-full">
                    {children}
                  </div>
                </main>
              </div>
            </div>
          </div>
        </SuperAdminAuthGuard>
      )}
    </SuperAdminProvider>
  )
}