'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, AuthResponse } from '@/types'
import { apiGet, apiPost, waitForConfig } from '@/lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateRestaurantName: (name: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      setLoading(true)
      // Esperar a que axios esté completamente configurado
      await waitForConfig()
      
      const response = await apiGet<{ authenticated: boolean; user: User }>('/me')
      setUser(response.data.user)
    } catch (error: unknown) {
      setUser(null)
      // No mostrar error en consola para 401 (normal cuando no hay sesión)
      if (error?.response?.status !== 401) {
        console.error('Auth check failed:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await apiPost<AuthResponse>('/login', {
        email,
        password
      })

      // Obtener datos del usuario de la respuesta del login
      if (response.data.user) {
        setUser(response.data.user)
      }
      
      return { success: true }
    } catch (error: unknown) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión',
      }
    }
  }

  const logout = async () => {
    try {
      await apiPost('/logout')
    } catch (error) {
      console.error('Error cerrando sesión:', error)
    } finally {
      setUser(null)
      // Redirigir al login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  const updateRestaurantName = (name: string) => {
    if (user) {
      setUser({ ...user, restaurant_name: name })
    }
  }

  // Verificar autenticación al cargar la app
  useEffect(() => {
    // Solo ejecutar en cliente, no en servidor (Next.js SSR)
    if (typeof window !== 'undefined') {
      checkAuth()
    }
  }, [])

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    updateRestaurantName
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}