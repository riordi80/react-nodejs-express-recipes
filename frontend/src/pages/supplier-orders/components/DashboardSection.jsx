// src/pages/supplier-orders/components/DashboardSection.jsx
import React, { useState, useEffect } from 'react';
import { FaChartBar, FaEuroSign, FaTruck, FaExclamationTriangle } from 'react-icons/fa';
import { formatCurrency } from '../../../utils/formatters';
import MetricCard from '../../../components/metric-card/MetricCard';
import QuickActions from './QuickActions';
import api from '../../../api/axios';

const DashboardSection = ({ onNavigateToTab }) => {
  const [metrics, setMetrics] = useState({
    monthlySpending: 0,
    todayDeliveries: 0,
    potentialSavings: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/supplier-orders/dashboard');
      
      setMetrics({
        monthlySpending: response.data.monthlySpending,
        todayDeliveries: response.data.todayDeliveries,
        potentialSavings: response.data.potentialSavings,
        lowStockItems: response.data.lowStockItems
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback a datos por defecto en caso de error
      setMetrics({
        monthlySpending: 0,
        todayDeliveries: 0,
        potentialSavings: 0,
        lowStockItems: 0
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-section">
        <h2 className="section-title">
          <FaChartBar />
          Dashboard de Compras
        </h2>
        <div className="loading-state">Cargando métricas...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-section">
      <h2 className="section-title">
        <FaChartBar />
        Dashboard de Compras
      </h2>
      
      <div className="metrics-grid">
        <MetricCard
          type="primary"
          icon={FaEuroSign}
          label="Gasto Mensual"
          value={formatCurrency(metrics.monthlySpending)}
          detail="Último mes"
        />

        <MetricCard
          type="success"
          icon={FaTruck}
          label="Entregas Hoy"
          value={metrics.todayDeliveries}
          detail="Entregas completadas hoy"
        />

        <MetricCard
          type="highlight"
          icon={FaEuroSign}
          label="Ahorro Potencial"
          value={formatCurrency(metrics.potentialSavings)}
          detail="Consolidando pedidos pendientes"
        />

        <MetricCard
          type="highlight warning-style"
          icon={FaExclamationTriangle}
          label="Stock Bajo"
          value={metrics.lowStockItems}
          detail="Requieren reposición"
        />
      </div>

      <QuickActions onNavigateToTab={onNavigateToTab} />
    </div>
  );
};

export default DashboardSection;