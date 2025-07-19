import React, { useState, useEffect } from 'react';
import Modal from '../../../components/modal/Modal';
import api from '../../../api/axios';

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
            <div><strong>Precio base:</strong> €{ingredient.base_price}</div>
            {ingredient.waste_percent > 0 && (
              <div><strong>Merma:</strong> {(ingredient.waste_percent * 100).toFixed(1)}%</div>
            )}
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
            <div>• Para 4 porciones: {(parseFloat(quantity) * 4).toFixed(2)} {ingredient.unit}</div>
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