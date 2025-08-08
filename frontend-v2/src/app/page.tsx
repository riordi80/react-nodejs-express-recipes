'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { ChefHat, Loader2, ArrowRight, BookOpen, Package, Users, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Eliminar la redirección automática - la página de inicio ahora es pública
  // Los usuarios autenticados pueden ver la página de inicio y elegir ir al dashboard

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-orange-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">RecetasAPI</h1>
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  // Los usuarios autenticados también pueden ver la página de inicio

  // Página de inicio para usuarios no autenticados
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ChefHat className="h-16 w-16 text-orange-600 mx-auto mb-8" />
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              RecetasAPI
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-8">
              La plataforma completa para gestionar tu restaurante. 
              Controla recetas, inventario, proveedores y eventos desde un solo lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                // Usuario autenticado - mostrar botón al dashboard
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                >
                  Ir al Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                // Usuario no autenticado - mostrar botones de demo y login
                <>
                  <Link
                    href="/demo"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                  >
                    Solicitar Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para gestionar tu restaurante
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Una suite completa de herramientas diseñadas específicamente para la industria gastronómica
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Recetas */}
            <div className="text-center">
              <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Recetas</h3>
              <p className="text-gray-600">
                Organiza, costea y escala tus recetas con precisión profesional
              </p>
            </div>

            {/* Inventario */}
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Package className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Inventario</h3>
              <p className="text-gray-600">
                Control total sobre stock, caducidades y rotación de productos
              </p>
            </div>

            {/* Proveedores */}
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Proveedores</h3>
              <p className="text-gray-600">
                Gestiona relaciones, precios y pedidos con tus proveedores
              </p>
            </div>

            {/* Eventos */}
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Eventos</h3>
              <p className="text-gray-600">
                Planifica y ejecuta eventos con control total de costos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {user ? (
            // Usuario autenticado
            <>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¡Bienvenido de vuelta, {user.first_name}!
              </h2>
              <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
                Continúa gestionando tu restaurante con todas las herramientas de RecetasAPI
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-orange-600 bg-white hover:bg-orange-50 transition-colors"
              >
                Ir al Dashboard
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </>
          ) : (
            // Usuario no autenticado
            <>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Listo para transformar tu restaurante?
              </h2>
              <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
                Únete a cientos de restaurantes que ya confían en RecetasAPI para optimizar sus operaciones
              </p>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-orange-600 bg-white hover:bg-orange-50 transition-colors"
              >
                Comenzar Ahora
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  )
}