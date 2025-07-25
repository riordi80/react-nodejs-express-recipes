import React from 'react';
import Modal from '../../../components/modal/Modal';
import { parseEuropeanNumber, formatDecimal } from '../../../utils/formatters';

export default function EditSupplierIngredientModal({
  isOpen,
  onClose,
  editingSupplierIngredient,
  setEditingSupplierIngredient,
  onSave
}) {
  
  const handleSave = () => {
    if (!editingSupplierIngredient?.price || 
        !editingSupplierIngredient?.package_size || 
        !editingSupplierIngredient?.package_unit || 
        !editingSupplierIngredient?.minimum_order_quantity) return;
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
                type="text"
                className="input-field-inline"
                value={editingSupplierIngredient?.price ? formatDecimal(editingSupplierIngredient.price) : ''}
                onChange={(e) => setEditingSupplierIngredient({
                  ...editingSupplierIngredient,
                  price: parseEuropeanNumber(e.target.value)
                })}
                placeholder="0,00"
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
            <div className="form-field-inline">
              <label>Tamaño del paquete *</label>
              <input
                type="text"
                className="input-field-inline"
                value={editingSupplierIngredient?.package_size ? formatDecimal(editingSupplierIngredient.package_size) : '1,0'}
                onChange={(e) => setEditingSupplierIngredient({
                  ...editingSupplierIngredient,
                  package_size: parseEuropeanNumber(e.target.value)
                })}
                placeholder="1,0"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-field-inline">
              <label>Unidad del paquete *</label>
              <select
                className="input-field-inline"
                value={editingSupplierIngredient?.package_unit || 'unidad'}
                onChange={(e) => setEditingSupplierIngredient({
                  ...editingSupplierIngredient,
                  package_unit: e.target.value
                })}
                required
              >
                <option value="unidad">Unidad</option>
                <option value="caja">Caja</option>
                <option value="saco">Saco</option>
                <option value="botella">Botella</option>
                <option value="lata">Lata</option>
                <option value="paquete">Paquete</option>
                <option value="bolsa">Bolsa</option>
                <option value="bote">Bote</option>
                <option value="envase">Envase</option>
                <option value="kg">Kilogramo</option>
                <option value="litro">Litro</option>
              </select>
            </div>
            <div className="form-field-inline">
              <label>Cantidad mínima de pedido *</label>
              <input
                type="text"
                className="input-field-inline"
                value={editingSupplierIngredient?.minimum_order_quantity ? formatDecimal(editingSupplierIngredient.minimum_order_quantity) : '1,0'}
                onChange={(e) => setEditingSupplierIngredient({
                  ...editingSupplierIngredient,
                  minimum_order_quantity: parseEuropeanNumber(e.target.value)
                })}
                placeholder="1,0"
                required
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
            disabled={!editingSupplierIngredient?.price || 
                     !editingSupplierIngredient?.package_size || 
                     !editingSupplierIngredient?.package_unit || 
                     !editingSupplierIngredient?.minimum_order_quantity}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </Modal>
  );
}