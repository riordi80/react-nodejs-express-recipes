// src/pages/supplier-orders/components/ShoppingListSection.jsx
import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { FaListUl } from 'react-icons/fa';
import Loading from '../../../components/loading';
import ModeSelector from './ModeSelector';
import ShoppingFilters from './ShoppingFilters';
import EventSelection from './EventSelection';
import ManualOrderForm from './ManualOrderForm';
import ShoppingResults from './ShoppingResults';
import { useShoppingList } from '../hooks/useShoppingList';

const ShoppingListSection = forwardRef(({ 
  onIngredientRowClick,
  onNavigateToActiveOrders,
  isModeDropdownOpen,
  setIsModeDropdownOpen,
  onGenerateOrders
}, ref) => {
  const shoppingListHook = useShoppingList();

  // Expose modal states to parent component
  useImperativeHandle(ref, () => ({
    getModalStates: () => ({
      showGenerateOrderModal: shoppingListHook.showGenerateOrderModal,
      orderGenerationData: shoppingListHook.orderGenerationData,
      isGeneratingOrders: shoppingListHook.isGeneratingOrders,
      showSupplierWarningModal: shoppingListHook.showSupplierWarningModal,
      ingredientsWithoutProvider: shoppingListHook.ingredientsWithoutProvider
    }),
    getModalHandlers: () => ({
      onCloseGenerateOrderModal: () => {
        if (!shoppingListHook.isGeneratingOrders) {
          shoppingListHook.setShowGenerateOrderModal(false);
          shoppingListHook.setOrderGenerationData(null);
        }
      },
      onConfirmGenerateOrders: async (deliveryDate, notes) => {
        // Esta función se maneja ahora en el componente principal
        // La redirección se hace automáticamente después de generar el pedido
        return true;
      },
      onCloseSupplierWarningModal: () => {
        shoppingListHook.setShowSupplierWarningModal(false);
        shoppingListHook.setIngredientsWithoutProvider([]);
      }
    }),
    // Exponer funciones de recarga para refrescar desde el componente principal
    refreshData: () => {
      shoppingListHook.loadShoppingList();
      shoppingListHook.loadAvailableIngredients();
    }
  }), [shoppingListHook, onNavigateToActiveOrders]);

  // Load events when component mounts or when switching to shopping list
  useEffect(() => {
    shoppingListHook.loadAvailableEvents();
    shoppingListHook.loadShoppingList();
  }, []);

  // Load shopping list when filters change
  useEffect(() => {
    shoppingListHook.loadShoppingList();
  }, [shoppingListHook.filters]);

  return (
    <div className="shopping-list-section">
      <h2 className="section-title">
        <FaListUl />
        Lista de Compras Inteligente
      </h2>

      {/* Mode Selector */}
      <ModeSelector
        showEventSelection={shoppingListHook.showEventSelection}
        showManualOrder={shoppingListHook.showManualOrder}
        onModeChange={shoppingListHook.handleModeChange}
        isModeDropdownOpen={isModeDropdownOpen}
        setIsModeDropdownOpen={setIsModeDropdownOpen}
      />
      
      {/* Filters */}
      <ShoppingFilters
        filters={shoppingListHook.filters}
        onFiltersChange={shoppingListHook.setFilters}
        showEventSelection={shoppingListHook.showEventSelection}
        showManualOrder={shoppingListHook.showManualOrder}
      />
      
      {/* Event Selection */}
      {shoppingListHook.showEventSelection && (
        <EventSelection
          availableEvents={shoppingListHook.availableEvents}
          selectedEventIds={shoppingListHook.selectedEventIds}
          eventsLoading={shoppingListHook.eventsLoading}
          onEventSelection={shoppingListHook.handleEventSelection}
          onSelectAllEvents={shoppingListHook.handleSelectAllEvents}
        />
      )}

      {/* Manual Order Form */}
      {shoppingListHook.showManualOrder && (
        <ManualOrderForm
          manualOrderItems={shoppingListHook.manualOrderItems}
          availableIngredients={shoppingListHook.availableIngredients}
          ingredientsLoading={shoppingListHook.ingredientsLoading}
          onAddItem={shoppingListHook.addManualOrderItem}
          onUpdateItem={shoppingListHook.updateManualOrderItem}
          onRemoveItem={shoppingListHook.removeManualOrderItem}
          onGenerateList={shoppingListHook.generateManualShoppingList}
        />
      )}

      {/* Results */}
      {shoppingListHook.shoppingListLoading ? (
        <Loading message="Generando lista de compras..." size="medium" />
      ) : shoppingListHook.showEventSelection && shoppingListHook.selectedEventIds.length === 0 ? (
        <div className="empty-state">
          <p>Selecciona uno o más eventos para generar la lista de compras</p>
        </div>
      ) : shoppingListHook.showManualOrder && shoppingListHook.manualOrderItems.length === 0 ? (
        null // No mostrar nada en modo manual sin items
      ) : shoppingListHook.showManualOrder && (!shoppingListHook.shoppingList || !shoppingListHook.shoppingList.filters?.manual) ? (
        null // No mostrar listas no-manuales cuando estamos en modo manual
      ) : shoppingListHook.shoppingList ? (
        <ShoppingResults
          shoppingList={shoppingListHook.shoppingList}
          isGeneratingOrders={false} // Ahora se maneja en el componente principal
          onIngredientRowClick={onIngredientRowClick}
          onGenerateOrders={() => onGenerateOrders(shoppingListHook.shoppingList, shoppingListHook.showEventSelection)}
        />
      ) : null}
    </div>
  );
});

ShoppingListSection.displayName = 'ShoppingListSection';

export default ShoppingListSection;