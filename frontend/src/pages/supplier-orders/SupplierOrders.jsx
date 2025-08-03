// src/pages/supplier-orders/SupplierOrders.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaTruck, FaEuroSign, FaBoxOpen, FaExclamationTriangle, FaListUl, FaHistory, FaChartBar, FaChevronDown, FaCheckCircle, FaTimesCircle, FaQuestionCircle, FaClock, FaTh, FaTable, FaFilter, FaSearch } from 'react-icons/fa';
import PageHeader from '../../components/page-header/PageHeader';
import { useSettings } from '../../context/SettingsContext';
import Loading from '../../components/loading';
import api from '../../api/axios';
import EditIngredientModal from '../../components/modals/EditIngredientModal';
import GenerateOrderModal from '../../components/modals/GenerateOrderModal';
import OrderDetailModal from '../../components/modals/OrderDetailModal';
import SupplierWarningModal from '../../components/modals/SupplierWarningModal';
import ReportsModal from '../../components/modals/ReportsModal';
import Modal from '../../components/modal/Modal';
import ConfirmModal from '../../components/modals/ConfirmModal';
import ActiveOrdersSection from './components/ActiveOrdersSection';
import DashboardSection from './components/DashboardSection';
import ShoppingListSection from './components/ShoppingListSection';
import SuppliersSection from './components/SuppliersSection';
import HistorySection from './components/HistorySection';
import { useActiveOrders } from './hooks/useActiveOrders';
import './SupplierOrders.css';

const SupplierOrders = () => {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const modeDropdownRef = useRef(null);
  const shoppingListRef = useRef(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para modal de edición de ingredientes
  const [isEditIngredientOpen, setIsEditIngredientOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // Hook para pedidos activos (reemplaza múltiples estados)
  const activeOrdersHook = useActiveOrders();
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);



  // Estados para modal de reportes
  const [showReportsModal, setShowReportsModal] = useState(false);

  // Estados para generación de pedidos (movidos desde el hook)
  const [isGeneratingOrders, setIsGeneratingOrders] = useState(false);
  const [showGenerateOrderModal, setShowGenerateOrderModal] = useState(false);
  const [orderGenerationData, setOrderGenerationData] = useState(null);

  // Estados para modal de confirmación de ingredientes sin proveedor
  const [showNoProviderModal, setShowNoProviderModal] = useState(false);
  const [showNoSuppliersModal, setShowNoSuppliersModal] = useState(false);


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
    // El dashboard ahora se carga en su propio componente
    setLoading(false);
  }, []);

  // Todas las secciones (pedidos activos, shopping list, suppliers e historial) 
  // se manejan ahora en sus respectivos hooks/componentes


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
      
      // El shopping list y dashboard ahora manejan su propio estado
      
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




  // Abrir detalle de pedido (ahora usa el hook)
  const handleOrderClick = async (orderId) => {
    const orderDetail = await activeOrdersHook.loadOrderDetail(orderId);
    if (orderDetail) {
      setShowOrderDetailModal(true);
    }
  };

  // Función para manejar la generación de pedidos (restaurada del archivo original)
  const handleGenerateOrders = (shoppingList, showEventSelection) => {
    if (!shoppingList || !shoppingList.ingredientsBySupplier || shoppingList.ingredientsBySupplier.length === 0) {
      return;
    }

    // Verificar si hay ingredientes sin proveedor asignado (excluir pedidos manuales)
    const suppliersWithoutProvider = shoppingList.ingredientsBySupplier.filter(
      supplier => supplier.supplierName === 'Sin Proveedor Asignado'
    );

    if (suppliersWithoutProvider.length > 0) {
      setShowNoProviderModal(true);
      return;
    }

    // Solo generar pedidos para proveedores reales y pedidos manuales (filtrar solo sin proveedor asignado)
    const realSuppliers = shoppingList.ingredientsBySupplier.filter(
      supplier => supplier.supplierName !== 'Sin Proveedor Asignado'
    );

    if (realSuppliers.length === 0) {
      setShowNoSuppliersModal(true);
      return;
    }

    setOrderGenerationData({
      suppliers: realSuppliers,
      totalCost: realSuppliers.reduce((total, supplier) => total + supplier.supplierTotal, 0),
      generatedFrom: shoppingList.filters?.manual ? 'manual' : 
                    (showEventSelection ? 'events' : 'shopping-list'),
      sourceEventIds: shoppingList.filters?.selectedEventIds || []
    });
    setShowGenerateOrderModal(true);
  };

  // Función para confirmar generación de pedidos (restaurada del archivo original)
  const confirmGenerateOrders = async (deliveryDate, notes) => {
    if (!orderGenerationData) return false;

    try {
      setIsGeneratingOrders(true);
      
      const response = await api.post('/supplier-orders/generate', {
        suppliers: orderGenerationData.suppliers,
        deliveryDate: deliveryDate || null,
        notes: notes || '',
        generatedFrom: orderGenerationData.generatedFrom,
        sourceEventIds: orderGenerationData.sourceEventIds || []
      });

      if (response.data.success) {
        // Recargar pedidos activos antes de cambiar de tab
        await activeOrdersHook.loadActiveOrders();
        
        // Cambiar a la pestaña de pedidos activos para ver los pedidos creados
        setActiveTab('active-orders');
        
        // Cerrar modal y limpiar datos
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
          {activeTab === 'dashboard' && (
            <DashboardSection onNavigateToTab={setActiveTab} />
          )}
          {activeTab === 'shopping-list' && (
            <ShoppingListSection
              ref={shoppingListRef}
              onIngredientRowClick={handleIngredientRowClick}
              onNavigateToActiveOrders={async () => {
                // Recargar pedidos activos antes de cambiar de tab
                await activeOrdersHook.loadActiveOrders();
                setActiveTab('active-orders');
              }}
              isModeDropdownOpen={isModeDropdownOpen}
              setIsModeDropdownOpen={setIsModeDropdownOpen}
              onGenerateOrders={handleGenerateOrders}
            />
          )}
          {activeTab === 'active-orders' && (
            <ActiveOrdersSection
              onOrderClick={handleOrderClick}
              onUpdateOrderStatus={activeOrdersHook.updateOrderStatus}
              onDeleteOrder={activeOrdersHook.deleteOrder}
              activeOrders={activeOrdersHook.activeOrders}
              activeOrdersLoading={activeOrdersHook.activeOrdersLoading}
              activeOrdersFilters={activeOrdersHook.activeOrdersFilters}
              setActiveOrdersFilters={activeOrdersHook.setActiveOrdersFilters}
              message={activeOrdersHook.message}
              messageType={activeOrdersHook.messageType}
            />
          )}
          {activeTab === 'suppliers' && <SuppliersSection />}
          {activeTab === 'history' && (
            <HistorySection 
              onOrderClick={handleOrderClick}
              onShowReportsModal={() => setShowReportsModal(true)}
            />
          )}
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
          // Refrescar la lista de compras y ingredientes disponibles
          if (shoppingListRef.current?.refreshData) {
            shoppingListRef.current.refreshData();
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
          activeOrdersHook.setSelectedOrder(null);
        }}
        order={activeOrdersHook.selectedOrder}
        onStatusUpdate={activeOrdersHook.updateOrderStatus}
        onDelete={activeOrdersHook.deleteOrder}
      />

      {/* Modal de advertencia de proveedores */}
      <SupplierWarningModal
        isOpen={shoppingListRef.current?.getModalStates()?.showSupplierWarningModal || false}
        onClose={() => {
          const handlers = shoppingListRef.current?.getModalHandlers();
          if (handlers) {
            handlers.onCloseSupplierWarningModal();
          }
        }}
        ingredientsWithoutProvider={shoppingListRef.current?.getModalStates()?.ingredientsWithoutProvider || []}
        onIngredientClick={handleIngredientRowClick}
      />

      {/* Modal de reportes */}
      <ReportsModal
        isOpen={showReportsModal}
        onClose={() => setShowReportsModal(false)}
      />

      {/* Modal de confirmación de eliminación de pedido */}
      <ConfirmModal
        isOpen={activeOrdersHook.isDeleteModalOpen}
        onClose={activeOrdersHook.closeDeleteModal}
        onConfirm={activeOrdersHook.confirmDeleteOrder}
        title="Confirmar Eliminación"
        message={
          activeOrdersHook.orderToDelete 
            ? `¿Estás seguro de que deseas eliminar el pedido #${activeOrdersHook.orderToDelete.order_id} del proveedor ${activeOrdersHook.orderToDelete.supplier_name}? Esta acción no se puede deshacer.`
            : '¿Estás seguro de que deseas eliminar este pedido?'
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Modal de advertencia: ingredientes sin proveedor */}
      <Modal
        isOpen={showNoProviderModal}
        onClose={() => setShowNoProviderModal(false)}
        title="⚠️ Ingredientes sin proveedor"
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ 
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
              Todos los ingredientes deben tener proveedor asignado. Corrige los ingredientes que faltan.
            </p>
          </div>
          
          <button 
            type="button" 
            className="btn edit" 
            onClick={() => setShowNoProviderModal(false)}
            style={{ minWidth: '120px' }}
          >
            Entendido
          </button>
        </div>
      </Modal>

      {/* Modal de advertencia: no hay proveedores asignados */}
      <Modal
        isOpen={showNoSuppliersModal}
        onClose={() => setShowNoSuppliersModal(false)}
        title="❌ Sin proveedores"
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ 
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <p style={{ margin: 0, color: '#b91c1c', fontSize: '14px' }}>
              No hay ingredientes con proveedores asignados para generar pedidos.
            </p>
          </div>
          
          <button 
            type="button" 
            className="btn edit" 
            onClick={() => setShowNoSuppliersModal(false)}
            style={{ minWidth: '120px' }}
          >
            Entendido
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default SupplierOrders;