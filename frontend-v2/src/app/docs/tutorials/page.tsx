'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Play, Clock, User, BookOpen, Filter, Search, Star, Eye } from 'lucide-react'

interface Tutorial {
  id: string
  title: string
  description: string
  duration: string
  level: 'Principiante' | 'Intermedio' | 'Avanzado'
  category: string
  views: string
  rating: number
  thumbnail: string
  available: boolean
  comingSoon?: boolean
}

const tutorials: Tutorial[] = [
  {
    id: '1',
    title: 'Configuración inicial de RecetasAPI',
    description: 'Aprende a configurar tu cuenta, añadir información del restaurante y invitar a tu equipo paso a paso.',
    duration: '8 min',
    level: 'Principiante',
    category: 'Configuración',
    views: '1.2k',
    rating: 4.8,
    thumbnail: '/api/placeholder/320/180',
    available: true
  },
  {
    id: '2',
    title: 'Crear tu primera receta',
    description: 'Guía completa para añadir recetas, ingredientes, calcular costos y establecer precios de venta.',
    duration: '12 min',
    level: 'Principiante',
    category: 'Recetas',
    views: '956',
    rating: 4.9,
    thumbnail: '/api/placeholder/320/180',
    available: true
  },
  {
    id: '3',
    title: 'Gestión de eventos y banquetes',
    description: 'Cómo planificar, costear y ejecutar eventos desde pequeñas cenas hasta grandes banquetes.',
    duration: '18 min',
    level: 'Intermedio',
    category: 'Eventos',
    views: '743',
    rating: 4.7,
    thumbnail: '/api/placeholder/320/180',
    available: true
  },
  {
    id: '4',
    title: 'Control de inventario en tiempo real',
    description: 'Monitorea el stock de ingredientes, establece alertas y gestiona proveedores eficientemente.',
    duration: '15 min',
    level: 'Intermedio',
    category: 'Inventario',
    views: '632',
    rating: 4.6,
    thumbnail: '/api/placeholder/320/180',
    available: true
  },
  {
    id: '5',
    title: 'Análisis de costos y rentabilidad',
    description: 'Utiliza los reportes avanzados para optimizar precios y maximizar la rentabilidad de tu negocio.',
    duration: '20 min',
    level: 'Avanzado',
    category: 'Reportes',
    views: '489',
    rating: 4.5,
    thumbnail: '/api/placeholder/320/180',
    available: true
  },
  {
    id: '6',
    title: 'Configuración del sistema de reservas',
    description: 'Aprende a configurar mesas, horarios y opciones para optimizar las reservas de tu restaurante.',
    duration: '14 min',
    level: 'Intermedio',
    category: 'Reservas',
    views: '0',
    rating: 0,
    thumbnail: '/api/placeholder/320/180',
    available: false,
    comingSoon: true
  },
  {
    id: '7',
    title: 'Creación de cartas digitales con QR',
    description: 'Diseña cartas atractivas, genera códigos QR personalizados y actualiza precios al instante.',
    duration: '16 min',
    level: 'Intermedio',
    category: 'Carta Digital',
    views: '0',
    rating: 0,
    thumbnail: '/api/placeholder/320/180',
    available: false,
    comingSoon: true
  },
  {
    id: '8',
    title: 'Integración con sistemas POS',
    description: 'Conecta RecetasAPI con tu sistema de punto de venta para sincronización automática de datos.',
    duration: '22 min',
    level: 'Avanzado',
    category: 'Integraciones',
    views: '0',
    rating: 0,
    thumbnail: '/api/placeholder/320/180',
    available: false,
    comingSoon: true
  }
]

const categories = ['Todos', 'Configuración', 'Recetas', 'Eventos', 'Inventario', 'Reportes', 'Reservas', 'Carta Digital', 'Integraciones']
const levels = ['Todos', 'Principiante', 'Intermedio', 'Avanzado']

export default function TutorialesPage() {
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [selectedLevel, setSelectedLevel] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesCategory = selectedCategory === 'Todos' || tutorial.category === selectedCategory
    const matchesLevel = selectedLevel === 'Todos' || tutorial.level === selectedLevel
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesCategory && matchesLevel && matchesSearch
  })

  const availableTutorials = filteredTutorials.filter(t => t.available)
  const comingSoonTutorials = filteredTutorials.filter(t => t.comingSoon)

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Video Tutoriales
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Aprende a usar RecetasAPI con nuestros tutoriales paso a paso. 
              Desde lo básico hasta funciones avanzadas para profesionales.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Play className="h-5 w-5 mr-2 text-green-600" />
                {availableTutorials.length} videos disponibles
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-green-600" />
                Más de 2 horas de contenido
              </div>
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-green-600" />
                Para todos los niveles
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Search */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar tutoriales..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tutorial */}
      {availableTutorials.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Tutorial Destacado</h2>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-semibold">
                      {availableTutorials[0].category}
                    </span>
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
                      {availableTutorials[0].level}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {availableTutorials[0].title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {availableTutorials[0].description}
                  </p>
                  <div className="flex items-center space-x-6 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      {availableTutorials[0].duration}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Eye className="h-4 w-4 mr-1" />
                      {availableTutorials[0].views} visualizaciones
                    </div>
                    <div className="flex items-center text-sm text-yellow-600">
                      <Star className="h-4 w-4 mr-1 fill-current" />
                      {availableTutorials[0].rating}
                    </div>
                  </div>
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center">
                    <Play className="h-5 w-5 mr-2" />
                    Ver Tutorial
                  </button>
                </div>
                <div className="relative">
                  <div className="bg-gray-200 rounded-xl aspect-video flex items-center justify-center">
                    <div className="bg-white rounded-full p-4 shadow-lg">
                      <Play className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                    {availableTutorials[0].duration}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Available Tutorials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Tutoriales Disponibles
            </h2>
            <span className="text-gray-600">
              {availableTutorials.length} tutorial{availableTutorials.length !== 1 ? 'es' : ''}
            </span>
          </div>

          {availableTutorials.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron tutoriales
              </h3>
              <p className="text-gray-600">
                Intenta ajustar los filtros o la búsqueda
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableTutorials.map(tutorial => (
                <div key={tutorial.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div className="bg-gray-200 aspect-video flex items-center justify-center">
                      <Play className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="absolute top-3 left-3 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                      {tutorial.duration}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        tutorial.level === 'Principiante' ? 'bg-green-100 text-green-800' :
                        tutorial.level === 'Intermedio' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {tutorial.level}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                        {tutorial.category}
                      </span>
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{tutorial.rating}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {tutorial.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {tutorial.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Eye className="h-4 w-4 mr-1" />
                        {tutorial.views}
                      </div>
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center">
                        <Play className="h-4 w-4 mr-1" />
                        Ver
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Coming Soon */}
      {comingSoonTutorials.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Próximamente
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {comingSoonTutorials.map(tutorial => (
                <div key={tutorial.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden opacity-75">
                  <div className="relative">
                    <div className="bg-gray-100 aspect-video flex items-center justify-center">
                      <Play className="h-12 w-12 text-gray-300" />
                    </div>
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Próximamente
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-medium">
                        {tutorial.category}
                      </span>
                      <span className="text-xs text-gray-400">{tutorial.duration}</span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      {tutorial.title}
                    </h3>
                    
                    <p className="text-gray-500 text-sm mb-4">
                      {tutorial.description}
                    </p>
                    
                    <button 
                      disabled 
                      className="w-full bg-gray-200 text-gray-500 px-4 py-2 rounded-lg text-sm font-semibold cursor-not-allowed"
                    >
                      Disponible pronto
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Learning Path */}
      <section className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ruta de Aprendizaje Recomendada
            </h2>
            <p className="text-xl text-gray-600">
              Sigue este orden para dominar RecetasAPI paso a paso
            </p>
          </div>

          <div className="space-y-6">
            {[
              { step: 1, title: 'Configuración inicial', description: 'Configura tu cuenta y restaurante', available: true },
              { step: 2, title: 'Crear tu primera receta', description: 'Aprende el sistema de recetas y costos', available: true },
              { step: 3, title: 'Gestión de inventario', description: 'Controla stock y proveedores', available: true },
              { step: 4, title: 'Tu primer evento', description: 'Planifica y ejecuta un evento completo', available: true },
              { step: 5, title: 'Análisis y reportes', description: 'Optimiza con datos y métricas', available: true },
              { step: 6, title: 'Sistema de reservas', description: 'Configura reservas online', available: false },
              { step: 7, title: 'Carta digital', description: 'Crea menús digitales con QR', available: false }
            ].map((item, index) => (
              <div key={index} className={`flex items-center p-6 bg-white rounded-lg border-2 transition-colors ${
                item.available ? 'border-blue-200 hover:border-blue-300' : 'border-gray-200 bg-gray-50'
              }`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-4 ${
                  item.available ? 'bg-blue-600' : 'bg-gray-400'
                }`}>
                  {item.step}
                </div>
                <div className="flex-grow">
                  <h3 className={`font-semibold mb-1 ${item.available ? 'text-gray-900' : 'text-gray-500'}`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm ${item.available ? 'text-gray-600' : 'text-gray-400'}`}>
                    {item.description}
                  </p>
                </div>
                {item.available ? (
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                    Ver Tutorial
                  </button>
                ) : (
                  <span className="text-gray-400 text-sm">Próximamente</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Necesitas ayuda personalizada?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Nuestro equipo puede ayudarte con sesiones de formación 1 a 1
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Solicitar Formación Personal
            </Link>
            <Link
              href="/docs"
              className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Ver Documentación
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}