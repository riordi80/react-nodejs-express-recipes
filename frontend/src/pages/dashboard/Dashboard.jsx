import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useWidget } from '../../context/WidgetContext';
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
  FaReceipt,
  FaBoxOpen
} from 'react-icons/fa';

const Dashboard = () => {
  const { widgetConfig, getOrderedWidgets } = useWidget();
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    lowStockIngredients: [],
    recipesByCategory: [],
    latestRecipes: [],
    upcomingEvents: [],
    eventsWithMenus: [],
    supplierOrderReminders: [],
    seasonalIngredients: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    fetchDashboardData();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
      const [
        summaryResponse,
        lowStockResponse,
        recipesCategoryResponse,
        latestRecipesResponse,
        upcomingEventsResponse,
        eventsMenusResponse,
        supplierRemindersResponse,
        seasonalResponse
      ] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/low-stock-ingredients'),
        api.get('/dashboard/recipes-by-category'),
        api.get('/dashboard/latest-recipes'),
        api.get('/dashboard/upcoming-events'),
        api.get('/dashboard/events-with-menus'),
        api.get('/dashboard/supplier-order-reminders'),
        api.get('/dashboard/seasonal-ingredients')
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
          seasonalIngredients: seasonalResponse.data
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
          setError('Error al cargar los datos del dashboard');
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
              <FaExclamationTriangle className="widget-icon alert" />
              <h3>Alertas de Stock</h3>
            </div>
            <div className="widget-content">
              {dashboardData.lowStockIngredients.length > 0 ? (
                <div className="stock-alerts">
                  {dashboardData.lowStockIngredients.map(ingredient => (
                    <div key={ingredient.ingredient_id} className="stock-alert-item">
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
                    <div key={event.event_id} className="event-item">
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
                    <div key={recipe.recipe_id} className="recipe-item">
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
                      <div key={ingredient.ingredient_id} className="seasonal-item">
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
                    <div key={event.event_id} className="event-menu-item">
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
              <div className="supplier-orders">
                <div className="order-item">
                  <div className="order-info">
                    <strong>Proveedor Central</strong>
                    <span className="order-details">5 ingredientes - Vence: 2 días</span>
                  </div>
                  <div className="order-status pending">Pendiente</div>
                </div>
                <div className="order-item">
                  <div className="order-info">
                    <strong>Verduras Frescas S.A.</strong>
                    <span className="order-details">3 ingredientes - Vence: 1 día</span>
                  </div>
                  <div className="order-status urgent">Urgente</div>
                </div>
                <div className="order-item">
                  <div className="order-info">
                    <strong>Lácteos del Valle</strong>
                    <span className="order-details">2 ingredientes - Vence: 4 días</span>
                  </div>
                  <div className="order-status pending">Pendiente</div>
                </div>
              </div>
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
              <div className="cost-trends">
                <div className="trend-item">
                  <div className="trend-info">
                    <strong>Tomates</strong>
                    <span className="trend-period">Últimos 30 días</span>
                  </div>
                  <div className="trend-change increase">+15%</div>
                </div>
                <div className="trend-item">
                  <div className="trend-info">
                    <strong>Carne de Res</strong>
                    <span className="trend-period">Últimos 30 días</span>
                  </div>
                  <div className="trend-change decrease">-8%</div>
                </div>
                <div className="trend-item">
                  <div className="trend-info">
                    <strong>Aceite de Oliva</strong>
                    <span className="trend-period">Últimos 30 días</span>
                  </div>
                  <div className="trend-change increase">+22%</div>
                </div>
                <div className="trend-item">
                  <div className="trend-info">
                    <strong>Queso Mozzarella</strong>
                    <span className="trend-period">Últimos 30 días</span>
                  </div>
                  <div className="trend-change stable">0%</div>
                </div>
              </div>
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
              <div className="seasonal-alerts">
                <div className="alert-item">
                  <div className="alert-info">
                    <strong>Fresas</strong>
                    <span className="alert-details">Temporada termina en 2 semanas</span>
                  </div>
                  <div className="alert-badge warning">Próximo a terminar</div>
                </div>
                <div className="alert-item">
                  <div className="alert-info">
                    <strong>Calabazas</strong>
                    <span className="alert-details">Temporada inicia en 1 mes</span>
                  </div>
                  <div className="alert-badge info">Próximo a iniciar</div>
                </div>
                <div className="alert-item">
                  <div className="alert-info">
                    <strong>Manzanas</strong>
                    <span className="alert-details">En temporada alta</span>
                  </div>
                  <div className="alert-badge success">Temporada alta</div>
                </div>
              </div>
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
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p>Resumen general del sistema de recetas</p>
        </div>

        {/* Tarjetas de resumen */}
        <div className="dashboard-summary">
          <div className="summary-card">
            <div className="summary-icon recipes">
              <FaUtensils />
            </div>
            <div className="summary-content">
              <h3>{dashboardData.summary.totalRecipes}</h3>
              <p>Recetas</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon ingredients">
              <FaBoxOpen />
            </div>
            <div className="summary-content">
              <h3>{dashboardData.summary.totalIngredients}</h3>
              <p>Ingredientes</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon suppliers">
              <FaTruck />
            </div>
            <div className="summary-content">
              <h3>{dashboardData.summary.totalSuppliers}</h3>
              <p>Proveedores</p>
            </div>
          </div>

          <div className="summary-card alert">
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
    </div>
  );
};

export default Dashboard;
