'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Star, ArrowRight } from 'lucide-react'

interface SubscriptionPlan {
  plan_id: string
  plan_name: string
  plan_slug: string
  plan_description: string
  plan_color: string
  sort_order: number
  is_public: boolean
  is_popular: boolean
  monthly_price_cents: number
  yearly_price_cents: number
  yearly_discount_percentage: number
  max_users: number
  max_recipes: number
  max_events: number
  max_storage_mb: number
  max_api_calls_monthly: number
  support_level: string
  has_analytics: boolean
  has_multi_location: boolean
  has_custom_api: boolean
  has_white_label: boolean
  features: string[]
  is_active: boolean
  price_monthly: number
  price_yearly: number
  yearly_savings: number
}

export default function PreciosPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isYearly, setIsYearly] = useState(false)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/public/plans')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            // Filtrar solo planes públicos y activos, ordenados por sort_order
            const publicPlans = data.data
              .filter((plan: SubscriptionPlan) => plan.is_public && plan.is_active)
              .sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.sort_order - b.sort_order)
            setPlans(publicPlans)
          } else {
            setError('Error al cargar los planes')
          }
        } else {
          setError('Error de conexión')
        }
      } catch (err) {
        console.error('Error fetching plans:', err)
        setError('Error al cargar los planes')
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  const formatPrice = (plan: SubscriptionPlan) => {
    const price = isYearly ? plan.price_yearly : plan.price_monthly
    if (price === 0) return 'Gratis'
    return `${price}€`
  }

  const getPlanColorClasses = (color: string, isPopular: boolean) => {
    if (isPopular) {
      return {
        border: 'border-2 border-orange-500',
        button: 'bg-orange-600 hover:bg-orange-700',
        card: 'shadow-lg'
      }
    }
    
    const colorMap: Record<string, any> = {
      gray: { border: 'border border-gray-200', button: 'bg-gray-900 hover:bg-gray-800', card: 'shadow-sm' },
      blue: { border: 'border border-blue-200', button: 'bg-blue-600 hover:bg-blue-700', card: 'shadow-sm' },
      purple: { border: 'border border-purple-200', button: 'bg-purple-600 hover:bg-purple-700', card: 'shadow-sm' },
      amber: { border: 'border border-amber-200', button: 'bg-amber-600 hover:bg-amber-700', card: 'shadow-sm' },
      green: { border: 'border border-green-200', button: 'bg-green-600 hover:bg-green-700', card: 'shadow-sm' },
      red: { border: 'border border-red-200', button: 'bg-red-600 hover:bg-red-700', card: 'shadow-sm' }
    }
    
    return colorMap[color] || colorMap.gray
  }
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
              <span className={`transition-colors ${!isYearly ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                Mensual
              </span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={isYearly}
                  onChange={(e) => setIsYearly(e.target.checked)}
                />
                <div 
                  className="w-14 h-8 bg-gray-200 rounded-full cursor-pointer"
                  onClick={() => setIsYearly(!isYearly)}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform translate-y-1 ${
                    isYearly ? 'translate-x-7' : 'translate-x-1'
                  }`}></div>
                </div>
              </div>
              <span className={`transition-colors ${isYearly ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                Anual
              </span>
              <span className={`px-2 py-1 rounded-full text-sm font-semibold transition-all duration-200 ${
                isYearly 
                  ? 'bg-green-100 text-green-800 opacity-100' 
                  : 'bg-transparent text-transparent opacity-0'
              }`}>
                2 meses gratis
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${plans.length === 3 ? 'md:grid-cols-3' : plans.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'} gap-8`}>
              {plans.map((plan) => {
                const colorClasses = getPlanColorClasses(plan.plan_color, plan.is_popular)
                
                return (
                  <div
                    key={plan.plan_id}
                    className={`bg-white ${colorClasses.border} rounded-2xl p-8 ${colorClasses.card} relative`}
                  >
                    {plan.is_popular && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Star className="h-4 w-4" /> Más Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.plan_name}</h3>
                      <p className="text-gray-600 mb-6">{plan.plan_description}</p>
                      <div className="mb-6">
                        <span className="text-4xl font-bold text-gray-900">{formatPrice(plan)}</span>
                        {plan.price_monthly > 0 && (
                          <span className="text-gray-600">/{isYearly ? 'año' : 'mes'}</span>
                        )}
                        {isYearly && plan.yearly_savings > 0 && (
                          <div className="text-sm text-green-600 mt-1">
                            Ahorras {plan.yearly_savings}€ al año
                          </div>
                        )}
                      </div>
                      <Link
                        href="/demo"
                        className={`w-full ${colorClasses.button} text-white px-6 py-3 rounded-lg font-semibold transition-colors block text-center`}
                      >
                        Empezar Prueba Gratuita
                      </Link>
                    </div>
                    
                    <div className="mt-8">
                      <h4 className="font-semibold text-gray-900 mb-4">Incluye:</h4>
                      <ul className="space-y-3">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {/* Información técnica adicional */}
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="space-y-2 text-sm text-gray-500">
                          <div>Usuarios: {plan.max_users === -1 ? 'Ilimitados' : plan.max_users}</div>
                          <div>Recetas: {plan.max_recipes === -1 ? 'Ilimitadas' : plan.max_recipes}</div>
                          <div>Eventos: {plan.max_events === -1 ? 'Ilimitados' : plan.max_events}</div>
                          <div>Soporte: {plan.support_level === 'email' ? 'Email' : plan.support_level === 'priority' ? 'Prioritario' : '24/7'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
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