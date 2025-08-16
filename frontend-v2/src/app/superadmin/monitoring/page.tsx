'use client';

import React from 'react';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';

export default function MonitoringPage() {
  const { getThemeClasses } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>Monitoreo del Sistema</h1>
          <p className={themeClasses.textSecondary}>Panel de monitoreo y métricas en tiempo real</p>
        </div>

        <div className={`rounded-lg border p-8 text-center ${themeClasses.card}`}>
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
              Próximamente
            </h3>
            <p className={`${themeClasses.textSecondary} mb-4`}>
              El panel de monitoreo estará disponible en una próxima actualización. 
              Aquí podrás ver métricas en tiempo real del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}