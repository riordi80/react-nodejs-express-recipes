import React from 'react';
import Modal from '../../../components/modal/Modal';

export default function AddIngredientModal({
  isOpen,
  onClose,
  supplierName,
  ingredientSearchText,
  setIngredientSearchText,
  availableIngredients,
  selectedIngredients,
  setSelectedIngredients,
  ingredientDetails,
  setIngredientDetails,
  onSave
}) {

  // Handler para cerrar correctamente en móvil
  const handleCloseClick = () => {
    // Buscar todas las modales y encontrar la que está más arriba (último elemento)
    const allCloseButtons = document.querySelectorAll('.modal-close');
    if (allCloseButtons.length > 0) {
      // Tomar el último botón X (el de la modal más arriba)
      const lastCloseButton = allCloseButtons[allCloseButtons.length - 1];
      lastCloseButton.click();
    } else {
      onClose();
    }
  };

  // Handler para guardar y cerrar
  const handleSaveAndClose = async () => {
    await onSave();
    handleCloseClick();
  };

  const filteredIngredients = availableIngredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(ingredientSearchText.toLowerCase())
  );

  const handleIngredientToggle = (ingredientId) => {
    if (selectedIngredients.includes(ingredientId)) {
      setSelectedIngredients(selectedIngredients.filter(id => id !== ingredientId));
      const newDetails = { ...ingredientDetails };
      delete newDetails[ingredientId];
      setIngredientDetails(newDetails);
    } else {
      setSelectedIngredients([...selectedIngredients, ingredientId]);
      setIngredientDetails({
        ...ingredientDetails,
        [ingredientId]: { price: '', deliveryTime: '' }
      });
    }
  };

  const updateIngredientDetail = (ingredientId, field, value) => {
    setIngredientDetails({
      ...ingredientDetails,
      [ingredientId]: {
        ...ingredientDetails[ingredientId],
        [field]: value
      }
    });
  };

  const canSave = selectedIngredients.length > 0 && 
    selectedIngredients.every(id => ingredientDetails[id]?.price);

  return (
    <Modal 
      isOpen={isOpen} 
      title="Añadir ingredientes al proveedor" 
      onClose={onClose}
      fullscreenMobile={true}
    >
      <div className="add-ingredient-modal">
        <p>Selecciona los ingredientes que suministra <strong>{supplierName}</strong>:</p>
        
        {/* Campo de búsqueda */}
        <div className="search-ingredients">
          <input
            type="text"
            placeholder="Buscar ingredientes..."
            className="search-input"
            value={ingredientSearchText}
            onChange={(e) => setIngredientSearchText(e.target.value)}
          />
        </div>
        
        <div className="ingredients-selection">
          {filteredIngredients.map(ingredient => {
            const isSelected = selectedIngredients.includes(ingredient.ingredient_id);
            return (
              <div key={ingredient.ingredient_id} className="ingredient-item">
                <div className="ingredient-checkbox">
                  <input
                    type="checkbox"
                    id={`ingredient-${ingredient.ingredient_id}`}
                    checked={isSelected}
                    onChange={() => handleIngredientToggle(ingredient.ingredient_id)}
                  />
                  <label htmlFor={`ingredient-${ingredient.ingredient_id}`}>
                    {ingredient.name}
                  </label>
                </div>
                
                {isSelected && (
                  <div className="ingredient-details">
                    <div className="detail-field">
                      <label>Precio (€)*</label>
                      <input
                        type="number"
                        step="0.01"
                        className="detail-input"
                        value={ingredientDetails[ingredient.ingredient_id]?.price || ''}
                        onChange={(e) => updateIngredientDetail(
                          ingredient.ingredient_id, 
                          'price', 
                          e.target.value
                        )}
                        required
                      />
                    </div>
                    <div className="detail-field">
                      <label>Tiempo entrega (días)</label>
                      <input
                        type="number"
                        className="detail-input"
                        value={ingredientDetails[ingredient.ingredient_id]?.deliveryTime || ''}
                        onChange={(e) => updateIngredientDetail(
                          ingredient.ingredient_id, 
                          'deliveryTime', 
                          e.target.value
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="modal-actions">
          <button type="button" className="btn cancel" onClick={handleCloseClick}>
            Cancelar
          </button>
          <button 
            type="button"
            className="btn add" 
            onClick={handleSaveAndClose}
            disabled={!canSave}
          >
            Añadir ingredientes
          </button>
        </div>
      </div>
    </Modal>
  );
}