import React from 'react';
import Modal from '../../../components/modal/Modal';

export default function EditSupplierIngredientModal({
  isOpen,
  onClose,
  editingSupplierIngredient,
  setEditingSupplierIngredient,
  onSave
}) {
  
  const handleSave = () => {
    if (!editingSupplierIngredient?.price) return;
    onSave();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      title="Editar relación proveedor-ingrediente" 
      onClose={onClose}
    >
      <div className="edit-supplier-ingredient-modal">
        <p>Editando ingrediente: <strong>{editingSupplierIngredient?.name}</strong></p>
        
        <div className="edit-form-inline">
          <div className="form-row">
            <div className="form-field-inline">
              <label>Precio (€) *</label>
              <input
                type="number"
                step="0.01"
                className="input-field-inline"
                value={editingSupplierIngredient?.price || ''}
                onChange={(e) => setEditingSupplierIngredient({
                  ...editingSupplierIngredient,
                  price: e.target.value
                })}
                required
              />
            </div>
            <div className="form-field-inline">
              <label>Tiempo entrega (días)</label>
              <input
                type="number"
                className="input-field-inline"
                value={editingSupplierIngredient?.delivery_time || ''}
                onChange={(e) => setEditingSupplierIngredient({
                  ...editingSupplierIngredient,
                  delivery_time: e.target.value
                })}
              />
            </div>
            <div className="form-field-inline checkbox-field">
              <label>
                <input
                  type="checkbox"
                  checked={editingSupplierIngredient?.is_preferred_supplier || false}
                  onChange={(e) => setEditingSupplierIngredient({
                    ...editingSupplierIngredient,
                    is_preferred_supplier: e.target.checked
                  })}
                />
                Proveedor preferido
              </label>
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          <button type="button" className="btn cancel" onClick={onClose}>
            Cancelar
          </button>
          <button 
            type="button"
            className="btn edit"
            onClick={handleSave}
            disabled={!editingSupplierIngredient?.price}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </Modal>
  );
}