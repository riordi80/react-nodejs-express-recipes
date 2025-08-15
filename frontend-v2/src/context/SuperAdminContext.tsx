'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// Tipos específicos para SuperAdmin
interface SuperAdminUser {
  user_id: number
  email: string
  first_name: string
  last_name: string
  superadmin_role: 'super_admin_full' | 'super_admin_read' | 'super_admin_billing' | 'super_admin_support' | 'super_admin_dev'
  permissions: string[]
  last_login?: string
}

interface SuperAdminContextType {
  user: SuperAdminUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  hasPermission: (permission: string) => boolean
  isFullAdmin: () => boolean
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined)

export function useSuperAdmin() {
  const context = useContext(SuperAdminContext)
  if (context === undefined) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider')
  }
  return context
}

interface SuperAdminProviderProps {
  children: ReactNode
}

export function SuperAdminProvider({ children }: SuperAdminProviderProps) {
  const [user, setUser] = useState<SuperAdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  // API base URL para superadmin - detección automática del entorno
  const getApiBaseUrl = () => {
    // En el navegador, detectar el entorno automáticamente
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      
      // Si es localhost, usar desarrollo local
      if (hostname === 'localhost') {
        return 'http://localhost:4000'
      }
      
      // Si es un dominio de producción, usar rutas relativas
      if (hostname.includes('ordidev.com')) {
        return '' // Rutas relativas para producción
      }
    }
    
    // Fallback: intentar usar variables de entorno
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL
    }
    
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      return '' // Rutas relativas
    }
    
    // Último fallback
    return 'http://localhost:4000'
  }
  
  const apiBaseUrl = getApiBaseUrl()

  const checkAuth = async () => {
    try {
      setLoading(true)
      
      // Debug temporal - quitar después
      console.log('SuperAdmin API URL:', `${apiBaseUrl}/api/superadmin/auth/me`)
      
      const response = await fetch(`${apiBaseUrl}/api/superadmin/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/superadmin/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return { success: true }
      } else {
        return { 
          success: false, 
          message: data.message || 'Error al iniciar sesión'
        }
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { 
        success: false, 
        message: 'Error de conexión'
      }
    }
  }

  const logout = async () => {
    try {
      await fetch(`${apiBaseUrl}/api/superadmin/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setUser(null)
      // Redirigir al login
      if (typeof window !== 'undefined') {
        window.location.href = '/superadmin/login'
      }
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    if (user.superadmin_role === 'super_admin_full') return true
    return user.permissions?.includes(permission) || false
  }

  const isFullAdmin = (): boolean => {
    return user?.superadmin_role === 'super_admin_full' || false
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    hasPermission,
    isFullAdmin
  }

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  )
}