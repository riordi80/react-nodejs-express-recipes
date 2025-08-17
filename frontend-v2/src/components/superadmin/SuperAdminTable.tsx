'use client';

import React from 'react';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';

interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  className?: string;
  render?: (value: any, item: any, index: number) => React.ReactNode;
}

interface SuperAdminTableProps {
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  emptyState?: {
    icon?: React.ComponentType<any>;
    title: string;
    description: string;
  };
  className?: string;
  tableKey?: string | number; // Para forzar re-renders
}

export default function SuperAdminTable({
  columns,
  data,
  loading = false,
  emptyState,
  className = '',
  tableKey
}: SuperAdminTableProps) {
  const { getThemeClasses } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className={`rounded-lg border overflow-hidden ${themeClasses.card} ${className}`} key={tableKey}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={themeClasses.bgSecondary}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-3 sm:px-6 py-3 text-left text-xs font-medium 
                    ${themeClasses.textSecondary} uppercase tracking-wider
                    ${column.className || ''}
                  `}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody 
            className={`${themeClasses.bg} divide-y ${themeClasses.divider}`} 
            key={`tbody-${tableKey}-${data.length}`}
          >
            {loading ? (
              <tr key="loading-row">
                <td colSpan={columns.length} className="px-3 sm:px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                    <span className={themeClasses.text}>Cargando...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              emptyState && (
                <tr key="empty-row">
                  <td colSpan={columns.length} className="px-3 sm:px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      {emptyState.icon && (
                        <emptyState.icon className={`mx-auto h-12 w-12 ${themeClasses.textSecondary} mb-4`} />
                      )}
                      <h3 className={`text-sm font-medium ${themeClasses.text} mb-2`}>
                        {emptyState.title}
                      </h3>
                      <p className={`text-sm ${themeClasses.textSecondary} max-w-sm`}>
                        {emptyState.description}
                      </p>
                    </div>
                  </td>
                </tr>
              )
            ) : (
              data.map((item, index) => (
                <tr 
                  key={`${item.id || index}-${tableKey}-${index}`} 
                  className={`${themeClasses.buttonHover}`}
                >
                  {columns.map((column) => (
                    <td 
                      key={column.key}
                      className={`
                        px-3 sm:px-6 py-4 text-sm
                        ${column.key === 'actions' ? 'whitespace-nowrap' : 'break-words'}
                        ${column.className || ''}
                      `}
                    >
                      {column.render 
                        ? column.render(item[column.key], item, index)
                        : item[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}