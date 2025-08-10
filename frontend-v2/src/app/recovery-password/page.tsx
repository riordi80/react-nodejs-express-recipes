'use client'

import React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, ChefHat, Send, CheckCircle } from 'lucide-react'

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email.trim()) {
      setError('El email es requerido')
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Por favor, introduce un email válido')
      return
    }

    setIsLoading(true)
    
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log('Password reset requested for:', email)
    setIsLoading(false)
    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
              <ChefHat className="h-10 w-10 text-orange-600" />
              <span className="text-2xl font-bold text-gray-900">RecetasAPI</span>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Email enviado
            </h2>
            
            <p className="text-gray-600 mb-6">
              Hemos enviado las instrucciones para restablecer tu contraseña a{' '}
              <span className="font-semibold text-gray-900">{email}</span>
            </p>

            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Próximos pasos:</strong>
              </p>
              <ol className="text-sm text-blue-700 mt-2 space-y-1 text-left">
                <li>1. Revisa tu bandeja de entrada</li>
                <li>2. Haz clic en el enlace del email</li>
                <li>3. Crea tu nueva contraseña</li>
                <li>4. Inicia sesión con tu nueva contraseña</li>
              </ol>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              ¿No has recibido el email? Revisa tu carpeta de spam o{' '}
              <button 
                onClick={() => {
                  setIsSuccess(false)
                  setEmail('')
                }}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                inténtalo de nuevo
              </button>
            </p>

            <Link
              href="/login"
              className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors inline-flex items-center justify-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
            <ChefHat className="h-10 w-10 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">RecetasAPI</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            Recuperar contraseña
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Introduce tu email y te enviaremos las instrucciones para restablecer tu contraseña
          </p>
        </div>

        {/* Reset Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 pl-12 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors ${
                    error ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="tu@email.com"
                />
                <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              </div>
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  Enviar instrucciones
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                ¿Problemas para acceder?
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Si no puedes acceder a tu email o necesitas ayuda adicional, 
                nuestro equipo de soporte está aquí para ayudarte.
              </p>
              <Link
                href="/contact"
                className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                Contactar con soporte →
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver al login
          </Link>
        </div>

        {/* Early Access Notice */}
        <div className="bg-white rounded-lg p-6 border border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-center mb-3">
            <div className="bg-yellow-100 rounded-full p-2">
              <ChefHat className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-center text-sm font-semibold text-yellow-900 mb-2">
            Nota importante
          </h3>
          <p className="text-center text-sm text-yellow-800">
            El sistema de login estará disponible próximamente con el lanzamiento de RecetasAPI. 
            Por ahora, puedes{' '}
            <Link href="/register" className="font-medium text-yellow-900 hover:text-yellow-700 underline">
              registrarte
            </Link>
            {' '}para obtener acceso anticipado.
          </p>
        </div>
      </div>
    </div>
  )
}