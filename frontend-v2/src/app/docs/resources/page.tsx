import Link from 'next/link'
import { Download, FileText, Calculator, CheckSquare, BarChart3, BookOpen, ExternalLink, Star, Users } from 'lucide-react'

interface Resource {
  id: string
  title: string
  description: string
  type: 'Template' | 'Guide' | 'Checklist' | 'Calculator' | 'Report'
  category: string
  format: string
  size?: string
  downloads: string
  rating: number
  available: boolean
  comingSoon?: boolean
  featured?: boolean
}

const resources: Resource[] = [
  {
    id: '1',
    title: 'Plantilla de Importación de Recetas',
    description: 'Archivo Excel pre-formateado para importar todas tus recetas existentes a RecetasAPI de forma masiva.',
    type: 'Template',
    category: 'Configuración',
    format: 'Excel (.xlsx)',
    size: '45 KB',
    downloads: '1.2k',
    rating: 4.8,
    available: true,
    featured: true
  },
  {
    id: '2',
    title: 'Calculadora de Costos de Menú',
    description: 'Herramienta offline para calcular precios óptimos basados en costos de ingredientes y margen deseado.',
    type: 'Calculator',
    category: 'Costos',
    format: 'Excel (.xlsx)',
    size: '128 KB',
    downloads: '987',
    rating: 4.9,
    available: true,
    featured: true
  },
  {
    id: '3',
    title: 'Checklist de Configuración Inicial',
    description: 'Lista verificable con todos los pasos necesarios para configurar RecetasAPI correctamente.',
    type: 'Checklist',
    category: 'Configuración',
    format: 'PDF',
    size: '2.1 MB',
    downloads: '856',
    rating: 4.7,
    available: true
  },
  {
    id: '4',
    title: 'Guía de Mejores Prácticas',
    description: 'Documento completo con consejos de expertos para optimizar la gestión de tu restaurante.',
    type: 'Guide',
    category: 'Gestión',
    format: 'PDF',
    size: '8.7 MB',
    downloads: '643',
    rating: 4.6,
    available: true
  },
  {
    id: '5',
    title: 'Plantilla de Análisis de Proveedores',
    description: 'Compara precios, calidad y condiciones de diferentes proveedores para tomar mejores decisiones.',
    type: 'Template',
    category: 'Proveedores',
    format: 'Excel (.xlsx)',
    size: '67 KB',
    downloads: '521',
    rating: 4.5,
    available: true
  },
  {
    id: '6',
    title: 'Reporte de Rentabilidad por Plato',
    description: 'Template para analizar qué platos generan más beneficio y optimizar tu carta.',
    type: 'Report',
    category: 'Análisis',
    format: 'Excel (.xlsx)',
    size: '89 KB',
    downloads: '434',
    rating: 4.4,
    available: true
  },
  {
    id: '7',
    title: 'Guía de Planificación de Eventos',
    description: 'Metodología paso a paso para planificar eventos exitosos desde la cotización hasta la ejecución.',
    type: 'Guide',
    category: 'Eventos',
    format: 'PDF',
    size: '5.2 MB',
    downloads: '378',
    rating: 4.8,
    available: true
  },
  {
    id: '8',
    title: 'Calculadora de Personal para Eventos',
    description: 'Determina cuánto personal necesitas según el tipo y tamaño del evento.',
    type: 'Calculator',
    category: 'Eventos',
    format: 'Excel (.xlsx)',
    size: '54 KB',
    downloads: '291',
    rating: 4.3,
    available: true
  },
  {
    id: '9',
    title: 'Template de Configuración de Reservas',
    description: 'Plantilla para configurar horarios, mesas y restricciones del sistema de reservas.',
    type: 'Template',
    category: 'Reservas',
    format: 'Excel (.xlsx)',
    size: '73 KB',
    downloads: '0',
    rating: 0,
    available: false,
    comingSoon: true
  },
  {
    id: '10',
    title: 'Guía de Diseño de Cartas Digitales',
    description: 'Mejores prácticas para crear cartas digitales atractivas y fáciles de usar.',
    type: 'Guide',
    category: 'Carta Digital',
    format: 'PDF',
    size: '6.8 MB',
    downloads: '0',
    rating: 0,
    available: false,
    comingSoon: true
  }
]

const categories = ['Todos', 'Configuración', 'Costos', 'Gestión', 'Proveedores', 'Análisis', 'Eventos', 'Reservas', 'Carta Digital']

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'Template': return FileText
    case 'Guide': return BookOpen
    case 'Checklist': return CheckSquare
    case 'Calculator': return Calculator
    case 'Report': return BarChart3
    default: return FileText
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'Template': return 'bg-blue-100 text-blue-800'
    case 'Guide': return 'bg-green-100 text-green-800'
    case 'Checklist': return 'bg-purple-100 text-purple-800'
    case 'Calculator': return 'bg-orange-100 text-orange-800'
    case 'Report': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function RecursosPage() {
  const availableResources = resources.filter(r => r.available)
  const comingSoonResources = resources.filter(r => r.comingSoon)
  const featuredResources = resources.filter(r => r.featured)

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 to-violet-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Recursos y Descargas
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Plantillas, guías, calculadoras y herramientas gratuitas para optimizar 
              la gestión de tu restaurante, incluso antes de usar RecetasAPI.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Download className="h-5 w-5 mr-2 text-purple-600" />
                {availableResources.length} recursos disponibles
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-600" />
                Más de 5k descargas
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-purple-600" />
                100% gratuito
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Resources */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Recursos Destacados</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredResources.map(resource => {
              const IconComponent = getTypeIcon(resource.type)
              return (
                <div key={resource.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-600 rounded-lg p-3">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                      Destacado
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {resource.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{resource.format}</span>
                      <span>{resource.size}</span>
                      <div className="flex items-center">
                        <Download className="h-4 w-4 mr-1" />
                        {resource.downloads}
                      </div>
                    </div>
                    <div className="flex items-center text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{resource.rating}</span>
                    </div>
                  </div>
                  
                  <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                    <Download className="h-5 w-5 mr-2" />
                    Descargar Gratis
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* All Resources */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Todos los Recursos
            </h2>
            <span className="text-gray-600">
              {availableResources.length} recursos disponibles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableResources.map(resource => {
              const IconComponent = getTypeIcon(resource.type)
              return (
                <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-gray-100 rounded-lg p-2">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(resource.type)}`}>
                      {resource.type}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {resource.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {resource.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4 text-xs text-gray-500">
                    <span>{resource.format}</span>
                    <span>{resource.size}</span>
                    <div className="flex items-center">
                      <Download className="h-3 w-3 mr-1" />
                      {resource.downloads}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{resource.rating}</span>
                    </div>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors flex items-center">
                      <Download className="h-4 w-4 mr-1" />
                      Descargar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      {comingSoonResources.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Próximamente
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comingSoonResources.map(resource => {
                const IconComponent = getTypeIcon(resource.type)
                return (
                  <div key={resource.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 opacity-75">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-gray-100 rounded-lg p-2">
                        <IconComponent className="h-5 w-5 text-gray-400" />
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                        Próximamente
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {resource.title}
                    </h3>
                    
                    <p className="text-gray-500 text-sm mb-4">
                      {resource.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
                      <span>{resource.format}</span>
                      <span>{resource.size}</span>
                    </div>
                    
                    <button 
                      disabled 
                      className="w-full bg-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm font-semibold cursor-not-allowed"
                    >
                      Disponible pronto
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Categories Overview */}
      <section className="py-20 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Explora por Categoría
            </h2>
            <p className="text-xl text-gray-600">
              Encuentra recursos específicos para cada área de tu negocio
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.slice(1).map(category => {
              const categoryResources = availableResources.filter(r => r.category === category)
              return (
                <div key={category} className="bg-white rounded-lg p-6 text-center border border-gray-200 hover:border-purple-300 transition-colors">
                  <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{category}</h3>
                  <p className="text-sm text-gray-600">
                    {categoryResources.length} recurso{categoryResources.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Cómo Usar Estos Recursos
            </h2>
            <p className="text-xl text-gray-600">
              Aprovecha al máximo nuestras herramientas gratuitas
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-start space-x-6">
              <div className="bg-purple-600 text-white rounded-full p-3 flex-shrink-0">
                <span className="text-lg font-bold">1</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Descarga lo que necesites</h3>
                <p className="text-gray-600">
                  Todos nuestros recursos son completamente gratuitos. No necesitas cuenta ni registro 
                  para descargarlos.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="bg-purple-600 text-white rounded-full p-3 flex-shrink-0">
                <span className="text-lg font-bold">2</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Personaliza según tu negocio</h3>
                <p className="text-gray-600">
                  Las plantillas están diseñadas para ser adaptadas. Modifica colores, añade tu logo 
                  y ajusta los contenidos a tu restaurante.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-6">
              <div className="bg-purple-600 text-white rounded-full p-3 flex-shrink-0">
                <span className="text-lg font-bold">3</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Implementa y mejora</h3>
                <p className="text-gray-600">
                  Usa las herramientas en tu día a día. Cuando estés listo para automatizar, 
                  RecetasAPI puede importar y sincronizar todos tus datos.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mt-12">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              💡 ¿Necesitas un recurso específico?
            </h3>
            <p className="text-blue-800 mb-4">
              Si hay alguna plantilla o herramienta que te ayudaría pero no está en nuestra lista, 
              dínoslo. Creamos recursos basados en las necesidades reales de nuestros usuarios.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center text-blue-700 font-medium hover:text-blue-800"
            >
              Solicitar recurso personalizado <ExternalLink className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Recibe Nuevos Recursos por Email
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Sé el primero en acceder a nuevas plantillas, guías y herramientas
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex-1 px-4 py-3 rounded-lg border border-purple-300 focus:ring-2 focus:ring-white focus:border-transparent"
            />
            <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Suscribirse
            </button>
          </div>
          <p className="text-sm text-purple-200 mt-4">
            Sin spam. Solo recursos útiles para tu restaurante.
          </p>
        </div>
      </section>
    </div>
  )
}