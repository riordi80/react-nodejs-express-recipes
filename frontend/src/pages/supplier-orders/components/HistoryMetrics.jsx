// src/pages/supplier-orders/components/HistoryMetrics.jsx
import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const HistoryMetrics = ({ historyMetrics }) => {
  return (
    <div className="metrics-overview">
      <h3>Resumen General</h3>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-info">
            <div className="metric-label">Total de Pedidos</div>
            <div className="metric-value">{historyMetrics.summary.totalOrders}</div>
            <div className="metric-detail">Histórico completo</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-info">
            <div className="metric-label">Volumen Total</div>
            <div className="metric-value">{formatCurrency(historyMetrics.summary.totalAmount)}</div>
            <div className="metric-detail">Todas las compras</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-info">
            <div className="metric-label">Pedido Promedio</div>
            <div className="metric-value">{formatCurrency(historyMetrics.summary.averageAmount)}</div>
            <div className="metric-detail">Por pedido completado</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-info">
            <div className="metric-label">Tasa de Éxito</div>
            <div className="metric-value">
              {historyMetrics.summary.totalOrders > 0 ? 
                Math.round((historyMetrics.summary.statusBreakdown.delivered / historyMetrics.summary.totalOrders) * 100) : 0}%
            </div>
            <div className="metric-detail">Pedidos entregados</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryMetrics;