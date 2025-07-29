// src/pages/supplier-orders/components/OrderCard.jsx
import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/formatters';
import { getStatusStyle } from '../../../utils/orderStatusHelpers';
import ConfirmModal from '../../../components/modals/ConfirmModal';

const OrderCard = ({ order, onViewOrder, onUpdateStatus, onDeleteOrder }) => {
  const statusStyle = getStatusStyle(order.status);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleCardClick = () => {
    onViewOrder(order.order_id);
  };

  const handleConfirmOrder = (e) => {
    e.stopPropagation();
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    await onUpdateStatus(order.order_id, 'ordered');
    setShowConfirmModal(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDeleteOrder(order);
  };

  return (
    <>
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
            {statusStyle.label.toUpperCase()}
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
              onClick={handleConfirmOrder}
            >
              Confirmar
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
            key={`view-${order.order_id}`}
            className="btn-small delivered"
            onClick={handleCardClick}
          >
Revisar cantidades e importes
          </button>
        )}
      </div>
      </div>

      {/* Modal de Confirmación - Fuera de la card para correcto posicionamiento */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        title="Confirmar Pedido"
        message={`¿Confirmar el pedido #${order.order_id} al proveedor ${order.supplier_name}?`}
        confirmText="Confirmar"
        cancelText="Cancelar"
      />
    </>
  );
};

export default OrderCard;