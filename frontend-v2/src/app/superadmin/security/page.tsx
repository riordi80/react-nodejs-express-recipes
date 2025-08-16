'use client';

import React from 'react';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';

export default function SecurityPage() {
  const { getThemeClasses } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${themeClasses.text} mb-2`}>Seguridad del Sistema</h1>
          <p className={themeClasses.textSecondary}>Configuración de seguridad y gestión de accesos</p>
        </div>

        <div className={`rounded-lg border p-8 text-center ${themeClasses.card}`}>
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <h3 className={`text-xl font-semibold ${themeClasses.text} mb-2`}>
              Próximamente
            </h3>
            <p className={`${themeClasses.textSecondary} mb-4`}>
              El panel de seguridad estará disponible en una próxima actualización. 
              Aquí podrás gestionar configuraciones de seguridad y accesos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}