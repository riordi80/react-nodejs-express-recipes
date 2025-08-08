'use client'

import { useEffect, forwardRef, useImperativeHandle } from 'react'
import { List } from 'lucide-react'
import { useShoppingList } from '../hooks/useShoppingList'

// Components
import ModeSelector from './ModeSelector'
import ShoppingFilters from './ShoppingFilters'
import EventSelection from './EventSelection'
import ManualOrderForm from './ManualOrderForm'
import ShoppingResults from './ShoppingResults'

interface ShoppingListSectionProps {
  onIngredientRowClick: (ingredientId: number) => void
  onNavigateToActiveOrders: () => void
  isModeDropdownOpen: boolean
  setIsModeDropdownOpen: (open: boolean) => void
  onGenerateOrders: (shoppingList: any, showEventSelection: boolean) => void
}

export interface ShoppingListSectionRef {
  getModalStates: () => {
    showGenerateOrderModal: boolean
    orderGenerationData: any
    isGeneratingOrders: boolean
    showSupplierWarningModal: boolean
    ingredientsWithoutProvider: any[]
  }
  getModalHandlers: () => {
    onCloseGenerateOrderModal: () => void
    onConfirmGenerateOrders: (deliveryDate: string, notes: string) => Promise<boolean>
    onCloseSupplierWarningModal: () => void
  }
  refreshData: () => void
}

const ShoppingListSection = forwardRef<ShoppingListSectionRef, ShoppingListSectionProps>(({ 
  onIngredientRowClick,
  onNavigateToActiveOrders,
  isModeDropdownOpen,
  setIsModeDropdownOpen,
  onGenerateOrders
}, ref) => {
  const shoppingListHook = useShoppingList()

  // Expose modal states to parent component
  useImperativeHandle(ref, () => ({
    getModalStates: () => ({
      showGenerateOrderModal: false, // Handled in parent now
      orderGenerationData: null,
      isGeneratingOrders: false,
      showSupplierWarningModal: false, // Will be implemented
      ingredientsWithoutProvider: []
    }),
    getModalHandlers: () => ({
      onCloseGenerateOrderModal: () => {
        // Handled in parent component
      },
      onConfirmGenerateOrders: async (deliveryDate: string, notes: string) => {
        // This function is now handled in the main component
        // Redirection is done automatically after generating the order
        return true
      },
      onCloseSupplierWarningModal: () => {
        // Will be implemented
      }
    }),
    // Expose reload functions to refresh from main component
    refreshData: () => {
      shoppingListHook.loadShoppingList()
      shoppingListHook.loadAvailableIngredients()
    }
  }), [shoppingListHook, onNavigateToActiveOrders])

  // Load events when component mounts or when switching to shopping list
  useEffect(() => {
    shoppingListHook.loadAvailableEvents()
    shoppingListHook.loadShoppingList()
  }, [])

  // Load shopping list when filters change
  useEffect(() => {
    shoppingListHook.loadShoppingList()
  }, [shoppingListHook.filters])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="bg-orange-100 p-2 rounded-lg">
          <List className="h-6 w-6 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Lista de Compras Inteligente</h2>
      </div>

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
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">Generando lista de compras...</span>
        </div>
      ) : shoppingListHook.showEventSelection && shoppingListHook.selectedEventIds.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
          <List className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona eventos</h3>
          <p className="text-gray-500">Selecciona uno o más eventos para generar la lista de compras</p>
        </div>
      ) : shoppingListHook.showManualOrder && shoppingListHook.manualOrderItems.length === 0 ? (
        null // Don't show anything in manual mode without items
      ) : shoppingListHook.showManualOrder && (!shoppingListHook.shoppingList || !shoppingListHook.shoppingList.filters?.manual) ? (
        null // Don't show non-manual lists when in manual mode
      ) : shoppingListHook.shoppingList ? (
        <ShoppingResults
          shoppingList={shoppingListHook.shoppingList}
          isGeneratingOrders={false} // Now handled in main component
          onIngredientRowClick={onIngredientRowClick}
          onGenerateOrders={() => onGenerateOrders(shoppingListHook.shoppingList, shoppingListHook.showEventSelection)}
        />
      ) : null}
    </div>
  )
})

ShoppingListSection.displayName = 'ShoppingListSection'

export default ShoppingListSection