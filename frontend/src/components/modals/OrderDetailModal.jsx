// src/components/modals/OrderDetailModal.jsx
import React, { useState } from 'react';
import { FaTruck, FaCalendarAlt, FaStickyNote, FaEuroSign, FaPhone, FaEnvelope, FaUser, FaBox, FaDownload } from 'react-icons/fa';
import { formatCurrency, formatDecimal } from '../../utils/formatters';
import Modal from '../modal/Modal';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';

const OrderDetailModal = ({ 
  isOpen, 
  onClose, 
  order, 
  onStatusUpdate,
  onDelete
}) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { generateOrderPDF } = usePDFGenerator();

  if (!isOpen || !order) return null;

  // Función para obtener estilo de estado
  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending':
        return { className: 'status-pending', label: 'Pendiente', icon: '📝' };
      case 'ordered':
        return { className: 'status-ordered', label: 'Enviado', icon: '📤' };
      case 'delivered':
        return { className: 'status-delivered', label: 'Entregado', icon: '✅' };
      case 'cancelled':
        return { className: 'status-cancelled', label: 'Cancelado', icon: '❌' };
      default:
        return { className: 'status-unknown', label: status, icon: '❓' };
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    await onStatusUpdate(order.order_id, newStatus);
    setUpdatingStatus(false);
  };

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      await onDelete(order.order_id);
      onClose();
    }
  };

  const handleDownloadPDF = () => {
    generateOrderPDF(order);
  };

  const statusStyle = getStatusStyle(order.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      fullscreen={true}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaTruck />
            Pedido #{order.order_id}
          </span>
          <span className={`order-status-badge ${statusStyle.className}`}>
            <span className="status-icon">{statusStyle.icon}</span>
            {statusStyle.label}
          </span>
        </div>
      }
      maxWidth="800px"
    >
      {/* Información del Proveedor */}
      <div className="order-supplier-info">
        <div className="supplier-header">
          <h4 style={{ fontSize: '16px', fontWeight: '600' }}>
            <FaTruck style={{ marginRight: '8px' }} /> 
            {order.supplier_name}
          </h4>
          <button 
            type="button" 
            className="pdf-download-btn" 
            onClick={handleDownloadPDF}
            title="Descargar PDF"
          >
            <FaDownload />
            Descargar PDF
          </button>
        </div>
        <div className="supplier-contact">
          {order.supplier_phone && (
            <span className="contact-item">
              <FaPhone /> {order.supplier_phone}
            </span>
          )}
          {order.supplier_email && (
            <span className="contact-item">
              <FaEnvelope /> {order.supplier_email}
            </span>
          )}
        </div>
      </div>

      {/* Información del Pedido */}
      <div className="order-info-grid">
        <div className="info-card">
          <div className="info-label">
            <FaCalendarAlt /> Fecha de Pedido
          </div>
          <div className="info-value">
            {new Date(order.order_date).toLocaleDateString('es-ES')}
          </div>
        </div>

        {order.delivery_date && (
          <div className="info-card">
            <div className="info-label">
              <FaTruck /> Fecha de Entrega
            </div>
            <div className="info-value">
              {new Date(order.delivery_date).toLocaleDateString('es-ES')}
            </div>
          </div>
        )}

        <div className="info-card">
          <div className="info-label">
            <FaEuroSign /> Total del Pedido
          </div>
          <div className="info-value total-amount">
            {formatCurrency(order.total_amount)}
          </div>
        </div>

        <div className="info-card">
          <div className="info-label">
            <FaUser /> Creado por
          </div>
          <div className="info-value">
            {order.first_name} {order.last_name}
          </div>
        </div>
      </div>

      {/* Notas */}
      {order.notes && (
        <div className="order-notes-section">
          <h4 style={{ fontSize: '16px', fontWeight: '600' }}>
            <FaStickyNote style={{ marginRight: '8px' }} /> Notas
          </h4>
          <div className="notes-content">
            {order.notes}
          </div>
        </div>
      )}

      {/* Items del Pedido */}
      <div className="order-items-section">
        <h4 style={{ fontSize: '16px', fontWeight: '600' }}>
          <FaBox style={{ marginRight: '8px' }} /> 
          Ingredientes ({order.items?.length || 0})
        </h4>
        
        {order.items && order.items.length > 0 ? (
          <div className="items-table">
            <table>
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Cantidad</th>
                  <th>Precio Unitario</th>
                  <th>Total</th>
                  <th>Stock Actual</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item.ingredient_id}>
                    <td className="ingredient-name">
                      {item.ingredient_name}
                    </td>
                    <td className="quantity">
                      {formatDecimal(item.quantity)} {item.unit}
                    </td>
                    <td className="unit-price">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="total-price">
                      {formatCurrency(item.total_price)}
                    </td>
                    <td className="current-stock">
                      {formatDecimal(item.current_stock)} {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td colSpan="3"><strong>Total del Pedido:</strong></td>
                  <td className="total-amount">
                    <strong>{formatCurrency(order.total_amount)}</strong>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="empty-items">
            <p>No hay items en este pedido</p>
          </div>
        )}
      </div>

      {/* Historial de Fechas */}
      <div className="order-timeline">
        <h4 style={{ fontSize: '16px', fontWeight: '600' }}>Historial</h4>
        <div className="timeline-items">
          <div className="timeline-item completed">
            <span className="timeline-icon">📝</span>
            <div className="timeline-content">
              <strong>Pedido Creado</strong>
              <small>{new Date(order.created_at).toLocaleString('es-ES')}</small>
            </div>
          </div>
          
          {order.status !== 'pending' && (
            <div className="timeline-item completed">
              <span className="timeline-icon">📤</span>
              <div className="timeline-content">
                <strong>Pedido Enviado</strong>
                <small>{new Date(order.updated_at).toLocaleString('es-ES')}</small>
              </div>
            </div>
          )}
          
          {order.status === 'delivered' && (
            <div className="timeline-item completed">
              <span className="timeline-icon">✅</span>
              <div className="timeline-content">
                <strong>Pedido Entregado</strong>
                <small>{new Date(order.updated_at).toLocaleString('es-ES')}</small>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="modal-actions">
        <button 
          type="button" 
          className="btn cancel" 
          onClick={onClose}
        >
          Cerrar
        </button>
        
        
        {order.status === 'pending' && (
          <React.Fragment key={`pending-actions-${order.order_id}`}>
            <button 
              key={`mark-ordered-${order.order_id}`}
              className="btn edit"
              onClick={() => handleStatusUpdate('ordered')}
              disabled={updatingStatus}
            >
              Confirmar envío
            </button>
            <button 
              key={`delete-order-${order.order_id}`}
              className="btn delete"
              onClick={handleDelete}
              disabled={updatingStatus}
            >
              Eliminar Pedido
            </button>
          </React.Fragment>
        )}
        
        {order.status === 'ordered' && (
          <button 
            className="btn add"
            onClick={() => handleStatusUpdate('delivered')}
            disabled={updatingStatus}
          >
            Marcar entregado
          </button>
        )}
      </div>
    </Modal>
  );
};

export default OrderDetailModal;