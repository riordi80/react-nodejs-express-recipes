// src/pages/ingredients/Ingredients.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { FaBan, FaUndo } from 'react-icons/fa';
import BasePage from '../../components/BasePage';
import Modal from '../../components/modal/Modal';
import { usePageState } from '../../hooks/usePageState';
import api from '../../api/axios';
import './Ingredients.css';
import '../../components/recipes/FilterBar.css';

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState('available'); // 'available', 'all', 'unavailable'
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // Form states
  const [newItem, setNewItem] = useState({
    name: '',
    unit: 'unit',
    base_price: '',
    net_price: '',
    stock: '',
    stock_minimum: '',
    season: [],
    expiration_date: '',
    is_available: true,
    comment: ''
  });
  const [newWastePercent, setNewWastePercent] = useState('');
  const [newSelectedAllergens, setNewSelectedAllergens] = useState([]);

  const [editedItem, setEditedItem] = useState(null);
  const [editedWastePercent, setEditedWastePercent] = useState('');
  const [editedSelectedAllergens, setEditedSelectedAllergens] = useState([]);

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

  // Load allergens data
  useEffect(() => {
    const fetchAllergens = async () => {
      try {
        const { data } = await api.get('/allergens');
        setAllergens(data);
      } catch (error) {
        console.error('Error loading allergens:', error);
      }
    };
    fetchAllergens();
  }, []);

  // Load ingredients when filter changes
  useEffect(() => {
    loadIngredients();
  }, [availabilityFilter]);

  // Create handler
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newItem,
        waste_percent: Number(newWastePercent) / 100,
        season: Array.isArray(newItem.season) ? newItem.season.join(',') : newItem.season
      };
      const response = await api.post('/ingredients', payload);
      
      // Si hay alérgenos seleccionados, asignarlos
      if (newSelectedAllergens.length > 0 && response.data.ingredient_id) {
        await api.post(`/ingredients/${response.data.ingredient_id}/allergens`, {
          allergen_ids: newSelectedAllergens
        });
      }
      
      // Reset form
      setNewItem({ 
        name: '', 
        unit: 'unit', 
        base_price: '', 
        net_price: '', 
        stock: '', 
        stock_minimum: '', 
        season: [], 
        expiration_date: '', 
        is_available: true, 
        comment: '' 
      });
      setNewWastePercent('');
      setNewSelectedAllergens([]);
      setIsCreateOpen(false);
      
      // Reload data
      await loadIngredients();
      notify('Ingrediente creado correctamente', 'success');
    } catch (err) {
      console.error('Error creating ingredient:', err);
      notify(err.response?.data?.message || 'Error al crear ingrediente', 'error');
    }
  };

  // Edit handlers
  const openEditModal = async (row) => {
    // Formatear fecha para input type="date" (YYYY-MM-DD) sin conversión de zona horaria
    let formattedDate = '';
    if (row.expiration_date) {
      const date = new Date(row.expiration_date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
    }
    
    setEditedItem({ 
      ...row, 
      expiration_date: formattedDate,
      season: Array.isArray(row.season) ? row.season : (row.season ? row.season.split(',').map(s => s.trim()) : [])
    });
    setEditedWastePercent((row.waste_percent * 100).toFixed(2));
    
    // Cargar alérgenos del ingrediente
    try {
      const { data } = await api.get(`/ingredients/${row.ingredient_id}/allergens`);
      setEditedSelectedAllergens(data.map(a => a.allergen_id));
    } catch (error) {
      console.error('Error cargando alérgenos:', error);
      setEditedSelectedAllergens([]);
    }
    
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    try {
      const payload = {
        ...editedItem,
        waste_percent: Number(editedWastePercent) / 100,
        season: Array.isArray(editedItem.season) ? editedItem.season.join(',') : editedItem.season
      };
      await api.put(`/ingredients/${editedItem.ingredient_id}`, payload);
      
      // Actualizar alérgenos
      await api.post(`/ingredients/${editedItem.ingredient_id}/allergens`, {
        allergen_ids: editedSelectedAllergens
      });
      
      setIsEditOpen(false);
      setEditedItem(null);
      setEditedWastePercent('');
      setEditedSelectedAllergens([]);
      await loadIngredients();
      notify('Ingrediente actualizado correctamente', 'success');
    } catch (error) {
      console.error('Error detallado al actualizar:', error);
      notify(error.response?.data?.message || 'Error al actualizar ingrediente', 'error');
    }
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
      await loadIngredients();
      notify('Ingrediente desactivado correctamente', 'success');
    } catch (error) {
      console.error('Error al desactivar ingrediente:', error);
      notify(error.response?.data?.message || 'Error al desactivar ingrediente', 'error');
    }
  };

  const handleActivate = async (ingredient) => {
    try {
      await api.put(`/ingredients/${ingredient.ingredient_id}/activate`);
      await loadIngredients();
      notify('Ingrediente reactivado correctamente', 'success');
    } catch (error) {
      console.error('Error al reactivar ingrediente:', error);
      notify(error.response?.data?.message || 'Error al reactivar ingrediente', 'error');
    }
  };

  // Funciones para manejar temporadas con chips
  const toggleSeason = (season, isNew = true) => {
    const currentSeasons = isNew ? newItem.season : editedItem.season;
    const newSeasons = currentSeasons.includes(season)
      ? currentSeasons.filter(s => s !== season)
      : [...currentSeasons, season];
    
    if (isNew) {
      setNewItem({ ...newItem, season: newSeasons });
    } else {
      setEditedItem({ ...editedItem, season: newSeasons });
    }
  };

  // Funciones para manejar alérgenos con chips
  const toggleAllergen = (allergenId, isNew = true) => {
    const currentAllergens = isNew ? newSelectedAllergens : editedSelectedAllergens;
    const newAllergens = currentAllergens.includes(allergenId)
      ? currentAllergens.filter(id => id !== allergenId)
      : [...currentAllergens, allergenId];
    
    if (isNew) {
      setNewSelectedAllergens(newAllergens);
    } else {
      setEditedSelectedAllergens(newAllergens);
    }
  };

  const availableSeasons = [
    { value: 'enero', label: 'Enero' },
    { value: 'febrero', label: 'Febrero' },
    { value: 'marzo', label: 'Marzo' },
    { value: 'abril', label: 'Abril' },
    { value: 'mayo', label: 'Mayo' },
    { value: 'junio', label: 'Junio' },
    { value: 'julio', label: 'Julio' },
    { value: 'agosto', label: 'Agosto' },
    { value: 'septiembre', label: 'Septiembre' },
    { value: 'octubre', label: 'Octubre' },
    { value: 'noviembre', label: 'Noviembre' },
    { value: 'diciembre', label: 'Diciembre' },
    { value: 'todo_año', label: 'Todo el año' }
  ];

  // columnas
const columns = useMemo(() => [
  { 
    name: 'Nombre', 
    selector: r => r.name, 
    sortable: true, 
    grow: 1,
    cell: row => (
      <span style={{ 
        color: row.is_available ? '#000' : '#94a3b8',
        fontStyle: row.is_available ? 'normal' : 'italic'
      }}>
        {row.name}
        {!row.is_available && <span style={{ marginLeft: '8px', fontSize: '12px' }}>(Inactivo)</span>}
      </span>
    )
  },
  { name: 'P. Base', selector: r => r.base_price, sortable: true },
  { name: 'Merma (%)', selector: row => `${(row.waste_percent * 100).toFixed(2)}%`, sortable: true },
  { name: 'P. Neto', selector: r => r.net_price, sortable: true },
  { name: 'Stock', selector: r => r.stock, sortable: true },
  { name: 'Stock Mín.', selector: r => r.stock_minimum || '-', sortable: true },
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
    name: 'Acciones',
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


  // Custom filter component - siguiendo el patrón visual de FilterBar
  const availabilityFilterComponent = (
    <div className="filter-bar" style={{ marginBottom: '12px' }}>
      <input
        type="text"
        className="filter-input"
        placeholder="Buscar ingrediente…"
        value={filterText}
        onChange={e => setFilterText(e.target.value)}
        style={{ flex: 1, width: 'auto' }}
      />
      <select 
        className="filter-select"
        value={availabilityFilter} 
        onChange={(e) => setAvailabilityFilter(e.target.value)}
      >
        <option value="available">Solo disponibles</option>
        <option value="all">Todos los ingredientes</option>
        <option value="unavailable">Solo no disponibles</option>
      </select>
    </div>
  );

  return (
    <>
      <BasePage
        title="Ingredientes"
        data={filteredData}
        columns={columns}
        loading={loading}
        error={error}
        message={message}
        messageType={messageType}
        filterText=""
        onFilterChange={() => {}}
        showSearch={false}
        onAdd={() => setIsCreateOpen(true)}
        onRowClicked={openEditModal}
        addButtonText="Añadir ingrediente"
        searchPlaceholder="Buscar ingrediente..."
        noDataMessage="No hay ingredientes para mostrar"
        customFilters={availabilityFilterComponent}
      />

      {/* CREATE MODAL */}
      <Modal isOpen={isCreateOpen} title="Nuevo ingrediente" onClose={() => setIsCreateOpen(false)} fullscreenMobile={true}>
        <form onSubmit={handleCreate} className="modal-body-form">
          <div className="form-fields-main">
            <label>Nombre</label>
            <input type="text" className="input-field" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required />

            <label>Unidad</label>
            <select className="input-field" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })}>
              {['gr','kg','ml','l','unit','tbsp','tsp'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            <label>Precio base</label>
            <input type="number" step="0.01" className="input-field" value={newItem.base_price} onChange={e => setNewItem({ ...newItem, base_price: e.target.value })} required />

            <label>Merma (%)</label>
            <input type="number" step="0.01" className="input-field" value={newWastePercent} onChange={e => setNewWastePercent(e.target.value)} placeholder="Ej. 5.43" />

            <label>Precio neto</label>
            <input type="number" step="0.01" className="input-field" value={newItem.net_price} onChange={e => setNewItem({ ...newItem, net_price: e.target.value })} />

            <label>Comentario</label>
            <textarea className="input-field" rows="6" value={newItem.comment} onChange={e => setNewItem({ ...newItem, comment: e.target.value })} />

            <label>
              <input type="checkbox" checked={newItem.is_available} onChange={e => setNewItem({ ...newItem, is_available: e.target.checked })} /> Disponible
            </label>
          </div>

          <div className="form-fields-allergens">
            <label>Stock inicial</label>
            <input type="number" step="0.01" className="input-field" value={newItem.stock} onChange={e => setNewItem({ ...newItem, stock: e.target.value })} />

            <label>Stock mínimo</label>
            <input type="number" step="0.01" className="input-field" value={newItem.stock_minimum} onChange={e => setNewItem({ ...newItem, stock_minimum: e.target.value })} placeholder="Cantidad mínima para alerta" />

            <label>Temporada</label>
            <div className="seasons-chips">
              {availableSeasons.map(season => (
                <span
                  key={season.value}
                  className={`season-chip ${newItem.season.includes(season.value) ? 'selected' : ''}`}
                  onClick={() => toggleSeason(season.value, true)}
                >
                  {season.label}
                </span>
              ))}
            </div>

            <label>Fecha de caducidad</label>
            <input type="date" className="input-field" value={newItem.expiration_date} onChange={e => setNewItem({ ...newItem, expiration_date: e.target.value })} />

            <label>Alérgenos</label>
            <div className="allergens-chips">
              {allergens.map(allergen => (
                <span
                  key={allergen.allergen_id}
                  className={`allergen-chip ${newSelectedAllergens.includes(allergen.allergen_id) ? 'selected' : ''}`}
                  onClick={() => toggleAllergen(allergen.allergen_id, true)}
                >
                  {allergen.name}
                </span>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn cancel" onClick={() => setIsCreateOpen(false)}>Cancelar</button>
            <button type="submit" className="btn add">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={isEditOpen} title="Editar ingrediente" onClose={() => setIsEditOpen(false)} fullscreenMobile={true}>
        <form className="modal-body-form">
          <div className="form-fields-main">
            <label>Nombre</label>
            <input type="text" className="input-field" value={editedItem?.name || ''} onChange={e => setEditedItem({ ...editedItem, name: e.target.value })} />

            <label>Unidad</label>
            <select className="input-field" value={editedItem?.unit || ''} onChange={e => setEditedItem({ ...editedItem, unit: e.target.value })}>
              {['gr','kg','ml','l','unit','tbsp','tsp'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            <label>Precio base</label>
            <input type="number" step="0.01" className="input-field" value={editedItem?.base_price || ''} onChange={e => setEditedItem({ ...editedItem, base_price: e.target.value })} />

            <label>Merma (%)</label>
            <input type="number" step="0.01" className="input-field" value={editedWastePercent} onChange={e => setEditedWastePercent(e.target.value)} placeholder="Ej. 5.43" />

            <label>Precio neto</label>
            <input type="number" step="0.01" className="input-field" value={editedItem?.net_price || ''} onChange={e => setEditedItem({ ...editedItem, net_price: e.target.value })} />

            <label>Comentario</label>
            <textarea className="input-field" rows="6" value={editedItem?.comment || ''} onChange={e => setEditedItem({ ...editedItem, comment: e.target.value })} />

            <label>
              <input type="checkbox" checked={editedItem?.is_available || false} onChange={e => setEditedItem({ ...editedItem, is_available: e.target.checked })} /> Disponible
            </label>
          </div>

          <div className="form-fields-allergens">
            <label>Stock</label>
            <input type="number" step="0.01" className="input-field" value={editedItem?.stock || ''} onChange={e => setEditedItem({ ...editedItem, stock: e.target.value })} />

            <label>Stock mínimo</label>
            <input type="number" step="0.01" className="input-field" value={editedItem?.stock_minimum || ''} onChange={e => setEditedItem({ ...editedItem, stock_minimum: e.target.value })} placeholder="Cantidad mínima para alerta" />

            <label>Temporada</label>
            <div className="seasons-chips">
              {availableSeasons.map(season => (
                <span
                  key={season.value}
                  className={`season-chip ${editedItem?.season?.includes(season.value) ? 'selected' : ''}`}
                  onClick={() => toggleSeason(season.value, false)}
                >
                  {season.label}
                </span>
              ))}
            </div>

            <label>Fecha de caducidad</label>
            <input type="date" className="input-field" value={editedItem?.expiration_date || ''} onChange={e => setEditedItem({ ...editedItem, expiration_date: e.target.value })} />

            <label>Alérgenos</label>
            <div className="allergens-chips">
              {allergens.map(allergen => (
                <span
                  key={allergen.allergen_id}
                  className={`allergen-chip ${editedSelectedAllergens.includes(allergen.allergen_id) ? 'selected' : ''}`}
                  onClick={() => toggleAllergen(allergen.allergen_id, false)}
                >
                  {allergen.name}
                </span>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn cancel" onClick={() => setIsEditOpen(false)}>Cancelar</button>
            <button type="button" className="btn add" onClick={handleEdit}>Guardar</button>
          </div>
        </form>
      </Modal>

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
    </>
  );
}
