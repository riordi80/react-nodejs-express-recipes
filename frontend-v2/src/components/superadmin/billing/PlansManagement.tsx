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
  CurrencyEuroIcon
} from '@heroicons/react/24/outline';

interface SubscriptionPlan {
  plan_id: string;
  plan_name: string;
  plan_description: string;
  monthly_price_cents: number;
  yearly_price_cents: number;
  max_users: number;
  max_recipes: number;
  max_events: number;
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
  const [editingPlan, setEditingPlan] = useState<string | null>(null);

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
        <button
          onClick={fetchPlans}
          disabled={loading}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors`}
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
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
                  <button
                    onClick={() => setEditingPlan(plan.plan_id)}
                    className={`p-1 rounded ${isDark ? 'hover:bg-slate-600' : 'hover:bg-gray-200'} transition-colors`}
                    title="Editar plan"
                  >
                    <PencilIcon className="h-4 w-4 opacity-60 hover:opacity-100" />
                  </button>
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
    </div>
  );
}