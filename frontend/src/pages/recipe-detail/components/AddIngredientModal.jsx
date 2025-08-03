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
  existingSections = [],
  onSave,
  isNewRecipe = false,
  onTemporalSave
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
      
      // No filtrar ingredientes - permitir que se puedan añadir a múltiples secciones
      // Solo filtraremos después según la sección seleccionada
      setAvailableIngredients(response.data);
    } catch (err) {
      console.error('Error loading ingredients:', err);
      setError('Error al cargar ingredientes');
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar si un ingrediente ya está en una sección específica
  const isIngredientInSection = (ingredientId, sectionKey) => {
    if (!sectionKey || !existingIngredients || existingIngredients.length === 0) {
      return false;
    }
    
    return existingIngredients.some(ing => 
      ing.ingredient_id === ingredientId && 
      (ing.section_name === sectionKey || ing.section_id === sectionKey)
    );
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
        [ingredientId]: { 
          quantity: '', 
          sectionKey: existingSections.length > 0 ? existingSections[0].key : null 
        }
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

      if (isNewRecipe) {
        // Para nuevas recetas: guardar en estado temporal
        const newTemporalIngredients = [];
        
        for (const ingredientId of selectedIngredients) {
          const details = ingredientDetails[ingredientId];
          const quantity = parseFloat(details.quantity);
          const sectionKey = details.sectionKey;
          const ingredient = availableIngredients.find(ing => ing.ingredient_id === ingredientId);
          
          // Determinar section_id y section_name
          let sectionId = null;
          let sectionName = null;
          
          if (sectionKey && existingSections.length > 0) {
            const selectedSection = existingSections.find(s => s.key === sectionKey);
            console.log(`🔍 Sección seleccionada: key="${sectionKey}", selectedSection=`, selectedSection);
            sectionId = selectedSection?.id; // Usar el ID numérico real
            sectionName = selectedSection?.name;
            console.log(`📝 Asignando: sectionId=${sectionId}, sectionName="${sectionName}"`);
          }
          
          if (ingredient) {
            newTemporalIngredients.push({
              ingredient_id: ingredientId,
              name: ingredient.name,
              unit: ingredient.unit,
              base_price: ingredient.base_price,
              waste_percent: ingredient.waste_percent || 0,
              quantity_per_serving: quantity,
              section_id: sectionId,
              section_name: sectionName
            });
          }
        }

        // Combinar con ingredientes existentes en el estado temporal
        const updatedTemporalIngredients = [...existingIngredients, ...newTemporalIngredients];
        onTemporalSave(updatedTemporalIngredients);
        
        // Cerrar modal
        onClose();
      } else {
        // Para recetas existentes: comportamiento original
        for (const ingredientId of selectedIngredients) {
          const details = ingredientDetails[ingredientId];
          const quantity = parseFloat(details.quantity);
          const sectionKey = details.sectionKey;
          
          // Determinar section_id
          let sectionId = null;
          if (sectionKey && existingSections.length > 0) {
            const selectedSection = existingSections.find(s => s.key === sectionKey);
            sectionId = selectedSection?.id; // Usar el ID numérico real
          }
          
          await api.post(`/recipes/${recipeId}/ingredients`, {
            ingredient_id: ingredientId,
            quantity_per_serving: quantity,
            section_id: sectionId
          });
        }

        // Informar al componente padre y cerrar modal
        onSave();
        onClose();
      }
    } catch (err) {
      console.error('Error adding ingredients:', err);
      const errorMessage = err.response?.data?.message || 'Error al añadir ingredientes';
      setError(errorMessage);
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
              const selectedSectionKey = ingredientDetails[ingredient.ingredient_id]?.sectionKey || (existingSections.length > 0 ? existingSections[0].key : null);
              const alreadyInSection = selectedSectionKey && isIngredientInSection(ingredient.ingredient_id, selectedSectionKey);
              
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
                      {alreadyInSection && (
                        <span style={{ 
                          fontSize: '11px', 
                          color: '#f59e0b', 
                          marginLeft: '8px',
                          fontWeight: '500'
                        }}>
                          ⚠️ Ya en esta sección
                        </span>
                      )}
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
                      
                      {existingSections.length > 0 && (
                        <div className="detail-field">
                          <label>Sección</label>
                          <select
                            className="detail-input"
                            value={ingredientDetails[ingredient.ingredient_id]?.sectionKey || existingSections[0]?.key || ''}
                            onChange={(e) => updateIngredientDetail(
                              ingredient.ingredient_id, 
                              'sectionKey', 
                              e.target.value
                            )}
                          >
                            {existingSections.map(section => (
                              <option key={section.key} value={section.key}>
                                {section.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
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