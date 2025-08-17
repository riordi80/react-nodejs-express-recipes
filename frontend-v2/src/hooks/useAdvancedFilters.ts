import { useState, useMemo } from 'react';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface UseAdvancedFiltersProps<T> {
  items: T[];
  searchFields: (keyof T)[];
  getItemDate?: (item: T) => string;
  getItemLastActivity?: (item: T) => string | null | undefined;
}

export function useAdvancedFilters<T>({
  items,
  searchFields,
  getItemDate,
  getItemLastActivity
}: UseAdvancedFiltersProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: ''
  });
  const [customFilters, setCustomFilters] = useState<Record<string, string>>({});

  // Helper function to check if item matches search term
  const matchesSearch = (item: T): boolean => {
    if (!searchTerm) return true;
    
    return searchFields.some(field => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  // Helper function to check date filters
  const checkDateFilter = (item: T): boolean => {
    if (dateFilter === 'all' || !getItemDate) return true;
    
    const itemDate = new Date(getItemDate(item));
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return itemDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return itemDate >= monthAgo;
      case 'quarter':
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        return itemDate >= quarterAgo;
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return itemDate >= yearAgo;
      case 'custom':
        if (!dateRange.startDate || !dateRange.endDate) return true;
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        return itemDate >= startDate && itemDate <= endDate;
      default:
        return true;
    }
  };

  // Helper function to check activity filters
  const checkActivityFilter = (item: T): boolean => {
    if (activityFilter === 'all' || !getItemLastActivity) return true;
    
    const lastActivity = getItemLastActivity(item);
    const lastActivityDate = lastActivity ? new Date(lastActivity) : null;
    const now = new Date();
    
    switch (activityFilter) {
      case 'active_today':
        return lastActivityDate && lastActivityDate.toDateString() === now.toDateString();
      case 'active_week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return lastActivityDate && lastActivityDate >= weekAgo;
      case 'active_month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return lastActivityDate && lastActivityDate >= monthAgo;
      case 'inactive_week':
        const inactiveWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return !lastActivityDate || lastActivityDate < inactiveWeek;
      case 'inactive_month':
        const inactiveMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return !lastActivityDate || lastActivityDate < inactiveMonth;
      case 'never_active':
        return !lastActivityDate;
      default:
        return true;
    }
  };

  // Helper function to check custom filters
  const checkCustomFilters = (item: T): boolean => {
    return Object.entries(customFilters).every(([key, value]) => {
      if (value === 'all' || !value) return true;
      return (item as any)[key] === value;
    });
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      matchesSearch(item) && 
      checkDateFilter(item) && 
      checkActivityFilter(item) &&
      checkCustomFilters(item)
    );
  }, [
    items, 
    searchTerm, 
    dateFilter, 
    activityFilter, 
    dateRange.startDate, 
    dateRange.endDate,
    customFilters
  ]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || 
           dateFilter !== 'all' || 
           activityFilter !== 'all' ||
           Object.values(customFilters).some(value => value !== 'all' && value !== '');
  }, [searchTerm, dateFilter, activityFilter, customFilters]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setActivityFilter('all');
    setDateRange({ startDate: '', endDate: '' });
    setCustomFilters({});
  };

  // Set custom filter
  const setCustomFilter = (key: string, value: string) => {
    setCustomFilters(prev => ({ ...prev, [key]: value }));
  };

  return {
    // State values
    searchTerm,
    dateFilter,
    activityFilter,
    dateRange,
    customFilters,
    
    // Setters
    setSearchTerm,
    setDateFilter,
    setActivityFilter,
    setDateRange,
    setCustomFilter,
    
    // Computed values
    filteredItems,
    hasActiveFilters,
    
    // Actions
    clearAllFilters
  };
}