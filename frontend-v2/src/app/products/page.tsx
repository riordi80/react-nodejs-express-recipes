import Link from 'next/link'
import { ArrowRight, Calendar, ClipboardList, QrCode, Check, Star } from 'lucide-react'

export default function ProductosPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Nuestros Productos
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre las tres aplicaciones que transformarán la gestión de tu restaurante. 
              Cada una diseñada para resolver desafíos específicos del sector gastronómico.
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-20">
            
            {/* RecetasAPI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center mb-6">
                  <div className="bg-blue-600 rounded-lg p-3 mr-4">
                    <ClipboardList className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">RecetasAPI</h2>
                    <p className="text-blue-600 font-semibold">Control total de tu operación</p>
                  </div>
                </div>
                
                <p className="text-lg text-gray-600 mb-6">
                  La primera aplicación de nuestro kit, ya casi lista para el lanzamiento. 
                  Una plataforma completa para gestionar todos los aspectos internos de tu 
                  restaurante, desde eventos hasta el control de inventario.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Gestión de Eventos y Catering</h4>
                      <p className="text-gray-600">Organiza banquetes, eventos especiales y servicios de catering</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Control de Inventario</h4>
                      <p className="text-gray-600">Monitorea ingredientes, stock y proveedores en tiempo real</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Gestión de Recetas y Costos</h4>
                      <p className="text-gray-600">Calcula costos exactos y optimiza tus recetas</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Gestión de Pedidos</h4>
                      <p className="text-gray-600">Procesa y organiza pedidos de manera eficiente</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="#"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    Ver Demo <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/contact"
                    className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
                  >
                    Más Información
                  </Link>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Casi Listo
                    </span>
                    <div className="flex">
                      {[1,2,3,4,5].map((star) => (
                        <Star key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Estado del Proyecto</h3>
                  <p className="text-gray-600 mb-4">
                    RecetasAPI está en fase final de desarrollo y será el primero 
                    en lanzarse al mercado.
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div className="bg-blue-600 h-3 rounded-full" style={{width: '90%'}}></div>
                  </div>
                  <p className="text-sm text-gray-500">90% completado</p>
                </div>
              </div>
            </div>

            {/* Sistema de Reservas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8">
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                        En Planificación
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Próximamente</h3>
                    <p className="text-gray-600 mb-4">
                      El sistema de reservas será nuestra segunda aplicación, enfocada 
                      en optimizar la gestión de mesas y mejorar la experiencia del cliente.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Diseño UX/UI</span>
                        <span className="text-gray-500">Próximamente</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Desarrollo Backend</span>
                        <span className="text-gray-500">Próximamente</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Integración con API</span>
                        <span className="text-gray-500">Próximamente</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="flex items-center mb-6">
                  <div className="bg-green-600 rounded-lg p-3 mr-4">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Sistema de Reservas</h2>
                    <p className="text-green-600 font-semibold">Optimiza la ocupación de tu restaurante</p>
                  </div>
                </div>
                
                <p className="text-lg text-gray-600 mb-6">
                  Un sistema completo de reservas online que permitirá a tus clientes 
                  reservar mesa las 24 horas del día, mientras tú mantienes el control 
                  total sobre la disponibilidad y optimizas la ocupación.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Reservas Online 24/7</h4>
                      <p className="text-gray-600">Interface intuitiva para que los clientes reserven cuando quieran</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Gestión Inteligente de Mesas</h4>
                      <p className="text-gray-600">Optimiza automáticamente la distribución de mesas</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Notificaciones Automáticas</h4>
                      <p className="text-gray-600">Confirmaciones, recordatorios y actualizaciones por SMS/email</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Analytics de Ocupación</h4>
                      <p className="text-gray-600">Reportes detallados para optimizar tu negocio</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/contact"
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                  >
                    Solicitar Información
                  </Link>
                  <Link
                    href="/prices"
                    className="border border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors text-center"
                  >
                    Ver Precios
                  </Link>
                </div>
              </div>
            </div>

            {/* Carta Digital */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center mb-6">
                  <div className="bg-purple-600 rounded-lg p-3 mr-4">
                    <QrCode className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Carta Digital</h2>
                    <p className="text-purple-600 font-semibold">Experiencia moderna para tus clientes</p>
                  </div>
                </div>
                
                <p className="text-lg text-gray-600 mb-6">
                  Moderniza la experiencia de tus clientes con cartas digitales 
                  accesibles mediante códigos QR. Actualiza precios y menús al 
                  instante, sin costos de impresión.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Códigos QR Personalizados</h4>
                      <p className="text-gray-600">Diseños únicos que reflejan la identidad de tu restaurante</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Actualizaciones en Tiempo Real</h4>
                      <p className="text-gray-600">Cambia precios, platos y disponibilidad instantáneamente</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Diseño Responsive</h4>
                      <p className="text-gray-600">Perfecta visualización en cualquier dispositivo móvil</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Múltiples Idiomas</h4>
                      <p className="text-gray-600">Atiende a clientes internacionales sin barreras</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/contact"
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-center"
                  >
                    Solicitar Información
                  </Link>
                  <Link
                    href="/prices"
                    className="border border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-center"
                  >
                    Ver Precios
                  </Link>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-8">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                      En Planificación
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">Próximamente</h3>
                  <p className="text-gray-600 mb-4">
                    La Carta Digital será nuestra tercera aplicación, diseñada para 
                    digitalizar completamente la experiencia del menú.
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Investigación UX</span>
                      <span className="text-gray-500">Próximamente</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Generador de QR</span>
                      <span className="text-gray-500">Próximamente</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Editor de Menús</span>
                      <span className="text-gray-500">Próximamente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Interesado en nuestras soluciones?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Mantente informado sobre el lanzamiento de nuestros productos y sé el primero en probarlos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              Solicitar Demo de RecetasAPI
            </Link>
            <Link
              href="/contact"
              className="border border-gray-300 text-gray-300 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Contactar con el Equipo
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}