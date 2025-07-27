// src/hooks/usePageState.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';

export const usePageState = (apiEndpoint, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  
  // Support for complex filters (for Recipes page)
  const [filters, setFilters] = useState(options.initialFilters || {});

  // Fetch data with optional filters
  const fetchData = useCallback(async (customFilters = {}) => {
    setLoading(true);
    try {
      const params = options.useFilters ? { ...filters, ...customFilters } : undefined;
      const response = await api.get(apiEndpoint, { params });
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(`Error al obtener datos: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, filters, options.useFilters]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Re-fetch when filters change (for complex filter pages)
  useEffect(() => {
    if (options.useFilters) {
      fetchData();
    }
  }, [filters, fetchData, options.useFilters]);

  // Reload data
  const reload = useCallback(async () => {
    try {
      const response = await api.get(apiEndpoint);
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error reloading data:', err);
      setError(`Error al recargar datos: ${err.message}`);
    }
  }, [apiEndpoint]);

  // Notification system
  const notify = useCallback((msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  // Filter data based on search text
  const filteredData = useMemo(() => {
    if (!filterText) return data;
    
    return data.filter(item => {
      // Try to find a name field in the item
      const name = item.name || item.title || item.description || '';
      return name.toLowerCase().includes(filterText.toLowerCase());
    });
  }, [data, filterText]);

  // CRUD operations
  const createItem = useCallback(async (itemData) => {
    try {
      await api.post(apiEndpoint, itemData);
      notify('Elemento creado correctamente', 'success');
      await reload();
      return true;
    } catch (err) {
      notify(err.response?.data?.message || 'Error al crear', 'error');
      return false;
    }
  }, [apiEndpoint, reload, notify]);

  const updateItem = useCallback(async (id, itemData) => {
    try {
      await api.put(`${apiEndpoint}/${id}`, itemData);
      notify('Elemento actualizado correctamente', 'success');
      await reload();
      return true;
    } catch (err) {
      notify(err.response?.data?.message || 'Error al actualizar', 'error');
      return false;
    }
  }, [apiEndpoint, reload, notify]);

  const deleteItem = useCallback(async (id) => {
    try {
      await api.delete(`${apiEndpoint}/${id}`);
      notify('Elemento eliminado correctamente', 'success');
      await reload();
      return true;
    } catch (err) {
      notify(err.response?.data?.message || 'Error al eliminar', 'error');
      return false;
    }
  }, [apiEndpoint, reload, notify]);

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