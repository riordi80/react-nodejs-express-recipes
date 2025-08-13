'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTableSort } from './useTableSort'

interface PaginationData {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationData
}

interface UsePaginatedTableOptions {
  initialPage?: number
  itemsPerPage?: number
  initialSortKey?: string
  dependencies?: any[]
  storageKey?: string // Optional key for persisting pagination state
}

interface UsePaginatedTableResult<T> {
  // Data
  data: T[]
  sortedData: T[]
  
  // Loading states
  isLoading: boolean
  isInitialized: boolean
  
  // Pagination
  pagination: PaginationData | null
  currentPage: number
  
  // Sorting
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null
  
  // Actions
  handlePageChange: (page: number) => void
  handleSort: (key: string) => void
  refresh: () => void
  
  // Error handling
  error: string | null
  setError: (error: string | null) => void
}

export function usePaginatedTable<T = any>(
  fetchFunction: (params: { page: number; limit: number; sortKey?: string; sortOrder?: 'asc' | 'desc'; [key: string]: any }) => Promise<PaginatedResponse<T>>,
  options: UsePaginatedTableOptions = {}
): UsePaginatedTableResult<T> {
  const {
    initialPage = 1,
    itemsPerPage = 20,
    initialSortKey = '',
    dependencies = [],
    storageKey
  } = options

  // Get persisted page from sessionStorage if storageKey is provided
  const getPersistedPage = (): number => {
    if (!storageKey || typeof window === 'undefined') return initialPage
    try {
      const stored = sessionStorage.getItem(`pagination-${storageKey}`)
      return stored ? parseInt(stored, 10) : initialPage
    } catch {
      return initialPage
    }
  }

  // Save current page and scroll position to sessionStorage
  const persistPage = (page: number) => {
    if (!storageKey || typeof window === 'undefined') return
    try {
      sessionStorage.setItem(`pagination-${storageKey}`, page.toString())
    } catch {
      // Silently fail if sessionStorage is not available
    }
  }

  const persistScrollPosition = () => {
    if (!storageKey || typeof window === 'undefined') return
    try {
      const scrollY = window.scrollY || window.pageYOffset
      sessionStorage.setItem(`scroll-${storageKey}`, scrollY.toString())
    } catch {
      // Silently fail if sessionStorage is not available
    }
  }

  const getPersistedScrollPosition = (): number => {
    if (!storageKey || typeof window === 'undefined') return 0
    try {
      const stored = sessionStorage.getItem(`scroll-${storageKey}`)
      return stored ? parseInt(stored, 10) : 0
    } catch {
      return 0
    }
  }

  const restoreScrollPosition = () => {
    if (!storageKey || typeof window === 'undefined') return
    try {
      const scrollY = getPersistedScrollPosition()
      if (scrollY > 0) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY)
        })
      }
    } catch {
      // Silently fail
    }
  }

  // State
  const [data, setData] = useState<T[]>([])
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [currentPage, setCurrentPage] = useState(() => getPersistedPage())
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Use ref to track current page without causing re-renders
  const currentPageRef = useRef(getPersistedPage())

  // Sorting using existing hook
  const { sortedData, sortConfig, handleSort: handleSortInternal } = useTableSort(data, initialSortKey)

  // Save scroll position when user is about to navigate away
  useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return

    const handleBeforeUnload = () => {
      persistScrollPosition()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistScrollPosition()
      }
    }

    // Save scroll position on various navigation events
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also save scroll position periodically while user is scrolling
    let scrollTimeout: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        persistScrollPosition()
      }, 150) // Debounce to avoid too many calls
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [storageKey])

  // Fetch data function
  const fetchData = useCallback(async (page = currentPageRef.current, customSortConfig = sortConfig) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const params: any = {
        page,
        limit: itemsPerPage
      }

      // Add sorting parameters if active
      if (customSortConfig) {
        params.sortKey = customSortConfig.key
        params.sortOrder = customSortConfig.direction
      }

      const response = await fetchFunction(params)
      
      setData(response.data)
      setPagination(response.pagination)
      setCurrentPage(response.pagination.currentPage)
      currentPageRef.current = response.pagination.currentPage
      
      // Persist the current page
      persistPage(response.pagination.currentPage)
      
      // Restore scroll position after data is loaded (only if this is not initial load)
      if (isInitialized) {
        // Small delay to ensure DOM is updated with new data
        setTimeout(() => {
          restoreScrollPosition()
        }, 100)
      }
    } catch (err: any) {
      console.error('Error fetching paginated data:', err)
      setError(err.message || 'Error al cargar los datos')
      setData([])
      setPagination(null)
    } finally {
      setIsLoading(false)
      setIsInitialized(true)
    }
  }, [fetchFunction, itemsPerPage])

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (!pagination || page === currentPageRef.current) return
    if (page < 1 || page > pagination.totalPages) return
    
    fetchData(page, sortConfig)
  }, [fetchData, pagination, sortConfig])

  // Handle sort with refetch
  const handleSort = useCallback((key: string) => {
    handleSortInternal(key)
    // After sorting state updates, we need to refetch from server
    // We'll do this in a useEffect watching sortConfig
  }, [handleSortInternal])

  // Refresh function
  const refresh = useCallback(() => {
    fetchData(currentPageRef.current, sortConfig)
  }, [fetchData, sortConfig])

  // Initial fetch and dependency changes
  useEffect(() => {
    const persistedPage = getPersistedPage()
    currentPageRef.current = persistedPage
    fetchData(persistedPage, null) // Start from persisted page when dependencies change
  }, dependencies)

  // Restore scroll position on initial load after data is available
  useEffect(() => {
    if (isInitialized && data.length > 0) {
      // Delay to ensure all content is rendered
      const timeoutId = setTimeout(() => {
        restoreScrollPosition()
      }, 200)
      
      return () => clearTimeout(timeoutId)
    }
  }, [isInitialized, data.length])

  // Refetch when sort changes (with slight delay to ensure sortConfig is updated)
  useEffect(() => {
    if (isInitialized && sortConfig) {
      const timeoutId = setTimeout(() => {
        const persistedPage = getPersistedPage()
        currentPageRef.current = persistedPage
        fetchData(persistedPage, sortConfig)
      }, 50)
      
      return () => clearTimeout(timeoutId)
    }
  }, [sortConfig, isInitialized])

  return {
    // Data
    data,
    sortedData: sortConfig ? data : sortedData, // Use server-side sorting when available
    
    // Loading states
    isLoading,
    isInitialized,
    
    // Pagination
    pagination,
    currentPage,
    
    // Sorting
    sortConfig,
    
    // Actions
    handlePageChange,
    handleSort,
    refresh,
    
    // Error handling
    error,
    setError
  }
}