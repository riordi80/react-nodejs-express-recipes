'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSuperAdmin } from '@/context/SuperAdminContext'
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function SuperAdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { user, login } = useSuperAdmin()
  const router = useRouter()

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      router.push('/superadmin')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(email, password)
      
      if (result.success) {
        router.push('/superadmin')
      } else {
        setError(result.message || 'Error al iniciar sesión')
      }
    } catch (error) {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // No mostrar la página si ya está autenticado
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center">
            <ShieldCheckIcon className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            SuperAdmin Console
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Acceso restringido al panel de administración
          </p>
        </div>

        {/* Form */}
        <div className="bg-slate-800 rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Alert */}
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-md">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email de SuperAdmin
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 bg-slate-700 border border-slate-600 placeholder-slate-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="admin@tudominio.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
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
                  className="appearance-none relative block w-full px-3 py-3 pr-10 bg-slate-700 border border-slate-600 placeholder-slate-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Ingresa tu contraseña"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-slate-400 hover:text-slate-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me y forgot password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 bg-slate-700 border-slate-600 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-300">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="text-blue-400 hover:text-blue-300">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verificando...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-400">
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Conexión segura y auditada</span>
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">
              Todos los accesos son registrados y monitoreados
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-500">
          <p>© 2024 SuperAdmin Console v1.0.0</p>
          <p className="mt-1">Acceso solo para administradores autorizados</p>
        </div>
      </div>
    </div>
  )
}