// src/pages/supplier-orders/components/HistoryTrends.jsx
import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const HistoryTrends = ({ historyMetrics }) => {
  return (
    <div className="trends-overview">
      <h3>Últimos 3 Meses</h3>
      <div className="trends-summary">
        {historyMetrics.trends.supplierTrends && historyMetrics.trends.supplierTrends.length > 0 ? (
          <div className="top-suppliers">
            <h4>Top Proveedores</h4>
            <div className="suppliers-mini-list">
              {historyMetrics.trends.supplierTrends.slice(0, 3).map((supplier, index) => (
                <div key={index} className="supplier-mini-item">
                  <span className="rank">#{index + 1}</span>
                  <div className="supplier-info">
                    <span className="name">{supplier.supplier_name}</span>
                    <span className="amount">{formatCurrency(supplier.total_spending)}</span>
                  </div>
                  <span className="orders">{supplier.total_orders} pedidos</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-trends">
            <p>No hay suficientes datos para mostrar tendencias</p>
          </div>
        )}

        {historyMetrics.trends.deliveryMetrics && historyMetrics.trends.deliveryMetrics.avg_delivery_days && (
          <div className="delivery-summary">
            <h4>Rendimiento de Entregas</h4>
            <div className="delivery-stats">
              <div className="delivery-stat">
                <span className="stat-icon">⏱️</span>
                <div className="stat-info">
                  <span className="stat-value">{Math.round(historyMetrics.trends.deliveryMetrics.avg_delivery_days)} días</span>
                  <span className="stat-label">Tiempo promedio</span>
                </div>
              </div>
              <div className="delivery-stat">
                <span className="stat-icon">🎯</span>
                <div className="stat-info">
                  <span className="stat-value">{Math.round(historyMetrics.trends.deliveryMetrics.on_time_percentage || 0)}%</span>
                  <span className="stat-label">Entregas puntuales</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTrends;