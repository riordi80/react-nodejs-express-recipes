// src/components/modals/ConfirmModal.jsx
import React from 'react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirmar Acción',
  message = '¿Estás seguro de que quieres continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      zIndex: 1000 
    }}>
      <div style={{ 
        backgroundColor: '#fff', 
        borderRadius: '8px', 
        width: '90%', 
        maxWidth: '500px', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '12px 16px', 
          borderBottom: '1px solid #eee', 
          backgroundColor: '#f7f7f7', 
          borderTopLeftRadius: '8px', 
          borderTopRightRadius: '8px' 
        }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>{title}</h3>
          <button 
            onClick={onClose}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              fontSize: '18px', 
              cursor: 'pointer', 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%' 
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '20px 30px', textAlign: 'center' }}>
          <p style={{ 
            fontSize: '16px', 
            color: '#374151', 
            marginBottom: '24px'
          }}>
            {message}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              className="btn cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button 
              className="btn add"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Procesando...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;