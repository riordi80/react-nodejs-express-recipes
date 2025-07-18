import React from 'react';
import Modal from '../../../components/modal/Modal';
import SupplierIngredientsTable from './SupplierIngredientsTable';

export default function SupplierEditModal({
  isOpen,
  onClose,
  editedItem,
  setEditedItem,
  editModalTab,
  setEditModalTab,
  supplierIngredients,
  sortConfig,
  onSave,
  onAddIngredients,
  onEditIngredient,
  onDeleteIngredient
}) {

  const handleSave = () => {
    onSave();
  };

  return (
    <Modal isOpen={isOpen} title="Editar proveedor" onClose={onClose}>
      <div className="supplier-edit-modal">
        {/* Pestañas */}
        <div className="modal-tabs">
          <button 
            className={`tab-button ${editModalTab === 'info' ? 'active' : ''}`}
            onClick={() => setEditModalTab('info')}
          >
            Información General
          </button>
          <button 
            className={`tab-button ${editModalTab === 'ingredients' ? 'active' : ''}`}
            onClick={() => setEditModalTab('ingredients')}
          >
            Ingredientes Suministrados
          </button>
        </div>

        {/* Contenido de las pestañas */}
        {editModalTab === 'info' ? (
          <form className="modal-body-form supplier-info-form">
            <div className="form-fields-main">
              <label>Nombre *</label>
              <input 
                type="text" 
                className="input-field" 
                value={editedItem?.name || ''} 
                onChange={e => setEditedItem({ ...editedItem, name: e.target.value })} 
                required 
              />
              <label>Teléfono</label>
              <input 
                type="text" 
                className="input-field" 
                value={editedItem?.phone || ''} 
                onChange={e => setEditedItem({ ...editedItem, phone: e.target.value })} 
              />
              <label>Email</label>
              <input 
                type="email" 
                className="input-field" 
                value={editedItem?.email || ''} 
                onChange={e => setEditedItem({ ...editedItem, email: e.target.value })} 
              />
              <label>Sitio web</label>
              <input 
                type="url" 
                className="input-field" 
                value={editedItem?.website_url || ''} 
                onChange={e => setEditedItem({ ...editedItem, website_url: e.target.value })} 
                placeholder="https://ejemplo.com"
              />
              <label>Dirección</label>
              <textarea 
                className="input-field" 
                rows="3" 
                value={editedItem?.address || ''} 
                onChange={e => setEditedItem({ ...editedItem, address: e.target.value })} 
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn cancel" onClick={onClose}>
                Cancelar
              </button>
              <button type="button" className="btn edit" onClick={handleSave}>
                Guardar cambios
              </button>
            </div>
          </form>
        ) : (
          <div className="supplier-ingredients-tab">
            <p>Gestión de ingredientes para <strong>{editedItem?.name}</strong></p>
            
            <SupplierIngredientsTable
              supplierIngredients={supplierIngredients}
              sortConfig={sortConfig}
              onEditIngredient={onEditIngredient}
              onDeleteIngredient={onDeleteIngredient}
            />
            
            <div className="modal-actions">
              <button type="button" className="btn cancel" onClick={onClose}>
                Cerrar
              </button>
              <button type="button" className="btn add" onClick={onAddIngredients}>
                Añadir ingredientes
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}