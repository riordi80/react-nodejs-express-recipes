// src/pages/events/Events.jsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaUsers, FaExclamationTriangle, FaEuroSign } from 'react-icons/fa';
import TableActions from '../../components/table/TableActions';
import BasePage from '../../components/base-page/BasePage';
import Widget from '../../components/widget';
import Modal from '../../components/modal/Modal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import TabsModal from '../../components/tabs-modal/TabsModal';
import { FormField, FormInput, FormTextarea, FormSelect } from '../../components/form/FormField';
import api from '../../api/axios';
import { formatCurrency, formatDecimal } from '../../utils/formatters';
import './Events.css';

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  
  // Modal messages states
  const [modalError, setModalError] = useState(null);
  const [modalMessage, setModalMessage] = useState(null);
  const [modalMessageType, setModalMessageType] = useState('success');

  // Tab states for modals
  const [createModalTab, setCreateModalTab] = useState('info');
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState(false);
  const createDropdownRef = useRef(null);
  const editDropdownRef = useRef(null);

  // Form states
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    event_date: '',
    event_time: '',
    guests_count: 1,
    location: '',
    status: 'planned',
    budget: '',
    notes: ''
  });


  // Menu management states
  const [selectedRecipes, setSelectedRecipes] = useState([]);
  const [recipePortions, setRecipePortions] = useState({});
  const [recipeCourseTypes, setRecipeCourseTypes] = useState({});
  const [recipeNotes, setRecipeNotes] = useState({});
  const [recipeSearchText, setRecipeSearchText] = useState('');

  // Widgets data
  const [widgetsData, setWidgetsData] = useState({
    upcomingEvents: [],
    eventsWithoutMenu: [],
    budgetExceeded: [],
    largeEvents: []
  });
  const [widgetsLoading, setWidgetsLoading] = useState(true);

  // Definir las pestañas con iconos
  const tabs = [
    { id: 'info', label: 'Información General', icon: FaCalendarAlt },
    { id: 'menu', label: 'Menú del Evento', icon: FaUsers }
  ];

  // Estados del evento con colores
  const eventStatuses = [
    { value: 'planned', label: 'Planificado', color: '#64748b' },
    { value: 'confirmed', label: 'Confirmado', color: '#3b82f6' },
    { value: 'in_progress', label: 'En Progreso', color: '#f59e0b' },
    { value: 'completed', label: 'Completado', color: '#10b981' },
    { value: 'cancelled', label: 'Cancelado', color: '#ef4444' }
  ];

  // Tipos de plato
  const courseTypes = [
    { value: 'starter', label: 'Entrante' },
    { value: 'main', label: 'Principal' },
    { value: 'side', label: 'Acompañamiento' },
    { value: 'dessert', label: 'Postre' },
    { value: 'beverage', label: 'Bebida' }
  ];

  // Efecto para cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target)) {
        setIsCreateDropdownOpen(false);
      }
      if (editDropdownRef.current && !editDropdownRef.current.contains(event.target)) {
        setIsEditDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handlers para pestañas
  const handleCreateTabChange = (tabId) => {
    setCreateModalTab(tabId);
    setIsCreateDropdownOpen(false);
    // Limpiar mensajes al cambiar de pestaña
    setModalError(null);
    setModalMessage(null);
  };


  // Cargar eventos
  const loadEvents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await api.get('/events', { params });
      setEvents(response.data);
      setError(null);
      
      // También recargar widgets cuando se cargan eventos
      await fetchWidgetsData();
    } catch (err) {
      setError(`Error al cargar eventos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Cargar recetas para el menú
  const loadRecipes = async () => {
    try {
      const response = await api.get('/recipes');
      setRecipes(response.data);
    } catch (err) {
      console.error('Error al cargar recetas:', err);
    }
  };

  // Función de notificación
  const notify = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  // Load widgets data
  const fetchWidgetsData = async () => {
    try {
      setWidgetsLoading(true);
      const response = await api.get('/events/dashboard-widgets');
      setWidgetsData(response.data);
    } catch (error) {
      console.error('Error loading widgets data:', error);
    } finally {
      setWidgetsLoading(false);
    }
  };

  // Filtrar eventos por texto de búsqueda
  const filteredData = useMemo(() => {
    if (!filterText) return events;
    return events.filter(event => 
      event.name.toLowerCase().includes(filterText.toLowerCase()) ||
      event.location?.toLowerCase().includes(filterText.toLowerCase()) ||
      event.description?.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [events, filterText]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadEvents();
    loadRecipes();
    fetchWidgetsData();
  }, [statusFilter]);

  // Widget handlers
  const handleWidgetItemClick = (event) => {
    navigate(`/events/${event.event_id}`);
  };

  // Helper functions for widgets
  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const getDaysUntilEvent = (dateString) => {
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Obtener detalles del evento para visualización/edición
  const loadEventDetails = async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    } catch (err) {
      console.error('Error al cargar detalles del evento:', err);
      notify('Error al cargar detalles del evento', 'error');
      return null;
    }
  };


  // Crear evento
  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Limpiar mensajes previos
    setModalError(null);
    setModalMessage(null);
    
    // Validación del lado cliente
    if (!newEvent.name?.trim()) {
      setModalError('El nombre del evento es obligatorio');
      return;
    }
    
    if (!newEvent.event_date) {
      setModalError('La fecha del evento es obligatoria');
      return;
    }
    
    if (!newEvent.guests_count || newEvent.guests_count < 1) {
      setModalError('Debe especificar al menos 1 invitado');
      return;
    }
    
    try {
      // Crear evento
      const eventResponse = await api.post('/events', newEvent);
      const eventId = eventResponse.data.event_id;

      // Si estamos en la pestaña de menú y hay recetas seleccionadas, añadirlas
      if (createModalTab === 'menu' && selectedRecipes.length > 0) {
        for (const recipeId of selectedRecipes) {
          await api.post(`/events/${eventId}/recipes`, {
            recipe_id: parseInt(recipeId),
            portions: recipePortions[recipeId] || 1,
            course_type: recipeCourseTypes[recipeId] || 'main',
            notes: recipeNotes[recipeId] || ''
          });
        }
      }

      // Reset form
      setNewEvent({
        name: '',
        description: '',
        event_date: '',
        event_time: '',
        guests_count: 1,
        location: '',
        status: 'planned',
        budget: '',
        notes: ''
      });
      setSelectedRecipes([]);
      setRecipePortions({});
      setRecipeCourseTypes({});
      setRecipeNotes({});
      setRecipeSearchText('');
      setCreateModalTab('info');
      
      // Limpiar mensajes del modal
      setModalError(null);
      setModalMessage(null);
      
      setIsCreateOpen(false);
      
      await loadEvents();
      notify('Evento creado correctamente', 'success');
    } catch (err) {
      console.error('Error creating event:', err);
      setModalError(err.response?.data?.message || 'Error al crear evento');
    }
  };

  // Navegar a la página de detalles del evento
  const navigateToEventDetail = (event) => {
    navigate(`/events/${event.event_id}`);
  };

  // Actualizar evento
  const handleEdit = async () => {
    try {
      // Actualizar información del evento
      await api.put(`/events/${editedEvent.event_id}`, {
        name: editedEvent.name,
        description: editedEvent.description,
        event_date: editedEvent.event_date,
        event_time: editedEvent.event_time,
        guests_count: editedEvent.guests_count,
        location: editedEvent.location,
        status: editedEvent.status,
        budget: editedEvent.budget,
        notes: editedEvent.notes
      });

      // Si estamos en la pestaña de menú, actualizar menú completo
      if (editModalTab === 'menu') {
        // Eliminar todas las recetas existentes del menú
        const existingMenu = editedEvent.menu || [];
        for (const item of existingMenu) {
          await api.delete(`/events/${editedEvent.event_id}/recipes/${item.recipe_id}`);
        }

        // Añadir recetas seleccionadas
        for (const recipeId of selectedRecipes) {
          await api.post(`/events/${editedEvent.event_id}/recipes`, {
            recipe_id: parseInt(recipeId),
            portions: recipePortions[recipeId] || 1,
            course_type: recipeCourseTypes[recipeId] || 'main',
            notes: recipeNotes[recipeId] || ''
          });
        }
      }

      setIsEditOpen(false);
      setEditedEvent(null);
      setSelectedRecipes([]);
      setRecipePortions({});
      setRecipeCourseTypes({});
      setRecipeNotes({});
      setRecipeSearchText('');
      
      await loadEvents();
      notify('Evento actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error updating event:', error);
      notify(error.response?.data?.message || 'Error al actualizar evento', 'error');
    }
  };

  // Abrir modal de visualización
  const openViewModal = async (event) => {
    const eventDetails = await loadEventDetails(event.event_id);
    if (eventDetails) {
      setCurrentItem(eventDetails);
      setIsViewOpen(true);
    }
  };

  // Abrir modal de eliminación
  const openDeleteModal = (event) => {
    setCurrentItem(event);
    setIsDeleteOpen(true);
  };

  // Eliminar evento
  const handleDelete = async () => {
    try {
      await api.delete(`/events/${currentItem.event_id}`);
      setIsDeleteOpen(false);
      setCurrentItem(null);
      await loadEvents();
      notify('Evento eliminado correctamente', 'success');
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      notify(error.response?.data?.message || 'Error al eliminar evento', 'error');
    }
  };

  // Handler para selección de recetas en el menú
  const handleRecipeToggle = (recipeId) => {
    const recipeIdStr = recipeId.toString();
    if (selectedRecipes.includes(recipeIdStr)) {
      setSelectedRecipes(selectedRecipes.filter(id => id !== recipeIdStr));
      const newPortions = { ...recipePortions };
      const newCourseTypes = { ...recipeCourseTypes };
      const newNotes = { ...recipeNotes };
      delete newPortions[recipeId];
      delete newCourseTypes[recipeId];
      delete newNotes[recipeId];
      setRecipePortions(newPortions);
      setRecipeCourseTypes(newCourseTypes);
      setRecipeNotes(newNotes);
    } else {
      setSelectedRecipes([...selectedRecipes, recipeIdStr]);
      setRecipePortions({ ...recipePortions, [recipeId]: 1 });
      setRecipeCourseTypes({ ...recipeCourseTypes, [recipeId]: 'main' });
    }
  };

  // Obtener color del estado
  const getStatusColor = (status) => {
    const statusObj = eventStatuses.find(s => s.value === status);
    return statusObj ? statusObj.color : '#64748b';
  };

  // Obtener etiqueta del estado
  const getStatusLabel = (status) => {
    const statusObj = eventStatuses.find(s => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  // Filtrar recetas por texto de búsqueda
  const filteredRecipes = useMemo(() => {
    if (!recipeSearchText) return recipes;
    return recipes.filter(recipe => 
      recipe.name.toLowerCase().includes(recipeSearchText.toLowerCase())
    );
  }, [recipes, recipeSearchText]);

  // Columnas de la tabla
  const columns = useMemo(() => [
    { 
      name: 'Evento', 
      selector: r => r.name, 
      sortable: true, 
      grow: 2,
      cell: row => (
        <div style={{ pointerEvents: 'none' }}>
          <div style={{ fontWeight: '600', color: '#1e293b' }}>{row.name}</div>
          {row.location && (
            <div style={{ fontSize: '12px', color: '#64748b' }}>📍 {row.location}</div>
          )}
        </div>
      )
    },
    { 
      name: 'Fecha', 
      selector: r => new Date(r.event_date),
      sortable: true,
      cell: row => {
        const date = new Date(row.event_date);
        const formattedDate = date.toLocaleDateString('es-ES');
        return formattedDate + (row.event_time ? ` ${row.event_time.slice(0, 5)}` : '');
      }
    },
    { 
      name: 'Invitados', 
      selector: r => r.guests_count, 
      sortable: true
    },
    { 
      name: 'Estado', 
      selector: r => getStatusLabel(r.status), 
      sortable: true,
      cell: row => (
        <span className={`event-status ${row.status}`}>
          {getStatusLabel(row.status)}
        </span>
      )
    },
    { 
      name: 'Recetas', 
      selector: r => r.recipes_count, 
      sortable: true
    },
    { 
      name: 'Presupuesto', 
      selector: r => r.budget ? formatCurrency(r.budget) : '-', 
      sortable: true
    },
    {
      name: 'Acciones',
      cell: row => (
        <TableActions
          row={row}
          onDelete={(row) => {
            openDeleteModal(row);
          }}
          showDelete={true}
          deleteTitle="Eliminar evento"
        />
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '60px'
    }
  ], []);

  // Filtros de estado para PageHeader
  const statusFilterOptions = [
    { value: 'all', label: 'Todos los estados' },
    ...eventStatuses.map(status => ({ value: status.value, label: status.label }))
  ];

  const pageFilters = [
    {
      key: 'status',
      label: 'Estado',
      value: statusFilter,
      options: statusFilterOptions,
      onChange: setStatusFilter
    }
  ];

  return (
    <>
      <BasePage
        title="Eventos"
        subtitle="Planifica y organiza tus eventos gastronómicos"
        data={filteredData}
        columns={columns}
        loading={loading}
        error={error}
        message={message}
        messageType={messageType}
        filterText={filterText}
        onFilterChange={setFilterText}
        showSearch={true}
        autoFocusSearch={true}
        onAdd={() => {
          setIsCreateOpen(true);
          setModalError(null);
          setModalMessage(null);
        }}
        addButtonText="Nuevo evento"
        searchPlaceholder="Buscar evento..."
        noDataMessage="No hay eventos para mostrar"
        filters={pageFilters}
        enableMobileModal={true}
        onRowClicked={navigateToEventDetail}
      >
        {/* Widgets Dashboard específicos de Events */}
        <div className="events-widgets" style={{ marginBottom: '24px' }}>
          <div className="widgets-grid">
            {/* Widget 1: Eventos Próximos (7 días) */}
            <Widget
              icon={FaCalendarAlt}
              title="Eventos Próximos"
              count={widgetsData.upcomingEvents.length}
              type="warning"
              loading={widgetsLoading}
              collapsible={true}
              emptyMessage="✅ Sin eventos próximos"
            >
              <div className="widget-list">
                {widgetsData.upcomingEvents.slice(0, 4).map(event => {
                  const daysUntil = getDaysUntilEvent(event.event_date);
                  return (
                    <div 
                      key={event.event_id} 
                      className="widget-item clickable"
                      onClick={() => handleWidgetItemClick(event)}
                    >
                      <div className="item-info">
                        <span className="item-name">{event.name}</span>
                        <span className="item-detail">
                          {formatEventDate(event.event_date)} • {event.guests_count} invitados
                        </span>
                      </div>
                      <div className="item-value warning">
                        {daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `${daysUntil} días`}
                      </div>
                    </div>
                  );
                })}
                {widgetsData.upcomingEvents.length > 4 && (
                  <div className="widget-more">
                    +{widgetsData.upcomingEvents.length - 4} más...
                  </div>
                )}
              </div>
            </Widget>

            {/* Widget 2: Sin Menú Asignado */}
            <Widget
              icon={FaExclamationTriangle}
              title="Sin Menú Asignado"
              count={widgetsData.eventsWithoutMenu.length}
              type="critical"
              loading={widgetsLoading}
              collapsible={true}
              emptyMessage="✅ Todos tienen menú"
            >
              <div className="widget-list">
                {widgetsData.eventsWithoutMenu.slice(0, 4).map(event => (
                  <div 
                    key={event.event_id} 
                    className="widget-item clickable"
                    onClick={() => handleWidgetItemClick(event)}
                  >
                    <div className="item-info">
                      <span className="item-name">{event.name}</span>
                      <span className="item-detail">
                        {formatEventDate(event.event_date)} • {event.guests_count} invitados
                      </span>
                    </div>
                    <div className="item-value critical">
                      Sin menú
                    </div>
                  </div>
                ))}
                {widgetsData.eventsWithoutMenu.length > 4 && (
                  <div className="widget-more">
                    +{widgetsData.eventsWithoutMenu.length - 4} más...
                  </div>
                )}
              </div>
            </Widget>

            {/* Widget 3: Presupuesto Excedido */}
            <Widget
              icon={FaEuroSign}
              title="Presupuesto Excedido"
              count={widgetsData.budgetExceeded.length}
              type="critical"
              loading={widgetsLoading}
              collapsible={true}
              emptyMessage="✅ Todos dentro del presupuesto"
            >
              <div className="widget-list">
                {widgetsData.budgetExceeded.slice(0, 4).map(event => (
                  <div 
                    key={event.event_id} 
                    className="widget-item clickable"
                    onClick={() => handleWidgetItemClick(event)}
                  >
                    <div className="item-info">
                      <span className="item-name">{event.name}</span>
                      <span className="item-detail">
                        Presupuesto: {formatCurrency(event.budget)} • Costo: {formatCurrency(event.menu_cost)}
                      </span>
                    </div>
                    <div className="item-value critical">
                      +{formatCurrency(event.excess_amount)}
                    </div>
                  </div>
                ))}
                {widgetsData.budgetExceeded.length > 4 && (
                  <div className="widget-more">
                    +{widgetsData.budgetExceeded.length - 4} más...
                  </div>
                )}
              </div>
            </Widget>

            {/* Widget 4: Eventos Grandes (>50 invitados) */}
            <Widget
              icon={FaUsers}
              title="Eventos Grandes"
              count={widgetsData.largeEvents.length}
              type="info"
              loading={widgetsLoading}
              collapsible={true}
              emptyMessage="Sin eventos grandes"
            >
              <div className="widget-list">
                {widgetsData.largeEvents.slice(0, 4).map(event => (
                  <div 
                    key={event.event_id} 
                    className="widget-item clickable"
                    onClick={() => handleWidgetItemClick(event)}
                  >
                    <div className="item-info">
                      <span className="item-name">{event.name}</span>
                      <span className="item-detail">
                        {formatEventDate(event.event_date)} • {event.location || 'Sin ubicación'}
                      </span>
                    </div>
                    <div className="item-value normal">
                      {event.guests_count} invitados
                    </div>
                  </div>
                ))}
                {widgetsData.largeEvents.length > 4 && (
                  <div className="widget-more">
                    +{widgetsData.largeEvents.length - 4} más...
                  </div>
                )}
              </div>
            </Widget>
          </div>
        </div>
      </BasePage>

      {/* CREATE MODAL */}
      <Modal 
        isOpen={isCreateOpen} 
        title="Nuevo evento" 
        onClose={() => {
          setIsCreateOpen(false);
          setModalError(null);
          setModalMessage(null);
        }} 
        fullscreenMobile={true}
      >
        <div className="event-modal">
          <div className="event-modal-content">
            <div className="event-modal-scrollable">
              <TabsModal
                tabs={tabs}
                activeTab={createModalTab}
                onTabChange={handleCreateTabChange}
                mobileDropdownRef={createDropdownRef}
              >
            {createModalTab === 'info' ? (
              <form onSubmit={handleCreate} className="modal-body-form event-info-form">
                {/* Mostrar mensajes de error/éxito en el modal */}
                {modalError && (
                  <div className="notification error" style={{ marginBottom: '16px' }}>
                    {modalError}
                  </div>
                )}
                {modalMessage && (
                  <div className={`notification ${modalMessageType}`} style={{ marginBottom: '16px' }}>
                    {modalMessage}
                  </div>
                )}

                <div className="form-fields-two-columns">
                  <div className="column-left">
                    <FormField label="Nombre del evento" labelClassName="required-label">
                      <FormInput 
                        type="text" 
                        value={newEvent.name} 
                        onChange={e => setNewEvent({ ...newEvent, name: e.target.value })} 
                        required 
                      />
                    </FormField>

                    <FormField label="Fecha del evento" labelClassName="required-label">
                      <FormInput 
                        type="date" 
                        value={newEvent.event_date} 
                        onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })} 
                        required 
                      />
                    </FormField>

                    <FormField label="Hora del evento">
                      <FormInput 
                        type="time" 
                        value={newEvent.event_time} 
                        onChange={e => setNewEvent({ ...newEvent, event_time: e.target.value })} 
                      />
                    </FormField>

                    <FormField label="Número de invitados" labelClassName="required-label">
                      <FormInput 
                        type="number" 
                        min="1" 
                        value={newEvent.guests_count} 
                        onChange={e => setNewEvent({ ...newEvent, guests_count: parseInt(e.target.value) || 1 })} 
                        required 
                      />
                    </FormField>

                    <FormField label="Descripción">
                      <FormTextarea 
                        rows="3" 
                        value={newEvent.description} 
                        onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} 
                        placeholder="Descripción del evento..."
                      />
                    </FormField>
                  </div>

                  <div className="column-right">
                    <FormField label="Ubicación">
                      <FormInput 
                        type="text" 
                        value={newEvent.location} 
                        onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} 
                        placeholder="Ej: Salón principal, Casa del cliente..."
                      />
                    </FormField>

                    <FormField label="Estado">
                      <FormSelect 
                        value={newEvent.status} 
                        onChange={e => setNewEvent({ ...newEvent, status: e.target.value })}
                      >
                        {eventStatuses.map(status => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </FormSelect>
                    </FormField>

                    <FormField label="Presupuesto">
                      <FormInput 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        value={newEvent.budget} 
                        onChange={e => setNewEvent({ ...newEvent, budget: e.target.value })} 
                        placeholder="0.00"
                      />
                    </FormField>

                    <FormField label="Notas adicionales">
                      <FormTextarea 
                        rows="3" 
                        value={newEvent.notes} 
                        onChange={e => setNewEvent({ ...newEvent, notes: e.target.value })} 
                        placeholder="Notas, requisitos especiales, contactos..."
                      />
                    </FormField>
                  </div>
                </div>
              </form>
            ) : (
              // Pestaña de menú para crear evento
              <div className="menu-form">
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
                    Seleccionar recetas para el menú
                  </h4>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                    Puedes configurar el menú ahora o añadir recetas después de crear el evento.
                  </p>
                </div>

                {/* Campo de búsqueda de recetas */}
                <div className="recipe-search" style={{ marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="Buscar recetas..."
                    className="recipe-search-input"
                    value={recipeSearchText}
                    onChange={(e) => setRecipeSearchText(e.target.value)}
                  />
                </div>

                <div className="recipes-selection">
                  {filteredRecipes.length > 0 ? filteredRecipes.map(recipe => {
                    const isSelected = selectedRecipes.includes(recipe.recipe_id.toString());
                    return (
                      <div key={recipe.recipe_id} className="recipe-item">
                        <div className="recipe-checkbox">
                          <input
                            type="checkbox"
                            id={`recipe-${recipe.recipe_id}`}
                            checked={isSelected}
                            onChange={() => handleRecipeToggle(recipe.recipe_id)}
                          />
                          <label htmlFor={`recipe-${recipe.recipe_id}`}>
                            <strong>{recipe.name}</strong>
                            {recipe.cost_per_serving && (
                              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                                ({formatCurrency(recipe.cost_per_serving)}/porción)
                              </span>
                            )}
                          </label>
                        </div>
                        
                        {isSelected && (
                          <div className="recipe-details" style={{ marginTop: '8px', paddingLeft: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '8px', alignItems: 'center' }}>
                              <div>
                                <label style={{ fontSize: '12px' }}>Porciones</label>
                                <input
                                  type="text"
                                  className="detail-input"
                                  value={recipePortions[recipe.recipe_id] || 1}
                                  onChange={(e) => {
                                    // Permitir cualquier cambio temporalmente
                                    setRecipePortions({
                                      ...recipePortions,
                                      [recipe.recipe_id]: e.target.value
                                    });
                                  }}
                                  onKeyDown={(e) => {
                                    // Solo bloquear caracteres obviamente inválidos
                                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onBlur={(e) => {
                                    // Validar solo al perder el foco
                                    const value = e.target.value.trim();
                                    const numValue = parseInt(value);
                                    
                                    if (value === '' || isNaN(numValue) || numValue < 1) {
                                      setRecipePortions({
                                        ...recipePortions,
                                        [recipe.recipe_id]: 1
                                      });
                                    } else {
                                      setRecipePortions({
                                        ...recipePortions,
                                        [recipe.recipe_id]: numValue
                                      });
                                    }
                                  }}
                                />
                              </div>
                              <div>
                                <label style={{ fontSize: '12px' }}>Tipo</label>
                                <select
                                  className="detail-input"
                                  value={recipeCourseTypes[recipe.recipe_id] || 'main'}
                                  onChange={(e) => setRecipeCourseTypes({
                                    ...recipeCourseTypes,
                                    [recipe.recipe_id]: e.target.value
                                  })}
                                >
                                  {courseTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: '12px' }}>Notas</label>
                                <input
                                  type="text"
                                  className="detail-input"
                                  value={recipeNotes[recipe.recipe_id] || ''}
                                  onChange={(e) => setRecipeNotes({
                                    ...recipeNotes,
                                    [recipe.recipe_id]: e.target.value
                                  })}
                                  placeholder="Notas opcionales..."
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '20px', 
                      color: '#64748b',
                      fontSize: '14px' 
                    }}>
                      {recipeSearchText ? 
                        `No se encontraron recetas que coincidan con "${recipeSearchText}"` : 
                        'No hay recetas disponibles'
                      }
                    </div>
                  )}
                </div>
              </div>
            )}
              </TabsModal>
            </div>
            
            {/* Footer con botones fijos */}
            <div className="event-modal-footer">
              <div className="modal-actions">
                <button type="button" className="btn cancel" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn add" onClick={handleCreate}>
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* DELETE MODAL */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar el evento "${currentItem?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </>
  );
}