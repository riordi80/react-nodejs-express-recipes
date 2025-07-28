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
              onNavigateToActiveOrders={() => setActiveTab('active-orders')}
              isModeDropdownOpen={isModeDropdownOpen}
              setIsModeDropdownOpen={setIsModeDropdownOpen}
            />
          )}
          {activeTab === 'active-orders' && (
            <ActiveOrdersSection
              onOrderClick={handleOrderClick}
              onUpdateOrderStatus={activeOrdersHook.updateOrderStatus}
              onDeleteOrder={activeOrdersHook.deleteOrder}
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
          // El shopping list se recargará automáticamente a través de su hook
          // El dashboard ahora maneja su propio estado
        }}
      />

      {/* Modal de generación de pedidos */}
      <GenerateOrderModal
        isOpen={shoppingListRef.current?.getModalStates()?.showGenerateOrderModal || false}
        onClose={() => {
          const handlers = shoppingListRef.current?.getModalHandlers();
          if (handlers) {
            handlers.onCloseGenerateOrderModal();
          }
        }}
        onConfirm={async (deliveryDate, notes) => {
          const handlers = shoppingListRef.current?.getModalHandlers();
          if (handlers) {
            return await handlers.onConfirmGenerateOrders(deliveryDate, notes);
          }
          return false;
        }}
        orderData={shoppingListRef.current?.getModalStates()?.orderGenerationData || null}
        isGenerating={shoppingListRef.current?.getModalStates()?.isGeneratingOrders || false}
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
    </div>
  );
};

export default SupplierOrders;