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
  const [userCancelled, setUserCancelled] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  
  // Animation states
  const [animatingOut, setAnimatingOut] = useState(false)
  const [currentStep, setCurrentStep] = useState<'email' | 'found' | 'login'>('email')

  // Cargar configuración runtime al montar el componente
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/config.json')
        if (response.ok) {
          const runtimeConfig = await response.json() as RuntimeConfig
          setConfig(runtimeConfig)
        }
      } catch {
        console.error('Fixed error in catch block')
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
    if (tenantInfo && !isRedirecting && !userCancelled) {
      setCountdown(3)
      setIsRedirecting(true)
    }
  }, [tenantInfo, isRedirecting, userCancelled])

  useEffect(() => {
    let timer: NodeJS.Timeout
    
    if (countdown > 0 && isRedirecting) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
    } else if (countdown === 0 && isRedirecting && tenantInfo && currentStep === 'found') {
      // Dar tiempo para que la barra llegue al 100% antes de animar
      setTimeout(() => {
        setAnimatingOut(true)
        setTimeout(() => {
          setCurrentStep('login')
          setIsRedirecting(false)
          setAnimatingOut(false)
        }, 500)
      }, 500) // Más tiempo para completar la barra visualmente
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [countdown, isRedirecting, tenantInfo, currentStep])

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
          // Si no se encuentra el usuario, ir directamente al paso de login sin mostrar error
          setAnimatingOut(true)
          setTimeout(() => {
            setCurrentStep('login')
            setAnimatingOut(false)
          }, 300)
          return
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
        // Animar salida del paso actual
        setAnimatingOut(true)
        
        // Después de la animación, cambiar al siguiente paso
        setTimeout(() => {
          setTenantInfo(data.tenant)
          setCurrentStep('found')
          setAnimatingOut(false)
        }, 300)
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
    // Animar salida del paso actual
    setAnimatingOut(true)
    
    // Después de la animación, cambiar al siguiente paso
    setTimeout(() => {
      setCurrentStep('login')
      setIsRedirecting(false)
      setUserCancelled(false) // Reset para futuras navegaciones
      setAnimatingOut(false)
    }, 300)
  }

  const handleStartOver = () => {
    // Animar salida del paso actual
    setAnimatingOut(true)
    
    // Después de la animación, volver al inicio
    setTimeout(() => {
      setEmail('')
      setPassword('')
      setError('')
      setTenantInfo(null)
      setCountdown(0)
      setIsRedirecting(false)
      setUserCancelled(false) // Reset para nuevo inicio
      setCurrentStep('email')
      setAnimatingOut(false)
    }, 300)
  }

  const handleCancelRedirect = () => {
    setCountdown(0)
    setIsRedirecting(false)
    setUserCancelled(true)
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

    if (!config) {
      setError('Error de configuración')
      setLoginLoading(false)
      return
    }

    try {
      let apiUrl;
      let redirectUrl;
      
      if (tenantInfo) {
        // Caso normal: tenant encontrado
        const loginUrl = new URL(tenantInfo.login_url)
        apiUrl = `${loginUrl.protocol}//${loginUrl.hostname}${loginUrl.port ? ':' + loginUrl.port : ''}/api/login`
        redirectUrl = `${loginUrl.protocol}//${loginUrl.hostname}${loginUrl.port ? ':' + loginUrl.port : ''}/dashboard`
      } else {
        // Caso nuevo: email no encontrado, intentar login en dominio actual
        const currentUrl = new URL(window.location.href)
        apiUrl = `${currentUrl.protocol}//${currentUrl.hostname}${currentUrl.port ? ':' + currentUrl.port : ''}/api/login`
        redirectUrl = `${currentUrl.protocol}//${currentUrl.hostname}${currentUrl.port ? ':' + currentUrl.port : ''}/dashboard`
      }
      
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

      // Login exitoso, redirigir al dashboard
      window.location.href = redirectUrl

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
            Escribe tu email para acceder a tu restaurante
          </p>
        </div>

        {/* Main Content - Step 1: Email Input */}
        {currentStep === 'email' && (
          <div className={`bg-white rounded-xl shadow-lg p-8 relative transition-opacity duration-500 ease-out ${
            animatingOut ? 'opacity-0' : 'opacity-100'
          }`}>
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
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Main Content - Steps 2 & 3: Shared Container */}
        {(currentStep === 'found' || currentStep === 'login') && (
          <div className="bg-white rounded-xl shadow-lg relative h-[420px] overflow-hidden">
            
            {/* Progress Bar - Visible during step 2 */}
            {currentStep === 'found' && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
                <div 
                  className="h-full bg-orange-600 transition-all duration-1000 ease-linear"
                  style={{ 
                    width: isRedirecting ? `${Math.min(((3 - countdown) / 3) * 100, 100)}%` : '0%'
                  }}
                />
              </div>
            )}
            
            {/* Step 2: Tenant Found */}
            {currentStep === 'found' && (
              <div className={`absolute top-0 left-0 w-full h-full p-8 flex items-center transform transition-all duration-500 ease-out ${
                animatingOut ? 'translate-x-[-100%]' : 'translate-x-0'
              }`}>
                <div className="w-full text-center space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="bg-orange-100 rounded-full p-3">
                      <ChefHat className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      ¡Bienvenido/a de vuelta!
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
                      <div className="flex items-center justify-center">
                        <p className="text-sm text-gray-600">
                          Preparando tu restaurante...
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
                        className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none transition-colors"
                      >
                        Usar otro email
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Login Form */}
            {currentStep === 'login' && (
              <div className={`absolute top-0 left-0 w-full h-full p-8 flex items-center transform transition-all duration-500 ease-out ${
                animatingOut ? 'translate-x-[-100%]' : 'translate-x-0'
              }`}>
                <div className="w-full space-y-6">
                  <div className="text-center">
                    <Building2 className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tenantInfo?.business_name || 'Iniciar Sesión'}
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
                          autoFocus
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
                      className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none transition-colors"
                    >
                      Empezar de nuevo
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

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