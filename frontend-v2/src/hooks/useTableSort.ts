import { useState, useMemo } from 'react'

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

export function useTableSort<T extends Record<string, any>>(
  data: T[],
  initialSortKey?: string,
  initialDirection: SortDirection = 'asc'
) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: initialSortKey || null,
    direction: initialDirection
  })

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

  return {
    sortedData,
    sortConfig,
    handleSort
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