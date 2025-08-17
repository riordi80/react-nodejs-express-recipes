'use client'

import { ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface BulkAction {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  onClick: () => void;
  disabled?: boolean;
}

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
  className?: string;
  isDark?: boolean;
}

const variantStyles = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  warning: 'bg-yellow-600 hover:bg-yellow-700 text-white'
};

const darkVariantStyles = {
  primary: 'bg-blue-500 hover:bg-blue-600 text-white',
  secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  success: 'bg-green-500 hover:bg-green-600 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white'
};

export default function BulkActionsBar({
  selectedCount,
  onClearSelection,
  actions,
  className = '',
  isDark = false
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  const getVariantStyles = (variant: BulkAction['variant'] = 'primary') => {
    return isDark ? darkVariantStyles[variant] : variantStyles[variant];
  };

  const bgClass = isDark 
    ? 'bg-slate-800 border-slate-600' 
    : 'bg-white border-gray-200';
  
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = isDark ? 'text-slate-300' : 'text-gray-600';

  return (
    <div className={`
      fixed bottom-6 left-1/2 transform -translate-x-1/2 
      ${bgClass} border rounded-lg shadow-lg 
      px-4 py-3 flex items-center gap-4 z-50
      min-w-96 max-w-4xl
      ${className}
    `}>
      {/* Selection info */}
      <div className="flex items-center gap-2">
        <div className={`text-sm font-medium ${textClass}`}>
          {selectedCount} elemento{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
        </div>
        <button
          onClick={onClearSelection}
          className={`p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors ${textSecondaryClass}`}
          title="Limpiar selección"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className={`w-px h-6 ${isDark ? 'bg-slate-600' : 'bg-gray-300'}`} />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium 
              transition-colors duration-200
              flex items-center gap-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${getVariantStyles(action.variant)}
            `}
          >
            {action.icon && (
              <span className="w-4 h-4">
                {action.icon}
              </span>
            )}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}