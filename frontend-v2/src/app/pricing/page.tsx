import Link from 'next/link'
import { Check, Star, ArrowRight } from 'lucide-react'

export default function PreciosPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-amber-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Planes y Precios
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Elige el plan que mejor se adapte a tu restaurante. Sin compromisos a largo plazo, 
              cancela cuando quieras.
            </p>
            <div className="flex justify-center items-center space-x-4">
              <span className="text-gray-600">Mensual</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" />
                <div className="w-14 h-8 bg-gray-200 rounded-full cursor-pointer">
                  <div className="w-6 h-6 bg-white rounded-full shadow-md transform transition-transform translate-x-1 translate-y-1"></div>
                </div>
              </div>
              <span className="text-gray-900 font-semibold">Anual</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">
                2 meses gratis
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Plan Básico */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Básico</h3>
                <p className="text-gray-600 mb-6">Perfecto para restaurantes pequeños</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">49€</span>
                  <span className="text-gray-600">/mes</span>
                </div>
                <Link
                  href="/demo"
                  className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors block text-center"
                >
                  Empezar Prueba Gratuita
                </Link>
              </div>
              
              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-4">Incluye:</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">RecipesAPI completo</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Hasta 50 recetas</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Gestión de eventos básica</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Control de inventario</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Soporte por email</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">1 usuario</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Plan Profesional */}
            <div className="bg-white border-2 border-orange-500 rounded-2xl p-8 shadow-lg relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Star className="h-4 w-4" /> Más Popular
                </span>
              </div>
              
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Profesional</h3>
                <p className="text-gray-600 mb-6">Ideal para restaurantes en crecimiento</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">89€</span>
                  <span className="text-gray-600">/mes</span>
                </div>
                <Link
                  href="/demo"
                  className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors block text-center"
                >
                  Empezar Prueba Gratuita
                </Link>
              </div>
              
              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-4">Todo en Básico, plus:</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Recetas ilimitadas</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Sistema de Reservas completo</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Gestión de eventos avanzada</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Analytics y reportes</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Soporte prioritario</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Hasta 5 usuarios</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Plan Enterprise */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <p className="text-gray-600 mb-6">Para cadenas y grandes restaurantes</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">199€</span>
                  <span className="text-gray-600">/mes</span>
                </div>
                <Link
                  href="/demo"
                  className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors block text-center"
                >
                  Empezar Prueba Gratuita
                </Link>
              </div>
              
              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-4">Todo en Profesional, plus:</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Carta Digital completa</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Múltiples ubicaciones</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">API personalizada</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Integraciones avanzadas</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Soporte 24/7</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Usuarios ilimitados</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Timeline */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Hoja de Ruta de Productos
            </h2>
            <p className="text-xl text-gray-600">
              Así es como evolucionarán nuestros planes con el lanzamiento de nuevas aplicaciones
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Q1 2025 - RecipesAPI</h3>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Disponible Pronto
                </span>
              </div>
              <p className="text-gray-600 mb-4">
                Lanzamiento de RecipesAPI con gestión completa de eventos, recetas, inventario y pedidos.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Todos los planes incluirán RecipesAPI</li>
                <li>• Precios de lanzamiento con descuentos especiales</li>
                <li>• Acceso anticipado para early adopters</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Q2 2025 - Sistema de Reservas</h3>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                  En Desarrollo
                </span>
              </div>
              <p className="text-gray-600 mb-4">
                Integración del sistema de reservas para optimizar la ocupación y mejorar la experiencia del cliente.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Incluido en planes Profesional y Enterprise</li>
                <li>• Upgrade disponible para plan Básico (+19€/mes)</li>
                <li>• Beta testing con clientes existentes</li>
              </ul>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Q3 2025 - Carta Digital</h3>
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                  Planificado
                </span>
              </div>
              <p className="text-gray-600 mb-4">
                Completamos el kit con la Carta Digital, ofreciendo menús interactivos con códigos QR.
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Incluido solo en plan Enterprise</li>
                <li>• Add-on para otros planes (+15€/mes)</li>
                <li>• Diseños personalizables y multi-idioma</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Puedo cambiar de plan en cualquier momento?
              </h3>
              <p className="text-gray-600">
                Sí, puedes cambiar tu plan hacia arriba o hacia abajo en cualquier momento. 
                Los cambios se aplican inmediatamente y ajustamos la facturación de forma proporcional.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Qué incluye la prueba gratuita?
              </h3>
              <p className="text-gray-600">
                Ofrecemos 14 días gratuitos del plan Profesional con acceso completo a todas las 
                funciones disponibles. No se requiere tarjeta de crédito para empezar.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Los precios cambiarán cuando lancen nuevas aplicaciones?
              </h3>
              <p className="text-gray-600">
                Los clientes existentes mantendrán sus precios actuales. Los nuevos clientes 
                accederán a precios actualizados que reflejen el valor completo del kit de aplicaciones.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿Ofrecen descuentos para pagos anuales?
              </h3>
              <p className="text-gray-600">
                Sí, el pago anual incluye 2 meses gratuitos (equivalente a 17% de descuento). 
                También ofrecemos descuentos especiales para múltiples ubicaciones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-orange-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Comienza tu prueba gratuita hoy y descubre cómo TotXo puede transformar tu restaurante
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="bg-white text-orange-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              Empezar Prueba Gratuita <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="border border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Hablar con Ventas
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}