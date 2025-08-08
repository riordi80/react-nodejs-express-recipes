import Link from 'next/link'
import { BookOpen, Video, MessageCircle, Download, Search, ArrowRight, CheckCircle } from 'lucide-react'

export default function DocsPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Documentación y Ayuda
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Encuentra toda la información que necesitas para sacar el máximo provecho 
              de RecetasAPI. Desde guías de inicio hasta tutoriales avanzados.
            </p>
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                placeholder="Buscar en la documentación..."
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Acceso Rápido
            </h2>
            <p className="text-xl text-gray-600">
              Los recursos más utilizados por nuestros usuarios
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/docs/start-guide" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
              <div className="bg-blue-100 rounded-lg p-3 w-fit mb-4 group-hover:bg-blue-200 transition-colors">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Guía de Inicio</h3>
              <p className="text-gray-600 text-sm">
                Primeros pasos con RecetasAPI, configuración inicial y conceptos básicos.
              </p>
            </Link>

            <Link href="/docs/tutorials" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-green-300">
              <div className="bg-green-100 rounded-lg p-3 w-fit mb-4 group-hover:bg-green-200 transition-colors">
                <Video className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Tutoriales</h3>
              <p className="text-gray-600 text-sm">
                Aprende con videos paso a paso sobre todas las funcionalidades.
              </p>
            </Link>

            <Link href="/contact" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-orange-300">
              <div className="bg-orange-100 rounded-lg p-3 w-fit mb-4 group-hover:bg-orange-200 transition-colors">
                <MessageCircle className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Soporte</h3>
              <p className="text-gray-600 text-sm">
                Contacta con nuestro equipo para resolver cualquier duda.
              </p>
            </Link>

            <Link href="/docs/resources" className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-purple-300">
              <div className="bg-purple-100 rounded-lg p-3 w-fit mb-4 group-hover:bg-purple-200 transition-colors">
                <Download className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Recursos</h3>
              <p className="text-gray-600 text-sm">
                Plantillas, guías descargables y materiales complementarios.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* RecipesAPI */}
            <div>
              <h3 className="text-2xl font-bold text-blue-600 mb-6 flex items-center">
                <div className="bg-blue-600 rounded-lg p-2 mr-3">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                RecipesAPI
              </h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Configuración Inicial</h4>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Disponible</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Cómo configurar tu restaurante y usuarios por primera vez.
                  </p>
                  <Link href="#" className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
                    Leer guía <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Gestión de Eventos</h4>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Disponible</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Organiza banquetes y eventos especiales con facilidad.
                  </p>
                  <Link href="#" className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
                    Leer guía <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Control de Inventario</h4>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Disponible</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Monitorea ingredientes y stock en tiempo real.
                  </p>
                  <Link href="#" className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
                    Leer guía <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Gestión de Recetas</h4>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Disponible</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Crea recetas, calcula costos y optimiza márgenes.
                  </p>
                  <Link href="#" className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
                    Leer guía <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Sistema de Reservas */}
            <div>
              <h3 className="text-2xl font-bold text-green-600 mb-6 flex items-center">
                <div className="bg-green-600 rounded-lg p-2 mr-3">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                Sistema de Reservas
              </h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 opacity-75">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Configuración de Mesas</h4>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Próximamente</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Configura tu distribución de mesas y capacidades.
                  </p>
                  <span className="text-gray-400 text-sm">Disponible Q2 2025</span>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 opacity-75">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Widget de Reservas</h4>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Próximamente</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Integra el sistema en tu web con nuestro widget.
                  </p>
                  <span className="text-gray-400 text-sm">Disponible Q2 2025</span>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 opacity-75">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Notificaciones</h4>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Próximamente</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Configura confirmaciones y recordatorios automáticos.
                  </p>
                  <span className="text-gray-400 text-sm">Disponible Q2 2025</span>
                </div>
              </div>
            </div>

            {/* Carta Digital */}
            <div>
              <h3 className="text-2xl font-bold text-purple-600 mb-6 flex items-center">
                <div className="bg-purple-600 rounded-lg p-2 mr-3">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                Carta Digital
              </h3>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 opacity-75">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Creación de Menús</h4>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Próximamente</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Diseña y estructura tu carta digital paso a paso.
                  </p>
                  <span className="text-gray-400 text-sm">Disponible Q3 2025</span>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 opacity-75">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Códigos QR</h4>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Próximamente</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Genera y personaliza códigos QR para tus mesas.
                  </p>
                  <span className="text-gray-400 text-sm">Disponible Q3 2025</span>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200 opacity-75">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Multi-idioma</h4>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Próximamente</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    Configura tu carta en múltiples idiomas.
                  </p>
                  <span className="text-gray-400 text-sm">Disponible Q3 2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Primeros Pasos
            </h2>
            <p className="text-xl text-gray-600">
              Sigue esta guía para empezar con RecetasAPI desde cero
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start space-x-4 p-6 bg-white border border-gray-200 rounded-lg">
              <div className="bg-blue-600 text-white rounded-full p-2 flex-shrink-0">
                <span className="text-sm font-bold">1</span>
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Registro y Configuración</h3>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-gray-600 mb-3">
                  Crea tu cuenta, configura los datos de tu restaurante y añade usuarios del equipo.
                </p>
                <Link href="/demo" className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  Empezar ahora →
                </Link>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white border border-gray-200 rounded-lg">
              <div className="bg-blue-600 text-white rounded-full p-2 flex-shrink-0">
                <span className="text-sm font-bold">2</span>
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Importar Datos</h3>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-gray-600 mb-3">
                  Migra tus datos existentes (recetas, ingredientes, proveedores) a RecetasAPI.
                </p>
                <Link href="/contact" className="text-blue-600 text-sm font-medium hover:text-blue-700">
                  Solicitar ayuda →
                </Link>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white border border-gray-200 rounded-lg">
              <div className="bg-blue-600 text-white rounded-full p-2 flex-shrink-0">
                <span className="text-sm font-bold">3</span>
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Primer Evento</h3>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-gray-600 mb-3">
                  Crea tu primer evento o banquete y familiarízate con el flujo de trabajo.
                </p>
                <span className="text-gray-400 text-sm">
                  Disponible con RecipesAPI
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 bg-white border border-gray-200 rounded-lg opacity-75">
              <div className="bg-gray-400 text-white rounded-full p-2 flex-shrink-0">
                <span className="text-sm font-bold">4</span>
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Expandir Funcionalidades</h3>
                <p className="text-gray-600 mb-3">
                  Activa el Sistema de Reservas y la Carta Digital cuando estén disponibles.
                </p>
                <span className="text-gray-400 text-sm">
                  Próximamente Q2-Q3 2025
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Necesitas ayuda personalizada?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Nuestro equipo de soporte está aquí para ayudarte en cada paso del camino
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contactar Soporte
            </Link>
            <Link
              href="/demo"
              className="border border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Agendar Demo Personal
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}