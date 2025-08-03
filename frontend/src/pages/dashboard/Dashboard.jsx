import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/page-header/PageHeader';
import api from '../../api/axios';
import { useWidget } from '../../context/WidgetContext';
import EditIngredientModal from '../../components/modals/EditIngredientModal';
import OrderDetailModal from '../../components/modals/OrderDetailModal';
import './Dashboard.css';

// Importar iconos para los widgets
import { 
  FaExclamationTriangle, 
  FaChartPie, 
  FaClock, 
  FaCalendarAlt,
  FaUtensils,
  FaTruck,
  FaLeaf,
  FaUsers,
  FaReceipt
} from 'react-icons/fa';

const Dashboard = () => {
  const navigate = useNavigate();
  const { widgetConfig, getOrderedWidgets } = useWidget();
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    lowStockIngredients: [],
    recipesByCategory: [],
    latestRecipes: [],
    upcomingEvents: [],
    eventsWithMenus: [],
    supplierOrderReminders: [],
    seasonalIngredients: {},
    costTrends: [],
    seasonalAlerts: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Estado para el modal de editar ingrediente
  const [editIngredientModal, setEditIngredientModal] = useState({
    isOpen: false,
    ingredient: null
  });

  // Estado para el modal de detalle de pedido
  const [orderDetailModal, setOrderDetailModal] = useState({
    isOpen: false,
    order: null
  });

  useEffect(() => {
    mountedRef.current = true;
    fetchDashboardData();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Efecto para recargar datos cuando cambie itemsPerWidget
  useEffect(() => {
    if (mountedRef.current) {
      fetchDashboardData();
    }
  }, [widgetConfig.itemsPerWidget]);

  // Efecto para manejar la actualización automática
  useEffect(() => {
    if (widgetConfig.autoRefresh && widgetConfig.refreshInterval) {
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          fetchDashboardData(true); // true indica que es una actualización automática
        }
      }, widgetConfig.refreshInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [widgetConfig.autoRefresh, widgetConfig.refreshInterval]);

  const fetchDashboardData = async (isAutoUpdate = false) => {
    try {
      // Solo mostrar loading en la primera carga, no en actualizaciones automáticas
      if (!isAutoUpdate) {
        setLoading(true);
      }
      
      // Hacer todas las peticiones en paralelo
      const itemsLimit = widgetConfig.itemsPerWidget || 5;
      const [
        summaryResponse,
        lowStockResponse,
        recipesCategoryResponse,
        latestRecipesResponse,
        upcomingEventsResponse,
        eventsMenusResponse,
        supplierRemindersResponse,
        seasonalResponse,
        costTrendsResponse,
        seasonalAlertsResponse
      ] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/low-stock-ingredients', { params: { limit: itemsLimit } }),
        api.get('/dashboard/recipes-by-category'),
        api.get('/dashboard/latest-recipes', { params: { limit: itemsLimit } }),
        api.get('/dashboard/upcoming-events', { params: { limit: itemsLimit } }),
        api.get('/dashboard/events-with-menus', { params: { limit: itemsLimit } }),
        api.get('/dashboard/supplier-order-reminders', { params: { limit: itemsLimit } }),
        api.get('/dashboard/seasonal-ingredients'),
        api.get('/dashboard/cost-trends', { params: { limit: itemsLimit } }),
        api.get('/dashboard/seasonal-alerts', { params: { limit: itemsLimit } })
      ]);

      // Solo actualizar si el componente sigue montado
      if (mountedRef.current) {
        setDashboardData({
          summary: summaryResponse.data,
          lowStockIngredients: lowStockResponse.data,
          recipesByCategory: recipesCategoryResponse.data,
          latestRecipes: latestRecipesResponse.data,
          upcomingEvents: upcomingEventsResponse.data,
          eventsWithMenus: eventsMenusResponse.data,
          supplierOrderReminders: supplierRemindersResponse.data,
          seasonalIngredients: seasonalResponse.data,
          costTrends: costTrendsResponse.data,
          seasonalAlerts: seasonalAlertsResponse.data
        });
        
        // Limpiar errores si la actualización es exitosa
        if (error) {
          setError(null);
        }
      }
      
    } catch (err) {
      if (mountedRef.current) {
        // Solo mostrar error si no es una actualización automática
        if (!isAutoUpdate) {
          const errorMessage = err.response?.data?.error || err.message || 'Error desconocido';
          setError(`Error al cargar los datos del dashboard: ${errorMessage}`);
        }
        console.error('Error fetching dashboard data:', err);
      }
    } finally {
      if (mountedRef.current && !isAutoUpdate) {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString ? timeString.substring(0, 5) : '';
  };

  // Funciones para navegación y modales
  const handleIngredientClick = async (ingredientId) => {
    try {
      const response = await api.get(`/ingredients/${ingredientId}`);
      setEditIngredientModal({
        isOpen: true,
        ingredient: response.data
      });
    } catch (error) {
      console.error('Error al cargar ingrediente:', error);
    }
  };

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const handleRecipeClick = (recipeId) => {
    navigate(`/recipes/${recipeId}`);
  };

  const handleIngredientSave = async (ingredientData) => {
    try {
      await api.put(`/ingredients/${ingredientData.ingredient_id}`, ingredientData);
      
      // Recargar datos del dashboard para reflejar cambios
      fetchDashboardData(true);
      
      // Cerrar modal
      setEditIngredientModal({ isOpen: false, ingredient: null });
      return true;
    } catch (error) {
      console.error('Error al guardar ingrediente:', error);
      return false;
    }
  };

  const handleIngredientModalClose = () => {
    setEditIngredientModal({ isOpen: false, ingredient: null });
  };

  const handleSupplierOrderClick = async (order) => {
    try {
      // Cargar datos completos del pedido
      const response = await api.get(`/supplier-orders/${order.order_id}`);
      setOrderDetailModal({
        isOpen: true,
        order: response.data
      });
    } catch (error) {
      console.error('Error al cargar detalle del pedido:', error);
      // Fallback: usar los datos básicos si falla la carga completa
      setOrderDetailModal({
        isOpen: true,
        order: order
      });
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.put(`/supplier-orders/${orderId}`, { status: newStatus });
      
      // Recargar datos del dashboard para reflejar cambios
      fetchDashboardData(true);
      
      // Actualizar el pedido en el modal
      setOrderDetailModal(prev => ({
        ...prev,
        order: { ...prev.order, status: newStatus }
      }));
      
      return true;
    } catch (error) {
      console.error('Error al actualizar estado del pedido:', error);
      return false;
    }
  };

  const handleOrderDelete = async (orderId) => {
    try {
      await api.delete(`/supplier-orders/${orderId}`);
      
      // Recargar datos del dashboard
      fetchDashboardData(true);
      
      // Cerrar modal
      setOrderDetailModal({ isOpen: false, order: null });
      
      return true;
    } catch (error) {
      console.error('Error al eliminar pedido:', error);
      return false;
    }
  };

  const handleOrderModalClose = () => {
    setOrderDetailModal({ isOpen: false, order: null });
  };

  // Funciones de navegación para las métricas del resumen
  const handleMetricClick = (metricType) => {
    switch (metricType) {
      case 'recipes':
        navigate('/recipes');
        break;
      case 'events':
        navigate('/events');
        break;
      case 'orders':
        navigate('/supplier-orders');
        break;
      case 'stock':
        navigate('/ingredients');
        break;
      default:
        break;
    }
  };

  // Función para renderizar widgets según la configuración
  const renderWidget = (widgetId, widgetContent) => {
    if (!widgetConfig[widgetId]) {
      return null;
    }
    return widgetContent;
  };

  // Función para renderizar un widget específico por ID
  const renderWidgetById = (widgetId) => {
    switch (widgetId) {
      case 'stockAlerts':
        return (
          <div className="widget">
            <div className="widget-header">
              <FaExclamationTriangle className="widget-icon" style={{ color: '#ef4444' }} />
              <h3>Alertas de Stock</h3>
            </div>
            <div className="widget-content">
              {dashboardData.lowStockIngredients.length > 0 ? (
                <div className="stock-alerts">
                  {dashboardData.lowStockIngredients.map(ingredient => (
                    <div 
                      key={ingredient.ingredient_id} 
                      className="stock-alert-item clickable" 
                      onClick={() => handleIngredientClick(ingredient.ingredient_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="alert-info">
                        <strong>{ingredient.name}</strong>
                        <span className="alert-details">
                          {ingredient.stock} {ingredient.unit} / {ingredient.stock_minimum} {ingredient.unit}
                        </span>
                      </div>
                      <div className="alert-badge">
                        {ingredient.stock_difference} {ingredient.unit}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No hay ingredientes con stock bajo</p>
              )}
            </div>
          </div>
        );

      case 'upcomingEvents':
        return (
          <div className="widget">
            <div className="widget-header">
              <FaCalendarAlt className="widget-icon" />
              <h3>Próximos Eventos</h3>
            </div>
            <div className="widget-content">
              {dashboardData.upcomingEvents.length > 0 ? (
                <div className="upcoming-events">
                  {dashboardData.upcomingEvents.map(event => (
                    <div 
                      key={event.event_id} 
                      className="event-item clickable" 
                      onClick={() => handleEventClick(event.event_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="event-info">
                        <strong>{event.name}</strong>
                        <div className="event-details">
                          <span className="event-date">{formatDate(event.event_date)}</span>
                          <span className="event-time">{formatTime(event.event_time)}</span>
                          <span className="event-guests">
                            <FaUsers /> {event.guests_count}
                          </span>
                        </div>
                      </div>
                      <div className={`event-status ${event.status}`}>
                        {event.status === 'confirmed' ? 'Confirmado' : 'Planeado'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No hay eventos próximos</p>
              )}
            </div>
          </div>
        );

      case 'recipesByCategory':
        return (
          <div className="widget">
            <div className="widget-header">
              <FaChartPie className="widget-icon" />
              <h3>Recetas por Categoría</h3>
            </div>
            <div className="widget-content">
              {dashboardData.recipesByCategory.length > 0 ? (
                <div className="category-chart">
                  {dashboardData.recipesByCategory.map(category => (
                    <div key={category.category_name} className="category-item">
                      <div className="category-bar">
                        <div 
                          className="category-fill" 
                          style={{ 
                            width: `${(category.recipe_count / Math.max(...dashboardData.recipesByCategory.map(c => c.recipe_count))) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <div className="category-info">
                        <span className="category-name">{category.category_name}</span>
                        <span className="category-count">{category.recipe_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No hay categorías disponibles</p>
              )}
            </div>
          </div>
        );

      case 'latestRecipes':
        return (
          <div className="widget">
            <div className="widget-header">
              <FaClock className="widget-icon" />
              <h3>Últimas Recetas</h3>
            </div>
            <div className="widget-content">
              {dashboardData.latestRecipes.length > 0 ? (
                <div className="latest-recipes">
                  {dashboardData.latestRecipes.map(recipe => (
                    <div 
                      key={recipe.recipe_id} 
                      className="recipe-item clickable" 
                      onClick={() => handleRecipeClick(recipe.recipe_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="recipe-info">
                        <strong>{recipe.name}</strong>
                        <div className="recipe-details">
                          <span className="recipe-difficulty">{recipe.difficulty}</span>
                          <span className="recipe-time">{recipe.prep_time} min</span>
                          <span className="recipe-servings">{recipe.servings} porciones</span>
                        </div>
                      </div>
                      <div className="recipe-date">
                        {formatDate(recipe.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No hay recetas recientes</p>
              )}
            </div>
          </div>
        );

      case 'seasonalIngredients':
        return (
          <div className="widget">
            <div className="widget-header">
              <FaLeaf className="widget-icon seasonal" />
              <h3>Temporada Actual</h3>
            </div>
            <div className="widget-content">
              <div className="seasonal-info">
                <h4>Mes: {dashboardData.seasonalIngredients.current_month}</h4>
                {dashboardData.seasonalIngredients.seasonal_ingredients?.length > 0 ? (
                  <div className="seasonal-ingredients">
                    {dashboardData.seasonalIngredients.seasonal_ingredients.map(ingredient => (
                      <div 
                        key={ingredient.ingredient_id} 
                        className="seasonal-item clickable" 
                        onClick={() => handleIngredientClick(ingredient.ingredient_id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <strong>{ingredient.name}</strong>
                        <span className="seasonal-stock">{ingredient.stock} {ingredient.unit}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No hay ingredientes específicos de temporada</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'eventsWithMenus':
        return (
          <div className="widget wide">
            <div className="widget-header">
              <FaReceipt className="widget-icon" />
              <h3>Eventos con Menús Asignados</h3>
            </div>
            <div className="widget-content">
              {dashboardData.eventsWithMenus.length > 0 ? (
                <div className="events-with-menus">
                  {dashboardData.eventsWithMenus.map(event => (
                    <div 
                      key={event.event_id} 
                      className="event-menu-item clickable" 
                      onClick={() => handleEventClick(event.event_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="event-menu-header">
                        <strong>{event.event_name}</strong>
                        <span className="event-menu-date">
                          {formatDate(event.event_date)} - {formatTime(event.event_time)}
                        </span>
                      </div>
                      <div className="event-menu-details">
                        <span className="event-menu-guests">
                          <FaUsers /> {event.guests_count} personas
                        </span>
                        <div className="menu-items">
                          {event.menu_items.map((item, index) => (
                            <span key={index} className="menu-item">
                              {item.recipe_name} ({item.portions} porciones)
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No hay eventos con menús asignados</p>
              )}
            </div>
          </div>
        );

      case 'supplierOrders':
        return (
          <div className="widget">
            <div className="widget-header">
              <FaTruck className="widget-icon" />
              <h3>Órdenes de Compra Pendientes</h3>
            </div>
            <div className="widget-content">
              {dashboardData.supplierOrderReminders.length > 0 ? (
                <div className="supplier-orders">
                  {dashboardData.supplierOrderReminders.map(order => {
                    // Calcular días hasta entrega
                    const today = new Date();
                    const deliveryDate = order.delivery_date ? new Date(order.delivery_date) : null;
                    const daysUntilDelivery = deliveryDate ? 
                      Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24)) : null;
                    
                    // Determinar urgencia
                    const getUrgencyClass = () => {
                      if (!deliveryDate) return 'pending';
                      if (daysUntilDelivery <= 1) return 'urgent';
                      if (daysUntilDelivery <= 3) return 'warning';
                      return 'pending';
                    };

                    const getUrgencyText = () => {
                      if (!deliveryDate) return order.status === 'pending' ? 'Pendiente' : 'Pedido';
                      if (daysUntilDelivery <= 0) return 'Vencido';
                      if (daysUntilDelivery === 1) return 'Urgente';
                      return order.status === 'pending' ? 'Pendiente' : 'Pedido';
                    };

                    return (
                      <div 
                        key={order.order_id} 
                        className="order-item clickable" 
                        onClick={() => handleSupplierOrderClick(order)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="order-info">
                          <strong>{order.supplier_name}</strong>
                          <span className="order-details">
                            {order.items_count} ingredientes
                            {deliveryDate && ` - ${daysUntilDelivery > 0 ? `Vence: ${daysUntilDelivery} días` : 'Vencido'}`}
                          </span>
                        </div>
                        <div className={`order-status ${getUrgencyClass()}`}>
                          {getUrgencyText()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-data">No hay pedidos pendientes</p>
              )}
            </div>
          </div>
        );

      case 'costTrends':
        return (
          <div className="widget">
            <div className="widget-header">
              <FaChartPie className="widget-icon" />
              <h3>Tendencias de Costos</h3>
            </div>
            <div className="widget-content">
              {dashboardData.costTrends.length > 0 ? (
                <div className="cost-trends">
                  {dashboardData.costTrends.map(trend => (
                    <div 
                      key={trend.ingredient_id} 
                      className="trend-item clickable" 
                      onClick={() => handleIngredientClick(trend.ingredient_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="trend-info">
                        <strong>{trend.name}</strong>
                        <span className="trend-period">
                          {trend.days_ago > 0 ? `Hace ${trend.days_ago} días` : 'Hoy'}
                        </span>
                      </div>
                      <div className={`trend-change ${trend.trend_direction}`}>
                        {trend.price_change_percent > 0 ? '+' : ''}{trend.price_change_percent}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No hay cambios de precios recientes</p>
              )}
            </div>
          </div>
        );

      case 'seasonalAlerts':
        return (
          <div className="widget">
            <div className="widget-header">
              <FaLeaf className="widget-icon seasonal" />
              <h3>Alertas de Temporada</h3>
            </div>
            <div className="widget-content">
              {dashboardData.seasonalAlerts.alerts?.length > 0 ? (
                <div className="seasonal-alerts">
                  <div className="seasonal-month">
                    <strong>Mes actual: {dashboardData.seasonalAlerts.current_month}</strong>
                  </div>
                  {dashboardData.seasonalAlerts.alerts.map(alert => (
                    <div 
                      key={alert.ingredient_id} 
                      className="alert-item clickable" 
                      onClick={() => handleIngredientClick(alert.ingredient_id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="alert-info">
                        <strong>{alert.name}</strong>
                        <span className="alert-details">
                          {alert.message}
                          {alert.stock > 0 && ` - Stock: ${alert.stock} ${alert.unit}`}
                        </span>
                      </div>
                      <div className={`alert-badge ${alert.urgency}`}>
                        {alert.alert_type === 'in_season' ? 'Temporada alta' :
                         alert.alert_type === 'ending_season' ? 'Terminando' :
                         alert.alert_type === 'starting_season' ? 'Próximo' : alert.message}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="seasonal-alerts">
                  <div className="seasonal-month">
                    <strong>Mes actual: {dashboardData.seasonalAlerts.current_month || new Date().toLocaleDateString('es-ES', { month: 'long' })}</strong>
                  </div>
                  <p className="no-data">No hay alertas estacionales</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-loading">
            <div className="loading-spinner"></div>
            <p>Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-error">
            <FaExclamationTriangle />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <PageHeader
          title="Dashboard"
          subtitle="Resumen general del sistema de recetas"
        />

        {/* Tarjetas de resumen */}
        <div className="dashboard-summary">
          <div 
            className="summary-card clickable" 
            onClick={() => handleMetricClick('recipes')}
            style={{ cursor: 'pointer' }}
          >
            <div className="summary-icon recipes">
              <FaUtensils />
            </div>
            <div className="summary-content">
              <h3>{dashboardData.summary.totalRecipes}</h3>
              <p>Recetas</p>
            </div>
          </div>

          <div 
            className="summary-card clickable" 
            onClick={() => handleMetricClick('events')}
            style={{ cursor: 'pointer' }}
          >
            <div className="summary-icon events">
              <FaCalendarAlt />
            </div>
            <div className="summary-content">
              <h3>{dashboardData.summary.totalEvents}</h3>
              <p>Eventos</p>
            </div>
          </div>

          <div 
            className="summary-card clickable" 
            onClick={() => handleMetricClick('orders')}
            style={{ cursor: 'pointer' }}
          >
            <div className="summary-icon orders">
              <FaTruck />
            </div>
            <div className="summary-content">
              <h3>{dashboardData.summary.pendingOrders || 0}</h3>
              <p>Pedidos Activos</p>
            </div>
          </div>

          <div 
            className="summary-card clickable" 
            onClick={() => handleMetricClick('stock')}
            style={{ cursor: 'pointer' }}
          >
            <div className="summary-icon low-stock">
              <FaExclamationTriangle />
            </div>
            <div className="summary-content">
              <h3>{dashboardData.summary.lowStockCount}</h3>
              <p>Stock Bajo</p>
            </div>
          </div>
        </div>

        {/* Grid de widgets ordenables */}
        <div className="dashboard-widgets">
          {getOrderedWidgets().map(widgetId => (
            <div key={widgetId}>
              {renderWidgetById(widgetId)}
            </div>
          ))}
        </div>
      </div>

      {/* Modal de editar ingrediente */}
      <EditIngredientModal
        isOpen={editIngredientModal.isOpen}
        onClose={handleIngredientModalClose}
        ingredient={editIngredientModal.ingredient}
        onSave={handleIngredientSave}
        onIngredientUpdated={() => {}}
      />

      {/* Modal de detalle de pedido */}
      <OrderDetailModal
        isOpen={orderDetailModal.isOpen}
        onClose={handleOrderModalClose}
        order={orderDetailModal.order}
        onStatusUpdate={handleOrderStatusUpdate}
        onDelete={handleOrderDelete}
      />
    </div>
  );
};

export default Dashboard;
