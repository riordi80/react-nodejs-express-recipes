'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Truck, 
  Building2,
  MapPin,
  Phone,
  Mail,
  CheckCircle
} from 'lucide-react'
import Modal from './Modal'
import { apiGet } from '@/lib/api'

interface Supplier {
  supplier_id: number
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  website?: string
  notes?: string
  is_active: boolean
}

interface AddSupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onSupplierSelect: (supplierId: number) => void
  assignedSupplierIds: number[]
  loading?: boolean
}

export default function AddSupplierModal({ 
  isOpen, 
  onClose, 
  onSupplierSelect, 
  assignedSupplierIds,
  loading = false 
}: AddSupplierModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(null)

  // Load all suppliers
  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true)
      const response = await apiGet('/suppliers')
      console.log('Suppliers loaded:', response.data)
      console.log('Assigned supplier IDs:', assignedSupplierIds)
      setSuppliers(response.data)
    } catch (err) {
      console.error('Error loading suppliers:', err)
      setSuppliers([])
    } finally {
      setLoadingSuppliers(false)
    }
  }

  // Filter suppliers based on search term and exclude already assigned ones
  useEffect(() => {
    let filtered = suppliers.filter(supplier => 
      !assignedSupplierIds.includes(supplier.supplier_id) &&
      (supplier.is_active !== false) // Include if is_active is true, null, or undefined
    )

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(supplier =>
        supplier.name.toLowerCase().includes(search) ||
        supplier.contact_person?.toLowerCase().includes(search) ||
        supplier.city?.toLowerCase().includes(search) ||
        supplier.email?.toLowerCase().includes(search)
      )
    }

    console.log('Filtered suppliers:', filtered.length, 'out of', suppliers.length)
    setFilteredSuppliers(filtered)
  }, [suppliers, searchTerm, assignedSupplierIds])

  // Load suppliers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSuppliers()
      setSearchTerm('')
      setSelectedSupplierId(null)
    }
  }, [isOpen])

  const handleSupplierSelect = (supplierId: number) => {
    setSelectedSupplierId(supplierId)
  }

  const handleConfirmSelection = () => {
    if (selectedSupplierId) {
      onSupplierSelect(selectedSupplierId)
      onClose()
    }
  }

  const handleCancel = () => {
    setSearchTerm('')
    setSelectedSupplierId(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Añadir Proveedor"
      size="lg"
      className="max-h-[80vh]"
    >
      <div className="p-6">
        {/* Buscador */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, contacto, ciudad o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de proveedores */}
        <div className="mb-6">
          {loadingSuppliers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Cargando proveedores...</p>
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchTerm ? 'No se encontraron proveedores' : 'No hay proveedores disponibles'}
              </p>
              <p className="text-sm text-gray-400">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Todos los proveedores activos ya están asignados'}
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.supplier_id}
                  onClick={() => handleSupplierSelect(supplier.supplier_id)}
                  className={`
                    relative p-4 border rounded-lg cursor-pointer transition-all duration-200
                    ${selectedSupplierId === supplier.supplier_id
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {/* Checkmark para proveedor seleccionado */}
                  {selectedSupplierId === supplier.supplier_id && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="h-5 w-5 text-orange-600" />
                    </div>
                  )}

                  <div className="pr-8">
                    {/* Nombre del proveedor */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-orange-100 p-2 rounded-lg">
                        <Building2 className="h-4 w-4 text-orange-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">{supplier.name}</h4>
                    </div>

                    {/* Información adicional */}
                    <div className="ml-11 space-y-1">
                      {supplier.contact_person && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>Contacto: {supplier.contact_person}</span>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        {supplier.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{supplier.city}</span>
                          </div>
                        )}
                        
                        {supplier.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                        
                        {supplier.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{supplier.email}</span>
                          </div>
                        )}
                      </div>

                      {supplier.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          {supplier.notes.length > 100 
                            ? `${supplier.notes.substring(0, 100)}...` 
                            : supplier.notes
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información de selección */}
        {selectedSupplierId && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Proveedor seleccionado: {filteredSuppliers.find(s => s.supplier_id === selectedSupplierId)?.name}
              </span>
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Se añadirá al ingrediente con valores por defecto que podrás editar después.
            </p>
          </div>
        )}
      </div>

      {/* Footer con botones */}
      <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          onClick={handleConfirmSelection}
          disabled={!selectedSupplierId || loading}
          className={`
            px-4 py-2 rounded-lg font-medium transition-colors
            ${selectedSupplierId && !loading
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {loading ? 'Añadiendo...' : 'Añadir Proveedor'}
          </div>
        </button>
      </div>
    </Modal>
  )
}