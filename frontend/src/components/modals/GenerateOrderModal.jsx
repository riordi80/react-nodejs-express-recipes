// src/components/modals/GenerateOrderModal.jsx
import React, { useState } from 'react';
import { FaTruck, FaCalendarAlt, FaStickyNote, FaEuroSign } from 'react-icons/fa';
import { formatCurrency } from '../../utils/formatters';
import Modal from '../modal/Modal';

const GenerateOrderModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  orderData, 
  isGenerating = false 
}) => {
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(deliveryDate, notes);
  };

  const handleClose = () => {
    if (!isGenerating) {
      setDeliveryDate('');
      setNotes('');
      onClose();
    }
  };

  if (!isOpen || !orderData) return null;

  // Calcular fecha mínima (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaTruck />
          Confirmar Generación de Pedidos
        </span>
      }
      maxWidth="600px"
    >
      {/* Resumen de pedidos a generar */}
      <div className="order-summary">
        <h4>Resumen de Pedidos a Generar</h4>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-label">Proveedores</span>
            <span className="stat-value">{orderData.suppliers.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Costo Total</span>
            <span className="stat-value">{formatCurrency(orderData.totalCost)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Origen</span>
            <span className="stat-value">
              {orderData.generatedFrom === 'manual' ? 'Pedido Manual' :
               orderData.generatedFrom === 'events' ? 'Eventos Específicos' :
               'Lista Automática'}
            </span>
          </div>
        </div>
      </div>

      {/* Lista de proveedores y totales */}
      <div className="suppliers-preview">
        <h4>Pedidos por Proveedor:</h4>
        <div className="suppliers-list-preview">
          {orderData.suppliers.map(supplier => (
            <div key={supplier.supplierId} className="supplier-preview-item">
              <div className="supplier-info">
                <span className="supplier-name">{supplier.supplierName}</span>
                <span className="supplier-items-count">
                  {supplier.ingredients.length} ingredientes
                </span>
              </div>
              <span className="supplier-total">
                {formatCurrency(supplier.supplierTotal)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario de configuración */}
      <form onSubmit={handleSubmit} className="order-config-form">
        <div className="form-group">
          <label htmlFor="deliveryDate" className="form-label">
            <FaCalendarAlt />
            Fecha de Entrega Deseada (opcional)
          </label>
          <input
            type="date"
            id="deliveryDate"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            min={minDate}
            className="form-input"
            disabled={isGenerating}
          />
          <small className="form-help">
            Si no se especifica, el proveedor determinará la fecha de entrega
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="notes" className="form-label">
            <FaStickyNote />
            Notas Adicionales (opcional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="form-textarea"
            rows="3"
            placeholder="Ej: Pedido urgente, instrucciones especiales de entrega..."
            disabled={isGenerating}
          />
        </div>
      </form>

      {/* Información importante */}
      <div className="order-info-note">
        <div className="info-header">
          <strong>📋 Información importante:</strong>
        </div>
        <ul className="info-list">
          <li>Se creará un pedido separado para cada proveedor</li>
          <li>Todos los pedidos comenzarán con estado "Pendiente"</li>
          <li>Podrás gestionar cada pedido individualmente en "Pedidos Activos"</li>
          <li>Los proveedores sin asignación aparecerán como "Sin Proveedor Asignado"</li>
        </ul>
      </div>

      {/* Botones de acción */}
      <div className="modal-actions">
        <button 
          type="button" 
          className="btn cancel" 
          onClick={handleClose}
          disabled={isGenerating}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="btn add"
          onClick={handleSubmit}
          disabled={isGenerating}
        >
          <FaEuroSign style={{ marginRight: '6px' }} />
          {isGenerating ? 'Generando...' : `Generar ${orderData.suppliers.length} Pedidos`}
        </button>
      </div>
    </Modal>
  );
};

export default GenerateOrderModal;