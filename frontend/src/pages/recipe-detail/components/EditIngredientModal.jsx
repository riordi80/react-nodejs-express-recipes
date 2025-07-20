import React, { useState, useEffect } from 'react';
import Modal from '../../../components/modal/Modal';
import api from '../../../api/axios';
import { formatCurrency, formatDecimal } from '../../../utils/formatters';

export default function EditIngredientModal({
  isOpen,
  onClose,
  recipeId,
  ingredient,
  onSave
}) {
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calcular valores nutricionales basados en la cantidad
  const calculateNutrition = () => {
    if (!quantity || !ingredient || isNaN(parseFloat(quantity))) {
      return null;
    }

    const quantityNum = parseFloat(quantity);
    const factor = quantityNum / 100; // Factor de conversión desde per-100g

    return {
      calories: formatDecimal((ingredient.calories_per_100g || 0) * factor, 1),
      protein: formatDecimal((ingredient.protein_per_100g || 0) * factor, 1),
      carbs: formatDecimal((ingredient.carbs_per_100g || 0) * factor, 1),
      fat: formatDecimal((ingredient.fat_per_100g || 0) * factor, 1)
    };
  };

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && ingredient) {
      setQuantity(ingredient.quantity_per_serving || '');
      setError('');
    }
  }, [isOpen, ingredient]);

  const handleSave = async () => {
    if (!quantity) {
      setError('Por favor especifica la cantidad');
      return;
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('La cantidad debe ser un número positivo');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Llamar al API para actualizar el ingrediente
      await api.put(`/recipes/${recipeId}/ingredients/${ingredient.ingredient_id}`, {
        quantity_per_serving: quantityNum,
        section_id: null // Por ahora sin secciones
      });

      // Informar al componente padre y cerrar modal
      onSave();
      onClose();
    } catch (err) {
      console.error('Error updating ingredient:', err);
      setError(err.response?.data?.message || 'Error al actualizar ingrediente');
    } finally {
      setLoading(false);
    }
  };

  if (!ingredient) return null;

  return (
    <Modal isOpen={isOpen} title="Editar Ingrediente" onClose={onClose}>
      <div className="edit-ingredient-form">
        {loading && <div className="loading">Actualizando...</div>}
        
        {error && (
          <div className="notification error" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Información del ingrediente */}
        <div className="ingredient-info" style={{
          background: '#f8fafc',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
            {ingredient.name}
          </div>
          <div style={{ color: '#64748b' }}>
            <div><strong>Unidad:</strong> {ingredient.unit}</div>
            <div><strong>Precio base:</strong> {formatCurrency(ingredient.base_price)}</div>
            {ingredient.waste_percent > 0 && (
              <div><strong>Merma:</strong> {formatDecimal(ingredient.waste_percent * 100, 1)}%</div>
            )}
            <div><strong>Precio neto:</strong> {formatCurrency(ingredient.net_price)} <span style={{ fontSize: '11px', fontStyle: 'italic' }}>(calculado automáticamente)</span></div>
          </div>
        </div>

        <div className="form-field" style={{ marginBottom: '20px' }}>
          <label>
            Cantidad por porción *
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>
              {' '}(en {ingredient.unit})
            </span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            className="form-input"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Ej: 100"
            disabled={loading}
            autoFocus
          />
        </div>

        {/* Información Nutricional */}
        {ingredient && (ingredient.calories_per_100g || ingredient.protein_per_100g || ingredient.carbs_per_100g || ingredient.fat_per_100g) && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#1e293b', 
              marginBottom: '12px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '8px'
            }}>
              🍎 Información Nutricional (para esta cantidad)
            </h4>
            
            <div style={{ 
              background: '#f8fafc',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0'
            }}>
              {(() => {
                const nutrition = calculateNutrition();
                if (!nutrition) {
                  return (
                    <div style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                      Ingresa una cantidad para ver la información nutricional
                    </div>
                  );
                }
                
                return (
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '8px',
                    fontSize: '13px'
                  }}>
                    {nutrition.calories > 0 && (
                      <div>
                        <strong>Calorías:</strong> {nutrition.calories} kcal
                      </div>
                    )}
                    {nutrition.protein > 0 && (
                      <div>
                        <strong>Proteínas:</strong> {nutrition.protein} g
                      </div>
                    )}
                    {nutrition.carbs > 0 && (
                      <div>
                        <strong>Carbohidratos:</strong> {nutrition.carbs} g
                      </div>
                    )}
                    {nutrition.fat > 0 && (
                      <div>
                        <strong>Grasas:</strong> {nutrition.fat} g
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Información del cálculo actual */}
        {quantity && !isNaN(parseFloat(quantity)) && (
          <div className="calculation-info" style={{
            background: '#e0f2fe',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '13px',
            color: '#0369a1'
          }}>
            <div><strong>Vista previa del cálculo:</strong></div>
            <div>• Cantidad por porción: {parseFloat(quantity)} {ingredient.unit}</div>
            <div>• Para 4 porciones: {formatDecimal(parseFloat(quantity) * 4, 2)} {ingredient.unit}</div>
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button 
          type="button" 
          className="btn cancel" 
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </button>
        <button 
          type="button" 
          className="btn add" 
          onClick={handleSave}
          disabled={loading || !quantity}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </Modal>
  );
}