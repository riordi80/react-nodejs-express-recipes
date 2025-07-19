import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaBoxOpen, FaChevronDown } from 'react-icons/fa';
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


  return (
    <Modal isOpen={isOpen} title="Editar proveedor" onClose={onClose} fullscreenMobile={true}>
      <div className="supplier-edit-modal">
        {/* Pestañas para desktop */}
        <div className="modal-tabs">
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button 
                key={tab.id}
                className={`tab-button ${editModalTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <IconComponent className="tab-icon" />
                <span className="tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Dropdown para móvil */}
        <div className="modal-mobile-dropdown" ref={dropdownRef}>
          <button className="mobile-dropdown-trigger" onClick={toggleDropdown}>
            {(() => {
              const activeTabData = tabs.find(tab => tab.id === editModalTab);
              const IconComponent = activeTabData?.icon;
              return (
                <>
                  <IconComponent className="mobile-dropdown-icon" />
                  <span className="mobile-dropdown-label">{activeTabData?.label}</span>
                  <FaChevronDown className={`mobile-dropdown-arrow ${isDropdownOpen ? 'open' : ''}`} />
                </>
              );
            })()}
          </button>
          <div className={`mobile-dropdown-menu ${isDropdownOpen ? 'open' : ''}`}>
            {tabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`mobile-dropdown-item ${editModalTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <IconComponent className="mobile-dropdown-item-icon" />
                  <span className="mobile-dropdown-item-label">{tab.label}</span>
                </button>
              );
            })}
          </div>
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
              <button type="button" className="btn add" onClick={onSave}>
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