'use client';

import React, { useEffect, useState } from 'react';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';
import { useSuperAdmin } from '@/context/SuperAdminContext';
import BillingOverview from '@/components/superadmin/billing/BillingOverview';
import PlansManagement from '@/components/superadmin/billing/PlansManagement';
import FinancialReports from '@/components/superadmin/billing/FinancialReports';
import { 
  CurrencyDollarIcon,
  CreditCardIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

type BillingTab = 'overview' | 'plans' | 'reports' | 'settings';

export default function BillingPage() {
  const { getThemeClasses, isDark } = useSuperAdminTheme();
  const { hasPermission } = useSuperAdmin();
  const themeClasses = getThemeClasses();
  const [activeTab, setActiveTab] = useState<BillingTab>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar permisos y cargar datos iniciales
    if (hasPermission('manage_billing')) {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [hasPermission]);

  if (!hasPermission('manage_billing')) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} p-6`}>
        <div className="max-w-7xl mx-auto">
          <div className={`rounded-lg border p-8 text-center ${themeClasses.card}`}>
            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
                Acceso Denegado
              </h3>
              <p className={`${themeClasses.textSecondary} mb-4`}>
                No tienes permisos para acceder al módulo de facturación.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'overview' as BillingTab,
      name: 'Resumen General',
      icon: CurrencyDollarIcon,
      description: 'Métricas financieras y estado de ingresos'
    },
    {
      id: 'plans' as BillingTab,
      name: 'Gestión de Planes',
      icon: CreditCardIcon,
      description: 'Administrar planes de suscripción'
    },
    {
      id: 'reports' as BillingTab,
      name: 'Reportes Financieros',
      icon: ChartBarIcon,
      description: 'Análisis detallado y tendencias'
    },
    {
      id: 'settings' as BillingTab,
      name: 'Configuración',
      icon: Cog6ToothIcon,
      description: 'Ajustes de facturación y pagos'
    }
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} p-6`}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className={`h-8 ${isDark ? 'bg-slate-700' : 'bg-gray-300'} rounded w-1/3 mb-4`}></div>
            <div className={`h-96 ${isDark ? 'bg-slate-700' : 'bg-gray-300'} rounded`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>Gestión de Facturación</h1>
          <p className={themeClasses.textSecondary}>Administración completa de ingresos, suscripciones y análisis financiero</p>
        </div>

        {/* Navigation Tabs */}
        <div className={`border-b ${themeClasses.border} mb-8`}>
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? (isDark ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600')
                      : `border-transparent ${themeClasses.textSecondary} hover:${isDark ? 'text-slate-300 hover:border-slate-300' : 'text-gray-700 hover:border-gray-300'}`
                  }`}
                >
                  <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                    activeTab === tab.id
                      ? (isDark ? 'text-blue-400' : 'text-blue-500')
                      : (isDark ? 'text-slate-400 group-hover:text-slate-300' : 'text-gray-400 group-hover:text-gray-500')
                  }`} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mb-8">
          {activeTab === 'overview' && <BillingOverview />}
          {activeTab === 'plans' && <PlansManagement />}
          {activeTab === 'reports' && <FinancialReports />}
          {activeTab === 'settings' && (
            <div className={`rounded-lg border p-8 text-center ${themeClasses.card}`}>
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Cog6ToothIcon className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
                  Configuración de Facturación
                </h3>
                <p className={`${themeClasses.textSecondary} mb-4`}>
                  La configuración avanzada de facturación estará disponible en próximas versiones.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}