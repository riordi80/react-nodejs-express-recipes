'use client';

import React, { useEffect, useState } from 'react';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';
import api from '@/lib/api';
import { 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  CreditCardIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface BillingMetrics {
  total_paying_customers: number;
  total_mrr_cents: number;
  total_arr_cents: number;
  avg_revenue_per_customer_cents: number;
  total_mrr: number;
  total_arr: number;
  avg_revenue_per_customer: number;
}

interface PlanRevenue {
  subscription_plan: string;
  customers: number;
  mrr_cents: number;
  arr_cents: number;
  mrr: number;
  arr: number;
}

interface BillingOverviewData {
  metrics: BillingMetrics;
  plan_revenue: PlanRevenue[];
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'yellow' | 'purple';
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  loading?: boolean;
}

function MetricCard({ title, value, subtitle, icon: Icon, color, trend, loading = false }: MetricCardProps) {
  const { getThemeClasses, isDark } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();

  const colorClasses = {
    blue: {
      icon: 'text-blue-600',
      bg: isDark ? 'bg-blue-600/10' : 'bg-blue-50',
    },
    green: {
      icon: 'text-green-600',
      bg: isDark ? 'bg-green-600/10' : 'bg-green-50',
    },
    yellow: {
      icon: 'text-yellow-600',
      bg: isDark ? 'bg-yellow-600/10' : 'bg-yellow-50',
    },
    purple: {
      icon: 'text-purple-600',
      bg: isDark ? 'bg-purple-600/10' : 'bg-purple-50',
    }
  };

  if (loading) {
    return (
      <div className={`${themeClasses.card} rounded-lg shadow p-6`}>
        <div className="animate-pulse">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-lg ${isDark ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
            <div className="ml-4 flex-1">
              <div className={`h-4 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded w-3/4 mb-2`}></div>
              <div className={`h-6 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded w-1/2`}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${themeClasses.card} rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${colorClasses[color].bg}`}>
          <Icon className={`h-6 w-6 ${colorClasses[color].icon}`} />
        </div>
        <div className="ml-4 flex-1">
          <dt className={`text-sm font-medium ${themeClasses.textSecondary} truncate`}>
            {title}
          </dt>
          <dd className={`text-2xl font-bold ${themeClasses.text} mt-1`}>
            {value}
          </dd>
          {subtitle && (
            <div className={`text-sm ${themeClasses.textSecondary} mt-1`}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center">
          <div className={`flex items-center text-sm ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.direction === 'up' ? (
              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
            )}
            <span className="font-medium">
              {trend.direction === 'up' ? '+' : ''}{trend.value}%
            </span>
          </div>
          <span className={`ml-2 text-sm ${themeClasses.textSecondary}`}>
            vs mes anterior
          </span>
        </div>
      )}
    </div>
  );
}

export default function BillingOverview() {
  const { getThemeClasses, isDark } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();
  const [data, setData] = useState<BillingOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchBillingData = async () => {
    try {
      setError(null);
      
      const response = await api.get('/superadmin/billing/overview');
      
      if (response.data.success) {
        setData(response.data.data);
        setLastUpdate(new Date());
      } else {
        setError('Error al cargar datos de facturación');
      }
    } catch (err) {
      console.error('Error fetching billing overview:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
    
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchBillingData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPlanDisplayName = (planId: string) => {
    const planNames: Record<string, string> = {
      'free': 'Free',
      'basic': 'Basic',
      'premium': 'Premium',
      'enterprise': 'Enterprise'
    };
    return planNames[planId] || planId;
  };

  const getPlanColor = (planId: string) => {
    const colors: Record<string, string> = {
      'free': isDark ? 'bg-gray-600/20 text-gray-400' : 'bg-gray-100 text-gray-700',
      'basic': isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-700',
      'premium': isDark ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-700',
      'enterprise': isDark ? 'bg-yellow-600/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
    };
    return colors[planId] || colors['free'];
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
            fetchBillingData();
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
    <div className="space-y-8">
      {/* Métricas Principales */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${themeClasses.text}`}>
            Resumen Financiero
          </h2>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className={themeClasses.textSecondary}>
              Actualizado: {lastUpdate.toLocaleTimeString('es-ES')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="MRR Total"
            value={formatCurrency(data?.metrics.total_mrr || 0)}
            subtitle="Ingresos mensuales recurrentes"
            icon={CurrencyDollarIcon}
            color="green"
            trend={{ value: 15.3, direction: 'up' }}
            loading={loading}
          />

          <MetricCard
            title="ARR Proyectado"
            value={formatCurrency(data?.metrics.total_arr || 0)}
            subtitle="Ingresos anuales recurrentes"
            icon={ArrowTrendingUpIcon}
            color="blue"
            trend={{ value: 22.1, direction: 'up' }}
            loading={loading}
          />

          <MetricCard
            title="Clientes de Pago"
            value={data?.metrics.total_paying_customers.toLocaleString('es-ES') || '0'}
            subtitle="Suscripciones activas"
            icon={UsersIcon}
            color="purple"
            trend={{ value: 8.4, direction: 'up' }}
            loading={loading}
          />

          <MetricCard
            title="ARPU"
            value={formatCurrency(data?.metrics.avg_revenue_per_customer || 0)}
            subtitle="Ingreso promedio por usuario"
            icon={CreditCardIcon}
            color="yellow"
            trend={{ value: 2.1, direction: 'down' }}
            loading={loading}
          />
        </div>
      </div>

      {/* Distribución por Planes */}
      <div>
        <h2 className={`text-xl font-semibold ${themeClasses.text} mb-6`}>
          Distribución de Ingresos por Plan
        </h2>

        {loading ? (
          <div className={`${themeClasses.card} rounded-lg p-6`}>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded ${isDark ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
                  <div className="flex-1">
                    <div className={`h-4 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded w-1/4 mb-2`}></div>
                    <div className={`h-3 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded w-1/3`}></div>
                  </div>
                  <div className={`h-6 w-20 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded`}></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`${themeClasses.card} rounded-lg overflow-hidden`}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-4 gap-4 text-sm font-medium">
                <div className={themeClasses.textSecondary}>Plan</div>
                <div className={themeClasses.textSecondary}>Clientes</div>
                <div className={themeClasses.textSecondary}>MRR</div>
                <div className={themeClasses.textSecondary}>ARR</div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {data?.plan_revenue.map((plan) => (
                <div key={plan.subscription_plan} className="px-6 py-4">
                  <div className="grid grid-cols-4 gap-4 items-center">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanColor(plan.subscription_plan)}`}>
                        {getPlanDisplayName(plan.subscription_plan)}
                      </span>
                    </div>
                    <div className={`text-sm ${themeClasses.text}`}>
                      {plan.customers.toLocaleString('es-ES')}
                    </div>
                    <div className={`text-sm font-medium ${themeClasses.text}`}>
                      {formatCurrency(plan.mrr)}
                    </div>
                    <div className={`text-sm font-medium ${themeClasses.text}`}>
                      {formatCurrency(plan.arr)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {(!data?.plan_revenue || data.plan_revenue.length === 0) && (
              <div className="px-6 py-8 text-center">
                <div className={themeClasses.textSecondary}>
                  No hay datos de facturación disponibles
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}