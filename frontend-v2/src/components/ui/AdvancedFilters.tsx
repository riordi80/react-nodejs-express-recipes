'use client'


interface FilterOption {
  value: string;
  label: string;
}

interface CustomFilter {
  key: string;
  label: string;
  options: FilterOption[];
}

interface AdvancedFiltersProps {
  // Date filter props
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
  showDateFilter?: boolean;
  
  // Activity filter props
  activityFilter: string;
  onActivityFilterChange: (value: string) => void;
  showActivityFilter?: boolean;
  
  // Date range props
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void;
  
  // Custom filters
  customFilters?: CustomFilter[];
  customFilterValues?: Record<string, string>;
  onCustomFilterChange?: (key: string, value: string) => void;
  
  // Clear filters
  onClearFilters: () => void;
  
  // Visibility
  isOpen: boolean;
  onToggle: () => void;
  
  // Styling
  isDark?: boolean;
  className?: string;
  
  // Labels customization
  labels?: {
    title?: string;
    dateLabel?: string;
    activityLabel?: string;
    startDateLabel?: string;
    endDateLabel?: string;
    clearFiltersLabel?: string;
  };
}

const defaultLabels = {
  title: 'Filtros Avanzados',
  dateLabel: 'Fecha de Creación',
  activityLabel: 'Actividad',
  startDateLabel: 'Fecha Inicio',
  endDateLabel: 'Fecha Fin',
  clearFiltersLabel: 'Limpiar Filtros'
};

const dateFilterOptions = [
  { value: 'all', label: 'Todas las fechas' },
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Última semana' },
  { value: 'month', label: 'Último mes' },
  { value: 'quarter', label: 'Último trimestre' },
  { value: 'year', label: 'Último año' },
  { value: 'custom', label: 'Rango personalizado' }
];

const activityFilterOptions = [
  { value: 'all', label: 'Toda la actividad' },
  { value: 'active_today', label: 'Activos hoy' },
  { value: 'active_week', label: 'Activos esta semana' },
  { value: 'active_month', label: 'Activos este mes' },
  { value: 'inactive_week', label: 'Inactivos +1 semana' },
  { value: 'inactive_month', label: 'Inactivos +1 mes' },
  { value: 'never_active', label: 'Nunca activos' }
];

export default function AdvancedFilters({
  dateFilter,
  onDateFilterChange,
  showDateFilter = true,
  activityFilter,
  onActivityFilterChange,
  showActivityFilter = true,
  dateRange,
  onDateRangeChange,
  customFilters = [],
  customFilterValues = {},
  onCustomFilterChange,
  onClearFilters,
  isOpen,
  onToggle,
  isDark = false,
  className = '',
  labels = {}
}: AdvancedFiltersProps) {
  
  const finalLabels = { ...defaultLabels, ...labels };
  
  // Theme classes
  const bgClass = isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200';
  const bgSecondaryClass = isDark ? 'bg-slate-700' : 'bg-gray-50';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = isDark ? 'text-slate-300' : 'text-gray-600';
  const borderClass = isDark ? 'border-slate-600' : 'border-gray-200';
  const buttonHoverClass = isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50';

  return (
    <div className={`${bgClass} border rounded-lg mb-6 ${className}`}>
      <div className="p-4">
        <button
          onClick={onToggle}
          className={`flex items-center gap-2 text-sm font-medium ${textClass} ${buttonHoverClass} transition-colors`}
        >
          <span>{finalLabels.title}</span>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Filter */}
              {showDateFilter && (
                <div>
                  <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>
                    {finalLabels.dateLabel}
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => onDateFilterChange(e.target.value)}
                    className={`w-full ${bgSecondaryClass} border ${borderClass} rounded-lg px-3 py-2 text-sm ${textClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    {dateFilterOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Activity Filter */}
              {showActivityFilter && (
                <div>
                  <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>
                    {finalLabels.activityLabel}
                  </label>
                  <select
                    value={activityFilter}
                    onChange={(e) => onActivityFilterChange(e.target.value)}
                    className={`w-full ${bgSecondaryClass} border ${borderClass} rounded-lg px-3 py-2 text-sm ${textClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    {activityFilterOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom Filters */}
              {customFilters.map(filter => (
                <div key={filter.key}>
                  <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>
                    {filter.label}
                  </label>
                  <select
                    value={customFilterValues[filter.key] || 'all'}
                    onChange={(e) => onCustomFilterChange?.(filter.key, e.target.value)}
                    className={`w-full ${bgSecondaryClass} border ${borderClass} rounded-lg px-3 py-2 text-sm ${textClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    {filter.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Clear Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={onClearFilters}
                  className={`px-4 py-2 border ${borderClass} ${textSecondaryClass} rounded-lg ${buttonHoverClass} transition-colors text-sm`}
                >
                  {finalLabels.clearFiltersLabel}
                </button>
              </div>
            </div>

            {/* Custom Date Range */}
            {showDateFilter && dateFilter === 'custom' && (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t ${borderClass}`}>
                <div>
                  <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>
                    {finalLabels.startDateLabel}
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
                    className={`w-full ${bgSecondaryClass} border ${borderClass} rounded-lg px-3 py-2 text-sm ${textClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textSecondaryClass} mb-2`}>
                    {finalLabels.endDateLabel}
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
                    className={`w-full ${bgSecondaryClass} border ${borderClass} rounded-lg px-3 py-2 text-sm ${textClass} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}