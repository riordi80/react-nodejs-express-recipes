'use client';

import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
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
    
    // Paso 2: Información del administrador
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    
    // Paso 3: Configuración 
    subscriptionPlan: 'basic',
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
      adminFirstName: '',
      adminLastName: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
      subscriptionPlan: 'basic',
      notes: ''
    });
  };

  const handleCreateModalClose = () => {
    setShowCreateModal(false);
    resetCreateModal();
  };

  const handleCreateFormChange = (field: string, value: string) => {
    setCreateFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`rounded-lg p-6 border ${themeClasses.card}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${themeClasses.textSecondary} text-sm`}>Total Tenants</p>
                  <p className={`text-2xl font-bold ${themeClasses.text}`}>{stats.total_tenants}</p>
                </div>
                <BuildingOfficeIcon className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            
            <div className={`rounded-lg p-6 border ${themeClasses.card}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${themeClasses.textSecondary} text-sm`}>Activos</p>
                  <p className="text-2xl font-bold text-green-400">{stats.active_tenants}</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-green-400" />
              </div>
            </div>
            
            <div className={`rounded-lg p-6 border ${themeClasses.card}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${themeClasses.textSecondary} text-sm`}>En Prueba</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.trial_tenants}</p>
                </div>
                <UserIcon className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            
            <div className={`rounded-lg p-6 border ${themeClasses.card}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${themeClasses.textSecondary} text-sm`}>Suspendidos</p>
                  <p className="text-2xl font-bold text-red-400">{stats.suspended_tenants}</p>
                </div>
                <PauseIcon className="h-8 w-8 text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className={`rounded-lg border p-6 mb-8 ${themeClasses.card}`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className={`h-5 w-5 absolute left-3 top-3 ${themeClasses.textSecondary}`} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, subdominio o email..."
                  className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg pl-10 pr-4 py-2 ${themeClasses.text} placeholder-${isDark ? 'slate-400' : 'gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <select
              className={`${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-4 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="trial">En prueba</option>
              <option value="suspended">Suspendidos</option>
              <option value="cancelled">Cancelados</option>
            </select>

            {/* Plan Filter */}
            <select
              className={`${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-4 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="all">Todos los planes</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>

            {/* Create Button */}
            <button
              onClick={() => {
                resetCreateModal();
                setShowCreateModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Crear Tenant
            </button>
          </div>
        </div>

        {/* Tenants Table */}
        <div className={`rounded-lg border overflow-hidden ${themeClasses.card}`} key={tableKey}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={themeClasses.bgSecondary}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Tenant
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Plan
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Estado
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Límites
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Creado
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${themeClasses.textSecondary} uppercase tracking-wider`}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className={`${themeClasses.bg} divide-y ${themeClasses.border}`} key={`tbody-${tableKey}-${filteredTenants.length}`}>
                {loading ? (
                  <tr key="loading-row">
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                        <span className={themeClasses.text}>Cargando tenants...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTenants.map((tenant, index) => (
                  <tr key={`${tenant.tenant_id}-${tableKey}-${index}`} className={`${themeClasses.buttonHover}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className={`text-sm font-medium ${themeClasses.text}`}>{tenant.business_name}</div>
                        <div className={`text-sm ${themeClasses.textSecondary}`}>{tenant.subdomain}.{baseDomain}</div>
                        <div className={`text-sm ${themeClasses.textSecondary}`}>{tenant.admin_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanBadge(tenant.subscription_plan)}`}>
                        {tenant.subscription_plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(tenant.subscription_status)}`}>
                        {tenant.subscription_status}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.text}`}>
                      <div>Usuarios: {tenant.max_users}</div>
                      <div>Recetas: {tenant.max_recipes}</div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${themeClasses.text}`}>
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {!loading && filteredTenants.length === 0 && (
            <div className="text-center py-12">
              <BuildingOfficeIcon className={`mx-auto h-12 w-12 ${themeClasses.textSecondary}`} />
              <h3 className={`mt-2 text-sm font-medium ${themeClasses.text}`}>No hay tenants</h3>
              <p className={`mt-1 text-sm ${themeClasses.textSecondary}`}>
                {searchTerm || statusFilter !== 'all' || planFilter !== 'all' 
                  ? 'No se encontraron tenants con los filtros aplicados.'
                  : 'Comienza creando tu primer tenant.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Tenant - Multi-Step Wizard */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleCreateModalClose}
        >
          <div 
            className={`rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden ${themeClasses.card}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
              <div>
                <h3 className={`text-lg font-medium ${themeClasses.text}`}>Crear Nuevo Tenant</h3>
                <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                  Paso {createStep} de 4: {createStep === 1 ? 'Información básica' : createStep === 2 ? 'Administrador' : createStep === 3 ? 'Plan y configuración' : 'Confirmación'}
                </p>
              </div>
              <button
                onClick={handleCreateModalClose}
                className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
                disabled={createLoading}
              >
                ✕
              </button>
            </div>

            {/* Progress Bar */}
            <div className={`px-6 py-4 ${themeClasses.bgSecondary}`}>
              <div className="flex items-center justify-center">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div 
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
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
                      <span className={`text-xs mt-1 ${step <= createStep ? 'text-blue-600 font-medium' : themeClasses.textSecondary}`}>
                        {step === 1 ? 'Información' : step === 2 ? 'Administrador' : step === 3 ? 'Plan' : 'Confirmación'}
                      </span>
                    </div>
                    {step < 4 && (
                      <div 
                        className={`
                          w-16 h-0.5 mx-3 transition-all duration-200
                          ${step < createStep ? 'bg-blue-600' : themeClasses.border}
                        `}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-220px)]">
              <div className="p-6">
                {/* Paso 1: Información básica del tenant */}
                {createStep === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className={`text-lg font-medium ${themeClasses.text} mb-4`}>Información del Tenant</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                            Subdominio *
                          </label>
                          <div className="flex items-stretch">
                            <input
                              type="text"
                              value={createFormData.subdomain}
                              onChange={(e) => handleCreateFormChange('subdomain', e.target.value.toLowerCase())}
                              className={`flex-1 ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-l-lg px-3 py-2.5 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                              placeholder="mirestaurante"
                              pattern="[a-z0-9-]+"
                            />
                            <div className={`flex items-center px-3 py-2.5 ${themeClasses.bgSecondary} border-t border-r border-b ${themeClasses.border} rounded-r-lg ${themeClasses.textSecondary} text-sm bg-opacity-50`}>
                              .{baseDomain}
                            </div>
                          </div>
                          <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                            Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
                          </p>
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
                      </div>
                    </div>
                  </div>
                )}

                {/* Paso 2: Información del administrador */}
                {createStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className={`text-lg font-medium ${themeClasses.text} mb-4`}>Administrador del Tenant</h4>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        
                        <div>
                          <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                            Email *
                          </label>
                          <input
                            type="email"
                            value={createFormData.adminEmail}
                            onChange={(e) => handleCreateFormChange('adminEmail', e.target.value)}
                            className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="admin@mirestaurante.com"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                  </div>
                )}

                {/* Paso 3: Plan y configuración */}
                {createStep === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className={`text-lg font-medium ${themeClasses.text} mb-4`}>Plan de Suscripción</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-3`}>
                            Selecciona el plan inicial *
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Plan Free */}
                            <div 
                              onClick={() => handleCreateFormChange('subscriptionPlan', 'free')}
                              className={`
                                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                                ${createFormData.subscriptionPlan === 'free' 
                                  ? `border-blue-500 ${isDark ? 'bg-blue-900/20 border-blue-400' : 'bg-blue-50 border-blue-500'}` 
                                  : `${themeClasses.border} ${themeClasses.card} ${themeClasses.buttonHover}`
                                }
                              `}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className={`font-medium ${themeClasses.text}`}>Free Trial</h5>
                                <span className="text-green-500 font-bold">Gratis</span>
                              </div>
                              <p className={`text-sm ${themeClasses.textSecondary} mb-3`}>
                                Perfecto para probar el sistema
                              </p>
                              <ul className={`text-xs ${themeClasses.textSecondary} space-y-1`}>
                                <li>• 30 días de prueba</li>
                                <li>• 2 usuarios máximo</li>
                                <li>• 50 recetas máximo</li>
                                <li>• Soporte básico</li>
                              </ul>
                            </div>

                            {/* Plan Basic */}
                            <div 
                              onClick={() => handleCreateFormChange('subscriptionPlan', 'basic')}
                              className={`
                                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                                ${createFormData.subscriptionPlan === 'basic' 
                                  ? `border-blue-500 ${isDark ? 'bg-blue-900/20 border-blue-400' : 'bg-blue-50 border-blue-500'}` 
                                  : `${themeClasses.border} ${themeClasses.card} ${themeClasses.buttonHover}`
                                }
                              `}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className={`font-medium ${themeClasses.text}`}>Basic</h5>
                                <span className="text-blue-500 font-bold">€29/mes</span>
                              </div>
                              <p className={`text-sm ${themeClasses.textSecondary} mb-3`}>
                                Para restaurantes pequeños
                              </p>
                              <ul className={`text-xs ${themeClasses.textSecondary} space-y-1`}>
                                <li>• 5 usuarios máximo</li>
                                <li>• 200 recetas máximo</li>
                                <li>• Gestión de ingredientes</li>
                                <li>• Soporte email</li>
                              </ul>
                            </div>

                            {/* Plan Premium */}
                            <div 
                              onClick={() => handleCreateFormChange('subscriptionPlan', 'premium')}
                              className={`
                                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                                ${createFormData.subscriptionPlan === 'premium' 
                                  ? `border-blue-500 ${isDark ? 'bg-blue-900/20 border-blue-400' : 'bg-blue-50 border-blue-500'}` 
                                  : `${themeClasses.border} ${themeClasses.card} ${themeClasses.buttonHover}`
                                }
                              `}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className={`font-medium ${themeClasses.text}`}>Premium</h5>
                                <span className="text-purple-500 font-bold">€79/mes</span>
                              </div>
                              <p className={`text-sm ${themeClasses.textSecondary} mb-3`}>
                                Para restaurantes medianos
                              </p>
                              <ul className={`text-xs ${themeClasses.textSecondary} space-y-1`}>
                                <li>• 15 usuarios máximo</li>
                                <li>• 1000 recetas máximo</li>
                                <li>• Gestión de eventos</li>
                                <li>• Analytics avanzados</li>
                              </ul>
                            </div>

                            {/* Plan Enterprise */}
                            <div 
                              onClick={() => handleCreateFormChange('subscriptionPlan', 'enterprise')}
                              className={`
                                p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                                ${createFormData.subscriptionPlan === 'enterprise' 
                                  ? `border-blue-500 ${isDark ? 'bg-blue-900/20 border-blue-400' : 'bg-blue-50 border-blue-500'}` 
                                  : `${themeClasses.border} ${themeClasses.card} ${themeClasses.buttonHover}`
                                }
                              `}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className={`font-medium ${themeClasses.text}`}>Enterprise</h5>
                                <span className="text-yellow-500 font-bold">Personalizado</span>
                              </div>
                              <p className={`text-sm ${themeClasses.textSecondary} mb-3`}>
                                Para cadenas de restaurantes
                              </p>
                              <ul className={`text-xs ${themeClasses.textSecondary} space-y-1`}>
                                <li>• Usuarios ilimitados</li>
                                <li>• Recetas ilimitadas</li>
                                <li>• Multi-location</li>
                                <li>• Soporte prioritario</li>
                              </ul>
                            </div>
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
                            placeholder="Información adicional sobre el cliente o configuración especial..."
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paso 4: Confirmación */}
                {createStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h4 className={`text-lg font-medium ${themeClasses.text} mb-4`}>Confirmación</h4>
                      
                      <div className={`p-4 rounded-lg border ${themeClasses.border} ${themeClasses.bgSecondary} space-y-4`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className={`${themeClasses.textSecondary}`}>Subdominio:</span>
                            <p className={`${themeClasses.text} font-medium`}>{createFormData.subdomain}.{baseDomain}</p>
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
                            <p className={`${themeClasses.text} font-medium`}>{createFormData.adminEmail}</p>
                          </div>
                          <div>
                            <span className={`${themeClasses.textSecondary}`}>Plan seleccionado:</span>
                            <p className={`${themeClasses.text} font-medium capitalize`}>
                              {createFormData.subscriptionPlan}
                              {createFormData.subscriptionPlan === 'free' && ' Trial'}
                            </p>
                          </div>
                          {createFormData.notes && (
                            <div className="md:col-span-2">
                              <span className={`${themeClasses.textSecondary}`}>Notas:</span>
                              <p className={`${themeClasses.text} text-sm`}>{createFormData.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className={`mt-4 p-3 rounded ${isDark ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-200'} border`}>
                          <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                            ℹ️ Se creará una base de datos completa con datos de ejemplo para que el tenant pueda comenzar inmediatamente.
                            {createFormData.subscriptionPlan === 'free' 
                              ? ' El plan inicial será Free Trial por 30 días.'
                              : ` El plan inicial será ${createFormData.subscriptionPlan}.`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer con navegación */}
            <div className={`flex items-center justify-between px-6 py-4 border-t ${themeClasses.border} ${themeClasses.bgSecondary}`}>
              <div className="flex items-center gap-2">
                {createStep > 1 && (
                  <button
                    onClick={handleStepPrev}
                    disabled={createLoading}
                    className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors disabled:opacity-50`}
                  >
                    Anterior
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateModalClose}
                  disabled={createLoading}
                  className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors`}
                >
                  Cancelar
                </button>
                
                {createStep < 4 ? (
                  <button
                    onClick={handleStepNext}
                    disabled={createLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    onClick={handleCreateTenant}
                    disabled={createLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {createLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Creando...
                      </>
                    ) : (
                      'Crear Tenant'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedTenant && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetailsModal(false)}
        >
          <div 
            className={`rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden ${themeClasses.card}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
              <h3 className={`text-lg font-medium ${themeClasses.text}`}>Detalles del Tenant</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Nombre del Negocio</label>
                    <p className={`text-lg ${themeClasses.text}`}>{selectedTenant.business_name}</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Subdominio</label>
                    <p className={`text-lg ${themeClasses.text}`}>{selectedTenant.subdomain}</p>
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Email Administrador</label>
                  <p className={`text-lg ${themeClasses.text}`}>{selectedTenant.admin_email}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
            
            {/* Footer */}
            <div className={`flex items-center justify-end px-6 py-4 border-t ${themeClasses.border} ${themeClasses.bgSecondary}`}>
              <button
                onClick={() => setShowDetailsModal(false)}
                className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}