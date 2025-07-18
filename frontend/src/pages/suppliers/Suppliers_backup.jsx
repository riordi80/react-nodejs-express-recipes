// src/pages/suppliers/Suppliers.jsx
import React, { useEffect, useState, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import { FaEdit, FaRegTrashAlt } from 'react-icons/fa';
import api from '../../api/axios';
import Modal from '../../components/modal/Modal';
import './Suppliers.css';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [supplierIngredients, setSupplierIngredients] = useState([]);

  // ---- create modal state ----
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    phone: '',
    email: '',
    website_url: '',
    address: ''
  });

  // ---- edit modal state ----
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editedItem, setEditedItem] = useState(null);
  const [editModalTab, setEditModalTab] = useState('info'); // 'info' o 'ingredients'

  // ---- add ingredient modal state ----
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [ingredientDetails, setIngredientDetails] = useState({}); // {ingredientId: {price, deliveryTime, isPreferred}}

  // ---- edit supplier-ingredient modal state ----
  const [isEditSupplierIngredientOpen, setIsEditSupplierIngredientOpen] = useState(false);
  const [editingSupplierIngredient, setEditingSupplierIngredient] = useState(null);

  // ---- search in add ingredients modal ----
  const [ingredientSearchText, setIngredientSearchText] = useState('');

  // ---- sorting for supplier-ingredients table ----
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // ---- delete modal state ----
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  // ---- delete supplier-ingredient modal state ----
  const [isDeleteSupplierIngredientOpen, setIsDeleteSupplierIngredientOpen] = useState(false);
  const [currentSupplierIngredient, setCurrentSupplierIngredient] = useState(null);

  // mensaje de notificación
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const notify = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  // fetch inicial
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [suppliersRes, ingredientsRes] = await Promise.all([
          api.get('/suppliers'),
          api.get('/ingredients')
        ]);
        setSuppliers(suppliersRes.data);
        setIngredients(ingredientsRes.data);
      } catch {
        setError('Error al obtener datos');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // recarga lista
  const reload = async () => {
    try {
      const { data } = await api.get('/suppliers');
      setSuppliers(data);
    } catch (error) {
      console.error('Error reloading suppliers:', error);
    }
  };

  // create
  const handleCreate = async e => {
    e.preventDefault();
    try {
      await api.post('/suppliers', newItem);
      notify('Proveedor creado correctamente');
      setNewItem({ name: '', phone: '', email: '', website_url: '', address: '' });
      setIsCreateOpen(false);
      reload();
    } catch (err) {
      notify(err.response?.data?.message || 'Error al crear', 'error');
    }
  };

  // open edit
  const openEditModal = async row => {
    setEditedItem({ ...row });
    setEditModalTab('info');
    
    // Cargar ingredientes del proveedor
    try {
      const { data } = await api.get(`/suppliers/${row.supplier_id}/ingredients`);
      setSupplierIngredients(data);
    } catch (error) {
      console.error('Error cargando ingredientes del proveedor:', error);
      setSupplierIngredients([]);
    }
    
    setIsEditOpen(true);
  };

  // confirm edit
  const handleEdit = async () => {
    try {
      await api.put(`/suppliers/${editedItem.supplier_id}`, editedItem);
      notify('Proveedor actualizado');
      setIsEditOpen(false);
      reload();
    } catch (error) {
      console.error('Error detallado al actualizar:', error);
      notify(error.response?.data?.message || 'Error al actualizar', 'error');
    }
  };

  // open delete
  const openDeleteModal = row => {
    setCurrentItem(row);
    setIsDeleteOpen(true);
  };
  
  // confirm delete
  const handleDelete = async () => {
    try {
      await api.delete(`/suppliers/${currentItem.supplier_id}`);
      notify('Proveedor eliminado');
      setIsDeleteOpen(false);
      reload();
    } catch {
      notify('Error al eliminar', 'error');
    }
  };

  // añadir ingrediente - funciones auxiliares
  const handleIngredientSelect = (ingredientId, checked) => {
    if (checked) {
      setSelectedIngredients([...selectedIngredients, ingredientId]);
      setIngredientDetails(prev => ({
        ...prev,
        [ingredientId]: { price: '', deliveryTime: '', isPreferred: false }
      }));
    } else {
      setSelectedIngredients(selectedIngredients.filter(id => id !== ingredientId));
      setIngredientDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[ingredientId];
        return newDetails;
      });
    }
  };

  const handleIngredientDetailChange = (ingredientId, field, value) => {
    setIngredientDetails(prev => ({
      ...prev,
      [ingredientId]: {
        ...prev[ingredientId],
        [field]: value
      }
    }));
  };

  // filtrar ingredientes disponibles (que no estén ya asignados)
  const availableIngredients = ingredients.filter(ingredient => 
    !supplierIngredients.some(si => si.ingredient_id === ingredient.ingredient_id)
  );

  // función para normalizar texto (quitar acentos)
  const normalizeText = (text) => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  // filtrar ingredientes por texto de búsqueda (sin acentos)
  const filteredAvailableIngredients = availableIngredients.filter(ingredient =>
    normalizeText(ingredient.name).includes(normalizeText(ingredientSearchText))
  );

  // función para ordenar
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // ingredientes ordenados
  const sortedSupplierIngredients = useMemo(() => {
    if (!sortConfig.key) return supplierIngredients;
    
    return [...supplierIngredients].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Manejar valores nulos
      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';
      
      // Convertir a números si es necesario
      if (sortConfig.key === 'price' || sortConfig.key === 'delivery_time') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      // Convertir a string para comparación
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [supplierIngredients, sortConfig]);

  // guardar ingredientes seleccionados
  const handleSaveIngredients = async () => {
    try {
      const payload = selectedIngredients.map(ingredientId => ({
        supplier_id: editedItem.supplier_id,
        ingredient_id: ingredientId,
        price: ingredientDetails[ingredientId].price,
        delivery_time: ingredientDetails[ingredientId].deliveryTime || null,
        is_preferred_supplier: ingredientDetails[ingredientId].isPreferred
      }));

      await api.post(`/suppliers/${editedItem.supplier_id}/ingredients`, { ingredients: payload });
      notify('Ingredientes añadidos correctamente');
      
      // Recargar ingredientes del proveedor
      const { data } = await api.get(`/suppliers/${editedItem.supplier_id}/ingredients`);
      setSupplierIngredients(data);
      
      // Limpiar estado del modal
      setSelectedIngredients([]);
      setIngredientDetails({});
      setIngredientSearchText('');
      setIsAddIngredientOpen(false);
    } catch (error) {
      notify(error.response?.data?.message || 'Error al añadir ingredientes', 'error');
    }
  };

  // editar relación proveedor-ingrediente
  const openEditSupplierIngredientModal = (item) => {
    setEditingSupplierIngredient({
      ...item,
      price: item.price.toString(),
      delivery_time: item.delivery_time?.toString() || '',
      is_preferred_supplier: item.is_preferred_supplier || false
    });
    setIsEditSupplierIngredientOpen(true);
  };

  const handleEditSupplierIngredient = async () => {
    try {
      const payload = {
        price: editingSupplierIngredient.price,
        delivery_time: editingSupplierIngredient.delivery_time || null,
        is_preferred_supplier: editingSupplierIngredient.is_preferred_supplier
      };

      await api.put(`/suppliers/${editedItem.supplier_id}/ingredients/${editingSupplierIngredient.ingredient_id}`, payload);
      notify('Relación proveedor-ingrediente actualizada');
      
      // Recargar ingredientes del proveedor
      const { data } = await api.get(`/suppliers/${editedItem.supplier_id}/ingredients`);
      setSupplierIngredients(data);
      
      setIsEditSupplierIngredientOpen(false);
    } catch (error) {
      notify(error.response?.data?.message || 'Error al actualizar', 'error');
    }
  };

  // eliminar relación proveedor-ingrediente
  const openDeleteSupplierIngredientModal = (item) => {
    setCurrentSupplierIngredient(item);
    setIsDeleteSupplierIngredientOpen(true);
  };

  const handleDeleteSupplierIngredient = async () => {
    try {
      await api.delete(`/suppliers/${editedItem.supplier_id}/ingredients/${currentSupplierIngredient.ingredient_id}`);
      notify('Ingrediente eliminado del proveedor');
      
      // Recargar ingredientes del proveedor
      const { data } = await api.get(`/suppliers/${editedItem.supplier_id}/ingredients`);
      setSupplierIngredients(data);
      
      setIsDeleteSupplierIngredientOpen(false);
    } catch (error) {
      notify(error.response?.data?.message || 'Error al eliminar', 'error');
    }
  };

  // columnas
  const columns = useMemo(() => [
    { name: 'Nombre', selector: r => r.name, sortable: true, grow: 1 },
    { name: 'Teléfono', selector: r => r.phone || '-', sortable: true },
    { name: 'Email', selector: r => r.email || '-', sortable: true, grow: 1 },
    { 
      name: 'Sitio web', 
      selector: r => r.website_url || '-', 
      sortable: true,
      cell: row => row.website_url ? (
        <a href={row.website_url} target="_blank" rel="noopener noreferrer">
          {row.website_url}
        </a>
      ) : '-'
    },
    { name: 'Dirección', selector: r => r.address || '-', sortable: true, grow: 1 },
    {
      name: 'Acciones',
      cell: row => (
        <div className="actions">
          <button className="btn edit" onClick={() => openEditModal(row)}>Editar</button>
          <button className="btn delete" onClick={() => openDeleteModal(row)}>Eliminar</button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '150px'
    }
  ], []);

  // filtrado
  const filtered = useMemo(
    () => suppliers.filter(s => s.name.toLowerCase().includes(filterText.toLowerCase())),
    [suppliers, filterText]
  );

  return (
    <div className="suppliers-container">
      <h2>Lista de proveedores</h2>
      {message && <div className={`notification ${messageType}`}>{message}</div>}
      {error && <p className="error">{error}</p>}

      <div className="subheader">
        <input type="text" placeholder="Buscar proveedor..." className="search-input" value={filterText} onChange={e => setFilterText(e.target.value)} />
        <button className="btn add" onClick={() => setIsCreateOpen(true)}>+ Añadir proveedor</button>
      </div>

      <StyleSheetManager shouldForwardProp={prop => isPropValid(prop)}>
        <DataTable
          className="suppliers-table"
          columns={columns}
          data={filtered}
          progressPending={loading}
          progressComponent="Cargando..."
          noDataComponent="No hay proveedores para mostrar"
          pagination
          paginationComponentOptions={{ rowsPerPageText: 'Filas por página', rangeSeparatorText: 'de', noRowsPerPage: false, selectAllRowsItem: true, selectAllRowsItemText: 'Todos' }}
          highlightOnHover
          pointerOnHover
          selectableRows={false}
          noHeader
        />
      </StyleSheetManager>

      {/* CREATE MODAL */}
      <Modal isOpen={isCreateOpen} title="Nuevo proveedor" onClose={() => setIsCreateOpen(false)}>
        <form onSubmit={handleCreate} className="modal-body-form">
          <div className="form-fields-main">
            <label>Nombre *</label>
            <input 
              type="text" 
              className="input-field" 
              value={newItem.name} 
              onChange={e => setNewItem({ ...newItem, name: e.target.value })} 
              required 
            />

            <label>Teléfono</label>
            <input 
              type="tel" 
              className="input-field" 
              value={newItem.phone} 
              onChange={e => setNewItem({ ...newItem, phone: e.target.value })} 
            />

            <label>Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={newItem.email} 
              onChange={e => setNewItem({ ...newItem, email: e.target.value })} 
            />

            <label>Sitio web</label>
            <input 
              type="url" 
              className="input-field" 
              value={newItem.website_url} 
              onChange={e => setNewItem({ ...newItem, website_url: e.target.value })} 
              placeholder="https://ejemplo.com"
            />

            <label>Dirección</label>
            <textarea 
              className="input-field" 
              rows="3" 
              value={newItem.address} 
              onChange={e => setNewItem({ ...newItem, address: e.target.value })} 
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn cancel" onClick={() => setIsCreateOpen(false)}>Cancelar</button>
            <button type="submit" className="btn add">Guardar</button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={isEditOpen} title="Editar proveedor" onClose={() => setIsEditOpen(false)}>
        <div className="modal-with-tabs">
          {/* Pestañas */}
          <div className="modal-tabs">
            <button 
              className={`tab-button ${editModalTab === 'info' ? 'active' : ''}`}
              onClick={() => setEditModalTab('info')}
            >
              Información General
            </button>
            <button 
              className={`tab-button ${editModalTab === 'ingredients' ? 'active' : ''}`}
              onClick={() => setEditModalTab('ingredients')}
            >
              Ingredientes Suministrados
            </button>
          </div>

          {/* Contenido de las pestañas */}
          {editModalTab === 'info' ? (
            <form className="modal-body-form supplier-info-form">
              <div className="form-fields-main">
                <label>Nombre *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editedItem?.name || ''} 
                  onChange={e => setEditedItem({ ...editedItem, name: e.target.value })} 
                  required 
                />

                <label>Teléfono</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  value={editedItem?.phone || ''} 
                  onChange={e => setEditedItem({ ...editedItem, phone: e.target.value })} 
                />

                <label>Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={editedItem?.email || ''} 
                  onChange={e => setEditedItem({ ...editedItem, email: e.target.value })} 
                />

                <label>Sitio web</label>
                <input 
                  type="url" 
                  className="input-field" 
                  value={editedItem?.website_url || ''} 
                  onChange={e => setEditedItem({ ...editedItem, website_url: e.target.value })} 
                  placeholder="https://ejemplo.com"
                />

                <label>Dirección</label>
                <textarea 
                  className="input-field" 
                  rows="3" 
                  value={editedItem?.address || ''} 
                  onChange={e => setEditedItem({ ...editedItem, address: e.target.value })} 
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn cancel" onClick={() => setIsEditOpen(false)}>Cancelar</button>
                <button type="button" className="btn add" onClick={handleEdit}>Guardar</button>
              </div>
            </form>
          ) : (
            <div className="supplier-ingredients-tab">
              <p>Gestión de ingredientes para <strong>{editedItem?.name}</strong></p>
              
              <div className="supplier-ingredients-table">
                {supplierIngredients.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>
                          Ingrediente
                        </th>
                        <th>
                          Precio
                        </th>
                        <th>
                          Tiempo entrega
                        </th>
                        <th>
                          Preferido
                        </th>
                        <th style={{ width: '80px' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSupplierIngredients.map(item => (
                        <tr key={item.ingredient_id}>
                          <td>{item.name || item.ingredient_name || 'Ingrediente'}</td>
                          <td>€{item.price}</td>
                          <td>{item.delivery_time || '-'} días</td>
                          <td>{item.is_preferred_supplier ? 'Sí' : 'No'}</td>
                          <td>
                            <div className="table-actions">
                              <button 
                                className="icon-btn edit-icon" 
                                onClick={() => openEditSupplierIngredientModal(item)}
                                title="Editar"
                              >
                                <FaEdit />
                              </button>
                              <button 
                                className="icon-btn delete-icon" 
                                onClick={() => openDeleteSupplierIngredientModal(item)}
                                title="Eliminar"
                              >
                                <FaRegTrashAlt />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No hay ingredientes asignados a este proveedor</p>
                )}
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn add" onClick={() => setIsAddIngredientOpen(true)}>+ Añadir ingrediente</button>
                <button type="button" className="btn cancel" onClick={() => setIsEditOpen(false)}>Cerrar</button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal isOpen={isDeleteOpen} title="Confirmar eliminación" onClose={() => setIsDeleteOpen(false)}>
        <p>¿Seguro que deseas eliminar <strong>{currentItem?.name}</strong>?</p>
        <div className="modal-actions">
          <button className="btn delete" onClick={handleDelete}>Eliminar</button>
        </div>
      </Modal>

      {/* ADD INGREDIENT MODAL */}
      <Modal isOpen={isAddIngredientOpen} title="Añadir ingredientes al proveedor" onClose={() => setIsAddIngredientOpen(false)}>
        <div className="add-ingredient-modal">
          <p>Selecciona los ingredientes que suministra <strong>{editedItem?.name}</strong>:</p>
          
          {/* Campo de búsqueda */}
          <div className="search-ingredients">
            <input
              type="text"
              placeholder="Buscar ingredientes..."
              className="search-input"
              value={ingredientSearchText}
              onChange={(e) => setIngredientSearchText(e.target.value)}
            />
          </div>
          
          <div className="ingredients-selection">
            {filteredAvailableIngredients.length > 0 ? (
              filteredAvailableIngredients.map(ingredient => (
                <div key={ingredient.ingredient_id} className="ingredient-item">
                  <div className="ingredient-header">
                    <label className="ingredient-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedIngredients.includes(ingredient.ingredient_id)}
                        onChange={(e) => handleIngredientSelect(ingredient.ingredient_id, e.target.checked)}
                      />
                      <span className="ingredient-name">{ingredient.name}</span>
                    </label>
                  </div>
                  
                  {selectedIngredients.includes(ingredient.ingredient_id) && (
                    <div className="ingredient-details">
                      <div className="detail-field">
                        <label>Precio (€) *</label>
                        <input
                          type="number"
                          step="0.01"
                          className="input-field small"
                          value={ingredientDetails[ingredient.ingredient_id]?.price || ''}
                          onChange={(e) => handleIngredientDetailChange(ingredient.ingredient_id, 'price', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="detail-field">
                        <label>Tiempo entrega (días)</label>
                        <input
                          type="number"
                          className="input-field small"
                          value={ingredientDetails[ingredient.ingredient_id]?.deliveryTime || ''}
                          onChange={(e) => handleIngredientDetailChange(ingredient.ingredient_id, 'deliveryTime', e.target.value)}
                        />
                      </div>
                      
                      <div className="detail-field">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={ingredientDetails[ingredient.ingredient_id]?.isPreferred || false}
                            onChange={(e) => handleIngredientDetailChange(ingredient.ingredient_id, 'isPreferred', e.target.checked)}
                          />
                          Proveedor preferido
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>
                {ingredientSearchText 
                  ? `No se encontraron ingredientes que coincidan con "${ingredientSearchText}"`
                  : 'No hay ingredientes disponibles para añadir.'
                }
              </p>
            )}
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn cancel" onClick={() => setIsAddIngredientOpen(false)}>Cancelar</button>
            <button 
              type="button" 
              className="btn add" 
              onClick={handleSaveIngredients}
              disabled={selectedIngredients.length === 0}
            >
              Guardar ingredientes ({selectedIngredients.length})
            </button>
          </div>
        </div>
      </Modal>

      {/* EDIT SUPPLIER-INGREDIENT MODAL */}
      <Modal isOpen={isEditSupplierIngredientOpen} title="Editar relación proveedor-ingrediente" onClose={() => setIsEditSupplierIngredientOpen(false)}>
        <div className="edit-supplier-ingredient-modal">
          <p>Editando ingrediente: <strong>{editingSupplierIngredient?.name}</strong></p>
          
          <div className="edit-form-inline">
            <div className="form-row">
              <div className="form-field-inline">
                <label>Precio (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-field-inline"
                  value={editingSupplierIngredient?.price || ''}
                  onChange={(e) => setEditingSupplierIngredient({
                    ...editingSupplierIngredient,
                    price: e.target.value
                  })}
                  required
                />
              </div>
              
              <div className="form-field-inline">
                <label>Tiempo entrega (días)</label>
                <input
                  type="number"
                  className="input-field-inline"
                  value={editingSupplierIngredient?.delivery_time || ''}
                  onChange={(e) => setEditingSupplierIngredient({
                    ...editingSupplierIngredient,
                    delivery_time: e.target.value
                  })}
                />
              </div>
              
              <div className="form-field-inline checkbox-field">
                <label className="checkbox-label-inline">
                  <input
                    type="checkbox"
                    checked={editingSupplierIngredient?.is_preferred_supplier || false}
                    onChange={(e) => setEditingSupplierIngredient({
                      ...editingSupplierIngredient,
                      is_preferred_supplier: e.target.checked
                    })}
                  />
                  Preferido
                </label>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn cancel" onClick={() => setIsEditSupplierIngredientOpen(false)}>Cancelar</button>
            <button 
              type="button" 
              className="btn add" 
              onClick={handleEditSupplierIngredient}
              disabled={!editingSupplierIngredient?.price}
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </Modal>

      {/* DELETE SUPPLIER-INGREDIENT MODAL */}
      <Modal isOpen={isDeleteSupplierIngredientOpen} title="Confirmar eliminación" onClose={() => setIsDeleteSupplierIngredientOpen(false)}>
        <p>¿Seguro que deseas eliminar el ingrediente <strong>{currentSupplierIngredient?.name || currentSupplierIngredient?.ingredient_name}</strong> del proveedor <strong>{editedItem?.name}</strong>?</p>
        <div className="modal-actions">
          <button type="button" className="btn cancel" onClick={() => setIsDeleteSupplierIngredientOpen(false)}>Cancelar</button>
          <button className="btn delete" onClick={handleDeleteSupplierIngredient}>Eliminar</button>
        </div>
      </Modal>
    </div>
  );
}