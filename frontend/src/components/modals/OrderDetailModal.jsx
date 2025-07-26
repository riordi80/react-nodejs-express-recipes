// src/components/modals/OrderDetailModal.jsx
import React, { useState } from 'react';
import { FaTruck, FaCalendarAlt, FaStickyNote, FaEuroSign, FaPhone, FaEnvelope, FaUser, FaBox, FaDownload } from 'react-icons/fa';
import { formatCurrency, formatDecimal } from '../../utils/formatters';
import Modal from '../modal/Modal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { BRAND_CONFIG, getRGBColor } from '../../config/branding';

const OrderDetailModal = ({ 
  isOpen, 
  onClose, 
  order, 
  onStatusUpdate,
  onDelete
}) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  const generatePDF = () => {
    const doc = new jsPDF();
    const statusStyle = getStatusStyle(order.status);
    
    // Configurar fuente
    doc.setFont('helvetica');
    
    // Título del documento
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('PEDIDO DE COMPRA', 20, 25);
    
    // Número de pedido y estado
    doc.setFontSize(12);
    doc.text(`Pedido #${order.order_id}`, 20, 35);
    doc.text(`Estado: ${statusStyle.label}`, 20, 42);
    
    // Línea separadora
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);
    
    // Información del proveedor
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text('PROVEEDOR', 20, 60);
    
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Nombre: ${order.supplier_name}`, 20, 70);
    if (order.supplier_phone) {
      doc.text(`Teléfono: ${order.supplier_phone}`, 20, 77);
    }
    if (order.supplier_email) {
      doc.text(`Email: ${order.supplier_email}`, 20, 84);
    }
    
    // Información del pedido
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text('INFORMACIÓN DEL PEDIDO', 120, 60);
    
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Fecha de pedido: ${new Date(order.order_date).toLocaleDateString('es-ES')}`, 120, 70);
    if (order.delivery_date) {
      doc.text(`Fecha de entrega: ${new Date(order.delivery_date).toLocaleDateString('es-ES')}`, 120, 77);
    }
    doc.text(`Creado por: ${order.first_name} ${order.last_name}`, 120, 84);
    
    // Notas (si existen)
    let yPosition = 95;
    if (order.notes) {
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text('NOTAS', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      const splitNotes = doc.splitTextToSize(order.notes, 170);
      doc.text(splitNotes, 20, yPosition);
      yPosition += splitNotes.length * 5 + 10;
    }
    
    // Tabla de ingredientes
    if (order.items && order.items.length > 0) {
      const tableData = order.items.map(item => [
        item.ingredient_name,
        `${formatDecimal(item.quantity)} ${item.unit}`,
        formatCurrency(item.unit_price),
        formatCurrency(item.total_price),
        `${formatDecimal(item.current_stock)} ${item.unit}`
      ]);
      
      // Verificar si autoTable está disponible
      if (typeof doc.autoTable === 'function') {
        doc.autoTable({
          startY: yPosition,
          head: [['Ingrediente', 'Cantidad', 'Precio Unit.', 'Total', 'Stock Actual']],
          body: tableData,
          foot: [['', '', 'TOTAL PEDIDO:', formatCurrency(order.total_amount), '']],
          theme: 'grid',
          styles: {
            fontSize: 10,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [52, 73, 94],
            textColor: 255,
            fontStyle: 'bold'
          },
          footStyles: {
            fillColor: [236, 240, 241],
            textColor: 40,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 25, halign: 'right' },
            3: { cellWidth: 25, halign: 'right' },
            4: { cellWidth: 25, halign: 'center' }
          }
        });
      } else {
        // Fallback: tabla manual si autoTable no está disponible
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text('INGREDIENTES', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        
        // Headers
        doc.text('Ingrediente', 20, yPosition);
        doc.text('Cantidad', 90, yPosition);
        doc.text('Precio Unit.', 120, yPosition);
        doc.text('Total', 150, yPosition);
        doc.text('Stock', 175, yPosition);
        yPosition += 5;
        
        // Línea separadora
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 5;
        
        // Datos
        order.items.forEach(item => {
          doc.text(item.ingredient_name.substring(0, 25), 20, yPosition);
          doc.text(`${formatDecimal(item.quantity)} ${item.unit}`, 90, yPosition);
          doc.text(formatCurrency(item.unit_price), 120, yPosition);
          doc.text(formatCurrency(item.total_price), 150, yPosition);
          doc.text(`${formatDecimal(item.current_stock)} ${item.unit}`, 175, yPosition);
          yPosition += 5;
        });
        
        // Total
        yPosition += 5;
        doc.line(20, yPosition, 190, yPosition);
        yPosition += 5;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL PEDIDO:', 120, yPosition);
        doc.text(formatCurrency(order.total_amount), 170, yPosition, { align: 'right' });
      }
    }
    
    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.height;
      
      // Información de generación (izquierda)
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-ES')} - Página ${i} de ${pageCount}`,
        20,
        pageHeight - 10
      );
      
      // Logo RecipesAPI (centro) - usando configuración centralizada
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      
      // Calcular posición para centrar el texto completo
      const logoWidth = doc.getTextWidth(BRAND_CONFIG.name);
      const centerX = 105;
      const startX = centerX - (logoWidth / 2);
      
      // "Recipes" usando color configurado
      const recipesRGB = getRGBColor('recipes');
      doc.setTextColor(recipesRGB[0], recipesRGB[1], recipesRGB[2]);
      doc.text(BRAND_CONFIG.logoText.part1, startX, pageHeight - 6);
      
      // "API" usando color configurado
      const recipesWidth = doc.getTextWidth(BRAND_CONFIG.logoText.part1);
      const apiRGB = getRGBColor('api');
      doc.setTextColor(apiRGB[0], apiRGB[1], apiRGB[2]);
      doc.text(BRAND_CONFIG.logoText.part2, startX + recipesWidth, pageHeight - 6);
    }
    
    // Descargar el PDF
    doc.save(`Pedido_${order.order_id}_${order.supplier_name.replace(/\s+/g, '_')}.pdf`);
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
            onClick={generatePDF}
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