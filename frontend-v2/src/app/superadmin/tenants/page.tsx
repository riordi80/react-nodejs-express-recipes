'use client';

import { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  PlayIcon,
  PauseIcon,
  UserIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
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

  useEffect(() => {
    if (!isLoading && user) {
      loadTenants();
      loadStats();
    }
  }, [isLoading, user]);

  const loadTenants = async () => {
    try {
      const response = await fetch('/api/superadmin/tenants', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTenants(data.data?.tenants || []);
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
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data?.stats);
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

  // Filtrar tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.admin_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tenant.subscription_status === statusFilter;
    const matchesPlan = planFilter === 'all' || tenant.subscription_plan === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

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

  if (isLoading || loading) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center`}>
        <div className={themeClasses.text}>Cargando tenants...</div>
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
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Crear Tenant
            </button>
          </div>
        </div>

        {/* Tenants Table */}
        <div className={`rounded-lg border overflow-hidden ${themeClasses.card}`}>
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
              <tbody className={`${themeClasses.bg} divide-y ${themeClasses.border}`}>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.tenant_id} className={`${themeClasses.buttonHover}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className={`text-sm font-medium ${themeClasses.text}`}>{tenant.business_name}</div>
                        <div className={`text-sm ${themeClasses.textSecondary}`}>{tenant.subdomain}.tudominio.com</div>
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
          
          {filteredTenants.length === 0 && (
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

      {/* Modals placeholder - implement in next step */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className={`rounded-lg shadow-xl w-full max-w-md ${themeClasses.card}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
              <h3 className={`text-lg font-medium ${themeClasses.text}`}>Crear Nuevo Tenant</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors`}
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className={`${themeClasses.textSecondary} mb-4`}>Funcionalidad en desarrollo...</p>
            </div>
            
            {/* Footer */}
            <div className={`flex items-center justify-end px-6 py-4 border-t ${themeClasses.border} ${themeClasses.bgSecondary}`}>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors`}
              >
                Cerrar
              </button>
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