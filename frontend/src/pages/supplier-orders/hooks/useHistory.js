// src/pages/supplier-orders/hooks/useHistory.js
import { useState, useEffect } from 'react';
import api from '../../../api/axios';

export const useHistory = () => {
  const [historyMetrics, setHistoryMetrics] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadHistoryMetrics = async () => {
    try {
      setHistoryLoading(true);
      
      const recentOrdersRes = await api.get('/supplier-orders/history?limit=5&orderBy=created_at&sortDirection=DESC');

      const trendsRes = await api.get('/supplier-orders/trends?period=month&months=3');

      const summaryRes = await api.get('/supplier-orders/history?limit=1');

      const metrics = {
        recentOrders: recentOrdersRes.data.orders || [],
        trends: trendsRes.data || {},
        summary: summaryRes.data.statistics || {}
      };

      setHistoryMetrics(metrics);
    } catch (error) {
      console.error('Error al cargar métricas de historial:', error);
      
      // Fallback con datos vacíos para que no se rompa la UI
      setHistoryMetrics({
        recentOrders: [],
        trends: {},
        summary: {
          totalOrders: 0,
          totalAmount: 0,
          averageAmount: 0,
          statusBreakdown: {
            delivered: 0,
            pending: 0,
            ordered: 0,
            cancelled: 0
          }
        }
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load data when hook is first used
  useEffect(() => {
    loadHistoryMetrics();
  }, []);

  return {
    historyMetrics,
    historyLoading,
    loadHistoryMetrics
  };
};