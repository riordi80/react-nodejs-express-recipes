// src/pages/ingredients/Ingredients.jsx
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { FaBan, FaUndo, FaUser, FaLeaf, FaTruck } from 'react-icons/fa';
import BasePage from '../../components/BasePage';
import Modal from '../../components/modal/Modal';
import TabsModal from '../../components/tabs-modal/TabsModal';
// usePageState removed - now using custom state management
import api from '../../api/axios';
import { formatCurrency, formatDecimal, parseEuropeanNumber, formatPrice, formatDecimalPrice } from '../../utils/formatters';
import { FormField, FormInput, FormTextarea, FormSelect } from '../../components/form/FormField';
import './Ingredients.css';

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
    comment: '',
    calories_per_100g: '',
    protein_per_100g: '',
    carbs_per_100g: '',
    fat_per_100g: ''
  });
  const [newWastePercent, setNewWastePercent] = useState('');
  const [newSelectedAllergens, setNewSelectedAllergens] = useState([]);

  const [editedItem, setEditedItem] = useState(null);
  const [editedWastePercent, setEditedWastePercent] = useState('');
  const [editedSelectedAllergens, setEditedSelectedAllergens] = useState([]);
  const [editModalTab, setEditModalTab] = useState('info'); // 'info', 'nutrition' o 'suppliers'  
  const [createModalTab, setCreateModalTab] = useState('info'); // 'info', 'nutrition' o 'suppliers' para modal de crear
  
  // Estados para gestión de proveedores
  const [ingredientSuppliers, setIngredientSuppliers] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [loadingSuppliersData, setLoadingSuppliersData] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreateDropdownOpen, setIsCreateDropdownOpen] = useState(false);
  const [supplierFilterText, setSupplierFilterText] = useState('');
  const [editingSuppliers, setEditingSuppliers] = useState({}); // Para almacenar los datos editables de cada proveedor
  const [expandedSuppliers, setExpandedSuppliers] = useState({}); // Para controlar qué proveedores están expandidos
  const dropdownRef = useRef(null);
  const createDropdownRef = useRef(null);

  // Definir las pestañas con iconos
  const tabs = [
    { id: 'info', label: 'Información General', icon: FaUser },
    { id: 'nutrition', label: 'Información Nutricional', icon: FaLeaf },
    { id: 'suppliers', label: 'Proveedores', icon: FaTruck }
  ];

  // Efecto para cerrar los dropdowns cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target)) {
        setIsCreateDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTabChange = (tabId) => {
    setEditModalTab(tabId);
    setIsDropdownOpen(false);
  };

  const handleEditTabChange = (tabId) => {
    setEditModalTab(tabId);
  };

  const handleCreateTabChange = (tabId) => {
    setCreateModalTab(tabId);
    setIsCreateDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleCreateDropdown = () => {
    setIsCreateDropdownOpen(!isCreateDropdownOpen);
  };

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

  // Filter suppliers by search text
  const filteredSuppliers = useMemo(() => {
    if (!supplierFilterText) return allSuppliers;
    return allSuppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(supplierFilterText.toLowerCase())
    );
  }, [allSuppliers, supplierFilterText]);

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

  // Load suppliers data
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const { data } = await api.get('/suppliers');
        setAllSuppliers(data);
      } catch (error) {
        console.error('Error loading suppliers:', error);
      }
    };
    fetchSuppliers();
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
        // Convertir valores de formato europeo a americano para el backend  
        base_price: parseEuropeanNumber(newItem.base_price),
        // net_price se calcula automáticamente por el trigger de MySQL
        stock: parseEuropeanNumber(newItem.stock),
        stock_minimum: parseEuropeanNumber(newItem.stock_minimum),
        calories_per_100g: parseEuropeanNumber(newItem.calories_per_100g),
        protein_per_100g: parseEuropeanNumber(newItem.protein_per_100g),
        carbs_per_100g: parseEuropeanNumber(newItem.carbs_per_100g),
        fat_per_100g: parseEuropeanNumber(newItem.fat_per_100g),
        waste_percent: parseEuropeanNumber(newWastePercent) / 100,
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
      season: Array.isArray(row.season) ? row.season : (row.season ? row.season.split(',').map(s => s.trim()) : []),
      // Formatear campos numéricos con coma decimal
      base_price: row.base_price ? formatDecimalPrice(row.base_price) : '',
      net_price: row.net_price ? formatDecimal(row.net_price, 2) : '',
      stock: row.stock ? formatDecimal(row.stock, 2) : '',
      stock_minimum: row.stock_minimum ? formatDecimal(row.stock_minimum, 2) : '',
      calories_per_100g: row.calories_per_100g ? formatDecimal(row.calories_per_100g, 1) : '',
      protein_per_100g: row.protein_per_100g ? formatDecimal(row.protein_per_100g, 1) : '',
      carbs_per_100g: row.carbs_per_100g ? formatDecimal(row.carbs_per_100g, 1) : '',
      fat_per_100g: row.fat_per_100g ? formatDecimal(row.fat_per_100g, 1) : ''
    });
    setEditedWastePercent(formatDecimal(row.waste_percent * 100, 2));
    
    // Cargar alérgenos del ingrediente
    try {
      const { data } = await api.get(`/ingredients/${row.ingredient_id}/allergens`);
      setEditedSelectedAllergens(data.map(a => a.allergen_id));
    } catch (error) {
      console.error('Error cargando alérgenos:', error);
      setEditedSelectedAllergens([]);
    }

    // Cargar proveedores del ingrediente
    try {
      const { data } = await api.get(`/ingredients/${row.ingredient_id}/suppliers`);
      setIngredientSuppliers(data);
      
      // Inicializar datos editables para cada proveedor
      const editableData = {};
      data.forEach(supplier => {
        editableData[supplier.supplier_id] = {
          price: supplier.price ? formatDecimalPrice(supplier.price) : '',
          delivery_time: supplier.delivery_time || '',
          package_size: supplier.package_size ? formatDecimalPrice(supplier.package_size) : '1',
          package_unit: supplier.package_unit || 'unidad',
          minimum_order_quantity: supplier.minimum_order_quantity ? formatDecimalPrice(supplier.minimum_order_quantity) : '1',
          is_preferred_supplier: supplier.is_preferred_supplier || false
        };
      });
      setEditingSuppliers(editableData);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
      setIngredientSuppliers([]);
      setEditingSuppliers({});
    }
    
    setIsEditOpen(true);
  };


  // Funciones para gestionar proveedores del ingrediente
  const addSupplierToIngredient = async (supplierId) => {
    if (!editedItem) return;
    
    setLoadingSuppliersData(true);
    try {
      await api.post(`/ingredients/${editedItem.ingredient_id}/suppliers`, {
        supplier_id: supplierId,
        price: 0,
        delivery_time: null,
        is_preferred_supplier: false,
        package_size: 1,
        package_unit: 'unidad',
        minimum_order_quantity: 1
      });
      
      // Recargar proveedores del ingrediente
      const { data } = await api.get(`/ingredients/${editedItem.ingredient_id}/suppliers`);
      setIngredientSuppliers(data);
      
      // Inicializar datos editables para el nuevo proveedor
      const newSupplier = data.find(s => s.supplier_id === supplierId);
      if (newSupplier) {
        setEditingSuppliers(prev => ({
          ...prev,
          [supplierId]: {
            price: newSupplier.price ? formatDecimalPrice(newSupplier.price) : '',
            delivery_time: newSupplier.delivery_time || '',
            package_size: newSupplier.package_size ? formatDecimalPrice(newSupplier.package_size) : '1',
            package_unit: newSupplier.package_unit || 'unidad',
            minimum_order_quantity: newSupplier.minimum_order_quantity ? formatDecimalPrice(newSupplier.minimum_order_quantity) : '1',
            is_preferred_supplier: newSupplier.is_preferred_supplier || false
          }
        }));
      }
      
      notify('Proveedor añadido correctamente', 'success');
    } catch (error) {
      console.error('Error añadiendo proveedor:', error);
      notify(error.response?.data?.message || 'Error al añadir proveedor', 'error');
    } finally {
      setLoadingSuppliersData(false);
    }
  };

  const removeSupplierFromIngredient = async (supplierId) => {
    if (!editedItem) return;
    
    setLoadingSuppliersData(true);
    try {
      await api.delete(`/ingredients/${editedItem.ingredient_id}/suppliers/${supplierId}`);
      
      // Recargar proveedores del ingrediente
      const { data } = await api.get(`/ingredients/${editedItem.ingredient_id}/suppliers`);
      setIngredientSuppliers(data);
      
      // Limpiar datos editables del proveedor eliminado
      setEditingSuppliers(prev => {
        const newState = { ...prev };
        delete newState[supplierId];
        return newState;
      });
      
      notify('Proveedor eliminado correctamente', 'success');
    } catch (error) {
      console.error('Error eliminando proveedor:', error);
      notify(error.response?.data?.message || 'Error al eliminar proveedor', 'error');
    } finally {
      setLoadingSuppliersData(false);
    }
  };

  const updateSupplierPreference = async (supplierId, isPreferred) => {
    if (!editedItem) return;
    
    setLoadingSuppliersData(true);
    try {
      await api.put(`/ingredients/${editedItem.ingredient_id}/suppliers/${supplierId}`, {
        is_preferred_supplier: isPreferred
      });
      
      // Recargar proveedores del ingrediente
      const { data } = await api.get(`/ingredients/${editedItem.ingredient_id}/suppliers`);
      setIngredientSuppliers(data);
      notify('Preferencia de proveedor actualizada', 'success');
    } catch (error) {
      console.error('Error actualizando preferencia:', error);
      notify(error.response?.data?.message || 'Error al actualizar preferencia', 'error');
    } finally {
      setLoadingSuppliersData(false);
    }
  };

  // Función para actualizar los datos completos del proveedor
  const updateSupplierData = async (supplierId) => {
    if (!editedItem || !editingSuppliers[supplierId]) return;
    
    setLoadingSuppliersData(true);
    try {
      const supplierData = editingSuppliers[supplierId];
      await api.put(`/ingredients/${editedItem.ingredient_id}/suppliers/${supplierId}`, {
        price: parseEuropeanNumber(supplierData.price) || 0,
        delivery_time: supplierData.delivery_time ? parseInt(supplierData.delivery_time) : null,
        package_size: parseEuropeanNumber(supplierData.package_size) || 1,
        package_unit: supplierData.package_unit || 'unidad',
        minimum_order_quantity: parseEuropeanNumber(supplierData.minimum_order_quantity) || 1,
        is_preferred_supplier: supplierData.is_preferred_supplier
      });
      
      // Recargar proveedores del ingrediente
      const { data } = await api.get(`/ingredients/${editedItem.ingredient_id}/suppliers`);
      setIngredientSuppliers(data);
      
      // Actualizar datos editables
      const editableData = { ...editingSuppliers };
      data.forEach(supplier => {
        if (supplier.supplier_id === supplierId) {
          editableData[supplier.supplier_id] = {
            price: supplier.price ? formatDecimalPrice(supplier.price) : '',
            delivery_time: supplier.delivery_time || '',
            package_size: supplier.package_size ? formatDecimalPrice(supplier.package_size) : '1',
            package_unit: supplier.package_unit || 'unidad',
            minimum_order_quantity: supplier.minimum_order_quantity ? formatDecimalPrice(supplier.minimum_order_quantity) : '1',
            is_preferred_supplier: supplier.is_preferred_supplier || false
          };
        }
      });
      setEditingSuppliers(editableData);
      
      notify('Datos del proveedor actualizados correctamente', 'success');
    } catch (error) {
      console.error('Error actualizando datos del proveedor:', error);
      notify(error.response?.data?.message || 'Error al actualizar datos del proveedor', 'error');
    } finally {
      setLoadingSuppliersData(false);
    }
  };

  // Función para actualizar un campo específico del proveedor en el estado local
  const updateSupplierField = (supplierId, field, value) => {
    setEditingSuppliers(prev => ({
      ...prev,
      [supplierId]: {
        ...prev[supplierId],
        [field]: value
      }
    }));
  };

  // Función para alternar la expansión de un proveedor
  const toggleSupplierExpansion = (supplierId) => {
    setExpandedSuppliers(prev => ({
      ...prev,
      [supplierId]: !prev[supplierId]
    }));
  };

  const handleEdit = async () => {
    try {
      const { net_price, ...itemWithoutNetPrice } = editedItem;
      const payload = {
        ...itemWithoutNetPrice,
        // Convertir valores de formato europeo a americano para el backend
        base_price: parseEuropeanNumber(editedItem.base_price),
        // net_price se excluye porque se calcula automáticamente por el trigger de MySQL
        stock: parseEuropeanNumber(editedItem.stock),
        stock_minimum: parseEuropeanNumber(editedItem.stock_minimum),
        calories_per_100g: parseEuropeanNumber(editedItem.calories_per_100g),
        protein_per_100g: parseEuropeanNumber(editedItem.protein_per_100g),
        carbs_per_100g: parseEuropeanNumber(editedItem.carbs_per_100g),
        fat_per_100g: parseEuropeanNumber(editedItem.fat_per_100g),
        waste_percent: parseEuropeanNumber(editedWastePercent) / 100,
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
      setSupplierFilterText(''); // Limpiar filtro de proveedores
      setEditingSuppliers({}); // Limpiar datos editables de proveedores
      setExpandedSuppliers({}); // Limpiar estado de expansión
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
        data={filteredData}
        columns={columns}
        loading={loading}
        error={error}
        message={message}
        messageType={messageType}
        filterText={filterText}
        onFilterChange={setFilterText}
        showSearch={true}
        onAdd={() => setIsCreateOpen(true)}
        onRowClicked={openEditModal}
        addButtonText="Añadir ingrediente"
        searchPlaceholder="Buscar ingrediente..."
        noDataMessage="No hay ingredientes para mostrar"
        filters={pageFilters}
        enableMobileModal={true}
      />

      {/* CREATE MODAL */}
      <Modal isOpen={isCreateOpen} title="Nuevo ingrediente" onClose={() => setIsCreateOpen(false)} fullscreenMobile={true}>
        <div className="ingredient-edit-modal">
          <TabsModal
            tabs={tabs}
            activeTab={createModalTab}
            onTabChange={handleCreateTabChange}
            mobileDropdownRef={createDropdownRef}
          >
            {createModalTab === 'info' ? (
              <form onSubmit={handleCreate} className="modal-body-form ingredient-info-form">
                <div className="form-fields-two-columns">
                  <div className="column-left">
                    <FormField label="Nombre">
                      <FormInput 
                        type="text" 
                        value={newItem.name} 
                        onChange={e => setNewItem({ ...newItem, name: e.target.value })} 
                        required 
                      />
                    </FormField>

                    <FormField label="Unidad">
                      <FormSelect value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })}>
                        {['gr','kg','ml','l','unit','tbsp','tsp'].map(v => <option key={v} value={v}>{v}</option>)}
                      </FormSelect>
                    </FormField>

                    <FormField label="Precio base">
                      <FormInput 
                        type="text" 
                        value={newItem.base_price} 
                        onChange={e => {
                          const value = e.target.value;
                          if (/^[\d.,]*$/.test(value)) {
                            setNewItem({ ...newItem, base_price: value });
                          }
                        }} 
                        required 
                      />
                    </FormField>

                    <FormField label="Merma (%)">
                      <FormInput 
                        type="text" 
                        value={newWastePercent} 
                        onChange={e => {
                          const value = e.target.value;
                          if (/^[\d.,]*$/.test(value)) {
                            setNewWastePercent(value);
                          }
                        }} 
                        placeholder="Ej: 5,43" 
                      />
                    </FormField>

                    <FormField label="">
                      <label style={{display: 'flex', alignItems: 'center', gap: '8px', margin: '0px 0px 16px 0px'}}>
                        <input type="checkbox" checked={newItem.is_available} onChange={e => setNewItem({ ...newItem, is_available: e.target.checked })} />
                        Disponible
                      </label>
                    </FormField>
                  </div>

                  <div className="column-right">
                    <FormField label="Precio neto (calculado automáticamente)">
                      <div style={{
                        display: 'block',
                        margin: '0px 0px 16px 0px',
                        padding: '8px 12px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        color: '#64748b',
                        fontSize: '14px',
                        fontStyle: 'italic'
                      }}>
                        {(() => {
                          const basePrice = parseEuropeanNumber(newItem.base_price) || 0;
                          const wastePercent = parseEuropeanNumber(newWastePercent) || 0;
                          const netPrice = basePrice * (1 + wastePercent / 100);
                          return netPrice > 0 ? formatCurrency(netPrice) : 'Se calcula al introducir precio base';
                        })()}
                      </div>
                    </FormField>

                    <FormField label="Stock inicial">
                      <FormInput 
                        type="text" 
                        value={newItem.stock} 
                        onChange={e => {
                          const value = e.target.value;
                          if (/^[\d.,]*$/.test(value)) {
                            setNewItem({ ...newItem, stock: value });
                          }
                        }} 
                      />
                    </FormField>

                    <FormField label="Stock mínimo">
                      <FormInput 
                        type="text" 
                        value={newItem.stock_minimum} 
                        onChange={e => {
                          const value = e.target.value;
                          if (/^[\d.,]*$/.test(value)) {
                            setNewItem({ ...newItem, stock_minimum: value });
                          }
                        }} 
                        placeholder="Cantidad mínima para alerta" 
                      />
                    </FormField>

                    <FormField label="Fecha de caducidad">
                      <FormInput 
                        type="date" 
                        value={newItem.expiration_date} 
                        onChange={e => setNewItem({ ...newItem, expiration_date: e.target.value })} 
                      />
                    </FormField>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn cancel" onClick={() => setIsCreateOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn add">Guardar</button>
                </div>
              </form>
            ) : createModalTab === 'nutrition' ? (
              <form onSubmit={handleCreate} className="modal-body-form ingredient-nutrition-form">
                <div className="form-fields-two-columns">
                  <div className="column-left">
                    {/* Información Nutricional por 100g */}
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                        Información Nutricional (por 100g)
                      </h4>
                      
                      <FormField label="Calorías (kcal)">
                        <FormInput 
                          type="text" 
                          value={newItem?.calories_per_100g || ''} 
                          onChange={e => {
                            const value = e.target.value;
                            if (/^[\d.,]*$/.test(value)) {
                              setNewItem({ ...newItem, calories_per_100g: value });
                            }
                          }} 
                          placeholder="Ej: 52,5"
                        />
                      </FormField>
                      
                      <FormField label="Proteínas (g)">
                        <FormInput 
                          type="text" 
                          value={newItem?.protein_per_100g || ''} 
                          onChange={e => {
                            const value = e.target.value;
                            if (/^[\d.,]*$/.test(value)) {
                              setNewItem({ ...newItem, protein_per_100g: value });
                            }
                          }} 
                          placeholder="Ej: 1,2"
                        />
                      </FormField>
                      
                      <FormField label="Carbohidratos (g)">
                        <FormInput 
                          type="text" 
                          value={newItem?.carbs_per_100g || ''} 
                          onChange={e => {
                            const value = e.target.value;
                            if (/^[\d.,]*$/.test(value)) {
                              setNewItem({ ...newItem, carbs_per_100g: value });
                            }
                          }} 
                          placeholder="Ej: 10,2"
                        />
                      </FormField>
                      
                      <FormField label="Grasas (g)">
                        <FormInput 
                          type="text" 
                          value={newItem?.fat_per_100g || ''} 
                          onChange={e => {
                            const value = e.target.value;
                            if (/^[\d.,]*$/.test(value)) {
                              setNewItem({ ...newItem, fat_per_100g: value });
                            }
                          }} 
                          placeholder="Ej: 0,3"
                        />
                      </FormField>

                      <FormField label="Comentario">
                        <FormTextarea 
                          rows="4" 
                          value={newItem.comment} 
                          onChange={e => setNewItem({ ...newItem, comment: e.target.value })} 
                        />
                      </FormField>
                    </div>
                  </div>

                  <div className="column-right">
                    {/* Título equivalente para alinear con la columna izquierda */}
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                        Información Adicional
                      </h4>
                      
                      <label style={{
                        display: 'block',
                        margin: '0px 0px 6px 0px',
                        padding: 0,
                        fontWeight: 500,
                        color: '#374151',
                        fontSize: '14px'
                      }}>Temporada</label>
                      <div className="seasons-chips" style={{ marginBottom: '20px' }}>
                        {availableSeasons.map(season => (
                          <span
                            key={season.value}
                            className={`season-chip ${newItem?.season?.includes(season.value) ? 'selected' : ''}`}
                            onClick={() => toggleSeason(season.value, true)}
                          >
                            {season.label}
                          </span>
                        ))}
                      </div>

                      <label style={{
                        display: 'block',
                        margin: '0px 0px 6px 0px',
                        padding: 0,
                        fontWeight: 500,
                        color: '#374151',
                        fontSize: '14px'
                      }}>Alérgenos</label>
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
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn cancel" onClick={() => setIsCreateOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn add">Guardar</button>
                </div>
              </form>
            ) : createModalTab === 'suppliers' ? (
              <div className="modal-body-form ingredient-suppliers-form">
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                    Proveedores (disponible después de crear)
                  </h4>
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#64748b',
                    backgroundColor: '#f8fafc',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px'
                  }}>
                    <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                      Los proveedores se podrán asignar después de crear el ingrediente
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
                      Guarda el ingrediente y luego edítalo para gestionar proveedores
                    </p>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn cancel" onClick={() => setIsCreateOpen(false)}>Cancelar</button>
                  <button type="submit" className="btn add">Guardar</button>
                </div>
              </div>
            ) : null}
          </TabsModal>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={isEditOpen} title="Editar ingrediente" onClose={() => { setIsEditOpen(false); setSupplierFilterText(''); setEditingSuppliers({}); setExpandedSuppliers({}); }} fullscreenMobile={true}>
        <div className="ingredient-edit-modal">
          <TabsModal
            tabs={tabs}
            activeTab={editModalTab}
            onTabChange={handleEditTabChange}
            mobileDropdownRef={dropdownRef}
          >
            {editModalTab === 'info' ? (
              <form className="modal-body-form ingredient-info-form">
                <div className="form-fields-two-columns">
                  <div className="column-left">
                    <FormField label="Nombre">
                      <FormInput 
                        type="text" 
                        value={editedItem?.name || ''} 
                        onChange={e => setEditedItem({ ...editedItem, name: e.target.value })} 
                      />
                    </FormField>

                    <FormField label="Unidad">
                      <FormSelect value={editedItem?.unit || ''} onChange={e => setEditedItem({ ...editedItem, unit: e.target.value })}>
                        {['gr','kg','ml','l','unit','tbsp','tsp'].map(v => <option key={v} value={v}>{v}</option>)}
                      </FormSelect>
                    </FormField>

                    <FormField label="Precio base">
                      <FormInput 
                        type="text" 
                        value={editedItem?.base_price || ''} 
                        onChange={e => {
                          const value = e.target.value;
                          // Permitir solo números, comas y puntos
                          if (/^[\d.,]*$/.test(value)) {
                            setEditedItem({ ...editedItem, base_price: value });
                          }
                        }} 
                      />
                    </FormField>

                    <FormField label="Merma (%)">
                      <FormInput 
                        type="text" 
                        value={editedWastePercent} 
                        onChange={e => {
                          const value = e.target.value;
                          if (/^[\d.,]*$/.test(value)) {
                            setEditedWastePercent(value);
                          }
                        }} 
                        placeholder="Ej: 5,43" 
                      />
                    </FormField>

                    <FormField label="">
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        <input 
                          type="checkbox" 
                          checked={editedItem?.is_available || false} 
                          onChange={e => setEditedItem({ ...editedItem, is_available: e.target.checked })} 
                          style={{ margin: 0 }}
                        /> 
                        Disponible
                      </label>
                    </FormField>
                  </div>

                  <div className="column-right">
                    <FormField label="Precio neto (calculado automáticamente)">
                      <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        color: '#64748b',
                        fontSize: '14px',
                        fontStyle: 'italic',
                        margin: '0px 0px 16px 0px'
                      }}>
                        {(() => {
                          const basePrice = parseEuropeanNumber(editedItem?.base_price || '') || 0;
                          const wastePercent = parseEuropeanNumber(editedWastePercent) || 0;
                          const netPrice = basePrice * (1 + wastePercent / 100);
                          return netPrice > 0 ? formatCurrency(netPrice) : 'Se calcula al introducir precio base';
                        })()}
                      </div>
                    </FormField>

                    <FormField label="Stock">
                      <FormInput 
                        type="text" 
                        value={editedItem?.stock || ''} 
                        onChange={e => {
                          const value = e.target.value;
                          if (/^[\d.,]*$/.test(value)) {
                            setEditedItem({ ...editedItem, stock: value });
                          }
                        }} 
                      />
                    </FormField>

                    <FormField label="Stock mínimo">
                      <FormInput 
                        type="text" 
                        value={editedItem?.stock_minimum || ''} 
                        onChange={e => {
                          const value = e.target.value;
                          if (/^[\d.,]*$/.test(value)) {
                            setEditedItem({ ...editedItem, stock_minimum: value });
                          }
                        }} 
                        placeholder="Cantidad mínima para alerta" 
                      />
                    </FormField>

                    <FormField label="Fecha de caducidad">
                      <FormInput 
                        type="date" 
                        value={editedItem?.expiration_date || ''} 
                        onChange={e => setEditedItem({ ...editedItem, expiration_date: e.target.value })} 
                      />
                    </FormField>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn cancel" onClick={() => setIsEditOpen(false)}>Cancelar</button>
                  <button type="button" className="btn edit" onClick={handleEdit}>Guardar</button>
                </div>
              </form>
            ) : editModalTab === 'nutrition' ? (
              <form className="modal-body-form ingredient-nutrition-form">
                <div className="form-fields-two-columns">
                  <div className="column-left">
                    {/* Información Nutricional por 100g */}
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                        Información Nutricional (por 100g)
                      </h4>
                      
                      <FormField label="Calorías (kcal)">
                        <FormInput 
                          type="text" 
                          value={editedItem?.calories_per_100g || ''} 
                          onChange={e => {
                            const value = e.target.value;
                            if (/^[\d.,]*$/.test(value)) {
                              setEditedItem({ ...editedItem, calories_per_100g: value });
                            }
                          }} 
                          placeholder="Ej: 52,5"
                        />
                      </FormField>
                      
                      <FormField label="Proteínas (g)">
                        <FormInput 
                          type="text" 
                          value={editedItem?.protein_per_100g || ''} 
                          onChange={e => {
                            const value = e.target.value;
                            if (/^[\d.,]*$/.test(value)) {
                              setEditedItem({ ...editedItem, protein_per_100g: value });
                            }
                          }} 
                          placeholder="Ej: 1,2"
                        />
                      </FormField>
                      
                      <FormField label="Carbohidratos (g)">
                        <FormInput 
                          type="text" 
                          value={editedItem?.carbs_per_100g || ''} 
                          onChange={e => {
                            const value = e.target.value;
                            if (/^[\d.,]*$/.test(value)) {
                              setEditedItem({ ...editedItem, carbs_per_100g: value });
                            }
                          }} 
                          placeholder="Ej: 10,2"
                        />
                      </FormField>
                      
                      <FormField label="Grasas (g)">
                        <FormInput 
                          type="text" 
                          value={editedItem?.fat_per_100g || ''} 
                          onChange={e => {
                            const value = e.target.value;
                            if (/^[\d.,]*$/.test(value)) {
                              setEditedItem({ ...editedItem, fat_per_100g: value });
                            }
                          }} 
                          placeholder="Ej: 0,3"
                        />
                      </FormField>

                      <FormField label="Comentario">
                        <FormTextarea 
                          rows="4" 
                          value={editedItem?.comment || ''} 
                          onChange={e => setEditedItem({ ...editedItem, comment: e.target.value })} 
                        />
                      </FormField>
                    </div>
                  </div>

                  <div className="column-right">
                    {/* Título equivalente para alinear con la columna izquierda */}
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                        Información Adicional
                      </h4>
                      
                      <FormField label="Temporada">
                        <div style={{ margin: 0 }}>
                          <div className="seasons-chips" style={{ marginBottom: '4px' }}>
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
                        </div>
                      </FormField>

                      <FormField label="Alérgenos">
                        <div style={{ margin: 0 }}>
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
                      </FormField>
                    </div>
                  </div>
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn cancel" onClick={() => setIsEditOpen(false)}>Cancelar</button>
                  <button type="button" className="btn edit" onClick={handleEdit}>Guardar</button>
                </div>
              </form>
            ) : editModalTab === 'suppliers' ? (
              <div className="modal-body-form ingredient-suppliers-form">
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>
                    Proveedores del Ingrediente
                  </h4>
                  
                  {loadingSuppliersData ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                      Cargando...
                    </div>
                  ) : (
                    <>
                      {ingredientSuppliers.length > 0 ? (
                        <div className="suppliers-list">
                          {ingredientSuppliers.map(supplier => {
                            const supplierData = editingSuppliers[supplier.supplier_id] || {};
                            const isExpanded = expandedSuppliers[supplier.supplier_id];
                            return (
                              <div key={supplier.supplier_id} className={`supplier-item ${supplier.is_preferred_supplier ? 'preferred' : ''}`}>
                                {/* Header con nombre, resumen e información básica */}
                                <div className="supplier-header" onClick={() => toggleSupplierExpansion(supplier.supplier_id)}>
                                  <div className="supplier-info">
                                    <div className="supplier-name">
                                      {supplier.supplier_name}
                                      {supplier.is_preferred_supplier && (
                                        <span className="preferred-badge">PREFERIDO</span>
                                      )}
                                    </div>
                                    <div className="supplier-summary">
                                      {supplier.price ? `Precio: ${formatCurrency(supplier.price)}` : 'Sin precio configurado'} 
                                      {supplier.delivery_time && ` • Entrega: ${supplier.delivery_time} días`}
                                      {supplier.package_size && ` • Paquete: ${formatDecimalPrice(supplier.package_size)} ${supplier.package_unit}`}
                                    </div>
                                  </div>
                                  <div className="supplier-actions" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      className={`supplier-preferred-btn ${supplier.is_preferred_supplier ? 'active' : ''}`}
                                      onClick={() => updateSupplierPreference(supplier.supplier_id, !supplier.is_preferred_supplier)}
                                      disabled={loadingSuppliersData}
                                    >
                                      {supplier.is_preferred_supplier ? '★ Preferido' : 'Hacer preferido'}
                                    </button>
                                    <button
                                      type="button"
                                      className="supplier-remove-btn"
                                      onClick={() => removeSupplierFromIngredient(supplier.supplier_id)}
                                      disabled={loadingSuppliersData}
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>

                                {/* Contenido expandible con campos editables */}
                                <div className={`supplier-expanded-content ${!isExpanded ? 'collapsed' : ''}`}>
                                  <div className="supplier-fields">
                                    <div className="supplier-field">
                                      <label>Precio (€)</label>
                                      <input
                                        type="text"
                                        value={supplierData.price || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (/^[\d.,]*$/.test(value)) {
                                            updateSupplierField(supplier.supplier_id, 'price', value);
                                          }
                                        }}
                                        placeholder="0,00"
                                        disabled={loadingSuppliersData}
                                      />
                                    </div>
                                    
                                    <div className="supplier-field">
                                      <label>Entrega (días)</label>
                                      <input
                                        type="number"
                                        value={supplierData.delivery_time || ''}
                                        onChange={(e) => updateSupplierField(supplier.supplier_id, 'delivery_time', e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        disabled={loadingSuppliersData}
                                      />
                                    </div>

                                    <div className="supplier-field">
                                      <label>Tamaño del paquete</label>
                                      <input
                                        type="text"
                                        value={supplierData.package_size || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (/^[\d.,]*$/.test(value)) {
                                            updateSupplierField(supplier.supplier_id, 'package_size', value);
                                          }
                                        }}
                                        placeholder="1,00"
                                        disabled={loadingSuppliersData}
                                      />
                                    </div>

                                    <div className="supplier-field">
                                      <label>Unidad del paquete</label>
                                      <select
                                        value={supplierData.package_unit || 'unidad'}
                                        onChange={(e) => updateSupplierField(supplier.supplier_id, 'package_unit', e.target.value)}
                                        disabled={loadingSuppliersData}
                                      >
                                        <option value="unidad">Unidad</option>
                                        <option value="caja">Caja</option>
                                        <option value="saco">Saco</option>
                                        <option value="botella">Botella</option>
                                        <option value="lata">Lata</option>
                                        <option value="paquete">Paquete</option>
                                        <option value="bolsa">Bolsa</option>
                                        <option value="bote">Bote</option>
                                        <option value="envase">Envase</option>
                                        <option value="kg">Kilogramo</option>
                                        <option value="litro">Litro</option>
                                      </select>
                                    </div>

                                    <div className="supplier-field">
                                      <label>Cantidad mínima de pedido</label>
                                      <input
                                        type="text"
                                        value={supplierData.minimum_order_quantity || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          if (/^[\d.,]*$/.test(value)) {
                                            updateSupplierField(supplier.supplier_id, 'minimum_order_quantity', value);
                                          }
                                        }}
                                        placeholder="1,00"
                                        disabled={loadingSuppliersData}
                                      />
                                    </div>
                                  </div>

                                  {/* Botón de guardar */}
                                  <div style={{ textAlign: 'right', marginTop: '16px' }}>
                                    <button
                                      type="button"
                                      className="supplier-save-btn"
                                      onClick={() => updateSupplierData(supplier.supplier_id)}
                                      disabled={loadingSuppliersData}
                                    >
                                      {loadingSuppliersData ? 'Guardando...' : 'Guardar cambios'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '40px 20px',
                          color: '#64748b',
                          backgroundColor: '#f8fafc',
                          border: '2px dashed #cbd5e1',
                          borderRadius: '8px',
                          marginBottom: '24px'
                        }}>
                          <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                            Este ingrediente no tiene proveedores asignados
                          </p>
                          <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>
                            Añade proveedores usando el selector de abajo
                          </p>
                        </div>
                      )}
                      
                      <div className="add-suppliers-section">
                        <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
                          Añadir Proveedor
                        </h5>
                        
                        {/* Input de filtro */}
                        <FormField label="Buscar proveedor">
                          <FormInput
                            type="text"
                            placeholder="Escribe para filtrar proveedores..."
                            value={supplierFilterText}
                            onChange={(e) => setSupplierFilterText(e.target.value)}
                          />
                        </FormField>
                        
                        <div className="add-suppliers-grid">
                          {filteredSuppliers
                            .filter(supplier => !ingredientSuppliers.some(is => is.supplier_id === supplier.supplier_id))
                            .map(supplier => (
                              <button
                                key={supplier.supplier_id}
                                type="button"
                                onClick={() => addSupplierToIngredient(supplier.supplier_id)}
                                style={{
                                  fontSize: '12px',
                                  padding: '6px 12px',
                                  border: '1px solid #3b82f6',
                                  borderRadius: '6px',
                                  backgroundColor: '#eff6ff',
                                  color: '#3b82f6',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.backgroundColor = '#3b82f6';
                                  e.target.style.color = 'white';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.backgroundColor = '#eff6ff';
                                  e.target.style.color = '#3b82f6';
                                }}
                              >
                                + {supplier.name}
                              </button>
                            ))}
                        </div>
                        {filteredSuppliers.filter(supplier => !ingredientSuppliers.some(is => is.supplier_id === supplier.supplier_id)).length === 0 && (
                          <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: '8px 0 0 0' }}>
                            {supplierFilterText 
                              ? `No se encontraron proveedores que coincidan con "${supplierFilterText}"`
                              : 'Todos los proveedores disponibles ya están asignados'
                            }
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="modal-actions">
                  <button type="button" className="btn cancel" onClick={() => { setIsEditOpen(false); setSupplierFilterText(''); setEditingSuppliers({}); setExpandedSuppliers({}); }}>Cancelar</button>
                  <button type="button" className="btn edit" onClick={handleEdit}>Guardar</button>
                </div>
              </div>
            ) : null}
          </TabsModal>
        </div>
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
