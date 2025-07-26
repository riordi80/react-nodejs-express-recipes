// src/components/modals/SupplierWarningModal.jsx
import React from 'react';
import { FaExclamationTriangle, FaUser } from 'react-icons/fa';
import Modal from '../modal/Modal';

const SupplierWarningModal = ({ 
  isOpen, 
  onClose, 
  ingredientsWithoutProvider,
  onIngredientClick
}) => {
  if (!isOpen || !ingredientsWithoutProvider || ingredientsWithoutProvider.length === 0) return null;

  const handleIngredientClick = (ingredientId) => {
    onIngredientClick(ingredientId);
    onClose(); // Cerrar modal después de hacer clic
  };

  const totalIngredients = ingredientsWithoutProvider.reduce(
    (total, supplier) => total + supplier.ingredients.length, 0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="No se pueden generar pedidos automáticos"
    >
      {/* Mensaje principal */}
      <div className="warning-message" style={{
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <p style={{
          margin: '0 0 8px 0',
          fontWeight: '600',
          color: '#92400e'
        }}>
          <FaExclamationTriangle style={{ marginRight: '8px' }} />
          Hay {totalIngredients} ingrediente{totalIngredients !== 1 ? 's' : ''} sin proveedor asignado
        </p>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#92400e'
        }}>
          Para generar pedidos automáticos, todos los ingredientes deben tener un proveedor asignado.
        </p>
      </div>

      {/* Lista de ingredientes sin proveedor */}
      <div className="ingredients-without-provider">
        <h4 style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#1e293b'
        }}>
          Ingredientes que requieren atención:
        </h4>
        
        <div className="ingredients-list" style={{
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {ingredientsWithoutProvider.map(supplier => 
            supplier.ingredients.map(ingredient => (
              <div 
                key={ingredient.ingredientId}
                className="ingredient-item"
                onClick={() => handleIngredientClick(ingredient.ingredientId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: 'white'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f8fafc';
                  e.target.style.borderColor = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = '#e2e8f0';
                }}
              >
                <div className="ingredient-info">
                  <div style={{
                    fontWeight: '500',
                    color: '#1e293b',
                    marginBottom: '4px'
                  }}>
                    {ingredient.name}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#64748b'
                  }}>
                    Cantidad: {ingredient.toBuy} {ingredient.unit}
                  </div>
                </div>
                <div className="ingredient-action" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#3b82f6',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Asignar proveedor →
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Información adicional */}
      <div className="info-section" style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <FaUser />
          <strong>¿Cómo asignar proveedores?</strong>
        </div>
        <ul style={{
          margin: 0,
          paddingLeft: '20px',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          <li>Haz clic en cualquier ingrediente de la lista superior</li>
          <li>En el modal que se abre, ve a la pestaña "Proveedores"</li>
          <li>Asigna un proveedor y configura precios</li>
          <li>Vuelve a generar la lista de compras</li>
        </ul>
      </div>

      {/* Botones de acción */}
      <div className="modal-actions">
        <button 
          type="button" 
          className="btn cancel" 
          onClick={onClose}
        >
          Entendido
        </button>
      </div>
    </Modal>
  );
};

export default SupplierWarningModal;