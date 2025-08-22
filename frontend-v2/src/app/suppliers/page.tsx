'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePaginatedTable } from '@/hooks/usePaginatedTable'
import SortableTableHeader from '@/components/ui/SortableTableHeader'
import Pagination from '@/components/ui/Pagination'
import { usePageSize } from '@/hooks/usePageSize'
import PaginationSelector from '@/components/ui/PaginationSelector'
import { 
  Building, 
  Plus, 
  Filter, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  Edit,
  Trash2,
  Star,
  Clock,
  Power,
  PowerOff,
  Package
} from 'lucide-react'
import { apiGet, apiDelete, apiPut } from '@/lib/api'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToastHelpers } from '@/context/ToastContext'

interface Supplier {
  supplier_id: number
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  active: boolean
  created_at: string
  updated_at: string
  ingredients_count?: number
  rating?: number
  delivery_time?: number
}

export default function SuppliersPage() {
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Toast helpers
  const { success, error: showError } = useToastHelpers()
  
  
  // Page-specific pageSize with localStorage persistence
  const { pageSize, setPageSize } = usePageSize('suppliers')
  
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null)
  
  // Search input ref for autofocus
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Function to fetch paginated suppliers
  const fetchSuppliers = useCallback(async (params: { 
    page: number; 
    limit: number; 
    sortKey?: string; 
    sortOrder?: 'asc' | 'desc' 
  }) => {
    const searchParams = new URLSearchParams()
    
    // Add pagination params
    searchParams.append('page', params.page.toString())
    searchParams.append('limit', params.limit.toString())
    
    // Add sorting params
    if (params.sortKey && params.sortOrder) {
      searchParams.append('sortKey', params.sortKey)
      searchParams.append('sortOrder', params.sortOrder)
    }
    
    // Add filter params
    if (searchTerm.trim()) searchParams.append('search', searchTerm.trim())
    // Note: statusFilter will be handled client-side for now since backend doesn't support it yet
    
    const response = await apiGet<{data: Supplier[], pagination: any}>(`/suppliers?${searchParams.toString()}`)
    
    // Filter by status client-side for now
    let filteredData = response.data.data
    if (statusFilter !== 'all') {
      filteredData = filteredData.filter(supplier => 
        statusFilter === 'active' ? supplier.active : !supplier.active
      )
    }
    
    return {
      data: filteredData,
      pagination: {
        ...response.data.pagination,
        totalItems: filteredData.length // Adjust count for client-side filtering
      }
    }
  }, [searchTerm, statusFilter])

  // Use paginated table hook
  const {
    sortedData: sortedSuppliers,
    isLoading: loading,
    pagination,
    sortConfig,
    handlePageChange,
    handleSort,
    refresh
  } = usePaginatedTable(fetchSuppliers, {
    initialPage: 1,
    itemsPerPage: pageSize,
    initialSortKey: 'name',
    dependencies: [searchTerm, statusFilter, pageSize],
    storageKey: 'suppliers-page',
    tableId: 'suppliers'
  })

  // Initialize app - single effect to prevent multiple renders
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize any required data here
        await new Promise(resolve => setTimeout(resolve, 100)) // Pequeño delay para asegurar que el DOM está listo
      } catch {
        console.error('Fixed error in catch block')
      } finally {
        setIsInitialized(true)
      }
    }

    initializeApp()
  }, [])

  // Autofocus search input after initialization (desktop only)
  useEffect(() => {
    if (isInitialized && searchInputRef.current) {
      // Only autofocus on desktop devices
      const isMobile = window.innerWidth < 768 || 'ontouchstart' in window
      if (!isMobile) {
        searchInputRef.current.focus()
      }
    }
  }, [isInitialized])


  // Delete modal handlers
  const openDeleteModal = (supplier: Supplier) => {
    setCurrentSupplier(supplier)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!currentSupplier) return
    
    try {
      await apiDelete(`/suppliers/${currentSupplier.supplier_id}`)
      // Refresh suppliers after deletion
      refresh()
      setIsDeleteOpen(false)
      setCurrentSupplier(null)
      
      // Show success toast
      success(`Proveedor "${currentSupplier.name}" eliminado correctamente`, 'Proveedor Eliminado')
    } catch {
      console.error('Fixed error in catch block')
      // Show error toast
      showError('No se pudo eliminar el proveedor. Intente nuevamente.', 'Error al Eliminar')
      // Keep modal open on error
    }
  }

  // Toggle supplier status
  const toggleSupplierStatus = async (supplier: Supplier, event: React.MouseEvent) => {
    // Prevent row click navigation
    event.stopPropagation()
    
    const newActiveStatus = !supplier.active

    try {
      // Use the same data structure as the detail page
      const supplierUpdateData = {
        name: supplier.name,
        phone: supplier.phone || null,
        email: supplier.email || null,
        website_url: null, // This field might not be available in the list
        address: supplier.address || null,
        contact_person: supplier.contact_person || null,
        notes: supplier.notes || null,
        active: newActiveStatus
      }
      
      await apiPut(`/suppliers/${supplier.supplier_id}`, supplierUpdateData)
      
      // Refresh the table to get updated data
      refresh()
      
      success(
        `Proveedor "${supplier.name}" ${newActiveStatus ? 'activado' : 'desactivado'} correctamente`,
        'Estado Actualizado'
      )
    } catch {
      showError('Error al cambiar el estado del proveedor', 'Error')
      console.error('Fixed error in catch block')
    }
  }


  if (!isInitialized) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-[60px] z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Building className="h-5 w-5 text-orange-600" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Proveedores</h1>
          </div>
          
          <Link
            href="/suppliers/new"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="md:hidden">Añadir</span>
          </Link>
        </div>
      </div>

      <div className="p-6">
        {/* Desktop Header */}
        <div className="hidden md:block mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Building className="h-8 w-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
            </div>
            <p className="text-gray-600">
              Gestiona tus proveedores y relaciones comerciales
            </p>
          </div>
          
          <Link
            href="/suppliers/new"
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Nuevo Proveedor</span>
          </Link>
        </div>
      </div>


      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar proveedores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo activos</option>
              <option value="inactive">Solo inactivos</option>
            </select>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableTableHeader sortKey="name" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                  Proveedor
                </SortableTableHeader>
                <SortableTableHeader sortKey="" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort} sortable={false}>
                  Contacto
                </SortableTableHeader>
                <SortableTableHeader sortKey="" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort} sortable={false}>
                  Información
                </SortableTableHeader>
                <SortableTableHeader sortKey="ingredients_count" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                  Ingredientes
                </SortableTableHeader>
                <SortableTableHeader sortKey="active" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort}>
                  Estado
                </SortableTableHeader>
                <SortableTableHeader sortKey="" sortConfig={sortConfig || { key: '', direction: 'asc' }} onSort={handleSort} sortable={false} className="text-right">
                  Acciones
                </SortableTableHeader>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSuppliers.map((supplier) => (
                <tr 
                  key={supplier.supplier_id} 
                  onClick={() => router.push(`/suppliers/${supplier.supplier_id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                          <Building className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link 
                          href={`/suppliers/${supplier.supplier_id}`}
                          className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors cursor-pointer"
                        >
                          {supplier.name}
                        </Link>
                        {supplier.contact_person && (
                          <div className="text-sm text-gray-500">
                            {supplier.contact_person}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {supplier.email && (
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate max-w-48">{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center text-sm text-gray-900">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {supplier.address && (
                        <div className="flex items-start text-sm text-gray-900">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="truncate max-w-32">{supplier.address}</span>
                        </div>
                      )}
                      {supplier.delivery_time && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{supplier.delivery_time} días</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {supplier.ingredients_count || 0}
                      </span>
                      {supplier.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">
                            {supplier.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      onClick={(e) => toggleSupplierStatus(supplier, e)}
                      className={`p-2 rounded-full transition-colors ${
                        supplier.active 
                          ? 'text-green-600 hover:text-green-800 hover:bg-gray-100' 
                          : 'text-red-600 hover:text-red-800 hover:bg-gray-100'
                      }`}
                      title={supplier.active ? 'Desactivar proveedor' : 'Activar proveedor'}
                    >
                      {supplier.active ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link 
                        href={`/suppliers/${supplier.supplier_id}`}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                        title="Editar proveedor"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          openDeleteModal(supplier)
                        }}
                        className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors"
                        title="Eliminar proveedor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {sortedSuppliers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay proveedores
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'No se encontraron proveedores con los filtros aplicados'
                : 'Comienza añadiendo tu primer proveedor'
              }
            </p>
            <Link
              href="/suppliers/new"
              className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4 mr-1" />
              {searchTerm || statusFilter !== 'all' 
                ? 'Añadir Nuevo Proveedor' 
                : 'Añadir Primer Proveedor'
              }
            </Link>
          </div>
        )}
      </div>

      {/* Results Counter, Page Size Selector and Pagination */}
      {pagination && (
        <div className="mt-6 flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="text-sm text-gray-600">
              Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de {pagination.totalItems} proveedores
            </div>
            
            <PaginationSelector
              currentPageSize={pageSize}
              onPageSizeChange={setPageSize}
              totalItems={pagination.totalItems}
            />
          </div>
          
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar el proveedor "${currentSupplier?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
      </div>
    </>
  )
}