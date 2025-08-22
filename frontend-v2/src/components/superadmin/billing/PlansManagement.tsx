'use client';

import React, { useEffect, useState } from 'react';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';
import api from '@/lib/api';
import { 
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  UsersIcon,
  ArrowPathIcon,
  CurrencyEuroIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  plan_slug?: string;
  plan_description: string;
  plan_color?: string;
  sort_order?: number;
  is_public?: boolean;
  is_popular?: boolean;
  monthly_price_cents: number;
  yearly_price_cents: number;
  yearly_discount_percentage?: number;
  max_users: number;
  max_recipes: number;
  max_events: number;
  max_storage_mb?: number;
  max_api_calls_monthly?: number;
  support_level?: string;
  has_analytics?: boolean;
  has_multi_location?: boolean;
  has_custom_api?: boolean;
  has_white_label?: boolean;
  features: string[];
  is_active: boolean;
  active_subscribers: number;
  price_monthly: number;
  price_yearly: number;
}

export default function PlansManagement() {
  const { getThemeClasses, isDark } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({});
  const [formFeatures, setFormFeatures] = useState<string>('');
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchPlans = async () => {
    try {
      setError(null);
      
      const response = await api.get('/superadmin/billing/plans');
      
      if (response.data.success) {
        setPlans(response.data.data);
      } else {
        setError('Error al cargar planes de suscripción');
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPlanBadgeColor = (planId: string) => {
    const colors: Record<string, string> = {
      'free': isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300',
      'basic': isDark ? 'bg-blue-700 text-blue-300 border-blue-600' : 'bg-blue-100 text-blue-700 border-blue-300',
      'premium': isDark ? 'bg-purple-700 text-purple-300 border-purple-600' : 'bg-purple-100 text-purple-700 border-purple-300',
      'enterprise': isDark ? 'bg-yellow-700 text-yellow-300 border-yellow-600' : 'bg-yellow-100 text-yellow-700 border-yellow-300'
    };
    return colors[planId] || colors['free'];
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? 'Ilimitado' : limit.toLocaleString('es-ES');
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      plan_slug: plan.plan_slug,
      plan_description: plan.plan_description,
      plan_color: plan.plan_color || 'blue',
      sort_order: plan.sort_order || 0,
      is_public: plan.is_public ?? true,
      is_popular: plan.is_popular ?? false,
      monthly_price_cents: plan.monthly_price_cents,
      yearly_price_cents: plan.yearly_price_cents,
      yearly_discount_percentage: plan.yearly_discount_percentage || 16.67,
      max_users: plan.max_users,
      max_recipes: plan.max_recipes,
      max_events: plan.max_events,
      max_storage_mb: plan.max_storage_mb || 1000,
      max_api_calls_monthly: plan.max_api_calls_monthly || 10000,
      support_level: plan.support_level || 'email',
      has_analytics: plan.has_analytics ?? false,
      has_multi_location: plan.has_multi_location ?? false,
      has_custom_api: plan.has_custom_api ?? false,
      has_white_label: plan.has_white_label ?? false,
      is_active: plan.is_active
    });
    setFormFeatures(plan.features.join('\n'));
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;
    
    try {
      setSaveLoading(true);
      setError(null);
      
      const featuresArray = formFeatures.split('\n').filter(f => f.trim()).map(f => f.trim());
      
      const updateData = {
        ...formData,
        features: featuresArray
      };
      
      const response = await api.put(`/superadmin/billing/plans/${editingPlan.plan_id}`, updateData);
      
      if (response.data.success) {
        // Actualizar la lista local
        setPlans(prev => prev.map(plan => 
          plan.plan_id === editingPlan.plan_id 
            ? { ...plan, ...response.data.data, features: featuresArray }
            : plan
        ));
        handleCancelEdit();
      }
    } catch (err: any) {
      console.error('Error saving plan:', err);
      const errorMessage = err.response?.data?.message || 'Error al guardar el plan';
      setError(errorMessage);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingPlan(null);
    setFormData({});
    setFormFeatures('');
    setError(null);
  };

  const handleTogglePlanStatus = async (planId: number, currentStatus: boolean) => {
    try {
      setActionLoading(`toggle-${planId}`);
      
      const response = await api.put(`/superadmin/billing/plans/${planId}`, {
        is_active: !currentStatus
      });

      if (response.data.success) {
        // Actualizar el plan en la lista local
        setPlans(prev => prev.map(plan => 
          Number(plan.plan_id) === Number(planId) 
            ? { ...plan, is_active: !currentStatus }
            : plan
        ));
      }
    } catch (err) {
      console.error('Error toggling plan status:', err);
      setError('Error al cambiar estado del plan');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('¿Estás seguro de que quieres desactivar este plan?')) {
      return;
    }

    try {
      setActionLoading(`delete-${planId}`);
      
      const response = await api.delete(`/superadmin/billing/plans/${planId}`);

      if (response.data.success) {
        // Actualizar la lista local
        setPlans(prev => prev.map(plan => 
          Number(plan.plan_id) === Number(planId) 
            ? { ...plan, is_active: false }
            : plan
        ));
      }
    } catch (err: any) {
      console.error('Error deleting plan:', err);
      const errorMessage = err.response?.data?.message || 'Error al desactivar el plan';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  if (error) {
    return (
      <div className={`${themeClasses.card} rounded-lg p-6 text-center`}>
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="font-medium">{error}</p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchPlans();
          }}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors`}
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${themeClasses.text}`}>
            Gestión de Planes de Suscripción
          </h2>
          <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
            Administra los planes disponibles y sus características
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors`}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Crear Plan
          </button>
          <button
            onClick={fetchPlans}
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors`}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${themeClasses.card} rounded-lg p-6`}>
              <div className="animate-pulse">
                <div className={`h-6 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded mb-4`}></div>
                <div className={`h-4 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded mb-2`}></div>
                <div className={`h-4 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded mb-4`}></div>
                <div className="space-y-2">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className={`h-3 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded`}></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.plan_id}
              className={`${themeClasses.card} rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden ${
                plan.plan_id === 'premium' ? 'ring-2 ring-purple-500' : ''
              }`}
            >
              {/* Plan Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPlanBadgeColor(plan.plan_id)}`}>
                    {plan.plan_name}
                  </span>
                  {plan.plan_id === 'premium' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Popular
                    </span>
                  )}
                </div>

                <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>
                  {plan.plan_name}
                </h3>
                
                <p className={`text-sm ${themeClasses.textSecondary} mb-4`}>
                  {plan.plan_description}
                </p>

                {/* Pricing */}
                <div className="mb-4">
                  <div className="flex items-baseline">
                    <span className={`text-3xl font-bold ${themeClasses.text}`}>
                      {formatCurrency(plan.price_monthly)}
                    </span>
                    <span className={`text-sm ${themeClasses.textSecondary} ml-1`}>
                      /mes
                    </span>
                  </div>
                  {plan.price_yearly > 0 && (
                    <div className={`text-sm ${themeClasses.textSecondary} mt-1`}>
                      {formatCurrency(plan.price_yearly)}/año (ahorra {Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)}%)
                    </div>
                  )}
                </div>

                {/* Active Subscribers */}
                <div className="flex items-center mb-4">
                  <UsersIcon className={`h-4 w-4 ${themeClasses.textSecondary} mr-2`} />
                  <span className={`text-sm ${themeClasses.textSecondary}`}>
                    {plan.active_subscribers} suscriptor{plan.active_subscribers !== 1 ? 'es' : ''} activo{plan.active_subscribers !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Plan Limits */}
              <div className="px-6 pb-4">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${themeClasses.textSecondary}`}>Usuarios</span>
                    <span className={`text-sm font-medium ${themeClasses.text}`}>
                      {formatLimit(plan.max_users)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${themeClasses.textSecondary}`}>Recetas</span>
                    <span className={`text-sm font-medium ${themeClasses.text}`}>
                      {formatLimit(plan.max_recipes)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${themeClasses.textSecondary}`}>Eventos</span>
                    <span className={`text-sm font-medium ${themeClasses.text}`}>
                      {formatLimit(plan.max_events)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="px-6 pb-6">
                <div className="space-y-2">
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-start">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className={`text-sm ${themeClasses.textSecondary}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                  {plan.features.length > 3 && (
                    <div className={`text-xs ${themeClasses.textSecondary} ml-6`}>
                      +{plan.features.length - 3} característica{plan.features.length - 3 !== 1 ? 's' : ''} más
                    </div>
                  )}
                </div>
              </div>

              {/* Plan Status */}
              <div className={`px-6 py-3 border-t ${themeClasses.border} bg-gray-50 dark:bg-slate-800/50`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${plan.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-xs font-medium ${plan.is_active ? 'text-green-600' : 'text-red-600'}`}>
                      {plan.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      disabled={actionLoading === `edit-${plan.plan_id}`}
                      className={`p-1 rounded ${isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-200'} transition-colors disabled:opacity-50`}
                      title="Editar plan"
                    >
                      <PencilIcon className="h-4 w-4 opacity-60 hover:opacity-100" />
                    </button>
                    
                    <button
                      onClick={() => handleTogglePlanStatus(Number(plan.plan_id), plan.is_active)}
                      disabled={actionLoading === `toggle-${plan.plan_id}`}
                      className={`p-1 rounded ${isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-200'} transition-colors disabled:opacity-50`}
                      title={plan.is_active ? 'Desactivar plan' : 'Activar plan'}
                    >
                      {actionLoading === `toggle-${plan.plan_id}` ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      ) : plan.is_active ? (
                        <XMarkIcon className="h-4 w-4 text-red-500 hover:text-red-700" />
                      ) : (
                        <CheckIcon className="h-4 w-4 text-green-500 hover:text-green-700" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && plans.length > 0 && (
        <div className={`${themeClasses.card} rounded-lg p-6`}>
          <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
            Resumen de Planes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${themeClasses.text}`}>
                {plans.length}
              </div>
              <div className={`text-sm ${themeClasses.textSecondary}`}>
                Planes Disponibles
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${themeClasses.text}`}>
                {plans.reduce((sum, plan) => sum + plan.active_subscribers, 0)}
              </div>
              <div className={`text-sm ${themeClasses.textSecondary}`}>
                Total Suscriptores
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${themeClasses.text}`}>
                {formatCurrency(plans.reduce((sum, plan) => sum + (plan.price_monthly * plan.active_subscribers), 0))}
              </div>
              <div className={`text-sm ${themeClasses.textSecondary}`}>
                MRR Total Estimado
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && plans.length === 0 && (
        <div className={`${themeClasses.card} rounded-lg p-8 text-center`}>
          <CurrencyEuroIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className={`text-lg font-semibold ${themeClasses.text} mb-2`}>
            No hay planes configurados
          </h3>
          <p className={themeClasses.textSecondary}>
            Configura tus primeros planes de suscripción para comenzar.
          </p>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${themeClasses.card} rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
                Editar Plan: {editingPlan.plan_name}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {error && (
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <h4 className={`font-medium ${themeClasses.text}`}>Información Básica</h4>
                  
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                      Nombre del Plan
                    </label>
                    <input
                      type="text"
                      value={formData.plan_name || ''}
                      onChange={(e) => setFormData({...formData, plan_name: e.target.value})}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                      Slug (URL amigable)
                    </label>
                    <input
                      type="text"
                      value={formData.plan_slug || ''}
                      onChange={(e) => setFormData({...formData, plan_slug: e.target.value})}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                      Descripción
                    </label>
                    <textarea
                      rows={3}
                      value={formData.plan_description || ''}
                      onChange={(e) => setFormData({...formData, plan_description: e.target.value})}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                        Color
                      </label>
                      <select
                        value={formData.plan_color || 'blue'}
                        onChange={(e) => setFormData({...formData, plan_color: e.target.value})}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      >
                        <option value="gray">Gris</option>
                        <option value="blue">Azul</option>
                        <option value="purple">Morado</option>
                        <option value="amber">Ámbar</option>
                        <option value="green">Verde</option>
                        <option value="red">Rojo</option>
                      </select>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                        Orden
                      </label>
                      <input
                        type="number"
                        value={formData.sort_order || 0}
                        onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      />
                    </div>
                  </div>
                </div>

                {/* Precios */}
                <div className="space-y-4">
                  <h4 className={`font-medium ${themeClasses.text}`}>Precios</h4>
                  
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                      Precio Mensual (céntimos)
                    </label>
                    <input
                      type="number"
                      value={formData.monthly_price_cents || 0}
                      onChange={(e) => setFormData({...formData, monthly_price_cents: parseInt(e.target.value)})}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                    />
                    <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                      Equivale a: {formatCurrency((formData.monthly_price_cents || 0) / 100)}
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                      Precio Anual (céntimos)
                    </label>
                    <input
                      type="number"
                      value={formData.yearly_price_cents || 0}
                      onChange={(e) => setFormData({...formData, yearly_price_cents: parseInt(e.target.value)})}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                    />
                    <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>
                      Equivale a: {formatCurrency((formData.yearly_price_cents || 0) / 100)}
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                      Descuento Anual (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.yearly_discount_percentage || 16.67}
                      onChange={(e) => setFormData({...formData, yearly_discount_percentage: parseFloat(e.target.value)})}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                    />
                  </div>
                </div>

                {/* Límites */}
                <div className="space-y-4">
                  <h4 className={`font-medium ${themeClasses.text}`}>Límites del Plan</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                        Máx. Usuarios
                      </label>
                      <input
                        type="number"
                        value={formData.max_users || 0}
                        onChange={(e) => setFormData({...formData, max_users: parseInt(e.target.value)})}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      />
                      <p className={`text-xs ${themeClasses.textSecondary} mt-1`}>-1 = ilimitado</p>
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                        Máx. Recetas
                      </label>
                      <input
                        type="number"
                        value={formData.max_recipes || 0}
                        onChange={(e) => setFormData({...formData, max_recipes: parseInt(e.target.value)})}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                        Máx. Eventos
                      </label>
                      <input
                        type="number"
                        value={formData.max_events || 0}
                        onChange={(e) => setFormData({...formData, max_events: parseInt(e.target.value)})}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                        Almacenamiento (MB)
                      </label>
                      <input
                        type="number"
                        value={formData.max_storage_mb || 1000}
                        onChange={(e) => setFormData({...formData, max_storage_mb: parseInt(e.target.value)})}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      />
                    </div>
                  </div>
                </div>

                {/* Configuración */}
                <div className="space-y-4">
                  <h4 className={`font-medium ${themeClasses.text}`}>Configuración</h4>
                  
                  <div>
                    <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                      Nivel de Soporte
                    </label>
                    <select
                      value={formData.support_level || 'email'}
                      onChange={(e) => setFormData({...formData, support_level: e.target.value})}
                      className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                    >
                      <option value="email">Email</option>
                      <option value="priority">Prioritario</option>
                      <option value="24x7">24/7</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className={`flex items-center`}>
                      <input
                        type="checkbox"
                        checked={formData.is_public ?? true}
                        onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                        className="mr-2"
                      />
                      <span className={`text-sm ${themeClasses.text}`}>Plan público</span>
                    </label>
                    
                    <label className={`flex items-center`}>
                      <input
                        type="checkbox"
                        checked={formData.is_popular ?? false}
                        onChange={(e) => setFormData({...formData, is_popular: e.target.checked})}
                        className="mr-2"
                      />
                      <span className={`text-sm ${themeClasses.text}`}>Plan popular</span>
                    </label>

                    <label className={`flex items-center`}>
                      <input
                        type="checkbox"
                        checked={formData.has_analytics ?? false}
                        onChange={(e) => setFormData({...formData, has_analytics: e.target.checked})}
                        className="mr-2"
                      />
                      <span className={`text-sm ${themeClasses.text}`}>Analytics</span>
                    </label>

                    <label className={`flex items-center`}>
                      <input
                        type="checkbox"
                        checked={formData.has_multi_location ?? false}
                        onChange={(e) => setFormData({...formData, has_multi_location: e.target.checked})}
                        className="mr-2"
                      />
                      <span className={`text-sm ${themeClasses.text}`}>Multi-ubicación</span>
                    </label>

                    <label className={`flex items-center`}>
                      <input
                        type="checkbox"
                        checked={formData.has_custom_api ?? false}
                        onChange={(e) => setFormData({...formData, has_custom_api: e.target.checked})}
                        className="mr-2"
                      />
                      <span className={`text-sm ${themeClasses.text}`}>API personalizada</span>
                    </label>

                    <label className={`flex items-center`}>
                      <input
                        type="checkbox"
                        checked={formData.has_white_label ?? false}
                        onChange={(e) => setFormData({...formData, has_white_label: e.target.checked})}
                        className="mr-2"
                      />
                      <span className={`text-sm ${themeClasses.text}`}>White label</span>
                    </label>

                    <label className={`flex items-center`}>
                      <input
                        type="checkbox"
                        checked={formData.is_active ?? true}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        className="mr-2"
                      />
                      <span className={`text-sm ${themeClasses.text}`}>Plan activo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Características */}
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text} mb-1`}>
                  Características (una por línea)
                </label>
                <textarea
                  rows={6}
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  placeholder="Hasta 5 usuarios&#10;Hasta 200 recetas&#10;Gestión completa de inventario"
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={handleCancelEdit}
                disabled={saveLoading}
                className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium ${themeClasses.text} hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePlan}
                disabled={saveLoading}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors`}
              >
                {saveLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}