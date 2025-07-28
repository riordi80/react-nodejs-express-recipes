// src/pages/supplier-orders/components/SuppliersRanking.jsx
import React from 'react';
import { formatCurrency } from '../../../utils/formatters';
import StarRating from '../../../components/star-rating/StarRating';

const SuppliersRanking = ({ suppliersAnalysis }) => {
  return (
    <div className="suppliers-ranking">
      <h3>Ranking de Proveedores</h3>
      <div className="ranking-table">
        <table>
          <thead>
            <tr>
              <th>Ranking</th>
              <th>Proveedor</th>
              <th>Pedidos</th>
              <th>Gasto Total</th>
              <th>Calidad</th>
              <th>Precios</th>
              <th>Entregas</th>
              <th>Último Pedido</th>
              <th>Ingredientes</th>
            </tr>
          </thead>
          <tbody>
            {suppliersAnalysis.map((supplier, index) => (
              <tr key={supplier.id} className="supplier-row">
                <td className="ranking-position">
                  <span className={`rank-badge rank-${index + 1}`}>
                    #{index + 1}
                  </span>
                </td>
                <td className="supplier-info">
                  <div className="supplier-name">{supplier.name}</div>
                  <div className="supplier-contact">
                    {supplier.email && <small>{supplier.email}</small>}
                    {supplier.phone && <small>{supplier.phone}</small>}
                  </div>
                </td>
                <td className="orders-count">{supplier.totalOrders}</td>
                <td className="total-spent">{formatCurrency(supplier.totalSpent)}</td>
                <td className="quality-rating">
                  <div className="rating-stars">
                    <StarRating rating={supplier.qualityRating} />
                  </div>
                  <small>{supplier.qualityRating.toFixed(1)}</small>
                </td>
                <td className="price-rating">
                  <div className="rating-stars">
                    <StarRating rating={supplier.priceRating} />
                  </div>
                  <small>{supplier.priceRating.toFixed(1)}</small>
                </td>
                <td className="delivery-info">
                  {supplier.averageDeliveryTime ? (
                    <div>
                      <div>{supplier.averageDeliveryTime.toFixed(1)} días</div>
                      <small>{supplier.onTimeDeliveries.toFixed(0)}% puntual</small>
                    </div>
                  ) : (
                    <small>Sin datos</small>
                  )}
                </td>
                <td className="last-order">
                  {supplier.lastOrder ? 
                    new Date(supplier.lastOrder).toLocaleDateString('es-ES') : 
                    'Nunca'
                  }
                </td>
                <td className="ingredients-count">{supplier.ingredientsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuppliersRanking;