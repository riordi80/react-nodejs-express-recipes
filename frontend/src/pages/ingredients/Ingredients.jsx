// src/pages/ingredients/Ingredients.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { FaBan, FaUndo, FaExclamationTriangle, FaCalendarAlt, FaSeedling, FaExclamationCircle } from 'react-icons/fa';
import BasePage from '../../components/BasePage';
import Modal from '../../components/modal/Modal';
import EditIngredientModal from '../../components/modals/EditIngredientModal';
import api from '../../api/axios';
import { formatDecimal, formatPrice } from '../../utils/formatters';
import './Ingredients.css';

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('available'); // 'available', 'all', 'unavailable'
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  // Modal states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // Estado para EditIngredientModal
  const [editIngredientModal, setEditIngredientModal] = useState({
    isOpen: false,
    ingredient: null
  });

  // Widgets data
  const [widgetsData, setWidgetsData] = useState({
    lowStock: [],
    expiringSoon: [],
    seasonal: [],
    noSuppliers: []
  });
  const [widgetsLoading, setWidgetsLoading] = useState(true);





  // Load ingredients with availability filter
  const loadIngredients = async () => {
    try {
      setLoading(true);
      const params = {};
      if (availabilityFilter === 'available') {
        params.available = 'true';
      } else if (availabilityFilter === 'unavailable') {
        params.available = 'false';
      }
      // For 'all', don't add any parameter
      
      const response = await api.get('/ingredients', { params });
      setIngredients(response.data);
      setError(null);
    } catch (err) {
      setError(`Error al cargar ingredientes: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Notification function
  const notify = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  // Filter ingredients by search text
  const filteredData = useMemo(() => {
    if (!filterText) return ingredients;
    return ingredients.filter(ingredient => 
      ingredient.name.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [ingredients, filterText]);



  // Load widgets data
  const fetchWidgetsData = async () => {
    try {
      setWidgetsLoading(true);
      const response = await api.get('/ingredients/dashboard-widgets');
      setWidgetsData(response.data);
    } catch (error) {
      console.error('Error loading widgets data:', error);
    } finally {
      setWidgetsLoading(false);
    }
  };

  useEffect(() => {
    fetchWidgetsData();
  }, []);

  // Función para recargar todo (ingredientes + widgets)
  const reloadAllData = async () => {
    await Promise.all([
      loadIngredients(),
      fetchWidgetsData()
    ]);
  };


  // Load ingredients when filter changes
  useEffect(() => {
    loadIngredients();
  }, [availabilityFilter]);


  // Edit handlers que usan el nuevo sistema
  const openEditModal = async (row) => {
    await handleIngredientClick(row.ingredient_id);
  };







  // Delete handlers
  const openDeleteModal = (row) => {
    setCurrentItem(row);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/ingredients/${currentItem.ingredient_id}`);
      setIsDeleteOpen(false);
      setCurrentItem(null);
      await reloadAllData();
      notify('Ingrediente desactivado correctamente', 'success');
    } catch (error) {
      console.error('Error al desactivar ingrediente:', error);
      notify(error.response?.data?.message || 'Error al desactivar ingrediente', 'error');
    }
  };

  const handleActivate = async (ingredient) => {
    try {
      await api.put(`/ingredients/${ingredient.ingredient_id}/activate`);
      await reloadAllData();
      notify('Ingrediente reactivado correctamente', 'success');
    } catch (error) {
      console.error('Error al reactivar ingrediente:', error);
      notify(error.response?.data?.message || 'Error al reactivar ingrediente', 'error');
    }
  };

  // Handlers para EditIngredientModal
  const handleIngredientClick = async (ingredientId) => {
    try {
      const response = await api.get(`/ingredients/${ingredientId}`);
      setEditIngredientModal({
        isOpen: true,
        ingredient: response.data
      });
    } catch (error) {
      console.error('Error al cargar ingrediente:', error);
      notify('Error al cargar ingrediente', 'error');
    }
  };

  const handleIngredientSave = async (ingredientData, allergens = []) => {
    try {
      let response;
      
      if (editIngredientModal.ingredient?.ingredient_id) {
        // Modo edición
        await api.put(`/ingredients/${editIngredientModal.ingredient.ingredient_id}`, ingredientData);
        
        // Actualizar alérgenos
        if (allergens.length >= 0) {
          await api.post(`/ingredients/${editIngredientModal.ingredient.ingredient_id}/allergens`, {
            allergen_ids: allergens
          });
        }
        
        notify('Ingrediente actualizado correctamente', 'success');
      } else {
        // Modo creación
        const payload = {
          ...ingredientData,
          season: Array.isArray(ingredientData.season) ? ingredientData.season.join(',') : ingredientData.season
        };
        response = await api.post('/ingredients', payload);
        
        // Si hay alérgenos seleccionados, asignarlos
        if (allergens.length > 0 && response.data.ingredient_id) {
          await api.post(`/ingredients/${response.data.ingredient_id}/allergens`, {
            allergen_ids: allergens
          });
        }
        
        notify('Ingrediente creado correctamente', 'success');
      }
      
      // Recargar datos para reflejar cambios
      await reloadAllData();
      
      // Cerrar modal
      setEditIngredientModal({ isOpen: false, ingredient: null });
      return true;
    } catch (error) {
      console.error('Error al guardar ingrediente:', error);
      notify(error.response?.data?.message || 'Error al guardar ingrediente', 'error');
      return false;
    }
  };

  const handleIngredientModalClose = () => {
    setEditIngredientModal({ isOpen: false, ingredient: null });
  };

  // Handler para abrir modal de creación
  const handleCreateIngredient = () => {
    setEditIngredientModal({ isOpen: true, ingredient: null });
  };

  // Widget handlers que usan el nuevo sistema
  const handleWidgetItemClick = async (ingredient) => {
    await handleIngredientClick(ingredient.ingredient_id);
  };

  // Helper function for expiry urgency
  const getExpiryUrgency = (days) => {
    if (days <= 3) return { class: 'critical', icon: '🔴' };
    if (days <= 7) return { class: 'warning', icon: '🟡' };
    return { class: 'normal', icon: '🟢' };
  };


  // columnas
const columns = useMemo(() => [
  { 
    name: 'Nombre', 
    selector: r => r.name + (!r.is_available ? ' (Inactivo)' : ''), 
    sortable: true, 
    grow: 1
  },
  { name: 'P. Base', selector: r => `${formatPrice(r.base_price)}/${r.unit}`, sortable: true },
  { name: 'Merma (%)', selector: row => `${formatDecimal(row.waste_percent * 100, 2)}%`, sortable: true },
  { name: 'P. Neto', selector: r => formatPrice(r.net_price), sortable: true },
  { name: 'Stock', selector: r => r.stock ? formatDecimal(r.stock, 2) : '-', sortable: true },
  { name: 'Stock Mín.', selector: r => r.stock_minimum ? formatDecimal(r.stock_minimum, 2) : '-', sortable: true },
  { 
    name: 'Temporada',
    selector: row => {
      if (!row.season) return '-';
      if (row.season === 'todo_año') return 'Todo el año';
      
      // Si es una cadena separada por comas, mostrar todos los meses
      if (typeof row.season === 'string' && row.season.includes(',')) {
        return row.season.split(',').map(month => 
          month.trim().charAt(0).toUpperCase() + month.trim().slice(1)
        ).join(', ');
      }
      
      return row.season.charAt(0).toUpperCase() + row.season.slice(1);
    },
    sortable: true,
    minWidth: '150px'
  },
  { 
    name: 'Caduca',
    selector: row => {
      if (!row.expiration_date) return '';
      const date = new Date(row.expiration_date);
      return date.toLocaleDateString('es-ES');
    },
    sortable: true,
    minWidth: '120px'
  },
  { 
    name: 'Estado', 
    selector: r => r.is_available ? 'Activo' : 'Inactivo', 
    sortable: true,
    cell: row => (
      <span style={{ 
        color: row.is_available ? '#10b981' : '#ef4444',
        fontWeight: '500'
      }}>
        {row.is_available ? 'Activo' : 'Inactivo'}
      </span>
    )
  },
  {
    name: 'Disponibilidad',
    cell: row => (
      <div className="table-actions">
        {row.is_available ? (
          <button 
            className="icon-btn delete-icon" 
            onClick={() => openDeleteModal(row)} 
            title="Desactivar ingrediente"
          >
            <FaBan />
          </button>
        ) : (
          <button 
            className="icon-btn activate-icon" 
            onClick={() => handleActivate(row)} 
            title="Reactivar ingrediente"
            style={{ background: '#10b981' }}
          >
            <FaUndo />
          </button>
        )}
      </div>
    ),
    ignoreRowClick: true,
    allowOverflow: true,
    button: true,
    width: '100px'
  }
], []);


  // Define availability filter options for PageHeader
  const availabilityFilterOptions = [
    { value: 'available', label: 'Solo disponibles' },
    { value: 'all', label: 'Todos los ingredientes' },
    { value: 'unavailable', label: 'Solo no disponibles' }
  ];

  const pageFilters = [
    {
      key: 'availability',
      label: 'Estado',
      value: availabilityFilter,
      options: availabilityFilterOptions,
      onChange: setAvailabilityFilter
    }
  ];

  return (
    <>
      <BasePage
        title="Ingredientes"
        subtitle="Gestiona tu inventario de ingredientes"
        data={filteredData}
        columns={columns}
        loading={loading}
        error={error}
        message={message}
        messageType={messageType}
        filterText={filterText}
        onFilterChange={setFilterText}
        showSearch={true}
        onAdd={handleCreateIngredient}
        onRowClicked={openEditModal}
        addButtonText="Añadir ingrediente"
        searchPlaceholder="Buscar ingrediente..."
        noDataMessage="No hay ingredientes para mostrar"
        filters={pageFilters}
        enableMobileModal={true}
      >
        {/* Widgets Dashboard específicos de Ingredients */}
        <div className="ingredients-widgets" style={{ marginBottom: '24px' }}>
          <div className="widgets-grid">
            {/* Widget 1: Stock Crítico */}
            <div className="widget-card critical">
              <div className="widget-header">
                <FaExclamationTriangle className="widget-icon critical" />
                <h3>Stock Crítico</h3>
                <span className="widget-count">{widgetsData.lowStock.length}</span>
              </div>
              <div className="widget-content">
                {widgetsLoading ? (
                  <div className="widget-loading">Cargando...</div>
                ) : widgetsData.lowStock.length === 0 ? (
                  <div className="widget-empty">✅ Todo en orden</div>
                ) : (
                  <div className="widget-list">
                    {widgetsData.lowStock.slice(0, 4).map(ingredient => (
                      <div 
                        key={ingredient.ingredient_id} 
                        className="widget-item clickable"
                        onClick={() => handleWidgetItemClick(ingredient)}
                      >
                        <div className="item-info">
                          <span className="item-name">{ingredient.name}</span>
                          <span className="item-detail">
                            Faltan {formatDecimal(ingredient.deficit)} {ingredient.unit}
                          </span>
                        </div>
                        <div className="item-value critical">
                          {formatDecimal(ingredient.stock)} / {formatDecimal(ingredient.stock_minimum)}
                        </div>
                      </div>
                    ))}
                    {widgetsData.lowStock.length > 4 && (
                      <div className="widget-more">
                        +{widgetsData.lowStock.length - 4} más...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Widget 2: Próximos a Caducar */}
            <div className="widget-card warning">
              <div className="widget-header">
                <FaCalendarAlt className="widget-icon warning" />
                <h3>Próximos a Caducar</h3>
                <span className="widget-count">{widgetsData.expiringSoon.length}</span>
              </div>
              <div className="widget-content">
                {widgetsLoading ? (
                  <div className="widget-loading">Cargando...</div>
                ) : widgetsData.expiringSoon.length === 0 ? (
                  <div className="widget-empty">✅ Sin caducidades próximas</div>
                ) : (
                  <div className="widget-list">
                    {widgetsData.expiringSoon.slice(0, 4).map(ingredient => {
                      const urgency = getExpiryUrgency(ingredient.days_until_expiry);
                      return (
                        <div 
                          key={ingredient.ingredient_id} 
                          className="widget-item clickable"
                          onClick={() => handleWidgetItemClick(ingredient)}
                        >
                          <div className="item-info">
                            <span className="item-name">{ingredient.name}</span>
                            <span className="item-detail">
                              Stock: {formatDecimal(ingredient.stock)} {ingredient.unit}
                            </span>
                          </div>
                          <div className={`item-value ${urgency.class}`}>
                            {urgency.icon} {ingredient.days_until_expiry}d
                          </div>
                        </div>
                      );
                    })}
                    {widgetsData.expiringSoon.length > 4 && (
                      <div className="widget-more">
                        +{widgetsData.expiringSoon.length - 4} más...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Widget 3: Ingredientes Estacionales */}
            <div className="widget-card seasonal">
              <div className="widget-header">
                <FaSeedling className="widget-icon seasonal" />
                <h3>Ingredientes Estacionales</h3>
                <span className="widget-count">{widgetsData.seasonal.length}</span>
              </div>
              <div className="widget-content">
                {widgetsLoading ? (
                  <div className="widget-loading">Cargando...</div>
                ) : widgetsData.seasonal.length === 0 ? (
                  <div className="widget-empty">Sin ingredientes estacionales</div>
                ) : (
                  <div className="widget-list">
                    {widgetsData.seasonal.slice(0, 4).map(ingredient => (
                      <div 
                        key={ingredient.ingredient_id} 
                        className="widget-item clickable"
                        onClick={() => handleWidgetItemClick(ingredient)}
                      >
                        <div className="item-info">
                          <span className="item-name">{ingredient.name}</span>
                          <span className="item-detail">
                            Temporada: {ingredient.season}
                          </span>
                        </div>
                        <div className="item-value seasonal">
                          🌱 {ingredient.is_available ? 'Disponible' : 'No disponible'}
                        </div>
                      </div>
                    ))}
                    {widgetsData.seasonal.length > 4 && (
                      <div className="widget-more">
                        +{widgetsData.seasonal.length - 4} más...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Widget 4: Sin Proveedores Asignados */}
            <div className="widget-card no-suppliers">
              <div className="widget-header">
                <FaExclamationCircle className="widget-icon no-suppliers" />
                <h3>Sin Proveedores</h3>
                <span className="widget-count">{widgetsData.noSuppliers.length}</span>
              </div>
              <div className="widget-content">
                {widgetsLoading ? (
                  <div className="widget-loading">Cargando...</div>
                ) : widgetsData.noSuppliers.length === 0 ? (
                  <div className="widget-empty">✅ Todos tienen proveedores</div>
                ) : (
                  <div className="widget-list">
                    {widgetsData.noSuppliers.slice(0, 4).map(ingredient => (
                      <div 
                        key={ingredient.ingredient_id} 
                        className="widget-item clickable"
                        onClick={() => handleWidgetItemClick(ingredient)}
                      >
                        <div className="item-info">
                          <span className="item-name">{ingredient.name}</span>
                          <span className="item-detail">
                            Stock: {formatDecimal(ingredient.stock)} {ingredient.unit}
                          </span>
                        </div>
                        <div className="item-value no-suppliers">
                          {formatPrice(ingredient.base_price)}
                        </div>
                      </div>
                    ))}
                    {widgetsData.noSuppliers.length > 4 && (
                      <div className="widget-more">
                        +{widgetsData.noSuppliers.length - 4} más...
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Título de la sección de tabla */}
        <div className="ingredients-table-section">
          <h2 className="ingredients-table-title">Lista de Ingredientes</h2>
        </div>
      </BasePage>



      {/* DELETE MODAL */}
      <Modal isOpen={isDeleteOpen} title="Confirmar desactivación" onClose={() => setIsDeleteOpen(false)}>
        <p>¿Seguro que deseas desactivar <strong>{currentItem?.name}</strong>?</p>
        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
          El ingrediente se marcará como no disponible pero se mantendrá en las recetas existentes.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn cancel" onClick={() => setIsDeleteOpen(false)}>Cancelar</button>
          <button type="button" className="btn delete" onClick={handleDelete}>Desactivar</button>
        </div>
      </Modal>

      {/* EDIT INGREDIENT MODAL - Componente reutilizable */}
      <EditIngredientModal
        isOpen={editIngredientModal.isOpen}
        onClose={handleIngredientModalClose}
        ingredient={editIngredientModal.ingredient}
        onSave={handleIngredientSave}
        onIngredientUpdated={() => {}}
        mode={editIngredientModal.ingredient ? 'edit' : 'create'}
      />
    </>
  );
}
