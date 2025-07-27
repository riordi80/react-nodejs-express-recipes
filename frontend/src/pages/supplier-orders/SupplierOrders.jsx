// src/pages/supplier-orders/SupplierOrders.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaTruck, FaEuroSign, FaBoxOpen, FaExclamationTriangle, FaPlus, FaListUl, FaHistory, FaChartBar, FaChevronDown, FaCheckCircle, FaTimesCircle, FaQuestionCircle, FaDownload, FaEye, FaCalendarAlt, FaClock } from 'react-icons/fa';
import PageHeader from '../../components/page-header/PageHeader';
import Loading from '../../components/loading';
import api from '../../api/axios';
import { formatCurrency, formatDecimal } from '../../utils/formatters';
import EditIngredientModal from '../../components/modals/EditIngredientModal';
import GenerateOrderModal from '../../components/modals/GenerateOrderModal';
import OrderDetailModal from '../../components/modals/OrderDetailModal';
import SupplierWarningModal from '../../components/modals/SupplierWarningModal';
import ReportsModal from '../../components/modals/ReportsModal';
import './SupplierOrders.css';

const SupplierOrders = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const modeDropdownRef = useRef(null);
  const [metrics, setMetrics] = useState({
    monthlySpending: 0,
    todayDeliveries: 0,
    potentialSavings: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);
  
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

  // Estados para modal de edición de ingredientes
  const [isEditIngredientOpen, setIsEditIngredientOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // Estados para generación de pedidos
  const [isGeneratingOrders, setIsGeneratingOrders] = useState(false);
  const [showGenerateOrderModal, setShowGenerateOrderModal] = useState(false);
  const [orderGenerationData, setOrderGenerationData] = useState(null);

  // Estados para pedidos activos
  const [activeOrders, setActiveOrders] = useState([]);
  const [activeOrdersLoading, setActiveOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);

  // Estados para modal de advertencia de proveedores
  const [showSupplierWarningModal, setShowSupplierWarningModal] = useState(false);
  const [ingredientsWithoutProvider, setIngredientsWithoutProvider] = useState([]);

  // Estados para análisis de proveedores
  const [suppliersAnalysis, setSuppliersAnalysis] = useState([]);
  const [suppliersAnalysisLoading, setSuppliersAnalysisLoading] = useState(false);

  // Estados para modal de reportes
  const [showReportsModal, setShowReportsModal] = useState(false);

  // Estados para el dashboard de historial
  const [historyMetrics, setHistoryMetrics] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Definición de tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FaChartBar },
    { id: 'shopping-list', label: 'Lista de Compras', icon: FaListUl },
    { id: 'active-orders', label: 'Pedidos Activos', icon: FaTruck },
    { id: 'suppliers', label: 'Proveedores', icon: FaBoxOpen },
    { id: 'history', label: 'Historial', icon: FaHistory },
  ];

  // Efecto para cerrar los dropdowns cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target)) {
        setIsModeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'shopping-list') {
      loadAvailableEvents();
      loadShoppingList();
    } else if (activeTab === 'active-orders') {
      loadActiveOrders();
    } else if (activeTab === 'suppliers') {
      loadSuppliersAnalysis();
    } else if (activeTab === 'history') {
      loadHistoryMetrics();
    }
  }, [activeTab, filters]);

  useEffect(() => {
    if (showEventSelection && selectedEventIds.length > 0) {
      loadShoppingList();
    }
  }, [selectedEventIds]);

  useEffect(() => {
    // Recargar la lista cuando cambiamos de modo
    if (activeTab === 'shopping-list') {
      if (!showManualOrder) {
        loadShoppingList();
      } else {
        // Si cambiamos a modo manual, limpiar cualquier lista anterior
        setShoppingList(null);
      }
    }
  }, [showEventSelection, showManualOrder]);

  // Funciones para manejar la edición de ingredientes
  const handleIngredientRowClick = async (ingredientId) => {
    try {
      const response = await api.get(`/ingredients/${ingredientId}`);
      setSelectedIngredient(response.data);
      setIsEditIngredientOpen(true);
    } catch (error) {
      console.error('Error al cargar ingrediente:', error);
    }
  };

  const handleSaveIngredient = async (updatedIngredient) => {
    try {
      console.log('🔄 Guardando ingrediente:', updatedIngredient.ingredient_id);
      await api.put(`/ingredients/${updatedIngredient.ingredient_id}`, updatedIngredient);
      
      // Recargar la lista de compras si estamos en la pestaña shopping-list
      if (activeTab === 'shopping-list') {
        console.log('🔄 Recargando lista de compras después de guardar ingrediente');
        await loadShoppingList();
      }
      
      // También recargar métricas del dashboard si estamos ahí
      if (activeTab === 'dashboard') {
        await loadDashboardData();
      }
      
      setIsEditIngredientOpen(false);
      setSelectedIngredient(null);
      return true;
    } catch (error) {
      console.error('❌ Error al guardar ingrediente:', error);
      return false;
    }
  };

  // Funciones para manejar el dropdown
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsDropdownOpen(false); // Cerrar dropdown al seleccionar
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleModeDropdown = () => {
    setIsModeDropdownOpen(!isModeDropdownOpen);
  };

  // Función para obtener icono y estilo según estado del proveedor
  const getSupplierStatusIndicator = (status) => {
    switch (status) {
      case 'complete':
        return { icon: FaCheckCircle, className: 'supplier-status-complete', title: 'Proveedor configurado correctamente' };
      case 'incomplete':
        return { icon: FaExclamationTriangle, className: 'supplier-status-incomplete', title: 'Proveedor asignado pero sin precio configurado' };
      case 'missing':
      default:
        return { icon: FaTimesCircle, className: 'supplier-status-missing', title: 'Sin proveedor asignado' };
    }
  };

  // Opciones de modo para el dropdown móvil
  const modeOptions = [
    { 
      id: 'automatic', 
      label: 'Automático por Filtros', 
      icon: FaListUl,
      isActive: !showEventSelection && !showManualOrder,
      onClick: () => {
        if (showEventSelection) toggleEventSelectionMode();
        if (showManualOrder) toggleManualOrderMode();
        setShoppingList(null);
        setIsModeDropdownOpen(false);
      }
    },
    { 
      id: 'events', 
      label: 'Seleccionar Eventos Específicos', 
      icon: FaPlus,
      isActive: showEventSelection && !showManualOrder,
      onClick: () => {
        if (!showEventSelection) toggleEventSelectionMode();
        if (showManualOrder) toggleManualOrderMode();
        setShoppingList(null);
        setIsModeDropdownOpen(false);
      }
    },
    { 
      id: 'manual', 
      label: 'Pedido Manual', 
      icon: FaBoxOpen,
      isActive: showManualOrder,
      onClick: () => {
        if (!showManualOrder) toggleManualOrderMode();
        if (showEventSelection) toggleEventSelectionMode();
        setShoppingList(null);
        setIsModeDropdownOpen(false);
      }
    }
  ];

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/supplier-orders/dashboard');
      
      setMetrics({
        monthlySpending: response.data.monthlySpending,
        todayDeliveries: response.data.todayDeliveries,
        potentialSavings: response.data.potentialSavings,
        lowStockItems: response.data.lowStockItems
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback a datos por defecto en caso de error
      setMetrics({
        monthlySpending: 0,
        todayDeliveries: 0,
        potentialSavings: 0,
        lowStockItems: 0
      });
      setLoading(false);
    }
  };

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

  // Funciones para pedidos manuales
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
        // Cambiar a la pestaña de pedidos activos para ver los pedidos creados
        setActiveTab('active-orders');
        
        // Limpiar la lista de compras
        setShoppingList(null);
        
        // Cerrar modal
        setShowGenerateOrderModal(false);
        setOrderGenerationData(null);
        
        // Opcionalmente mostrar mensaje de éxito
      }
    } catch (error) {
      console.error('Error al generar pedidos:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    } finally {
      setIsGeneratingOrders(false);
    }
  };

  // Cargar pedidos activos
  const loadActiveOrders = async () => {
    try {
      setActiveOrdersLoading(true);
      const response = await api.get('/supplier-orders/active');
      setActiveOrders(response.data);
      setActiveOrdersLoading(false);
    } catch (error) {
      console.error('Error loading active orders:', error);
      setActiveOrdersLoading(false);
    }
  };

  // Actualizar estado de pedido
  const updateOrderStatus = async (orderId, newStatus, notes = '') => {
    try {
      await api.put(`/supplier-orders/${orderId}/status`, {
        status: newStatus,
        notes: notes
      });
      
      // Recargar pedidos activos
      await loadActiveOrders();
      
      // Si es el pedido seleccionado, actualizar también el detalle
      if (selectedOrder && selectedOrder.order_id === orderId) {
        await loadOrderDetail(orderId);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  // Cargar detalle de pedido
  const loadOrderDetail = async (orderId) => {
    try {
      const response = await api.get(`/supplier-orders/${orderId}`);
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Error loading order detail:', error);
    }
  };

  // Abrir detalle de pedido
  const handleOrderClick = async (order) => {
    await loadOrderDetail(order.order_id);
    setShowOrderDetailModal(true);
  };

  // Eliminar pedido
  const deleteOrder = async (orderId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      return;
    }

    try {
      await api.delete(`/supplier-orders/${orderId}`);
      await loadActiveOrders();
      
      // Cerrar modal si estaba abierto
      if (selectedOrder && selectedOrder.order_id === orderId) {
        setShowOrderDetailModal(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  // Cargar análisis de proveedores
  const loadSuppliersAnalysis = async () => {
    try {
      setSuppliersAnalysisLoading(true);
      const response = await api.get('/supplier-orders/suppliers/analysis');
      setSuppliersAnalysis(response.data);
      setSuppliersAnalysisLoading(false);
    } catch (error) {
      console.error('Error loading suppliers analysis:', error);
      setSuppliersAnalysisLoading(false);
    }
  };

  // Cargar métricas de historial
  const loadHistoryMetrics = async () => {
    try {
      setHistoryLoading(true);
      
      const recentOrdersRes = await api.get('/supplier-orders/history?limit=5&orderBy=created_at&sortDirection=DESC');

      const trendsRes = await api.get('/supplier-orders/trends?period=month&months=3');

      const summaryRes = await api.get('/supplier-orders/history?limit=1');

      const metrics = {
        recentOrders: recentOrdersRes.data.orders || [],
        trends: trendsRes.data || {},
        summary: summaryRes.data.statistics || {}
      };

      setHistoryMetrics(metrics);
    } catch (error) {
      console.error('Error al cargar métricas de historial:', error);
      
      // Fallback con datos vacíos para que no se rompa la UI
      setHistoryMetrics({
        recentOrders: [],
        trends: {},
        summary: {
          totalOrders: 0,
          totalAmount: 0,
          averageAmount: 0,
          statusBreakdown: {
            delivered: 0,
            pending: 0,
            ordered: 0,
            cancelled: 0
          }
        }
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-section">
      <h2 className="section-title">
        <FaChartBar />
        Dashboard de Compras
      </h2>
      
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <FaEuroSign />
          </div>
          <div className="metric-info">
            <div className="metric-label">Gasto Mensual</div>
            <div className="metric-value">{formatCurrency(metrics.monthlySpending)}</div>
            <div className="metric-detail">Último mes</div>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <FaTruck />
          </div>
          <div className="metric-info">
            <div className="metric-label">Entregas Hoy</div>
            <div className="metric-value">{metrics.todayDeliveries}</div>
            <div className="metric-detail">Entregas completadas hoy</div>
          </div>
        </div>

        <div className="metric-card highlight">
          <div className="metric-icon">
            <FaEuroSign />
          </div>
          <div className="metric-info">
            <div className="metric-label">Ahorro Potencial</div>
            <div className="metric-value">{formatCurrency(metrics.potentialSavings)}</div>
            <div className="metric-detail">Consolidando pedidos pendientes</div>
          </div>
        </div>

        <div className="metric-card highlight warning-style">
          <div className="metric-icon">
            <FaExclamationTriangle />
          </div>
          <div className="metric-info">
            <div className="metric-label">Stock Bajo</div>
            <div className="metric-value">{metrics.lowStockItems}</div>
            <div className="metric-detail">Requieren reposición</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Acciones Rápidas</h3>
        <div className="actions-grid">
          <button className="btn add" onClick={() => setActiveTab('shopping-list')}>
            <FaPlus /> Generar Lista de Compras
          </button>
          <button className="btn view" onClick={() => setActiveTab('active-orders')}>
            <FaListUl /> Ver Pedidos Activos
          </button>
          <button className="btn edit" onClick={() => setActiveTab('suppliers')}>
            <FaTruck /> Gestionar Proveedores
          </button>
        </div>
      </div>
    </div>
  );

  const renderShoppingList = () => (
    <div className="shopping-list-section">
      <h2 className="section-title">
        <FaListUl />
        Lista de Compras Inteligente
      </h2>

      {/* Modo de Selección */}
      <div className="selection-mode">
        <div className="mode-toggle">
          <button 
            className={`mode-btn ${!showEventSelection && !showManualOrder ? 'active' : ''}`}
            onClick={() => {
              if (showEventSelection) toggleEventSelectionMode();
              if (showManualOrder) toggleManualOrderMode();
              setShoppingList(null);
            }}
          >
            <FaListUl /> Automático por Filtros
          </button>
          <button 
            className={`mode-btn ${showEventSelection && !showManualOrder ? 'active' : ''}`}
            onClick={() => {
              if (!showEventSelection) toggleEventSelectionMode();
              if (showManualOrder) toggleManualOrderMode();
              setShoppingList(null);
            }}
          >
            <FaPlus /> Seleccionar Eventos Específicos
          </button>
          <button 
            className={`mode-btn ${showManualOrder ? 'active' : ''}`}
            onClick={() => {
              if (!showManualOrder) toggleManualOrderMode();
              if (showEventSelection) toggleEventSelectionMode();
              setShoppingList(null);
            }}
          >
            <FaBoxOpen /> Pedido Manual
          </button>
        </div>

        {/* Dropdown para móvil - Modo de Selección */}
        <div className="mode-mobile-dropdown" ref={modeDropdownRef}>
          <button className="mode-mobile-dropdown-trigger" onClick={toggleModeDropdown}>
            {(() => {
              const activeMode = modeOptions.find(mode => mode.isActive);
              const IconComponent = activeMode?.icon || FaListUl;
              return (
                <>
                  <IconComponent className="mode-mobile-dropdown-icon" />
                  <span className="mode-mobile-dropdown-label">{activeMode?.label || 'Seleccionar Modo'}</span>
                  <FaChevronDown className={`mode-mobile-dropdown-arrow ${isModeDropdownOpen ? 'open' : ''}`} />
                </>
              );
            })()}
          </button>
          <div className={`mode-mobile-dropdown-menu ${isModeDropdownOpen ? 'open' : ''}`}>
            {modeOptions.map(mode => {
              const IconComponent = mode.icon;
              return (
                <button
                  key={mode.id}
                  className={`mode-mobile-dropdown-item ${mode.isActive ? 'active' : ''}`}
                  onClick={mode.onClick}
                >
                  <IconComponent className="mode-mobile-dropdown-item-icon" />
                  <span className="mode-mobile-dropdown-item-label">{mode.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Filtros y Configuración */}
        {!showManualOrder && (
          <div className="shopping-filters">
          <div className={`filters-grid ${showEventSelection ? 'filters-grid-compact' : ''}`}>
            <div className="filter-group">
              <label className="toggle-label">
                <span className="toggle-text">
                  <input
                    type="checkbox"
                    checked={filters.includeStock}
                    onChange={(e) => setFilters(prev => ({ ...prev, includeStock: e.target.checked }))}
                  />
                  Descontar stock actual
                </span>
                <small>Solo mostrar lo que necesitas comprar</small>
              </label>
            </div>

            {!showEventSelection && (
              <>
                <div className="filter-group">
                  <label className="toggle-label">
                    <span className="toggle-text">
                      <input
                        type="checkbox"
                        checked={filters.includeConfirmed}
                        onChange={(e) => setFilters(prev => ({ ...prev, includeConfirmed: e.target.checked }))}
                      />
                      Eventos confirmados
                    </span>
                    <small>Incluir eventos con estado "confirmado"</small>
                  </label>
                </div>

                <div className="filter-group">
                  <label className="toggle-label">
                    <span className="toggle-text">
                      <input
                        type="checkbox"
                        checked={filters.includePlanned}
                        onChange={(e) => setFilters(prev => ({ ...prev, includePlanned: e.target.checked }))}
                      />
                      Eventos planificados
                    </span>
                    <small>Incluir eventos con estado "planificado"</small>
                  </label>
                </div>
              </>
            )}

            <div className="filter-group">
              <label className="select-label">
                <span>
                  Período de tiempo
                </span>
                <select
                  value={filters.days}
                  onChange={(e) => setFilters(prev => ({ ...prev, days: parseInt(e.target.value) }))}
                  className="days-select"
                >
                  <option value={7}>Próximos 7 días</option>
                  <option value={15}>Próximos 15 días</option>
                  <option value={30}>Próximos 30 días</option>
                  <option value={60}>Próximos 60 días</option>
                </select>
                <small>
                  {showEventSelection 
                    ? 'Filtrar eventos mostrados en la selección' 
                    : 'Rango de fechas para buscar eventos'
                  }
                </small>
              </label>
            </div>
          </div>
          </div>
        )}
        
        {showEventSelection && (
          <div className="event-selection-section">
            <div className="selection-header">
              <h3>Seleccionar Eventos ({availableEvents.length} disponibles)</h3>
              <div className="selection-actions">
                <button 
                  className="btn-link"
                  onClick={handleSelectAllEvents}
                >
                  {selectedEventIds.length === availableEvents.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                </button>
                <span className="selection-count">
                  {selectedEventIds.length} seleccionados
                </span>
              </div>
            </div>

            {eventsLoading ? (
              <Loading message="Cargando eventos disponibles..." size="medium" inline />
            ) : (
              <div className="events-grid">
                {availableEvents.map(event => (
                  <div 
                    key={event.event_id} 
                    className={`event-card ${selectedEventIds.includes(event.event_id) ? 'selected' : ''}`}
                    onClick={() => handleEventSelection(event.event_id, !selectedEventIds.includes(event.event_id))}
                  >
                    <div className="event-checkbox">
                      <input
                        type="checkbox"
                        id={`event-${event.event_id}`}
                        checked={selectedEventIds.includes(event.event_id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleEventSelection(event.event_id, e.target.checked);
                        }}
                      />
                    </div>
                    <div className="event-info">
                      <div className="event-header">
                        <h4>{event.event_name}</h4>
                        <span className={`status-badge ${event.status}`}>
                          {event.status === 'confirmed' ? 'Confirmado' : 'Planificado'}
                        </span>
                      </div>
                      <div className="event-details">
                        <div className="event-date">
                          📅 {new Date(event.event_date).toLocaleDateString('es-ES')}
                          {event.event_time && ` - ${event.event_time}`}
                        </div>
                        <div className="event-meta">
                          👥 {event.guests_count} invitados
                          {event.recipes_count > 0 && (
                            <span> • 🍽️ {event.recipes_count} recetas</span>
                          )}
                          {event.total_portions > 0 && (
                            <span> • 📊 {event.total_portions} porciones</span>
                          )}
                        </div>
                        {event.location && (
                          <div className="event-location">📍 {event.location}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showManualOrder && (
          <div className="manual-order-section">
            <div className="selection-header">
              <h3>Crear Pedido Manual</h3>
              <div className="selection-actions">
                <button 
                  className="btn-link"
                  onClick={addManualOrderItem}
                >
                  + Añadir Ingrediente
                </button>
                <button 
                  className="btn add"
                  onClick={generateManualShoppingList}
                  disabled={manualOrderItems.length === 0}
                >
                  Generar Lista
                </button>
              </div>
            </div>
            
            <div 
              className="manual-order-info"
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '16px',
                margin: '16px 0'
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: '#1e40af',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}
              >
                📝 <strong>Pedidos independientes:</strong> Especifica la cantidad exacta que necesitas de cada ingrediente. 
                Si el ingrediente tiene proveedor asignado, verás información sobre el tamaño de paquete y precios reales.
              </p>
            </div>

            {manualOrderItems.length === 0 ? (
              <div className="empty-state">
                <p>Añade ingredientes para crear un pedido manual</p>
              </div>
            ) : (
              <div className="manual-items-list">
                {manualOrderItems.map(item => (
                  <div 
                    key={item.id} 
                    className="manual-item"
                    style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px'
                    }}
                  >
                    <div 
                      className="manual-item-fields"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 2fr auto',
                        gap: '16px',
                        alignItems: 'end'
                      }}
                    >
                      <div 
                        className="field-group"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <label style={{
                          fontWeight: '500',
                          color: '#1e293b',
                          fontSize: '14px'
                        }}>Ingrediente</label>
                        <select
                          value={item.ingredientId}
                          onChange={(e) => updateManualOrderItem(item.id, 'ingredientId', e.target.value)}
                          className="ingredient-select"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            background: 'white',
                            width: '100%'
                          }}
                        >
                          <option value="">Seleccionar ingrediente...</option>
                          {availableIngredients.map(ingredient => {
                            const supplier = ingredient.preferredSupplier;
                            const supplierInfo = supplier 
                              ? ` | Proveedor: ${formatCurrency(supplier.price)}/${supplier.package_unit} (paquete ${formatDecimal(supplier.package_size)} ${ingredient.unit})`
                              : ' | Sin proveedor asignado';
                            
                            return (
                              <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
                                {ingredient.name} - Base: {formatCurrency(ingredient.base_price)}/{ingredient.unit}
                                {ingredient.stock > 0 ? ` | Stock: ${formatDecimal(ingredient.stock)} ${ingredient.unit}` : ' | Sin stock'}
                                {supplierInfo}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div 
                        className="field-group"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <label style={{
                          fontWeight: '500',
                          color: '#1e293b',
                          fontSize: '14px'
                        }}>
                          Cantidad deseada
                          {item.ingredientId && (() => {
                            const ingredient = availableIngredients.find(ing => ing.ingredient_id === parseInt(item.ingredientId));
                            return ingredient ? ` (${ingredient.unit})` : '';
                          })()}
                        </label>
                        <input
                          type="number"
                          step="0,01"
                          value={item.quantity}
                          onChange={(e) => updateManualOrderItem(item.id, 'quantity', e.target.value)}
                          className="quantity-input"
                          lang="es"
                          placeholder={item.ingredientId ? (() => {
                            const ingredient = availableIngredients.find(ing => ing.ingredient_id === parseInt(item.ingredientId));
                            return ingredient ? `Ej: 500 ${ingredient.unit}` : '';
                          })() : 'Selecciona ingrediente'}
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            background: 'white',
                            maxWidth: '120px'
                          }}
                        />
                        {item.ingredientId && (() => {
                          const ingredient = availableIngredients.find(ing => ing.ingredient_id === parseInt(item.ingredientId));
                          if (!ingredient?.preferredSupplier) return null;
                          
                          const supplier = ingredient.preferredSupplier;
                          const packageSize = supplier.package_size;
                          const packageUnit = supplier.package_unit;
                          
                          return (
                            <small 
                              className="quantity-note"
                              style={{
                                color: '#64748b',
                                fontSize: '12px',
                                lineHeight: '1.3',
                                marginTop: '4px',
                                display: 'block',
                                background: '#f8fafc',
                                padding: '6px 8px',
                                borderRadius: '4px',
                                borderLeft: '3px solid #3b82f6'
                              }}
                            >
                              💡 El proveedor vende en paquetes de {formatDecimal(packageSize)} {ingredient.unit} 
                              por {formatCurrency(supplier.price)} ({packageUnit})
                            </small>
                          );
                        })()}
                      </div>
                      <div 
                        className="field-group"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <label style={{
                          fontWeight: '500',
                          color: '#1e293b',
                          fontSize: '14px'
                        }}>Notas (opcional)</label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => updateManualOrderItem(item.id, 'notes', e.target.value)}
                          className="notes-input"
                          placeholder="Ej: Urgente, marca específica..."
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            background: 'white',
                            width: '100%'
                          }}
                        />
                      </div>
                      <div 
                        className="field-group"
                        style={{
                          display: 'flex',
                          alignItems: 'end'
                        }}
                      >
                        <button 
                          className="btn delete"
                          onClick={() => removeManualOrderItem(item.id)}
                          title="Eliminar item"
                          style={{
                            width: '36px',
                            height: '36px',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            borderRadius: '6px',
                            border: '1px solid #dc2626',
                            background: '#dc2626',
                            color: 'white',
                            cursor: 'pointer'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {ingredientsLoading && (
              <Loading message="Cargando ingredientes disponibles..." size="medium" inline />
            )}
          </div>
        )}
      </div>

      {/* Resultados */}
      {shoppingListLoading ? (
        <Loading message="Generando lista de compras..." size="medium" />
      ) : showEventSelection && selectedEventIds.length === 0 ? (
        <div className="empty-state">
          <p>Selecciona uno o más eventos para generar la lista de compras</p>
        </div>
      ) : showManualOrder && manualOrderItems.length === 0 ? (
        null // No mostrar nada en modo manual sin items
      ) : showManualOrder && (!shoppingList || !shoppingList.filters?.manual) ? (
        null // No mostrar listas no-manuales cuando estamos en modo manual
      ) : shoppingList ? (
        <div className="shopping-results">
          {/* Resumen */}
          <div className="shopping-summary">
            <div className="summary-stats">
              {!shoppingList.filters?.manual && (
                <div className="stat">
                  <span className="stat-label">Eventos</span>
                  <span className="stat-value">{shoppingList.totalEvents}</span>
                </div>
              )}
              <div className="stat">
                <span className="stat-label">{shoppingList.filters?.manual ? 'Items' : 'Costo Total'}</span>
                <span className="stat-value">
                  {shoppingList.filters?.manual 
                    ? shoppingList.ingredientsBySupplier.reduce((total, supplier) => total + supplier.ingredients.length, 0)
                    : formatCurrency(shoppingList.totalCost)
                  }
                </span>
              </div>
              {shoppingList.filters?.manual && (
                <div className="stat">
                  <span className="stat-label">Costo Total</span>
                  <span className="stat-value">{formatCurrency(shoppingList.totalCost)}</span>
                </div>
              )}
              {!shoppingList.filters?.manual && (
                <div className="stat">
                  <span className="stat-label">Proveedores</span>
                  <span className="stat-value">{shoppingList.ingredientsBySupplier.length}</span>
                </div>
              )}
            </div>
            {shoppingList.dateRange.from && (
              <div className="date-range">
                <small>
                  Período: {new Date(shoppingList.dateRange.from).toLocaleDateString()} - {new Date(shoppingList.dateRange.to).toLocaleDateString()}
                </small>
              </div>
            )}
          </div>

          {/* Advertencias sobre configuración de proveedores */}
          {shoppingList.supplierStats && (shoppingList.supplierStats.incomplete > 0 || shoppingList.supplierStats.missing > 0) && (
            <div className="supplier-warnings">
              {shoppingList.supplierStats.missing > 0 && (
                <div className="warning-item missing">
                  <FaTimesCircle className="warning-icon" />
                  <span>
                    <strong>{shoppingList.supplierStats.missing} ingredientes</strong> sin proveedor asignado - usando precios base
                  </span>
                </div>
              )}
              {shoppingList.supplierStats.incomplete > 0 && (
                <div className="warning-item incomplete">
                  <FaExclamationTriangle className="warning-icon" />
                  <span>
                    <strong>{shoppingList.supplierStats.incomplete} ingredientes</strong> con proveedor asignado pero sin precio configurado
                  </span>
                </div>
              )}
              <div className="warning-note">
                <small>El costo total puede no ser preciso. Configura los proveedores y precios para obtener cálculos exactos.</small>
              </div>
            </div>
          )}

          {/* Botón para generar pedidos */}
          {shoppingList.ingredientsBySupplier.length > 0 && (
            <div className="generate-orders-section">
              <button 
                className="btn add generate-orders-btn"
                onClick={handleGenerateOrders}
                disabled={isGeneratingOrders}
              >
                <FaPlus />
                {isGeneratingOrders ? 'Generando Pedidos...' : 'Generar Pedidos por Proveedor'}
              </button>
              <small className="generate-orders-note">
                Se creará un pedido separado para cada proveedor con estado "pendiente"
              </small>
            </div>
          )}

          {/* Lista por Proveedores */}
          {shoppingList.ingredientsBySupplier.length > 0 ? (
            <div className="suppliers-list">
              {shoppingList.ingredientsBySupplier.map(supplier => (
                <div key={supplier.supplierId} className="supplier-group">
                  <div className="supplier-header">
                    <h3>{supplier.supplierName}</h3>
                    <span className="supplier-total">{formatCurrency(supplier.supplierTotal)}</span>
                  </div>
                  <div className="ingredients-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Ingrediente</th>
                          <th>Necesario</th>
                          <th>En Stock</th>
                          <th>A Comprar</th>
                          <th>Unidad Venta</th>
                          <th>Cantidad Real</th>
                          <th>Precio Real</th>
                          <th>Total Real</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplier.ingredients.map(ingredient => {
                          const statusIndicator = getSupplierStatusIndicator(ingredient.supplierStatus);
                          const StatusIcon = statusIndicator.icon;
                          return (
                          <tr 
                            key={ingredient.ingredientId}
                            onClick={() => handleIngredientRowClick(ingredient.ingredientId)}
                            style={{ cursor: 'pointer' }}
                            className="clickable-ingredient-row"
                          >
                            <td>
                              <div className="ingredient-name-with-status">
                                <span>{ingredient.name}</span>
                                <StatusIcon 
                                  className={`supplier-status-icon ${statusIndicator.className}`} 
                                  title={statusIndicator.title}
                                />
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>{formatDecimal(ingredient.needed)} {ingredient.unit}</span>
                                {ingredient.wastePercent > 0 && (
                                  <span style={{ 
                                    fontSize: '11px', 
                                    color: '#64748b',
                                    fontStyle: 'italic'
                                  }}>
                                    Base: {formatDecimal(ingredient.neededBase)} + {(ingredient.wastePercent * 100).toFixed(1)}% merma
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{formatDecimal(ingredient.inStock)} {ingredient.unit}</td>
                            <td className="to-buy">{formatDecimal(ingredient.toBuy)} {ingredient.unit}</td>
                            <td className="package-info">
                              {ingredient.packageSize ? (
                                `${formatDecimal(ingredient.packageSize)} ${ingredient.packageUnit}`
                              ) : (
                                `1 ${ingredient.unit}`
                              )}
                            </td>
                            <td className="real-quantity">
                              {ingredient.packagesToBuy > 0 ? (
                                `${formatDecimal(ingredient.realQuantity)} ${ingredient.unit}`
                              ) : (
                                `${formatDecimal(ingredient.toBuy)} ${ingredient.unit}`
                              )}
                            </td>
                            <td className="real-price">
                              {ingredient.supplierPrice ? (
                                `${formatCurrency(ingredient.supplierPrice)}/${ingredient.packageUnit || 'unidad'}`
                              ) : (
                                formatCurrency(ingredient.pricePerUnit)
                              )}
                            </td>
                            <td className="total-cost">
                              {ingredient.realTotalCost > 0 ? (
                                formatCurrency(ingredient.realTotalCost)
                              ) : (
                                formatCurrency(ingredient.totalCost)
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>{shoppingList.message || 'No hay ingredientes que comprar con los filtros seleccionados'}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  const renderActiveOrders = () => {
    // Función para obtener estilo de estado
    const getStatusStyle = (status) => {
      switch (status) {
        case 'pending':
          return { className: 'status-pending', label: 'Pendiente', icon: '📝' };
        case 'ordered':
          return { className: 'status-ordered', label: 'Enviado', icon: '📤' };
        case 'delivered':
          return { className: 'status-delivered', label: 'Entregado', icon: '✅' };
        case 'cancelled':
          return { className: 'status-cancelled', label: 'Cancelado', icon: '❌' };
        default:
          return { className: 'status-unknown', label: status, icon: '❓' };
      }
    };

    return (
      <div className="active-orders-section">
        <h2 className="section-title">
          <FaTruck />
          Pedidos Activos
        </h2>

        {activeOrdersLoading ? (
          <Loading message="Cargando pedidos activos..." size="medium" inline />
        ) : activeOrders.length === 0 ? (
          <div className="empty-state">
            <p>No hay pedidos activos</p>
            <p>Los pedidos generados desde la Lista de Compras aparecerán aquí</p>
          </div>
        ) : (
          <div className="orders-grid">
            {activeOrders.map(order => {
              const statusStyle = getStatusStyle(order.status);
              return (
                <div 
                  key={order.order_id} 
                  className="order-card"
                  onClick={() => handleOrderClick(order)}
                >
                  <div className="order-header">
                    <div className="order-supplier">
                      <h3>{order.supplier_name}</h3>
                      <span className="order-id">#{order.order_id}</span>
                    </div>
                    <span className={`order-status ${statusStyle.className}`}>
                      <span className="status-icon">{statusStyle.icon}</span>
                      {statusStyle.label}
                    </span>
                  </div>

                  <div className="order-details">
                    <div className="order-meta">
                      <span className="order-date">
                        📅 {new Date(order.order_date).toLocaleDateString('es-ES')}
                      </span>
                      {order.delivery_date && (
                        <span className="delivery-date">
                          🚚 {new Date(order.delivery_date).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>

                    <div className="order-summary">
                      <div className="order-items">
                        📦 {order.items_count} ingredientes
                      </div>
                      <div className="order-total">
                        💰 {formatCurrency(order.total_amount)}
                      </div>
                    </div>

                    {order.notes && (
                      <div className="order-notes">
                        📝 {order.notes.substring(0, 50)}
                        {order.notes.length > 50 && '...'}
                      </div>
                    )}

                    <div className="order-creator">
                      👤 {order.first_name} {order.last_name}
                    </div>
                  </div>

                  <div className="order-actions">
                    {order.status === 'pending' && (
                      <React.Fragment key={`actions-pending-${order.order_id}`}>
                        <button 
                          key={`ordered-${order.order_id}`}
                          className="btn-small ordered"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.order_id, 'ordered');
                          }}
                        >
                          Marcar Enviado
                        </button>
                        <button 
                          key={`delete-${order.order_id}`}
                          className="btn-small delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteOrder(order.order_id);
                          }}
                        >
                          Eliminar
                        </button>
                      </React.Fragment>
                    )}
                    {order.status === 'ordered' && (
                      <button 
                        key={`delivered-${order.order_id}`}
                        className="btn-small delivered"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.order_id, 'delivered');
                        }}
                      >
                        Marcar Entregado
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSuppliers = () => {
    // Función para renderizar estrellas de rating
    const renderStars = (rating) => {
      const stars = [];
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      
      for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
          stars.push(<span key={i} className="star filled">★</span>);
        } else if (i === fullStars && hasHalfStar) {
          stars.push(<span key={i} className="star half">☆</span>);
        } else {
          stars.push(<span key={i} className="star empty">☆</span>);
        }
      }
      return stars;
    };

    return (
      <div className="suppliers-section">
        <h2 className="section-title">
          <FaTruck />
          Análisis de Proveedores
        </h2>
        
        {suppliersAnalysisLoading ? (
          <Loading message="Cargando análisis de proveedores..." size="medium" inline />
        ) : suppliersAnalysis.length === 0 ? (
          <div className="empty-state">
            <p>No hay datos suficientes para generar análisis</p>
            <p>Crea algunos pedidos y asigna proveedores para ver estadísticas</p>
          </div>
        ) : (
          <div className="suppliers-analysis">
            {/* Resumen general */}
            <div className="analysis-summary">
              <div className="summary-card">
                <div className="summary-label">Proveedores Activos</div>
                <div className="summary-value">{suppliersAnalysis.length}</div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Gasto Total</div>
                <div className="summary-value">
                  {formatCurrency(suppliersAnalysis.reduce((total, s) => total + s.totalSpent, 0))}
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Pedidos Totales</div>
                <div className="summary-value">
                  {suppliersAnalysis.reduce((total, s) => total + s.totalOrders, 0)}
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-label">Promedio Calidad</div>
                <div className="summary-value">
                  {(suppliersAnalysis.reduce((total, s) => total + s.qualityRating, 0) / suppliersAnalysis.length).toFixed(1)}★
                </div>
              </div>
            </div>

            {/* Ranking de proveedores */}
            <div className="suppliers-ranking">
              <h3>Ranking de Proveedores</h3>
              <div className="ranking-table">
                <table>
                  <thead>
                    <tr>
                      <th>Ranking</th>
                      <th>Proveedor</th>
                      <th>Pedidos</th>
                      <th>Gasto Total</th>
                      <th>Calidad</th>
                      <th>Precios</th>
                      <th>Entregas</th>
                      <th>Último Pedido</th>
                      <th>Ingredientes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliersAnalysis.map((supplier, index) => (
                      <tr key={supplier.id} className="supplier-row">
                        <td className="ranking-position">
                          <span className={`rank-badge rank-${index + 1}`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="supplier-info">
                          <div className="supplier-name">{supplier.name}</div>
                          <div className="supplier-contact">
                            {supplier.email && <small>{supplier.email}</small>}
                            {supplier.phone && <small>{supplier.phone}</small>}
                          </div>
                        </td>
                        <td className="orders-count">{supplier.totalOrders}</td>
                        <td className="total-spent">{formatCurrency(supplier.totalSpent)}</td>
                        <td className="quality-rating">
                          <div className="rating-stars">
                            {renderStars(supplier.qualityRating)}
                          </div>
                          <small>{supplier.qualityRating.toFixed(1)}</small>
                        </td>
                        <td className="price-rating">
                          <div className="rating-stars">
                            {renderStars(supplier.priceRating)}
                          </div>
                          <small>{supplier.priceRating.toFixed(1)}</small>
                        </td>
                        <td className="delivery-info">
                          {supplier.averageDeliveryTime ? (
                            <div>
                              <div>{supplier.averageDeliveryTime.toFixed(1)} días</div>
                              <small>{supplier.onTimeDeliveries.toFixed(0)}% puntual</small>
                            </div>
                          ) : (
                            <small>Sin datos</small>
                          )}
                        </td>
                        <td className="last-order">
                          {supplier.lastOrder ? 
                            new Date(supplier.lastOrder).toLocaleDateString('es-ES') : 
                            'Nunca'
                          }
                        </td>
                        <td className="ingredients-count">{supplier.ingredientsCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Comparativa detallada */}
            <div className="detailed-comparison">
              <h3>Comparativa Detallada</h3>
              <div className="comparison-grid">
                {suppliersAnalysis.map(supplier => (
                  <div key={supplier.id} className="supplier-card">
                    <div className="card-header">
                      <h4>{supplier.name}</h4>
                      <div className="overall-score">
                        {((supplier.qualityRating + supplier.priceRating) / 2).toFixed(1)}★
                      </div>
                    </div>
                    
                    <div className="card-metrics">
                      <div className="metric">
                        <span className="metric-label">Pedidos</span>
                        <span className="metric-value">{supplier.totalOrders}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Gasto</span>
                        <span className="metric-value">{formatCurrency(supplier.totalSpent)}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Ingredientes</span>
                        <span className="metric-value">{supplier.ingredientsCount}</span>
                      </div>
                    </div>

                    <div className="card-ratings">
                      <div className="rating-row">
                        <span>Calidad:</span>
                        <div className="rating-display">
                          {renderStars(supplier.qualityRating)}
                        </div>
                      </div>
                      <div className="rating-row">
                        <span>Precios:</span>
                        <div className="rating-display">
                          {renderStars(supplier.priceRating)}
                        </div>
                      </div>
                    </div>

                    {supplier.ordersByStatus && (
                      <div className="order-status-breakdown">
                        <small>Estados de pedidos:</small>
                        <div className="status-bars">
                          {supplier.ordersByStatus.delivered > 0 && (
                            <div className="status-bar delivered" title={`${supplier.ordersByStatus.delivered} entregados`}>
                              {supplier.ordersByStatus.delivered}
                            </div>
                          )}
                          {supplier.ordersByStatus.ordered > 0 && (
                            <div className="status-bar ordered" title={`${supplier.ordersByStatus.ordered} enviados`}>
                              {supplier.ordersByStatus.ordered}
                            </div>
                          )}
                          {supplier.ordersByStatus.pending > 0 && (
                            <div className="status-bar pending" title={`${supplier.ordersByStatus.pending} pendientes`}>
                              {supplier.ordersByStatus.pending}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHistory = () => {
    const getStatusIcon = (status) => {
      const statusMap = {
        pending: '📝',
        ordered: '📤', 
        delivered: '✅',
        cancelled: '❌'
      };
      return statusMap[status] || '❓';
    };

    return (
      <div className="history-section">
        <h2 className="section-title">
          <FaHistory />
          Historial y Reportes
        </h2>
        
        {historyLoading ? (
          <Loading message="Cargando datos de historial..." size="medium" inline />
        ) : historyMetrics ? (
          <>
            {/* Dashboard de métricas rápidas */}
            <div className="history-dashboard">
              <div className="metrics-overview">
                <h3>Resumen General</h3>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-icon">📊</div>
                    <div className="metric-info">
                      <div className="metric-label">Total de Pedidos</div>
                      <div className="metric-value">{historyMetrics.summary.totalOrders}</div>
                      <div className="metric-detail">Histórico completo</div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">💰</div>
                    <div className="metric-info">
                      <div className="metric-label">Volumen Total</div>
                      <div className="metric-value">{formatCurrency(historyMetrics.summary.totalAmount)}</div>
                      <div className="metric-detail">Todas las compras</div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">📈</div>
                    <div className="metric-info">
                      <div className="metric-label">Pedido Promedio</div>
                      <div className="metric-value">{formatCurrency(historyMetrics.summary.averageAmount)}</div>
                      <div className="metric-detail">Por pedido completado</div>
                    </div>
                  </div>
                  
                  <div className="metric-card">
                    <div className="metric-icon">✅</div>
                    <div className="metric-info">
                      <div className="metric-label">Tasa de Éxito</div>
                      <div className="metric-value">
                        {historyMetrics.summary.totalOrders > 0 ? 
                          Math.round((historyMetrics.summary.statusBreakdown.delivered / historyMetrics.summary.totalOrders) * 100) : 0}%
                      </div>
                      <div className="metric-detail">Pedidos entregados</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tendencias recientes */}
              <div className="trends-overview">
                <h3>Últimos 3 Meses</h3>
                <div className="trends-summary">
                  {historyMetrics.trends.supplierTrends && historyMetrics.trends.supplierTrends.length > 0 ? (
                    <div className="top-suppliers">
                      <h4>Top Proveedores</h4>
                      <div className="suppliers-mini-list">
                        {historyMetrics.trends.supplierTrends.slice(0, 3).map((supplier, index) => (
                          <div key={index} className="supplier-mini-item">
                            <span className="rank">#{index + 1}</span>
                            <div className="supplier-info">
                              <span className="name">{supplier.supplier_name}</span>
                              <span className="amount">{formatCurrency(supplier.total_spending)}</span>
                            </div>
                            <span className="orders">{supplier.total_orders} pedidos</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="no-trends">
                      <p>No hay suficientes datos para mostrar tendencias</p>
                    </div>
                  )}

                  {historyMetrics.trends.deliveryMetrics && historyMetrics.trends.deliveryMetrics.avg_delivery_days && (
                    <div className="delivery-summary">
                      <h4>Rendimiento de Entregas</h4>
                      <div className="delivery-stats">
                        <div className="delivery-stat">
                          <span className="stat-icon">⏱️</span>
                          <div className="stat-info">
                            <span className="stat-value">{Math.round(historyMetrics.trends.deliveryMetrics.avg_delivery_days)} días</span>
                            <span className="stat-label">Tiempo promedio</span>
                          </div>
                        </div>
                        <div className="delivery-stat">
                          <span className="stat-icon">🎯</span>
                          <div className="stat-info">
                            <span className="stat-value">{Math.round(historyMetrics.trends.deliveryMetrics.on_time_percentage || 0)}%</span>
                            <span className="stat-label">Entregas puntuales</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pedidos recientes */}
              <div className="recent-orders">
                <h3>Pedidos Recientes</h3>
                {historyMetrics.recentOrders && historyMetrics.recentOrders.length > 0 ? (
                  <div className="recent-orders-grid">
                    {historyMetrics.recentOrders.map(order => (
                      <div key={order.order_id} className="recent-order-card">
                        <div className="order-card-header">
                          <div className="order-badge">
                            <span className="order-number">#{order.order_id}</span>
                            <div className={`status-indicator ${order.status}`}>
                              {getStatusIcon(order.status)}
                            </div>
                          </div>
                          <div className="order-date">
                            <FaCalendarAlt className="date-icon" />
                            {new Date(order.order_date).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                        
                        <div className="order-card-body">
                          <div className="supplier-info">
                            <FaTruck className="supplier-icon" />
                            <span className="supplier-name">{order.supplier_name}</span>
                          </div>
                          
                          <div className="order-metrics">
                            <div className="metric-item">
                              <div className="metric-value">{formatCurrency(order.total_amount)}</div>
                              <div className="metric-label">Total</div>
                            </div>
                            <div className="metric-divider"></div>
                            <div className="metric-item">
                              <div className="metric-value">{order.items_count}</div>
                              <div className="metric-label">Items</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="order-card-footer">
                          <button 
                            className="view-details-btn"
                            onClick={() => handleOrderClick(order)}
                          >
                            <FaEye />
                            Ver Detalles
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-recent">
                    <p>No hay pedidos recientes</p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="error-state">
            <p>Error al cargar datos del historial</p>
          </div>
        )}

        {/* Acciones rápidas */}
        <div className="history-actions">
          <div className="actions-grid">
            <button 
              className="btn add"
              onClick={() => setShowReportsModal(true)}
            >
              <FaChartBar />
              Reportes Detallados
            </button>
            <button 
              className="btn edit"
              onClick={async () => {
                try {
                  const response = await api.get('/supplier-orders/export?format=csv', {
                    responseType: 'blob'
                  });
                  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
                  const link = document.createElement('a');
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', `pedidos_completo_${new Date().toISOString().split('T')[0]}.csv`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } catch (error) {
                  console.error('Error al exportar:', error);
                  alert('Error al exportar los datos');
                }
              }}
            >
              <FaDownload />
              Exportar Todo
            </button>
          </div>
        </div>

      </div>
    );
  };

  if (loading) {
    return (
      <div className="common-page-container">
        <div className="common-page-content">
          <Loading message="Cargando datos de pedidos..." size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="common-page-container">
      <div className="common-page-content">
        <PageHeader
          title="Pedidos"
          subtitle="Gestiona las compras de ingredientes de forma inteligente y optimizada"
        />

        <div className="supplier-orders-tabs">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <IconComponent />
                <span className="tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Dropdown para móvil */}
        <div className="supplier-orders-mobile-dropdown" ref={dropdownRef}>
          <button className="mobile-dropdown-trigger" onClick={toggleDropdown}>
            {(() => {
              const activeTabData = tabs.find(tab => tab.id === activeTab);
              const IconComponent = activeTabData?.icon;
              return (
                <>
                  <IconComponent className="mobile-dropdown-icon" />
                  <span className="mobile-dropdown-label">{activeTabData?.label}</span>
                  <FaChevronDown className={`mobile-dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                </>
              );
            })()}
          </button>
          <div className={`mobile-dropdown-menu ${isDropdownOpen ? 'open' : ''}`}>
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`mobile-dropdown-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <IconComponent className="mobile-dropdown-item-icon" />
                  <span className="mobile-dropdown-item-label">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="supplier-orders-content">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'shopping-list' && renderShoppingList()}
          {activeTab === 'active-orders' && renderActiveOrders()}
          {activeTab === 'suppliers' && renderSuppliers()}
          {activeTab === 'history' && renderHistory()}
        </div>
      </div>

      {/* Modal de edición de ingredientes */}
      <EditIngredientModal
        isOpen={isEditIngredientOpen}
        onClose={() => {
          setIsEditIngredientOpen(false);
          setSelectedIngredient(null);
        }}
        ingredient={selectedIngredient}
        onSave={handleSaveIngredient}
        onIngredientUpdated={async () => {
          console.log('🔄 Ingrediente actualizado desde modal, recargando datos...');
          // Recargar la lista de compras si estamos en esa pestaña
          if (activeTab === 'shopping-list') {
            await loadShoppingList();
          }
          // También recargar métricas del dashboard si estamos ahí
          if (activeTab === 'dashboard') {
            await loadDashboardData();
          }
        }}
      />

      {/* Modal de generación de pedidos */}
      <GenerateOrderModal
        isOpen={showGenerateOrderModal}
        onClose={() => {
          if (!isGeneratingOrders) {
            setShowGenerateOrderModal(false);
            setOrderGenerationData(null);
          }
        }}
        onConfirm={confirmGenerateOrders}
        orderData={orderGenerationData}
        isGenerating={isGeneratingOrders}
      />

      {/* Modal de detalle de pedido */}
      <OrderDetailModal
        isOpen={showOrderDetailModal}
        onClose={() => {
          setShowOrderDetailModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onStatusUpdate={updateOrderStatus}
        onDelete={deleteOrder}
      />

      {/* Modal de advertencia de proveedores */}
      <SupplierWarningModal
        isOpen={showSupplierWarningModal}
        onClose={() => {
          setShowSupplierWarningModal(false);
          setIngredientsWithoutProvider([]);
        }}
        ingredientsWithoutProvider={ingredientsWithoutProvider}
        onIngredientClick={handleIngredientRowClick}
      />

      {/* Modal de reportes */}
      <ReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
      />
    </div>
  );
};

export default SupplierOrders;