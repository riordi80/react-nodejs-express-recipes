'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { Calendar, Plus, Filter, Search, Users, MapPin, Clock, Euro, Eye, Edit, Trash2 } from 'lucide-react'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToastHelpers } from '@/context/ToastContext'

interface Event {
  event_id: number
  name: string
  description?: string
  event_date: string
  event_time?: string
  guests_count: number
  location?: string
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  budget?: number
  notes?: string
  created_at: string
  updated_at: string
}

const statusColors = {
  planned: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

const statusLabels = {
  planned: 'Planificado',
  confirmed: 'Confirmado',
  in_progress: 'En Progreso',
  completed: 'Completado',
  cancelled: 'Cancelado'
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Toast helpers
  const { success, error: showError } = useToastHelpers()
  
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)
  
  // Search input ref for autofocus
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Load events
  useEffect(() => {
    loadEvents()
  }, [])

  // Autofocus search input on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 100) // Pequeño delay para asegurar que el DOM está listo
    
    return () => clearTimeout(timer)
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const response = await apiGet<Event[]>('/events')
      setEvents(response.data)
      setError(null)
    } catch (err: unknown) {
      setError('Error al cargar eventos')
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete handlers
  const openDeleteModal = (event: Event) => {
    setCurrentEvent(event)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!currentEvent) return
    
    try {
      await apiDelete(`/events/${currentEvent.event_id}`)
      // Refresh events after deletion
      await loadEvents()
      setIsDeleteOpen(false)
      setCurrentEvent(null)
      
      // Show success toast
      success(`Evento "${currentEvent.name}" eliminado correctamente`, 'Evento Eliminado')
    } catch (error) {
      console.error('Error al eliminar evento:', error)
      // Show error toast
      showError('No se pudo eliminar el evento. Intente nuevamente.', 'Error al Eliminar')
      // Keep modal open on error
    }
  }

  // Filter events (memoized)
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.location?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [events, searchTerm, statusFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    return timeString.slice(0, 5) // HH:MM
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-[60px] z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Eventos</h1>
          </div>
          
          <Link
            href="/events/new"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="md:hidden">Añadir</span>
          </Link>
        </div>
      </div>

      <div className="p-6">
        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="h-8 w-8 text-orange-600" />
                <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
              </div>
              <p className="text-gray-600">
                Gestiona y organiza todos tus eventos y menús especiales
              </p>
            </div>
            
            <Link
              href="/events/new"
              className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Evento</span>
            </Link>
          </div>
        </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="planned">Planificado</option>
              <option value="confirmed">Confirmado</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha & Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invitados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Presupuesto
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.map((event) => (
                <tr key={event.event_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link 
                          href={`/events/${event.event_id}`}
                          className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors"
                        >
                          {event.name}
                        </Link>
                        {event.description && (
                          <div className="text-sm text-gray-500 truncate max-w-48">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <div>
                        <div>{formatDate(event.event_date)}</div>
                        {event.event_time && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(event.event_time)}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      {event.guests_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {event.location && (
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate max-w-32">{event.location}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[event.status]}`}>
                      {statusLabels[event.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {event.budget && (
                      <div className="flex items-center text-sm text-gray-900">
                        <Euro className="h-4 w-4 mr-1 text-gray-400" />
                        {event.budget.toLocaleString('es-ES', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link href={`/events/${event.event_id}`} className="text-blue-600 hover:text-blue-900 p-1 rounded">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link href={`/events/${event.event_id}`} className="text-orange-600 hover:text-orange-900 p-1 rounded">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button 
                        onClick={() => openDeleteModal(event)}
                        className="text-red-600 hover:text-red-900 p-1 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && !loading && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay eventos
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'No se encontraron eventos con los filtros aplicados'
                : 'Comienza creando tu primer evento'
              }
            </p>
            <Link
              href="/events/new"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              Crear Primer Evento
            </Link>
          </div>
        )}
      </div>

      {/* Results Counter */}
      {filteredEvents.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredEvents.length} de {events.length} eventos
        </div>
      )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Confirmar eliminación"
          message={`¿Seguro que deseas eliminar el evento "${currentEvent?.name}"?`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />
      </div>
    </>
  )
}