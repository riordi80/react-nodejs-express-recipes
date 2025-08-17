'use client';

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  UserIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  ClockIcon,
  KeyIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';
import { SuperAdminStatsCards, SuperAdminFilters, SuperAdminTable, SuperAdminModal } from '@/components/superadmin';

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
      super_admin_full: 'bg-red-100 text-red-800 border border-red-200',
      super_admin_read: 'bg-blue-100 text-blue-800 border border-blue-200',
      super_admin_billing: 'bg-green-100 text-green-800 border border-green-200',
      super_admin_support: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      super_admin_dev: 'bg-purple-100 text-purple-800 border border-purple-200'
    };
    return styles[role as keyof typeof styles] || 'bg-gray-200 text-gray-800 border border-gray-300';
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
    } catch (error) {
      console.error('Error loading users:', error);
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
    } catch (error) {
      console.error('Error loading roles:', error);
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
        loadUsers();
        setShowCreateModal(false);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error al crear usuario');
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
        loadUsers();
        setShowEditModal(false);
        setSelectedUser(null);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error al actualizar usuario');
    }
  };

  const handleDeactivateUser = async (userId: number, userName: string) => {
    if (!confirm(`¿Estás seguro de que quieres desactivar al usuario "${userName}"?`)) return;
    
    try {
      const response = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        loadUsers();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Error al desactivar usuario');
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });


  const getRoleName = (role: string) => {
    return roles[role]?.name || role;
  };

  const isUserLocked = (user: SuperAdminUser) => {
    // Por ahora, no tenemos sistema de bloqueo implementado
    return false;
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

  // Configuración de columnas para la tabla
  const tableColumns = [
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
              <div className="flex items-center text-red-400">
                <LockClosedIcon className="h-4 w-4 mr-1" />
                <span className="text-xs">Bloqueado</span>
              </div>
            ) : (
              <div className="flex items-center text-green-400">
                <div className="h-2 w-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-xs">Activo</span>
              </div>
            )
          ) : (
            <div className="flex items-center text-gray-400">
              <div className="h-2 w-2 bg-gray-400 rounded-full mr-2"></div>
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
            className="text-blue-400 hover:text-blue-300 transition-colors"
            title="Ver detalles"
          >
            <EyeIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => {
              setSelectedUser(adminUser);
              setShowEditModal(true);
            }}
            className="text-yellow-400 hover:text-yellow-300 transition-colors"
            title="Editar"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          
          {adminUser.user_id !== user?.user_id && adminUser.is_active && (
            <button
              onClick={() => handleDeactivateUser(adminUser.user_id, `${adminUser.first_name} ${adminUser.last_name}`)}
              className="text-red-400 hover:text-red-300 transition-colors"
              title="Desactivar"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      )
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
  const { getThemeClasses, isDark } = useSuperAdminTheme();
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