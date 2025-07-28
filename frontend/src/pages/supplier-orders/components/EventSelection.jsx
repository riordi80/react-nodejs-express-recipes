// src/pages/supplier-orders/components/EventSelection.jsx
import React from 'react';
import Loading from '../../../components/loading';

const EventSelection = ({ 
  availableEvents,
  selectedEventIds,
  eventsLoading,
  onEventSelection,
  onSelectAllEvents
}) => {
  if (!availableEvents || availableEvents.length === 0) {
    return null;
  }

  return (
    <div className="event-selection-section">
      <div className="selection-header">
        <h3>Seleccionar Eventos ({availableEvents.length} disponibles)</h3>
        <div className="selection-actions">
          <button 
            className="btn-link"
            onClick={onSelectAllEvents}
          >
            {selectedEventIds.length === availableEvents.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
          </button>
          <span className="selection-count">
            {selectedEventIds.length} seleccionados
          </span>
        </div>
      </div>

      {eventsLoading ? (
        <Loading message="Cargando eventos disponibles..." size="medium" inline />
      ) : (
        <div className="events-grid">
          {availableEvents.map(event => (
            <div 
              key={event.event_id} 
              className={`event-card ${selectedEventIds.includes(event.event_id) ? 'selected' : ''}`}
              onClick={() => onEventSelection(event.event_id, !selectedEventIds.includes(event.event_id))}
            >
              <div className="event-checkbox">
                <input
                  type="checkbox"
                  id={`event-${event.event_id}`}
                  checked={selectedEventIds.includes(event.event_id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    onEventSelection(event.event_id, e.target.checked);
                  }}
                />
              </div>
              <div className="event-info">
                <div className="event-header">
                  <h4>{event.event_name}</h4>
                  <span className={`status-badge ${event.status}`}>
                    {event.status === 'confirmed' ? 'Confirmado' : 'Planificado'}
                  </span>
                </div>
                <div className="event-details">
                  <div className="event-date">
                    📅 {new Date(event.event_date).toLocaleDateString('es-ES')}
                    {event.event_time && ` - ${event.event_time}`}
                  </div>
                  <div className="event-meta">
                    👥 {event.guests_count} invitados
                    {event.recipes_count > 0 && (
                      <span> • 🍽️ {event.recipes_count} recetas</span>
                    )}
                    {event.total_portions > 0 && (
                      <span> • 📊 {event.total_portions} porciones</span>
                    )}
                  </div>
                  {event.location && (
                    <div className="event-location">📍 {event.location}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventSelection;