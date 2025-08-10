import Link from 'next/link'
import { CheckCircle, ArrowRight, Clock, Users, Settings, PlayCircle, BookOpen, MessageCircle, AlertTriangle } from 'lucide-react'

export default function GuiaInicioPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Guía de Inicio
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Todo lo que necesitas saber para empezar con RecetasAPI. 
              Desde la configuración inicial hasta tu primer evento exitoso.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                15-20 minutos
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Para principiantes
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                Paso a paso
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Bar */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white rounded-full p-2">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-900">Configuración</span>
            </div>
            <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full">
              <div className="h-2 bg-blue-600 rounded-full" style={{width: '25%'}}></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gray-200 text-gray-500 rounded-full p-2">
                <Settings className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-500">Datos</span>
            </div>
            <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full"></div>
            <div className="flex items-center space-x-4">
              <div className="bg-gray-200 text-gray-500 rounded-full p-2">
                <PlayCircle className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-500">Primer Evento</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Prerequisites */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-12">
            <h2 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Antes de empezar
            </h2>
            <div className="space-y-2 text-blue-800">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                <span>Tener una cuenta activa de RecetasAPI</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                <span>Acceso a RecipesAPI (disponible próximamente)</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                <span>Información básica de tu restaurante a mano</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>¿Aún no tienes cuenta?</strong>{' '}
                <Link href="/register" className="underline hover:text-blue-800">
                  Regístrate aquí
                </Link>{' '}
                para obtener acceso anticipado con precios especiales.
              </p>
            </div>
          </div>

          {/* Step 1: Account Setup */}
          <div className="mb-16">
            <div className="flex items-center mb-6">
              <div className="bg-blue-600 text-white rounded-full p-3 mr-4">
                <span className="text-lg font-bold">1</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Configuración de Cuenta</h2>
                <p className="text-gray-600">Personaliza tu perfil y configuración inicial</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información del Restaurante
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Datos básicos</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Nombre del restaurante</li>
                      <li>• Dirección completa</li>
                      <li>• Teléfono y email de contacto</li>
                      <li>• Tipo de cocina/especialidad</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Configuración operativa</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Horarios de apertura</li>
                      <li>• Capacidad máxima</li>
                      <li>• Moneda y zona horaria</li>
                    </ul>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">💡 Consejo</h4>
                  <p className="text-sm text-gray-600">
                    Completa toda la información desde el principio. Esto te ahorrará tiempo 
                    más adelante y mejorará la precisión de los reportes.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Gestión de Usuarios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Invitar al equipo</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Añade a los miembros de tu equipo con diferentes niveles de acceso:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Administrador:</strong> Acceso completo</li>
                    <li>• <strong>Gerente:</strong> Sin configuración de cuenta</li>
                    <li>• <strong>Empleado:</strong> Solo funciones operativas</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Permisos recomendados</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>Chef ejecutivo</span>
                      <span className="text-blue-600 font-medium">Gerente</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>Maître</span>
                      <span className="text-blue-600 font-medium">Gerente</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>Camareros</span>
                      <span className="text-blue-600 font-medium">Empleado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Data Import */}
          <div className="mb-16">
            <div className="flex items-center mb-6">
              <div className="bg-blue-600 text-white rounded-full p-3 mr-4">
                <span className="text-lg font-bold">2</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Importación de Datos</h2>
                <p className="text-gray-600">Migra tu información existente a RecetasAPI</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recetas e Ingredientes
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Opción 1: Importación automática</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Sube un archivo Excel o CSV con tus recetas actuales.
                    </p>
                    <button className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      Descargar plantilla
                    </button>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Opción 2: Entrada manual</h4>
                    <p className="text-sm text-gray-600">
                      Añade recetas una por una usando nuestro editor intuitivo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Proveedores y Precios
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Información necesaria</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Nombre y contacto del proveedor</li>
                      <li>• Lista de productos que suministra</li>
                      <li>• Precios actuales por unidad</li>
                      <li>• Unidades de medida (kg, L, unidades)</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>💡 Tip:</strong> Empieza con tus 20 ingredientes más utilizados. 
                      Podrás añadir más después.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">
                🎯 Asistencia gratuita
              </h3>
              <p className="text-green-800 mb-4">
                Nuestro equipo puede ayudarte a migrar tus datos sin costo adicional. 
                Esto incluye la limpieza y estructuración de tu información.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-800"
              >
                Solicitar ayuda con la migración <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Step 3: First Event */}
          <div className="mb-16">
            <div className="flex items-center mb-6">
              <div className="bg-blue-600 text-white rounded-full p-3 mr-4">
                <span className="text-lg font-bold">3</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tu Primer Evento</h2>
                <p className="text-gray-600">Crea y gestiona tu primer evento en RecetasAPI</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Evento de Prueba Recomendado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Características sugeridas</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Tipo:</strong> Cena privada pequeña</li>
                    <li>• <strong>Invitados:</strong> 10-15 personas</li>
                    <li>• <strong>Menú:</strong> 3 platos que ya conoces bien</li>
                    <li>• <strong>Fecha:</strong> En los próximos 7-10 días</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Objetivos del ejercicio</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Familiarizarte con la interfaz</li>
                    <li>• Probar el cálculo de costos</li>
                    <li>• Generar tu primer reporte</li>
                    <li>• Identificar áreas de mejora</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Paso 3.1: Crear el evento</h4>
                <p className="text-gray-600 mb-4">
                  Usa el botón &ldquo;Nuevo Evento&rdquo; en tu dashboard y completa la información básica:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <strong>Información general</strong><br/>
                    Nombre, fecha, hora, número de invitados
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <strong>Detalles del cliente</strong><br/>
                    Contacto, preferencias, restricciones
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <strong>Configuración</strong><br/>
                    Tipo de servicio, ubicación, equipamiento
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Paso 3.2: Diseñar el menú</h4>
                <p className="text-gray-600 mb-4">
                  Selecciona los platos desde tu biblioteca de recetas o crea nuevas:
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm">Entrante: Ensalada de temporada</span>
                    <span className="text-sm text-green-600 font-medium">3.50€/persona</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm">Principal: Salmón a la plancha</span>
                    <span className="text-sm text-green-600 font-medium">12.80€/persona</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm">Postre: Tarta de chocolate</span>
                    <span className="text-sm text-green-600 font-medium">4.20€/persona</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                    <span className="text-sm font-semibold">Costo total por persona</span>
                    <span className="text-sm text-blue-600 font-bold">20.50€</span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Paso 3.3: Revisar y confirmar</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-600 mb-4">
                      Antes de finalizar, revisa todos los detalles:
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Costo total de ingredientes</li>
                      <li>• Margen de beneficio</li>
                      <li>• Lista de compras generada</li>
                      <li>• Timeline de preparación</li>
                    </ul>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">✅ Lista de verificación</h5>
                    <div className="space-y-1 text-sm text-green-800">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Información del cliente completa
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Menú definido y costeado
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Ingredientes disponibles
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Precio final acordado
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🎉 ¡Felicitaciones!
            </h2>
            <p className="text-gray-600 mb-6">
              Has completado la configuración básica de RecetasAPI. Ahora estás listo para 
              aprovechar al máximo todas las funcionalidades del sistema.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos pasos recomendados:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Link
                  href="/docs/tutorials"
                  className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors group"
                >
                  <PlayCircle className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-blue-600">Ver tutoriales en video</div>
                    <div className="text-sm text-gray-500">Aprende funcionalidades avanzadas</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>

                <Link
                  href="/docs"
                  className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors group"
                >
                  <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-blue-600">Explorar documentación</div>
                    <div className="text-sm text-gray-500">Guías detalladas por función</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>
              </div>

              <div className="space-y-3">
                <Link
                  href="/contact"
                  className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors group"
                >
                  <MessageCircle className="h-6 w-6 text-blue-600 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-blue-600">Contactar soporte</div>
                    <div className="text-sm text-gray-500">Resolver dudas específicas</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                </Link>

                <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200 opacity-75">
                  <Settings className="h-6 w-6 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-500">Configuración avanzada</div>
                    <div className="text-sm text-gray-400">Disponible próximamente</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}