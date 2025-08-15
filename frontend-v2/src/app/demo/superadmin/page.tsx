'use client'

import React, { useState } from 'react'
import { 
  Button, 
  Input, 
  Select, 
  TextArea, 
  Chips,
  Loading, 
  ConfirmModal,
  Modal,
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
  BookOpen,
  Shield,
  Activity,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Database,
  Cpu,
  HardDrive,
  Zap,
  Globe,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Crown,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Calendar,
  MapPin,
  Phone,
  Building,
  CreditCard,
  AlertCircle,
  Info,
  ExternalLink,
  Copy,
  Archive,
  Ban,
  Play,
  Pause,
  StopCircle
} from 'lucide-react'

export default function SuperAdminDemoPage() {
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showBasicModal, setShowBasicModal] = useState(false)
  
  // Toast hooks
  const { showToast, clearAllToasts } = useToast()
  const { success, error, warning, info } = useToastHelpers()
  
  // States para diferentes componentes
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])

  // Datos simulados para el demo
  const mockTenants = [
    {
      id: 1,
      subdomain: 'restaurante-madrid',
      business_name: 'Restaurante Madrid',
      admin_email: 'admin@restaurante-madrid.com',
      subscription_plan: 'premium',
      subscription_status: 'active',
      users_count: 12,
      recipes_count: 245,
      created_at: '2024-01-15',
      last_activity_at: '2024-08-14',
      mrr: 99.00
    },
    {
      id: 2,
      subdomain: 'pizzeria-barcelona',
      business_name: 'Pizzería Barcelona',
      admin_email: 'info@pizzeria-barcelona.com',
      subscription_plan: 'basic',
      subscription_status: 'trial',
      users_count: 5,
      recipes_count: 87,
      created_at: '2024-07-20',
      last_activity_at: '2024-08-13',
      mrr: 29.00
    },
    {
      id: 3,
      subdomain: 'cafe-sevilla',
      business_name: 'Café Sevilla',
      admin_email: 'contacto@cafe-sevilla.com',
      subscription_plan: 'free',
      subscription_status: 'suspended',
      users_count: 3,
      recipes_count: 45,
      created_at: '2024-03-10',
      last_activity_at: '2024-07-15',
      mrr: 0.00
    }
  ]

  const mockMetrics = {
    total_tenants: 1247,
    active_tenants: 892,
    trial_tenants: 234,
    suspended_tenants: 89,
    cancelled_tenants: 32,
    mrr: 28547.50,
    arr: 342570.00,
    growth_rate: 12.5
  }

  const mockSystemHealth = {
    api_response_time: 145,
    database_connections: 234,
    uptime: 99.9,
    cpu_usage: 45,
    memory_usage: 67,
    disk_usage: 23
  }

  const filterOptions = ['Activos', 'Trial', 'Suspendidos', 'Cancelados', 'Premium', 'Basic', 'Free']
  const statusOptions = ['active', 'trial', 'suspended', 'cancelled']
  
  const planOptions = [
    { value: 'free', label: 'Gratuito' },
    { value: 'basic', label: 'Básico' },
    { value: 'premium', label: 'Premium' },
    { value: 'enterprise', label: 'Enterprise' }
  ]

  const roleOptions = [
    { value: 'super_admin_full', label: 'Super Admin Completo' },
    { value: 'super_admin_read', label: 'Solo Lectura' },
    { value: 'super_admin_billing', label: 'Facturación' },
    { value: 'super_admin_support', label: 'Soporte' },
    { value: 'super_admin_dev', label: 'Desarrollo' }
  ]

  // Funciones helper para estilos
  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case 'active':
        return { variant: 'success' as const, className: 'bg-green-100 text-green-800' }
      case 'trial':
        return { variant: 'info' as const, className: 'bg-blue-100 text-blue-800' }
      case 'suspended':
        return { variant: 'warning' as const, className: 'bg-yellow-100 text-yellow-800' }
      case 'cancelled':
        return { variant: 'danger' as const, className: 'bg-red-100 text-red-800' }
      default:
        return { variant: 'default' as const, className: 'bg-gray-100 text-gray-800' }
    }
  }

  const getPlanBadgeProps = (plan: string) => {
    switch (plan) {
      case 'enterprise':
        return { variant: 'default' as const, className: 'bg-purple-100 text-purple-800' }
      case 'premium':
        return { variant: 'success' as const, className: 'bg-green-100 text-green-800' }
      case 'basic':
        return { variant: 'info' as const, className: 'bg-blue-100 text-blue-800' }
      case 'free':
        return { variant: 'default' as const, className: 'bg-gray-100 text-gray-800' }
      default:
        return { variant: 'default' as const, className: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header de la página */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Panel SuperAdmin - Componentes Demo
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-4xl mx-auto">
            Demostración de todos los componentes UI específicos para el panel de administración del SaaS.
            Incluye métricas, tablas de gestión, estados de sistema y elementos de seguridad.
          </p>
        </div>

        {/* Sección: Cards de Métricas Principales */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            Métricas del Dashboard
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Métrica: Total Tenants */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <Card.Content className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Total Tenants</p>
                    <p className="text-3xl font-bold text-blue-900">{mockMetrics.total_tenants.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+{mockMetrics.growth_rate}%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-full">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Métrica: MRR */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <Card.Content className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">MRR</p>
                    <p className="text-3xl font-bold text-green-900">€{mockMetrics.mrr.toLocaleString()}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">+8.3%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-green-500 rounded-full">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Métrica: Tenants Activos */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <Card.Content className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Activos</p>
                    <p className="text-3xl font-bold text-purple-900">{mockMetrics.active_tenants}</p>
                    <div className="flex items-center mt-2">
                      <CheckCircle className="h-4 w-4 text-purple-500 mr-1" />
                      <span className="text-sm text-purple-600">{Math.round((mockMetrics.active_tenants / mockMetrics.total_tenants) * 100)}%</span>
                    </div>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-full">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Métrica: Sistema */}
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
              <Card.Content className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 mb-1">Uptime</p>
                    <p className="text-3xl font-bold text-amber-900">{mockSystemHealth.uptime}%</p>
                    <div className="flex items-center mt-2">
                      <Server className="h-4 w-4 text-amber-500 mr-1" />
                      <span className="text-sm text-amber-600">{mockSystemHealth.api_response_time}ms avg</span>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-500 rounded-full">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Mini métricas de sistema */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Server className="h-5 w-5 text-gray-600" />
              Estado del Sistema
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Cpu className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-sm text-gray-600">CPU</p>
                <p className="text-xl font-bold text-gray-900">{mockSystemHealth.cpu_usage}%</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Database className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm text-gray-600">Memory</p>
                <p className="text-xl font-bold text-gray-900">{mockSystemHealth.memory_usage}%</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <HardDrive className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-sm text-gray-600">Disk</p>
                <p className="text-xl font-bold text-gray-900">{mockSystemHealth.disk_usage}%</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Globe className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-sm text-gray-600">Connections</p>
                <p className="text-xl font-bold text-gray-900">{mockSystemHealth.database_connections}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Tabla de Gestión de Tenants */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Building className="h-6 w-6 text-purple-600" />
            Gestión de Tenants
          </h3>
          
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header con filtros */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-medium text-gray-900">Lista de Tenants</h4>
                  <Badge variant="info" className="bg-blue-100 text-blue-800">
                    {mockTenants.length} total
                  </Badge>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <Input
                    placeholder="Buscar tenants..."
                    icon={Search}
                    className="sm:w-64"
                  />
                  <MultiSelectDropdown
                    options={filterOptions}
                    selected={selectedFilters}
                    onChange={setSelectedFilters}
                    placeholder="Filtrar..."
                    className="sm:w-48"
                  />
                  <Button variant="primary" icon={Plus} size="sm">
                    Nuevo Tenant
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plan / Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Métricas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actividad
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mockTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar name={tenant.business_name} size="sm" />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {tenant.business_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {tenant.subdomain}.tudominio.com
                            </div>
                            <div className="text-xs text-gray-400">
                              {tenant.admin_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge {...getPlanBadgeProps(tenant.subscription_plan)} size="sm">
                            {tenant.subscription_plan.charAt(0).toUpperCase() + tenant.subscription_plan.slice(1)}
                          </Badge>
                          <br />
                          <Badge {...getStatusBadgeProps(tenant.subscription_status)} size="sm">
                            {tenant.subscription_status === 'active' ? 'Activo' : 
                             tenant.subscription_status === 'trial' ? 'Trial' :
                             tenant.subscription_status === 'suspended' ? 'Suspendido' : 'Cancelado'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-gray-400" />
                            <span>{tenant.users_count} usuarios</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ChefHat className="h-3 w-3 text-gray-400" />
                            <span>{tenant.recipes_count} recetas</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-gray-400" />
                            <span>€{tenant.mrr}/mes</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div>Creado: {tenant.created_at}</div>
                          <div>Última actividad: {tenant.last_activity_at}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1">
                          <Button size="sm" variant="ghost" icon={Eye} />
                          <Button size="sm" variant="ghost" icon={Edit} />
                          <Dropdown
                            trigger={<Button size="sm" variant="ghost" icon={Settings} />}
                            items={[
                              { label: 'Ver detalles', value: 'view', icon: Eye },
                              { label: 'Editar', value: 'edit', icon: Edit },
                              { label: 'Suspender', value: 'suspend', icon: Ban },
                              { label: 'Acceder como admin', value: 'impersonate', icon: Crown },
                              { label: 'Eliminar', value: 'delete', icon: Trash2 }
                            ]}
                            onSelect={(item) => info(`Acción seleccionada: ${item.label} para ${tenant.business_name}`)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer con paginación */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando 1 a {mockTenants.length} de {mockTenants.length} resultados
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={5}
                  onPageChange={setCurrentPage}
                  showFirstLast={false}
                  siblingCount={1}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Estados y Badges Específicos */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-600" />
            Estados y Badges del Sistema
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estados de Suscripción */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-medium text-gray-800 mb-4">Estados de Suscripción</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Activo</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Trial</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Clock className="h-3 w-3 mr-1" />
                    Trial
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Suspendido</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Pause className="h-3 w-3 mr-1" />
                    Suspended
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cancelado</span>
                  <Badge className="bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Cancelled
                  </Badge>
                </div>
              </div>
            </div>

            {/* Planes de Suscripción */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-medium text-gray-800 mb-4">Planes de Suscripción</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Gratuito</span>
                  <Badge className="bg-gray-100 text-gray-800">Free</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Básico</span>
                  <Badge className="bg-blue-100 text-blue-800">Basic</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Premium</span>
                  <Badge className="bg-green-100 text-green-800">Premium</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Enterprise</span>
                  <Badge className="bg-purple-100 text-purple-800">
                    <Crown className="h-3 w-3 mr-1" />
                    Enterprise
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Formularios de Administración */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Settings className="h-6 w-6 text-purple-600" />
            Formularios de Administración
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario de Tenant */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-600" />
                Gestión de Tenant
              </h4>
              <div className="space-y-4">
                <Input
                  label="Nombre del Negocio"
                  placeholder="Ej: Restaurante Madrid"
                  icon={Building}
                />
                <Input
                  label="Subdominio"
                  placeholder="restaurante-madrid"
                  icon={Globe}
                  helperText="Se usará como restaurante-madrid.tudominio.com"
                />
                <Input
                  label="Email del Administrador"
                  type="email"
                  placeholder="admin@restaurante.com"
                  icon={Mail}
                />
                <Select
                  label="Plan de Suscripción"
                  options={planOptions}
                  placeholder="Seleccionar plan"
                />
                <TextArea
                  label="Notas Administrativas"
                  placeholder="Notas internas sobre este tenant..."
                  rows={3}
                />
                <div className="flex gap-3">
                  <Button variant="primary" icon={Save} className="flex-1">
                    Guardar Cambios
                  </Button>
                  <Button variant="outline" icon={Archive}>
                    Suspender
                  </Button>
                </div>
              </div>
            </div>

            {/* Formulario de SuperAdmin */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-gray-600" />
                Nuevo SuperAdmin
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Nombre"
                    placeholder="Juan"
                    icon={User}
                  />
                  <Input
                    label="Apellido"
                    placeholder="Pérez"
                    icon={User}
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  placeholder="admin@tudominio.com"
                  icon={Mail}
                />
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="••••••••"
                  icon={Lock}
                />
                <Select
                  label="Rol de SuperAdmin"
                  options={roleOptions}
                  placeholder="Seleccionar rol"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permisos Específicos
                  </label>
                  <Chips
                    options={[
                      { value: 'create_tenants', label: 'Crear Tenants' },
                      { value: 'manage_billing', label: 'Gestionar Facturación' },
                      { value: 'access_monitoring', label: 'Acceso a Monitoreo' },
                      { value: 'impersonate_tenants', label: 'Acceder como Tenant' }
                    ]}
                    selected={['access_monitoring']}
                    onChange={() => {}}
                    variant="primary"
                  />
                </div>
                <Button variant="primary" icon={UserCheck} fullWidth>
                  Crear SuperAdmin
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Acciones y Botones Especializados */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Zap className="h-6 w-6 text-purple-600" />
            Acciones del Sistema
          </h3>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Acciones de Tenant */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">Gestión de Tenants</h4>
                <div className="space-y-2">
                  <Button variant="primary" icon={Plus} size="sm" fullWidth>
                    Crear Tenant
                  </Button>
                  <Button variant="outline" icon={Crown} size="sm" fullWidth>
                    Acceder como Admin
                  </Button>
                  <Button variant="warning" icon={Pause} size="sm" fullWidth>
                    Suspender Cuenta
                  </Button>
                  <Button variant="danger" icon={Ban} size="sm" fullWidth>
                    Cancelar Suscripción
                  </Button>
                </div>
              </div>

              {/* Acciones de Sistema */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">Sistema</h4>
                <div className="space-y-2">
                  <Button variant="secondary" icon={RefreshCw} size="sm" fullWidth>
                    Recalcular Métricas
                  </Button>
                  <Button variant="outline" icon={Download} size="sm" fullWidth>
                    Exportar Datos
                  </Button>
                  <Button variant="outline" icon={Upload} size="sm" fullWidth>
                    Importar Configuración
                  </Button>
                  <Button variant="ghost" icon={Server} size="sm" fullWidth>
                    Estado del Sistema
                  </Button>
                </div>
              </div>

              {/* Acciones de Facturación */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">Facturación</h4>
                <div className="space-y-2">
                  <Button variant="success" icon={CreditCard} size="sm" fullWidth>
                    Procesar Pago
                  </Button>
                  <Button variant="outline" icon={Download} size="sm" fullWidth>
                    Generar Factura
                  </Button>
                  <Button variant="secondary" icon={BarChart3} size="sm" fullWidth>
                    Reportes Financieros
                  </Button>
                  <Button variant="ghost" icon={TrendingUp} size="sm" fullWidth>
                    Análisis de Ingresos
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Alertas y Notificaciones */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-purple-600" />
            Alertas y Notificaciones
          </h3>
          
          <div className="space-y-4">
            {/* Alertas del Sistema */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800">Alerta Crítica</h4>
                  <p className="text-sm text-red-700 mt-1">
                    El tenant "restaurante-madrid" ha excedido su límite de usuarios (15/10). 
                    Se requiere upgrade a plan Premium.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="danger">
                      Suspender Cuenta
                    </Button>
                    <Button size="sm" variant="outline">
                      Contactar Cliente
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-800">Advertencia</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    5 tenants con trial expirando en los próximos 3 días. Se recomienda seguimiento comercial.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="warning">
                      Ver Lista
                    </Button>
                    <Button size="sm" variant="outline">
                      Enviar Recordatorio
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-800">Información</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Mantenimiento programado del sistema para mañana a las 02:00 AM. 
                    Duración estimada: 2 horas.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="secondary">
                      Ver Detalles
                    </Button>
                    <Button size="sm" variant="outline">
                      Notificar Tenants
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-800">Éxito</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Backup automático completado exitosamente. 
                    1,247 bases de datos respaldadas correctamente.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="success">
                      Ver Reporte
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sección: Botones de Prueba de Toast */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Activity className="h-6 w-6 text-purple-600" />
            Notificaciones Toast (Pruebas)
          </h3>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                variant="success"
                onClick={() => success('Tenant creado exitosamente', 'Operación Completada')}
                fullWidth
              >
                Toast Éxito
              </Button>
              <Button 
                variant="danger"
                onClick={() => error('Error al suspender tenant', 'Error del Sistema')}
                fullWidth
              >
                Toast Error
              </Button>
              <Button 
                variant="secondary"
                onClick={() => warning('Trial expirando en 2 días', 'Advertencia')}
                fullWidth
              >
                Toast Advertencia
              </Button>
              <Button 
                variant="outline"
                onClick={() => info('Métricas actualizadas', 'Información')}
                fullWidth
              >
                Toast Info
              </Button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button 
                variant="ghost"
                onClick={clearAllToasts}
                fullWidth
              >
                Limpiar Todas las Notificaciones
              </Button>
            </div>
          </div>
        </section>

        {/* Sección: Estados Vacíos */}
        <section className="mb-12">
          <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Package className="h-6 w-6 text-purple-600" />
            Estados Vacíos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200">
              <EmptyState
                icon={Users}
                title="No hay tenants"
                description="Aún no se han registrado tenants en el sistema. Los nuevos registros aparecerán aquí."
                action={{
                  label: 'Crear Primer Tenant',
                  onClick: () => success('Navegando a crear tenant...'),
                  variant: 'primary'
                }}
              />
            </div>

            <div className="bg-white rounded-lg border border-gray-200">
              <EmptyState
                icon={AlertTriangle}
                title="Sin alertas críticas"
                description="No hay alertas críticas del sistema en este momento."
                action={{
                  label: 'Ver Histórico',
                  onClick: () => info('Abriendo histórico de alertas...'),
                  variant: 'outline'
                }}
              />
            </div>
          </div>
        </section>

        {/* Footer de la demo */}
        <div className="bg-gray-800 text-white rounded-lg p-6 text-center">
          <h4 className="text-lg font-semibold mb-2">🎉 Demo Completa del Panel SuperAdmin</h4>
          <p className="text-gray-300">
            Todos los componentes mostrados están listos para ser implementados en el panel de administración.
            Cada elemento sigue los patrones de diseño establecidos y es completamente funcional.
          </p>
        </div>
      </div>

      {/* Modales de demostración */}
      <Modal
        isOpen={showBasicModal}
        onClose={() => setShowBasicModal(false)}
        title="Confirmar Acción"
        size="md"
      >
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Esta es una ventana modal de ejemplo para el panel de superadmin.
          </p>
          <div className="flex justify-end space-x-3">
            <Button variant="secondary" onClick={() => setShowBasicModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary">
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          success('Tenant suspendido correctamente', 'Acción Completada')
          setShowConfirmModal(false)
        }}
        title="Suspender Tenant"
        message="¿Estás seguro de que quieres suspender este tenant? Esta acción bloqueará el acceso inmediatamente."
        confirmText="Sí, Suspender"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  )
}