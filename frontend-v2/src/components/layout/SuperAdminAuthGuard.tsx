'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSuperAdmin } from '@/context/SuperAdminContext'

interface SuperAdminAuthGuardProps {
  children: React.ReactNode
}

export function SuperAdminAuthGuard({ children }: SuperAdminAuthGuardProps) {
  const { user, loading } = useSuperAdmin()
  const router = useRouter()

  useEffect(() => {
    console.log('SuperAdminAuthGuard:', { loading, user, hasUser: !!user })
    if (!loading && !user) {
      console.log('Redirecting to /superadmin/login')
      router.push('/superadmin/login')
    }
  }, [user, loading, router])

  // Mostrar loading mientras verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, mostrar loading mientras redirige
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Redirigiendo al login...</p>
        </div>
      </div>
    )
  }

  // Usuario autenticado, mostrar contenido
  return <>{children}</>
}