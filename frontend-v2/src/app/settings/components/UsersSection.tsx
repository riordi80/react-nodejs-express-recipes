'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Shield, Eye, EyeOff, Users, Info } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import Loading from '@/components/ui/Loading'
import api from '@/lib/api'

interface User {
  user_id: number
  first_name: string
  last_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
}

interface FormData {
  first_name: string
  last_name: string
  email: string
  role: string
  password?: string
  is_active: boolean
}

const UsersSection = () => {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    role: 'chef',
    password: '',
    is_active: true
  })

  const isAdmin = currentUser?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error: any) {
      showToast({ message: 'Error al cargar los usuarios', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      role: 'chef',
      password: '',
      is_active: true
    })
    setSelectedUser(null)
    setShowPassword(false)
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      password: '',
      is_active: user.is_active
    })
    setShowEditModal(true)
  }

  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const handleCreateUser = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      showToast({ message: 'Todos los campos son requeridos', type: 'error' })
      return
    }

    if (formData.password.length < 6) {
      showToast({ message: 'La contraseña debe tener al menos 6 caracteres', type: 'error' })
      return
    }

    try {
      setLoading(true)
      await api.post('/users', formData)
      showToast({ message: 'Usuario creado correctamente', type: 'success' })
      setShowCreateModal(false)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      showToast({ message: error.response?.data?.message || 'Error al crear el usuario', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser || !formData.first_name || !formData.last_name || !formData.email) {
      showToast({ message: 'Todos los campos son requeridos', type: 'error' })
      return
    }

    try {
      setLoading(true)
      const updateData = { ...formData }
      if (!updateData.password) {
        delete updateData.password
      }
      
      await api.put(`/users/${selectedUser.user_id}`, updateData)
      showToast({ message: 'Usuario actualizado correctamente', type: 'success' })
      setShowEditModal(false)
      resetForm()
      fetchUsers()
    } catch (error: any) {
      showToast({ message: error.response?.data?.message || 'Error al actualizar el usuario', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    if (selectedUser.user_id === currentUser?.user_id) {
      showToast({ message: 'No puedes eliminar tu propia cuenta', type: 'error' })
      return
    }

    try {
      setLoading(true)
      await api.delete(`/users/${selectedUser.user_id}`)
      showToast({ message: 'Usuario eliminado correctamente', type: 'success' })
      setShowDeleteModal(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error: any) {
      showToast({ message: error.response?.data?.message || 'Error al eliminar el usuario', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'chef', label: 'Chef' },
    { value: 'inventory_manager', label: 'Gestor de Inventario' },
    { value: 'supplier_manager', label: 'Gestor de Proveedores' },
    { value: 'waiter', label: 'Camarero' }
  ]

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'danger'
      case 'chef': return 'info'
      case 'inventory_manager': return 'warning'
      case 'supplier_manager': return 'default'
      case 'waiter': return 'outline'
      default: return 'default'
    }
  }

  const getRoleDisplayName = (role: string) => {
    const option = roleOptions.find(r => r.value === role)
    return option?.label || role
  }

  if (!isAdmin) {
    return (
      <div>
        <div className="text-center py-12">
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Restringido</h3>
          <p className="text-gray-600">Solo los administradores pueden gestionar usuarios.</p>
        </div>
      </div>
    )
  }

  if (loading && users.length === 0) {
    return <Loading />
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Users className="h-6 w-6 text-orange-600" />
          Gestión de Usuarios
        </h2>
          <p className="text-gray-600">Administra los usuarios y sus permisos del sistema</p>
        </div>
        <Button onClick={openCreateModal} icon={Plus} className="self-start sm:self-auto">
          Nuevo Usuario
        </Button>
      </div>

      {/* Lista de Usuarios */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-600" />
            Usuarios del Sistema
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {users.map(user => (
            <div key={user.user_id} className="px-4 sm:px-6 py-4">
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <h4 className="font-medium text-gray-900 truncate">
                      {user.first_name} {user.last_name}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRoleBadgeVariant(user.role)} size="sm">
                        {getRoleDisplayName(user.role)}
                      </Badge>
                      {!user.is_active && (
                        <Badge variant="danger" size="sm">Inactivo</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit}
                    onClick={() => openEditModal(user)}
                  >
                    Editar
                  </Button>
                  
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => openDeleteModal(user)}
                    disabled={!isAdmin || user.user_id === currentUser?.user_id}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información de Roles */}
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-orange-600" />
          Roles y Permisos
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3">
            <div>
              <Badge variant="danger" className="mb-2">Administrador</Badge>
              <p className="text-sm text-gray-600">Acceso completo al sistema, gestión de usuarios y configuraciones.</p>
            </div>
            <div>
              <Badge variant="info" className="mb-2">Chef</Badge>
              <p className="text-sm text-gray-600">Gestión de recetas, menús y planificación de eventos.</p>
            </div>
            <div>
              <Badge variant="warning" className="mb-2">Gestor de Inventario</Badge>
              <p className="text-sm text-gray-600">Gestión de ingredientes, stock y almacén.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Badge variant="default" className="mb-2">Gestor de Proveedores</Badge>
              <p className="text-sm text-gray-600">Gestión de proveedores, pedidos y relaciones comerciales.</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Camarero</Badge>
              <p className="text-sm text-gray-600">Visualización de menús, eventos y información básica.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Usuario"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="Nombre"
              required
            />
            <Input
              label="Apellidos"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Apellidos"
              required
            />
          </div>
          
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="usuario@email.com"
            required
          />
          
          <Select
            label="Rol"
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            options={roleOptions}
          />
          
          <div className="relative">
            <Input
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active_create"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active_create" className="text-sm text-gray-700">
              Usuario activo
            </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowCreateModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreateUser} loading={loading}>
            Crear Usuario
          </Button>
        </div>
      </Modal>

      {/* Modal Editar Usuario */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Usuario"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              placeholder="Nombre"
              required
            />
            <Input
              label="Apellidos"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Apellidos"
              required
            />
          </div>
          
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="usuario@email.com"
            required
          />
          
          <Select
            label="Rol"
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            options={roleOptions}
          />
          
          <div className="relative">
            <Input
              label="Nueva Contraseña (opcional)"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Dejar vacío para mantener actual"
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active_edit" className="text-sm text-gray-700">
              Usuario activo
            </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setShowEditModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleUpdateUser} loading={loading}>
            Actualizar Usuario
          </Button>
        </div>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteUser}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que deseas eliminar al usuario ${selectedUser?.first_name} ${selectedUser?.last_name}?`}
        confirmText="Eliminar"
        loading={loading}
      />
    </div>
  )
}

export default UsersSection