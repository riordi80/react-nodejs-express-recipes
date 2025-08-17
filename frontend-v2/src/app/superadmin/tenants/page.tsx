'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  EyeIcon, 
  PlayIcon,
  PauseIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';
import { SuperAdminStatsCards, SuperAdminFilters, SuperAdminTable, SuperAdminModal } from '@/components/superadmin';

interface Tenant {
  tenant_id: string;
  subdomain: string;
  business_name: string;
  admin_email: string;
  subscription_plan: 'free' | 'basic' | 'premium' | 'enterprise';
  subscription_status: 'active' | 'suspended' | 'cancelled' | 'trial';
  max_users: number;
  max_recipes: number;
  created_at: string;
  last_activity_at: string;
  is_active: boolean;
}

interface TenantStats {
  total_tenants: number;
  active_tenants: number;
  trial_tenants: number;
  suspended_tenants: number;
}

export default function TenantsPage() {
  const { user, loading: isLoading } = useSuperAdmin();
  const { getThemeClasses, isDark } = useSuperAdminTheme();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const themeClasses = getThemeClasses();
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Estados para el modal de crear tenant
  const [createStep, setCreateStep] = useState(1);
  const [createLoading, setCreateLoading] = useState(false);
  
  // Key para forzar re-render de la tabla
  const [tableKey, setTableKey] = useState(0);
  
  // Detectar dominio base dinámicamente
  const getBaseDomain = () => {
    if (typeof window === 'undefined') return 'tudominio.com';
    
    const hostname = window.location.hostname;
    
    // Si estamos en localhost, usar el dominio por defecto
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'localhost:3000';
    }
    
    // Si es un subdominio (console.dominio.com), extraer el dominio base
    if (hostname.includes('.')) {
      const parts = hostname.split('.');
      if (parts.length > 2) {
        // Es un subdominio como console.ordidev.com -> ordidev.com
        return parts.slice(1).join('.');
      }
      // Ya es el dominio base
      return hostname;
    }
    
    return hostname;
  };
  
  const baseDomain = getBaseDomain();
  const [createFormData, setCreateFormData] = useState({
    // Paso 1: Información básica del tenant
    subdomain: '',
    businessName: '',
    description: '',
    
    // Paso 2: Información del administrador
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    
    // Paso 3: Configuración 
    subscriptionPlan: 'basic',
    maxUsers: 5,
    maxRecipes: 100,
    notes: ''
  });

  useEffect(() => {
    if (!isLoading && user) {
      loadTenants();
      loadStats();
    }
  }, [isLoading, user]);

  const loadTenants = async () => {
    try {
      // Agregar timestamp para evitar cache del navegador
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/superadmin/tenants?t=${timestamp}`, {
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const newTenants = data.data?.tenants || [];
        
        // Forzar actualización del estado con clave única para triggerar re-render
        setTenants([...newTenants]);
        setTableKey(prev => prev + 1); // Forzar re-render de tabla
      } else {
        console.error('Error loading tenants:', response.status);
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/superadmin/tenants/stats', {
        credentials: 'include',
        cache: 'no-cache' // Forzar recarga desde servidor
      });
      
      if (response.ok) {
        const data = await response.json();
        const newStats = data.data?.stats;
        setStats(newStats);
      } else {
        console.error('Error loading stats:', response.status);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSuspendTenant = async (tenantId: string) => {
    if (!confirm('¿Estás seguro de que quieres suspender este tenant?')) return;
    
    try {
      const response = await fetch(`/api/superadmin/tenants/${tenantId}/suspend`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        loadTenants();
        loadStats();
      }
    } catch (error) {
      console.error('Error suspending tenant:', error);
    }
  };

  const handleActivateTenant = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/superadmin/tenants/${tenantId}/activate`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        loadTenants();
        loadStats();
      }
    } catch (error) {
      console.error('Error activating tenant:', error);
    }
  };

  const handleImpersonate = async (tenant: Tenant) => {
    if (!confirm(`¿Acceder como administrador al tenant "${tenant.business_name}"?`)) return;
    
    try {
      const response = await fetch(`/api/superadmin/tenants/${tenant.tenant_id}/impersonate`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        // Abrir en nueva pestaña
        window.open(data.data.redirect_url, '_blank');
      }
    } catch (error) {
      console.error('Error impersonating tenant:', error);
    }
  };

  // Funciones del modal crear tenant
  const resetCreateModal = () => {
    setCreateStep(1);
    setCreateLoading(false);
    setCreateFormData({
      subdomain: '',
      businessName: '',
      description: '',
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
      subscriptionPlan: 'basic',
      maxUsers: 5,
      maxRecipes: 100,
      notes: ''
    });
  };

  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    resetCreateModal();
  };

  const handleCreateFormChange = (field: string, value: string | number) => {
    setCreateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return createFormData.subdomain.trim().length >= 3 && 
               createFormData.businessName.trim().length > 0;
      case 2:
        return createFormData.adminFirstName.trim().length > 0 &&
               createFormData.adminLastName.trim().length > 0 &&
               createFormData.adminEmail.trim().length > 0 &&
               createFormData.adminPassword.length >= 6 &&
               createFormData.adminPassword === createFormData.confirmPassword;
      case 3:
        return createFormData.subscriptionPlan.length > 0 &&
               createFormData.maxUsers > 0 &&
               createFormData.maxRecipes > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const validateStep = (step: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        if (!createFormData.subdomain.trim()) errors.push('El subdominio es requerido');
        else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(createFormData.subdomain.toLowerCase()) || createFormData.subdomain.length < 3) {
          errors.push('El subdominio debe tener al menos 3 caracteres y solo contener letras minúsculas, números y guiones');
        }
        if (!createFormData.businessName.trim()) errors.push('El nombre del negocio es requerido');
        break;
        
      case 2:
        if (!createFormData.adminFirstName.trim()) errors.push('El nombre del administrador es requerido');
        if (!createFormData.adminLastName.trim()) errors.push('El apellido del administrador es requerido');
        if (!createFormData.adminEmail.trim()) errors.push('El email del administrador es requerido');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createFormData.adminEmail)) {
          errors.push('El email no tiene un formato válido');
        }
        if (!createFormData.adminPassword.trim()) errors.push('La contraseña es requerida');
        else if (createFormData.adminPassword.length < 6) {
          errors.push('La contraseña debe tener al menos 6 caracteres');
        }
        if (createFormData.adminPassword !== createFormData.confirmPassword) {
          errors.push('Las contraseñas no coinciden');
        }
        break;
        
      case 3:
        if (!createFormData.subscriptionPlan) errors.push('Debe seleccionar un plan de suscripción');
        break;
    }
    
    return { isValid: errors.length === 0, errors };
  };

  const handleStepNext = () => {
    const validation = validateStep(createStep);
    if (validation.isValid) {
      setCreateStep(prev => prev + 1);
    } else {
      alert(validation.errors.join('\n'));
    }
  };

  const handleStepPrev = () => {
    setCreateStep(prev => prev - 1);
  };

  const handleCreateTenant = async () => {
    // Validar todos los pasos antes de crear
    for (let step = 1; step <= 3; step++) {
      const validation = validateStep(step);
      if (!validation.isValid) {
        alert(`Error en paso ${step}:\n${validation.errors.join('\n')}`);
        setCreateStep(step); // Volver al paso con error
        return;
      }
    }
    
    setCreateLoading(true);
    
    try {
      const response = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          subdomain: createFormData.subdomain.toLowerCase(),
          businessName: createFormData.businessName,
          adminEmail: createFormData.adminEmail.toLowerCase(),
          adminPassword: createFormData.adminPassword,
          adminFirstName: createFormData.adminFirstName,
          adminLastName: createFormData.adminLastName
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('¡Tenant creado exitosamente!');
        handleCreateModalClose();
        
        // Forzar recarga completa con estado limpio
        setLoading(true); // Resetear estado de loading
        setTenants([]); // Limpiar estado actual para forzar re-render
        setTableKey(prev => prev + 1); // Cambiar key para forzar re-mount
        
        // Delay breve para asegurar que el backend ha persistido los datos
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Recargar datos con timestamp para evitar cache
        await Promise.all([
          loadTenants(),
          loadStats()
        ]);
        
        // Forzar un segundo cambio de key después de cargar
        setTimeout(() => {
          setTableKey(prev => prev + 1);
        }, 100);
      } else {
        alert(`Error: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error creating tenant:', error);
      alert('Error al crear el tenant. Inténtalo de nuevo.');
    } finally {
      setCreateLoading(false);
    }
  };


  // Filtrar tenants usando useMemo para forzar recálculo
  const filteredTenants = React.useMemo(() => {
    return tenants.filter(tenant => {
      const matchesSearch = tenant.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tenant.admin_email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || tenant.subscription_status === statusFilter;
      const matchesPlan = planFilter === 'all' || tenant.subscription_plan === planFilter;
      
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [tenants, searchTerm, statusFilter, planFilter, tableKey]);


  const getStatusBadge = (status: string) => {
    if (isDark) {
      const styles = {
        active: 'bg-green-900 text-green-200 border border-green-700',
        trial: 'bg-blue-900 text-blue-200 border border-blue-700',
        suspended: 'bg-red-900 text-red-200 border border-red-700',
        cancelled: 'bg-gray-800 text-gray-200 border border-gray-600'
      };
      return styles[status as keyof typeof styles] || styles.cancelled;
    } else {
      const styles = {
        active: 'bg-green-100 text-green-800 border border-green-200',
        trial: 'bg-blue-100 text-blue-800 border border-blue-200',
        suspended: 'bg-red-100 text-red-800 border border-red-200',
        cancelled: 'bg-gray-200 text-gray-800 border border-gray-300'
      };
      return styles[status as keyof typeof styles] || styles.cancelled;
    }
  };

  const getPlanBadge = (plan: string) => {
    if (isDark) {
      const styles = {
        free: 'bg-gray-800 text-gray-200 border border-gray-600',
        basic: 'bg-blue-900 text-blue-200 border border-blue-700',
        premium: 'bg-purple-900 text-purple-200 border border-purple-700',
        enterprise: 'bg-yellow-900 text-yellow-200 border border-yellow-700'
      };
      return styles[plan as keyof typeof styles] || styles.free;
    } else {
      const styles = {
        free: 'bg-gray-200 text-gray-800 border border-gray-300',
        basic: 'bg-blue-100 text-blue-800 border border-blue-200',
        premium: 'bg-purple-100 text-purple-800 border border-purple-200',
        enterprise: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      };
      return styles[plan as keyof typeof styles] || styles.free;
    }
  };

  // Configuración de columnas para la tabla
  const tableColumns = [
    {
      key: 'tenant_info',
      label: 'Tenant',
      render: (_: any, tenant: Tenant) => (
        <div>
          <div className={`text-sm font-medium ${themeClasses.text}`}>{tenant.business_name}</div>
          <div className={`text-sm ${themeClasses.textSecondary}`}>{tenant.subdomain}.{baseDomain}</div>
          <div className={`text-sm ${themeClasses.textSecondary}`}>{tenant.admin_email}</div>
        </div>
      )
    },
    {
      key: 'subscription_plan',
      label: 'Plan',
      render: (plan: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanBadge(plan)}`}>
          {plan}
        </span>
      )
    },
    {
      key: 'subscription_status',
      label: 'Estado',
      render: (status: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(status)}`}>
          {status}
        </span>
      )
    },
    {
      key: 'limits',
      label: 'Límites',
      render: (_: any, tenant: Tenant) => (
        <div className={`text-sm ${themeClasses.text}`}>
          <div>Usuarios: {tenant.max_users}</div>
          <div>Recetas: {tenant.max_recipes}</div>
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Creado',
      render: (date: string) => (
        <span className={`text-sm ${themeClasses.text}`}>
          {new Date(date).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_: any, tenant: Tenant) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedTenant(tenant);
              setShowDetailsModal(true);
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors"
            title="Ver detalles"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => handleImpersonate(tenant)}
            className="text-green-400 hover:text-green-300 transition-colors"
            title="Impersonar"
          >
            <UserIcon className="h-5 w-5" />
          </button>
          
          {tenant.subscription_status === 'active' ? (
            <button
              onClick={() => handleSuspendTenant(tenant.tenant_id)}
              className="text-red-400 hover:text-red-300 transition-colors"
              title="Suspender"
            >
              <PauseIcon className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => handleActivateTenant(tenant.tenant_id)}
              className="text-green-400 hover:text-green-300 transition-colors"
              title="Activar"
            >
              <PlayIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center`}>
        <div className={themeClasses.text}>Verificando autenticación...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>Gestión de Tenants</h1>
          <p className={themeClasses.textSecondary}>Administra todos los clientes del sistema SaaS</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <SuperAdminStatsCards 
            stats={[
              {
                title: "Total Tenants",
                value: stats.total_tenants,
                color: "blue",
                icon: BuildingOfficeIcon
              },
              {
                title: "Activos",
                value: stats.active_tenants,
                color: "green",
                icon: ChartBarIcon
              },
              {
                title: "En Prueba",
                value: stats.trial_tenants,
                color: "blue",
                icon: UserIcon
              },
              {
                title: "Suspendidos",
                value: stats.suspended_tenants,
                color: "red",
                icon: PauseIcon
              }
            ]}
            columns={4}
          />
        )}

        {/* Filters and Search */}
        <SuperAdminFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por nombre, subdominio o email..."
          filters={[
            {
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "Todos los estados" },
                { value: "active", label: "Activos" },
                { value: "trial", label: "En prueba" },
                { value: "suspended", label: "Suspendidos" },
                { value: "cancelled", label: "Cancelados" }
              ]
            },
            {
              value: planFilter,
              onChange: setPlanFilter,
              options: [
                { value: "all", label: "Todos los planes" },
                { value: "free", label: "Free" },
                { value: "basic", label: "Basic" },
                { value: "premium", label: "Premium" },
                { value: "enterprise", label: "Enterprise" }
              ]
            }
          ]}
          createButton={{
            label: "Crear Tenant",
            shortLabel: "Crear",
            onClick: () => {
              resetCreateModal();
              setShowCreateModal(true);
            },
            icon: PlusIcon
          }}
        />

        {/* Tenants Table */}
        <SuperAdminTable
          columns={tableColumns}
          data={filteredTenants}
          loading={loading}
          tableKey={tableKey}
          emptyState={{
            icon: BuildingOfficeIcon,
            title: "No hay tenants",
            description: searchTerm || statusFilter !== 'all' || planFilter !== 'all' 
              ? 'No se encontraron tenants con los filtros aplicados.'
              : 'Comienza creando tu primer tenant.'
          }}
        />
      </div>

      {/* Modal Crear Tenant - Multi-Step Wizard */}
      <SuperAdminModal
        isOpen={showCreateModal}
        onClose={handleCreateModalClose}
        title="Crear Nuevo Tenant"
        subtitle={`Paso ${createStep} de 4: ${createStep === 1 ? 'Información básica' : createStep === 2 ? 'Administrador' : createStep === 3 ? 'Plan y configuración' : 'Confirmación'}`}
        maxWidth="3xl"
        mobileFullscreen={true}
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-2 w-full">
            <div className="flex items-center justify-start order-2 sm:order-1">
              {createStep > 1 && (
                <button
                  onClick={handleStepPrev}
                  disabled={createLoading}
                  className={`px-3 sm:px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors disabled:opacity-50 text-sm`}
                >
                  Anterior
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={handleCreateModalClose}
                disabled={createLoading}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors text-sm`}
              >
                Cancelar
              </button>
              
              {createStep < 4 ? (
                <button
                  onClick={handleStepNext}
                  disabled={createLoading}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleCreateTenant}
                  disabled={createLoading}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {createLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Creando...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Crear Tenant</span>
                      <span className="sm:hidden">Crear</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        }
      >
        {/* Progress Bar */}
        <div className={`px-3 sm:px-6 py-3 sm:py-4 mb-6 ${themeClasses.bgSecondary} rounded-lg`}>
          <div className="flex items-center justify-center overflow-x-auto">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div 
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-200
                      ${step <= createStep 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : `${themeClasses.bg} ${themeClasses.textSecondary} border-2 ${themeClasses.border}`
                      }
                    `}
                  >
                    {step <= createStep ? (
                      step < createStep ? '✓' : step
                    ) : (
                      step
                    )}
                  </div>
                  <span className={`text-xs mt-1 text-center max-w-16 sm:max-w-none ${step <= createStep ? 'text-blue-600 font-medium' : themeClasses.textSecondary}`}>
                    {step === 1 ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 'Info' : 'Información') : 
                     step === 2 ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 'Admin' : 'Administrador') : 
                     step === 3 ? 'Plan' : 
                     typeof window !== 'undefined' && window.innerWidth < 640 ? 'Conf.' : 'Confirmación'}
                  </span>
                </div>
                {step < 4 && (
                  <div 
                    className={`
                      w-8 sm:w-16 h-0.5 mx-2 sm:mx-3 transition-all duration-200
                      ${step < createStep ? 'bg-blue-600' : themeClasses.border}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {createStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  Subdominio *
                </label>
                <div className="flex items-stretch">
                  <input
                    type="text"
                    value={createFormData.subdomain}
                    onChange={(e) => handleCreateFormChange('subdomain', e.target.value)}
                    className={`flex-1 ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-l-lg px-3 py-2.5 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                    placeholder="mirestaurante"
                    pattern="[a-z0-9-]+"
                  />
                  <div className={`flex items-center px-3 py-2.5 ${themeClasses.bgSecondary} border-t border-r border-b ${themeClasses.border} rounded-r-lg ${themeClasses.textSecondary} text-sm bg-opacity-50`}>
                    .{baseDomain}
                  </div>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  Nombre del Negocio *
                </label>
                <input
                  type="text"
                  value={createFormData.businessName}
                  onChange={(e) => handleCreateFormChange('businessName', e.target.value)}
                  className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Mi Restaurante"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  Descripción (opcional)
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => handleCreateFormChange('description', e.target.value)}
                  className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  rows={3}
                  placeholder="Descripción del negocio..."
                />
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-6">
              <h4 className={`text-lg font-medium ${themeClasses.text} mb-4`}>
                Información del Administrador
              </h4>
              
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  Email del Administrador *
                </label>
                <input
                  type="email"
                  value={createFormData.adminEmail}
                  onChange={(e) => handleCreateFormChange('adminEmail', e.target.value)}
                  className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="admin@mirestaurante.com"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={createFormData.adminFirstName}
                    onChange={(e) => handleCreateFormChange('adminFirstName', e.target.value)}
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Juan"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={createFormData.adminLastName}
                    onChange={(e) => handleCreateFormChange('adminLastName', e.target.value)}
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Pérez"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={createFormData.adminPassword}
                    onChange={(e) => handleCreateFormChange('adminPassword', e.target.value)}
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Confirmar Contraseña *
                  </label>
                  <input
                    type="password"
                    value={createFormData.confirmPassword}
                    onChange={(e) => handleCreateFormChange('confirmPassword', e.target.value)}
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Repetir contraseña"
                  />
                </div>
              </div>
            </div>
          )}

          {createStep === 3 && (
            <div className="space-y-6">
              <h4 className={`text-lg font-medium ${themeClasses.text} mb-6`}>
                Seleccionar Plan de Suscripción
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Plan Free */}
                <div 
                  className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    createFormData.subscriptionPlan === 'free' 
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                      : `${themeClasses.border} ${themeClasses.buttonHover}`
                  }`}
                  onClick={() => handleCreateFormChange('subscriptionPlan', 'free')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h5 className={`text-lg font-semibold ${themeClasses.text}`}>Free Trial</h5>
                    <input
                      type="radio"
                      checked={createFormData.subscriptionPlan === 'free'}
                      onChange={() => {}}
                      className="text-blue-600"
                    />
                  </div>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
                    Perfecto para empezar y probar todas las funcionalidades
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ 30 días gratis
                    </div>
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ Hasta 5 usuarios
                    </div>
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ 100 recetas
                    </div>
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ Soporte por email
                    </div>
                  </div>
                </div>

                {/* Plan Basic */}
                <div 
                  className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    createFormData.subscriptionPlan === 'basic' 
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                      : `${themeClasses.border} ${themeClasses.buttonHover}`
                  }`}
                  onClick={() => handleCreateFormChange('subscriptionPlan', 'basic')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h5 className={`text-lg font-semibold ${themeClasses.text}`}>Basic</h5>
                    <input
                      type="radio"
                      checked={createFormData.subscriptionPlan === 'basic'}
                      onChange={() => {}}
                      className="text-blue-600"
                    />
                  </div>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
                    Para restaurantes pequeños que buscan crecer
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ Hasta 20 usuarios
                    </div>
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ 500 recetas
                    </div>
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ Reportes básicos
                    </div>
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ Soporte prioritario
                    </div>
                  </div>
                </div>

                {/* Plan Premium */}
                <div 
                  className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    createFormData.subscriptionPlan === 'premium' 
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                      : `${themeClasses.border} ${themeClasses.buttonHover}`
                  }`}
                  onClick={() => handleCreateFormChange('subscriptionPlan', 'premium')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h5 className={`text-lg font-semibold ${themeClasses.text}`}>Premium</h5>
                    <input
                      type="radio"
                      checked={createFormData.subscriptionPlan === 'premium'}
                      onChange={() => {}}
                      className="text-blue-600"
                    />
                  </div>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
                    Para restaurantes medianos con operaciones complejas
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ Hasta 50 usuarios
                    </div>
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ 1000 recetas
                    </div>
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ Reportes avanzados
                    </div>
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ Soporte prioritario
                    </div>
                  </div>
                </div>

                {/* Plan Enterprise */}
                <div 
                  className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    createFormData.subscriptionPlan === 'enterprise' 
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' 
                      : `${themeClasses.border} ${themeClasses.buttonHover}`
                  }`}
                  onClick={() => handleCreateFormChange('subscriptionPlan', 'enterprise')}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h5 className={`text-lg font-semibold ${themeClasses.text}`}>Enterprise</h5>
                    <input
                      type="radio"
                      checked={createFormData.subscriptionPlan === 'enterprise'}
                      onChange={() => {}}
                      className="text-blue-600"
                    />
                  </div>
                  <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
                    Para cadenas de restaurantes y grandes operaciones
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ Usuarios ilimitados
                    </div>
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ Recetas ilimitadas
                    </div>
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ Reportes personalizados
                    </div>
                    <div className={`flex items-center ${themeClasses.text}`}>
                      ✓ Soporte dedicado
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Máximo Usuarios
                  </label>
                  <input
                    type="number"
                    value={createFormData.maxUsers}
                    onChange={(e) => handleCreateFormChange('maxUsers', parseInt(e.target.value) || 0)}
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    min="1"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Máximo Recetas
                  </label>
                  <input
                    type="number"
                    value={createFormData.maxRecipes}
                    onChange={(e) => handleCreateFormChange('maxRecipes', parseInt(e.target.value) || 0)}
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  Notas adicionales (opcional)
                </label>
                <textarea
                  value={createFormData.notes}
                  onChange={(e) => handleCreateFormChange('notes', e.target.value)}
                  className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  rows={3}
                  placeholder="Notas adicionales sobre el cliente o configuración especial..."
                />
              </div>
            </div>
          )}

          {createStep === 4 && (
            <div className="space-y-6">
              <h4 className={`text-lg font-medium ${themeClasses.text} mb-6`}>
                Confirmar Creación del Tenant
              </h4>
              
              <div className={`p-6 rounded-lg ${themeClasses.bgSecondary} space-y-4`}>
                <h5 className={`font-medium ${themeClasses.text} mb-4`}>Resumen de la configuración:</h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`${themeClasses.textSecondary}`}>Subdominio:</span>
                    <p className={`${themeClasses.text} font-medium break-all`}>{createFormData.subdomain}.{baseDomain}</p>
                  </div>
                  <div>
                    <span className={`${themeClasses.textSecondary}`}>Negocio:</span>
                    <p className={`${themeClasses.text} font-medium`}>{createFormData.businessName}</p>
                  </div>
                  <div>
                    <span className={`${themeClasses.textSecondary}`}>Administrador:</span>
                    <p className={`${themeClasses.text} font-medium`}>
                      {createFormData.adminFirstName} {createFormData.adminLastName}
                    </p>
                  </div>
                  <div>
                    <span className={`${themeClasses.textSecondary}`}>Email:</span>
                    <p className={`${themeClasses.text} font-medium break-all`}>{createFormData.adminEmail}</p>
                  </div>
                  <div>
                    <span className={`${themeClasses.textSecondary}`}>Plan seleccionado:</span>
                    <p className={`${themeClasses.text} font-medium capitalize`}>
                      {createFormData.subscriptionPlan}
                      {createFormData.subscriptionPlan === 'free' && ' Trial'}
                    </p>
                  </div>
                  {createFormData.notes && (
                    <div className="sm:col-span-2">
                      <span className={`${themeClasses.textSecondary}`}>Notas:</span>
                      <p className={`${themeClasses.text} text-sm`}>{createFormData.notes}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800`}>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  <strong>Importante:</strong> Una vez creado el tenant, se enviará un email de bienvenida al administrador 
                  con las credenciales de acceso y el enlace al subdominio.
                </p>
              </div>
            </div>
          )}
        </div>
      </SuperAdminModal>

      {/* Modal de Detalles del Tenant */}
      <SuperAdminModal
        isOpen={showDetailsModal && !!selectedTenant}
        onClose={() => setShowDetailsModal(false)}
        title="Detalles del Tenant"
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowDetailsModal(false)}
              className={`w-full sm:w-auto px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors text-sm`}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedTenant && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Nombre del Negocio</label>
                <p className={`text-base sm:text-lg ${themeClasses.text}`}>{selectedTenant.business_name}</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Subdominio</label>
                <p className={`text-base sm:text-lg ${themeClasses.text} break-all`}>{selectedTenant.subdomain}</p>
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Email Administrador</label>
              <p className={`text-base sm:text-lg ${themeClasses.text} break-all`}>{selectedTenant.admin_email}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Plan</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPlanBadge(selectedTenant.subscription_plan)}`}>
                  {selectedTenant.subscription_plan}
                </span>
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Estado</label>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(selectedTenant.subscription_status)}`}>
                  {selectedTenant.subscription_status}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Límites</label>
                <div className={`text-sm ${themeClasses.text}`}>
                  <div>Usuarios: {selectedTenant.max_users}</div>
                  <div>Recetas: {selectedTenant.max_recipes}</div>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Creado</label>
                <p className={`text-sm ${themeClasses.text}`}>
                  {new Date(selectedTenant.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </SuperAdminModal>
    </div>
  );
}