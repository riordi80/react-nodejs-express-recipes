'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon,
  PlayIcon,
  PauseIcon,
  UserIcon,
  TrashIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';
import { SuperAdminStatsCards, SuperAdminFilters, SuperAdminTable, ThemedModal, ConfirmModal, PromptModal, MessageModal, TenantDetailModal, TenantEditModal } from '@/components/superadmin';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { useExport } from '@/hooks/useExport';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import BulkActionsBar from '@/components/ui/BulkActionsBar';
import AdvancedFilters from '@/components/ui/AdvancedFilters';

interface Tenant {
  tenant_id: string;
  subdomain: string;
  database_name: string;
  business_name: string;
  admin_email: string;
  subscription_plan: 'free' | 'basic' | 'premium' | 'enterprise';
  subscription_status: 'active' | 'suspended' | 'cancelled' | 'trial';
  max_users: number;
  max_recipes: number;
  max_events?: number;
  created_at: string;
  updated_at?: string;
  last_activity_at?: string;
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Advanced filters hook
  const advancedFilters = useAdvancedFilters({
    items: tenants,
    searchFields: ['business_name', 'subdomain', 'admin_email'],
    getItemDate: (tenant) => tenant.created_at,
    getItemLastActivity: (tenant) => tenant.last_activity_at
  });

  // Set custom filters for status and plan
  React.useEffect(() => {
    advancedFilters.setCustomFilter('subscription_status', statusFilter);
  }, [statusFilter]);

  React.useEffect(() => {
    advancedFilters.setCustomFilter('subscription_plan', planFilter);
  }, [planFilter]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  // This will be initialized after filteredTenants is calculated
  let bulkSelection: ReturnType<typeof useBulkSelection<Tenant>>;

  // Export hook with tenant-specific configuration
  const exportHook = useExport<Tenant>({
    filename: 'tenants_export',
    fields: [
      { key: 'subdomain', label: 'Subdominio' },
      { key: 'business_name', label: 'Nombre del Negocio' },
      { key: 'admin_email', label: 'Email Administrador' },
      { key: 'subscription_plan', label: 'Plan', format: (value) => value.toUpperCase() },
      { key: 'subscription_status', label: 'Estado', format: (value) => value.toUpperCase() },
      { key: 'max_users', label: 'Máximo Usuarios' },
      { key: 'max_recipes', label: 'Máximo Recetas' },
      { 
        key: 'created_at', 
        label: 'Fecha Creación', 
        format: (value) => new Date(value).toLocaleDateString('es-ES')
      },
      {
        key: 'last_activity_at',
        label: 'Última Actividad',
        format: (value: string | undefined) => value ? new Date(value).toLocaleDateString('es-ES') : 'N/A'
      }
    ]
  });
  
  // Estados para las nuevas modales
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: () => void;
    confirmText?: string;
    loading?: boolean;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    onConfirm: (value: string) => void;
    placeholder?: string;
    loading?: boolean;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });

  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    message: '',
    type: 'info'
  });
  
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
    } catch {
      console.error('Fixed error in catch block');
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
    } catch {
      console.error('Fixed error in catch block');
    }
  };

  const handleSuspendTenant = async (tenantId: string) => {
    setPromptModal({
      isOpen: true,
      title: 'Suspender Tenant',
      message: 'Por favor, indica la razón de la suspensión:',
      type: 'warning',
      placeholder: 'Ej: Incumplimiento de términos, pago pendiente...',
      onConfirm: async (reason: string) => {
        setPromptModal(prev => ({ ...prev, loading: true }));
        
        try {
          const response = await fetch(`/api/superadmin/tenants/${tenantId}/suspend`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ reason: reason.trim() })
          });
          
          if (response.ok) {
            setMessageModal({
              isOpen: true,
              title: 'Tenant suspendido',
              message: 'El tenant ha sido suspendido correctamente.',
              type: 'success'
            });
            loadTenants();
            loadStats();
          } else {
            const errorData = await response.json();
            setMessageModal({
              isOpen: true,
              title: 'Error al suspender',
              message: errorData.error || 'Error desconocido',
              type: 'error'
            });
          }
        } catch {
          console.error('Fixed error in catch block');
          setMessageModal({
            isOpen: true,
            title: 'Error de conexión',
            message: 'Error al suspender el tenant. Verifica tu conexión.',
            type: 'error'
          });
        } finally {
          setPromptModal(prev => ({ ...prev, isOpen: false, loading: false }));
        }
      }
    });
  };

  const handleActivateTenant = async (tenantId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Activar Tenant',
      message: '¿Estás seguro de que quieres activar este tenant? El usuario podrá acceder inmediatamente.',
      type: 'success',
      confirmText: 'Activar',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        
        try {
          const response = await fetch(`/api/superadmin/tenants/${tenantId}/activate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            setMessageModal({
              isOpen: true,
              title: 'Tenant activado',
              message: 'El tenant ha sido activado correctamente.',
              type: 'success'
            });
            loadTenants();
            loadStats();
          } else {
            const errorData = await response.json();
            setMessageModal({
              isOpen: true,
              title: 'Error al activar',
              message: errorData.error || 'Error desconocido',
              type: 'error'
            });
          }
        } catch {
          console.error('Fixed error in catch block');
          setMessageModal({
            isOpen: true,
            title: 'Error de conexión',
            message: 'Error al activar el tenant. Verifica tu conexión.',
            type: 'error'
          });
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
        }
      }
    });
  };

  const handleImpersonate = async (tenant: Tenant) => {
    setConfirmModal({
      isOpen: true,
      title: 'Acceder como Administrador',
      message: `¿Quieres acceder como administrador al tenant "${tenant.business_name}"?`,
      type: 'info',
      confirmText: 'Acceder',
      onConfirm: async () => {
        // Continúa con el resto de la función original
        handleImpersonateExecution(tenant);
      }
    });
  };

  const handleImpersonateExecution = async (tenant: Tenant) => {
    
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
    } catch {
      console.error('Fixed error in catch block');
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    // Encontrar el tenant por ID para obtener el subdomain
    const tenant = tenants.find(t => t.tenant_id === tenantId);
    if (!tenant) {
      setMessageModal({
        isOpen: true,
        title: 'Error',
        message: 'No se pudo encontrar el tenant seleccionado.',
        type: 'error'
      });
      return;
    }

    setPromptModal({
      isOpen: true,
      title: 'Eliminar Tenant',
      message: `Esta acción eliminará permanentemente:

• Tenant: ${tenant.business_name} (${tenant.subdomain}).
• La base de datos completa.
• Todos los usuarios asociados.

Esta operación es irreversible. Para continuar escriba exactamente el subdomain: ${tenant.subdomain}`,
      type: 'danger',
      placeholder: `Escribe "${tenant.subdomain}" para confirmar`,
      onConfirm: async (confirmationText: string) => {
        if (confirmationText !== tenant.subdomain) {
          setMessageModal({
            isOpen: true,
            title: 'Confirmación incorrecta',
            message: `Debe escribir exactamente "${tenant.subdomain}" para confirmar la eliminación.`,
            type: 'error'
          });
          return;
        }

        setPromptModal(prev => ({ ...prev, loading: true }));
        
        try {
          const response = await fetch(`/api/superadmin/tenants/${tenantId}`, {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              confirm_deletion: true,
              confirmation_text: tenant.subdomain
            })
          });

          const data = await response.json();

          if (response.ok && data.success) {
            setMessageModal({
              isOpen: true,
              title: 'Tenant Eliminado',
              message: `El tenant "${data.data.tenant.business_name}" ha sido eliminado permanentemente.

Eliminado:
• ${data.data.deleted.users} usuario(s)
• Base de datos: ${data.data.deleted.database ? 'Sí' : 'No existía'}`,
              type: 'success'
            });
            
            // Recargar lista de tenants
            await loadTenants();
            
          } else {
            throw new Error(data.message || 'Error desconocido');
          }
        } catch (error) {
          console.error('Error eliminando tenant:', error);
          setMessageModal({
            isOpen: true,
            title: 'Error de eliminación',
            message: 'Error al eliminar el tenant. Verifica tu conexión y permisos.',
            type: 'error'
          });
        } finally {
          setPromptModal(prev => ({ ...prev, isOpen: false, loading: false }));
        }
      }
    });
  };

  // Función para guardar cambios del tenant editado
  const handleSaveTenant = async (updatedData: any) => {
    if (!selectedTenant) return;

    try {
      const response = await fetch(`/api/superadmin/tenants/${selectedTenant.tenant_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          setMessageModal({
            isOpen: true,
            title: 'Tenant actualizado',
            message: 'Los cambios se han guardado correctamente.',
            type: 'success'
          });

          // Recargar la lista de tenants
          loadTenants();
          loadStats();
        } else {
          setMessageModal({
            isOpen: true,
            title: 'Error al actualizar',
            message: data.error || 'Error desconocido',
            type: 'error'
          });
        }
      } else {
        const errorData = await response.json();
        setMessageModal({
          isOpen: true,
          title: 'Error al actualizar',
          message: errorData.error || 'Error desconocido',
          type: 'error'
        });
      }
    } catch {
      console.error('Fixed error in catch block');
      setMessageModal({
        isOpen: true,
        title: 'Error de conexión',
        message: 'Error al actualizar el tenant. Verifica tu conexión.',
        type: 'error'
      });
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
      setMessageModal({
        isOpen: true,
        title: 'Campos requeridos',
        message: validation.errors.join('\n'),
        type: 'warning'
      });
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
        setMessageModal({
          isOpen: true,
          title: `Error en paso ${step}`,
          message: validation.errors.join('\n'),
          type: 'warning'
        });
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
        setMessageModal({
          isOpen: true,
          title: '¡Tenant creado!',
          message: 'El tenant ha sido creado exitosamente.',
          type: 'success'
        });
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
        setMessageModal({
          isOpen: true,
          title: 'Error al crear tenant',
          message: data.error || 'Error desconocido',
          type: 'error'
        });
      }
    } catch {
      console.error('Fixed error in catch block');
      setMessageModal({
        isOpen: true,
        title: 'Error de conexión',
        message: 'Error al crear el tenant. Inténtalo de nuevo.',
        type: 'error'
      });
    } finally {
      setCreateLoading(false);
    }
  };


  // Use the filtered tenants from the advanced filters hook
  const filteredTenants = React.useMemo(() => {
    return advancedFilters.filteredItems;
  }, [advancedFilters.filteredItems, tableKey]);

  // Initialize bulk selection after filteredTenants is available
  bulkSelection = useBulkSelection({
    items: filteredTenants,
    getItemId: (tenant) => tenant.tenant_id
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
        active: 'bg-green-50 text-green-700 border border-green-300',
        trial: 'bg-blue-50 text-blue-700 border border-blue-300',
        suspended: 'bg-red-50 text-red-700 border border-red-300',
        cancelled: 'bg-gray-100 text-gray-700 border border-gray-300'
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
        free: 'bg-gray-100 text-gray-700 border border-gray-300',
        basic: 'bg-blue-50 text-blue-700 border border-blue-300',
        premium: 'bg-purple-50 text-purple-700 border border-purple-300',
        enterprise: 'bg-amber-50 text-amber-700 border border-amber-300'
      };
      return styles[plan as keyof typeof styles] || styles.free;
    }
  };

  // Function to get icon colors based on theme
  const getIconColors = () => {
    if (isDark) {
      return {
        view: 'text-blue-400 hover:text-blue-300',
        edit: 'text-orange-400 hover:text-orange-300',
        impersonate: 'text-green-400 hover:text-green-300',
        delete: 'text-red-600 hover:text-red-500',
        suspend: 'text-red-400 hover:text-red-300',
        activate: 'text-green-400 hover:text-green-300'
      };
    } else {
      return {
        view: 'text-blue-600 hover:text-blue-700',
        edit: 'text-orange-600 hover:text-orange-700',
        impersonate: 'text-green-600 hover:text-green-700',
        delete: 'text-red-600 hover:text-red-700',
        suspend: 'text-red-600 hover:text-red-700',
        activate: 'text-green-600 hover:text-green-700'
      };
    }
  };

  const iconColors = getIconColors();

  // Bulk actions handlers
  const handleBulkSuspend = () => {
    if (bulkSelection.selectedCount === 0) return;

    setPromptModal({
      isOpen: true,
      title: `Suspender ${bulkSelection.selectedCount} tenant${bulkSelection.selectedCount > 1 ? 's' : ''}`,
      message: 'Por favor, indica la razón de la suspensión para todos los tenants seleccionados:',
      type: 'warning',
      placeholder: 'Ej: Incumplimiento de términos, pago pendiente...',
      onConfirm: async (reason: string) => {
        setPromptModal(prev => ({ ...prev, loading: true }));
        
        try {
          const promises = bulkSelection.selectedItems.map(tenant => 
            fetch(`/api/superadmin/tenants/${tenant.tenant_id}/suspend`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ reason: reason.trim() })
            })
          );
          
          const results = await Promise.allSettled(promises);
          const successes = results.filter(r => r.status === 'fulfilled').length;
          const failures = results.filter(r => r.status === 'rejected').length;
          
          setMessageModal({
            isOpen: true,
            title: 'Operación completada',
            message: `${successes} tenant${successes > 1 ? 's' : ''} suspendido${successes > 1 ? 's' : ''} correctamente${failures > 0 ? `. ${failures} fallaron.` : '.'}`,
            type: failures > 0 ? 'warning' : 'success'
          });
          
          bulkSelection.clearSelection();
          loadTenants();
          loadStats();
        } catch {
          setMessageModal({
            isOpen: true,
            title: 'Error en operación masiva',
            message: 'Error al suspender los tenants seleccionados.',
            type: 'error'
          });
        } finally {
          setPromptModal(prev => ({ ...prev, isOpen: false, loading: false }));
        }
      }
    });
  };

  const handleBulkActivate = () => {
    if (bulkSelection.selectedCount === 0) return;

    setConfirmModal({
      isOpen: true,
      title: `Activar ${bulkSelection.selectedCount} tenant${bulkSelection.selectedCount > 1 ? 's' : ''}`,
      message: `¿Estás seguro de que quieres activar ${bulkSelection.selectedCount} tenant${bulkSelection.selectedCount > 1 ? 's' : ''}? Los usuarios podrán acceder inmediatamente.`,
      type: 'success',
      confirmText: 'Activar todos',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, loading: true }));
        
        try {
          const promises = bulkSelection.selectedItems.map(tenant => 
            fetch(`/api/superadmin/tenants/${tenant.tenant_id}/activate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include'
            })
          );
          
          const results = await Promise.allSettled(promises);
          const successes = results.filter(r => r.status === 'fulfilled').length;
          const failures = results.filter(r => r.status === 'rejected').length;
          
          setMessageModal({
            isOpen: true,
            title: 'Operación completada',
            message: `${successes} tenant${successes > 1 ? 's' : ''} activado${successes > 1 ? 's' : ''} correctamente${failures > 0 ? `. ${failures} fallaron.` : '.'}`,
            type: failures > 0 ? 'warning' : 'success'
          });
          
          bulkSelection.clearSelection();
          loadTenants();
          loadStats();
        } catch {
          setMessageModal({
            isOpen: true,
            title: 'Error en operación masiva',
            message: 'Error al activar los tenants seleccionados.',
            type: 'error'
          });
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false, loading: false }));
        }
      }
    });
  };

  const handleBulkExport = async (format: 'csv' | 'json') => {
    if (bulkSelection.selectedCount === 0) return;
    
    const success = format === 'csv' 
      ? await exportHook.exportToCSV(bulkSelection.selectedItems)
      : await exportHook.exportToJSON(bulkSelection.selectedItems);
    
    if (success) {
      setMessageModal({
        isOpen: true,
        title: 'Exportación completada',
        message: `${bulkSelection.selectedCount} tenant${bulkSelection.selectedCount > 1 ? 's' : ''} exportado${bulkSelection.selectedCount > 1 ? 's' : ''} en formato ${format.toUpperCase()}.`,
        type: 'success'
      });
    } else {
      setMessageModal({
        isOpen: true,
        title: 'Error de exportación',
        message: 'No se pudo completar la exportación.',
        type: 'error'
      });
    }
  };

  const handleBulkDelete = () => {
    if (bulkSelection.selectedCount === 0) return;

    setPromptModal({
      isOpen: true,
      title: `Eliminar ${bulkSelection.selectedCount} tenant${bulkSelection.selectedCount > 1 ? 's' : ''} PERMANENTEMENTE`,
      message: `ATENCIÓN: Esta acción eliminará PERMANENTEMENTE ${bulkSelection.selectedCount} tenant${bulkSelection.selectedCount > 1 ? 's' : ''}:

${bulkSelection.selectedItems.map(t => `• ${t.business_name} (${t.subdomain})`).join('\n')}

ESTO INCLUYE:
• Todas las bases de datos
• Todos los usuarios asociados
• Todos los datos sin posibilidad de recuperación

Para confirmar, escribe exactamente "ELIMINAR":`,
      type: 'danger',
      placeholder: 'Escribe ELIMINAR para confirmar',
      onConfirm: async (confirmationText: string) => {
        if (confirmationText !== 'ELIMINAR') {
          setMessageModal({
            isOpen: true,
            title: 'Confirmación incorrecta',
            message: 'Debe escribir exactamente "ELIMINAR" para confirmar la eliminación masiva.',
            type: 'error'
          });
          return;
        }

        setPromptModal(prev => ({ ...prev, loading: true }));
        
        const results = await Promise.allSettled(
          bulkSelection.selectedItems.map(async (tenant) => {
            const response = await fetch(`/api/superadmin/tenants/${tenant.tenant_id}`, {
              method: 'DELETE',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                confirm_deletion: true,
                confirmation_text: 'ELIMINAR'
              })
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(`${tenant.business_name}: ${errorData.message}`);
            }

            const data = await response.json();
            return {
              tenant: tenant.business_name,
              success: true,
              deleted: data.data.deleted
            };
          })
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected');

        let message = `Eliminación masiva completada:
• ${successful} tenant${successful !== 1 ? 's' : ''} eliminado${successful !== 1 ? 's' : ''} exitosamente`;

        if (failed.length > 0) {
          message += `\n• ${failed.length} fallo${failed.length !== 1 ? 's' : ''}:`;
          failed.forEach((failure: any) => {
            message += `\n  - ${failure.reason?.message || 'Error desconocido'}`;
          });
        }

        setMessageModal({
          isOpen: true,
          title: 'Eliminación Masiva Completada',
          message,
          type: failed.length === 0 ? 'success' : 'warning'
        });

        // Limpiar selección y recargar
        bulkSelection.clearSelection();
        await loadTenants();
        setPromptModal(prev => ({ ...prev, isOpen: false, loading: false }));
      }
    });
  };

  // Define bulk actions
  const bulkActions = [
    {
      id: 'suspend',
      label: 'Suspender',
      icon: <PauseIcon className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: handleBulkSuspend,
      disabled: bulkSelection.selectedItems.every(t => t.subscription_status === 'suspended')
    },
    {
      id: 'activate',
      label: 'Activar',
      icon: <PlayIcon className="w-4 h-4" />,
      variant: 'success' as const,
      onClick: handleBulkActivate,
      disabled: bulkSelection.selectedItems.every(t => t.subscription_status === 'active')
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: <TrashIcon className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: handleBulkDelete,
      disabled: false
    },
    {
      id: 'export-csv',
      label: 'CSV',
      icon: <DocumentTextIcon className="w-4 h-4" />,
      variant: 'secondary' as const,
      onClick: () => handleBulkExport('csv'),
      disabled: exportHook.exporting
    },
    {
      id: 'export-json',
      label: 'JSON',
      icon: <ArrowDownTrayIcon className="w-4 h-4" />,
      variant: 'secondary' as const,
      onClick: () => handleBulkExport('json'),
      disabled: exportHook.exporting
    }
  ];

  // Configuración de columnas para la tabla
  const tableColumns = [
    {
      key: 'selection',
      label: '',
      width: '50px',
      headerRender: () => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={bulkSelection.isAllSelected}
            ref={(input) => {
              if (input) input.indeterminate = bulkSelection.isIndeterminate;
            }}
            onChange={(e) => bulkSelection.handleSelectAll(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      ),
      render: (_: any, tenant: Tenant) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={bulkSelection.selectedIds.has(tenant.tenant_id)}
            onChange={(e) => bulkSelection.handleSelectItem(tenant.tenant_id, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      )
    },
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
            className={`${iconColors.view} transition-colors`}
            title="Ver detalles"
          >
            <EyeIcon className="h-5 w-5" />
          </button>

          <button
            onClick={() => {
              setSelectedTenant(tenant);
              setShowEditModal(true);
            }}
            className={`${iconColors.edit} transition-colors`}
            title="Editar tenant"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => handleImpersonate(tenant)}
            className={`${iconColors.impersonate} transition-colors`}
            title="Impersonar"
          >
            <UserIcon className="h-5 w-5" />
          </button>

          <button
            onClick={() => handleDeleteTenant(tenant.tenant_id)}
            className={`${iconColors.delete} transition-colors`}
            title="Eliminar permanentemente"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          
          {tenant.subscription_status === 'active' ? (
            <button
              onClick={() => handleSuspendTenant(tenant.tenant_id)}
              className={`${iconColors.suspend} transition-colors`}
              title="Suspender"
            >
              <PauseIcon className="h-5 w-5" />
            </button>
          ) : tenant.subscription_status === 'suspended' ? (
            <button
              onClick={() => handleActivateTenant(tenant.tenant_id)}
              className={`${iconColors.activate} transition-colors`}
              title="Activar"
            >
              <PlayIcon className="h-5 w-5" />
            </button>
          ) : (
            // Trial tenants can access the system - no action needed
            <span className={`text-sm font-medium px-2 py-1 rounded-md ${getStatusBadge(tenant.subscription_status)}`}>
              {tenant.subscription_status === 'trial' ? 'Trial' : tenant.subscription_status}
            </span>
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
          searchTerm={advancedFilters.searchTerm}
          onSearchChange={advancedFilters.setSearchTerm}
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

        {/* Advanced Filters */}
        <AdvancedFilters
          dateFilter={advancedFilters.dateFilter}
          onDateFilterChange={advancedFilters.setDateFilter}
          activityFilter={advancedFilters.activityFilter}
          onActivityFilterChange={advancedFilters.setActivityFilter}
          dateRange={advancedFilters.dateRange}
          onDateRangeChange={advancedFilters.setDateRange}
          onClearFilters={() => {
            setStatusFilter('all');
            setPlanFilter('all');
            advancedFilters.clearAllFilters();
          }}
          isOpen={showAdvancedFilters}
          onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
          isDark={isDark}
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
            description: advancedFilters.hasActiveFilters || statusFilter !== 'all' || planFilter !== 'all'
              ? 'No se encontraron tenants con los filtros aplicados.'
              : 'Comienza creando tu primer tenant.'
          }}
        />

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={bulkSelection.selectedCount}
          onClearSelection={bulkSelection.clearSelection}
          actions={bulkActions}
          isDark={isDark}
        />
      </div>

      {/* Modal Crear Tenant - Multi-Step Wizard */}
      <ThemedModal
        isOpen={showCreateModal}
        onClose={handleCreateModalClose}
        title="Crear Nuevo Tenant"
        subtitle={`Paso ${createStep} de 4: ${createStep === 1 ? 'Información básica' : createStep === 2 ? 'Administrador' : createStep === 3 ? 'Plan y configuración' : 'Confirmación'}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              {createStep > 1 && (
                <button
                  onClick={handleStepPrev}
                  disabled={createLoading}
                  className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors disabled:opacity-50 text-sm`}
                >
                  Anterior
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreateModalClose}
                disabled={createLoading}
                className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors text-sm`}
              >
                Cancelar
              </button>
              
              {createStep < 4 ? (
                <button
                  onClick={handleStepNext}
                  disabled={createLoading || !isStepValid(createStep)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleCreateTenant}
                  disabled={createLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
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
        }
      >
        {/* Progress Bar */}
        <div className={`px-4 py-3 mb-4 ${themeClasses.bgSecondary} rounded-lg`}>
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className={`flex items-center ${step < 4 ? 'flex-1' : ''}`}>
                <div className="flex flex-col items-center">
                  <div 
                    className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200
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
                  <span className={`text-xs mt-1 text-center font-medium ${step <= createStep ? 'text-blue-600' : themeClasses.textSecondary}`}>
                    {step === 1 ? 'Info' : 
                     step === 2 ? 'Admin' : 
                     step === 3 ? 'Plan' : 
                     'Confirmar'}
                  </span>
                </div>
                {step < 4 && (
                  <div 
                    className={`
                      flex-1 h-0.5 mx-2 transition-all duration-200
                      ${step < createStep ? 'bg-blue-600' : themeClasses.border}
                    `}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-4">
          {createStep === 1 && (
            <div className="space-y-4">
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
                  className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2.5 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                  className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2.5 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  rows={2}
                  placeholder="Descripción del negocio..."
                />
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                  Email del Administrador *
                </label>
                <input
                  type="email"
                  value={createFormData.adminEmail}
                  onChange={(e) => handleCreateFormChange('adminEmail', e.target.value)}
                  className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2.5 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="admin@mirestaurante.com"
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={createFormData.adminFirstName}
                    onChange={(e) => handleCreateFormChange('adminFirstName', e.target.value)}
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2.5 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2.5 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Pérez"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={createFormData.adminPassword}
                    onChange={(e) => handleCreateFormChange('adminPassword', e.target.value)}
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2.5 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2.5 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Repetir contraseña"
                  />
                </div>
              </div>
            </div>
          )}

          {createStep === 3 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Plan Free */}
                <div 
                  className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    createFormData.subscriptionPlan === 'free' 
                      ? `border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20` 
                      : `${themeClasses.border} ${themeClasses.card} ${themeClasses.buttonHover}`
                  }`}
                  onClick={() => handleCreateFormChange('subscriptionPlan', 'free')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className={`text-sm font-semibold ${themeClasses.text}`}>Free Trial</h5>
                    <input
                      type="radio"
                      checked={createFormData.subscriptionPlan === 'free'}
                      onChange={() => {}}
                      className="text-blue-600"
                    />
                  </div>
                  <p className={`text-xs ${themeClasses.textSecondary} mb-2`}>
                    Perfecto para empezar y probar todas las funcionalidades
                  </p>
                  <div className="space-y-0.5 text-xs">
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
                  className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    createFormData.subscriptionPlan === 'basic' 
                      ? `border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20` 
                      : `${themeClasses.border} ${themeClasses.card} ${themeClasses.buttonHover}`
                  }`}
                  onClick={() => handleCreateFormChange('subscriptionPlan', 'basic')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className={`text-sm font-semibold ${themeClasses.text}`}>Basic</h5>
                    <input
                      type="radio"
                      checked={createFormData.subscriptionPlan === 'basic'}
                      onChange={() => {}}
                      className="text-blue-600"
                    />
                  </div>
                  <p className={`text-xs ${themeClasses.textSecondary} mb-2`}>
                    Para restaurantes pequeños que buscan crecer
                  </p>
                  <div className="space-y-0.5 text-xs">
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
                  className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    createFormData.subscriptionPlan === 'premium' 
                      ? `border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20` 
                      : `${themeClasses.border} ${themeClasses.card} ${themeClasses.buttonHover}`
                  }`}
                  onClick={() => handleCreateFormChange('subscriptionPlan', 'premium')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className={`text-sm font-semibold ${themeClasses.text}`}>Premium</h5>
                    <input
                      type="radio"
                      checked={createFormData.subscriptionPlan === 'premium'}
                      onChange={() => {}}
                      className="text-blue-600"
                    />
                  </div>
                  <p className={`text-xs ${themeClasses.textSecondary} mb-2`}>
                    Para restaurantes medianos con operaciones complejas
                  </p>
                  <div className="space-y-0.5 text-xs">
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
                  className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    createFormData.subscriptionPlan === 'enterprise' 
                      ? `border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20` 
                      : `${themeClasses.border} ${themeClasses.card} ${themeClasses.buttonHover}`
                  }`}
                  onClick={() => handleCreateFormChange('subscriptionPlan', 'enterprise')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className={`text-sm font-semibold ${themeClasses.text}`}>Enterprise</h5>
                    <input
                      type="radio"
                      checked={createFormData.subscriptionPlan === 'enterprise'}
                      onChange={() => {}}
                      className="text-blue-600"
                    />
                  </div>
                  <p className={`text-xs ${themeClasses.textSecondary} mb-2`}>
                    Para cadenas de restaurantes y grandes operaciones
                  </p>
                  <div className="space-y-0.5 text-xs">
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
                  rows={2}
                  placeholder="Notas adicionales sobre el cliente o configuración especial..."
                />
              </div>
            </div>
          )}

          {createStep === 4 && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${themeClasses.bgSecondary} space-y-3`}>
                <h5 className={`font-medium ${themeClasses.text} mb-3`}>Resumen de la configuración:</h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
      </ThemedModal>

      {/* Modal de Detalles del Tenant - Expandido con Tabs */}
      <TenantDetailModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        tenant={selectedTenant}
      />

      {/* Modales de acción */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        loading={confirmModal.loading}
      />

      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={promptModal.onConfirm}
        title={promptModal.title}
        message={promptModal.message}
        type={promptModal.type}
        placeholder={promptModal.placeholder}
        loading={promptModal.loading}
      />

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />

      {/* Modal de Edición de Tenant */}
      <TenantEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        tenant={selectedTenant}
        onSave={handleSaveTenant}
      />
    </div>
  );
}