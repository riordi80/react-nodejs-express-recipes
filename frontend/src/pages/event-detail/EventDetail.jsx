// src/pages/event-detail/EventDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit3, FiTrash2, FiSave, FiX, FiPlus, FiEdit2 } from 'react-icons/fi';
import { FaUtensils, FaDownload } from 'react-icons/fa';
import Modal from '../../components/modal/Modal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import Loading from '../../components/loading';
import { FormInput, FormTextarea, FormSelect } from '../../components/form/FormField';
import api from '../../api/axios';
import { formatCurrency } from '../../utils/formatters';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';
import './EventDetail.css';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewEvent = id === 'new';
  const { generateEventPDF } = usePDFGenerator();
  
  const [event, setEvent] = useState(null);
  const [eventRecipes, setEventRecipes] = useState([]);
  const [shoppingList, setShoppingList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [isEditing, setIsEditing] = useState(isNewEvent);
  
  const [validationErrors, setValidationErrors] = useState({});
  
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Add recipe modal state
  const [isAddRecipeOpen, setIsAddRecipeOpen] = useState(false);
  const [availableRecipes, setAvailableRecipes] = useState([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState([]);
  const [recipePortions, setRecipePortions] = useState({});
  const [recipeCourseTypes, setRecipeCourseTypes] = useState({});
  const [recipeNotes, setRecipeNotes] = useState({});
  const [recipeSearchText, setRecipeSearchText] = useState('');
  
  // Edit recipe modal state
  const [isEditRecipeOpen, setIsEditRecipeOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState(null);
  
  // Delete recipe modal state
  const [isDeleteRecipeOpen, setIsDeleteRecipeOpen] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);

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

  // Notification function
  const notify = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    if (isNewEvent) {
      initializeNewEvent();
    } else {
      loadEventData();
      loadShoppingList(); // Cargar shopping list para eventos existentes
    }
    loadAvailableRecipes();
  }, [id, isNewEvent]);

  const initializeNewEvent = () => {
    setEvent({
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
    setEventRecipes([]);
    setLoading(false);
  };

  const loadEventData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      setEvent(response.data);
      setEventRecipes(response.data.menu || []);
      setError('');
    } catch (err) {
      console.error('Error loading event:', err);
      setError('Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  // Cargar lista de compras del evento
  const loadShoppingList = async () => {
    try {
      const response = await api.get(`/events/${id}/shopping-list`);
      setShoppingList(response.data);
    } catch (err) {
      console.error('Error loading shopping list:', err);
      setShoppingList(null); // Fallback si no hay lista de compras
    }
  };

  // Cargar recetas disponibles para añadir
  const loadAvailableRecipes = async () => {
    try {
      const response = await api.get('/recipes');
      setAvailableRecipes(response.data);
    } catch (err) {
      console.error('Error loading recipes:', err);
    }
  };


  const handleSave = async () => {
    try {
      // Validar campos obligatorios y crear mensaje específico
      const errors = {};
      
      if (!event.name || event.name.trim() === '') {
        errors.name = 'El nombre del evento es obligatorio';
      }
      
      if (!event.event_date) {
        errors.event_date = 'La fecha del evento es obligatoria';
      }
      
      if (!event.guests_count || parseInt(event.guests_count) <= 0) {
        errors.guests_count = 'El número de invitados es obligatorio y debe ser mayor a 0';
      }
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        
        // Crear mensaje específico con los campos que faltan
        const missingFields = [];
        if (errors.name) missingFields.push('Nombre del evento');
        if (errors.event_date) missingFields.push('Fecha del evento');
        if (errors.guests_count) missingFields.push('Número de invitados');
        
        const message = missingFields.length === 1 
          ? `Falta completar el campo: ${missingFields[0]}`
          : `Faltan completar los campos: ${missingFields.join(', ')}`;
          
        notify(message, 'error');
        return;
      }

      // Preparar datos para enviar, asegurando formato correcto de fecha
      const eventData = {
        ...event,
        event_date: event.event_date ? event.event_date.split('T')[0] : event.event_date, // Solo YYYY-MM-DD
        guests_count: parseInt(event.guests_count) || 1,
        budget: event.budget ? parseFloat(event.budget) : null
      };

      if (isNewEvent) {
        const response = await api.post('/events', eventData);
        navigate(`/events/${response.data.event_id}`);
      } else {
        await api.put(`/events/${id}`, eventData);
        setIsEditing(false);
        await loadEventData();
      }
      setValidationErrors({}); // Limpiar errores si todo va bien
      notify('Evento guardado correctamente', 'success');
    } catch (error) {
      console.error('Error saving event:', error);
      setError(error.response?.data?.message || 'Error al guardar el evento');
    }
  };

  const handleBack = () => {
    navigate('/events');
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const openDeleteModal = () => {
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/events/${id}`);
      setIsDeleteOpen(false);
      navigate('/events');
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Error al eliminar el evento');
    }
  };

  const openDeleteRecipeModal = (recipe) => {
    setRecipeToDelete(recipe);
    setIsDeleteRecipeOpen(true);
  };

  const handleRemoveRecipe = async () => {
    try {
      await api.delete(`/events/${id}/recipes/${recipeToDelete.recipe_id}`);
      await loadEventData();
      await loadShoppingList(); // Actualizar shopping list tras eliminar receta
      setIsDeleteRecipeOpen(false);
      setRecipeToDelete(null);
    } catch (error) {
      console.error('Error removing recipe:', error);
      setError('Error al eliminar receta del menú');
    }
  };

  // Abrir modal para añadir recetas
  const openAddRecipeModal = () => {
    setSelectedRecipeIds([]);
    setRecipePortions({});
    setRecipeCourseTypes({});
    setRecipeNotes({});
    setRecipeSearchText('');
    setIsAddRecipeOpen(true);
  };

  // Manejar selección de recetas
  const handleRecipeToggle = (recipeId) => {
    const recipeIdStr = recipeId.toString();
    if (selectedRecipeIds.includes(recipeIdStr)) {
      setSelectedRecipeIds(selectedRecipeIds.filter(id => id !== recipeIdStr));
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
      setSelectedRecipeIds([...selectedRecipeIds, recipeIdStr]);
      setRecipePortions({ ...recipePortions, [recipeId]: 1 });
      setRecipeCourseTypes({ ...recipeCourseTypes, [recipeId]: 'main' });
    }
  };

  // Añadir recetas seleccionadas al evento
  const handleAddRecipes = async () => {
    try {
      for (const recipeId of selectedRecipeIds) {
        await api.post(`/events/${id}/recipes`, {
          recipe_id: parseInt(recipeId),
          portions: recipePortions[recipeId] || 1,
          course_type: recipeCourseTypes[recipeId] || 'main',
          notes: recipeNotes[recipeId] || ''
        });
      }
      
      setIsAddRecipeOpen(false);
      setSelectedRecipeIds([]);
      setRecipePortions({});
      setRecipeCourseTypes({});
      setRecipeNotes({});
      setRecipeSearchText('');
      await loadEventData();
      await loadShoppingList(); // Actualizar shopping list tras añadir recetas
    } catch (error) {
      console.error('Error adding recipes:', error);
      setError('Error al añadir recetas al menú');
    }
  };

  // Abrir modal para editar receta
  const openEditRecipeModal = (menuItem) => {
    setRecipeToEdit(menuItem);
    setIsEditRecipeOpen(true);
  };

  // Actualizar receta en el menú
  const handleEditRecipe = async (updatedRecipe) => {
    try {
      await api.put(`/events/${id}/recipes/${updatedRecipe.recipe_id}`, {
        portions: updatedRecipe.portions,
        course_type: updatedRecipe.course_type,
        notes: updatedRecipe.notes
      });
      
      setIsEditRecipeOpen(false);
      setRecipeToEdit(null);
      await loadEventData();
      await loadShoppingList(); // Actualizar shopping list tras editar receta
    } catch (error) {
      console.error('Error updating recipe:', error);
      setError('Error al actualizar receta del menú');
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

  // Obtener etiqueta del tipo de plato
  const getCourseTypeLabel = (courseType) => {
    const typeObj = courseTypes.find(t => t.value === courseType);
    return typeObj ? typeObj.label : courseType;
  };

  // Función para generar PDF del evento
  const handleDownloadPDF = () => {
    if (!event) return;
    generateEventPDF(event, eventRecipes);
  };

  // Calcular métricas de coste del evento
  const calculateEventCostMetrics = () => {
    if (!event || !eventRecipes.length) return null;

    const guestsCount = parseInt(event.guests_count) || 1;
    const budget = parseFloat(event.budget) || 0;
    
    // Coste total de ingredientes (desde shopping list)
    const totalIngredientsCost = shoppingList?.total_cost || 0;
    
    // Coste por invitado (desde ingredientes)
    const costPerGuest = guestsCount > 0 ? totalIngredientsCost / guestsCount : 0;
    
    // Precio por invitado (desde el presupuesto)
    const pricePerGuest = budget > 0 && guestsCount > 0 ? budget / guestsCount : 0;
    
    // Desviación presupuestaria (diferencia entre presupuesto y coste real)
    const budgetDeviation = budget - totalIngredientsCost;
    const budgetDeviationPercent = budget > 0 ? ((budgetDeviation / budget) * 100) : 0;

    return {
      guestsCount,
      budget,
      costPerGuest,
      pricePerGuest,
      budgetDeviation,
      budgetDeviationPercent,
      totalIngredientsCost,
      hasShoppingList: !!shoppingList,
      recipesCount: eventRecipes.length
    };
  };

  // Filtrar recetas disponibles por texto de búsqueda y excluir las ya añadidas
  const filteredAvailableRecipes = availableRecipes.filter(recipe => {
    const matchesSearch = !recipeSearchText || 
      recipe.name.toLowerCase().includes(recipeSearchText.toLowerCase());
    const notInMenu = !eventRecipes.some(menuItem => menuItem.recipe_id === recipe.recipe_id);
    return matchesSearch && notInMenu;
  });

  // Crear un header personalizado con título a la izquierda y botones a la derecha
  const customHeader = (
    <div className="event-detail-header">      
      <h1 className="event-detail-title">
        {isNewEvent ? 'Nuevo Evento' : (event ? event.name : 'Detalle de Evento')}
      </h1>
      
      <div className="event-detail-header-right">
        <button className="btn secondary event-back-btn" onClick={handleBack} title="Volver">
          <FiArrowLeft />
        </button>
        {!isEditing ? (
          <>
            {!isNewEvent && (
              <button className="btn edit" onClick={handleDownloadPDF} title="Descargar PDF">
                <FaDownload /> <span className="btn-text">PDF</span>
              </button>
            )}
            <button className="btn edit" onClick={toggleEdit}>
              <FiEdit3 /> <span className="btn-text">Editar</span>
            </button>
            {!isNewEvent && (
              <button className="btn delete" onClick={openDeleteModal}>
                <FiTrash2 /> <span className="btn-text">Eliminar</span>
              </button>
            )}
          </>
        ) : (
          <>
            <button className="btn cancel" onClick={() => isNewEvent ? navigate('/events') : setIsEditing(false)}>
              <FiX /> <span className="btn-text">Cancelar</span>
            </button>
            <button className="btn add" onClick={handleSave}>
              <FiSave /> <span className="btn-text">{isNewEvent ? 'Crear' : 'Guardar'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );

  const eventContent = () => {
    if (loading) {
      return <Loading message="Cargando evento..." size="large" />;
    }

    if (!event) {
      return <div className="error">No se encontró el evento</div>;
    }

    return (
      <div className="event-detail-content">
        {/* Basic Information Section */}
        <div className="event-section">
          <h2 className="section-title">📋 Información Básica</h2>
          <div className="section-content">
            <div className="form-grid-2">
              <div className="form-field">
                <label className="required-label">Nombre del evento</label>
                {isEditing ? (
                  <FormInput
                    type="text"
                    value={event.name || ''}
                    onChange={(e) => {
                      setEvent({...event, name: e.target.value});
                      if (validationErrors.name) {
                        setValidationErrors({...validationErrors, name: null});
                      }
                    }}
                  />
                ) : (
                  <div className="form-value">{event.name}</div>
                )}
              </div>
              
              <div className="form-field">
                <label>Estado</label>
                {isEditing ? (
                  <FormSelect
                    value={event.status || 'planned'}
                    onChange={(e) => setEvent({...event, status: e.target.value})}
                  >
                    {eventStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </FormSelect>
                ) : (
                  <div className="form-value">
                    <span style={{ 
                      color: getStatusColor(event.status),
                      fontWeight: '500'
                    }}>
                      {getStatusLabel(event.status)}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-field">
                <label className="required-label">Fecha del evento</label>
                {isEditing ? (
                  <FormInput
                    type="date"
                    value={event.event_date ? event.event_date.split('T')[0] : ''}
                    onChange={(e) => {
                      setEvent({...event, event_date: e.target.value});
                      if (validationErrors.event_date) {
                        setValidationErrors({...validationErrors, event_date: null});
                      }
                    }}
                  />
                ) : (
                  <div className="form-value">
                    {event.event_date ? new Date(event.event_date).toLocaleDateString('es-ES') : '-'}
                  </div>
                )}
              </div>

              <div className="form-field">
                <label>Hora del evento</label>
                {isEditing ? (
                  <FormInput
                    type="time"
                    value={event.event_time || ''}
                    onChange={(e) => setEvent({...event, event_time: e.target.value})}
                  />
                ) : (
                  <div className="form-value">
                    {event.event_time ? event.event_time.slice(0, 5) : '-'}
                  </div>
                )}
              </div>
            </div>

            <div className="form-grid-3">
              <div className="form-field">
                <label className="required-label">Número de invitados</label>
                {isEditing ? (
                  <FormInput
                    type="number"
                    min="1"
                    value={event.guests_count || 1}
                    onChange={(e) => {
                      setEvent({...event, guests_count: parseInt(e.target.value) || 1});
                      if (validationErrors.guests_count) {
                        setValidationErrors({...validationErrors, guests_count: null});
                      }
                    }}
                  />
                ) : (
                  <div className="form-value">
                    {event.guests_count} {event.guests_count === 1 ? 'invitado' : 'invitados'}
                  </div>
                )}
              </div>

              <div className="form-field">
                <label>Ubicación</label>
                {isEditing ? (
                  <FormInput
                    type="text"
                    value={event.location || ''}
                    onChange={(e) => setEvent({...event, location: e.target.value})}
                    placeholder="Ej: Salón principal, Casa del cliente..."
                  />
                ) : (
                  <div className="form-value">
                    {event.location || '-'}
                  </div>
                )}
              </div>

              <div className="form-field">
                <label>Presupuesto</label>
                {isEditing ? (
                  <FormInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={event.budget || ''}
                    onChange={(e) => setEvent({...event, budget: e.target.value})}
                    placeholder="0.00"
                  />
                ) : (
                  <div className="form-value">
                    {event.budget ? formatCurrency(event.budget) : '-'}
                  </div>
                )}
              </div>
            </div>

            <div className="form-field">
              <label>Descripción</label>
              {isEditing ? (
                <FormTextarea
                  rows="3"
                  value={event.description || ''}
                  onChange={(e) => setEvent({...event, description: e.target.value})}
                  placeholder="Descripción del evento..."
                />
              ) : (
                <div className="form-value">{event.description || '-'}</div>
              )}
            </div>

            <div className="form-field">
              <label>Notas adicionales</label>
              {isEditing ? (
                <FormTextarea
                  rows="3"
                  value={event.notes || ''}
                  onChange={(e) => setEvent({...event, notes: e.target.value})}
                  placeholder="Notas, requisitos especiales, contactos..."
                />
              ) : (
                <div className="form-value">{event.notes || '-'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Menu Section */}
        <div className="event-section">
          <h2 className="section-title">🍽️ Menú del Evento</h2>
          <div className="section-content">
            {eventRecipes.length > 0 ? (
              <>
                {/* Botón para añadir más recetas cuando ya hay alguna */}
                {isEditing && !isNewEvent && (
                  <div style={{ marginBottom: '16px' }}>
                    <button 
                      className="btn add" 
                      onClick={openAddRecipeModal}
                    >
                      <FiPlus /> Añadir más recetas
                    </button>
                  </div>
                )}
                
                <div className="menu-list">
                  {eventRecipes.map((menuItem, index) => (
                    <div key={index} className="menu-item">
                      <div className="menu-item-header">
                        <div className="menu-item-name">
                          <FaUtensils style={{ marginRight: '8px', color: '#64748b' }} />
                          <strong>{menuItem.recipe_name || menuItem.name}</strong>
                        </div>
                        <div className="menu-item-type">
                          <span className="course-type-badge">
                            {getCourseTypeLabel(menuItem.course_type)}
                          </span>
                        </div>
                        {isEditing && (
                          <div className="menu-item-actions" style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                            <button 
                              className="icon-btn edit-icon" 
                              onClick={() => openEditRecipeModal(menuItem)}
                              title="Editar receta en menú"
                              style={{ 
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px', 
                                height: '32px',
                                minWidth: '32px',
                                minHeight: '32px',
                                maxWidth: '32px',
                                maxHeight: '32px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                padding: '0',
                                margin: '0',
                                boxSizing: 'border-box'
                              }}
                            >
                              <FiEdit3 />
                            </button>
                            <button 
                              className="icon-btn delete-icon" 
                              onClick={() => openDeleteRecipeModal(menuItem)}
                              title="Eliminar del menú"
                              style={{ 
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px', 
                                height: '32px',
                                minWidth: '32px',
                                minHeight: '32px',
                                maxWidth: '32px',
                                maxHeight: '32px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                padding: '0',
                                margin: '0',
                                boxSizing: 'border-box'
                              }}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="menu-item-details">
                        <span><strong>Porciones:</strong> {menuItem.portions}</span>
                        {menuItem.notes && (
                          <span><strong>Notas:</strong> {menuItem.notes}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>No hay recetas añadidas al menú</p>
                {isEditing && !isNewEvent && (
                  <button 
                    className="btn add" 
                    onClick={openAddRecipeModal}
                    style={{ marginTop: '16px' }}
                  >
                    <FiPlus /> Añadir primera receta
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cost Analysis Section */}
        <div className="event-section">
          <h2 className="section-title">💰 Análisis de Costes del Evento</h2>
          <div className="section-content">
            {(() => {
              const metrics = calculateEventCostMetrics();
              if (!metrics) {
                return (
                  <div className="empty-state">
                    <p>Añade recetas al menú para ver el análisis de costes</p>
                  </div>
                );
              }
              
              return (
                <div className="cost-grid">
                  <div className="cost-card">
                    <div className="cost-label">Coste Total del Menú</div>
                    <div className="cost-value primary">{formatCurrency(metrics.totalIngredientsCost)}</div>
                    <div className="cost-detail">
                      {metrics.recipesCount} {metrics.recipesCount === 1 ? 'receta' : 'recetas'} en el menú
                    </div>
                  </div>
                  
                  <div className="cost-card">
                    <div className="cost-label">Coste por Invitado</div>
                    <div className="cost-value">{formatCurrency(metrics.costPerGuest)}</div>
                    <div className="cost-detail">
                      Coste real para {metrics.guestsCount} {metrics.guestsCount === 1 ? 'invitado' : 'invitados'}
                    </div>
                  </div>
                  
                  <div className="cost-card">
                    <div className="cost-label">Presupuesto Asignado</div>
                    <div className="cost-value highlight">
                      {metrics.budget > 0 ? formatCurrency(metrics.budget) : 'Sin presupuesto'}
                    </div>
                    <div className="cost-detail">
                      {metrics.budget > 0 ? 'Presupuesto total del evento' : 'No definido'}
                    </div>
                  </div>
                  
                  {metrics.budget > 0 && (
                    <div className="cost-card">
                      <div className="cost-label">Precio por Invitado</div>
                      <div className="cost-value success">{formatCurrency(metrics.pricePerGuest)}</div>
                      <div className="cost-detail">
                        Presupuesto dividido entre invitados
                      </div>
                    </div>
                  )}
                  
                  <div className="cost-card">
                    <div className="cost-label">Desviación Presupuestaria</div>
                    <div className={`cost-value ${metrics.budgetDeviation >= 0 ? 'success' : 'danger'}`}>
                      {metrics.budget > 0 ? formatCurrency(metrics.budgetDeviation) : 'N/A'}
                    </div>
                    <div className="cost-detail">
                      {metrics.budget > 0 ? (
                        <>
                          {metrics.budgetDeviation >= 0 ? 'Dentro del presupuesto ' : 'Excede el presupuesto '}
                          ({metrics.budgetDeviationPercent >= 0 ? '+' : ''}{metrics.budgetDeviationPercent.toFixed(1)}%)
                        </>
                      ) : (
                        'Define un presupuesto para el análisis'
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="common-page-container">
        <div className="common-page-content">
          {/* Header personalizado con botones a los lados */}
          {customHeader}
          
          {/* Message display - debajo de todo el header */}
          {message && (
            <div className={`page-header-message page-header-message-${messageType} event-detail-message`}>
              {message}
            </div>
          )}
          
          {/* Error display */}
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '20px' }}>
              {error}
            </div>
          )}
          
          {/* Contenido del evento */}
          {eventContent()}
        </div>
      </div>

      {/* Delete Event Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar el evento "${event?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Add Recipe Modal */}
      <Modal isOpen={isAddRecipeOpen} title="Añadir recetas al menú" onClose={() => setIsAddRecipeOpen(false)} fullscreenMobile={true}>
        <div style={{ maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <p style={{ marginBottom: '16px', fontSize: '14px', color: '#64748b' }}>
            Selecciona las recetas que quieres añadir al menú del evento.
          </p>
          
          {/* Campo de búsqueda */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Buscar recetas..."
              value={recipeSearchText}
              onChange={(e) => setRecipeSearchText(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Lista de recetas */}
          <div style={{ flex: 1, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
            {filteredAvailableRecipes.length > 0 ? filteredAvailableRecipes.map(recipe => {
              const isSelected = selectedRecipeIds.includes(recipe.recipe_id.toString());
              return (
                <div key={recipe.recipe_id} style={{ marginBottom: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isSelected ? '8px' : '0' }}>
                    <input
                      type="checkbox"
                      id={`recipe-${recipe.recipe_id}`}
                      checked={isSelected}
                      onChange={() => handleRecipeToggle(recipe.recipe_id)}
                    />
                    <label htmlFor={`recipe-${recipe.recipe_id}`} style={{ fontWeight: '500', color: '#1e293b', flex: 1, cursor: 'pointer' }}>
                      {recipe.name}
                      {recipe.cost_per_serving && (
                        <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                          ({formatCurrency(recipe.cost_per_serving)}/porción)
                        </span>
                      )}
                    </label>
                  </div>
                  
                  {isSelected && (
                    <div style={{ paddingLeft: '24px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>Porciones</label>
                          <input
                            type="number"
                            min="1"
                            value={recipePortions[recipe.recipe_id] || 1}
                            onChange={(e) => setRecipePortions({
                              ...recipePortions,
                              [recipe.recipe_id]: parseInt(e.target.value) || 1
                            })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>Tipo</label>
                          <select
                            value={recipeCourseTypes[recipe.recipe_id] || 'main'}
                            onChange={(e) => setRecipeCourseTypes({
                              ...recipeCourseTypes,
                              [recipe.recipe_id]: e.target.value
                            })}
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                          >
                            {courseTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>Notas</label>
                          <input
                            type="text"
                            value={recipeNotes[recipe.recipe_id] || ''}
                            onChange={(e) => setRecipeNotes({
                              ...recipeNotes,
                              [recipe.recipe_id]: e.target.value
                            })}
                            placeholder="Notas opcionales..."
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '14px' }}
                          />
                        </div>
                      </div>
                      
                      {/* Mensaje de advertencia si las porciones son menores a las raciones mínimas */}
                      {recipe.production_servings && (recipePortions[recipe.recipe_id] || 1) < parseInt(recipe.production_servings) && (
                        <div style={{ 
                          backgroundColor: '#fef3cd', 
                          border: '1px solid #ffd43b', 
                          borderRadius: '4px', 
                          padding: '8px 12px', 
                          fontSize: '12px', 
                          color: '#856404',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginTop: '8px'
                        }}>
                          <span style={{ fontSize: '14px' }}>⚠️</span>
                          <span>
                            <strong>Advertencia:</strong> Esta receta tiene {recipe.production_servings} raciones mínimas para producción. 
                            Seleccionaste {recipePortions[recipe.recipe_id] || 1} porciones.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '14px' }}>
                {recipeSearchText ? 
                  `No se encontraron recetas que coincidan con "${recipeSearchText}"` : 
                  'No hay recetas disponibles para añadir'
                }
              </div>
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: '16px' }}>
            <button type="button" className="btn cancel" onClick={() => setIsAddRecipeOpen(false)}>
              Cancelar
            </button>
            <button 
              type="button" 
              className="btn add" 
              onClick={handleAddRecipes}
              disabled={selectedRecipeIds.length === 0}
            >
              Añadir {selectedRecipeIds.length > 0 ? `${selectedRecipeIds.length} receta${selectedRecipeIds.length > 1 ? 's' : ''}` : 'recetas'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Recipe Modal */}
      <Modal isOpen={isEditRecipeOpen} title="Editar receta en el menú" onClose={() => setIsEditRecipeOpen(false)}>
        {recipeToEdit && (
          <div>
            <h4 style={{ marginBottom: '16px', color: '#1e293b' }}>{recipeToEdit.recipe_name || recipeToEdit.name}</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                  Porciones
                </label>
                <input
                  type="number"
                  min="1"
                  value={recipeToEdit.portions}
                  onChange={(e) => setRecipeToEdit({
                    ...recipeToEdit,
                    portions: parseInt(e.target.value) || 1
                  })}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                  Tipo de plato
                </label>
                <select
                  value={recipeToEdit.course_type}
                  onChange={(e) => setRecipeToEdit({
                    ...recipeToEdit,
                    course_type: e.target.value
                  })}
                  style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}
                >
                  {courseTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Mensaje de advertencia si las porciones son menores a las raciones mínimas */}
            {recipeToEdit.production_servings && recipeToEdit.portions < parseInt(recipeToEdit.production_servings) && (
              <div style={{ 
                backgroundColor: '#fef3cd', 
                border: '1px solid #ffd43b', 
                borderRadius: '4px', 
                padding: '8px 12px', 
                fontSize: '12px', 
                color: '#856404',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '16px'
              }}>
                <span style={{ fontSize: '14px' }}>⚠️</span>
                <span>
                  <strong>Advertencia:</strong> Esta receta tiene {recipeToEdit.production_servings} raciones mínimas para producción. 
                  Seleccionaste {recipeToEdit.portions} porciones.
                </span>
              </div>
            )}
            
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#374151', fontSize: '14px' }}>
                Notas
              </label>
              <textarea
                rows="3"
                value={recipeToEdit.notes || ''}
                onChange={(e) => setRecipeToEdit({
                  ...recipeToEdit,
                  notes: e.target.value
                })}
                placeholder="Notas opcionales..."
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div className="modal-actions" style={{ marginTop: '20px' }}>
              <button type="button" className="btn cancel" onClick={() => setIsEditRecipeOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="btn edit" onClick={() => handleEditRecipe(recipeToEdit)}>
                Guardar cambios
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Recipe from Menu Modal */}
      <ConfirmModal
        isOpen={isDeleteRecipeOpen}
        onClose={() => setIsDeleteRecipeOpen(false)}
        onConfirm={handleRemoveRecipe}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar "${recipeToDelete?.recipe_name || recipeToDelete?.name}" del menú?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </>
  );
};

export default EventDetail;