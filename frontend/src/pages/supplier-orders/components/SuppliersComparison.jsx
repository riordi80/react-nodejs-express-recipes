// src/pages/supplier-orders/components/SuppliersComparison.jsx
import React from 'react';
import { formatCurrency } from '../../../utils/formatters';
import StarRating from './StarRating';

const SuppliersComparison = ({ suppliersAnalysis }) => {
  return (
    <div className="detailed-comparison">
      <h3>Comparativa Detallada</h3>
      <div className="comparison-grid">
        {suppliersAnalysis.map(supplier => (
          <div key={supplier.id} className="supplier-card">
            <div className="card-header">
              <h4>{supplier.name}</h4>
              <div className="overall-score">
                {((supplier.qualityRating + supplier.priceRating) / 2).toFixed(1)}★
              </div>
            </div>
            
            <div className="card-metrics">
              <div className="metric">
                <span className="metric-label">Pedidos</span>
                <span className="metric-value">{supplier.totalOrders}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Gasto</span>
                <span className="metric-value">{formatCurrency(supplier.totalSpent)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Ingredientes</span>
                <span className="metric-value">{supplier.ingredientsCount}</span>
              </div>
            </div>

            <div className="card-ratings">
              <div className="rating-row">
                <span>Calidad:</span>
                <div className="rating-display">
                  <StarRating rating={supplier.qualityRating} />
                </div>
              </div>
              <div className="rating-row">
                <span>Precios:</span>
                <div className="rating-display">
                  <StarRating rating={supplier.priceRating} />
                </div>
              </div>
            </div>

            {supplier.ordersByStatus && (
              <div className="order-status-breakdown">
                <small>Estados de pedidos:</small>
                <div className="status-bars">
                  {supplier.ordersByStatus.delivered > 0 && (
                    <div className="status-bar delivered" title={`${supplier.ordersByStatus.delivered} entregados`}>
                      {supplier.ordersByStatus.delivered}
                    </div>
                  )}
                  {supplier.ordersByStatus.ordered > 0 && (
                    <div className="status-bar ordered" title={`${supplier.ordersByStatus.ordered} enviados`}>
                      {supplier.ordersByStatus.ordered}
                    </div>
                  )}
                  {supplier.ordersByStatus.pending > 0 && (
                    <div className="status-bar pending" title={`${supplier.ordersByStatus.pending} pendientes`}>
                      {supplier.ordersByStatus.pending}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuppliersComparison;