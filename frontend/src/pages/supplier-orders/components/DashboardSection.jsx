// src/pages/supplier-orders/components/DashboardSection.jsx
import React, { useState, useEffect } from 'react';
import { FaChartBar, FaEuroSign, FaTruck, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { formatCurrency } from '../../../utils/formatters';
import MetricCard from '../../../components/metric-card/MetricCard';
import QuickActions from './QuickActions';
import api from '../../../api/axios';

const DashboardSection = ({ onNavigateToTab }) => {
  const [metrics, setMetrics] = useState({
    monthlySpending: 0,
    todayDeliveries: 0,
    potentialSavings: 0,
    lowStockItems: 0,
    savingsDetail: []
  });
  const [loading, setLoading] = useState(true);


  // Función para formatear cantidad con unidad correcta
  const formatQuantity = (paquetes, packageSize, packageUnit) => {
    const totalQuantity = paquetes * parseFloat(packageSize);
    
    // Si es kg y la cantidad es menor a 1, mostrar en gramos
    if (packageUnit === 'kg' && totalQuantity < 1) {
      return `${(totalQuantity * 1000).toFixed(0)}gr`;
    }
    
    // Si es litro y la cantidad es menor a 1, mostrar en ml
    if (packageUnit === 'litro' && totalQuantity < 1) {
      return `${(totalQuantity * 1000).toFixed(0)}ml`;
    }
    
    // Para otros casos, mantener la unidad original
    return `${totalQuantity.toFixed(2)}${packageUnit === 'kg' ? 'kg' : packageUnit === 'litro' ? 'L' : ` ${packageUnit}`}`;
  };

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/supplier-orders/dashboard');
      
      setMetrics({
        monthlySpending: response.data.monthlySpending,
        todayDeliveries: response.data.todayDeliveries,
        potentialSavings: response.data.potentialSavings,
        lowStockItems: response.data.lowStockItems,
        savingsDetail: response.data.savingsDetail || []
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback a datos por defecto en caso de error
      setMetrics({
        monthlySpending: 0,
        todayDeliveries: 0,
        potentialSavings: 0,
        lowStockItems: 0,
        savingsDetail: []
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
          detail="Por consolidación de ingredientes duplicados"
        />

        <MetricCard
          type="highlight warning-style"
          icon={FaExclamationTriangle}
          label="Stock Bajo"
          value={metrics.lowStockItems}
          detail="Requieren reposición"
        />
      </div>

      {/* Detalle del cálculo de ahorro potencial */}
      {metrics.savingsDetail.length > 0 && (
        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '16px'
        }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            fontSize: '16px', 
            color: '#495057',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaInfoCircle />
            Detalle del Ahorro Potencial
          </h3>
          <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '12px' }}>
            Ingredientes que aparecen en múltiples pedidos pendientes y podrían consolidarse:
          </div>
          {metrics.savingsDetail.map((item, index) => (
            <div key={index} style={{
              background: 'white',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              padding: '12px',
              marginBottom: '8px'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {item.ingredient_name}
              </div>
              <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '8px' }}>
                {item.pedidos_afectados}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', fontSize: '12px' }}>
                <div>
                  <strong>Pedidos:</strong> {item.num_pedidos}
                </div>
                <div style={{ color: '#0066cc' }}>
                  <strong>Necesario:</strong> {parseFloat(item.cantidad_total_necesaria).toFixed(2)}
                </div>
                <div style={{ color: '#6c757d' }}>
                  <strong>Unidad venta:</strong> {parseFloat(item.package_size).toFixed(2)} {item.package_unit}
                </div>
                <div style={{ color: '#dc3545' }}>
                  <strong>Separados:</strong> {formatQuantity(item.paquetes_separados, item.package_size, item.package_unit)}
                </div>
                <div style={{ color: '#198754' }}>
                  <strong>Consolidado:</strong> {formatQuantity(item.paquetes_consolidados, item.package_size, item.package_unit)}
                </div>
                <div style={{ color: '#ff6b35', fontWeight: 'bold' }}>
                  <strong>Ahorrados:</strong> {formatQuantity(item.paquetes_ahorrados, item.package_size, item.package_unit)}
                </div>
                <div style={{ color: '#28a745', fontWeight: 'bold' }}>
                  <strong>Ahorro:</strong> {formatCurrency(item.ahorro_euros)}
                </div>
              </div>
            </div>
          ))}
          <div style={{ 
            marginTop: '12px', 
            padding: '8px', 
            background: '#e7f3ff', 
            border: '1px solid #b3d7ff', 
            borderRadius: '4px',
            fontSize: '13px',
            color: '#0066cc'
          }}>
            <strong>Explicación:</strong> El ahorro se calcula por consolidación de paquetes. Si necesitas mantequilla en 2 pedidos separados (0.3kg + 0.4kg), tendrías que comprar 2 paquetes de 1kg. Consolidando, solo necesitas 1 paquete de 1kg. El ahorro es el precio de los paquetes extras evitados.
          </div>
        </div>
      )}

      <QuickActions onNavigateToTab={onNavigateToTab} />
    </div>
  );
};

export default DashboardSection;