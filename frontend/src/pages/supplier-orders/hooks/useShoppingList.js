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

      // Agrupar por proveedor preferido del ingrediente, o "Sin Proveedor" si no tiene
      const preferredSupplier = ingredient.preferredSupplier;
      const supplierId = preferredSupplier?.supplier_id || 999;
      const supplierName = preferredSupplier?.supplier_name || 'Sin Proveedor Asignado';

      if (!manualSupplierGroups[supplierId]) {
        manualSupplierGroups[supplierId] = {
          supplierId: supplierId,
          supplierName: supplierName,
          ingredients: [],
          supplierTotal: 0
        };
      }

      // Usar datos del proveedor preferido si está disponible
      const packageSize = preferredSupplier?.package_size || 1;
      const packageUnit = preferredSupplier ? (preferredSupplier.package_unit || ingredient.unit) : ingredient.unit;
      const supplierPrice = preferredSupplier?.price || ingredient.base_price;
      const minimumOrderQuantity = preferredSupplier?.minimum_order_quantity || 1;
      
      // Calcular paquetes necesarios si tiene proveedor
      let packagesToBuy = 0;
      let realQuantity = quantity;
      let realTotalCost = totalCost;
      
      if (preferredSupplier && packageSize > 1) {
        packagesToBuy = Math.max(minimumOrderQuantity, Math.ceil(quantity / packageSize));
        realQuantity = packagesToBuy * packageSize;
        realTotalCost = packagesToBuy * supplierPrice;
      }

      const ingredientData = {
        ingredientId: ingredient.ingredient_id,
        name: ingredient.name,
        needed: quantity,
        neededBase: quantity,
        wastePercent: ingredient.waste_percent || 0,
        inStock: ingredient.stock || 0,
        toBuy: quantity,
        unit: ingredient.unit,
        pricePerUnit: ingredient.base_price,
        totalCost: totalCost,
        packageSize: packageSize,
        packageUnit: packageUnit,
        minimumOrderQuantity: minimumOrderQuantity,
        supplierPrice: supplierPrice,
        packagesToBuy: packagesToBuy,
        realQuantity: realQuantity,
        realTotalCost: realTotalCost,
        supplierStatus: preferredSupplier ? (supplierPrice > 0 ? 'complete' : 'incomplete') : 'missing',
        notes: item.notes
      };

      manualSupplierGroups[supplierId].ingredients.push(ingredientData);
      // Usar el costo real si hay proveedor, sino usar el costo base
      const costToAdd = realTotalCost > totalCost ? realTotalCost : totalCost;
      manualSupplierGroups[supplierId].supplierTotal += costToAdd;
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

    // Setters
    setFilters,
    setShoppingList,

    // Actions
    loadAvailableEvents,
    loadShoppingList,
    loadAvailableIngredients,
    handleEventSelection,
    handleSelectAllEvents,
    handleModeChange,
    addManualOrderItem,
    updateManualOrderItem,
    removeManualOrderItem,
    generateManualShoppingList
  };
};