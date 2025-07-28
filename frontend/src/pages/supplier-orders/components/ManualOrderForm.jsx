// src/pages/supplier-orders/components/ManualOrderForm.jsx
import React from 'react';
import Loading from '../../../components/loading';
import { formatCurrency, formatDecimal } from '../../../utils/formatters';

const ManualOrderForm = ({ 
  manualOrderItems,
  availableIngredients,
  ingredientsLoading,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onGenerateList
}) => {
  return (
    <div className="manual-order-section">
      <div className="selection-header">
        <h3>Crear Pedido Manual</h3>
        <div className="selection-actions">
          <button 
            className="btn-link"
            onClick={onAddItem}
          >
            + Añadir Ingrediente
          </button>
          <button 
            className="btn add"
            onClick={onGenerateList}
            disabled={manualOrderItems.length === 0}
          >
            Generar Lista
          </button>
        </div>
      </div>
      
      <div 
        className="manual-order-info"
        style={{
          background: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '8px',
          padding: '16px',
          margin: '16px 0'
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#1e40af',
            fontSize: '14px',
            lineHeight: '1.5'
          }}
        >
          📝 <strong>Pedidos independientes:</strong> Especifica la cantidad exacta que necesitas de cada ingrediente. 
          Si el ingrediente tiene proveedor asignado, verás información sobre el tamaño de paquete y precios reales.
        </p>
      </div>

      {manualOrderItems.length === 0 ? (
        <div className="empty-state">
          <p>Añade ingredientes para crear un pedido manual</p>
        </div>
      ) : (
        <div className="manual-items-list">
          {manualOrderItems.map(item => (
            <ManualOrderItem
              key={item.id}
              item={item}
              availableIngredients={availableIngredients}
              onUpdateItem={onUpdateItem}
              onRemoveItem={onRemoveItem}
            />
          ))}
        </div>
      )}

      {ingredientsLoading && (
        <Loading message="Cargando ingredientes disponibles..." size="medium" inline />
      )}
    </div>
  );
};

const ManualOrderItem = ({ item, availableIngredients, onUpdateItem, onRemoveItem }) => {
  return (
    <div 
      className="manual-item"
      style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}
    >
      <div 
        className="manual-item-fields"
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 2fr auto',
          gap: '16px',
          alignItems: 'end'
        }}
      >
        <div 
          className="field-group"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <label style={{
            fontWeight: '500',
            color: '#1e293b',
            fontSize: '14px'
          }}>Ingrediente</label>
          <select
            value={item.ingredientId}
            onChange={(e) => onUpdateItem(item.id, 'ingredientId', e.target.value)}
            className="ingredient-select"
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white',
              width: '100%'
            }}
          >
            <option value="">Seleccionar ingrediente...</option>
            {availableIngredients.map(ingredient => {
              const supplier = ingredient.preferredSupplier;
              const supplierInfo = supplier 
                ? ` | Proveedor: ${formatCurrency(supplier.price)}/${supplier.package_unit} (paquete ${formatDecimal(supplier.package_size)} ${ingredient.unit})`
                : ' | Sin proveedor asignado';
              
              return (
                <option key={ingredient.ingredient_id} value={ingredient.ingredient_id}>
                  {ingredient.name} - Base: {formatCurrency(ingredient.base_price)}/{ingredient.unit}
                  {ingredient.stock > 0 ? ` | Stock: ${formatDecimal(ingredient.stock)} ${ingredient.unit}` : ' | Sin stock'}
                  {supplierInfo}
                </option>
              );
            })}
          </select>
        </div>

        <div 
          className="field-group"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <label style={{
            fontWeight: '500',
            color: '#1e293b',
            fontSize: '14px'
          }}>
            Cantidad deseada
            {item.ingredientId && (() => {
              const ingredient = availableIngredients.find(ing => ing.ingredient_id === parseInt(item.ingredientId));
              return ingredient ? ` (${ingredient.unit})` : '';
            })()}
          </label>
          <input
            type="number"
            step="0,01"
            value={item.quantity}
            onChange={(e) => onUpdateItem(item.id, 'quantity', e.target.value)}
            className="quantity-input"
            lang="es"
            placeholder={item.ingredientId ? (() => {
              const ingredient = availableIngredients.find(ing => ing.ingredient_id === parseInt(item.ingredientId));
              return ingredient ? `Ej: 500 ${ingredient.unit}` : '';
            })() : 'Selecciona ingrediente'}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white',
              maxWidth: '120px'
            }}
          />
          {item.ingredientId && (() => {
            const ingredient = availableIngredients.find(ing => ing.ingredient_id === parseInt(item.ingredientId));
            if (!ingredient?.preferredSupplier) return null;
            
            const supplier = ingredient.preferredSupplier;
            const packageSize = supplier.package_size;
            
            return (
              <small 
                className="quantity-note"
                style={{
                  color: '#64748b',
                  fontSize: '12px',
                  lineHeight: '1.3',
                  marginTop: '4px',
                  display: 'block',
                  background: '#f8fafc',
                  padding: '6px 8px',
                  borderRadius: '4px',
                  borderLeft: '3px solid #3b82f6'
                }}
              >
                💡 El proveedor vende en paquetes de {formatDecimal(packageSize)} {ingredient.unit} 
                por {formatCurrency(supplier.price)} ({supplier.package_unit})
              </small>
            );
          })()}
        </div>

        <div 
          className="field-group"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <label style={{
            fontWeight: '500',
            color: '#1e293b',
            fontSize: '14px'
          }}>Notas (opcional)</label>
          <input
            type="text"
            value={item.notes}
            onChange={(e) => onUpdateItem(item.id, 'notes', e.target.value)}
            className="notes-input"
            placeholder="Ej: Urgente, marca específica..."
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white',
              width: '100%'
            }}
          />
        </div>

        <div 
          className="field-group"
          style={{
            display: 'flex',
            alignItems: 'end'
          }}
        >
          <button 
            className="btn delete"
            onClick={() => onRemoveItem(item.id)}
            title="Eliminar item"
            style={{
              width: '36px',
              height: '36px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold',
              borderRadius: '6px',
              border: '1px solid #dc2626',
              background: '#dc2626',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualOrderForm;