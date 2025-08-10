'use client'

import { useState, useEffect } from 'react'
import { 
  Building, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Star, 
  X, 
  Save 
} from 'lucide-react'
import { apiGet, apiPost, apiDelete, apiPut } from '@/lib/api'
import { useToastHelpers } from '@/context/ToastContext'
import Modal from './Modal'
import AddSupplierModal from './AddSupplierModal'

interface Supplier {
  supplier_id: number
  name: string
  price?: number
  delivery_time?: number
  is_preferred_supplier?: boolean
  package_size?: number
  package_unit?: string
  minimum_order_quantity?: number
}

interface SupplierManagerProps {
  entityId: number
  entityType: 'ingredient' | 'recipe' // Extensible para otros tipos
  disabled?: boolean // Cambiar de disabled a disabled para mayor claridad
  title?: string
  className?: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4
  }).format(amount)
}

export default function SupplierManager({ 
  entityId, 
  entityType, 
  disabled = false, 
  title = 'Proveedores',
  className = '' 
}: SupplierManagerProps) {
  const { success } = useToastHelpers()
  
  // States
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  // const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([])  // Not used
  const [loading, setLoading] = useState(false)
  const [editingSuppliers, setEditingSuppliers] = useState<Record<number, any>>({})
  const [expandedSupplierId, setExpandedSupplierId] = useState<number | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<{id: number, name: string} | null>(null)

  // Package unit options
  const packageUnitOptions = [
    { value: 'unidad', label: 'Unidad' },
    { value: 'caja', label: 'Caja' },
    { value: 'saco', label: 'Saco' },
    { value: 'botella', label: 'Botella' },
    { value: 'lata', label: 'Lata' },
    { value: 'paquete', label: 'Paquete' },
    { value: 'bolsa', label: 'Bolsa' },
    { value: 'bote', label: 'Bote' },
    { value: 'envase', label: 'Envase' },
    { value: 'kilogramo', label: 'Kilogramo' },
    { value: 'litro', label: 'Litro' }
  ]

  // API endpoints based on entity type
  const getEndpoints = (entityType: string, entityId: number) => {
    switch (entityType) {
      case 'ingredient':
        return {
          list: `/ingredients/${entityId}/suppliers`,
          add: `/ingredients/${entityId}/suppliers`,
          update: `/ingredients/${entityId}/suppliers`,
          delete: `/ingredients/${entityId}/suppliers`,
          preferred: `/ingredients/${entityId}/suppliers`
        }
      // Extensible para otros tipos como recetas
      default:
        throw new Error(`Unsupported entity type: ${entityType}`)
    }
  }

  const endpoints = getEndpoints(entityType, entityId)

  // Load functions (loadAllSuppliers no longer needed as AddSupplierModal handles it)

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const response = await apiGet(endpoints.list)
      setSuppliers(response.data)
      
      // Initialize editing data
      const initialEditingSuppliers: Record<number, any> = {}
      response.data.forEach((supplier: Supplier) => {
        initialEditingSuppliers[supplier.supplier_id] = {
          price: supplier.price?.toString() || '',
          delivery_time: supplier.delivery_time?.toString() || '',
          package_size: supplier.package_size?.toString() || '1',
          package_unit: supplier.package_unit || 'unidad',
          minimum_order_quantity: supplier.minimum_order_quantity?.toString() || '1'
        }
      })
      setEditingSuppliers(initialEditingSuppliers)
    } catch (err) {
      console.error('Error loading suppliers:', err)
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  // CRUD operations
  const addSupplier = async (supplierId: number) => {
    try {
      setLoading(true)
      await apiPost(endpoints.add, {
        supplier_id: supplierId,
        price: 0,
        delivery_time: null,
        package_size: 1.0,
        package_unit: 'unidad',
        minimum_order_quantity: 1.0,
        is_preferred_supplier: false
      })
      
      await loadSuppliers()
      setExpandedSupplierId(supplierId)
      setShowAddModal(false)
      success('Proveedor añadido correctamente')
    } catch (err) {
      console.error('Error adding supplier:', err)
    } finally {
      setLoading(false)
    }
  }

  const removeSupplier = async (supplierId: number) => {
    try {
      setLoading(true)
      await apiDelete(`${endpoints.delete}/${supplierId}`)
      await loadSuppliers()
      setSupplierToDelete(null)
      success('Proveedor eliminado correctamente')
    } catch (err) {
      console.error('Error removing supplier:', err)
    }
  }

  const handleDeleteClick = (supplier: Supplier) => {
    setSupplierToDelete({ id: supplier.supplier_id, name: supplier.name })
  }

  const togglePreferred = async (supplierId: number) => {
    try {
      await apiPut(`${endpoints.preferred}/${supplierId}/preferred`)
      await loadSuppliers()
      success('Proveedor preferido actualizado')
    } catch (err) {
      console.error('Error updating preferred supplier:', err)
    }
  }

  const updateSupplierField = (supplierId: number, field: string, value: string) => {
    setEditingSuppliers(prev => ({
      ...prev,
      [supplierId]: {
        ...prev[supplierId],
        [field]: value
      }
    }))
  }

  const saveSupplierData = async (supplierId: number) => {
    const supplierData = editingSuppliers[supplierId]
    if (!supplierData) return
    
    try {
      await apiPut(`${endpoints.update}/${supplierId}`, {
        price: parseFloat(supplierData.price) || 0,
        delivery_time: parseInt(supplierData.delivery_time) || null,
        package_size: parseFloat(supplierData.package_size) || 1,
        package_unit: supplierData.package_unit || 'unidad',
        minimum_order_quantity: parseFloat(supplierData.minimum_order_quantity) || 1
      })
      
      await loadSuppliers()
      success('Datos del proveedor actualizados')
    } catch (err) {
      console.error('Error updating supplier data:', err)
    }
  }

  // Effects
  useEffect(() => {
    if (entityId) {
      loadSuppliers()
    }
  }, [entityId])

  // Get assigned supplier IDs for the modal
  const assignedSupplierIds = suppliers.map(supplier => supplier.supplier_id)

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Building className="h-5 w-5 text-orange-600" />
            </div>
            {title}
          </h3>
        </div>
      )}
      
      {title && (
        <div className="flex items-center justify-between mb-4">
          <div></div>
          
          {!disabled && (
            <button
              data-supplier-add-button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
              disabled={loading}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden md:inline">Añadir proveedor</span>
              <span className="md:hidden">Añadir</span>
            </button>
          )}
        </div>
      )}
      
      {/* Botón oculto para casos sin título */}
      {!title && (
        <button
          data-supplier-add-button
          onClick={() => setShowAddModal(true)}
          className="hidden"
          disabled={loading}
        />
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Cargando proveedores...</p>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-8">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No hay proveedores asignados</p>
          <p className="text-sm text-gray-400">Añade proveedores para gestionar precios y disponibilidad</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suppliers.map(supplier => {
            const isExpanded = expandedSupplierId === supplier.supplier_id
            const editingData = editingSuppliers[supplier.supplier_id] || {}
            
            return (
              <div key={supplier.supplier_id} className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                <div 
                  className="p-4 cursor-pointer select-none"
                  onClick={() => !disabled && setExpandedSupplierId(isExpanded ? null : supplier.supplier_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {!!supplier.is_preferred_supplier && (
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{supplier.name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            Precio: <span className="font-medium">{formatCurrency(supplier.price || 0)}</span>
                          </span>
                          {supplier.delivery_time && (
                            <span className="text-sm text-gray-600">
                              Entrega: <span className="font-medium">{supplier.delivery_time} días</span>
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Indicador de expansión visible siempre */}
                      <div className="text-gray-400">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    
                    {!disabled && (
                      <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            togglePreferred(supplier.supplier_id)
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            supplier.is_preferred_supplier
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {supplier.is_preferred_supplier ? 'Preferido' : 'Hacer preferido'}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(supplier)
                          }}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Eliminar proveedor"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {isExpanded && !disabled && (
                    <div className="mt-4 pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Precio (€)
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            value={editingData.price || ''}
                            onChange={(e) => updateSupplierField(supplier.supplier_id, 'price', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tiempo entrega (días)
                          </label>
                          <input
                            type="number"
                            value={editingData.delivery_time || ''}
                            onChange={(e) => updateSupplierField(supplier.supplier_id, 'delivery_time', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="1"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Tamaño paquete
                          </label>
                          <input
                            type="number"
                            step="0.0001"
                            value={editingData.package_size || ''}
                            onChange={(e) => updateSupplierField(supplier.supplier_id, 'package_size', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="1.0"
                            title="Cantidad de unidades por paquete (ej: 12 para una docena de huevos)"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Unidad del paquete
                          </label>
                          <select
                            value={editingData.package_unit || 'unidad'}
                            onChange={(e) => updateSupplierField(supplier.supplier_id, 'package_unit', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          >
                            {packageUnitOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Cantidad mínima
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={editingData.minimum_order_quantity || ''}
                            onChange={(e) => updateSupplierField(supplier.supplier_id, 'minimum_order_quantity', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            placeholder="1.0"
                            title="Cantidad mínima de paquetes que se pueden pedir"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={() => saveSupplierData(supplier.supplier_id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <Save className="h-4 w-4" />
                          Guardar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Modal para añadir proveedor */}
      <AddSupplierModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSupplierSelect={addSupplier}
        assignedSupplierIds={assignedSupplierIds}
        loading={loading}
      />
      
      {/* Modal de confirmación para eliminar */}
      <Modal
        isOpen={!!supplierToDelete}
        onClose={() => setSupplierToDelete(null)}
        title="Confirmar eliminación"
        size="sm"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            ¿Estás seguro de que quieres eliminar el proveedor <strong>{supplierToDelete?.name}</strong>?
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Esta acción no se puede deshacer.
          </p>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setSupplierToDelete(null)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => supplierToDelete && removeSupplier(supplierToDelete.id)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}