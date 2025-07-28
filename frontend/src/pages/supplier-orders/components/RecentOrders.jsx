// src/pages/supplier-orders/components/RecentOrders.jsx
import React from 'react';
import { FaCalendarAlt, FaTruck, FaEye } from 'react-icons/fa';
import { formatCurrency } from '../../../utils/formatters';

const getStatusIcon = (status) => {
  const statusMap = {
    pending: '📝',
    ordered: '📤', 
    delivered: '✅',
    cancelled: '❌'
  };
  return statusMap[status] || '❓';
};

const RecentOrders = ({ historyMetrics, onOrderClick }) => {
  return (
    <div className="recent-orders">
      <h3>Pedidos Recientes</h3>
      {historyMetrics.recentOrders && historyMetrics.recentOrders.length > 0 ? (
        <div className="recent-orders-grid">
          {historyMetrics.recentOrders.map(order => (
            <div key={order.order_id} className="recent-order-card">
              <div className="order-card-header">
                <div className="order-badge">
                  <span className="order-number">#{order.order_id}</span>
                  <div className={`status-indicator ${order.status}`}>
                    {getStatusIcon(order.status)}
                  </div>
                </div>
                <div className="order-date">
                  <FaCalendarAlt className="date-icon" />
                  {new Date(order.order_date).toLocaleDateString('es-ES')}
                </div>
              </div>
              
              <div className="order-card-body">
                <div className="supplier-info">
                  <FaTruck className="supplier-icon" />
                  <span className="supplier-name">{order.supplier_name}</span>
                </div>
                
                <div className="order-metrics">
                  <div className="metric-item">
                    <div className="metric-value">{formatCurrency(order.total_amount)}</div>
                    <div className="metric-label">Total</div>
                  </div>
                  <div className="metric-divider"></div>
                  <div className="metric-item">
                    <div className="metric-value">{order.items_count}</div>
                    <div className="metric-label">Items</div>
                  </div>
                </div>
              </div>
              
              <div className="order-card-footer">
                <button 
                  className="view-details-btn"
                  onClick={() => onOrderClick(order)}
                >
                  <FaEye />
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-recent">
          <p>No hay pedidos recientes</p>
        </div>
      )}
    </div>
  );
};

export default RecentOrders;