'use client';

import React from 'react';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';

export default function MetricsPage() {
  const { getThemeClasses } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>Métricas y Analytics</h1>
          <p className={themeClasses.textSecondary}>Análisis detallado de uso y rendimiento</p>
        </div>

        <div className={`rounded-lg border p-8 text-center ${themeClasses.card}`}>
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
              Próximamente
            </h3>
            <p className={`${themeClasses.textSecondary} mb-4`}>
              El panel de métricas estará disponible en una próxima actualización. 
              Aquí podrás analizar el uso y rendimiento del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}