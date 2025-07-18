// src/pages/suppliers/Suppliers.jsx
import React, { useEffect, useState, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import { FaEdit, FaTrash } from 'react-icons/fa';
import api from '../../api/axios';
import Modal from '../../components/modal/Modal';
import SupplierEditModal from './components/SupplierEditModal';
import AddIngredientModal from './components/AddIngredientModal';
import EditSupplierIngredientModal from './components/EditSupplierIngredientModal';
import './Suppliers.css';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [supplierIngredients, setSupplierIngredients] = useState([]);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');

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

  // ---- add ingredient modal details ----
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [ingredientDetails, setIngredientDetails] = useState({});

  const notify = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/suppliers');
      setSuppliers(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar proveedores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch ingredients
  const fetchIngredients = async () => {
    try {
      const { data } = await api.get('/ingredients');
      setIngredients(data);
    } catch (err) {
      console.error('Error al cargar ingredientes:', err);
    }
  };

  const reload = fetchSuppliers;

  useEffect(() => {
    fetchSuppliers();
    fetchIngredients();
  }, []);

  // Filtros
  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(filterText.toLowerCase()) ||
    (supplier.email && supplier.email.toLowerCase().includes(filterText.toLowerCase())) ||
    (supplier.phone && supplier.phone.includes(filterText))
  );

  // Available ingredients (not assigned to current supplier)
  const availableIngredients = useMemo(() => {
    if (!editedItem || !supplierIngredients) return ingredients;
    const assignedIds = supplierIngredients.map(si => si.ingredient_id);
    return ingredients.filter(ing => !assignedIds.includes(ing.ingredient_id));
  }, [ingredients, supplierIngredients, editedItem]);

  // ---- HANDLERS ----

  // Create
  const openCreateModal = () => {
    setNewItem({
      name: '',
      phone: '',
      email: '',
      website_url: '',
      address: ''
    });
    setIsCreateOpen(true);
  };

  const handleCreate = async () => {
    try {
      await api.post('/suppliers', newItem);
      notify('Proveedor creado');
      setIsCreateOpen(false);
      reload();
    } catch (err) {
      notify('Error al crear proveedor');
      console.error(err);
    }
  };

  // Edit
  const openEditModal = async row => {
    setEditedItem({ ...row });
    setEditModalTab('info');
    try {
      const { data } = await api.get(`/suppliers/${row.supplier_id}/ingredients`);
      setSupplierIngredients(data);
    } catch (err) {
      console.error('Error al cargar ingredientes del proveedor:', err);
      setSupplierIngredients([]);
    }
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    try {
      await api.put(`/suppliers/${editedItem.supplier_id}`, editedItem);
      notify('Proveedor actualizado');
      setIsEditOpen(false);
      reload();
    } catch (err) {
      notify('Error al actualizar proveedor');
      console.error(err);
    }
  };

  // Delete
  const openDeleteModal = row => {
    setCurrentItem(row);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/suppliers/${currentItem.supplier_id}`);
      notify('Proveedor eliminado');
      setIsDeleteOpen(false);
      reload();
    } catch (err) {
      notify('Error al eliminar proveedor');
      console.error(err);
    }
  };

  // Add ingredients handlers
  const openAddIngredientModal = () => {
    setSelectedIngredients([]);
    setIngredientDetails({});
    setIngredientSearchText('');
    setIsAddIngredientOpen(true);
  };

  const handleAddIngredients = async () => {
    try {
      const payload = selectedIngredients.map(ingredientId => ({
        supplier_id: editedItem.supplier_id,
        ingredient_id: ingredientId,
        price: ingredientDetails[ingredientId].price,
        delivery_time: ingredientDetails[ingredientId].deliveryTime || null,
        is_preferred_supplier: false
      }));

      await api.post(`/suppliers/${editedItem.supplier_id}/ingredients`, { ingredients: payload });
      notify('Ingredientes añadidos correctamente');
      
      // Recargar ingredientes del proveedor
      const { data } = await api.get(`/suppliers/${editedItem.supplier_id}/ingredients`);
      setSupplierIngredients(data);
      
      setIsAddIngredientOpen(false);
    } catch (err) {
      notify('Error al añadir ingredientes');
      console.error(err);
    }
  };

  // Edit supplier-ingredient handlers
  const openEditSupplierIngredientModal = (item) => {
    setEditingSupplierIngredient({
      ...item,
      name: item.name || item.ingredient_name
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
    } catch (err) {
      notify('Error al actualizar relación');
      console.error(err);
    }
  };

  // Delete supplier-ingredient handlers
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
    } catch (err) {
      notify('Error al eliminar ingrediente del proveedor');
      console.error(err);
    }
  };

  // DataTable columns
  const columns = useMemo(() => [
    {
      name: 'Nombre',
      selector: row => row.name,
      sortable: true,
      grow: 1
    },
    {
      name: 'Teléfono',
      selector: row => row.phone || '-',
      grow: 1
    },
    {
      name: 'Email',
      selector: row => row.email || '-',
      grow: 1
    },
    {
      name: 'Sitio web',
      selector: row => row.website_url || '-',
      cell: row => row.website_url ? (
        <a href={row.website_url} target="_blank" rel="noopener noreferrer">
          {row.website_url.length > 30 ? row.website_url.substring(0, 30) + '...' : row.website_url}
        </a>
      ) : '-',
      grow: 1
    },
    {
      name: 'Dirección',
      selector: row => row.address || '-',
      cell: row => row.address ? (
        row.address.length > 50 ? row.address.substring(0, 50) + '...' : row.address
      ) : '-',
      grow: 1
    },
    {
      name: 'Acciones',
      cell: row => (
        <div className="table-actions">
          <button className="icon-btn edit-icon" onClick={() => openEditModal(row)} title="Editar">
            <FaEdit />
          </button>
          <button className="icon-btn delete-icon" onClick={() => openDeleteModal(row)} title="Eliminar">
            <FaTrash />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '150px'
    }
  ], []);

  return (
    <div className="suppliers-container">
      <div className="suppliers-content">
        <h2>Lista de proveedores</h2>
        {error && <div className="error">{error}</div>}
        
        {message && (
          <div className={`notification ${messageType}`}>
            {message}
          </div>
        )}

        <div className="subheader">
        <input
          type="text"
          placeholder="Buscar proveedor..."
          className="search-input"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
        />
        <button className="btn add" onClick={openCreateModal}>+ Añadir proveedor</button>
      </div>

      <StyleSheetManager shouldForwardProp={isPropValid}>
        <DataTable
          className="suppliers-table"
          columns={columns}
          data={filteredSuppliers}
          progressPending={loading}
          progressComponent="Cargando..."
          noDataComponent="No hay proveedores registrados"
          pagination
          paginationComponentOptions={{ 
            rowsPerPageText: 'Filas por página', 
            rangeSeparatorText: 'de', 
            noRowsPerPage: false, 
            selectAllRowsItem: true, 
            selectAllRowsItemText: 'Todos' 
          }}
          highlightOnHover
          pointerOnHover
          selectableRows={false}
          noHeader
        />
      </StyleSheetManager>

        {/* CREATE MODAL */}
        <Modal isOpen={isCreateOpen} title="Crear proveedor" onClose={() => setIsCreateOpen(false)}>
          <form className="modal-single-column">
            <div className="form-row">
              <label>Nombre *</label>
              <input 
                type="text" 
                className="input-field" 
                value={newItem.name} 
                onChange={e => setNewItem({ ...newItem, name: e.target.value })} 
                required 
              />
            </div>
            <div className="form-row">
              <label>Teléfono</label>
              <input 
                type="text" 
                className="input-field" 
                value={newItem.phone} 
                onChange={e => setNewItem({ ...newItem, phone: e.target.value })} 
              />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input 
                type="email" 
                className="input-field" 
                value={newItem.email} 
                onChange={e => setNewItem({ ...newItem, email: e.target.value })} 
              />
            </div>
            <div className="form-row">
              <label>Sitio web</label>
              <input 
                type="url" 
                className="input-field" 
                value={newItem.website_url} 
                onChange={e => setNewItem({ ...newItem, website_url: e.target.value })} 
                placeholder="https://ejemplo.com"
              />
            </div>
            <div className="form-row">
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
              <button type="button" className="btn add" onClick={handleCreate}>Crear proveedor</button>
            </div>
          </form>
        </Modal>

        {/* EDIT MODAL */}
        <SupplierEditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          editedItem={editedItem}
          setEditedItem={setEditedItem}
          editModalTab={editModalTab}
          setEditModalTab={setEditModalTab}
          supplierIngredients={supplierIngredients}
          sortConfig={sortConfig}
          onSave={handleEdit}
          onAddIngredients={openAddIngredientModal}
          onEditIngredient={openEditSupplierIngredientModal}
          onDeleteIngredient={openDeleteSupplierIngredientModal}
        />

        {/* DELETE MODAL */}
        <Modal isOpen={isDeleteOpen} title="Confirmar eliminación" onClose={() => setIsDeleteOpen(false)}>
          <p>¿Seguro que deseas eliminar <strong>{currentItem?.name}</strong>?</p>
          <div className="modal-actions">
            <button type="button" className="btn cancel" onClick={() => setIsDeleteOpen(false)}>Cancelar</button>
            <button type="button" className="btn delete" onClick={handleDelete}>Eliminar</button>
          </div>
        </Modal>

        {/* ADD INGREDIENT MODAL */}
        <AddIngredientModal
          isOpen={isAddIngredientOpen}
          onClose={() => setIsAddIngredientOpen(false)}
          supplierName={editedItem?.name}
          ingredientSearchText={ingredientSearchText}
          setIngredientSearchText={setIngredientSearchText}
          availableIngredients={availableIngredients}
          selectedIngredients={selectedIngredients}
          setSelectedIngredients={setSelectedIngredients}
          ingredientDetails={ingredientDetails}
          setIngredientDetails={setIngredientDetails}
          onSave={handleAddIngredients}
        />

        {/* EDIT SUPPLIER INGREDIENT MODAL */}
        <EditSupplierIngredientModal
          isOpen={isEditSupplierIngredientOpen}
          onClose={() => setIsEditSupplierIngredientOpen(false)}
          editingSupplierIngredient={editingSupplierIngredient}
          setEditingSupplierIngredient={setEditingSupplierIngredient}
          onSave={handleEditSupplierIngredient}
        />

        {/* DELETE SUPPLIER INGREDIENT MODAL */}
        <Modal isOpen={isDeleteSupplierIngredientOpen} title="Confirmar eliminación" onClose={() => setIsDeleteSupplierIngredientOpen(false)}>
          <p>¿Seguro que deseas eliminar el ingrediente <strong>{currentSupplierIngredient?.name || currentSupplierIngredient?.ingredient_name}</strong> del proveedor <strong>{editedItem?.name}</strong>?</p>
          <div className="modal-actions">
            <button type="button" className="btn cancel" onClick={() => setIsDeleteSupplierIngredientOpen(false)}>Cancelar</button>
            <button type="button" className="btn delete" onClick={handleDeleteSupplierIngredient}>Eliminar</button>
          </div>
        </Modal>
      </div>
    </div>
  );
}