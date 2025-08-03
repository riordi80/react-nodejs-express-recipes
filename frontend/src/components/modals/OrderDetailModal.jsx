// src/components/modals/OrderDetailModal.jsx
import React, { useState, useEffect } from 'react';
import { FaTruck, FaCalendarAlt, FaStickyNote, FaEuroSign, FaPhone, FaEnvelope, FaUser, FaBox, FaDownload, FaPlus, FaSave, FaTimes } from 'react-icons/fa';
import { formatCurrency, formatDecimal } from '../../utils/formatters';
import { getStatusStyle } from '../../utils/orderStatusHelpers';
import Modal from '../modal/Modal';
import ConfirmModal from './ConfirmModal';
import { usePDFGenerator } from '../../hooks/usePDFGenerator';
import api from '../../api/axios';

const OrderDetailModal = ({ 
  isOpen, 
  onClose, 
  order, 
  onStatusUpdate,
  onDelete
}) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    ingredient_id: '',
    quantity: '',
    unit_price: ''
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const { generateOrderPDF } = usePDFGenerator();

  // Inicializar datos editables cuando se abre el modal
  useEffect(() => {
    if (isOpen && order && order.items) {
      setEditableItems(order.items.map(item => ({
        ...item,
        original_quantity: item.quantity,
        original_unit_price: item.unit_price,
        edited_quantity: item.quantity,
        edited_unit_price: item.unit_price,
        edited_total_price: item.quantity * item.unit_price
      })));
      // Activar automáticamente el modo edición si el pedido está confirmado
      setIsEditing(order.status === 'ordered');
      setHasChanges(false);
      
      // Cargar ingredientes disponibles si el pedido puede ser editado
      if (order.status === 'ordered') {
        loadAvailableIngredients();
      }
    }
  }, [isOpen, order]);

  // Cargar ingredientes disponibles
  const loadAvailableIngredients = async () => {
    try {
      const response = await api.get('/ingredients');
      setAvailableIngredients(response.data);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  if (!isOpen || !order) return null;

  // Funciones para manejar la edición
  const handleItemChange = (itemId, field, value) => {
    setEditableItems(prev => prev.map(item => {
      if (item.ingredient_id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // Calcular nuevo total siempre que cambie cantidad o precio
        updatedItem.edited_total_price = updatedItem.edited_quantity * updatedItem.edited_unit_price;
        
        return updatedItem;
      }
      return item;
    }));
    setHasChanges(true);
  };

  const discardChanges = () => {
    // Restaurar valores originales
    setEditableItems(prev => prev.map(item => ({
      ...item,
      edited_quantity: item.original_quantity,
      edited_unit_price: item.original_unit_price,
      edited_total_price: item.original_quantity * item.original_unit_price
    })));
    setIsEditing(false);
    setHasChanges(false);
    setShowConfirmModal(false);
  };

  const toggleEditMode = () => {
    if (isEditing && hasChanges) {
      setShowConfirmModal(true);
    } else {
      setIsEditing(!isEditing);
      setHasChanges(false);
    }
  };

  const saveChanges = async () => {
    try {
      setUpdatingStatus(true);
      
      // Preparar datos para enviar al backend
      const updatedItems = editableItems.map(item => ({
        ingredient_id: item.ingredient_id,
        quantity: item.edited_quantity,
        unit_price: item.edited_unit_price
      }));

      console.log('Guardando cambios en items:', updatedItems);

      const response = await api.put(`/supplier-orders/${order.order_id}/items`, {
        items: updatedItems
      });

      console.log('Respuesta del servidor:', response.data);

      setIsEditing(false);
      setHasChanges(false);
      
      // Mostrar modal de éxito
      setShowSuccessModal(true);
      
      // Recargar datos del pedido para reflejar los cambios guardados
      await onStatusUpdate(order.order_id, order.status);
      
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error al guardar los cambios. Por favor, inténtalo de nuevo.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      // Si hay cambios pendientes y vamos a marcar como entregado, mostrar confirmación
      if (newStatus === 'delivered' && hasChanges) {
        setShowUnsavedChangesModal(true);
        return; // Salir para mostrar el modal
      }
      
      console.log(`Actualizando estado del pedido ${order.order_id} a ${newStatus}`);
      setUpdatingStatus(true);
      await onStatusUpdate(order.order_id, newStatus);
      setUpdatingStatus(false);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      await onDelete(order.order_id);
      onClose();
    }
  };

  // Función para confirmar cambios no guardados y marcar como entregado
  const handleConfirmUnsavedChanges = async () => {
    try {
      setShowUnsavedChangesModal(false);
      console.log('Guardando cambios antes de marcar como entregado...');
      await saveChanges();
      
      console.log(`Actualizando estado del pedido ${order.order_id} a delivered`);
      setUpdatingStatus(true);
      await onStatusUpdate(order.order_id, 'delivered');
      setUpdatingStatus(false);
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      setUpdatingStatus(false);
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
            {statusStyle.label.toUpperCase()}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
            <FaBox style={{ marginRight: '8px' }} /> 
            Ingredientes ({editableItems?.length || 0})
          </h4>
          
          {order.status === 'ordered' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {!isEditing ? (
                <button 
                  className="btn edit" 
                  onClick={toggleEditMode}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  Revisar Pedido
                </button>
              ) : (
                <>
                  <button 
                    className="btn add" 
                    onClick={saveChanges}
                    disabled={!hasChanges || updatingStatus}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <FaSave /> Guardar
                  </button>
                  <button 
                    className="btn cancel" 
                    onClick={toggleEditMode}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    <FaTimes /> Cancelar
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        {editableItems && editableItems.length > 0 ? (
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
                {editableItems.map(item => (
                  <tr key={item.ingredient_id}>
                    <td className="ingredient-name">
                      {item.ingredient_name}
                    </td>
                    <td className="quantity">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={item.edited_quantity}
                          onChange={(e) => handleItemChange(item.ingredient_id, 'edited_quantity', parseFloat(e.target.value) || 0)}
                          style={{ 
                            width: '80px', 
                            padding: '4px', 
                            border: '1px solid #ccc', 
                            borderRadius: '4px',
                            backgroundColor: hasChanges && item.edited_quantity !== item.original_quantity ? '#fff3cd' : 'white'
                          }}
                        />
                      ) : (
                        <span style={{ 
                          backgroundColor: item.edited_quantity !== item.original_quantity ? '#d4edda' : 'transparent',
                          padding: '2px 4px',
                          borderRadius: '3px'
                        }}>
                          {formatDecimal(item.edited_quantity)}
                        </span>
                      )} {item.unit}
                    </td>
                    <td className="unit-price">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.01"
                          value={item.edited_unit_price}
                          onChange={(e) => handleItemChange(item.ingredient_id, 'edited_unit_price', parseFloat(e.target.value) || 0)}
                          style={{ 
                            width: '80px', 
                            padding: '4px', 
                            border: '1px solid #ccc', 
                            borderRadius: '4px',
                            backgroundColor: hasChanges && item.edited_unit_price !== item.original_unit_price ? '#fff3cd' : 'white'
                          }}
                        />
                      ) : (
                        <span style={{ 
                          backgroundColor: item.edited_unit_price !== item.original_unit_price ? '#d4edda' : 'transparent',
                          padding: '2px 4px',
                          borderRadius: '3px'
                        }}>
                          {formatCurrency(item.edited_unit_price)}
                        </span>
                      )}
                    </td>
                    <td className="total-price">
                      <span style={{ 
                        backgroundColor: (item.edited_quantity !== item.original_quantity || item.edited_unit_price !== item.original_unit_price) ? '#d4edda' : 'transparent',
                        padding: '2px 4px',
                        borderRadius: '3px'
                      }}>
                        {formatCurrency(item.edited_quantity * item.edited_unit_price)}
                      </span>
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
                    <strong>
                      {formatCurrency(
                        editableItems.reduce((sum, item) => 
                          sum + (item.edited_quantity * item.edited_unit_price), 0
                        )
                      )}
                    </strong>
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
                <strong>Pedido Confirmado</strong>
                <small>{new Date(order.updated_at).toLocaleString('es-ES')}</small>
              </div>
            </div>
          )}
          
          {order.status === 'delivered' && (
            <div className="timeline-item completed">
              <span className="timeline-icon">✅</span>
              <div className="timeline-content">
                <strong>Pedido Recibido</strong>
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
              Confirmar Pedido
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
{hasChanges ? 'Guardar y Recibir Pedido' : 'Recibir Pedido'}
          </button>
        )}
        
        {order.status === 'ordered' && hasChanges && (
          <button 
            className="btn edit"
            onClick={saveChanges}
            disabled={updatingStatus}
          >
            <FaSave /> Solo Guardar Cambios
          </button>
        )}
      </div>

      {/* Modal de Confirmación para Descartar Cambios */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', width: '90%', maxWidth: '400px', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #eee', backgroundColor: '#f7f7f7', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Confirmar Acción</h3>
              <button 
                onClick={() => setShowConfirmModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%' }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ 
                fontSize: '16px', 
                color: '#374151', 
                marginBottom: '24px'
              }}>
                ¿Descartar los cambios realizados?
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  className="btn cancel"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn delete"
                  onClick={discardChanges}
                >
                  Descartar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', borderRadius: '8px', width: '90%', maxWidth: '400px', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #eee', backgroundColor: '#f7f7f7', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Cambios Guardados</h3>
              <button 
                onClick={() => setShowSuccessModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%' }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ 
                fontSize: '16px', 
                color: '#374151', 
                marginBottom: '24px'
              }}>
                Los cambios se han guardado con éxito.
              </p>
              <button 
                className="btn add"
                onClick={() => setShowSuccessModal(false)}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para cambios no guardados */}
      <ConfirmModal
        isOpen={showUnsavedChangesModal}
        onClose={() => setShowUnsavedChangesModal(false)}
        onConfirm={handleConfirmUnsavedChanges}
        title="Cambios sin Guardar"
        message="Hay cambios sin guardar en cantidades e importes."
        confirmText="Guardar cambios y Recibir pedido"
        cancelText="Cancelar"
        isLoading={updatingStatus}
      />
    </Modal>
  );
};

export default OrderDetailModal;