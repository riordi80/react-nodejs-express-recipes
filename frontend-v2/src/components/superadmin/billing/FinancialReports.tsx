'use client';

import React, { useEffect, useState } from 'react';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';
import api from '@/lib/api';
import { 
  ChartBarIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface RevenueTrend {
  month: string;
  month_name: string;
  new_subscriptions: number;
  mrr_added_cents: number;
  mrr_added: number;
}

interface ChurnData {
  month: string;
  churned_customers: number;
  mrr_lost_cents: number;
  mrr_lost: number;
}

interface TrialConversion {
  total_trials: number;
  converted_trials: number;
  conversion_rate: number;
}

interface LTVData {
  subscription_plan: string;
  avg_lifespan_days: number;
  total_customers: number;
  monthly_value_cents: number;
  monthly_value: number;
  estimated_ltv: number;
}

interface FinancialReportsData {
  revenue_trends: RevenueTrend[];
  churn_analysis: ChurnData[];
  trial_conversion: TrialConversion;
  ltv_by_plan: LTVData[];
  period: string;
}

export default function FinancialReports() {
  const { getThemeClasses, isDark } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();
  const [data, setData] = useState<FinancialReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('12'); // meses
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchReports = async (selectedPeriod = period) => {
    try {
      setError(null);
      
      const response = await api.get(`/superadmin/billing/financial-reports?period=${selectedPeriod}`);
      
      if (response.data.success) {
        setData(response.data.data);
        setLastUpdate(new Date());
      } else {
        setError('Error al cargar reportes financieros');
      }
    } catch (err) {
      console.error('Error fetching financial reports:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    const num = Number(percentage) || 0;
    return `${num.toFixed(1)}%`;
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

  const periodOptions = [
    { value: '3', label: '3 meses' },
    { value: '6', label: '6 meses' },
    { value: '12', label: '12 meses' },
    { value: '24', label: '24 meses' }
  ];

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
            fetchReports();
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
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${themeClasses.text}`}>
            Reportes Financieros Detallados
          </h2>
          <p className={`text-sm ${themeClasses.textSecondary} mt-1`}>
            Análisis profundo de tendencias y métricas de crecimiento
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Period Selector */}
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setLoading(true);
              fetchReports(e.target.value);
            }}
            className={`px-3 py-2 border rounded-md text-sm ${
              isDark 
                ? 'bg-slate-700 border-slate-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => {
              setLoading(true);
              fetchReports();
            }}
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors`}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`${themeClasses.card} rounded-lg p-6`}>
              <div className="animate-pulse">
                <div className={`h-6 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded mb-4 w-1/3`}></div>
                <div className={`h-32 ${isDark ? 'bg-slate-600' : 'bg-gray-300'} rounded`}></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total New Revenue */}
            <div className={`${themeClasses.card} rounded-lg p-6`}>
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${isDark ? 'bg-green-600/10' : 'bg-green-50'}`}>
                  <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className={`text-sm font-medium ${themeClasses.textSecondary}`}>
                    Nuevos Ingresos ({period}m)
                  </dt>
                  <dd className={`text-2xl font-bold ${themeClasses.text} mt-1`}>
                    {formatCurrency(data?.revenue_trends.reduce((sum, trend) => sum + trend.mrr_added, 0) || 0)}
                  </dd>
                </div>
              </div>
            </div>

            {/* New Subscriptions */}
            <div className={`${themeClasses.card} rounded-lg p-6`}>
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${isDark ? 'bg-blue-600/10' : 'bg-blue-50'}`}>
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className={`text-sm font-medium ${themeClasses.textSecondary}`}>
                    Nuevas Suscripciones
                  </dt>
                  <dd className={`text-2xl font-bold ${themeClasses.text} mt-1`}>
                    {data?.revenue_trends.reduce((sum, trend) => sum + trend.new_subscriptions, 0) || 0}
                  </dd>
                </div>
              </div>
            </div>

            {/* Churn Rate */}
            <div className={`${themeClasses.card} rounded-lg p-6`}>
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${isDark ? 'bg-red-600/10' : 'bg-red-50'}`}>
                  <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className={`text-sm font-medium ${themeClasses.textSecondary}`}>
                    Pérdida por Churn
                  </dt>
                  <dd className={`text-2xl font-bold ${themeClasses.text} mt-1`}>
                    {formatCurrency(data?.churn_analysis.reduce((sum, churn) => sum + churn.mrr_lost, 0) || 0)}
                  </dd>
                </div>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className={`${themeClasses.card} rounded-lg p-6`}>
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-lg ${isDark ? 'bg-purple-600/10' : 'bg-purple-50'}`}>
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4 flex-1">
                  <dt className={`text-sm font-medium ${themeClasses.textSecondary}`}>
                    Conversión Trial
                  </dt>
                  <dd className={`text-2xl font-bold ${themeClasses.text} mt-1`}>
                    {formatPercentage(data?.trial_conversion.conversion_rate || 0)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Trends Table */}
          <div>
            <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
              Tendencias de Ingresos Mensuales
            </h3>
            <div className={`${themeClasses.card} rounded-lg overflow-hidden`}>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium">
                  <div className={themeClasses.textSecondary}>Mes</div>
                  <div className={themeClasses.textSecondary}>Nuevas Suscripciones</div>
                  <div className={themeClasses.textSecondary}>MRR Añadido</div>
                  <div className={themeClasses.textSecondary}>Tendencia</div>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {data?.revenue_trends.map((trend, index) => {
                  const prevTrend = index > 0 ? data.revenue_trends[index - 1] : null;
                  const growth = prevTrend && prevTrend.mrr_added > 0
                    ? ((Number(trend.mrr_added) - Number(prevTrend.mrr_added)) / Number(prevTrend.mrr_added)) * 100 
                    : 0;
                  
                  return (
                    <div key={trend.month} className="px-6 py-4">
                      <div className="grid grid-cols-4 gap-4 items-center">
                        <div className={`text-sm font-medium ${themeClasses.text}`}>
                          {trend.month_name}
                        </div>
                        <div className={`text-sm ${themeClasses.text}`}>
                          {trend.new_subscriptions.toLocaleString('es-ES')}
                        </div>
                        <div className={`text-sm font-medium ${themeClasses.text}`}>
                          {formatCurrency(trend.mrr_added)}
                        </div>
                        <div className="flex items-center">
                          {index > 0 && (
                            <>
                              {growth >= 0 ? (
                                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                              )}
                              <span className={`text-sm font-medium ${
                                growth >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {Math.abs(Number(growth) || 0).toFixed(1)}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(!data?.revenue_trends || data.revenue_trends.length === 0) && (
                <div className="px-6 py-8 text-center">
                  <div className={themeClasses.textSecondary}>
                    No hay datos de tendencias para el período seleccionado
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trial Conversion Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Trial Conversion */}
            <div>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
                Análisis de Conversión de Trials
              </h3>
              <div className={`${themeClasses.card} rounded-lg p-6`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={themeClasses.textSecondary}>Total Trials</span>
                    <span className={`font-medium ${themeClasses.text}`}>
                      {data?.trial_conversion.total_trials.toLocaleString('es-ES') || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={themeClasses.textSecondary}>Convertidos</span>
                    <span className={`font-medium ${themeClasses.text}`}>
                      {data?.trial_conversion.converted_trials.toLocaleString('es-ES') || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={themeClasses.textSecondary}>Tasa de Conversión</span>
                    <span className={`font-bold text-lg ${themeClasses.text}`}>
                      {formatPercentage(data?.trial_conversion.conversion_rate || 0)}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className={`w-full bg-gray-200 rounded-full h-2 ${isDark ? 'bg-slate-700' : ''}`}>
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(data?.trial_conversion.conversion_rate || 0, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LTV by Plan */}
            <div>
              <h3 className={`text-lg font-semibold ${themeClasses.text} mb-4`}>
                Valor de Vida del Cliente (LTV) por Plan
              </h3>
              <div className={`${themeClasses.card} rounded-lg overflow-hidden`}>
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium">
                    <div className={themeClasses.textSecondary}>Plan</div>
                    <div className={themeClasses.textSecondary}>Valor Mensual</div>
                    <div className={themeClasses.textSecondary}>LTV Estimado</div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data?.ltv_by_plan.map((plan) => (
                    <div key={plan.subscription_plan} className="px-6 py-4">
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div className={`text-sm font-medium ${themeClasses.text}`}>
                          {getPlanDisplayName(plan.subscription_plan)}
                        </div>
                        <div className={`text-sm ${themeClasses.text}`}>
                          {formatCurrency(plan.monthly_value)}
                        </div>
                        <div className={`text-sm font-medium ${themeClasses.text}`}>
                          {formatCurrency(plan.estimated_ltv)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {(!data?.ltv_by_plan || data.ltv_by_plan.length === 0) && (
                  <div className="px-6 py-8 text-center">
                    <div className={themeClasses.textSecondary}>
                      No hay datos de LTV disponibles
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Last Update Info */}
          <div className={`text-center py-4 border-t ${themeClasses.border}`}>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <ClockIcon className="h-4 w-4" />
              <span className={themeClasses.textSecondary}>
                Última actualización: {lastUpdate.toLocaleString('es-ES')} • Período: {period} meses
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}