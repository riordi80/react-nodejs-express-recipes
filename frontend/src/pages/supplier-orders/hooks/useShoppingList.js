// src/pages/supplier-orders/hooks/useShoppingList.js
import { useState, useEffect } from 'react';
import api from '../../../api/axios';

export const useShoppingList = () => {
  // Estados para Lista de Compras
  const [shoppingList, setShoppingList] = useState(null);
  const [shoppingListLoading, setShoppingListLoading] = useState(false);
  const [filters, setFilters] = useState({
    includeStock: true,
    includeConfirmed: true,
    includePlanned: false,
    days: 30
  });
  
  // Estados para selección de eventos
  const [availableEvents, setAvailableEvents] = useState([]);
  const [selectedEventIds, setSelectedEventIds] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [showEventSelection, setShowEventSelection] = useState(false);

  // Estados para pedidos manuales
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [manualOrderItems, setManualOrderItems] = useState([]);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);

  // Estados para generación de pedidos
  const [isGeneratingOrders, setIsGeneratingOrders] = useState(false);
  const [showGenerateOrderModal, setShowGenerateOrderModal] = useState(false);
  const [orderGenerationData, setOrderGenerationData] = useState(null);

  // Estados para modal de advertencia de proveedores
  const [showSupplierWarningModal, setShowSupplierWarningModal] = useState(false);
  const [ingredientsWithoutProvider, setIngredientsWithoutProvider] = useState([]);

  const loadAvailableEvents = async () => {
    try {
      setEventsLoading(true);
      const queryParams = new URLSearchParams({
        days: (filters.days * 2).toString() // Cargar más eventos para selección
      });
      
      const response = await api.get(`/supplier-orders/available-events?${queryParams}`);
      setAvailableEvents(response.data);
      setEventsLoading(false);
    } catch (error) {
      console.error('Error loading available events:', error);
      setEventsLoading(false);
    }
  };

  const loadShoppingList = async () => {
    try {
      setShoppingListLoading(true);
      
      // Si estamos en modo de selección específica pero no hay eventos seleccionados, no cargar
      if (showEventSelection && selectedEventIds.length === 0) {
        setShoppingList(null);
        setShoppingListLoading(false);
        return;
      }
      
      const queryParams = new URLSearchParams({
        includeStock: filters.includeStock.toString(),
        includeConfirmed: filters.includeConfirmed.toString(),
        includePlanned: filters.includePlanned.toString(),
        days: filters.days.toString()
      });

      // Si hay eventos específicos seleccionados, añadirlos
      if (showEventSelection && selectedEventIds.length > 0) {
        queryParams.set('eventIds', selectedEventIds.join(','));
      }

      const response = await api.get(`/supplier-orders/shopping-list?${queryParams}`);
      setShoppingList(response.data);
      setShoppingListLoading(false);
    } catch (error) {
      console.error('Error loading shopping list:', error);
      setShoppingListLoading(false);
    }
  };

  const loadAvailableIngredients = async () => {
    try {
      setIngredientsLoading(true);
      const response = await api.get('/ingredients');
      const ingredients = response.data.filter(ing => ing.is_available);
      
      // Cargar información de proveedores para cada ingrediente
      const ingredientsWithSuppliers = await Promise.all(
        ingredients.map(async (ingredient) => {
          try {
            const supplierResponse = await api.get(`/ingredients/${ingredient.ingredient_id}/suppliers`);
            const preferredSupplier = supplierResponse.data.find(s => s.is_preferred_supplier);
            return {
              ...ingredient,
              preferredSupplier: preferredSupplier || null
            };
          } catch (error) {
            return { ...ingredient, preferredSupplier: null };
          }
        })
      );
      
      setAvailableIngredients(ingredientsWithSuppliers);
      setIngredientsLoading(false);
    } catch (error) {
      console.error('Error loading ingredients:', error);
      setIngredientsLoading(false);
    }
  };

  const handleEventSelection = (eventId, isSelected) => {
    if (isSelected) {
      setSelectedEventIds(prev => [...prev, eventId]);
    } else {
      setSelectedEventIds(prev => prev.filter(id => id !== eventId));
    }
  };

  const handleSelectAllEvents = () => {
    if (selectedEventIds.length === availableEvents.length) {
      setSelectedEventIds([]);
    } else {
      setSelectedEventIds(availableEvents.map(event => event.event_id));
    }
  };

  const toggleEventSelectionMode = () => {
    setShowEventSelection(!showEventSelection);
    if (!showEventSelection) {
      setSelectedEventIds([]);
    }
    setShoppingList(null); // Limpiar lista anterior cuando cambiamos modo
  };

  const toggleManualOrderMode = () => {
    const newShowManualOrder = !showManualOrder;
    setShowManualOrder(newShowManualOrder);
    
    if (newShowManualOrder) {
      loadAvailableIngredients();
      setShowEventSelection(false);
      setSelectedEventIds([]);
      setShoppingList(null); // Limpiar lista anterior
    } else {
      setManualOrderItems([]);
      setShoppingList(null); // Limpiar lista manual
    }
  };

  const addManualOrderItem = () => {
    const newItem = {
      id: Date.now(),
      ingredientId: '',
      quantity: '',
      notes: ''
    };
    setManualOrderItems([...manualOrderItems, newItem]);
  };

  const updateManualOrderItem = (id, field, value) => {
    setManualOrderItems(items => 
      items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeManualOrderItem = (id) => {
    setManualOrderItems(items => items.filter(item => item.id !== id));
  };

  const generateManualShoppingList = () => {
    const validItems = manualOrderItems.filter(item => 
      item.ingredientId && item.quantity
    );

    if (validItems.length === 0) {
      return;
    }

    // Convertir items manuales a formato similar a shopping list
    const manualSupplierGroups = {};
    
    validItems.forEach(item => {
      const ingredient = availableIngredients.find(ing => 
        ing.ingredient_id === parseInt(item.ingredientId)
      );
      
      if (!ingredient) return;

      const quantity = parseFloat(item.quantity.replace(',', '.'));
      const totalCost = quantity * ingredient.base_price;

      // Agrupar por "Pedido Manual"
      if (!manualSupplierGroups[999]) {
        manualSupplierGroups[999] = {
          supplierId: 999,
          supplierName: 'Pedido Manual',
          ingredients: [],
          supplierTotal: 0
        };
      }

      const ingredientData = {
        ingredientId: ingredient.ingredient_id,
        name: ingredient.name,
        needed: quantity,
        inStock: ingredient.stock || 0,
        toBuy: quantity,
        unit: ingredient.unit,
        pricePerUnit: ingredient.base_price,
        totalCost: totalCost,
        packageSize: 1,
        packageUnit: 'unidad',
        minimumOrderQuantity: 1,
        supplierPrice: ingredient.base_price,
        packagesToBuy: 0,
        realQuantity: 0,
        realTotalCost: totalCost,
        notes: item.notes
      };

      manualSupplierGroups[999].ingredients.push(ingredientData);
      manualSupplierGroups[999].supplierTotal += totalCost;
    });

    const totalCost = Object.values(manualSupplierGroups)
      .reduce((sum, group) => sum + group.supplierTotal, 0);

    const manualShoppingList = {
      totalEvents: 0,
      dateRange: { from: null, to: null },
      ingredientsBySupplier: Object.values(manualSupplierGroups),
      totalCost: totalCost,
      filters: { manual: true },
      generatedAt: new Date().toISOString()
    };

    setShoppingList(manualShoppingList);
  };

  const handleModeChange = (mode) => {
    switch (mode) {
      case 'automatic':
        if (showEventSelection) toggleEventSelectionMode();
        if (showManualOrder) toggleManualOrderMode();
        setShoppingList(null);
        break;
      case 'events':
        if (!showEventSelection) toggleEventSelectionMode();
        if (showManualOrder) toggleManualOrderMode();
        setShoppingList(null);
        break;
      case 'manual':
        if (!showManualOrder) toggleManualOrderMode();
        if (showEventSelection) toggleEventSelectionMode();
        setShoppingList(null);
        break;
    }
  };

  // Función para preparar datos para generar pedidos
  const handleGenerateOrders = () => {
    if (!shoppingList || !shoppingList.ingredientsBySupplier || shoppingList.ingredientsBySupplier.length === 0) {
      return;
    }

    // Verificar si hay ingredientes sin proveedor asignado
    const suppliersWithoutProvider = shoppingList.ingredientsBySupplier.filter(
      supplier => supplier.supplierId === 999 || supplier.supplierName === 'Sin Proveedor Asignado'
    );

    if (suppliersWithoutProvider.length > 0) {
      // Mostrar modal de advertencia con los ingredientes sin proveedor
      setIngredientsWithoutProvider(suppliersWithoutProvider);
      setShowSupplierWarningModal(true);
      return;
    }

    // Solo generar pedidos para proveedores reales (filtrar los de ID 999)
    const realSuppliers = shoppingList.ingredientsBySupplier.filter(
      supplier => supplier.supplierId !== 999 && supplier.supplierName !== 'Sin Proveedor Asignado'
    );

    if (realSuppliers.length === 0) {
      alert('❌ No hay ingredientes con proveedores asignados para generar pedidos.');
      return;
    }

    setOrderGenerationData({
      suppliers: realSuppliers,
      totalCost: realSuppliers.reduce((total, supplier) => total + supplier.supplierTotal, 0),
      generatedFrom: shoppingList.filters?.manual ? 'manual' : 
                    (showEventSelection ? 'events' : 'shopping-list')
    });
    setShowGenerateOrderModal(true);
  };

  // Función para confirmar generación de pedidos
  const confirmGenerateOrders = async (deliveryDate, notes) => {
    if (!orderGenerationData) return;

    try {
      setIsGeneratingOrders(true);
      
      const response = await api.post('/supplier-orders/generate', {
        suppliers: orderGenerationData.suppliers,
        deliveryDate: deliveryDate || null,
        notes: notes || '',
        generatedFrom: orderGenerationData.generatedFrom
      });

      if (response.data.success) {
        // Limpiar la lista de compras
        setShoppingList(null);
        
        // Cerrar modal
        setShowGenerateOrderModal(false);
        setOrderGenerationData(null);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al generar pedidos:', error);
      return false;
    } finally {
      setIsGeneratingOrders(false);
    }
  };

  // Effects
  useEffect(() => {
    if (showEventSelection && selectedEventIds.length > 0) {
      loadShoppingList();
    }
  }, [selectedEventIds]);

  useEffect(() => {
    // Recargar la lista cuando cambiamos de modo
    if (!showManualOrder) {
      loadShoppingList();
    } else {
      // Si cambiamos a modo manual, limpiar cualquier lista anterior
      setShoppingList(null);
    }
  }, [showEventSelection, showManualOrder]);

  return {
    // States
    shoppingList,
    shoppingListLoading,
    filters,
    availableEvents,
    selectedEventIds,
    eventsLoading,
    showEventSelection,
    showManualOrder,
    manualOrderItems,
    availableIngredients,
    ingredientsLoading,
    isGeneratingOrders,
    showGenerateOrderModal,
    orderGenerationData,
    showSupplierWarningModal,
    ingredientsWithoutProvider,

    // Setters
    setFilters,
    setShoppingList,
    setShowGenerateOrderModal,
    setOrderGenerationData,
    setShowSupplierWarningModal,
    setIngredientsWithoutProvider,

    // Actions
    loadAvailableEvents,
    loadShoppingList,
    handleEventSelection,
    handleSelectAllEvents,
    handleModeChange,
    addManualOrderItem,
    updateManualOrderItem,
    removeManualOrderItem,
    generateManualShoppingList,
    handleGenerateOrders,
    confirmGenerateOrders
  };
};