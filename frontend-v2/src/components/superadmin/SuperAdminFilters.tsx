'use client';

import React from 'react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useSuperAdminTheme } from '@/context/SuperAdminThemeContext';

interface FilterOption {
  value: string;
  label: string;
}

interface SuperAdminFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  filters?: {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
  }[];
  
  createButton?: {
    label: string;
    shortLabel?: string; // Para móviles
    onClick: () => void;
    icon?: React.ComponentType<any>;
  };
  
  className?: string;
}

export default function SuperAdminFilters({
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filters = [],
  createButton,
  className = ''
}: SuperAdminFiltersProps) {
  const { getThemeClasses, isDark } = useSuperAdminTheme();
  const themeClasses = getThemeClasses();

  return (
    <div className={`rounded-lg border p-6 mb-8 ${themeClasses.card} ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className={`h-5 w-5 absolute left-3 top-3 ${themeClasses.textSecondary}`} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className={`
                w-full ${themeClasses.bgSecondary} border ${themeClasses.border} 
                rounded-lg pl-10 pr-4 py-2 ${themeClasses.text} 
                placeholder-${isDark ? 'slate-400' : 'gray-400'} 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              `}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Filters */}
        {filters.map((filter, index) => (
          <select
            key={index}
            className={`
              ${themeClasses.bgSecondary} border ${themeClasses.border} 
              rounded-lg px-4 py-2 ${themeClasses.text} 
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
            value={filter.value}
            onChange={(e) => filter.onChange(e.target.value)}
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}

        {/* Create Button */}
        {createButton && (
          <button
            onClick={createButton.onClick}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            {createButton.icon ? (
              <createButton.icon className="h-5 w-5" />
            ) : (
              <PlusIcon className="h-5 w-5" />
            )}
            {createButton.label}
          </button>
        )}
      </div>
    </div>
  );
}