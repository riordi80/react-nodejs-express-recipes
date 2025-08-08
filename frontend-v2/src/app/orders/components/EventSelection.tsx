'use client'

import { Calendar, Users, MapPin, Clock } from 'lucide-react'
import { AvailableEvent } from '../hooks/useShoppingList'

interface EventSelectionProps {
  availableEvents: AvailableEvent[]
  selectedEventIds: number[]
  eventsLoading: boolean
  onEventSelection: (eventId: number, isSelected: boolean) => void
  onSelectAllEvents: () => void
}

export default function EventSelection({ 
  availableEvents,
  selectedEventIds,
  eventsLoading,
  onEventSelection,
  onSelectAllEvents
}: EventSelectionProps) {
  if (!availableEvents || availableEvents.length === 0) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    return timeString.slice(0, 5)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'planned':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado'
      case 'planned':
        return 'Planificado'
      default:
        return status
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Seleccionar Eventos ({availableEvents.length} disponibles)
        </h3>
        <div className="flex items-center space-x-4">
          <button 
            className="text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors"
            onClick={onSelectAllEvents}
          >
            {selectedEventIds.length === availableEvents.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
          </button>
          <span className="text-sm text-gray-500">
            {selectedEventIds.length} seleccionados
          </span>
        </div>
      </div>

      {eventsLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">Cargando eventos disponibles...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableEvents.map(event => (
            <div 
              key={event.event_id} 
              className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedEventIds.includes(event.event_id) 
                  ? 'border-orange-300 bg-orange-50' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => onEventSelection(event.event_id, !selectedEventIds.includes(event.event_id))}
            >
              {/* Checkbox */}
              <div className="absolute top-3 right-3">
                <input
                  type="checkbox"
                  id={`event-${event.event_id}`}
                  checked={selectedEventIds.includes(event.event_id)}
                  onChange={(e) => {
                    e.stopPropagation()
                    onEventSelection(event.event_id, e.target.checked)
                  }}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
              </div>

              {/* Event Info */}
              <div className="pr-8">
                {/* Header */}
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                    {event.name}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {getStatusLabel(event.status)}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-gray-600">
                  {/* Date */}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDate(event.event_date)}
                      {event.event_time && (
                        <>
                          <Clock className="h-3 w-3 inline ml-2 mr-1" />
                          {formatTime(event.event_time)}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Guests and Recipes */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{event.guests_count} invitados</span>
                    </div>
                    {event.recipe_count > 0 && (
                      <span>🍽️ {event.recipe_count} recetas</span>
                    )}
                  </div>

                  {/* Location */}
                  {/* Note: The location field might not be in the AvailableEvent type, 
                      but we'll include it in case it's available */}
                  {/* {event.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )} */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}