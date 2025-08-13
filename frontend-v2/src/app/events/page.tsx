'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, Filter, Search, Users, MapPin, Clock, Euro, Edit, Trash2, TrendingUp, Target, Award } from 'lucide-react'
import { apiGet, apiDelete } from '@/lib/api'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToastHelpers } from '@/context/ToastContext'
import { usePaginatedTable } from '@/hooks/usePaginatedTable'
import SortableTableHeader from '@/components/ui/SortableTableHeader'
import Pagination from '@/components/ui/Pagination'
import EventsChart from '@/components/charts/EventsChart'
import { useSettings } from '@/context/SettingsContext'
import { usePageSize } from '@/hooks/usePageSize'
import PaginationSelector from '@/components/ui/PaginationSelector'
import MultiSelectDropdown from '@/components/ui/MultiSelectDropdown'

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

const statusOptions = [
  'Planificado',
  'Confirmado', 
  'En Progreso',
  'Completado',
  'Cancelado'
]

// Mapping para convertir español a inglés para el API
const statusMapping: Record<string, string> = {
  'Planificado': 'planned',
  'Confirmado': 'confirmed',
  'En Progreso': 'in_progress',
  'Completado': 'completed',
  'Cancelado': 'cancelled'
}

export default function EventsPage() {
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Toast helpers
  const { success, error: showError } = useToastHelpers()
  
  // Settings context
  const { settings } = useSettings()
  
  // Page-specific pageSize with localStorage persistence
  const { pageSize, setPageSize } = usePageSize('events')
  
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)
  
  // Search input ref for autofocus
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  
  
  // All events for charts (independent of pagination and filters)
  const [allEventsForCharts, setAllEventsForCharts] = useState<Event[]>([])
  const [loadingAllEventsForCharts, setLoadingAllEventsForCharts] = useState(true)
  
  // All events for metrics (with current filters applied)
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [loadingAllEvents, setLoadingAllEvents] = useState(true)

  // Function to fetch ALL events for charts (no filters)
  const fetchAllEventsForCharts = useCallback(async () => {
    try {
      setLoadingAllEventsForCharts(true)
      const searchParams = new URLSearchParams()
      
      // Get all events without pagination or filters
      searchParams.append('page', '1')
      searchParams.append('limit', '9999') // Large limit to get all
      
      const response = await apiGet<{data: Event[], pagination: any}>(`/events?${searchParams.toString()}`)
      setAllEventsForCharts(response.data.data)
    } catch (error) {
      console.error('Error fetching all events for charts:', error)
      setAllEventsForCharts([])
    } finally {
      setLoadingAllEventsForCharts(false)
    }
  }, [])

  // Function to fetch ALL events for metrics (with current filters)
  const fetchAllEvents = useCallback(async () => {
    try {
      setLoadingAllEvents(true)
      const searchParams = new URLSearchParams()
      
      // Get all events without pagination
      searchParams.append('page', '1')
      searchParams.append('limit', '9999') // Large limit to get all
      
      // Add current filter params to maintain consistency
      if (searchTerm.trim()) searchParams.append('search', searchTerm.trim())
      if (statusFilter.length > 0) {
        // Convert Spanish status values to English for API
        const englishStatuses = statusFilter.map(status => statusMapping[status]).filter(Boolean)
        if (englishStatuses.length > 0) {
          searchParams.append('status', englishStatuses.join(','))
        }
      }
      
      const response = await apiGet<{data: Event[], pagination: any}>(`/events?${searchParams.toString()}`)
      setAllEvents(response.data.data)
    } catch (error) {
      console.error('Error fetching all events:', error)
      setAllEvents([])
    } finally {
      setLoadingAllEvents(false)
    }
  }, [searchTerm, statusFilter])

  // Function to fetch paginated events
  const fetchEvents = useCallback(async (params: { 
    page: number; 
    limit: number; 
    sortKey?: string; 
    sortOrder?: 'asc' | 'desc' 
  }) => {
    const searchParams = new URLSearchParams()
    
    // Add pagination params
    searchParams.append('page', params.page.toString())
    searchParams.append('limit', params.limit.toString())
    
    // Add sorting params
    if (params.sortKey && params.sortOrder) {
      searchParams.append('sortKey', params.sortKey)
      searchParams.append('sortOrder', params.sortOrder)
    }
    
    // Add filter params
    if (searchTerm.trim()) searchParams.append('search', searchTerm.trim())
    if (statusFilter.length > 0) {
      // Convert Spanish status values to English for API
      const englishStatuses = statusFilter.map(status => statusMapping[status]).filter(Boolean)
      if (englishStatuses.length > 0) {
        searchParams.append('status', englishStatuses.join(','))
      }
    }
    
    const response = await apiGet<{data: Event[], pagination: any}>(`/events?${searchParams.toString()}`)
    
    return {
      data: response.data.data,
      pagination: response.data.pagination
    }
  }, [searchTerm, statusFilter])

  // Use paginated table hook
  const {
    sortedData: sortedEvents,
    isLoading: loading,
    pagination,
    sortConfig,
    handlePageChange,
    handleSort,
    refresh
  } = usePaginatedTable(fetchEvents, {
    initialPage: 1,
    itemsPerPage: pageSize,
    initialSortKey: 'event_date',
    dependencies: [searchTerm, statusFilter.join(','), pageSize],
    storageKey: 'events-page'
  })


  // Initialize app - single effect to prevent multiple renders
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize any required data here
        await new Promise(resolve => setTimeout(resolve, 100)) // Pequeño delay para asegurar que el DOM está listo
      } catch (error) {
        console.error('Error initializing app:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    initializeApp()
  }, [])

  // Load all events for charts once (no dependencies on filters)
  useEffect(() => {
    if (isInitialized) {
      fetchAllEventsForCharts()
    }
  }, [isInitialized, fetchAllEventsForCharts])

  // Load filtered events when filters change
  useEffect(() => {
    if (isInitialized) {
      fetchAllEvents()
    }
  }, [isInitialized, fetchAllEvents])

  // Autofocus search input after initialization
  useEffect(() => {
    if (isInitialized && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isInitialized])


  // Delete handlers
  const openDeleteModal = (event: Event) => {
    setCurrentEvent(event)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!currentEvent) return
    
    try {
      await apiDelete(`/events/${currentEvent.event_id}`)
      
      // Refresh paginated events, filtered events, and chart events
      refresh()
      fetchAllEvents()
      fetchAllEventsForCharts()
      
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


  // Calculate temporal metrics (using ALL events, not paginated ones)
  const temporalMetrics = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Esta semana
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)
    
    // Este mes
    const startOfMonth = new Date(currentYear, currentMonth, 1)
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0)
    
    // Mes anterior
    const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfLastMonth = new Date(currentYear, currentMonth, 0)
    
    const eventsThisWeek = allEvents.filter(e => {
      const eventDate = new Date(e.event_date)
      return eventDate >= startOfWeek && eventDate < endOfWeek
    }).length
    
    const eventsThisMonth = allEvents.filter(e => {
      const eventDate = new Date(e.event_date)
      return eventDate >= startOfMonth && eventDate <= endOfMonth
    }).length
    
    const eventsLastMonth = allEvents.filter(e => {
      const eventDate = new Date(e.event_date)
      return eventDate >= startOfLastMonth && eventDate <= endOfLastMonth
    }).length
    
    const monthComparison = eventsLastMonth === 0 
      ? (eventsThisMonth > 0 ? 100 : 0)  // Si mes anterior era 0 y ahora hay eventos = +100%
      : ((eventsThisMonth - eventsLastMonth) / eventsLastMonth) * 100
    
    // Próximo evento más cercano
    const upcomingEvents = allEvents
      .filter(e => new Date(e.event_date) >= now && ['planned', 'confirmed', 'in_progress'].includes(e.status))
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    const nextEvent = upcomingEvents[0]
    
    // Tasa de confirmación (últimos 6 meses)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
    const eventsLast6Months = allEvents.filter(e => new Date(e.event_date) >= sixMonthsAgo)
    const plannedOrConfirmed = eventsLast6Months.filter(e => ['planned', 'confirmed'].includes(e.status))
    const confirmed = eventsLast6Months.filter(e => e.status === 'confirmed')
    const confirmationRate = plannedOrConfirmed.length === 0 ? 0 : 
      (confirmed.length / plannedOrConfirmed.length) * 100
    
    // Promedio eventos por semana (últimas 8 semanas)
    const eightWeeksAgo = new Date(now.getTime() - (8 * 7 * 24 * 60 * 60 * 1000))
    const eventsLast8Weeks = allEvents.filter(e => new Date(e.event_date) >= eightWeeksAgo)
    const avgEventsPerWeek = eventsLast8Weeks.length / 8
    
    return {
      eventsThisWeek,
      eventsThisMonth,
      eventsLastMonth,
      monthComparison,
      nextEvent,
      confirmationRate,
      avgEventsPerWeek
    }
  }, [allEvents])


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

  if (!isInitialized) {
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

        {/* Temporal Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Este Mes vs Mes Anterior */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Este Mes</p>
                <p className="text-2xl font-bold text-gray-900">{temporalMetrics.eventsThisMonth}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className={`h-3 w-3 mr-1 ${temporalMetrics.monthComparison >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-xs font-medium ${temporalMetrics.monthComparison >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {temporalMetrics.monthComparison >= 0 ? '+' : ''}{temporalMetrics.monthComparison.toFixed(0)}%
                  </span>
                  <span className="text-xs text-gray-500 ml-1">vs mes anterior</span>
                </div>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Esta Semana */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                <p className="text-2xl font-bold text-blue-600">{temporalMetrics.eventsThisWeek}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Promedio últimas 8 semanas: {temporalMetrics.avgEventsPerWeek.toFixed(1)}/sem
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Tasa de Confirmación */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa Confirmación</p>
                <p className="text-2xl font-bold text-green-600">{temporalMetrics.confirmationRate.toFixed(0)}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  Últimos 6 meses
                </p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Próximo Evento */}
          <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${
            temporalMetrics.nextEvent ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''
          }`}
          onClick={() => {
            if (temporalMetrics.nextEvent) {
              router.push(`/events/${temporalMetrics.nextEvent.event_id}`)
            }
          }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Próximo Evento</p>
                {temporalMetrics.nextEvent ? (
                  <>
                    <p className="text-lg font-bold text-orange-600 truncate max-w-44" title={temporalMetrics.nextEvent.name}>
                      {temporalMetrics.nextEvent.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(temporalMetrics.nextEvent.event_date).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-400">N/A</p>
                    <p className="text-xs text-gray-500 mt-1">Sin eventos próximos</p>
                  </>
                )}
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Award className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Events Chart */}
        <EventsChart 
          events={allEventsForCharts}
          defaultPeriod={6}
          title="Eventos"
          className="mb-8"
        />

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
            <MultiSelectDropdown
              options={statusOptions}
              selected={statusFilter}
              onChange={setStatusFilter}
              placeholder="Estados"
              className="whitespace-nowrap"
            />

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
                <SortableTableHeader sortKey="name" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                  Evento
                </SortableTableHeader>
                <SortableTableHeader sortKey="event_date" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                  Fecha & Hora
                </SortableTableHeader>
                <SortableTableHeader sortKey="guests_count" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                  Invitados
                </SortableTableHeader>
                <SortableTableHeader sortKey="location" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort} sortable={false}>
                  Ubicación
                </SortableTableHeader>
                <SortableTableHeader sortKey="status" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                  Estado
                </SortableTableHeader>
                <SortableTableHeader sortKey="budget" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                  Presupuesto
                </SortableTableHeader>
                <SortableTableHeader sortKey="" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort} sortable={false} className="text-right">
                  Acciones
                </SortableTableHeader>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedEvents.map((event) => (
                <tr 
                  key={event.event_id} 
                  onClick={() => router.push(`/events/${event.event_id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
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
                      <Link 
                        href={`/events/${event.event_id}`} 
                        className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                        title="Editar evento"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button 
                        onClick={() => openDeleteModal(event)}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                        title="Eliminar evento"
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
        {sortedEvents.length === 0 && !loading && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay eventos
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter.length > 0 
                ? 'No se encontraron eventos con los filtros aplicados'
                : 'Comienza creando tu primer evento'
              }
            </p>
            <Link
              href="/events/new"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              {searchTerm || statusFilter.length > 0 ? 'Crear Nuevo Evento' : 'Crear Primer Evento'}
            </Link>
          </div>
        )}
      </div>

      {/* Results Counter, Page Size Selector and Pagination */}
      {pagination && (
        <div className="mt-6 flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-sm text-gray-600">
              Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} eventos
            </div>
            
            <PaginationSelector
              currentPageSize={pageSize}
              onPageSizeChange={setPageSize}
              totalItems={pagination.totalItems}
            />
          </div>
          
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
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