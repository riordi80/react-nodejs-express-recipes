'use client'

import React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Mail, Phone, Play, Check, Clock, Users, Star } from 'lucide-react'

export default function DemoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    employees: '',
    timeSlot: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Demo request submitted:', formData)
    // Aquí implementarías el envío del formulario
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-amber-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Solicita una Demo Personalizada
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Descubre cómo RecetasAPI puede transformar la gestión de tu restaurante. 
              Agenda una demostración personalizada de 30 minutos con nuestro equipo.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-600" />
                30 minutos
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-orange-600" />
                1 a 1 personalizada
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-orange-600" />
                Sin compromiso
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Demo Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Agenda tu demostración
              </h2>
              <p className="text-gray-600 mb-8">
                Completa este formulario y nos pondremos en contacto contigo en menos de 2 horas 
                para confirmar la fecha y hora de tu demo personalizada.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Restaurante/Empresa *
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      required
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="Nombre de tu restaurante"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="employees" className="block text-sm font-medium text-gray-700 mb-2">
                      Número de empleados
                    </label>
                    <select
                      id="employees"
                      name="employees"
                      value={formData.employees}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Selecciona tamaño</option>
                      <option value="1-5">1-5 empleados</option>
                      <option value="6-15">6-15 empleados</option>
                      <option value="16-50">16-50 empleados</option>
                      <option value="50+">Más de 50 empleados</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700 mb-2">
                      Horario preferido
                    </label>
                    <select
                      id="timeSlot"
                      name="timeSlot"
                      value={formData.timeSlot}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Selecciona horario</option>
                      <option value="morning">Mañana (9:00 - 12:00)</option>
                      <option value="afternoon">Tarde (12:00 - 16:00)</option>
                      <option value="evening">Noche (16:00 - 18:00)</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Cuéntanos sobre tu restaurante
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors resize-none"
                    placeholder="Tipo de restaurante, principales desafíos, qué te interesa más de RecetasAPI..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="h-5 w-5" />
                  Solicitar Demo
                </button>

                <p className="text-sm text-gray-500 text-center">
                  * Al solicitar la demo, aceptas que nos pongamos en contacto contigo para programar la sesión.
                </p>
              </form>
            </div>

            {/* Demo Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                ¿Qué incluye la demo?
              </h2>
              
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-8 mb-8">
                <div className="flex items-center mb-4">
                  <Play className="h-8 w-8 text-orange-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">Demo en Vivo de RecetasAPI</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Te mostraremos en directo todas las funcionalidades de RecetasAPI, 
                  el sistema de gestión gastronómica más completo del mercado.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center text-gray-700">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Gestión completa de recetas y costos
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Control de inventario en tiempo real
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Gestión de proveedores y pedidos
                  </li>
                  <li className="flex items-center text-gray-700">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    Planificación de eventos y catering
                  </li>
                </ul>
              </div>

              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-5 w-5 text-orange-600 mr-2" />
                    1. Análisis de Necesidades (10 min)
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Conversamos sobre tu restaurante, tipo de negocio, tamaño del equipo y principales desafíos actuales.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Play className="h-5 w-5 text-orange-600 mr-2" />
                    2. Demostración en Vivo (15 min)
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Te mostramos RecetasAPI funcionando con ejemplos reales adaptados a tu tipo de restaurante.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Mail className="h-5 w-5 text-orange-600 mr-2" />
                    3. Próximos Pasos (5 min)
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Discutimos precios, timeline de implementación y resolvemos cualquier duda que tengas.
                  </p>
                </div>
              </div>

              {/* Testimonial */}
              <div className="bg-gray-50 rounded-lg p-6 mt-8">
                <div className="flex items-center mb-4">
                  <div className="bg-orange-100 rounded-full p-2 mr-3">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Demo personalizada</p>
                    <p className="text-sm text-gray-600">Adaptada a tu negocio</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm italic">
                  &ldquo;La demo me ayudó a entender exactamente cómo RecetasAPI podría resolver 
                  los problemas específicos de mi restaurante. El equipo realmente conoce 
                  el sector gastronómico.&rdquo;
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  - Restaurante Casa Mediterránea
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué solicitar una demo?
            </h2>
            <p className="text-xl text-gray-600">
              Entendemos que cada restaurante es único
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalización</h3>
              <p className="text-gray-600">
                Adaptamos la demostración a tu tipo de restaurante y necesidades específicas
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Phone className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Directo</h3>
              <p className="text-gray-600">
                Habla directamente con nuestro equipo y resuelve todas tus dudas en tiempo real
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Star className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin Compromiso</h3>
              <p className="text-gray-600">
                Demo completamente gratuita sin presión comercial. Solo queremos ayudarte
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative Contact */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Prefieres otro método de contacto?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Estamos disponibles por múltiples canales para atenderte
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="border border-orange-600 text-orange-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
            >
              <Mail className="h-5 w-5" />
              Enviar Email
            </Link>
            <a
              href="tel:+34900123456"
              className="border border-orange-600 text-orange-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="h-5 w-5" />
              Llamar Ahora
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}