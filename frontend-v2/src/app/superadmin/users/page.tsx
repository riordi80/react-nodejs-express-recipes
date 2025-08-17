'use client';

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  PlayIcon,
  PauseIcon,
  UserIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  ClockIcon,
  KeyIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';
import { SuperAdminStatsCards, SuperAdminFilters, SuperAdminTable } from '@/components/superadmin';
import ConfirmModal from '@/components/superadmin/modals/ConfirmModal';
import MessageModal from '@/components/superadmin/modals/MessageModal';
import PromptModal from '@/components/superadmin/modals/PromptModal';
import BulkActionsBar from '@/components/ui/BulkActionsBar';
import { useBulkSelection } from '@/hooks/useBulkSelection';

interface SuperAdminUser {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  superadmin_role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  permissions: string[];
}

interface SuperAdminRole {
  name: string;
  description: string;
  permissions: string[];
}

// Función para badges de roles (fuera del componente para ser reutilizada)
const getRoleBadge = (role: string, isDark: boolean) => {
  if (isDark) {
    const styles = {
      super_admin_full: 'bg-red-900 text-red-200 border border-red-700',
      super_admin_read: 'bg-blue-900 text-blue-200 border border-blue-700',
      super_admin_billing: 'bg-green-900 text-green-200 border border-green-700',
      super_admin_support: 'bg-yellow-900 text-yellow-200 border border-yellow-700',
      super_admin_dev: 'bg-purple-900 text-purple-200 border border-purple-700'
    };
    return styles[role as keyof typeof styles] || 'bg-gray-800 text-gray-200 border border-gray-600';
  } else {
    const styles = {
      super_admin_full: 'bg-red-50 text-red-700 border border-red-300',
      super_admin_read: 'bg-blue-50 text-blue-700 border border-blue-300',
      super_admin_billing: 'bg-green-50 text-green-700 border border-green-300',
      super_admin_support: 'bg-amber-50 text-amber-700 border border-amber-300',
      super_admin_dev: 'bg-purple-50 text-purple-700 border border-purple-300'
    };
    return styles[role as keyof typeof styles] || 'bg-gray-100 text-gray-700 border border-gray-300';
  }
};

export default function SuperAdminUsersPage() {
  const { user, loading: isLoading } = useSuperAdmin();
  const { getThemeClasses, isDark } = useSuperAdminTheme();
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const themeClasses = getThemeClasses();
  const [roles, setRoles] = useState<Record<string, SuperAdminRole>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SuperAdminUser | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    type: 'danger' | 'warning' | 'info' | 'success'; 
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'info', onConfirm: () => {} });
  
  const [messageModal, setMessageModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info' | 'success';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    placeholder: string;
    expectedText: string;
    onConfirm: (inputText: string) => void;
  }>({ isOpen: false, title: '', message: '', placeholder: '', expectedText: '', onConfirm: () => {} });

  useEffect(() => {
    if (!isLoading && user) {
      loadUsers();
      loadRoles();
    }
  }, [isLoading, user]);

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/superadmin/users?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data?.users || []);
      } else {
        console.error('Error loading users:', response.status);
      }
    } catch {
      console.error('Fixed error in catch block');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/superadmin/users/roles', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data.data?.roles || {});
      } else {
        console.error('Error loading roles:', response.status);
      }
    } catch {
      console.error('Fixed error in catch block');
    }
  };

  // Refrescar cuando cambien los filtros
  useEffect(() => {
    if (!isLoading && user) {
      loadUsers();
    }
  }, [statusFilter, roleFilter, searchTerm]);

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const result = await response.json();
        setMessageModal({
          isOpen: true,
          title: 'Usuario Creado',
          message: `El usuario "${userData.first_name} ${userData.last_name}" ha sido creado correctamente.`,
          type: 'success'
        });
        loadUsers();
        setShowCreateModal(false);
      } else {
        const errorData = await response.json();
        setMessageModal({
          isOpen: true,
          title: 'Error al Crear Usuario',
          message: errorData.message || 'Error al crear usuario SuperAdmin',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error creando usuario:', error);
      setMessageModal({
        isOpen: true,
        title: 'Error',
        message: 'Error de conexión al crear usuario',
        type: 'error'
      });
    }
  };

  const handleUpdateUser = async (userId: number, userData: any) => {
    try {
      const response = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        setMessageModal({
          isOpen: true,
          title: 'Usuario Actualizado',
          message: 'El usuario ha sido actualizado correctamente.',
          type: 'success'
        });
        loadUsers();
        setShowEditModal(false);
        setSelectedUser(null);
      } else {
        const errorData = await response.json();
        setMessageModal({
          isOpen: true,
          title: 'Error al Actualizar',
          message: errorData.message || 'Error al actualizar usuario',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      setMessageModal({
        isOpen: true,
        title: 'Error',
        message: 'Error de conexión al actualizar usuario',
        type: 'error'
      });
    }
  };

  const handleDeactivateUser = async (userId: number, userName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Desactivación',
      message: `¿Estás seguro de que quieres desactivar al usuario "${userName}"? Podrá ser reactivado posteriormente.`,
      type: 'warning',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/superadmin/users/${userId}`, {
            method: 'DELETE',
            credentials: 'include'
          });

          if (response.ok) {
            setMessageModal({
              isOpen: true,
              title: 'Usuario Desactivado',
              message: `El usuario "${userName}" ha sido desactivado correctamente.`,
              type: 'success'
            });
            loadUsers();
          } else {
            const errorData = await response.json();
            setMessageModal({
              isOpen: true,
              title: 'Error al Desactivar',
              message: errorData.message || 'Error al desactivar usuario',
              type: 'error'
            });
          }
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error desactivando usuario:', error);
          setMessageModal({
            isOpen: true,
            title: 'Error',
            message: 'Error de conexión al desactivar usuario',
            type: 'error'
          });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);
    
    const matchesRole = roleFilter === 'all' || user.superadmin_role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });


  const getRoleName = (role: string) => {
    return roles[role]?.name || role;
  };

  const isUserLocked = (_: SuperAdminUser) => {
    // Por ahora, no tenemos sistema de bloqueo implementado
    return false;
  };

  const handleActivateUser = async (userId: number, userName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Reactivación',
      message: `¿Estás seguro de que quieres reactivar a "${userName}"? Podrá acceder inmediatamente al panel.`,
      type: 'success',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/superadmin/users/${userId}/activate`, {
            method: 'PUT',
            credentials: 'include'
          });

          if (response.ok) {
            setMessageModal({
              isOpen: true,
              title: 'Usuario Reactivado',
              message: `El usuario "${userName}" ha sido reactivado correctamente.`,
              type: 'success'
            });
            loadUsers();
          } else {
            const errorData = await response.json();
            setMessageModal({
              isOpen: true,
              title: 'Error al Reactivar',
              message: errorData.message || 'Error al reactivar usuario',
              type: 'error'
            });
          }
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error('Error reactivando usuario:', error);
          setMessageModal({
            isOpen: true,
            title: 'Error',
            message: 'Error de conexión al reactivar usuario',
            type: 'error'
          });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    setPromptModal({
      isOpen: true,
      title: 'Eliminar Usuario Permanentemente',
      message: `Esta acción ELIMINARÁ PERMANENTEMENTE a "${userName}" y no se puede deshacer.\n\nEscribe "${userName}" para confirmar:`,
      placeholder: `Escribe: ${userName}`,
      expectedText: userName,
      onConfirm: async (inputText: string) => {
        // Verificar que el texto ingresado coincida exactamente
        if (inputText !== userName) {
          setMessageModal({
            isOpen: true,
            title: 'Confirmación Incorrecta',
            message: `Debes escribir exactamente "${userName}" para confirmar la eliminación.`,
            type: 'error'
          });
          setPromptModal(prev => ({ ...prev, isOpen: false }));
          return;
        }

        try {
          const response = await fetch(`/api/superadmin/users/${userId}/permanent`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ confirmation: inputText })
          });

          if (response.ok) {
            setMessageModal({
              isOpen: true,
              title: 'Usuario Eliminado',
              message: `El usuario "${userName}" ha sido eliminado permanentemente.`,
              type: 'success'
            });
            loadUsers();
          } else {
            const errorData = await response.json();
            setMessageModal({
              isOpen: true,
              title: 'Error al Eliminar',
              message: errorData.message || 'Error al eliminar el usuario',
              type: 'error'
            });
          }
          setPromptModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          setMessageModal({
            isOpen: true,
            title: 'Error',
            message: 'Error al eliminar el usuario',
            type: 'error'
          });
          setPromptModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Nunca';
    return new Date(lastLogin).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to get icon colors based on theme
  const getIconColors = () => {
    if (isDark) {
      return {
        view: 'text-blue-400 hover:text-blue-300',
        edit: 'text-orange-400 hover:text-orange-300',
        deactivate: 'text-red-400 hover:text-red-300',
        activate: 'text-green-400 hover:text-green-300',
        delete: 'text-red-500 hover:text-red-400',
        statusActive: 'text-green-400',
        statusLocked: 'text-red-400',
        statusIndicator: 'bg-green-400'
      };
    } else {
      return {
        view: 'text-blue-600 hover:text-blue-700',
        edit: 'text-orange-600 hover:text-orange-700',
        deactivate: 'text-red-600 hover:text-red-700',
        activate: 'text-green-600 hover:text-green-700',
        delete: 'text-red-700 hover:text-red-800',
        statusActive: 'text-green-600',
        statusLocked: 'text-red-600',
        statusIndicator: 'bg-green-600'
      };
    }
  };

  const iconColors = getIconColors();

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
      render: (_: any, adminUser: SuperAdminUser) => (
        <div className="flex justify-center">
          <input
            type="checkbox"
            checked={bulkSelection.selectedIds.has(adminUser.user_id.toString())}
            onChange={(e) => bulkSelection.handleSelectItem(adminUser.user_id.toString(), e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      )
    },
    {
      key: 'user_info',
      label: 'Usuario',
      render: (_: any, adminUser: SuperAdminUser) => (
        <div>
          <div className={`text-sm font-medium ${themeClasses.text}`}>
            {adminUser.first_name} {adminUser.last_name}
          </div>
          <div className={`text-sm ${themeClasses.textSecondary}`}>{adminUser.email}</div>
        </div>
      )
    },
    {
      key: 'superadmin_role',
      label: 'Rol',
      render: (role: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(role, isDark)}`}>
          {getRoleName(role)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (_: any, adminUser: SuperAdminUser) => (
        <div className="flex items-center">
          {adminUser.is_active ? (
            isUserLocked(adminUser) ? (
              <div className={`flex items-center ${iconColors.statusLocked}`}>
                <LockClosedIcon className="h-4 w-4 mr-1" />
                <span className="text-xs">Bloqueado</span>
              </div>
            ) : (
              <div className={`flex items-center ${iconColors.statusActive}`}>
                <div className={`h-2 w-2 ${iconColors.statusIndicator} rounded-full mr-2`}></div>
                <span className="text-xs">Activo</span>
              </div>
            )
          ) : (
            <div className={`flex items-center ${themeClasses.textSecondary}`}>
              <div className={`h-2 w-2 ${isDark ? 'bg-gray-400' : 'bg-gray-500'} rounded-full mr-2`}></div>
              <span className="text-xs">Inactivo</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'last_login_at',
      label: 'Último Acceso',
      render: (lastLogin: string | null) => (
        <div className={`flex items-center text-sm ${themeClasses.text}`}>
          <ClockIcon className={`h-4 w-4 mr-1 ${themeClasses.textSecondary}`} />
          {formatLastLogin(lastLogin)}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Creado',
      render: (date: string) => (
        <span className={`text-sm ${themeClasses.text}`}>
          {new Date(date).toLocaleDateString('es-ES')}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_: any, adminUser: SuperAdminUser) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedUser(adminUser);
              setShowDetailsModal(true);
            }}
            className={`${iconColors.view} transition-colors`}
            title="Ver detalles"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => {
              setSelectedUser(adminUser);
              setShowEditModal(true);
            }}
            className={`${iconColors.edit} transition-colors`}
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          
          {adminUser.user_id !== user?.user_id && (
            adminUser.is_active ? (
              <button
                onClick={() => handleDeactivateUser(adminUser.user_id, `${adminUser.first_name} ${adminUser.last_name}`)}
                className={`${iconColors.deactivate} transition-colors`}
                title="Desactivar"
              >
                <PauseIcon className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => handleActivateUser(adminUser.user_id, `${adminUser.first_name} ${adminUser.last_name}`)}
                className={`${iconColors.activate} transition-colors`}
                title="Reactivar"
              >
                <PlayIcon className="h-5 w-5" />
              </button>
            )
          )}
          
          {/* Botón de eliminación permanente - solo para usuarios que no son el usuario actual */}
          {adminUser.user_id !== user?.user_id && (
            <button
              onClick={() => handleDeleteUser(adminUser.user_id, `${adminUser.first_name} ${adminUser.last_name}`)}
              className={`${iconColors.delete} transition-colors`}
              title="Eliminar Permanentemente"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )
    }
  ];


  // Initialize bulk selection
  const bulkSelection = useBulkSelection({
    items: filteredUsers,
    getItemId: (user) => user.user_id.toString()
  });

  // Bulk actions handlers
  const handleBulkDeactivate = () => {
    if (bulkSelection.selectedCount === 0) return;

    setConfirmModal({
      isOpen: true,
      title: `Desactivar ${bulkSelection.selectedCount} usuario${bulkSelection.selectedCount > 1 ? 's' : ''}`,
      message: `¿Estás seguro de que quieres desactivar ${bulkSelection.selectedCount} usuario${bulkSelection.selectedCount > 1 ? 's' : ''}? No podrán acceder al panel SuperAdmin.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const promises = bulkSelection.selectedItems
            .filter(u => u.user_id !== user?.user_id) // No deactivate self
            .map(selectedUser => 
              fetch(`/api/superadmin/users/${selectedUser.user_id}`, {
                method: 'DELETE',
                credentials: 'include'
              })
            );

          await Promise.all(promises);
          
          setMessageModal({
            isOpen: true,
            title: 'Usuarios desactivados',
            message: `${promises.length} usuario${promises.length !== 1 ? 's' : ''} desactivado${promises.length !== 1 ? 's' : ''} correctamente.`,
            type: 'success'
          });
          
          bulkSelection.clearSelection();
          loadUsers();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          setMessageModal({
            isOpen: true,
            title: 'Error',
            message: 'Error al desactivar algunos usuarios.',
            type: 'error'
          });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleBulkActivate = () => {
    if (bulkSelection.selectedCount === 0) return;

    setConfirmModal({
      isOpen: true,
      title: `Activar ${bulkSelection.selectedCount} usuario${bulkSelection.selectedCount > 1 ? 's' : ''}`,
      message: `¿Estás seguro de que quieres activar ${bulkSelection.selectedCount} usuario${bulkSelection.selectedCount > 1 ? 's' : ''}? Podrán acceder inmediatamente.`,
      type: 'success',
      onConfirm: async () => {
        try {
          const promises = bulkSelection.selectedItems.map(selectedUser => 
            fetch(`/api/superadmin/users/${selectedUser.user_id}/activate`, {
              method: 'PUT',
              credentials: 'include'
            })
          );

          await Promise.all(promises);
          
          setMessageModal({
            isOpen: true,
            title: 'Usuarios activados',
            message: `${promises.length} usuario${promises.length !== 1 ? 's' : ''} activado${promises.length !== 1 ? 's' : ''} correctamente.`,
            type: 'success'
          });
          
          bulkSelection.clearSelection();
          loadUsers();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          setMessageModal({
            isOpen: true,
            title: 'Error',
            message: 'Error al activar algunos usuarios.',
            type: 'error'
          });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleBulkDelete = () => {
    if (bulkSelection.selectedCount === 0) return;

    const eligibleUsers = bulkSelection.selectedItems.filter(u => u.user_id !== user?.user_id);
    
    if (eligibleUsers.length === 0) {
      setMessageModal({
        isOpen: true,
        title: 'No se puede proceder',
        message: 'No puedes eliminarte a ti mismo.',
        type: 'error'
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `Eliminar ${eligibleUsers.length} usuario${eligibleUsers.length > 1 ? 's' : ''} permanentemente`,
      message: `Esta acción ELIMINARÁ PERMANENTEMENTE ${eligibleUsers.length} usuario${eligibleUsers.length > 1 ? 's' : ''} y no se puede deshacer. Esta operación es irreversible.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const promises = eligibleUsers.map(selectedUser => 
            fetch(`/api/superadmin/users/${selectedUser.user_id}/permanent`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ confirmation: `${selectedUser.first_name} ${selectedUser.last_name}` })
            })
          );

          await Promise.all(promises);
          
          setMessageModal({
            isOpen: true,
            title: 'Usuarios Eliminados',
            message: `${eligibleUsers.length} usuario${eligibleUsers.length !== 1 ? 's' : ''} eliminado${eligibleUsers.length !== 1 ? 's' : ''} permanentemente.`,
            type: 'success'
          });
          
          bulkSelection.clearSelection();
          loadUsers();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          setMessageModal({
            isOpen: true,
            title: 'Error',
            message: 'Error al eliminar algunos usuarios.',
            type: 'error'
          });
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Define bulk actions
  const bulkActions = [
    {
      id: 'deactivate',
      label: 'Desactivar',
      icon: <PauseIcon className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: handleBulkDeactivate,
      disabled: bulkSelection.selectedItems.every(u => !u.is_active || u.user_id === user?.user_id)
    },
    {
      id: 'activate',
      label: 'Activar',
      icon: <PlayIcon className="w-4 h-4" />,
      variant: 'success' as const,
      onClick: handleBulkActivate,
      disabled: bulkSelection.selectedItems.every(u => u.is_active)
    },
    {
      id: 'delete',
      label: 'Eliminar Permanentemente',
      icon: <TrashIcon className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: handleBulkDelete,
      disabled: bulkSelection.selectedItems.every(u => u.user_id === user?.user_id)
    }
  ];

  if (isLoading || loading) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center`}>
        <div className={themeClasses.text}>Cargando usuarios SuperAdmin...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>Gestión de Usuarios</h1>
          <p className={themeClasses.textSecondary}>Administra usuarios con acceso al panel de administración</p>
        </div>

        {/* Stats Cards */}
        <SuperAdminStatsCards 
          stats={[
            {
              title: "Total SuperAdmins",
              value: users.length,
              color: "blue",
              icon: UserIcon
            },
            {
              title: "Activos",
              value: users.filter(u => u.is_active).length,
              color: "green",
              icon: ShieldCheckIcon
            },
            {
              title: "Bloqueados",
              value: users.filter(u => isUserLocked(u)).length,
              color: "red",
              icon: LockClosedIcon
            },
            {
              title: "Admin Completos",
              value: users.filter(u => u.superadmin_role === 'super_admin_full').length,
              color: "yellow",
              icon: KeyIcon
            }
          ]}
          columns={4}
        />

        {/* Filters and Search */}
        <SuperAdminFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por nombre o email..."
          filters={[
            {
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "active", label: "Activos" },
                { value: "inactive", label: "Inactivos" },
                { value: "locked", label: "Bloqueados" },
                { value: "all", label: "Todos" }
              ]
            },
            {
              value: roleFilter,
              onChange: setRoleFilter,
              options: [
                { value: "all", label: "Todos los roles" },
                ...Object.entries(roles).map(([roleKey, roleData]) => ({
                  value: roleKey,
                  label: roleData.name
                }))
              ]
            }
          ]}
          createButton={{
            label: "Crear SuperAdmin",
            onClick: () => setShowCreateModal(true),
            icon: PlusIcon
          }}
        />

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedCount={bulkSelection.selectedCount}
          onClearSelection={bulkSelection.clearSelection}
          actions={bulkActions}
          isDark={isDark}
        />

        {/* Users Table */}
        <SuperAdminTable
          columns={tableColumns}
          data={filteredUsers}
          loading={loading}
          emptyState={{
            icon: UserIcon,
            title: "No hay usuarios",
            description: searchTerm || statusFilter !== 'all' || roleFilter !== 'all' 
              ? 'No se encontraron usuarios con los filtros aplicados.'
              : 'Comienza creando tu primer usuario SuperAdmin.'
          }}
        />
      </div>

      {/* Modals placeholder */}
      {showCreateModal && (
        <CreateUserModal 
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
          roles={roles}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal 
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={(userData) => handleUpdateUser(selectedUser.user_id, userData)}
          roles={roles}
        />
      )}

      {showDetailsModal && selectedUser && (
        <UserDetailsModal 
          user={selectedUser}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
          roles={roles}
        />
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
      />

      {/* Message Modal */}
      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />

      {/* Prompt Modal */}
      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={promptModal.onConfirm}
        title={promptModal.title}
        message={promptModal.message}
        placeholder={promptModal.placeholder}
        type="danger"
      />
    </div>
  );
}

// Modal para crear usuario (estilo SaaS)
function CreateUserModal({ onClose, onSubmit, roles }: { onClose: () => void, onSubmit: (data: any) => void, roles: Record<string, SuperAdminRole> }) {
  const { getThemeClasses } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    superadmin_role: 'super_admin_read',
    custom_permissions: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // ESC para cerrar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevenir scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden ${themeClasses.card}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
          <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Crear Nuevo SuperAdmin</h2>
          <button
            onClick={onClose}
            className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors p-1 rounded-lg ${themeClasses.buttonHover}`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content con scroll */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit}>
            {/* Form Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Email</label>
                <input
                  type="email"
                  required
                  className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Contraseña</label>
                <input
                  type="password"
                  required
                  className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Nombre</label>
                  <input
                    type="text"
                    required
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Apellido</label>
                  <input
                    type="text"
                    required
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Rol</label>
                <select
                  className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  value={formData.superadmin_role}
                  onChange={(e) => setFormData({...formData, superadmin_role: e.target.value})}
                >
                  {Object.entries(roles).map(([roleKey, roleData]) => (
                    <option key={roleKey} value={roleKey}>
                      {roleData.name}
                    </option>
                  ))}
                </select>
                {roles[formData.superadmin_role] && (
                  <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                    {roles[formData.superadmin_role].description}
                  </p>
                )}
              </div>
            </div>

            {/* Footer con botones (estilo SaaS) */}
            <div className={`flex items-center justify-end space-x-3 px-6 py-4 border-t ${themeClasses.border} ${themeClasses.bgSecondary}`}>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Crear SuperAdmin
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Modal para editar usuario (estilo SaaS con temas)
function EditUserModal({ user, onClose, onSubmit, roles }: { user: SuperAdminUser, onClose: () => void, onSubmit: (data: any) => void, roles: Record<string, SuperAdminRole> }) {
  const { getThemeClasses } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();
  const [formData, setFormData] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    superadmin_role: user.superadmin_role,
    is_active: user.is_active,
    custom_permissions: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // ESC para cerrar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevenir scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden ${themeClasses.card}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
          <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Editar SuperAdmin</h2>
          <button
            onClick={onClose}
            className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors p-1 rounded-lg ${themeClasses.buttonHover}`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content con scroll */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit}>
            {/* Form Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Email</label>
                <input
                  type="email"
                  disabled
                  className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.textSecondary} opacity-60 cursor-not-allowed`}
                  value={user.email}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Nombre</label>
                  <input
                    type="text"
                    required
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Apellido</label>
                  <input
                    type="text"
                    required
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-1`}>Rol</label>
                <select
                  className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                  value={formData.superadmin_role}
                  onChange={(e) => setFormData({...formData, superadmin_role: e.target.value})}
                >
                  {Object.entries(roles).map(([roleKey, roleData]) => (
                    <option key={roleKey} value={roleKey}>
                      {roleData.name}
                    </option>
                  ))}
                </select>
                {roles[formData.superadmin_role] && (
                  <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                    {roles[formData.superadmin_role].description}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className={`rounded ${themeClasses.bgSecondary} border ${themeClasses.border} text-blue-600 focus:ring-blue-500 focus:ring-2`}
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span className={`ml-2 text-sm ${themeClasses.textSecondary}`}>Usuario activo</span>
                </label>
              </div>
            </div>

            {/* Footer con botones (estilo SaaS) */}
            <div className={`flex items-center justify-end space-x-3 px-6 py-4 border-t ${themeClasses.border} ${themeClasses.bgSecondary}`}>
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Modal para detalles del usuario (estilo SaaS con temas)
function UserDetailsModal({ user, onClose, roles }: { user: SuperAdminUser, onClose: () => void, roles: Record<string, SuperAdminRole> }) {
  const { getThemeClasses, isDark } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();

  // ESC para cerrar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevenir scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className={`rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden ${themeClasses.card}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
          <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Detalles del SuperAdmin</h2>
          <button
            onClick={onClose}
            className={`${themeClasses.textSecondary} hover:${themeClasses.text} transition-colors p-1 rounded-lg ${themeClasses.buttonHover}`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content con scroll */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Nombre Completo</label>
                <p className={`text-lg ${themeClasses.text}`}>{user.first_name} {user.last_name}</p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Email</label>
                <p className={`text-lg ${themeClasses.text}`}>{user.email}</p>
              </div>
            </div>

            {/* Rol y estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Rol</label>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadge(user.superadmin_role, isDark)}`}>
                    {roles[user.superadmin_role]?.name || user.superadmin_role}
                  </span>
                </div>
                {roles[user.superadmin_role] && (
                  <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                    {roles[user.superadmin_role].description}
                  </p>
                )}
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Estado</label>
                <div className="flex items-center">
                  {user.is_active ? (
                    <div className="flex items-center text-green-500">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">Activo</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500">
                      <div className="h-2 w-2 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">Inactivo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Permisos */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Permisos</label>
              <div className="flex flex-wrap gap-2">
                {user.permissions.length > 0 ? (
                  user.permissions.map(permission => (
                    <span key={permission} className={`px-3 py-1 text-xs font-medium rounded-full ${
                      isDark 
                        ? 'bg-blue-900 text-blue-200 border border-blue-700' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {permission.replace('_', ' ').toUpperCase()}
                    </span>
                  ))
                ) : (
                  <span className={`text-sm ${themeClasses.textSecondary}`}>Sin permisos específicos</span>
                )}
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Creado</label>
                <div className="flex items-center">
                  <ClockIcon className={`h-4 w-4 mr-2 ${themeClasses.textSecondary}`} />
                  <p className={`text-sm ${themeClasses.text}`}>
                    {new Date(user.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>Último Login</label>
                <div className="flex items-center">
                  <ClockIcon className={`h-4 w-4 mr-2 ${themeClasses.textSecondary}`} />
                  <p className={`text-sm ${themeClasses.text}`}>
                    {user.last_login_at 
                      ? new Date(user.last_login_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Nunca ha iniciado sesión'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end px-6 py-4 border-t ${themeClasses.border} ${themeClasses.bgSecondary}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}