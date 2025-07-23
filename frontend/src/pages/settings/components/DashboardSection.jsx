import React, { useState } from 'react';
import { useWidget } from '../../../context/WidgetContext';
import { FaArrowsAlt, FaArrowUp, FaArrowDown, FaClipboardList, FaCalendarAlt, FaUtensils, FaTruck } from 'react-icons/fa';
import Modal from '../../../components/modal/Modal';

const DashboardSection = () => {
  const { widgetConfig, widgetOrder, updateWidgetConfig, updateDisplayConfig, resetWidgetConfig, updateWidgetOrder, loading } = useWidget();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [tempOrder, setTempOrder] = useState([]);

  const widgets = [
    // Gestión de Inventario
    {
      id: 'stockAlerts',
      title: 'Alertas de Stock',
      description: 'Ingredientes con stock bajo',
      category: 'inventory'
    },
    {
      id: 'seasonalIngredients',
      title: 'Ingredientes de Temporada',
      description: 'Ingredientes actuales de temporada',
      category: 'inventory'
    },
    {
      id: 'seasonalAlerts',
      title: 'Alertas de Temporada',
      description: 'Ingredientes próximos a cambiar temporada',
      category: 'inventory'
    },
    // Eventos y Planificación
    {
      id: 'upcomingEvents',
      title: 'Próximos Eventos',
      description: 'Eventos programados próximamente',
      category: 'events'
    },
    {
      id: 'eventsWithMenus',
      title: 'Eventos con Menús',
      description: 'Eventos que tienen menús asignados',
      category: 'events'
    },
    // Recetas y Cocina
    {
      id: 'latestRecipes',
      title: 'Últimas Recetas',
      description: 'Recetas añadidas recientemente',
      category: 'recipes'
    },
    {
      id: 'recipesByCategory',
      title: 'Recetas por Categoría',
      description: 'Distribución de recetas por categorías',
      category: 'recipes'
    },
    // Proveedores y Compras
    {
      id: 'supplierOrders',
      title: 'Órdenes de Compra Pendientes',
      description: 'Proveedores con pedidos pendientes',
      category: 'suppliers'
    },
    {
      id: 'costTrends',
      title: 'Tendencias de Costos',
      description: 'Evolución de precios de ingredientes',
      category: 'suppliers'
    }
  ];

  const handleToggleWidget = (widgetId) => {
    updateWidgetConfig(widgetId, !widgetConfig[widgetId]);
    setMessage({ type: 'success', text: 'Configuración actualizada' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const handleDisplayConfigChange = (key, value) => {
    updateDisplayConfig(key, value);
    setMessage({ type: 'success', text: 'Configuración actualizada' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const handleReset = () => {
    resetWidgetConfig();
    setMessage({ type: 'success', text: 'Configuración restablecida' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const handleOpenReorderModal = () => {
    setTempOrder([...widgetOrder]);
    setShowReorderModal(true);
  };

  const handleCloseReorderModal = () => {
    setShowReorderModal(false);
    setTempOrder([]);
  };

  const handleSaveOrder = () => {
    updateWidgetOrder(tempOrder);
    setShowReorderModal(false);
    setMessage({ type: 'success', text: 'Orden de widgets actualizado' });
    setTimeout(() => setMessage({ type: '', text: '' }), 2000);
  };

  const moveItemUp = (index) => {
    if (index > 0) {
      const newOrder = [...tempOrder];
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      setTempOrder(newOrder);
    }
  };

  const moveItemDown = (index) => {
    if (index < tempOrder.length - 1) {
      const newOrder = [...tempOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setTempOrder(newOrder);
    }
  };

  const getWidgetTitle = (widgetId) => {
    const widget = widgets.find(w => w.id === widgetId);
    return widget ? widget.title : widgetId;
  };

  if (loading) {
    return <div className="settings-section">Cargando configuración...</div>;
  }

  return (
    <div className="settings-section">
      <h2>Configuración del Dashboard</h2>
      <p>Personaliza tu dashboard y selecciona qué widgets mostrar</p>

      {message.text && (
        <div className={`notification ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-group">
        <h3><FaClipboardList style={{ color: '#64748b' }} /> Gestión de Inventario</h3>
        <div className="description">
          Widgets para control de stock y ingredientes
        </div>

        <div className="widget-grid">
          {widgets.filter(w => w.category === 'inventory').map(widget => (
            <div key={widget.id} className="widget-config-item">
              <div className="widget-info">
                <h4>{widget.title}</h4>
                <p>{widget.description}</p>
              </div>
              <div className="widget-control">
                <div 
                  className={`settings-toggle ${widgetConfig[widget.id] ? 'active' : ''}`}
                  onClick={() => handleToggleWidget(widget.id)}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <h3><FaCalendarAlt style={{ color: '#64748b' }} /> Eventos y Planificación</h3>
        <div className="description">
          Widgets para gestión de eventos y planificación de menús
        </div>

        <div className="widget-grid">
          {widgets.filter(w => w.category === 'events').map(widget => (
            <div key={widget.id} className="widget-config-item">
              <div className="widget-info">
                <h4>{widget.title}</h4>
                <p>{widget.description}</p>
              </div>
              <div className="widget-control">
                <div 
                  className={`settings-toggle ${widgetConfig[widget.id] ? 'active' : ''}`}
                  onClick={() => handleToggleWidget(widget.id)}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <h3><FaUtensils style={{ color: '#64748b' }} /> Recetas y Cocina</h3>
        <div className="description">
          Widgets para gestión de recetas y actividades culinarias
        </div>

        <div className="widget-grid">
          {widgets.filter(w => w.category === 'recipes').map(widget => (
            <div key={widget.id} className="widget-config-item">
              <div className="widget-info">
                <h4>{widget.title}</h4>
                <p>{widget.description}</p>
              </div>
              <div className="widget-control">
                <div 
                  className={`settings-toggle ${widgetConfig[widget.id] ? 'active' : ''}`}
                  onClick={() => handleToggleWidget(widget.id)}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <h3><FaTruck style={{ color: '#64748b' }} /> Proveedores y Compras</h3>
        <div className="description">
          Widgets para gestión de proveedores y análisis de costos
        </div>

        <div className="widget-grid">
          {widgets.filter(w => w.category === 'suppliers').map(widget => (
            <div key={widget.id} className="widget-config-item">
              <div className="widget-info">
                <h4>{widget.title}</h4>
                <p>{widget.description}</p>
              </div>
              <div className="widget-control">
                <div 
                  className={`settings-toggle ${widgetConfig[widget.id] ? 'active' : ''}`}
                  onClick={() => handleToggleWidget(widget.id)}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <h3>Configuración de Visualización</h3>
        <div className="description">
          Personaliza cómo se muestran los datos en tu dashboard
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Número de elementos por widget</h4>
            <p>Máximo de elementos a mostrar en cada widget</p>
          </div>
          <div className="settings-item-control">
            <select 
              className="settings-select"
              value={widgetConfig.itemsPerWidget}
              onChange={(e) => handleDisplayConfigChange('itemsPerWidget', parseInt(e.target.value))}
            >
              <option value="5">5 elementos</option>
              <option value="10">10 elementos</option>
              <option value="15">15 elementos</option>
              <option value="20">20 elementos</option>
            </select>
          </div>
        </div>

        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Actualización automática</h4>
            <p>Actualizar datos automáticamente cada cierto tiempo</p>
          </div>
          <div className="settings-item-control">
            <div 
              className={`settings-toggle ${widgetConfig.autoRefresh ? 'active' : ''}`}
              onClick={() => handleDisplayConfigChange('autoRefresh', !widgetConfig.autoRefresh)}
            ></div>
          </div>
        </div>

        {widgetConfig.autoRefresh && (
          <div className="settings-item">
            <div className="settings-item-info">
              <h4>Intervalo de actualización</h4>
              <p>Frecuencia de actualización automática</p>
            </div>
            <div className="settings-item-control">
              <select 
                className="settings-select"
                value={widgetConfig.refreshInterval}
                onChange={(e) => handleDisplayConfigChange('refreshInterval', parseInt(e.target.value))}
              >
                <option value="15000">15 segundos</option>
                <option value="30000">30 segundos</option>
                <option value="60000">1 minuto</option>
                <option value="300000">5 minutos</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="settings-group">
        <h3>Orden de Widgets</h3>
        <div className="description">
          Personaliza el orden en que aparecen los widgets en tu dashboard
        </div>
        
        <div className="settings-item">
          <div className="settings-item-info">
            <h4>Reordenar Widgets</h4>
            <p>Cambiar el orden de visualización de los widgets en el dashboard</p>
          </div>
          <div className="settings-item-control">
            <button 
              className="settings-button primary"
              onClick={handleOpenReorderModal}
            >
              <FaArrowsAlt /> Reordenar
            </button>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button className="settings-button secondary" onClick={handleReset}>
          Restablecer por defecto
        </button>
      </div>

      {/* Modal de Reordenamiento */}
      <Modal 
        isOpen={showReorderModal} 
        title="Reordenar Widgets" 
        onClose={handleCloseReorderModal}
        fullscreenMobile={true}
      >
        <div style={{ padding: '0 4px' }}>
          <p style={{ marginBottom: '20px', color: '#64748b' }}>
            Usa los botones de flecha para cambiar el orden de los widgets:
          </p>
          <div className="reorder-list">
            {tempOrder.map((widgetId, index) => (
              <div key={widgetId} className="reorder-item">
                <div className="reorder-item-info">
                  <span className="reorder-position">{index + 1}.</span>
                  <span className="reorder-title">{getWidgetTitle(widgetId)}</span>
                  <span className={`reorder-status ${widgetConfig[widgetId] ? 'active' : 'inactive'}`}>
                    {widgetConfig[widgetId] ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className="reorder-controls">
                  <button 
                    className="reorder-btn"
                    onClick={() => moveItemUp(index)}
                    disabled={index === 0}
                  >
                    <FaArrowUp />
                  </button>
                  <button 
                    className="reorder-btn"
                    onClick={() => moveItemDown(index)}
                    disabled={index === tempOrder.length - 1}
                  >
                    <FaArrowDown />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button className="btn cancel" onClick={handleCloseReorderModal}>
              Cancelar
            </button>
            <button className="btn add" onClick={handleSaveOrder}>
              Guardar Orden
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardSection;