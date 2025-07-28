// src/pages/supplier-orders/components/OrderCard.jsx
import React from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { getStatusStyle } from '../../../utils/orderStatusHelpers';

const OrderCard = ({ order, onViewOrder, onUpdateStatus, onDeleteOrder }) => {
  const statusStyle = getStatusStyle(order.status);

  const handleCardClick = () => {
    onViewOrder(order.order_id);
  };

  const handleStatusUpdate = (e, newStatus) => {
    e.stopPropagation();
    onUpdateStatus(order.order_id, newStatus);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDeleteOrder(order.order_id);
  };

  return (
    <div 
      className="order-card"
      onClick={handleCardClick}
    >
      <div className="order-header">
        <div className="order-supplier">
          <h3>{order.supplier_name}</h3>
          <span className="order-id">#{order.order_id}</span>
        </div>
        <span className={`order-status ${statusStyle.className}`}>
          <span className="status-icon">{statusStyle.icon}</span>
          {statusStyle.label}
        </span>
      </div>

      <div className="order-details">
        <div className="order-meta">
          <span className="order-date">
            📅 {new Date(order.order_date).toLocaleDateString('es-ES')}
          </span>
          {order.delivery_date && (
            <span className="delivery-date">
              🚚 {new Date(order.delivery_date).toLocaleDateString('es-ES')}
            </span>
          )}
        </div>

        <div className="order-summary">
          <div className="order-items">
            📦 {order.items_count} ingredientes
          </div>
          <div className="order-total">
            💰 {formatCurrency(order.total_amount)}
          </div>
        </div>

        {order.notes && (
          <div className="order-notes">
            📝 {order.notes.substring(0, 50)}
            {order.notes.length > 50 && '...'}
          </div>
        )}

        <div className="order-creator">
          👤 {order.first_name} {order.last_name}
        </div>
      </div>

      <div className="order-actions">
        {order.status === 'pending' && (
          <React.Fragment key={`actions-pending-${order.order_id}`}>
            <button 
              key={`ordered-${order.order_id}`}
              className="btn-small ordered"
              onClick={(e) => handleStatusUpdate(e, 'ordered')}
            >
              Marcar Enviado
            </button>
            <button 
              key={`delete-${order.order_id}`}
              className="btn-small delete"
              onClick={handleDelete}
            >
              Eliminar
            </button>
          </React.Fragment>
        )}
        {order.status === 'ordered' && (
          <button 
            key={`delivered-${order.order_id}`}
            className="btn-small delivered"
            onClick={(e) => handleStatusUpdate(e, 'delivered')}
          >
            Marcar Entregado
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderCard;