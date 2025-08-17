'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext'

interface Tenant {
  tenant_id: string;
  subdomain: string;
  database_name: string;
  business_name: string;
  admin_email: string;
  subscription_plan: string;
  subscription_status: string;
  max_users: number;
  max_recipes: number;
  max_events?: number;
  created_at: string;
  updated_at?: string;
  last_activity_at?: string;
  is_active: boolean;
}

interface TenantEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSave: (updatedTenant: any) => Promise<void>;
}

interface EditFormData {
  business_name: string;
  admin_email: string;
  subscription_plan: string;
  subscription_status: string;
  max_users: number;
  max_recipes: number;
  max_events: number;
  billing_email: string;
  billing_address: string;
  tax_number: string;
  backup_frequency: string;
  notes: string;
}

const SUBSCRIPTION_PLANS = [
  { value: 'free', label: 'Free', maxUsers: 5, maxRecipes: 50, maxEvents: 10 },
  { value: 'basic', label: 'Basic', maxUsers: 20, maxRecipes: 200, maxEvents: 50 },
  { value: 'premium', label: 'Premium', maxUsers: 100, maxRecipes: 1000, maxEvents: 200 },
  { value: 'enterprise', label: 'Enterprise', maxUsers: 500, maxRecipes: 5000, maxEvents: 1000 }
];

const SUBSCRIPTION_STATUSES = [
  { value: 'trial', label: 'Trial', color: 'blue' },
  { value: 'active', label: 'Activo', color: 'green' },
  { value: 'suspended', label: 'Suspendido', color: 'red' },
  { value: 'cancelled', label: 'Cancelado', color: 'gray' }
];

const BACKUP_FREQUENCIES = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' }
];

export default function TenantEditModal({ isOpen, onClose, tenant, onSave }: TenantEditModalProps) {
  const { getThemeClasses } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [formData, setFormData] = useState<EditFormData>({
    business_name: '',
    admin_email: '',
    subscription_plan: 'free',
    subscription_status: 'trial',
    max_users: 5,
    max_recipes: 50,
    max_events: 10,
    billing_email: '',
    billing_address: '',
    tax_number: '',
    backup_frequency: 'weekly',
    notes: ''
  });

  // Load tenant data when modal opens
  useEffect(() => {
    if (isOpen && tenant) {
      setFormData({
        business_name: tenant.business_name || '',
        admin_email: tenant.admin_email || '',
        subscription_plan: tenant.subscription_plan || 'free',
        subscription_status: tenant.subscription_status || 'trial',
        max_users: tenant.max_users || 5,
        max_recipes: tenant.max_recipes || 50,
        max_events: tenant.max_events || 10,
        billing_email: '', // TODO: Load from API
        billing_address: '', // TODO: Load from API
        tax_number: '', // TODO: Load from API
        backup_frequency: 'weekly', // TODO: Load from API
        notes: '' // TODO: Load from API
      });
    }
  }, [isOpen, tenant]);

  // Auto-update limits when plan changes
  useEffect(() => {
    const selectedPlan = SUBSCRIPTION_PLANS.find(plan => plan.value === formData.subscription_plan);
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        max_users: selectedPlan.maxUsers,
        max_recipes: selectedPlan.maxRecipes,
        max_events: selectedPlan.maxEvents
      }));
    }
  }, [formData.subscription_plan]);

  const handleInputChange = (field: keyof EditFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.business_name.trim()) {
      errors.push('El nombre del negocio es requerido');
    }

    if (!formData.admin_email.trim()) {
      errors.push('El email del administrador es requerido');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.admin_email)) {
      errors.push('El email del administrador debe tener un formato válido');
    }

    if (formData.max_users < 1) {
      errors.push('El número máximo de usuarios debe ser mayor a 0');
    }

    if (formData.max_recipes < 1) {
      errors.push('El número máximo de recetas debe ser mayor a 0');
    }

    if (formData.max_events < 1) {
      errors.push('El número máximo de eventos debe ser mayor a 0');
    }

    return errors;
  };

  const handleSave = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setLoading(true);
    try {
      // Call the onSave callback with the updated data
      await onSave({
        business_name: formData.business_name,
        admin_email: formData.admin_email,
        subscription_plan: formData.subscription_plan,
        subscription_status: formData.subscription_status,
        max_users: formData.max_users,
        max_recipes: formData.max_recipes,
        max_events: formData.max_events,
        // TODO: Add other fields when backend supports them
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving tenant:', error);
      setErrors(['Error al guardar los cambios del tenant']);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !tenant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center w-full">
        <div className={`relative w-full max-w-4xl ${themeClasses.card} rounded-lg shadow-xl max-h-[90vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}>
            <div>
              <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                Editar Tenant
              </h3>
              <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                {tenant.business_name} ({tenant.subdomain})
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${themeClasses.buttonHover} transition-colors`}
            >
              <XMarkIcon className={`w-5 h-5 ${themeClasses.textSecondary}`} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex">
                  <div>
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Se encontraron los siguientes errores:
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      <ul className="list-disc pl-5 space-y-1">
                        {errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              
              {/* Basic Information */}
              <div className={`${themeClasses.card} p-4 rounded-lg border ${themeClasses.border}`}>
                <h4 className={`text-md font-semibold ${themeClasses.text} mb-4`}>Información Básica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                      Nombre del Negocio *
                    </label>
                    <input
                      type="text"
                      value={formData.business_name}
                      onChange={(e) => handleInputChange('business_name', e.target.value)}
                      className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Nombre del negocio"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                      Email Administrador *
                    </label>
                    <input
                      type="email"
                      value={formData.admin_email}
                      onChange={(e) => handleInputChange('admin_email', e.target.value)}
                      className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="admin@empresa.com"
                    />
                  </div>
                </div>
              </div>

              {/* Subscription Information */}
              <div className={`${themeClasses.card} p-4 rounded-lg border ${themeClasses.border}`}>
                <h4 className={`text-md font-semibold ${themeClasses.text} mb-4`}>Suscripción y Plan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                      Plan de Suscripción
                    </label>
                    <select
                      value={formData.subscription_plan}
                      onChange={(e) => handleInputChange('subscription_plan', e.target.value)}
                      className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      {SUBSCRIPTION_PLANS.map(plan => (
                        <option key={plan.value} value={plan.value}>
                          {plan.label} ({plan.maxUsers} usuarios, {plan.maxRecipes} recetas)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                      Estado de Suscripción
                    </label>
                    <select
                      value={formData.subscription_status}
                      onChange={(e) => handleInputChange('subscription_status', e.target.value)}
                      className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      {SUBSCRIPTION_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Limits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                      Máximo Usuarios
                    </label>
                    <input
                      type="number"
                      value={formData.max_users}
                      onChange={(e) => handleInputChange('max_users', parseInt(e.target.value) || 0)}
                      min="1"
                      className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                      Máximo Recetas
                    </label>
                    <input
                      type="number"
                      value={formData.max_recipes}
                      onChange={(e) => handleInputChange('max_recipes', parseInt(e.target.value) || 0)}
                      min="1"
                      className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                      Máximo Eventos
                    </label>
                    <input
                      type="number"
                      value={formData.max_events}
                      onChange={(e) => handleInputChange('max_events', parseInt(e.target.value) || 0)}
                      min="1"
                      className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>
              </div>

              {/* Billing Information (Future) */}
              <div className={`${themeClasses.card} p-4 rounded-lg border ${themeClasses.border}`}>
                <h4 className={`text-md font-semibold ${themeClasses.text} mb-4`}>Información de Facturación</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                      Email de Facturación
                    </label>
                    <input
                      type="email"
                      value={formData.billing_email}
                      onChange={(e) => handleInputChange('billing_email', e.target.value)}
                      className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="billing@empresa.com"
                      disabled // TODO: Enable when backend supports it
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                      NIF/CIF
                    </label>
                    <input
                      type="text"
                      value={formData.tax_number}
                      onChange={(e) => handleInputChange('tax_number', e.target.value)}
                      className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="B12345678"
                      disabled // TODO: Enable when backend supports it
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Dirección de Facturación
                  </label>
                  <textarea
                    value={formData.billing_address}
                    onChange={(e) => handleInputChange('billing_address', e.target.value)}
                    rows={3}
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Dirección completa para facturación"
                    disabled // TODO: Enable when backend supports it
                  />
                </div>
                <div className={`mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg`}>
                  <p className={`text-sm text-yellow-800 dark:text-yellow-200`}>
                    💡 Los campos de facturación se habilitarán en una próxima actualización
                  </p>
                </div>
              </div>

              {/* Technical Settings (Future) */}
              <div className={`${themeClasses.card} p-4 rounded-lg border ${themeClasses.border}`}>
                <h4 className={`text-md font-semibold ${themeClasses.text} mb-4`}>Configuración Técnica</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                      Frecuencia de Backup
                    </label>
                    <select
                      value={formData.backup_frequency}
                      onChange={(e) => handleInputChange('backup_frequency', e.target.value)}
                      className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      disabled // TODO: Enable when backend supports it
                    >
                      {BACKUP_FREQUENCIES.map(freq => (
                        <option key={freq.value} value={freq.value}>
                          {freq.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                      Base de Datos
                    </label>
                    <input
                      type="text"
                      value={tenant.database_name}
                      className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} font-mono`}
                      disabled
                      readOnly
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className={`block text-sm font-medium ${themeClasses.textSecondary} mb-2`}>
                    Notas Administrativas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className={`w-full ${themeClasses.bgSecondary} border ${themeClasses.border} rounded-lg px-3 py-2 ${themeClasses.text} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    placeholder="Notas internas sobre este tenant..."
                    disabled // TODO: Enable when backend supports it
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex items-center justify-end gap-3 p-6 border-t ${themeClasses.border}`}>
            <button
              onClick={onClose}
              disabled={loading}
              className={`px-4 py-2 border ${themeClasses.border} ${themeClasses.textSecondary} rounded-lg ${themeClasses.buttonHover} transition-colors disabled:opacity-50 text-sm`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}