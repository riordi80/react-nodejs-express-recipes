import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FaUser, FaLeaf, FaTruck, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Modal from '../modal/Modal';
import TabsModal from '../tabs-modal/TabsModal';
import { FormField, FormInput, FormTextarea, FormSelect } from '../form/FormField';
import { formatCurrency, formatDecimal, parseEuropeanNumber, formatDecimalPrice } from '../../utils/formatters';
import api from '../../api/axios';
import './EditIngredientModal.css';

export default function EditIngredientModal({
  isOpen,
  onClose,
  ingredient,
  onSave,
  onIngredientUpdated,
  mode = 'edit' // 'edit' | 'create'
}) {
  const [editedItem, setEditedItem] = useState(null);
  const [editedWastePercent, setEditedWastePercent] = useState('');
  const [editedSelectedAllergens, setEditedSelectedAllergens] = useState([]);
  const [activeTab, setActiveTab] = useState('info');
  const [allergens, setAllergens] = useState([]);
  const [ingredientSuppliers, setIngredientSuppliers] = useState([]);
  const [editingSuppliers, setEditingSuppliers] = useState({});
  const [expandedSuppliers, setExpandedSuppliers] = useState({});
  const [loadingSuppliersData, setLoadingSuppliersData] = useState(false);
  const [allSuppliers, setAllSuppliers] = useState([]); // Lista completa de proveedores
  const [supplierFilterText, setSupplierFilterText] = useState(''); // Filtro para proveedores
  const dropdownRef = useRef(null);

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

  // Tabs dinámicas según el modo
  const tabs = mode === 'create' ? [
    { id: 'info', label: 'Información General', icon: FaUser },
    { id: 'nutrition', label: 'Información Nutricional', icon: FaLeaf }
  ] : [
    { id: 'info', label: 'Información General', icon: FaUser },
    { id: 'nutrition', label: 'Nutrición', icon: FaLeaf },
    { id: 'suppliers', label: 'Proveedores', icon: FaTruck }
  ];

  // Filter suppliers by search text
  const filteredSuppliers = useMemo(() => {
    if (!supplierFilterText) return allSuppliers;
    return allSuppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(supplierFilterText.toLowerCase())
    );
  }, [allSuppliers, supplierFilterText]);

  const loadAllergens = useCallback(async () => {
    try {
      const { data } = await api.get('/allergens');
      setAllergens(data);
    } catch (err) {
      console.error('Error al cargar alérgenos:', err);
    }
  }, []);

  const loadAllSuppliers = useCallback(async () => {
    try {
      const { data } = await api.get('/suppliers');
      setAllSuppliers(data);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    }
  }, []);

  const loadIngredientSuppliers = useCallback(async (showLoading = true) => {
    if (!ingredient?.ingredient_id) return;
    
    if (showLoading) {
      setLoadingSuppliersData(true);
    }
    
    try {
      const { data } = await api.get(`/ingredients/${ingredient.ingredient_id}/suppliers`);
      setIngredientSuppliers(data);
      
      // Inicializar editingSuppliers con los datos actuales
      const initialEditingSuppliers = {};
      data.forEach(supplier => {
        initialEditingSuppliers[supplier.supplier_id] = {
          price: supplier.price ? formatDecimal(supplier.price, 4) : '',
          delivery_time: supplier.delivery_time || '',
          package_size: supplier.package_size ? formatDecimal(supplier.package_size, 4) : '',
          package_unit: supplier.package_unit || 'unidad',
          minimum_order_quantity: supplier.minimum_order_quantity ? formatDecimal(supplier.minimum_order_quantity, 2) : ''
        };
      });
      setEditingSuppliers(initialEditingSuppliers);
    } catch (err) {
      console.error('Error al cargar proveedores del ingrediente:', err);
      setIngredientSuppliers([]);
    } finally {
      if (showLoading) {
        setLoadingSuppliersData(false);
      }
    }
  }, [ingredient?.ingredient_id]);

  useEffect(() => {
    if (mode === 'create') {
      // Inicializar para modo creación
      setEditedItem({
        name: '',
        unit: 'unit',
        base_price: '',
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
      setEditedWastePercent('');
      setEditedSelectedAllergens([]);
      loadAllergens();
    } else if (ingredient) {
      // Convertir fecha ISO a formato YYYY-MM-DD para input type="date"
      let formattedDate = '';
      if (ingredient.expiration_date) {
        if (ingredient.expiration_date.includes('T')) {
          // Formato ISO: extraer solo la parte de fecha
          formattedDate = ingredient.expiration_date.split('T')[0];
        } else {
          // Ya está en formato YYYY-MM-DD
          formattedDate = ingredient.expiration_date;
        }
      }

      // Convertir season a array para manejo consistente de chips
      let formattedSeason = [];
      if (ingredient.season) {
        if (Array.isArray(ingredient.season)) {
          formattedSeason = ingredient.season;
        } else if (typeof ingredient.season === 'string') {
          // Si es string separado por comas, dividir
          if (ingredient.season.includes(',')) {
            formattedSeason = ingredient.season.split(',').map(s => s.trim()).filter(s => s);
          } else {
            // Si es un solo valor, crear array con ese valor
            formattedSeason = [ingredient.season];
          }
        }
      }

      // Modo edición
      setEditedItem({ 
        ...ingredient,
        base_price: ingredient.base_price ? formatDecimalPrice(ingredient.base_price) : '',
        stock: ingredient.stock ? formatDecimal(ingredient.stock, 2) : '',
        stock_minimum: ingredient.stock_minimum ? formatDecimal(ingredient.stock_minimum, 2) : '',
        expiration_date: formattedDate,
        season: formattedSeason,
        calories_per_100g: ingredient.calories_per_100g ? formatDecimal(ingredient.calories_per_100g, 2) : '',
        protein_per_100g: ingredient.protein_per_100g ? formatDecimal(ingredient.protein_per_100g, 2) : '',
        carbs_per_100g: ingredient.carbs_per_100g ? formatDecimal(ingredient.carbs_per_100g, 2) : '',
        fat_per_100g: ingredient.fat_per_100g ? formatDecimal(ingredient.fat_per_100g, 2) : ''
      });
      setEditedWastePercent(ingredient.waste_percent ? formatDecimal(ingredient.waste_percent * 100, 2) : '');
      setEditedSelectedAllergens(ingredient.allergens || []);
      loadAllergens();
      if (activeTab === 'suppliers') {
        loadIngredientSuppliers();
        loadAllSuppliers();
      }
    }
  }, [ingredient, mode, activeTab, loadAllergens, loadIngredientSuppliers, loadAllSuppliers]);

  const handleSave = async () => {
    if (!editedItem) return;

    const processedItem = {
      ...editedItem,
      base_price: parseEuropeanNumber(editedItem.base_price) || 0,
      stock: parseEuropeanNumber(editedItem.stock) || 0,
      stock_minimum: parseEuropeanNumber(editedItem.stock_minimum) || 0,
      calories_per_100g: parseEuropeanNumber(editedItem.calories_per_100g) || 0,
      protein_per_100g: parseEuropeanNumber(editedItem.protein_per_100g) || 0,
      carbs_per_100g: parseEuropeanNumber(editedItem.carbs_per_100g) || 0,
      fat_per_100g: parseEuropeanNumber(editedItem.fat_per_100g) || 0,
      waste_percent: parseEuropeanNumber(editedWastePercent) / 100 || 0,
      allergens: editedSelectedAllergens,
      season: Array.isArray(editedItem.season) ? editedItem.season : (editedItem.season ? [editedItem.season] : [])
    };

    const success = await onSave(processedItem, editedSelectedAllergens);
    if (success && onIngredientUpdated) {
      onIngredientUpdated(processedItem);
    }
  };

  const handleClose = () => {
    setEditingSuppliers({});
    setExpandedSuppliers({});
    setSupplierFilterText('');
    setActiveTab('info');
    onClose();
  };

  const toggleSeason = (season) => {
    if (!editedItem) return;
    const currentSeason = editedItem.season || [];
    const newSeason = currentSeason.includes(season)
      ? currentSeason.filter(s => s !== season)
      : [...currentSeason, season];
    setEditedItem({ ...editedItem, season: newSeason });
  };

  const toggleAllergen = (allergenId) => {
    const newAllergens = editedSelectedAllergens.includes(allergenId)
      ? editedSelectedAllergens.filter(id => id !== allergenId)
      : [...editedSelectedAllergens, allergenId];
    setEditedSelectedAllergens(newAllergens);
  };

  const updateSupplierField = (supplierId, field, value) => {
    setEditingSuppliers(prev => ({
      ...prev,
      [supplierId]: {
        ...prev[supplierId],
        [field]: value
      }
    }));
  };

  const toggleSupplierExpansion = (supplierId) => {
    setExpandedSuppliers(prev => {
      const isCurrentlyExpanded = prev[supplierId];
      if (isCurrentlyExpanded) {
        // Si está expandido, colapsarlo
        return {
          ...prev,
          [supplierId]: false
        };
      } else {
        // Si no está expandido, colapsar todos los demás y expandir este
        const newState = {};
        Object.keys(prev).forEach(id => {
          newState[id] = false;
        });
        newState[supplierId] = true;
        return newState;
      }
    });
  };

  const updateSupplierPreference = async (supplierId, isPreferred) => {
    if (!ingredient?.ingredient_id) return;
    
    try {
      await api.put(`/ingredients/${ingredient.ingredient_id}/suppliers/${supplierId}`, {
        is_preferred_supplier: isPreferred
      });
      
      // Recargar datos sin mostrar loading
      await loadIngredientSuppliers(false);
      
      // Notificar al componente padre que hubo cambios
      if (onIngredientUpdated) {
        onIngredientUpdated({ ...ingredient, supplier_updated: true });
      }
    } catch (err) {
      console.error('Error al actualizar proveedor preferido:', err);
    }
  };

  const removeSupplierFromIngredient = async (supplierId) => {
    if (!ingredient?.ingredient_id) return;
    
    try {
      await api.delete(`/ingredients/${ingredient.ingredient_id}/suppliers/${supplierId}`);
      await loadIngredientSuppliers(false);
      
      // Notificar al componente padre que hubo cambios
      if (onIngredientUpdated) {
        onIngredientUpdated({ ...ingredient, supplier_updated: true });
      }
    } catch (err) {
      console.error('Error al eliminar proveedor del ingrediente:', err);
    }
  };

  const addSupplierToIngredient = async (supplierId) => {
    if (!ingredient?.ingredient_id) return;
    
    setLoadingSuppliersData(true);
    try {
      await api.post(`/ingredients/${ingredient.ingredient_id}/suppliers`, {
        supplier_id: supplierId,
        price: 0,
        delivery_time: null,
        package_size: 1.0,
        package_unit: 'unidad',
        minimum_order_quantity: 1.0,
        is_preferred_supplier: false
      });
      
      await loadIngredientSuppliers(false);
      
      // Expandir automáticamente el proveedor recién añadido para que el usuario configure los datos
      setExpandedSuppliers(prev => ({
        ...prev,
        [supplierId]: true
      }));
      
      // Notificar al componente padre que hubo cambios
      if (onIngredientUpdated) {
        onIngredientUpdated({ ...ingredient, supplier_updated: true });
      }
    } catch (error) {
      console.error('Error añadiendo proveedor:', error);
    } finally {
      setLoadingSuppliersData(false);
    }
  };

  if (!editedItem) return null;

  return (
    <Modal isOpen={isOpen} title={mode === 'create' ? 'Nuevo ingrediente' : 'Editar ingrediente'} onClose={handleClose} fullscreenMobile={true}>
      <div className="ingredient-edit-modal">
        <TabsModal
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          mobileDropdownRef={dropdownRef}
        >
          {activeTab === 'info' ? (
            <form className="modal-body-form ingredient-info-form">
              <div className="form-fields-two-columns">
                <div className="column-left">
                  <FormField label="Nombre" labelClassName="required-label">
                    <FormInput 
                      type="text" 
                      value={editedItem?.name || ''} 
                      onChange={e => setEditedItem({ ...editedItem, name: e.target.value })} 
                    />
                  </FormField>

                  <FormField label="Unidad" labelClassName="required-label">
                    <FormSelect value={editedItem?.unit || ''} onChange={e => setEditedItem({ ...editedItem, unit: e.target.value })}>
                      {['gr','kg','ml','l','unit'].map(v => <option key={v} value={v}>{v}</option>)}
                    </FormSelect>
                  </FormField>

                  <FormField label="Precio base" labelClassName="required-label">
                    <FormInput 
                      type="text" 
                      value={editedItem?.base_price || ''} 
                      onChange={e => {
                        const value = e.target.value;
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
                <button type="button" className="btn cancel" onClick={handleClose}>Cancelar</button>
                <button type="button" className="btn edit" onClick={handleSave}>
                  {mode === 'create' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </form>
          ) : activeTab === 'nutrition' ? (
            <form className="modal-body-form ingredient-nutrition-form">
              <div className="form-fields-two-columns">
                <div className="column-left">
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
                              onClick={() => toggleSeason(season.value)}
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
                              onClick={() => toggleAllergen(allergen.allergen_id)}
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
                <button type="button" className="btn cancel" onClick={handleClose}>Cancelar</button>
                <button type="button" className="btn edit" onClick={handleSave}>
                  {mode === 'create' ? 'Crear' : 'Guardar'}
                </button>
              </div>
            </form>
          ) : activeTab === 'suppliers' && mode === 'edit' ? (
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
                            <div key={supplier.supplier_id} className={`supplier-item ${isExpanded ? 'expanded' : ''} ${supplier.is_preferred_supplier ? 'preferred' : ''}`}>
                              <div className="supplier-header" onClick={() => toggleSupplierExpansion(supplier.supplier_id)}>
                                <div className="supplier-expand-icon">
                                  {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                                </div>
                                <div className="supplier-info">
                                  <div className="supplier-name">
                                    {supplier.supplier_name}
                                    {supplier.is_preferred_supplier === 1 && (
                                      <span className="preferred-badge">PREFERIDO</span>
                                    )}
                                  </div>
                                  <div className="supplier-summary">
                                    {supplier.price ? `Precio: ${formatDecimal(supplier.price, 4)}€` : 'Sin precio configurado'} 
                                    {supplier.delivery_time && ` • Entrega: ${supplier.delivery_time} días`}
                                    {supplier.package_size && ` • Paquete: ${formatDecimal(supplier.package_size, 4)} ${supplier.package_unit}`}
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
                                      placeholder="0,0000"
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
                                      placeholder="1,0000"
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

                                  <div className="supplier-field supplier-actions-field">
                                    <button
                                      type="button"
                                      className="btn edit supplier-save-btn"
                                      onClick={async () => {
                                        try {
                                          const payload = {
                                            price: parseEuropeanNumber(supplierData.price) || 0,
                                            delivery_time: supplierData.delivery_time || null,
                                            package_size: parseEuropeanNumber(supplierData.package_size) || 1,
                                            package_unit: supplierData.package_unit || 'unidad',
                                            minimum_order_quantity: parseEuropeanNumber(supplierData.minimum_order_quantity) || 1,
                                            is_preferred_supplier: supplier.is_preferred_supplier
                                          };
                                          
                                          await api.put(`/ingredients/${ingredient.ingredient_id}/suppliers/${supplier.supplier_id}`, payload);
                                          // Recargar sin mostrar loading para evitar el efecto visual
                                          await loadIngredientSuppliers(false);
                                          
                                          // Notificar al componente padre que hubo cambios
                                          if (onIngredientUpdated) {
                                            onIngredientUpdated({ ...ingredient, supplier_updated: true });
                                          }
                                        } catch (err) {
                                          console.error('Error al guardar datos del proveedor:', err);
                                        }
                                      }}
                                      disabled={loadingSuppliersData}
                                    >
                                      Guardar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        <p>Este ingrediente no tiene proveedores asignados.</p>
                      </div>
                    )}
                  </>
                )}
                
                {/* Sección para añadir proveedores */}
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
                          disabled={loadingSuppliersData}
                          style={{
                            fontSize: '12px',
                            padding: '6px 12px',
                            border: '1px solid #3b82f6',
                            borderRadius: '6px',
                            backgroundColor: '#eff6ff',
                            color: '#3b82f6',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            opacity: loadingSuppliersData ? 0.5 : 1
                          }}
                          onMouseOver={(e) => {
                            if (!loadingSuppliersData) {
                              e.target.style.backgroundColor = '#3b82f6';
                              e.target.style.color = 'white';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!loadingSuppliersData) {
                              e.target.style.backgroundColor = '#eff6ff';
                              e.target.style.color = '#3b82f6';
                            }
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
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn cancel" onClick={handleClose}>Cerrar</button>
              </div>
            </div>
          ) : null}
        </TabsModal>
      </div>
    </Modal>
  );
}