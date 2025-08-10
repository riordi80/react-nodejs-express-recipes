import { useState, useEffect } from 'react'
import { apiGet } from '@/lib/api'

// Types
export interface ShoppingListFilters {
  includeStock: boolean
  includeConfirmed: boolean
  includePlanned: boolean
  days: number
  manual?: boolean
  selectedEventIds?: number[]
}

export interface AvailableEvent {
  event_id: number
  name: string
  event_date: string
  event_time?: string
  guests_count: number
  status: string
  recipe_count: number
}

export interface PreferredSupplier {
  supplier_id: number
  supplier_name: string
  price: number
  delivery_time?: number
  package_size: number
  package_unit: string
  minimum_order_quantity: number
  is_preferred_supplier: boolean
}

export interface AvailableIngredient {
  ingredient_id: number
  name: string
  unit: string
  base_price: number
  waste_percent: number
  net_price: number
  stock: number
  stock_minimum: number
  is_available: boolean
  preferredSupplier?: PreferredSupplier | null
}

export interface ManualOrderItem {
  id: number
  ingredientId: string
  quantity: string
  notes: string
}

export interface ShoppingListIngredient {
  ingredientId: number
  name: string
  needed: number
  neededBase: number
  wastePercent: number
  inStock: number
  toBuy: number
  unit: string
  pricePerUnit: number
  totalCost: number
  packageSize: number
  packageUnit: string
  minimumOrderQuantity: number
  supplierPrice: number
  packagesToBuy: number
  realQuantity: number
  realTotalCost: number
  supplierStatus: 'complete' | 'incomplete' | 'missing'
  notes?: string
}

export interface SupplierGroup {
  supplierId: number
  supplierName: string
  ingredients: ShoppingListIngredient[]
  supplierTotal: number
}

export interface ShoppingList {
  totalEvents: number
  dateRange: {
    from: string | null
    to: string | null
  }
  ingredientsBySupplier: SupplierGroup[]
  totalCost: number
  filters?: ShoppingListFilters
  generatedAt: string
}

export const useShoppingList = () => {
  // States for Shopping List
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null)
  const [shoppingListLoading, setShoppingListLoading] = useState(false)
  const [filters, setFilters] = useState<ShoppingListFilters>({
    includeStock: true,
    includeConfirmed: true,
    includePlanned: false,
    days: 30
  })
  
  // States for event selection
  const [availableEvents, setAvailableEvents] = useState<AvailableEvent[]>([])
  const [selectedEventIds, setSelectedEventIds] = useState<number[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [showEventSelection, setShowEventSelection] = useState(false)

  // States for manual orders
  const [showManualOrder, setShowManualOrder] = useState(false)
  const [manualOrderItems, setManualOrderItems] = useState<ManualOrderItem[]>([])
  const [availableIngredients, setAvailableIngredients] = useState<AvailableIngredient[]>([])
  const [ingredientsLoading, setIngredientsLoading] = useState(false)

  const loadAvailableEvents = async () => {
    try {
      setEventsLoading(true)
      const queryParams = new URLSearchParams({
        days: (filters.days * 2).toString() // Load more events for selection
      })
      
      const response = await apiGet<AvailableEvent[]>(`/supplier-orders/available-events?${queryParams}`)
      setAvailableEvents(response.data)
    } catch (error) {
      console.error('Error loading available events:', error)
    } finally {
      setEventsLoading(false)
    }
  }

  const loadShoppingList = async () => {
    try {
      setShoppingListLoading(true)
      
      // If in specific selection mode but no events selected, don't load
      if (showEventSelection && selectedEventIds.length === 0) {
        setShoppingList(null)
        return
      }
      
      const queryParams = new URLSearchParams({
        includeStock: filters.includeStock.toString(),
        includeConfirmed: filters.includeConfirmed.toString(),
        includePlanned: filters.includePlanned.toString(),
        days: filters.days.toString()
      })

      // If specific events are selected, add them
      if (showEventSelection && selectedEventIds.length > 0) {
        queryParams.set('eventIds', selectedEventIds.join(','))
      }

      const response = await apiGet<ShoppingList>(`/supplier-orders/shopping-list?${queryParams}`)
      setShoppingList(response.data)
    } catch (error) {
      console.error('Error loading shopping list:', error)
    } finally {
      setShoppingListLoading(false)
    }
  }

  const loadAvailableIngredients = async () => {
    try {
      setIngredientsLoading(true)
      const response = await apiGet<AvailableIngredient[]>('/ingredients')
      const ingredients = response.data.filter(ing => ing.is_available)
      
      // Load supplier information for each ingredient
      const ingredientsWithSuppliers = await Promise.all(
        ingredients.map(async (ingredient) => {
          try {
            const supplierResponse = await apiGet<PreferredSupplier[]>(`/ingredients/${ingredient.ingredient_id}/suppliers`)
            const preferredSupplier = supplierResponse.data.find(s => s.is_preferred_supplier)
            return {
              ...ingredient,
              preferredSupplier: preferredSupplier || null
            }
          } catch (error) {
            return { ...ingredient, preferredSupplier: null }
          }
        })
      )
      
      setAvailableIngredients(ingredientsWithSuppliers)
    } catch (error) {
      console.error('Error loading ingredients:', error)
    } finally {
      setIngredientsLoading(false)
    }
  }

  const handleEventSelection = (eventId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedEventIds(prev => [...prev, eventId])
    } else {
      setSelectedEventIds(prev => prev.filter(id => id !== eventId))
    }
  }

  const handleSelectAllEvents = () => {
    if (selectedEventIds.length === availableEvents.length) {
      setSelectedEventIds([])
    } else {
      setSelectedEventIds(availableEvents.map(event => event.event_id))
    }
  }

  const toggleEventSelectionMode = () => {
    setShowEventSelection(!showEventSelection)
    if (!showEventSelection) {
      setSelectedEventIds([])
    }
    setShoppingList(null) // Clear previous list when changing mode
  }

  const toggleManualOrderMode = () => {
    const newShowManualOrder = !showManualOrder
    setShowManualOrder(newShowManualOrder)
    
    if (newShowManualOrder) {
      loadAvailableIngredients()
      setShowEventSelection(false)
      setSelectedEventIds([])
      setShoppingList(null) // Clear previous list
    } else {
      setManualOrderItems([])
      setShoppingList(null) // Clear manual list
    }
  }

  const addManualOrderItem = () => {
    const newItem: ManualOrderItem = {
      id: Date.now(),
      ingredientId: '',
      quantity: '',
      notes: ''
    }
    setManualOrderItems([newItem, ...manualOrderItems])
  }

  const updateManualOrderItem = (id: number, field: keyof ManualOrderItem, value: string) => {
    setManualOrderItems(items => 
      items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  const removeManualOrderItem = (id: number) => {
    setManualOrderItems(items => items.filter(item => item.id !== id))
  }

  const generateManualShoppingList = () => {
    const validItems = manualOrderItems.filter(item => 
      item.ingredientId && item.quantity
    )

    if (validItems.length === 0) {
      return
    }

    // Convert manual items to shopping list format
    const manualSupplierGroups: { [key: number]: SupplierGroup } = {}
    
    validItems.forEach(item => {
      const ingredient = availableIngredients.find(ing => 
        ing.ingredient_id === parseInt(item.ingredientId)
      )
      
      if (!ingredient) return

      const quantity = parseFloat(item.quantity.replace(',', '.'))
      const totalCost = quantity * ingredient.base_price

      // Group by preferred supplier, or "No Supplier" if none
      const preferredSupplier = ingredient.preferredSupplier
      const supplierId = preferredSupplier?.supplier_id || 999
      const supplierName = preferredSupplier?.supplier_name || 'Sin Proveedor Asignado'

      if (!manualSupplierGroups[supplierId]) {
        manualSupplierGroups[supplierId] = {
          supplierId: supplierId,
          supplierName: supplierName,
          ingredients: [],
          supplierTotal: 0
        }
      }

      // Use preferred supplier data if available
      const packageSize = preferredSupplier?.package_size || 1
      const packageUnit = preferredSupplier ? (preferredSupplier.package_unit || ingredient.unit) : ingredient.unit
      const supplierPrice = preferredSupplier?.price || ingredient.base_price
      const minimumOrderQuantity = preferredSupplier?.minimum_order_quantity || 1
      
      // Calculate packages needed if has supplier
      let packagesToBuy = 0
      let realQuantity = quantity
      let realTotalCost = totalCost
      
      if (preferredSupplier && packageSize > 1) {
        packagesToBuy = Math.max(minimumOrderQuantity, Math.ceil(quantity / packageSize))
        realQuantity = packagesToBuy * packageSize
        realTotalCost = packagesToBuy * supplierPrice
      }

      const ingredientData: ShoppingListIngredient = {
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
      }

      manualSupplierGroups[supplierId].ingredients.push(ingredientData)
      // Use real cost if has supplier, otherwise use base cost
      const costToAdd = realTotalCost > totalCost ? realTotalCost : totalCost
      manualSupplierGroups[supplierId].supplierTotal += costToAdd
    })

    const totalCost = Object.values(manualSupplierGroups)
      .reduce((sum, group) => sum + group.supplierTotal, 0)

    const manualShoppingList: ShoppingList = {
      totalEvents: 0,
      dateRange: { from: null, to: null },
      ingredientsBySupplier: Object.values(manualSupplierGroups),
      totalCost: totalCost,
      filters: { ...filters, manual: true },
      generatedAt: new Date().toISOString()
    }

    setShoppingList(manualShoppingList)
  }

  const handleModeChange = (mode: 'automatic' | 'events' | 'manual') => {
    switch (mode) {
      case 'automatic':
        if (showEventSelection) toggleEventSelectionMode()
        if (showManualOrder) toggleManualOrderMode()
        setShoppingList(null)
        break
      case 'events':
        if (!showEventSelection) toggleEventSelectionMode()
        if (showManualOrder) toggleManualOrderMode()
        setShoppingList(null)
        break
      case 'manual':
        if (!showManualOrder) toggleManualOrderMode()
        if (showEventSelection) toggleEventSelectionMode()
        setShoppingList(null)
        break
    }
  }

  // Effects
  useEffect(() => {
    if (showEventSelection && selectedEventIds.length > 0) {
      loadShoppingList()
    }
  }, [selectedEventIds])

  useEffect(() => {
    // Reload list when changing mode
    if (!showManualOrder) {
      loadShoppingList()
    } else {
      // If changing to manual mode, clear any previous list
      setShoppingList(null)
    }
  }, [showEventSelection, showManualOrder])

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
  }
}