// src/hooks/usePageState.js
import React from 'react';

export const usePageState = (apiEndpoint, options = {}) => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [filterText, setFilterText] = React.useState('');
  const [message, setMessage] = React.useState(null);
  const [messageType, setMessageType] = React.useState('success');
  
  // Support for complex filters (for Recipes page)
  const [filters, setFilters] = React.useState(options.initialFilters || {});

  // Fetch data with optional filters
  const fetchData = React.useCallback(async (customFilters = {}) => {
    setLoading(true);
    try {
      const api = await import('../api/axios');
      const params = options.useFilters ? { ...filters, ...customFilters } : undefined;
      const response = await api.default.get(apiEndpoint, { params });
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(`Error al obtener datos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, filters, options.useFilters]);

  // Initial fetch
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch when filters change (for complex filter pages)
  React.useEffect(() => {
    if (options.useFilters) {
      fetchData();
    }
  }, [filters, fetchData, options.useFilters]);

  // Reload data
  const reload = React.useCallback(async () => {
    try {
      const api = await import('../api/axios');
      const response = await api.default.get(apiEndpoint);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error reloading data:', err);
      setError(`Error al recargar datos: ${err.message}`);
    }
  }, [apiEndpoint]);

  // Notification system
  const notify = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  // Filter data based on search text
  const filteredData = React.useMemo(() => {
    if (!filterText) return data;
    
    return data.filter(item => {
      // Try to find a name field in the item
      const name = item.name || item.title || item.description || '';
      return name.toLowerCase().includes(filterText.toLowerCase());
    });
  }, [data, filterText]);

  // CRUD operations
  const createItem = React.useCallback(async (itemData) => {
    try {
      const api = await import('../api/axios');
      await api.default.post(apiEndpoint, itemData);
      notify('Elemento creado correctamente', 'success');
      await reload();
      return true;
    } catch (err) {
      notify(err.response?.data?.message || 'Error al crear', 'error');
      return false;
    }
  }, [apiEndpoint, reload]);

  const updateItem = React.useCallback(async (id, itemData) => {
    try {
      const api = await import('../api/axios');
      await api.default.put(`${apiEndpoint}/${id}`, itemData);
      notify('Elemento actualizado correctamente', 'success');
      await reload();
      return true;
    } catch (err) {
      notify(err.response?.data?.message || 'Error al actualizar', 'error');
      return false;
    }
  }, [apiEndpoint, reload]);

  const deleteItem = React.useCallback(async (id) => {
    try {
      const api = await import('../api/axios');
      await api.default.delete(`${apiEndpoint}/${id}`);
      notify('Elemento eliminado correctamente', 'success');
      await reload();
      return true;
    } catch (err) {
      notify(err.response?.data?.message || 'Error al eliminar', 'error');
      return false;
    }
  }, [apiEndpoint, reload]);

  return {
    // Data
    data,
    filteredData,
    loading,
    error,
    
    // Simple filter
    filterText,
    setFilterText,
    
    // Complex filters (for Recipes page)
    filters,
    setFilters,
    
    // Messages
    message,
    messageType,
    notify,
    
    // Actions
    reload,
    fetchData,
    createItem,
    updateItem,
    deleteItem,
  };
};