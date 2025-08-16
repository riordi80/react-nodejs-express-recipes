'use client';

import React from 'react';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';

export default function BillingPage() {
  const { getThemeClasses } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>Gestión de Facturación</h1>
          <p className={themeClasses.textSecondary}>Administración de pagos, facturas y suscripciones</p>
        </div>

        <div className={`rounded-lg border p-8 text-center ${themeClasses.card}`}>
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
              Próximamente
            </h3>
            <p className={`${themeClasses.textSecondary} mb-4`}>
              El módulo de facturación estará disponible en una próxima actualización. 
              Aquí podrás gestionar suscripciones, pagos e invoices.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}