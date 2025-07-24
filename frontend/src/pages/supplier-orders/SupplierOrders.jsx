// src/pages/supplier-orders/SupplierOrders.jsx
import React, { useState, useEffect } from 'react';
import { FaTruck, FaEuroSign, FaBoxOpen, FaExclamationTriangle, FaPlus, FaListUl, FaHistory, FaChartBar } from 'react-icons/fa';
import api from '../../api/axios';
import { formatCurrency, formatDecimal } from '../../utils/formatters';
import './SupplierOrders.css';

const SupplierOrders = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [metrics, setMetrics] = useState({
    monthlySpending: 0,
    todayDeliveries: 0,
    potentialSavings: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);
  
  // Estados para Lista de Compras
  const [shoppingList, setShoppingList] = useState(null);
  const [shoppingListLoading, setShoppingListLoading] = useState(false);
  const [filters, setFilters] = useState({
    includeStock: true,
    includeConfirmed: true,
    includePlanned: false,
    days: 30
  });
  
  // Estados para selección de eventos
  const [availableEvents, setAvailableEvents] = useState([]);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showEventSelection, setShowEventSelection] = useState(false);

  // Estados para pedidos manuales
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [manualOrderItems, setManualOrderItems] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'shopping-list') {
      loadAvailableEvents();
      loadShoppingList();
    }
  }, [activeTab, filters]);

  useEffect(() => {
    if (showEventSelection && selectedEventIds.length > 0) {
      loadShoppingList();
    }
  }, [selectedEventIds]);

  useEffect(() => {
    // Recargar la lista cuando cambiamos de modo
    if (activeTab === 'shopping-list') {
      if (!showManualOrder) {
        loadShoppingList();
      } else {
        // Si cambiamos a modo manual, limpiar cualquier lista anterior
        setShoppingList(null);
      }
    }
  }, [showEventSelection, showManualOrder]);

  const loadDashboardData = async () => {
    try {
      console.log('Attempting to load dashboard data...');
      
      const response = await api.get('/supplier-orders/dashboard');
      console.log('Response data:', response.data);
      
      setMetrics({
        monthlySpending: response.data.monthlySpending,
        todayDeliveries: response.data.todayDeliveries,
        potentialSavings: response.data.potentialSavings,
        lowStockItems: response.data.lowStockItems
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback a datos por defecto en caso de error
      setMetrics({
        monthlySpending: 0,
        todayDeliveries: 0,
        potentialSavings: 0,
        lowStockItems: 0
      });
      setLoading(false);
    }
  };

  const loadAvailableEvents = async () => {
    try {
      setEventsLoading(true);
      const queryParams = new URLSearchParams({
        days: (filters.days * 2).toString() // Cargar más eventos para selección
      });
      
      const response = await api.get(`/supplier-orders/available-events?${queryParams}`);
      setAvailableEvents(response.data);
      setEventsLoading(false);
    } catch (error) {
      console.error('Error loading available events:', error);
      setEventsLoading(false);
    }
  };

  const loadShoppingList = async () => {
    try {
      setShoppingListLoading(true);
      
      // Si estamos en modo de selección específica pero no hay eventos seleccionados, no cargar
      if (showEventSelection && selectedEventIds.length === 0) {
        setShoppingList(null);
        setShoppingListLoading(false);
        return;
      }
      
      const queryParams = new URLSearchParams({
        includeStock: filters.includeStock.toString(),
        includeConfirmed: filters.includeConfirmed.toString(),
        includePlanned: filters.includePlanned.toString(),
        days: filters.days.toString()
      });

      // Si hay eventos específicos seleccionados, añadirlos
      if (showEventSelection && selectedEventIds.length > 0) {
        queryParams.set('eventIds', selectedEventIds.join(','));
      }

      const response = await api.get(`/supplier-orders/shopping-list?${queryParams}`);
      setShoppingList(response.data);
      setShoppingListLoading(false);
    } catch (error) {
      console.error('Error loading shopping list:', error);
      setShoppingListLoading(false);
    }
  };

  const handleEventSelection = (eventId, isSelected) => {
    if (isSelected) {
      setSelectedEventIds(prev => [...prev, eventId]);
    } else {
      setSelectedEventIds(prev => prev.filter(id => id !== eventId));
    }
  };

  const handleSelectAllEvents = () => {
    if (selectedEventIds.length === availableEvents.length) {
      setSelectedEventIds([]);
    } else {
      setSelectedEventIds(availableEvents.map(event => event.event_id));
    }
  };

  const toggleEventSelectionMode = () => {
    setShowEventSelection(!showEventSelection);
    if (!showEventSelection) {
      setSelectedEventIds([]);
    }
    setShoppingList(null); // Limpiar lista anterior cuando cambiamos modo
  };

  // Funciones para pedidos manuales
  const loadAvailableIngredients = async () => {
    try {
      setIngredientsLoading(true);
      const response = await api.get('/ingredients');
      const ingredients = response.data.filter(ing => ing.is_available);
      
      // Cargar información de proveedores para cada ingrediente
      const ingredientsWithSuppliers = await Promise.all(
        ingredients.map(async (ingredient) => {
          try {
            const supplierResponse = await api.get(`/ingredients/${ingredient.ingredient_id}/suppliers`);
            const preferredSupplier = supplierResponse.data.find(s => s.is_preferred_supplier);
            return {
              ...ingredient,
              preferredSupplier: preferredSupplier || null
            };
          } catch (error) {
            return { ...ingredient, preferredSupplier: null };
          }
        })
      );
      
      setAvailableIngredients(ingredientsWithSuppliers);
      setIngredientsLoading(false);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      setIngredientsLoading(false);
    }
  };

  const toggleManualOrderMode = () => {
    const newShowManualOrder = !showManualOrder;
    setShowManualOrder(newShowManualOrder);
    
    if (newShowManualOrder) {
      loadAvailableIngredients();
      setShowEventSelection(false);
      setSelectedEventIds([]);
      setShoppingList(null); // Limpiar lista anterior
    } else {
      setManualOrderItems([]);
      setShoppingList(null); // Limpiar lista manual
    }
  };

  const addManualOrderItem = () => {
    const newItem = {
      id: Date.now(),
      ingredientId: '',
      quantity: '',
      notes: ''
    };
    setManualOrderItems([...manualOrderItems, newItem]);
  };

  const updateManualOrderItem = (id, field, value) => {
    setManualOrderItems(items => 
      items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeManualOrderItem = (id) => {
    setManualOrderItems(items => items.filter(item => item.id !== id));
  };

  const generateManualShoppingList = () => {
    const validItems = manualOrderItems.filter(item => 
      item.ingredientId && item.quantity
    );

    if (validItems.length === 0) {
      return;
    }

    // Convertir items manuales a formato similar a shopping list
    const manualSupplierGroups = {};
    
    validItems.forEach(item => {
      const ingredient = availableIngredients.find(ing => 
        ing.ingredient_id === parseInt(item.ingredientId)
      );
      
      if (!ingredient) return;

      const quantity = parseFloat(item.quantity.replace(',', '.'));
      const totalCost = quantity * ingredient.base_price;

      // Agrupar por "Pedido Manual"
      if (!manualSupplierGroups[999]) {
        manualSupplierGroups[999] = {
          supplierId: 999,
          supplierName: 'Pedido Manual',
          ingredients: [],
          supplierTotal: 0
        };
      }

      const ingredientData = {
        ingredientId: ingredient.ingredient_id,
        name: ingredient.name,
        needed: quantity,
        inStock: ingredient.stock || 0,
        toBuy: quantity,
        unit: ingredient.unit,
        pricePerUnit: ingredient.base_price,
        totalCost: totalCost,
        packageSize: 1,
        packageUnit: 'unidad',
        minimumOrderQuantity: 1,
        supplierPrice: ingredient.base_price,
        packagesToBuy: 0,
        realQuantity: 0,
        realTotalCost: totalCost,
        notes: item.notes
      };

      manualSupplierGroups[999].ingredients.push(ingredientData);
      manualSupplierGroups[999].supplierTotal += totalCost;
    });

    const totalCost = Object.values(manualSupplierGroups)
      .reduce((sum, group) => sum + group.supplierTotal, 0);

    const manualShoppingList = {
      totalEvents: 0,
      dateRange: { from: null, to: null },
      ingredientsBySupplier: Object.values(manualSupplierGroups),
      totalCost: totalCost,
      filters: { manual: true },
      generatedAt: new Date().toISOString()
    };

    setShoppingList(manualShoppingList);
  };

  const renderDashboard = () => (
    <div className="dashboard-section">
      <h2 className="section-title">
        <FaChartBar />
        Dashboard de Compras
      </h2>
      
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <FaEuroSign />
          </div>
          <div className="metric-info">
            <div className="metric-label">Gasto Mensual</div>
            <div className="metric-value">{formatCurrency(metrics.monthlySpending)}</div>
            <div className="metric-detail">Último mes</div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <FaTruck />
          </div>
          <div className="metric-info">
            <div className="metric-label">Entregas Hoy</div>
            <div className="metric-value">{metrics.todayDeliveries}</div>
            <div className="metric-detail">Entregas completadas hoy</div>
          </div>
        </div>

        <div className="metric-card highlight">
          <div className="metric-icon">
            <FaEuroSign />
          </div>
          <div className="metric-info">
            <div className="metric-label">Ahorro Potencial</div>
            <div className="metric-value">{formatCurrency(metrics.potentialSavings)}</div>
            <div className="metric-detail">Consolidando pedidos pendientes</div>
          </div>
        </div>

        <div className="metric-card highlight warning-style">
          <div className="metric-icon">
            <FaExclamationTriangle />
          </div>
          <div className="metric-info">
            <div className="metric-label">Stock Bajo</div>
            <div className="metric-value">{metrics.lowStockItems}</div>
            <div className="metric-detail">Requieren reposición</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Acciones Rápidas</h3>
        <div className="actions-grid">
          <button className="btn add" onClick={() => setActiveTab('shopping-list')}>
            <FaPlus /> Generar Lista de Compras
          </button>
          <button className="btn view" onClick={() => setActiveTab('active-orders')}>
            <FaListUl /> Ver Pedidos Activos
          </button>
          <button className="btn edit" onClick={() => setActiveTab('suppliers')}>
            <FaTruck /> Gestionar Proveedores
          </button>
        </div>
      </div>
    </div>
  );

  const renderShoppingList = () => (
    <div className="shopping-list-section">
      <h2 className="section-title">
        <FaListUl />
        Lista de Compras Inteligente
      </h2>

      {/* Modo de Selección */}
      <div className="selection-mode">
        <div className="mode-toggle">
          <button 
            className={`mode-btn ${!showEventSelection && !showManualOrder ? 'active' : ''}`}
            onClick={() => {
              if (showEventSelection) toggleEventSelectionMode();
              if (showManualOrder) toggleManualOrderMode();
              setShoppingList(null);
            }}
          >
            <FaListUl /> Automático por Filtros
          </button>
          <button 
            className={`mode-btn ${showEventSelection && !showManualOrder ? 'active' : ''}`}
            onClick={() => {
              if (!showEventSelection) toggleEventSelectionMode();
              if (showManualOrder) toggleManualOrderMode();
              setShoppingList(null);
            }}
          >
            <FaPlus /> Seleccionar Eventos Específicos
          </button>
          <button 
            className={`mode-btn ${showManualOrder ? 'active' : ''}`}
            onClick={() => {
              if (!showManualOrder) toggleManualOrderMode();
              if (showEventSelection) toggleEventSelectionMode();
              setShoppingList(null);
            }}
          >
            <FaBoxOpen /> Pedido Manual
          </button>
        </div>
        
        {showEventSelection && (
          <div className="event-selection-section">
            <div className="selection-header">
              <h3>Seleccionar Eventos ({availableEvents.length} disponibles)</h3>
              <div className="selection-actions">
                <button 
                  className="btn-link"
                  onClick={handleSelectAllEvents}
                >
                  {selectedEventIds.length === availableEvents.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                </button>
                <span className="selection-count">
                  {selectedEventIds.length} seleccionados
                </span>
              </div>
            </div>

            {eventsLoading ? (
              <div className="loading">Cargando eventos disponibles...</div>
            ) : (
              <div className="events-grid">
                {availableEvents.map(event => (
                  <div 
                    key={event.event_id} 
                    className={`event-card ${selectedEventIds.includes(event.event_id) ? 'selected' : ''}`}
                    onClick={() => handleEventSelection(event.event_id, !selectedEventIds.includes(event.event_id))}
                  >
                    <div className="event-checkbox">
                      <input
                        type="checkbox"
                        id={`event-${event.event_id}`}
                        checked={selectedEventIds.includes(event.event_id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleEventSelection(event.event_id, e.target.checked);
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
        )}

        {showManualOrder && (
          <div className="manual-order-section">
            <div className="selection-header">
              <h3>Crear Pedido Manual</h3>
              <div className="selection-actions">
                <button 
                  className="btn-link"
                  onClick={addManualOrderItem}
                >
                  + Añadir Ingrediente
                </button>
                <button 
                  className="btn add"
                  onClick={generateManualShoppingList}
                  disabled={manualOrderItems.length === 0}
                >
                  Generar Lista
                </button>
              </div>
            </div>
            
            <div 
              className="manual-order-info"
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '16px',
                margin: '16px 0'
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: '#1e40af',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              >
                📝 <strong>Pedidos independientes:</strong> Especifica la cantidad exacta que necesitas de cada ingrediente. 
                Si el ingrediente tiene proveedor asignado, verás información sobre el tamaño de paquete y precios reales.
              </p>
            </div>

            {manualOrderItems.length === 0 ? (
              <div className="empty-state">
                <p>Añade ingredientes para crear un pedido manual</p>
              </div>
            ) : (
              <div className="manual-items-list">
                {manualOrderItems.map(item => (
                  <div 
                    key={item.id} 
                    className="manual-item"
                    style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px'
                    }}
                  >
                    <div 
                      className="manual-item-fields"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 2fr auto',
                        gap: '16px',
                        alignItems: 'end'
                      }}
                    >
                      <div 
                        className="field-group"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <label style={{
                          fontWeight: '500',
                          color: '#1e293b',
                          fontSize: '14px'
                        }}>Ingrediente</label>
                        <select
                          value={item.ingredientId}
                          onChange={(e) => updateManualOrderItem(item.id, 'ingredientId', e.target.value)}
                          className="ingredient-select"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            background: 'white',
                            width: '100%'
                          }}
                        >
                          <option value="">Seleccionar ingrediente...</option>
                          {availableIngredients.map(ingredient => {
                            const supplier = ingredient.preferredSupplier;
                            const supplierInfo = supplier 
                              ? ` | Proveedor: ${formatCurrency(supplier.price)}/${supplier.package_unit} (paquete ${formatDecimal(supplier.package_size)} ${ingredient.unit})`
                              : ' | Sin proveedor asignado';
                            
                            return (
                              <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
                                {ingredient.name} - Base: {formatCurrency(ingredient.base_price)}/{ingredient.unit}
                                {ingredient.stock > 0 ? ` | Stock: ${formatDecimal(ingredient.stock)} ${ingredient.unit}` : ' | Sin stock'}
                                {supplierInfo}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div 
                        className="field-group"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <label style={{
                          fontWeight: '500',
                          color: '#1e293b',
                          fontSize: '14px'
                        }}>
                          Cantidad deseada
                          {item.ingredientId && (() => {
                            const ingredient = availableIngredients.find(ing => ing.ingredient_id === parseInt(item.ingredientId));
                            return ingredient ? ` (${ingredient.unit})` : '';
                          })()}
                        </label>
                        <input
                          type="number"
                          step="0,01"
                          value={item.quantity}
                          onChange={(e) => updateManualOrderItem(item.id, 'quantity', e.target.value)}
                          className="quantity-input"
                          lang="es"
                          placeholder={item.ingredientId ? (() => {
                            const ingredient = availableIngredients.find(ing => ing.ingredient_id === parseInt(item.ingredientId));
                            return ingredient ? `Ej: 500 ${ingredient.unit}` : '';
                          })() : 'Selecciona ingrediente'}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            background: 'white',
                            maxWidth: '120px'
                          }}
                        />
                        {item.ingredientId && (() => {
                          const ingredient = availableIngredients.find(ing => ing.ingredient_id === parseInt(item.ingredientId));
                          if (!ingredient?.preferredSupplier) return null;
                          
                          const supplier = ingredient.preferredSupplier;
                          const packageSize = supplier.package_size;
                          const packageUnit = supplier.package_unit;
                          
                          return (
                            <small 
                              className="quantity-note"
                              style={{
                                color: '#64748b',
                                fontSize: '12px',
                                lineHeight: '1.3',
                                marginTop: '4px',
                                display: 'block',
                                background: '#f8fafc',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                borderLeft: '3px solid #3b82f6'
                              }}
                            >
                              💡 El proveedor vende en paquetes de {formatDecimal(packageSize)} {ingredient.unit} 
                              por {formatCurrency(supplier.price)} ({packageUnit})
                            </small>
                          );
                        })()}
                      </div>
                      <div 
                        className="field-group"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <label style={{
                          fontWeight: '500',
                          color: '#1e293b',
                          fontSize: '14px'
                        }}>Notas (opcional)</label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => updateManualOrderItem(item.id, 'notes', e.target.value)}
                          className="notes-input"
                          placeholder="Ej: Urgente, marca específica..."
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            background: 'white',
                            width: '100%'
                          }}
                        />
                      </div>
                      <div 
                        className="field-group"
                        style={{
                          display: 'flex',
                          alignItems: 'end'
                        }}
                      >
                        <button 
                          className="btn delete"
                          onClick={() => removeManualOrderItem(item.id)}
                          title="Eliminar item"
                          style={{
                            width: '36px',
                            height: '36px',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            borderRadius: '6px',
                            border: '1px solid #dc2626',
                            background: '#dc2626',
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ingredientsLoading && (
              <div className="loading">Cargando ingredientes disponibles...</div>
            )}
          </div>
        )}
      </div>
      
      {/* Filtros y Configuración */}
      {!showManualOrder && (
        <div className="shopping-filters">
        <div className={`filters-grid ${showEventSelection ? 'filters-grid-compact' : ''}`}>
          <div className="filter-group">
            <label className="toggle-label">
              <span className="toggle-text">
                <input
                  type="checkbox"
                  checked={filters.includeStock}
                  onChange={(e) => setFilters(prev => ({ ...prev, includeStock: e.target.checked }))}
                />
                Descontar stock actual
              </span>
              <small>Solo mostrar lo que necesitas comprar</small>
            </label>
          </div>

          {!showEventSelection && (
            <>
              <div className="filter-group">
                <label className="toggle-label">
                  <span className="toggle-text">
                    <input
                      type="checkbox"
                      checked={filters.includeConfirmed}
                      onChange={(e) => setFilters(prev => ({ ...prev, includeConfirmed: e.target.checked }))}
                    />
                    Eventos confirmados
                  </span>
                  <small>Incluir eventos con estado "confirmado"</small>
                </label>
              </div>

              <div className="filter-group">
                <label className="toggle-label">
                  <span className="toggle-text">
                    <input
                      type="checkbox"
                      checked={filters.includePlanned}
                      onChange={(e) => setFilters(prev => ({ ...prev, includePlanned: e.target.checked }))}
                    />
                    Eventos planificados
                  </span>
                  <small>Incluir eventos con estado "planificado"</small>
                </label>
              </div>
            </>
          )}

          <div className="filter-group">
            <label className="select-label">
              <span>
                Período de tiempo
                <select
                  value={filters.days}
                  onChange={(e) => setFilters(prev => ({ ...prev, days: parseInt(e.target.value) }))}
                  className="days-select"
                >
                  <option value={7}>Próximos 7 días</option>
                  <option value={15}>Próximos 15 días</option>
                  <option value={30}>Próximos 30 días</option>
                  <option value={60}>Próximos 60 días</option>
                </select>
              </span>
              <small>
                {showEventSelection 
                  ? 'Filtrar eventos mostrados en la selección' 
                  : 'Rango de fechas para buscar eventos'
                }
              </small>
            </label>
          </div>
        </div>
        </div>
      )}

      {/* Resultados */}
      {shoppingListLoading ? (
        <div className="loading">Generando lista de compras...</div>
      ) : showEventSelection && selectedEventIds.length === 0 ? (
        <div className="empty-state">
          <p>Selecciona uno o más eventos para generar la lista de compras</p>
        </div>
      ) : showManualOrder && manualOrderItems.length === 0 ? (
        null // No mostrar nada en modo manual sin items
      ) : showManualOrder && (!shoppingList || !shoppingList.filters?.manual) ? (
        null // No mostrar listas no-manuales cuando estamos en modo manual
      ) : shoppingList ? (
        <div className="shopping-results">
          {/* Resumen */}
          <div className="shopping-summary">
            <div className="summary-stats">
              {!shoppingList.filters?.manual && (
                <div className="stat">
                  <span className="stat-label">Eventos</span>
                  <span className="stat-value">{shoppingList.totalEvents}</span>
                </div>
              )}
              <div className="stat">
                <span className="stat-label">{shoppingList.filters?.manual ? 'Items' : 'Costo Total'}</span>
                <span className="stat-value">
                  {shoppingList.filters?.manual 
                    ? shoppingList.ingredientsBySupplier.reduce((total, supplier) => total + supplier.ingredients.length, 0)
                    : formatCurrency(shoppingList.totalCost)
                  }
                </span>
              </div>
              {shoppingList.filters?.manual && (
                <div className="stat">
                  <span className="stat-label">Costo Total</span>
                  <span className="stat-value">{formatCurrency(shoppingList.totalCost)}</span>
                </div>
              )}
              {!shoppingList.filters?.manual && (
                <div className="stat">
                  <span className="stat-label">Proveedores</span>
                  <span className="stat-value">{shoppingList.ingredientsBySupplier.length}</span>
                </div>
              )}
            </div>
            {shoppingList.dateRange.from && (
              <div className="date-range">
                <small>
                  Período: {new Date(shoppingList.dateRange.from).toLocaleDateString()} - {new Date(shoppingList.dateRange.to).toLocaleDateString()}
                </small>
              </div>
            )}
          </div>

          {/* Lista por Proveedores */}
          {shoppingList.ingredientsBySupplier.length > 0 ? (
            <div className="suppliers-list">
              {shoppingList.ingredientsBySupplier.map(supplier => (
                <div key={supplier.supplierId} className="supplier-group">
                  <div className="supplier-header">
                    <h3>{supplier.supplierName}</h3>
                    <span className="supplier-total">{formatCurrency(supplier.supplierTotal)}</span>
                  </div>
                  <div className="ingredients-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Ingrediente</th>
                          <th>Necesario</th>
                          <th>En Stock</th>
                          <th>A Comprar</th>
                          <th>Unidad Venta</th>
                          <th>Cantidad Real</th>
                          <th>Precio Real</th>
                          <th>Total Real</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplier.ingredients.map(ingredient => (
                          <tr key={ingredient.ingredientId}>
                            <td>{ingredient.name}</td>
                            <td>{formatDecimal(ingredient.needed)} {ingredient.unit}</td>
                            <td>{formatDecimal(ingredient.inStock)} {ingredient.unit}</td>
                            <td className="to-buy">{formatDecimal(ingredient.toBuy)} {ingredient.unit}</td>
                            <td className="package-info">
                              {ingredient.packageSize ? (
                                `${formatDecimal(ingredient.packageSize)} ${ingredient.unit}/${ingredient.packageUnit}`
                              ) : (
                                `1 ${ingredient.unit}`
                              )}
                            </td>
                            <td className="real-quantity">
                              {ingredient.packagesToBuy > 0 ? (
                                `${formatDecimal(ingredient.packagesToBuy)} ${ingredient.packageUnit || 'unidad'}`
                              ) : (
                                `${formatDecimal(ingredient.toBuy)} ${ingredient.unit}`
                              )}
                            </td>
                            <td className="real-price">
                              {ingredient.supplierPrice ? (
                                `${formatCurrency(ingredient.supplierPrice)}/${ingredient.packageUnit || 'unidad'}`
                              ) : (
                                formatCurrency(ingredient.pricePerUnit)
                              )}
                            </td>
                            <td className="total-cost">
                              {ingredient.realTotalCost > 0 ? (
                                formatCurrency(ingredient.realTotalCost)
                              ) : (
                                formatCurrency(ingredient.totalCost)
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>{shoppingList.message || 'No hay ingredientes que comprar con los filtros seleccionados'}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  const renderActiveOrders = () => (
    <div className="active-orders-section">
      <h2 className="section-title">
        <FaTruck />
        Pedidos Activos
      </h2>
      <div className="placeholder-content">
        <p>Funcionalidad en desarrollo...</p>
        <p>Aquí se mostrarán los pedidos en diferentes estados: Borrador, Enviado, En camino, etc.</p>
      </div>
    </div>
  );

  const renderSuppliers = () => (
    <div className="suppliers-section">
      <h2 className="section-title">
        <FaTruck />
        Análisis de Proveedores
      </h2>
      <div className="placeholder-content">
        <p>Funcionalidad en desarrollo...</p>
        <p>Aquí se mostrará la comparativa de proveedores, precios y análisis de rendimiento.</p>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="history-section">
      <h2 className="section-title">
        <FaHistory />
        Historial de Pedidos
      </h2>
      <div className="placeholder-content">
        <p>Funcionalidad en desarrollo...</p>
        <p>Aquí se mostrará el historial completo de pedidos anteriores.</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="common-page-container">
        <div className="common-page-content">
          <div className="loading">Cargando datos de pedidos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="common-page-container">
      <div className="common-page-content">
        <div className="supplier-orders-header">
          <h1 className="common-page-title">Pedidos a Proveedores</h1>
          <p className="page-description">
            Gestiona las compras de ingredientes de forma inteligente y optimizada
          </p>
        </div>

        <div className="supplier-orders-tabs">
          <button 
            className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <FaChartBar /> Dashboard
          </button>
          <button 
            className={`tab-btn ${activeTab === 'shopping-list' ? 'active' : ''}`}
            onClick={() => setActiveTab('shopping-list')}
          >
            <FaListUl /> Lista de Compras
          </button>
          <button 
            className={`tab-btn ${activeTab === 'active-orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('active-orders')}
          >
            <FaTruck /> Pedidos Activos
          </button>
          <button 
            className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
            onClick={() => setActiveTab('suppliers')}
          >
            <FaBoxOpen /> Proveedores
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FaHistory /> Historial
          </button>
        </div>

        <div className="supplier-orders-content">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'shopping-list' && renderShoppingList()}
          {activeTab === 'active-orders' && renderActiveOrders()}
          {activeTab === 'suppliers' && renderSuppliers()}
          {activeTab === 'history' && renderHistory()}
        </div>
      </div>
    </div>
  );
};

export default SupplierOrders;