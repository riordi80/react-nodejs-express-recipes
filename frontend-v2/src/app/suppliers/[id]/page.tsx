'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Trash2, 
  Save, 
  X, 
  Users,
  Building,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Globe,
  Package,
  Star,
  Clock,
  Info,
  Plus,
  Edit,
  Trash2 as Trash,
  FileText,
  History
} from 'lucide-react'
import { apiGet, apiPost, apiDelete, apiPut } from '@/lib/api'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToastHelpers } from '@/context/ToastContext'
import AddSupplierIngredientModal from '@/components/modals/AddSupplierIngredientModal'
import EditSupplierIngredientModal from '@/components/modals/EditSupplierIngredientModal'
import UnifiedTabs from '@/components/ui/DetailTabs'

interface Supplier {
  supplier_id: number
  name: string
  phone?: string
  email?: string
  website_url?: string
  address?: string
  contact_person?: string
  notes?: string
  active: boolean
  created_at: string
  updated_at: string
  rating?: number
  delivery_time?: number
  ingredients_count?: number
}

interface SupplierIngredient {
  ingredient_id: number
  ingredient_name: string
  name?: string  // Backup en caso de que el backend aún use 'name'
  price?: number
  delivery_time?: number
  package_size?: number
  package_unit?: string
  minimum_order_quantity?: number
  is_preferred_supplier: boolean
  last_updated?: string
}

export default function SupplierDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supplierId = params.id as string
  const isNewSupplier = supplierId === 'new'

  // Toast helpers
  const { success, error: showError } = useToastHelpers()
  
  // State
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing] = useState(true) // Siempre iniciar en modo edición
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  
  // Tabs state
  const [activeTab, setActiveTab] = useState('general')
  
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Supplier ingredients
  const [supplierIngredients, setSupplierIngredients] = useState<SupplierIngredient[]>([])
  const [loadingIngredients, setLoadingIngredients] = useState(false)
  
  // Ingredient modals
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false)
  const [isEditIngredientOpen, setIsEditIngredientOpen] = useState(false)
  const [isDeleteIngredientOpen, setIsDeleteIngredientOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<SupplierIngredient | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    website_url: '',
    address: '',
    contact_person: '',
    notes: '',
    active: true
  })

  // Load data
  useEffect(() => {
    if (!isNewSupplier) {
      loadSupplierData()
      loadSupplierIngredients()
    } else {
      initializeNewSupplier()
    }
  }, [supplierId, isNewSupplier])

  // Handle URL hash for direct tab navigation
  useEffect(() => {
    const hash = window.location.hash.substring(1) // Remove the #
    if (hash && ['general', 'ingredients', 'orders'].includes(hash)) {
      setActiveTab(hash)
    }
  }, [])

  const initializeNewSupplier = () => {
    setSupplier({
      supplier_id: 0,
      name: '',
      phone: '',
      email: '',
      website_url: '',
      address: '',
      contact_person: '',
      notes: '',
      active: true,
      created_at: '',
      updated_at: '',
      ingredients_count: 0
    })
    setLoading(false)
  }

  const loadSupplierData = async () => {
    try {
      setLoading(true)
      const response = await apiGet<Supplier>(`/suppliers/${supplierId}`)
      const supplierData = response.data
      setSupplier(supplierData)
      
      // Set form data
      setFormData({
        name: supplierData.name || '',
        phone: supplierData.phone || '',
        email: supplierData.email || '',
        website_url: supplierData.website_url || '',
        address: supplierData.address || '',
        contact_person: supplierData.contact_person || '',
        notes: supplierData.notes || '',
        active: supplierData.active
      })
      
      setError(null)
    } catch (err) {
      setError('Error al cargar el proveedor')
      console.error('Error loading supplier:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadSupplierIngredients = async () => {
    try {
      setLoadingIngredients(true)
      const response = await apiGet<SupplierIngredient[]>(`/suppliers/${supplierId}/ingredients`)
      setSupplierIngredients(response.data)
    } catch (err) {
      console.error('Error loading supplier ingredients:', err)
      setSupplierIngredients([])
    } finally {
      setLoadingIngredients(false)
    }
  }

  const handleSave = async () => {
    try {
      // Validation
      const errors: Record<string, string> = {}
      
      if (!formData.name.trim()) {
        errors.name = 'El nombre del proveedor es obligatorio'
      }
      
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'El email no tiene un formato válido'
      }
      
      if (formData.website_url && !/^https?:\/\/.+/.test(formData.website_url)) {
        errors.website_url = 'La URL debe comenzar con http:// o https://'
      }
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        showError('Por favor, corrige los errores en el formulario', 'Error de Validación')
        return
      }

      const supplierData = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        website_url: formData.website_url.trim() || null,
        address: formData.address.trim() || null,
        contact_person: formData.contact_person.trim() || null,
        notes: formData.notes.trim() || null,
        active: Boolean(formData.active)
      }

      if (isNewSupplier) {
        const response = await apiPost<{ supplier_id: number }>('/suppliers', supplierData)
        success('Proveedor creado correctamente', 'Proveedor Creado')
        router.push(`/suppliers/${response.data.supplier_id}`)
      } else {
        await apiPut(`/suppliers/${supplierId}`, supplierData)
        await loadSupplierData()
        success('Proveedor actualizado correctamente', 'Proveedor Actualizado')
      }
      
      setValidationErrors({})
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || (isNewSupplier ? 'Error al crear el proveedor' : 'Error al guardar el proveedor')
      console.error('Error saving supplier:', err)
      showError(errorMessage, 'Error al Guardar')
      setError(errorMessage)
    }
  }

  const openDeleteModal = () => {
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    try {
      await apiDelete(`/suppliers/${supplierId}`)
      success('Proveedor eliminado correctamente', 'Proveedor Eliminado')
      router.push('/suppliers')
    } catch (err) {
      setError('Error al eliminar el proveedor')
      console.error('Error deleting supplier:', err)
    }
  }

  // Ingredient CRUD handlers
  const handleAddIngredient = () => {
    setSelectedIngredient(null)
    setIsAddIngredientOpen(true)
  }

  const handleEditIngredient = (ingredient: SupplierIngredient) => {
    setSelectedIngredient(ingredient)
    setIsEditIngredientOpen(true)
  }

  const handleDeleteIngredient = (ingredient: SupplierIngredient) => {
    setSelectedIngredient(ingredient)
    setIsDeleteIngredientOpen(true)
  }

  const confirmDeleteIngredient = async () => {
    if (!selectedIngredient) return
    
    try {
      await apiDelete(`/suppliers/${supplierId}/ingredients/${selectedIngredient.ingredient_id}`)
      await loadSupplierIngredients()
      success('Ingrediente eliminado correctamente')
      setIsDeleteIngredientOpen(false)
    } catch (err) {
      showError('Error al eliminar el ingrediente')
      console.error('Error deleting ingredient:', err)
    }
  }

  const handleTogglePreferred = async (ingredient: SupplierIngredient) => {
    try {
      const payload = {
        price: ingredient.price || 0,
        delivery_time: ingredient.delivery_time || null,
        package_size: ingredient.package_size || 1,
        package_unit: ingredient.package_unit || 'unidad',
        minimum_order_quantity: ingredient.minimum_order_quantity || 1,
        is_preferred_supplier: !ingredient.is_preferred_supplier
      }
      
      await apiPut(`/suppliers/${supplierId}/ingredients/${ingredient.ingredient_id}`, payload)
      await loadSupplierIngredients()
      success(`Proveedor ${!ingredient.is_preferred_supplier ? 'marcado como' : 'desmarcado como'} preferido`)
    } catch (err) {
      showError('Error al cambiar el estado de proveedor preferido')
      console.error('Error toggling preferred:', err)
    }
  }

  // Calculate metrics
  const calculateSupplierMetrics = () => {
    if (!supplier || !supplierIngredients) return null

    const totalIngredients = supplierIngredients.length
    const preferredIngredients = supplierIngredients.filter(ing => ing.is_preferred_supplier).length
    const avgDeliveryTime = supplierIngredients.length > 0 
      ? supplierIngredients.reduce((sum, ing) => sum + (ing.delivery_time || 0), 0) / supplierIngredients.length 
      : 0
    const totalValue = supplierIngredients.reduce((sum, ing) => sum + ((ing.price || 0) * (ing.minimum_order_quantity || 1)), 0)

    return {
      totalIngredients,
      preferredIngredients,
      avgDeliveryTime: Math.round(avgDeliveryTime),
      totalValue,
      supplierStatus: supplier.active ? 'Activo' : 'Inactivo'
    }
  }

  // Format functions
  const formatCurrency = (value: number | null | undefined, decimals: number = 2) => {
    if (value === null || value === undefined || isNaN(value)) return '0,' + '0'.repeat(decimals) + '€'
    
    const numValue = parseFloat(value.toString())
    if (isNaN(numValue)) return '0,' + '0'.repeat(decimals) + '€'
    
    const formatted = numValue.toLocaleString('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
    
    return `${formatted}€`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No especificada'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Tab content renderers
  const renderGeneralTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Building className="h-5 w-5 text-orange-600" />
            </div>
            Información Básica
          </h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del proveedor <span className="text-red-500">*</span>
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Nombre del proveedor"
                    />
                    {validationErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">{supplier?.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Persona de contacto
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.contact_person}
                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nombre del contacto"
                  />
                ) : (
                  <p className="text-gray-900">
                    {supplier?.contact_person || 'Sin contacto especificado'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="+34 600 000 000"
                  />
                ) : (
                  <p className="text-gray-900">
                    {supplier?.phone || 'Sin teléfono'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="contacto@proveedor.com"
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {supplier?.email || 'Sin email'}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sitio web
              </label>
              {isEditing ? (
                <div>
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="https://www.proveedor.com"
                  />
                  {validationErrors.website_url && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.website_url}</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-900">
                  {supplier?.website_url ? (
                    <a 
                      href={supplier.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-orange-600 hover:text-orange-700 underline"
                    >
                      {supplier.website_url}
                    </a>
                  ) : (
                    'Sin sitio web'
                  )}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Dirección completa del proveedor..."
                />
              ) : (
                <p className="text-gray-900">
                  {supplier?.address || 'Sin dirección especificada'}
                </p>
              )}
            </div>

            {/* Active checkbox */}
            {isEditing && (
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Proveedor activo
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Contact Information */}
        {supplier && !isNewSupplier && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              Información de Contacto
            </h3>
            
            <div className="space-y-4">
              {supplier?.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{supplier.phone}</span>
                </div>
              )}
              
              {supplier?.email && (
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <a 
                    href={`mailto:${supplier.email}`}
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    {supplier.email}
                  </a>
                </div>
              )}
              
              {supplier?.website_url && (
                <div className="flex items-center space-x-3">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a 
                    href={supplier.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-600 hover:text-orange-700 truncate"
                  >
                    Visitar sitio web
                  </a>
                </div>
              )}
              
              {supplier?.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-900">{supplier.address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            Notas
          </h3>
          
          {isEditing ? (
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Notas adicionales sobre el proveedor..."
            />
          ) : (
            <p className="text-sm text-gray-900">
              {supplier?.notes || 'Sin notas adicionales'}
            </p>
          )}
        </div>

        {/* Additional Info */}
        {supplier && !isEditing && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Info className="h-5 w-5 text-orange-600" />
              </div>
              Información Adicional
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estado:</span>
                <span className={`text-sm font-medium ${supplier.active ? 'text-green-600' : 'text-red-600'}`}>
                  {supplier.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Creado:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(supplier.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Actualizado:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatDate(supplier.updated_at)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderIngredientsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Package className="h-5 w-5 text-orange-600" />
            </div>
            Ingredientes Suministrados
          </h3>
          <button
            onClick={handleAddIngredient}
            className="inline-flex items-center text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Añadir ingrediente</span>
            <span className="md:hidden">Añadir</span>
          </button>
        </div>
      
      {loadingIngredients ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Cargando ingredientes...</p>
        </div>
      ) : supplierIngredients.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingrediente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entrega
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supplierIngredients.map((ingredient) => (
                <tr key={ingredient.ingredient_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {ingredient.ingredient_name || ingredient.name || '[Nombre no disponible]'}
                    </div>
                    {ingredient.package_size && (
                      <div className="text-sm text-gray-500">
                        Paquete: {ingredient.package_size} {ingredient.package_unit}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {ingredient.price ? formatCurrency(ingredient.price, 4) : 'Sin precio'}
                    </div>
                    {ingredient.minimum_order_quantity && (
                      <div className="text-sm text-gray-500">
                        Mín: {ingredient.minimum_order_quantity}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {ingredient.delivery_time ? `${ingredient.delivery_time} días` : 'No especificado'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePreferred(ingredient)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        ingredient.is_preferred_supplier 
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      title={ingredient.is_preferred_supplier ? 'Quitar como preferido' : 'Marcar como preferido'}
                    >
                      <Star className={`h-3 w-3 mr-1 ${ingredient.is_preferred_supplier ? 'fill-current' : ''}`} />
                      {ingredient.is_preferred_supplier ? 'Preferido' : 'Normal'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditIngredient(ingredient)}
                        className="text-orange-600 hover:text-orange-900 p-1 rounded transition-colors"
                        title="Editar ingrediente"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteIngredient(ingredient)}
                        className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                        title="Eliminar ingrediente"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Sin ingredientes asignados
          </h3>
          <p className="text-gray-500">
            Este proveedor aún no tiene ingredientes asignados
          </p>
        </div>
      )}
      </div>
    </div>
  )

  const renderOrdersHistoryTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="bg-orange-100 p-2 rounded-lg">
            <History className="h-5 w-5 text-orange-600" />
          </div>
          Historial de Pedidos
        </h3>
        
        <div className="text-center py-12">
          <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Historial de Pedidos
          </h3>
          <p className="text-gray-500">
            Esta funcionalidad se implementará próximamente
          </p>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!supplier && !isNewSupplier) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">No se encontró el proveedor</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile Fixed Action Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 sticky top-[60px] z-40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <button
              onClick={() => router.push('/suppliers')}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1 pr-2">
              <h1 className="text-lg font-semibold text-gray-900 leading-tight break-words">
                {isNewSupplier ? 'Nuevo Proveedor' : (supplier?.name || 'Cargando...')}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {!isNewSupplier && (
              <button
                onClick={openDeleteModal}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar proveedor"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            
            <button
              onClick={handleSave}
              className="p-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              title={isNewSupplier ? 'Crear proveedor' : 'Guardar cambios'}
            >
              <Save className="h-4 w-4" />
            </button>
            
            {!isNewSupplier && (
              <button
                onClick={() => router.push('/suppliers')}
                className="hidden md:flex p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cerrar y volver"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <header className="hidden md:block bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/suppliers')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNewSupplier ? 'Nuevo Proveedor' : (supplier?.name || 'Cargando...')}
              </h1>
              {supplier && !isEditing && supplier.contact_person && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-500">{supplier.contact_person}</span>
                  {supplier.active && (
                    <>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-green-600">Activo</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {!isNewSupplier && (
              <button
                onClick={openDeleteModal}
                className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </button>
            )}
            
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {isNewSupplier ? 'Crear' : 'Guardar'}
            </button>
            
            {!isNewSupplier && (
              <button
                onClick={() => router.push('/suppliers')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Cerrar
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="p-6 md:p-6 pt-4 md:pt-6">
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Cards siguiendo patrón TotXo */}
        {supplier && !isNewSupplier && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingredientes</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {supplierIngredients.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">suministrados</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Preferidos</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {calculateSupplierMetrics()?.preferredIngredients || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">ingredientes</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Star className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Entrega Media</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {calculateSupplierMetrics()?.avgDeliveryTime || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">días</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  {(() => {
                    const metrics = calculateSupplierMetrics()
                    const statusColor = supplier.active ? 'text-green-600' : 'text-red-600'
                    return (
                      <p className={`text-lg font-bold mt-1 ${statusColor}`}>
                        {metrics?.supplierStatus || 'Desconocido'}
                      </p>
                    )
                  })()}
                  {supplier.rating && (
                    <p className="text-xs text-orange-600 mt-1">★ {supplier.rating.toFixed(1)}</p>
                  )}
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  {(() => {
                    const IconComponent = supplier.active ? CheckCircle : AlertTriangle
                    return <IconComponent className="h-6 w-6 text-orange-600" />
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Section */}
        {!isNewSupplier && (
          <UnifiedTabs
            variant="detail"
            mobileStyle="orange"
            tabs={[
              { id: 'general', label: 'Información General', icon: Building },
              { id: 'ingredients', label: 'Ingredientes', icon: Package },
              { id: 'orders', label: 'Historial de Pedidos', icon: History }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {activeTab === 'general' && renderGeneralTab()}
            {activeTab === 'ingredients' && renderIngredientsTab()}
            {activeTab === 'orders' && renderOrdersHistoryTab()}
          </UnifiedTabs>
        )}

        {/* New supplier form without tabs */}
        {isNewSupplier && renderGeneralTab()}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar el proveedor "${supplier?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Delete Ingredient Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteIngredientOpen}
        onClose={() => setIsDeleteIngredientOpen(false)}
        onConfirm={confirmDeleteIngredient}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar "${selectedIngredient?.ingredient_name || selectedIngredient?.name || 'este ingrediente'}" de este proveedor?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />

      {/* Add Ingredient Modal */}
      <AddSupplierIngredientModal
        isOpen={isAddIngredientOpen}
        onClose={() => setIsAddIngredientOpen(false)}
        supplierId={supplierId}
        supplierName={supplier?.name || ''}
        onSave={loadSupplierIngredients}
      />

      {/* Edit Ingredient Modal */}
      <EditSupplierIngredientModal
        isOpen={isEditIngredientOpen}
        onClose={() => setIsEditIngredientOpen(false)}
        supplierId={supplierId}
        ingredient={selectedIngredient}
        onSave={loadSupplierIngredients}
      />
    </>
  )
}