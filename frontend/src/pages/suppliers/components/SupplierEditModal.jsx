import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaBoxOpen } from 'react-icons/fa';
import Modal from '../../../components/modal/Modal';
import TabsModal from '../../../components/tabs-modal/TabsModal';
import SupplierIngredientsTable from './SupplierIngredientsTable';
import { FormField, FormInput, FormTextarea } from '../../../components/form/FormField';

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
  onDeleteIngredient,
  onTogglePreferred
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Definir las pestañas con iconos
  const tabs = [
    { id: 'info', label: 'Información General', icon: FaUser },
    { id: 'ingredients', label: 'Ingredientes Suministrados', icon: FaBoxOpen }
  ];

  // Efecto para cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTabChange = (tabId) => {
    setEditModalTab(tabId);
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handlers simples que llaman directamente a las funciones padre
  const handleSaveClick = async () => {
    await onSave();
    // Usar el mismo patrón de cierre que el botón Cancelar
    handleCloseClick();
  };

  const handleCloseClick = () => {
    // Buscar el botón X del modal y hacer clic en él
    const closeButton = document.querySelector('.modal-close');
    if (closeButton) {
      closeButton.click();
    } else {
      onClose();
    }
  };

  const handleAddIngredientsClick = () => {
    onAddIngredients();
  };

  return (
    <Modal isOpen={isOpen} title="Editar proveedor" onClose={onClose} fullscreenMobile={true}>
      <div className="supplier-edit-modal">
        <TabsModal
          tabs={tabs}
          activeTab={editModalTab}
          onTabChange={handleTabChange}
          mobileDropdownRef={dropdownRef}
        >
        {editModalTab === 'info' ? (
          <form className="modal-body-form supplier-info-form">
            <div className="form-fields-two-columns">
              <div className="column-left">
                <FormField label="Nombre *">
                  <FormInput 
                    type="text" 
                    value={editedItem?.name || ''} 
                    onChange={e => setEditedItem({ ...editedItem, name: e.target.value })} 
                    required 
                  />
                </FormField>
                
                <FormField label="Teléfono">
                  <FormInput 
                    type="text" 
                    value={editedItem?.phone || ''} 
                    onChange={e => setEditedItem({ ...editedItem, phone: e.target.value })} 
                  />
                </FormField>
                
                <FormField label="Email">
                  <FormInput 
                    type="email" 
                    value={editedItem?.email || ''} 
                    onChange={e => setEditedItem({ ...editedItem, email: e.target.value })} 
                  />
                </FormField>
              </div>

              <div className="column-right">
                <FormField label="Sitio web">
                  <FormInput 
                    type="url" 
                    value={editedItem?.website_url || ''} 
                    onChange={e => setEditedItem({ ...editedItem, website_url: e.target.value })} 
                    placeholder="https://ejemplo.com"
                  />
                </FormField>
                
                <FormField label="Dirección">
                  <FormTextarea 
                    rows="4" 
                    value={editedItem?.address || ''} 
                    onChange={e => setEditedItem({ ...editedItem, address: e.target.value })} 
                  />
                </FormField>
              </div>
            </div>
            
            <div className="modal-actions">
              <button type="button" className="btn cancel" onClick={handleCloseClick}>
                Cancelar
              </button>
              <button type="button" className="btn edit" onClick={handleSaveClick}>
                Guardar
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
              onTogglePreferred={onTogglePreferred}
            />
            
            <div className="modal-actions">
              <button type="button" className="btn cancel" onClick={handleCloseClick}>
                Cerrar
              </button>
              <button type="button" className="btn add" onClick={handleAddIngredientsClick}>
                Añadir ingredientes
              </button>
            </div>
          </div>
        )}
        </TabsModal>
      </div>
    </Modal>
  );
}