import { useState, useMemo, useEffect } from 'react'

export type SortDirection = 'asc' | 'desc' | null

export interface SortConfig {
  key: string | null
  direction: SortDirection
}

export interface SortableColumn {
  key: string
  label: string
  sortable?: boolean
}

// Get storage key for a specific table
const getStorageKey = (tableId: string) => `tableSort_${tableId}`

// Get stored sort config from sessionStorage
const getStoredSortConfig = (tableId: string): SortConfig => {
  try {
    const stored = sessionStorage.getItem(getStorageKey(tableId))
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Error reading stored sort config:', error)
  }
  return { key: null, direction: null }
}

// Save sort config to sessionStorage
const storeSortConfig = (tableId: string, config: SortConfig) => {
  try {
    sessionStorage.setItem(getStorageKey(tableId), JSON.stringify(config))
  } catch (error) {
    console.warn('Error storing sort config:', error)
  }
}

/**
 * Hook for persistent table sorting across navigation
 * @param data - Array of data to sort
 * @param tableId - Unique identifier for the table (e.g., 'events', 'recipes', 'ingredients', 'suppliers')
 * @param initialSortKey - Default sort key if no stored config exists
 * @param initialDirection - Default sort direction if no stored config exists
 */
export function usePersistentTableSort<T extends Record<string, any>>(
  data: T[],
  tableId: string,
  initialSortKey?: string,
  initialDirection: SortDirection = 'asc'
) {
  // Initialize with stored config or defaults
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    const storedConfig = getStoredSortConfig(tableId)
    
    // If we have stored config, use it; otherwise use initial values
    if (storedConfig.key) {
      return storedConfig
    }
    
    return {
      key: initialSortKey || null,
      direction: initialSortKey ? initialDirection : null
    }
  })

  // Save to sessionStorage whenever sortConfig changes
  useEffect(() => {
    storeSortConfig(tableId, sortConfig)
  }, [tableId, sortConfig])

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data
    }

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key!)
      const bValue = getNestedValue(b, sortConfig.key!)

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1
      if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1

      // Convert to comparable values
      const compareA = convertToComparable(aValue)
      const compareB = convertToComparable(bValue)

      if (compareA < compareB) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (compareA > compareB) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [data, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // Same column: toggle direction or reset
        if (prevConfig.direction === 'asc') {
          return { key, direction: 'desc' }
        } else if (prevConfig.direction === 'desc') {
          return { key: null, direction: null }
        } else {
          return { key, direction: 'asc' }
        }
      } else {
        // Different column: start with asc
        return { key, direction: 'asc' }
      }
    })
  }

  // Function to clear stored sort config (useful for reset functionality)
  const clearStoredSort = () => {
    try {
      sessionStorage.removeItem(getStorageKey(tableId))
      setSortConfig({ key: null, direction: null })
    } catch (error) {
      console.warn('Error clearing stored sort config:', error)
    }
  }

  return {
    sortedData,
    sortConfig,
    handleSort,
    clearStoredSort
  }
}

// Helper function to get nested object values (e.g., 'user.name')
function getNestedValue(obj: any, key: string): any {
  return key.split('.').reduce((o, k) => o?.[k], obj)
}

// Helper function to convert values to comparable types
function convertToComparable(value: any): any {
  if (typeof value === 'string') {
    // Normalize strings for better comparison
    return value.toLowerCase().trim()
  }
  if (value instanceof Date) {
    return value.getTime()
  }
  if (typeof value === 'number') {
    return value
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0
  }
  // For other types, convert to string
  return String(value).toLowerCase()
}