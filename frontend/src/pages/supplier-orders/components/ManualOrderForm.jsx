// src/pages/supplier-orders/components/ManualOrderForm.jsx
import React, { useState, useEffect, useRef } from 'react';
import Loading from '../../../components/loading';
import { formatCurrency, formatDecimal } from '../../../utils/formatters';

// Función helper para filtrado insensible a acentos
const normalizeText = (text) => {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

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
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Obtener el ingrediente seleccionado actual
  const selectedIngredient = availableIngredients.find(ing => ing.ingredient_id === parseInt(item.ingredientId));

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSearchText('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtrar ingredientes basado en la búsqueda
  const filteredIngredients = availableIngredients.filter(ingredient => {
    if (!searchText) return true;
    return normalizeText(ingredient.name).includes(normalizeText(searchText));
  });

  const handleIngredientSelect = (ingredientId) => {
    onUpdateItem(item.id, 'ingredientId', ingredientId);
    setSearchText('');
    setShowDropdown(false);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);
    setShowDropdown(value.length > 0);
  };

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
          ref={dropdownRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            position: 'relative'
          }}
        >
          <label style={{
            fontWeight: '500',
            color: '#1e293b',
            fontSize: '14px'
          }}>Ingrediente</label>
          
          {/* Mostrar ingrediente seleccionado o input de búsqueda */}
          {selectedIngredient && !showDropdown ? (
            <div 
              style={{
                padding: '8px 32px 8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: '#f8fafc',
                width: '100%',
                cursor: 'pointer',
                minHeight: '36px',
                position: 'relative',
                boxSizing: 'border-box'
              }}
              onClick={() => setShowDropdown(true)}
            >
              {selectedIngredient.name}
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateItem(item.id, 'ingredientId', '');
                }}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '2px',
                  lineHeight: 1
                }}
                title="Quitar selección"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={searchText}
                onChange={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
                placeholder="Buscar ingrediente..."
                className="ingredient-search"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  background: 'white',
                  width: '100%'
                }}
              />
              
              {/* Lista de ingredientes filtrada */}
              {showDropdown && (
                <div 
                  className="ingredients-dropdown"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    right: '0',
                    zIndex: 1000,
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginTop: '2px'
                  }}
                >
                  {filteredIngredients.length > 0 ? (
                    filteredIngredients.map(ingredient => {
                      const supplier = ingredient.preferredSupplier;
                      return (
                        <div
                          key={ingredient.ingredient_id}
                          onClick={() => handleIngredientSelect(ingredient.ingredient_id)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            minHeight: '40px',
                            gap: '12px'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.target.style.background = 'white'}
                        >
                          <div style={{ 
                            fontWeight: '500', 
                            flex: '1',
                            minWidth: '0',
                            color: '#1e293b',
                            paddingTop: '2px'
                          }}>
                            {ingredient.name}
                          </div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#64748b',
                            textAlign: 'right',
                            lineHeight: '1.3',
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                          }}>
                            <div>
                              Base: {formatCurrency(ingredient.base_price)}/{ingredient.unit}
                              {ingredient.stock > 0 ? ` | Stock: ${formatDecimal(ingredient.stock)} ${ingredient.unit}` : ' | Sin stock'}
                            </div>
                            {supplier && (
                              <div style={{ color: '#059669', marginTop: '2px' }}>
                                Proveedor: {formatCurrency(supplier.price)}/{supplier.package_unit} (paquete {formatDecimal(supplier.package_size)} {ingredient.unit})
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '12px', color: '#64748b', textAlign: 'center' }}>
                      No se encontraron ingredientes
                    </div>
                  )}
                  
                  {/* Botón para cerrar */}
                  <div 
                    style={{
                      padding: '8px',
                      borderTop: '1px solid #f1f5f9',
                      textAlign: 'center'
                    }}
                  >
                    <button 
                      type="button"
                      onClick={() => setShowDropdown(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
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
              if (!ingredient) return '';
              
              // Si tiene proveedor preferido, mostrar la unidad del paquete del proveedor
              if (ingredient.preferredSupplier) {
                return ` (${ingredient.preferredSupplier.package_unit})`;
              }
              
              // Si no tiene proveedor, mostrar la unidad del ingrediente
              return ` (${ingredient.unit})`;
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

      {/* Mensaje del proveedor fuera del grid */}
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
              marginTop: '12px',
              display: 'block',
              background: '#f8fafc',
              padding: '8px 12px',
              borderRadius: '6px',
              borderLeft: '3px solid #3b82f6'
            }}
          >
            💡 El proveedor vende en paquetes de {formatDecimal(packageSize)} {ingredient.unit === 'unit' ? 'unidades' : ingredient.unit} por {formatCurrency(supplier.price)} ({supplier.package_unit})
          </small>
        );
      })()}
    </div>
  );
};

export default ManualOrderForm;