'use client'

import React, { useState } from 'react'
import { 
  Button, 
  Input, 
  Select, 
  TextArea, 
  Chips,
  SeasonChips,
  AllergenChips,
  Loading, 
  LoadingCard,
  ConfirmModal,
  Modal,
  FormModal,
  Badge,
  Card,
  Avatar,
  EmptyState,
  Dropdown,
  Pagination,
  MultiSelectDropdown
} from '@/components/ui'
import { useToast, useToastHelpers } from '@/context/ToastContext'
import { 
  Plus, 
  Save, 
  Search, 
  Mail, 
  User, 
  ChefHat, 
  Edit, 
  Trash2, 
  Eye,
  Settings,
  Package,
  Users,
  ChevronDown,
  BookOpen
} from 'lucide-react'

export default function ComponentsDemoPage() {
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showBasicModal, setShowBasicModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  
  // Toast hooks
  const { showToast, clearAllToasts } = useToast()
  const { success, error, warning, info } = useToastHelpers()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  
  // MultiSelect states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])
  
  const categoryOptions = ['Entrantes', 'Principales', 'Postres', 'Bebidas', 'Vegetariano', 'Vegano', 'Sin Gluten']
  const allergenOptions = ['Gluten', 'Lácteos', 'Huevos', 'Frutos Secos', 'Mariscos', 'Pescado', 'Soja', 'Sésamo']
  const totalPages = 10
  
  // Chips state
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['javascript', 'react'])
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(['primavera', 'verano'])
  const [selectedChipAllergens, setSelectedChipAllergens] = useState<number[]>([1])
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    description: '',
    difficulty: '',
    category: ''
  })

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simular éxito o error
      const isSuccess = Math.random() > 0.3
      
      if (isSuccess) {
        success('Nueva receta creada exitosamente', 'Receta Guardada')
        setShowFormModal(false)
      } else {
        error('No se pudo guardar la receta. Intente nuevamente.', 'Error al Guardar')
      }
    } catch {
      error('Error inesperado. Contacte al administrador.', 'Error del Sistema')
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = [
    { value: 'admin', label: 'Administrador' },
    { value: 'chef', label: 'Chef' },
    { value: 'supplier_manager', label: 'Gestor de Proveedores' }
  ]

  const difficultyOptions = [
    { value: 'easy', label: 'Fácil' },
    { value: 'medium', label: 'Intermedio' },
    { value: 'hard', label: 'Difícil' }
  ]

  const selectCategoryOptions = [
    { value: 'appetizer', label: 'Entrante' },
    { value: 'main', label: 'Plato Principal' },
    { value: 'dessert', label: 'Postre' },
    { value: 'drink', label: 'Bebida' }
  ]

  const skillsOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'react', label: 'React' },
    { value: 'nodejs', label: 'Node.js' },
    { value: 'python', label: 'Python' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'sql', label: 'SQL' }
  ]

  const seasonsOptions = [
    { value: 'primavera', label: 'Primavera' },
    { value: 'verano', label: 'Verano' },
    { value: 'otoño', label: 'Otoño' },
    { value: 'invierno', label: 'Invierno' }
  ]

  const allergensOptions = [
    { allergen_id: 1, name: 'Gluten' },
    { allergen_id: 2, name: 'Lactosa' },
    { allergen_id: 3, name: 'Frutos Secos' },
    { allergen_id: 4, name: 'Huevos' },
    { allergen_id: 5, name: 'Pescado' },
    { allergen_id: 6, name: 'Mariscos' },
    { allergen_id: 7, name: 'Soja' },
    { allergen_id: 8, name: 'Sésamo' },
    { allergen_id: 9, name: 'Mostaza' },
    { allergen_id: 10, name: 'Apio' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introducción */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Sistema de Componentes Reutilizables
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Esta página demuestra todos los componentes UI disponibles en el sistema, 
            diseñados para mantener consistencia visual y mejorar la experiencia de desarrollo.
          </p>
        </div>

        {/* Sección: Botones */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Botones</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Variantes */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Variantes</h4>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary" icon={Plus}>
                    Primary
                  </Button>
                  <Button variant="secondary" icon={Save}>
                    Secondary
                  </Button>
                  <Button variant="danger" icon={Trash2}>
                    Danger
                  </Button>
                  <Button variant="success" icon={ChefHat}>
                    Success
                  </Button>
                  <Button variant="ghost" icon={Eye}>
                    Ghost
                  </Button>
                  <Button variant="outline" icon={Settings}>
                    Outline
                  </Button>
                </div>
              </div>

              {/* Tamaños */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Tamaños</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm" icon={Edit}>
                    Pequeño
                  </Button>
                  <Button size="md" icon={Package}>
                    Mediano
                  </Button>
                  <Button size="lg" icon={Users}>
                    Grande
                  </Button>
                </div>
              </div>

              {/* Estados */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Estados</h4>
                <div className="flex flex-wrap gap-3">
                  <Button loading={loading}>
                    {loading ? 'Cargando...' : 'Normal'}
                  </Button>
                  <Button disabled>
                    Deshabilitado
                  </Button>
                  <Button fullWidth className="max-w-xs">
                    Ancho Completo
                  </Button>
                </div>
              </div>

              {/* Controles */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Controles</h4>
                <Button 
                  variant="outline" 
                  onClick={() => setLoading(!loading)}
                >
                  {loading ? 'Detener Carga' : 'Activar Carga'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Campos de Formulario */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Campos de Formulario</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input examples */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Inputs</h4>
                
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
                
                <Input
                  label="Búsqueda"
                  placeholder="Buscar recetas..."
                  icon={Search}
                  helperText="Busca por nombre, ingredientes o categoría"
                />
              </div>

              {/* Select examples */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Selectores</h4>
                
                <Select
                  label="Rol del usuario"
                  placeholder="Selecciona un rol"
                  options={roleOptions}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  helperText="Define los permisos del usuario"
                />
                
                <Select
                  label="Dificultad"
                  placeholder="Selecciona dificultad"
                  options={difficultyOptions}
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                />
                
                <Select
                  label="Categoría"
                  options={selectCategoryOptions}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  error={formData.category === 'appetizer' ? 'Esta categoría está temporalmente deshabilitada' : ''}
                />

                {/* MultiSelectDropdown Examples */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700">Selectores Múltiples (MultiSelectDropdown)</h5>
                  
                  <MultiSelectDropdown
                    options={categoryOptions}
                    selected={selectedCategories}
                    onChange={setSelectedCategories}
                    placeholder="Seleccionar categorías..."
                    className="w-full"
                  />
                  
                  <MultiSelectDropdown
                    options={allergenOptions}
                    selected={selectedAllergens}
                    onChange={setSelectedAllergens}
                    placeholder="Seleccionar alérgenos..."
                    className="w-full"
                  />

                  <div className="text-xs text-gray-600 space-y-1">
                    <div><strong>Categorías seleccionadas:</strong> {selectedCategories.join(', ') || 'Ninguna'}</div>
                    <div><strong>Alérgenos seleccionados:</strong> {selectedAllergens.join(', ') || 'Ninguno'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* TextArea */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Área de Texto</h4>
              <TextArea
                label="Descripción detallada"
                placeholder="Describe las instrucciones de la receta..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                helperText="Máximo 500 caracteres"
              />
            </div>
          </div>
        </section>

        {/* Sección: Chips (Selección Múltiple) */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Chips - Selección Múltiple</h3>
          <div className="space-y-8">
            
            {/* Chips básicos */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-medium text-gray-700 mb-4">Chips Básicos</h4>
              <div className="space-y-6">
                
                {/* Variantes */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Variantes de colores</h5>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <div>
                      <h6 className="text-xs font-medium text-gray-600 mb-3">Habilidades Técnicas (Primary - Orange)</h6>
                      <Chips
                        options={skillsOptions}
                        selected={selectedSkills}
                        onChange={setSelectedSkills}
                        variant="primary"
                        placeholder="Seleccionar habilidades..."
                      />
                    </div>

                    <div>
                      <h6 className="text-xs font-medium text-gray-600 mb-3">Temporadas (Success - Green)</h6>
                      <Chips
                        options={seasonsOptions}
                        selected={selectedSeasons}
                        onChange={setSelectedSeasons}
                        variant="success"
                        placeholder="Seleccionar temporadas..."
                      />
                    </div>
                  </div>
                </div>

                {/* Tamaños */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Tamaños</h5>
                  <div className="space-y-4">
                    <div>
                      <h6 className="text-xs font-medium text-gray-600 mb-2">Pequeño</h6>
                      <Chips
                        options={skillsOptions.slice(0, 4)}
                        selected={selectedSkills.slice(0, 2)}
                        onChange={() => {}}
                        variant="default"
                        size="sm"
                        disabled
                      />
                    </div>
                    <div>
                      <h6 className="text-xs font-medium text-gray-600 mb-2">Mediano (por defecto) - Orange</h6>
                      <Chips
                        options={skillsOptions.slice(0, 4)}
                        selected={selectedSkills.slice(0, 2)}
                        onChange={() => {}}
                        variant="primary"
                        size="md"
                        disabled
                      />
                    </div>
                    <div>
                      <h6 className="text-xs font-medium text-gray-600 mb-2">Grande - Green</h6>
                      <Chips
                        options={skillsOptions.slice(0, 4)}
                        selected={selectedSkills.slice(0, 2)}
                        onChange={() => {}}
                        variant="success"
                        size="lg"
                        disabled
                      />
                    </div>
                  </div>
                </div>

                {/* Estado deshabilitado */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Estado deshabilitado</h5>
                  <Chips
                    options={skillsOptions.slice(0, 5)}
                    selected={['javascript', 'react']}
                    onChange={() => {}}
                    variant="default"
                    disabled
                    placeholder="Chips deshabilitados..."
                  />
                </div>
              </div>
            </div>

            {/* Componentes especializados */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-medium text-gray-700 mb-4">Componentes Especializados</h4>
              <div className="space-y-6">
                
                {/* SeasonChips */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">SeasonChips - Para temporadas de ingredientes</h5>
                  <p className="text-sm text-gray-500 mb-4">
                    Componente especializado con los 12 meses del año más &quot;Todo el año&quot;. Interfaz limpia sin etiquetas adicionales.
                  </p>
                  <SeasonChips
                    selected={['enero', 'febrero', 'marzo']}
                    onChange={(selected) => info(`Temporadas seleccionadas: ${selected.join(', ')}`)}
                  />
                </div>

                {/* AllergenChips */}
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">AllergenChips - Para alérgenos</h5>
                  <p className="text-sm text-gray-500 mb-4">
                    Componente especializado para selección de alérgenos con estilo danger (rojo). Interfaz minimalista sin texto explicativo.
                  </p>
                  <AllergenChips
                    options={allergensOptions}
                    selected={selectedChipAllergens}
                    onChange={setSelectedChipAllergens}
                  />
                </div>
              </div>
            </div>

            {/* Ejemplos de uso real */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-medium text-gray-700 mb-4">Ejemplos de Uso en el Sistema</h4>
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Formulario de ingrediente */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h5 className="text-sm font-semibold text-gray-800 mb-3">
                      📦 Formulario de Ingrediente
                    </h5>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Temporada de disponibilidad
                        </label>
                        <SeasonChips
                          selected={['marzo', 'abril', 'mayo']}
                          onChange={(selected) => info(`Ingrediente disponible en: ${selected.join(', ')}`)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Alérgenos presentes
                        </label>
                        <AllergenChips
                          options={allergensOptions}
                          selected={[1, 4]}
                          onChange={(selected) => error(`Alérgenos detectados: ${selected.map(id => allergensOptions.find(a => a.allergen_id === id)?.name).join(', ')}`)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filtros de búsqueda */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h5 className="text-sm font-semibold text-gray-800 mb-3">
                      🔍 Filtros de Búsqueda
                    </h5>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Filtrar por categorías
                        </label>
                        <Chips
                          options={selectCategoryOptions}
                          selected={['main', 'dessert']}
                          onChange={(selected) => info(`Filtros aplicados: ${selected.join(', ')}`)}
                          variant="primary"
                          size="sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Filtrar por dificultad
                        </label>
                        <Chips
                          options={difficultyOptions}
                          selected={['easy']}
                          onChange={(selected) => info(`Dificultad: ${selected.join(', ')}`)}
                          variant="success"
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controles demostrativos */}
                <div className="border-t pt-6">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Controles de prueba</h5>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedSkills([])}
                    >
                      Limpiar Habilidades
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedSeasons(['primavera', 'verano', 'otoño', 'invierno'])}
                    >
                      Seleccionar Todas las Temporadas
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedChipAllergens([1, 2, 3])}
                    >
                      Alérgenos Comunes
                    </Button>
                  </div>
                </div>

                {/* Estado actual */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-blue-800 mb-2">Estado Actual de las Selecciones</h5>
                  <div className="text-xs text-blue-700 space-y-1">
                    <div><strong>Habilidades:</strong> {selectedSkills.join(', ') || 'Ninguna'}</div>
                    <div><strong>Temporadas:</strong> {selectedSeasons.join(', ') || 'Ninguna'}</div>
                    <div><strong>Alérgenos:</strong> {selectedChipAllergens.map(id => allergensOptions.find(a => a.allergen_id === id)?.name).join(', ') || 'Ninguno'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Estados de Carga */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Estados de Carga</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Spinner</h4>
              <Loading size="md" text="Cargando datos..." />
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Puntos</h4>
              <Loading variant="dots" size="lg" text="Procesando..." />
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Skeleton</h4>
              <LoadingCard />
            </div>
          </div>
        </section>

        {/* Sección: Modales */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Modales</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => setShowBasicModal(true)}>
                Modal Básico
              </Button>
              <Button onClick={() => setShowFormModal(true)} variant="secondary">
                Modal de Formulario
              </Button>
              <Button onClick={() => setShowConfirmModal(true)} variant="danger">
                Modal de Confirmación
              </Button>
            </div>
          </div>
        </section>

        {/* Sección: Notificaciones Toast */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Notificaciones (Toast)</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Tipos básicos */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Tipos de notificación</h4>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="success"
                    onClick={() => success('Receta guardada exitosamente', 'Éxito')}
                  >
                    Éxito
                  </Button>
                  <Button 
                    variant="danger"
                    onClick={() => error('No se pudo eliminar la receta', 'Error')}
                  >
                    Error
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={() => warning('Algunos ingredientes están agotados', 'Advertencia')}
                  >
                    Advertencia
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => info('Nueva actualización disponible', 'Información')}
                  >
                    Información
                  </Button>
                </div>
              </div>

              {/* Ejemplos con acciones */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Con acciones</h4>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => showToast({
                    type: 'warning',
                    title: 'Inventario bajo',
                    message: 'Solo quedan 5 unidades de harina',
                    action: {
                      label: 'Reabastecer',
                      onClick: () => info('Redirigiendo a proveedores...')
                    }
                  })}>
                    Con Acción
                  </Button>
                  
                  <Button onClick={() => showToast({
                    type: 'info',
                    message: 'Esta notificación no se cierra automáticamente',
                    duration: 0 // No auto-close
                  })}>
                    Sin Auto-Cerrar
                  </Button>
                  
                  <Button onClick={() => showToast({
                    type: 'success',
                    message: 'Notificación rápida (2 segundos)',
                    duration: 2000
                  })}>
                    Duración Corta
                  </Button>
                </div>
              </div>

              {/* Controles */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Controles</h4>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Generar múltiples toasts
                      success('Primera notificación')
                      setTimeout(() => info('Segunda notificación'), 500)
                      setTimeout(() => warning('Tercera notificación'), 1000)
                    }}
                  >
                    Múltiples Toasts
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    onClick={clearAllToasts}
                  >
                    Limpiar Todos
                  </Button>
                </div>
              </div>

              {/* Ejemplo realista */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Ejemplos realistas</h4>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => {
                    success('Receta "Paella Valenciana" creada correctamente', 'Receta Guardada')
                  }}>
                    Receta Creada
                  </Button>
                  
                  <Button variant="danger" onClick={() => {
                    error('El ingrediente "Azafrán" no se pudo agregar. Verifique el inventario.', 'Error en Ingrediente')
                  }}>
                    Error Ingrediente
                  </Button>
                  
                  <Button variant="secondary" onClick={() => {
                    warning('El evento "Cena de Gala" está programado para mañana pero faltan 3 ingredientes', 'Verificar Inventario')
                  }}>
                    Alerta Evento
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Badges y Etiquetas */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Badges y Etiquetas</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Variantes */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Variantes</h4>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="default">Por Defecto</Badge>
                  <Badge variant="success">Completado</Badge>
                  <Badge variant="warning">Pendiente</Badge>
                  <Badge variant="danger">Cancelado</Badge>
                  <Badge variant="info">Información</Badge>
                  <Badge variant="outline">Sin Color</Badge>
                </div>
              </div>

              {/* Tamaños */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Tamaños</h4>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge size="sm" variant="success">Pequeño</Badge>
                  <Badge size="md" variant="info">Mediano</Badge>
                  <Badge size="lg" variant="warning">Grande</Badge>
                </div>
              </div>

              {/* Con iconos */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Con iconos</h4>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="success" icon={ChefHat}>Chef</Badge>
                  <Badge variant="info" icon={User}>Usuario</Badge>
                  <Badge variant="warning" icon={Package}>Inventario</Badge>
                </div>
              </div>

              {/* Ejemplos realistas */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Ejemplos del sistema</h4>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="success">Receta Activa</Badge>
                  <Badge variant="warning">Stock Bajo</Badge>
                  <Badge variant="danger">Ingrediente Agotado</Badge>
                  <Badge variant="info">Evento Próximo</Badge>
                  <Badge variant="outline">Borrador</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Cards */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Cards y Contenedores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card básica */}
            <Card>
              <Card.Header>
                <Card.Title>Card Básica</Card.Title>
                <Card.Description>
                  Esta es una descripción de ejemplo para la card.
                </Card.Description>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600">
                  Contenido principal de la card. Puede incluir cualquier elemento.
                </p>
              </Card.Content>
              <Card.Footer>
                <Button size="sm" fullWidth>Acción</Button>
              </Card.Footer>
            </Card>

            {/* Card con sombra */}
            <Card shadow="md" hover>
              <Card.Header>
                <Card.Title>Con Hover</Card.Title>
              </Card.Header>
              <Card.Content>
                <p className="text-sm text-gray-600">
                  Esta card tiene efecto hover y sombra.
                </p>
                <div className="mt-3 flex gap-2">
                  <Badge variant="success">Activo</Badge>
                  <Badge variant="info">Popular</Badge>
                </div>
              </Card.Content>
            </Card>

            {/* Card receta ejemplo */}
            <Card shadow="lg">
              <Card.Header>
                <div className="flex items-center space-x-3">
                  <Avatar name="Chef García" size="md" />
                  <div>
                    <Card.Title>Paella Valenciana</Card.Title>
                    <Card.Description>Por Chef García</Card.Description>
                  </div>
                </div>
              </Card.Header>
              <Card.Content>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Dificultad:</span>
                    <Badge variant="warning" size="sm">Intermedio</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tiempo:</span>
                    <span>45 min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Porciones:</span>
                    <span>6 personas</span>
                  </div>
                </div>
              </Card.Content>
              <Card.Footer>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Ver</Button>
                  <Button size="sm">Cocinar</Button>
                </div>
              </Card.Footer>
            </Card>
          </div>
        </section>

        {/* Sección: Avatars */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Avatars</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Tamaños */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Tamaños</h4>
                <div className="flex items-center gap-4">
                  <Avatar name="Ana García" size="sm" />
                  <Avatar name="Luis Pérez" size="md" />
                  <Avatar name="María López" size="lg" />
                  <Avatar name="Carlos Ruiz" size="xl" />
                </div>
              </div>

              {/* Con nombres */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Con diferentes nombres</h4>
                <div className="flex items-center gap-4">
                  <Avatar name="Chef Antonio" />
                  <Avatar name="María González" />
                  <Avatar name="Pedro Martín" />
                  <Avatar name="Ana Isabel López" />
                  <Avatar name="José María" />
                </div>
              </div>

              {/* Fallbacks */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Sin datos</h4>
                <div className="flex items-center gap-4">
                  <Avatar />
                  <Avatar fallbackIcon={false} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Dropdown */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Menús Desplegables</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Dropdown básico</h4>
                <div className="flex gap-4">
                  <Dropdown
                    trigger={
                      <Button variant="outline">
                        Acciones <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    }
                    items={[
                      { label: 'Ver detalles', value: 'view', icon: Eye },
                      { label: 'Editar', value: 'edit', icon: Edit },
                      { label: 'Duplicar', value: 'duplicate', icon: Plus },
                      { label: 'Eliminar', value: 'delete', icon: Trash2 }
                    ]}
                    onSelect={(item) => info(`Acción seleccionada: ${item.label}`)}
                  />

                  <Dropdown
                    trigger={
                      <div className="flex items-center space-x-2 cursor-pointer">
                        <Avatar name="Usuario Demo" size="sm" />
                        <span className="text-sm">Usuario Demo</span>
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    }
                    items={[
                      { label: 'Mi Perfil', value: 'profile', icon: User },
                      { label: 'Configuración', value: 'settings', icon: Settings },
                      { label: 'Cerrar Sesión', value: 'logout' }
                    ]}
                    position="right"
                    onSelect={(item) => info(`Navegando a: ${item.label}`)}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Estados Vacíos */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Estados Vacíos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200">
              <EmptyState
                icon={BookOpen}
                title="No hay recetas"
                description="Parece que aún no has creado ninguna receta. ¡Comienza creando tu primera receta!"
                action={{
                  label: 'Crear Primera Receta',
                  onClick: () => success('Navegando a crear receta...'),
                  variant: 'primary'
                }}
              />
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <EmptyState
                icon={Package}
                title="Inventario vacío"
                description="No hay ingredientes en el inventario."
                action={{
                  label: 'Agregar Ingredientes',
                  onClick: () => info('Abriendo formulario de ingredientes...'),
                  variant: 'outline'
                }}
              />
            </div>
          </div>
        </section>

        {/* Sección: Paginación */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Paginación</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Paginación completa</h4>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Solo números</h4>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  showPrevNext={false}
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Compacta</h4>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  showFirstLast={false}
                  siblingCount={0}
                />
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Estados de Eventos */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Estados de Eventos</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-6">
              {/* Estados disponibles */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Estados disponibles para eventos</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Estos son los estados definidos para los eventos del sistema, con sus colores correspondientes para badges y texto.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Planificado */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-semibold text-gray-800">Planificado</h5>
                      <Badge variant="info" className="bg-blue-100 text-blue-800">planned</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Badge:</p>
                        <Badge className="bg-blue-100 text-blue-800">Planificado</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Texto métrica:</p>
                        <span className="text-2xl font-bold text-blue-600">Planificado</span>
                      </div>
                    </div>
                  </div>

                  {/* Confirmado */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-semibold text-gray-800">Confirmado</h5>
                      <Badge variant="success" className="bg-green-100 text-green-800">confirmed</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Badge:</p>
                        <Badge className="bg-green-100 text-green-800">Confirmado</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Texto métrica:</p>
                        <span className="text-2xl font-bold text-green-600">Confirmado</span>
                      </div>
                    </div>
                  </div>

                  {/* En Progreso */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-semibold text-gray-800">En Progreso</h5>
                      <Badge variant="warning" className="bg-yellow-100 text-yellow-800">in_progress</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Badge:</p>
                        <Badge className="bg-yellow-100 text-yellow-800">En Progreso</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Texto métrica:</p>
                        <span className="text-2xl font-bold text-yellow-600">En Progreso</span>
                      </div>
                    </div>
                  </div>

                  {/* Completado */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-semibold text-gray-800">Completado</h5>
                      <Badge variant="default" className="bg-gray-100 text-gray-800">completed</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Badge:</p>
                        <Badge className="bg-gray-100 text-gray-800">Completado</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Texto métrica:</p>
                        <span className="text-2xl font-bold text-gray-600">Completado</span>
                      </div>
                    </div>
                  </div>

                  {/* Cancelado */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-sm font-semibold text-gray-800">Cancelado</h5>
                      <Badge variant="danger" className="bg-red-100 text-red-800">cancelled</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Badge:</p>
                        <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Texto métrica:</p>
                        <span className="text-2xl font-bold text-red-600">Cancelado</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Código de referencia */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Referencia de código</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Tipo TypeScript:</h5>
                    <code className="text-xs bg-white p-2 rounded border text-gray-800 block">
                      type EventStatus = 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
                    </code>
                  </div>
                  
                  <div>
                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Colores para badges/pills:</h5>
                    <code className="text-xs bg-white p-2 rounded border text-gray-800 block whitespace-pre-wrap">
{`const statusColors = {
  planned: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800', 
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}`}
                    </code>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Colores para texto/métricas:</h5>
                    <code className="text-xs bg-white p-2 rounded border text-gray-800 block whitespace-pre-wrap">
{`const statusTextColors = {
  planned: 'text-blue-600',
  confirmed: 'text-green-600',
  in_progress: 'text-yellow-600', 
  completed: 'text-gray-600',
  cancelled: 'text-red-600'
}`}
                    </code>
                  </div>

                  <div>
                    <h5 className="text-xs font-semibold text-gray-600 mb-2">Labels en español:</h5>
                    <code className="text-xs bg-white p-2 rounded border text-gray-800 block whitespace-pre-wrap">
{`const statusLabels = {
  planned: 'Planificado',
  confirmed: 'Confirmado',
  in_progress: 'En Progreso',
  completed: 'Completado', 
  cancelled: 'Cancelado'
}`}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Ejemplo Real */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6">Ejemplo de Uso Real</h3>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header de la tabla */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium text-gray-900">Gestión de Recetas</h4>
                <Button icon={Plus}>
                  Nueva Receta
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  placeholder="Buscar recetas..."
                  icon={Search}
                />
                <Select
                  placeholder="Filtrar por dificultad"
                  options={difficultyOptions}
                />
                <Select
                  placeholder="Filtrar por categoría"
                  options={selectCategoryOptions}
                />
                <Button fullWidth>
                  Aplicar Filtros
                </Button>
              </div>
            </div>

            {/* Tabla de ejemplo */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dificultad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">Paella Valenciana</div>
                      <div className="text-sm text-gray-500">Receta tradicional española</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Intermedio
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Plato Principal
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button size="sm" variant="ghost" icon={Eye}> </Button>
                        <Button size="sm" variant="ghost" icon={Edit}> </Button>
                        <Button size="sm" variant="ghost" icon={Trash2}> </Button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">Gazpacho Andaluz</div>
                      <div className="text-sm text-gray-500">Sopa fría de verano</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Fácil
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Entrante
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button size="sm" variant="ghost" icon={Eye}> </Button>
                        <Button size="sm" variant="ghost" icon={Edit}> </Button>
                        <Button size="sm" variant="ghost" icon={Trash2}> </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Modales */}
      <Modal
        isOpen={showBasicModal}
        onClose={() => setShowBasicModal(false)}
        title="Modal Básico"
        size="md"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Este es un ejemplo de un modal básico. Puede contener cualquier contenido 
            y se puede personalizar según las necesidades.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowBasicModal(false)}>
              Cerrar
            </Button>
            <Button>
              Aceptar
            </Button>
          </div>
        </div>
      </Modal>

      <FormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleFormSubmit}
        title="Crear Nueva Receta"
        loading={loading}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la receta"
            placeholder="Ej: Paella Valenciana"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Dificultad"
              options={difficultyOptions}
              placeholder="Selecciona dificultad"
              required
            />
            <Select
              label="Categoría"
              options={selectCategoryOptions}
              placeholder="Selecciona categoría"
              required
            />
          </div>
          <TextArea
            label="Descripción"
            placeholder="Describe la receta..."
            rows={3}
          />
        </div>
      </FormModal>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          alert('¡Acción confirmada!')
          setShowConfirmModal(false)
        }}
        title="Confirmar eliminación"
        message="¿Estás seguro de que quieres eliminar esta receta? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  )
}