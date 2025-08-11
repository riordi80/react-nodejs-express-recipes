'use client'

import React from 'react'
import { useState, useEffect } from 'react'
import { Mail, ChefHat, ArrowRight, Building2, Eye, EyeOff, Lock } from 'lucide-react'
import Link from 'next/link'

// Tipo para la configuración runtime
type RuntimeConfig = {
  apiBaseUrl: string;
  environment: string;
  multitenant?: boolean;
}

export default function CentralLoginPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [config, setConfig] = useState<RuntimeConfig | null>(null)
  const [tenantInfo, setTenantInfo] = useState<{
    subdomain: string
    business_name: string
    login_url: string
  } | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)

  // Cargar configuración runtime al montar el componente
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/config.json')
        if (response.ok) {
          const runtimeConfig = await response.json() as RuntimeConfig
          setConfig(runtimeConfig)
        }
      } catch (error) {
        console.error('Error loading runtime config:', error)
        // Fallback a variables de entorno
        setConfig({
          apiBaseUrl: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api',
          environment: 'fallback'
        })
      }
    }
    loadConfig()
  }, [])

  // Auto-redirect countdown cuando se encuentra el tenant
  useEffect(() => {
    if (tenantInfo && !isRedirecting) {
      setCountdown(3)
      setIsRedirecting(true)
    }
  }, [tenantInfo, isRedirecting])

  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (countdown > 0 && isRedirecting) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
    } else if (countdown === 0 && isRedirecting && tenantInfo) {
      // Ir al tercer paso (login)
      setShowLogin(true)
      setIsRedirecting(false)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [countdown, isRedirecting, tenantInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    setTenantInfo(null)

    if (!email.trim()) {
      setError('Email es obligatorio')
      setIsLoading(false)
      return
    }

    if (!config) {
      setError('Configuración no cargada. Intenta recargar la página.')
      setIsLoading(false)
      return
    }

    try {
      // Usar la configuración runtime cargada dinámicamente
      const response = await fetch(`${config.apiBaseUrl}/find-tenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.code === 'USER_NOT_FOUND') {
          setError('No se encontró una cuenta con este email')
        } else if (data.code === 'TENANT_INACTIVE') {
          setError('Esta cuenta está inactiva')
        } else if (data.code === 'TENANT_SUSPENDED') {
          setError('Esta cuenta está suspendida. Contacte al soporte técnico.')
        } else if (data.code === 'TENANT_CANCELLED') {
          setError('Esta cuenta ha sido cancelada')
        } else {
          setError('Error al buscar la cuenta')
        }
        return
      }

      if (data.success && data.tenant) {
        setTenantInfo(data.tenant)
      } else {
        setError('Respuesta inesperada del servidor')
      }

    } catch (err) {
      console.error('Error finding tenant:', err)
      setError('Error de conexión. Verifica que el servidor esté funcionando.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleContinueToLogin = () => {
    setShowLogin(true)
  }

  const handleStartOver = () => {
    setEmail('')
    setPassword('')
    setError('')
    setTenantInfo(null)
    setShowLogin(false)
    setCountdown(0)
    setIsRedirecting(false)
  }

  const handleCancelRedirect = () => {
    setCountdown(0)
    setIsRedirecting(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoginLoading(true)

    if (!password.trim()) {
      setError('Contraseña es obligatoria')
      setLoginLoading(false)
      return
    }

    if (!config || !tenantInfo) {
      setError('Error de configuración')
      setLoginLoading(false)
      return
    }

    try {
      // Realizar login directo usando la configuración del tenant
      const loginUrl = new URL(tenantInfo.login_url)
      const apiUrl = `${loginUrl.protocol}//${loginUrl.hostname}${loginUrl.port ? ':' + loginUrl.port : ''}/api/login`
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password.trim() 
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Error al iniciar sesión')
        return
      }

      // Login exitoso, redirigir al dashboard del tenant
      window.location.href = `${loginUrl.protocol}//${loginUrl.hostname}${loginUrl.port ? ':' + loginUrl.port : ''}/dashboard`

    } catch (err) {
      console.error('Login error:', err)
      setError('Error de conexión al iniciar sesión')
    } finally {
      setLoginLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <ChefHat className="h-10 w-10 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">RecetasAPI</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Acceso al Sistema
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tu email para acceder a tu restaurante
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg relative">
          <div className="absolute inset-0 rounded-xl" style={{ 
            overflow: 'hidden',
            zIndex: 1,
            pointerEvents: 'none'
          }}></div>
          <div className="relative z-10 overflow-hidden rounded-xl">
            <div className="flex transition-transform duration-700 ease-in-out w-[300%]" style={{
              transform: `translateX(${!tenantInfo ? '0%' : showLogin ? '-66.66%' : '-33.33%'})`
            }}>
              {/* Step 1: Find Tenant Form */}
              <div className="w-1/3 flex-shrink-0 p-8 flex items-center">
                <div className="w-full">
                  <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="text"
                    autoComplete="off"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    placeholder="tu@email.com"
                  />
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    Buscar mi restaurante
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
                  </form>
                </div>
              </div>

              {/* Step 2: Tenant Found - Auto-redirect with countdown */}
              <div className="w-1/3 flex-shrink-0 p-8 flex items-center">
                <div className="w-full text-center space-y-6">
              <div className="flex items-center justify-center">
                <div className="bg-green-100 rounded-full p-3">
                  <Building2 className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ¡Restaurante encontrado!
                </h3>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-orange-900">
                    {tenantInfo?.business_name}
                  </p>
                  <p className="text-xs text-orange-700">
                    {tenantInfo?.login_url ? new URL(tenantInfo.login_url).hostname : ''}
                  </p>
                </div>
              </div>

              {isRedirecting ? (
                // Countdown and auto-redirect
                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-600 border-t-transparent"></div>
                    <p className="text-sm text-gray-600">
                      Continuando en <span className="font-bold text-orange-600 text-lg">{countdown}</span> segundos...
                    </p>
                  </div>

                  <button
                    onClick={handleCancelRedirect}
                    className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                // Manual redirect buttons (fallback)
                <div className="space-y-3">
                  <button
                    onClick={handleContinueToLogin}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    Continuar al Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={handleStartOver}
                    className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                  >
                    Usar otro email
                  </button>
                </div>
              )}
                </div>
              </div>

              {/* Step 3: Login Form */}
              <div className="w-1/3 flex-shrink-0 p-8 flex items-center">
                <div className="w-full space-y-6">
                  <div className="text-center">
                    <Building2 className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tenantInfo?.business_name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {email}
                    </p>
                  </div>

                  <form className="space-y-6" onSubmit={handleLogin}>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                          placeholder="Tu contraseña"
                        />
                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-3.5 h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Error message */}
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loginLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <>
                          Iniciar Sesión
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleStartOver}
                      className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                    >
                      Empezar de nuevo
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Sistema SaaS Multi-tenant · RecetasAPI v2.0
          </p>
          <div className="mt-2 flex items-center justify-center space-x-4 text-xs text-gray-500">
            <Link href="/pricing" className="hover:text-orange-600 transition-colors">
              Planes
            </Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-orange-600 transition-colors">
              Contacto
            </Link>
            <span>·</span>
            <Link href="/register" className="hover:text-orange-600 transition-colors">
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}