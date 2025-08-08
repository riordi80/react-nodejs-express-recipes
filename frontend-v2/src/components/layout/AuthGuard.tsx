'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Si no está cargando y no hay usuario, redirigir al login
    if (!loading && !user && pathname !== '/login') {
      router.replace('/login')
    }
    
    // Si hay usuario y está en login, redirigir al dashboard
    if (!loading && user && pathname === '/login') {
      router.replace('/dashboard')
    }
  }, [user, loading, pathname, router])

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario y no está en login, no mostrar nada (se está redirigiendo)
  if (!user && pathname !== '/login') {
    return null
  }

  // Si hay usuario y está en login, no mostrar nada (se está redirigiendo)
  if (user && pathname === '/login') {
    return null
  }

  return <>{children}</>
}