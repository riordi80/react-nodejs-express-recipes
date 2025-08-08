'use client'

import React, { useState } from 'react'
import { 
  Button, 
  Input, 
  Select, 
  TextArea, 
  Loading, 
  LoadingPage,
  LoadingCard,
  ConfirmModal 
} from '@/components/ui'
import { Plus, Save, Search, Mail, User, ChefHat } from 'lucide-react'

// Componente de demostración para mostrar todos los componentes UI
export default function ComponentsDemo() {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
    console.log('Form submitted:', formData)
  }

  const roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'chef', label: 'Chef' },
    { value: 'supplier_manager', label: 'Gestor de Proveedores' }
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Demostración de Componentes UI
        </h1>
        <p className="text-gray-600">
          Ejemplos de todos los componentes reutilizables del sistema
        </p>
      </div>

      {/* Buttons Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Botones</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button variant="primary" icon={Plus}>
            Crear Nuevo
          </Button>
          <Button variant="secondary" icon={Save} iconPosition="right">
            Guardar
          </Button>
          <Button variant="danger" size="sm">
            Eliminar
          </Button>
          <Button variant="success" size="lg" icon={ChefHat}>
            Aprobar Receta
          </Button>
          <Button variant="ghost" loading={loading}>
            Procesando
          </Button>
          <Button variant="outline" fullWidth>
            Botón Completo
          </Button>
        </div>
      </section>

      {/* Form Components Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Formularios</h2>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre completo"
              placeholder="Ingresa tu nombre"
              icon={User}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              icon={Mail}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formData.email && !formData.email.includes('@') ? 'Email inválido' : ''}
            />
          </div>
          
          <Select
            label="Rol del usuario"
            placeholder="Selecciona un rol"
            options={roleOptions}
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            helperText="Define los permisos del usuario en el sistema"
          />
          
          <TextArea
            label="Descripción"
            placeholder="Describe las responsabilidades..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
          
          <div className="flex gap-2">
            <Button type="submit" loading={loading}>
              Crear Usuario
            </Button>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      </section>

      {/* Loading States Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Estados de Carga</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium mb-3">Spinner</h3>
            <Loading size="md" text="Cargando datos..." />
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium mb-3">Puntos</h3>
            <Loading variant="dots" size="lg" text="Procesando..." />
          </div>
          
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="text-sm font-medium mb-3">Skeleton</h3>
            <LoadingCard />
          </div>
        </div>
      </section>

      {/* Interactive Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Ejemplos Interactivos</h2>
        <div className="flex gap-4">
          <Button 
            onClick={() => setLoading(!loading)}
            variant="outline"
          >
            {loading ? 'Detener Carga' : 'Activar Carga'}
          </Button>
          <Button 
            onClick={() => setShowModal(true)}
            variant="danger"
          >
            Mostrar Modal de Confirmación
          </Button>
        </div>
      </section>

      {/* Search Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Búsqueda</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Buscar recetas, ingredientes..."
            icon={Search}
            fullWidth={false}
            className="flex-1"
          />
          <Button variant="primary">
            Buscar
          </Button>
        </div>
      </section>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => {
          console.log('Acción confirmada')
          setShowModal(false)
        }}
        title="Confirmar acción"
        message="¿Estás seguro de que quieres realizar esta acción? Esta operación no se puede deshacer."
        confirmText="Sí, continuar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  )
}