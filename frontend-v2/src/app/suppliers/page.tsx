'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { 
  Building, 
  Plus, 
  Filter, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  Eye,
  Edit,
  Trash2,
  Star,
  Clock,
  Package
} from 'lucide-react'
import { apiGet, apiDelete } from '@/lib/api'
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
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  
  // Toast helpers
  const { success, error: showError } = useToastHelpers()
  
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [currentSupplier, setCurrentSupplier] = useState<Supplier | null>(null)
  
  // Search input ref for autofocus
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Stats
  const [stats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withIngredients: 0
  })

  // Load suppliers
  useEffect(() => {
    loadSuppliers()
    // loadStats() // TODO: Implementar ruta /suppliers/stats en backend
  }, [])

  // Autofocus search input on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }, 100) // Pequeño delay para asegurar que el DOM está listo
    
    return () => clearTimeout(timer)
  }, [])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const response = await apiGet<Supplier[]>('/suppliers')
      setSuppliers(response.data)
    } catch (err: unknown) {
      console.error('Error loading suppliers:', err)
      showError('Error al cargar proveedores', 'Error de Carga')
    } finally {
      setLoading(false)
    }
  }

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
      await loadSuppliers()
      setIsDeleteOpen(false)
      setCurrentSupplier(null)
      
      // Show success toast
      success(`Proveedor "${currentSupplier.name}" eliminado correctamente`, 'Proveedor Eliminado')
    } catch (error) {
      console.error('Error al eliminar proveedor:', error)
      // Show error toast
      showError('No se pudo eliminar el proveedor. Intente nuevamente.', 'Error al Eliminar')
      // Keep modal open on error
    }
  }

  // Filter suppliers locally (memoized)
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const matchesSearch = (supplier.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (supplier.contact_person || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (supplier.email || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      let matchesStatus = true
      if (statusFilter === 'active') matchesStatus = supplier.active
      if (statusFilter === 'inactive') matchesStatus = !supplier.active
      
      return matchesSearch && matchesStatus
    })
  }, [suppliers, searchTerm, statusFilter])

  if (loading) {
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Building className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Building className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inactivos</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Building className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con Ingredientes</p>
              <p className="text-2xl font-bold text-blue-600">{stats.withIngredients}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </div>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Información
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingredientes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.supplier_id} className="hover:bg-gray-50">
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      supplier.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {supplier.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link 
                        href={`/suppliers/${supplier.supplier_id}`}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                        title="Ver proveedor"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link 
                        href={`/suppliers/${supplier.supplier_id}`}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded transition-colors"
                        title="Editar proveedor"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button 
                        onClick={() => openDeleteModal(supplier)}
                        className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
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
        {filteredSuppliers.length === 0 && !loading && (
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
              Añadir Primer Proveedor
            </Link>
          </div>
        )}
      </div>

      {/* Results Counter */}
      {filteredSuppliers.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredSuppliers.length} de {suppliers.length} proveedores
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