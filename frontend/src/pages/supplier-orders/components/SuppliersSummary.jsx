// src/pages/supplier-orders/components/SuppliersSummary.jsx
import React from 'react';
import { formatCurrency } from '../../../utils/formatters';

const SuppliersSummary = ({ suppliersAnalysis }) => {
  return (
    <div className="analysis-summary">
      <div className="summary-card">
        <div className="summary-label">Proveedores Activos</div>
        <div className="summary-value">{suppliersAnalysis.length}</div>
      </div>
      <div className="summary-card">
        <div className="summary-label">Gasto Total</div>
        <div className="summary-value">
          {formatCurrency(suppliersAnalysis.reduce((total, s) => total + s.totalSpent, 0))}
        </div>
      </div>
      <div className="summary-card">
        <div className="summary-label">Pedidos Totales</div>
        <div className="summary-value">
          {suppliersAnalysis.reduce((total, s) => total + s.totalOrders, 0)}
        </div>
      </div>
      <div className="summary-card">
        <div className="summary-label">Promedio Calidad</div>
        <div className="summary-value">
          {(suppliersAnalysis.reduce((total, s) => total + s.qualityRating, 0) / suppliersAnalysis.length).toFixed(1)}★
        </div>
      </div>
    </div>
  );
};

export default SuppliersSummary;