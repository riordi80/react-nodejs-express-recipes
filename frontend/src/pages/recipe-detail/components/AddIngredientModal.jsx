import React, { useState, useEffect } from 'react';
import Modal from '../../../components/modal/Modal';
import api from '../../../api/axios';
import { formatCurrency, formatDecimal } from '../../../utils/formatters';

export default function AddIngredientModal({
  isOpen,
  onClose,
  recipeId,
  recipeName,
  existingIngredients = [],
  onSave
}) {
  const [ingredientSearchText, setIngredientSearchText] = useState('');
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [ingredientDetails, setIngredientDetails] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar ingredientes disponibles al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadAvailableIngredients();
      // Reset form
      setSelectedIngredients([]);
      setIngredientDetails({});
      setIngredientSearchText('');
      setError('');
    }
  }, [isOpen]);

  const loadAvailableIngredients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ingredients');
      
      // Filtrar ingredientes que ya están en la receta
      const existingIds = existingIngredients.map(ing => ing.ingredient_id);
      const filtered = response.data.filter(ing => !existingIds.includes(ing.ingredient_id));
      
      setAvailableIngredients(filtered);
    } catch (err) {
      console.error('Error loading ingredients:', err);
      setError('Error al cargar ingredientes');
    } finally {
      setLoading(false);
    }
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
        [ingredientId]: { quantity: '' }
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
    selectedIngredients.every(id => ingredientDetails[id]?.quantity && parseFloat(ingredientDetails[id].quantity) > 0);

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      // Añadir cada ingrediente seleccionado
      for (const ingredientId of selectedIngredients) {
        const quantity = parseFloat(ingredientDetails[ingredientId].quantity);
        
        await api.post(`/recipes/${recipeId}/ingredients`, {
          ingredient_id: ingredientId,
          quantity_per_serving: quantity,
          section_id: null
        });
      }

      // Informar al componente padre y cerrar modal
      onSave();
      onClose();
    } catch (err) {
      console.error('Error adding ingredients:', err);
      setError(err.response?.data?.message || 'Error al añadir ingredientes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      title="Añadir ingredientes a la receta" 
      onClose={onClose}
      fullscreenMobile={true}
    >
      <div className="add-ingredient-modal">
        <p>Selecciona los ingredientes para <strong>{recipeName}</strong>:</p>
        
        {loading && <div className="loading">Cargando...</div>}
        
        {error && (
          <div className="notification error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

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
          {filteredIngredients.length > 0 ? (
            filteredIngredients.map(ingredient => {
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
                      <strong>{ingredient.name}</strong>
                      <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                        ({ingredient.unit})
                      </span>
                    </label>
                  </div>
                  
                  {isSelected && (
                    <div className="ingredient-details">
                      <div className="detail-field">
                        <label>Cantidad por porción ({ingredient.unit}) *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="detail-input"
                          value={ingredientDetails[ingredient.ingredient_id]?.quantity || ''}
                          onChange={(e) => updateIngredientDetail(
                            ingredient.ingredient_id, 
                            'quantity', 
                            e.target.value
                          )}
                          placeholder="Ej: 100"
                          required
                        />
                      </div>
                      <div className="ingredient-info" style={{ 
                        fontSize: '12px', 
                        color: '#64748b',
                        marginTop: '4px'
                      }}>
                        Precio: {formatCurrency(ingredient.base_price)} por {ingredient.unit}
                        {ingredient.waste_percent > 0 && (
                          <span> • Merma: {formatDecimal(ingredient.waste_percent * 100, 1)}%</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              {ingredientSearchText ? 'No se encontraron ingredientes' : 'Todos los ingredientes disponibles ya están añadidos a esta receta'}
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button type="button" className="btn cancel" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button 
            type="button"
            className="btn add" 
            onClick={handleSave}
            disabled={!canSave || loading}
          >
            {loading ? 'Añadiendo...' : `Añadir ${selectedIngredients.length} ingrediente${selectedIngredients.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}