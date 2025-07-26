// src/pages/suppliers/Suppliers.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { FaTrash } from 'react-icons/fa';
import BasePage from '../../components/BasePage';
import Modal from '../../components/modal/Modal';
import SupplierEditModal from './components/SupplierEditModal';
import AddIngredientModal from './components/AddIngredientModal';
import EditSupplierIngredientModal from './components/EditSupplierIngredientModal';
import { usePageState } from '../../hooks/usePageState';
import api from '../../api/axios';
import { parseEuropeanNumber } from '../../utils/formatters';
import './Suppliers.css';
import { FormField, FormInput, FormTextarea } from '../../components/form/FormField';

export default function Suppliers() {
  const {
    filteredData,
    loading,
    error,
    message,
    messageType,
    filterText,
    setFilterText,
    createItem,
    updateItem,
    deleteItem,
    notify,
  } = usePageState('/suppliers');

  // Additional data needed for suppliers
  const [ingredients, setIngredients] = useState([]);
  const [supplierIngredients, setSupplierIngredients] = useState([]);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  const [isEditSupplierIngredientOpen, setIsEditSupplierIngredientOpen] = useState(false);

  // Form and edit states
  const [newItem, setNewItem] = useState({
    name: '',
    phone: '',
    email: '',
    website_url: '',
    address: ''
  });
  const [editedItem, setEditedItem] = useState(null);
  const [editModalTab, setEditModalTab] = useState('info'); // 'info' o 'ingredients'
  const [editingSupplierIngredient, setEditingSupplierIngredient] = useState(null);
  const [ingredientSearchText, setIngredientSearchText] = useState('');
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

  // ---- create modal validation ----
  const [hasCreateError, setHasCreateError] = useState(false);


  // Fetch ingredients (needed for supplier-ingredient relationships)
  const fetchIngredients = async () => {
    try {
      const { data } = await api.get('/ingredients');
      setIngredients(data);
    } catch (err) {
      console.error('Error al cargar ingredientes:', err);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // No need for manual filtering - using filteredData from usePageState

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
    if (!newItem.name.trim()) {
      setHasCreateError(true);
      notify('Introduzca el nombre del proveedor', 'error');
      // Reset error after 3 seconds to match the message timeout
      setTimeout(() => setHasCreateError(false), 3000);
      return;
    }

    setHasCreateError(false);
    const success = await createItem(newItem);
    if (success) {
      setNewItem({
        name: '',
        phone: '',
        email: '',
        website_url: '',
        address: ''
      });
      handleCloseCreateModal();
    }
  };

  // Handler para cerrar modal crear proveedor correctamente
  const handleCloseCreateModal = () => {
    // Buscar todas las modales y encontrar la que está más arriba (último elemento)
    const allCloseButtons = document.querySelectorAll('.modal-close');
    if (allCloseButtons.length > 0) {
      // Tomar el último botón X (el de la modal más arriba)
      const lastCloseButton = allCloseButtons[allCloseButtons.length - 1];
      lastCloseButton.click();
    } else {
      setIsCreateOpen(false);
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
    const success = await updateItem(editedItem.supplier_id, editedItem);
    if (success) {
      setIsEditOpen(false);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditOpen(false);
  };

  // Delete handlers
  const openDeleteModal = (row) => {
    setCurrentItem(row);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    const success = await deleteItem(currentItem.supplier_id);
    if (success) {
      setIsDeleteOpen(false);
      setCurrentItem(null);
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
        price: parseEuropeanNumber(ingredientDetails[ingredientId].price),
        delivery_time: ingredientDetails[ingredientId].deliveryTime || null,
        is_preferred_supplier: ingredientDetails[ingredientId].isPreferred || false,
        package_size: parseEuropeanNumber(ingredientDetails[ingredientId].packageSize),
        package_unit: ingredientDetails[ingredientId].packageUnit,
        minimum_order_quantity: parseEuropeanNumber(ingredientDetails[ingredientId].minimumOrderQuantity)
      }));

      await api.post(`/suppliers/${editedItem.supplier_id}/ingredients`, { ingredients: payload });
      
      // Recargar ingredientes del proveedor
      const { data } = await api.get(`/suppliers/${editedItem.supplier_id}/ingredients`);
      setSupplierIngredients(data);
      
      setIsAddIngredientOpen(false);
    } catch (err) {
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
        is_preferred_supplier: editingSupplierIngredient.is_preferred_supplier,
        package_size: editingSupplierIngredient.package_size || 1,
        package_unit: editingSupplierIngredient.package_unit || 'unidad',
        minimum_order_quantity: editingSupplierIngredient.minimum_order_quantity || 1
      };
      await api.put(`/suppliers/${editedItem.supplier_id}/ingredients/${editingSupplierIngredient.ingredient_id}`, payload);
      
      // Recargar ingredientes del proveedor
      const { data } = await api.get(`/suppliers/${editedItem.supplier_id}/ingredients`);
      setSupplierIngredients(data);
      
      setIsEditSupplierIngredientOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle preferred supplier handler
  const handleTogglePreferred = async (item) => {
    try {
      const payload = {
        price: item.price,
        delivery_time: item.delivery_time || null,
        is_preferred_supplier: !item.is_preferred_supplier,
        package_size: item.package_size || 1,
        package_unit: item.package_unit || 'unidad',
        minimum_order_quantity: item.minimum_order_quantity || 1
      };
      await api.put(`/suppliers/${editedItem.supplier_id}/ingredients/${item.ingredient_id}`, payload);
      
      // Recargar ingredientes del proveedor
      const { data } = await api.get(`/suppliers/${editedItem.supplier_id}/ingredients`);
      setSupplierIngredients(data);
    } catch (err) {
      console.error('Error al cambiar proveedor preferido:', err);
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
      
      // Recargar ingredientes del proveedor
      const { data } = await api.get(`/suppliers/${editedItem.supplier_id}/ingredients`);
      setSupplierIngredients(data);
      
      setIsDeleteSupplierIngredientOpen(false);
    } catch (err) {
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
          <button className="icon-btn delete-icon" onClick={() => openDeleteModal(row)} title="Eliminar">
            <FaTrash />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '100px'
    }
  ], []);

  return (
    <>
      <BasePage
        title="Proveedores"
        subtitle="Gestiona tu red de proveedores y sus productos"
        data={filteredData}
        columns={columns}
        loading={loading}
        error={error}
        message={message}
        messageType={messageType}
        filterText={filterText}
        onFilterChange={setFilterText}
        onAdd={openCreateModal}
        addButtonText="Añadir proveedor"
        searchPlaceholder="Buscar proveedor..."
        noDataMessage="No hay proveedores registrados"
        onRowClicked={openEditModal}
        showSearch={true}
        filters={[]}
        enableMobileModal={true}
      />

        {/* CREATE MODAL */}
        <Modal isOpen={isCreateOpen} title="Crear proveedor" onClose={() => setIsCreateOpen(false)} fullscreenMobile={true}>
          <form className="modal-single-column">
            <FormField label="Nombre *">
              <div style={hasCreateError ? { outline: '2px solid #ef4444', borderRadius: '4px' } : {}}>
                <FormInput 
                  type="text" 
                  value={newItem.name} 
                  onChange={e => {
                    setNewItem({ ...newItem, name: e.target.value });
                    if (hasCreateError) setHasCreateError(false);
                  }} 
                  required 
                />
              </div>
            </FormField>
            
            <FormField label="Teléfono">
              <FormInput 
                type="text" 
                value={newItem.phone} 
                onChange={e => setNewItem({ ...newItem, phone: e.target.value })} 
              />
            </FormField>
            
            <FormField label="Email">
              <FormInput 
                type="email" 
                value={newItem.email} 
                onChange={e => setNewItem({ ...newItem, email: e.target.value })} 
              />
            </FormField>
            
            <FormField label="Sitio web">
              <FormInput 
                type="url" 
                value={newItem.website_url} 
                onChange={e => setNewItem({ ...newItem, website_url: e.target.value })} 
                placeholder="https://ejemplo.com"
              />
            </FormField>
            
            <FormField label="Dirección">
              <FormTextarea 
                rows="3" 
                value={newItem.address} 
                onChange={e => setNewItem({ ...newItem, address: e.target.value })} 
              />
            </FormField>
            <div className="modal-actions">
              <button type="button" className="btn cancel" onClick={handleCloseCreateModal}>Cancelar</button>
              <button type="button" className="btn add" onClick={handleCreate}>Crear proveedor</button>
            </div>
          </form>
        </Modal>

        {/* EDIT MODAL */}
        <SupplierEditModal
          isOpen={isEditOpen}
          onClose={handleCloseEditModal}
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
          onTogglePreferred={handleTogglePreferred}
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
    </>
  );
}