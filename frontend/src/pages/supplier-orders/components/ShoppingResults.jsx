// src/pages/supplier-orders/components/ShoppingResults.jsx
import React from 'react';
import { FaPlus, FaTimesCircle, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { formatCurrency, formatDecimal } from '../../../utils/formatters';

const getSupplierStatusIndicator = (status) => {
  switch (status) {
    case 'complete':
      return { icon: FaCheckCircle, className: 'supplier-status-complete', title: 'Proveedor configurado correctamente' };
    case 'incomplete':
      return { icon: FaExclamationTriangle, className: 'supplier-status-incomplete', title: 'Proveedor asignado pero sin precio configurado' };
    case 'missing':
    default:
      return { icon: FaTimesCircle, className: 'supplier-status-missing', title: 'Sin proveedor asignado' };
  }
};

const ShoppingResults = ({ 
  shoppingList, 
  isGeneratingOrders, 
  onIngredientRowClick, 
  onGenerateOrders 
}) => {
  if (!shoppingList) {
    return null;
  }

  return (
    <div className="shopping-results">
      {/* Resumen */}
      <div className="shopping-summary">
        <div className="summary-stats">
          {!shoppingList.filters?.manual && (
            <div className="stat">
              <span className="stat-label">Eventos</span>
              <span className="stat-value">{shoppingList.totalEvents}</span>
            </div>
          )}
          <div className="stat">
            <span className="stat-label">{shoppingList.filters?.manual ? 'Items' : 'Costo Total'}</span>
            <span className="stat-value">
              {shoppingList.filters?.manual 
                ? shoppingList.ingredientsBySupplier.reduce((total, supplier) => total + supplier.ingredients.length, 0)
                : formatCurrency(shoppingList.totalCost)
              }
            </span>
          </div>
          {shoppingList.filters?.manual && (
            <div className="stat">
              <span className="stat-label">Costo Total</span>
              <span className="stat-value">{formatCurrency(shoppingList.totalCost)}</span>
            </div>
          )}
          {!shoppingList.filters?.manual && (
            <div className="stat">
              <span className="stat-label">Proveedores</span>
              <span className="stat-value">{shoppingList.ingredientsBySupplier.length}</span>
            </div>
          )}
        </div>
        {shoppingList.dateRange.from && (
          <div className="date-range">
            <small>
              Período: {new Date(shoppingList.dateRange.from).toLocaleDateString()} - {new Date(shoppingList.dateRange.to).toLocaleDateString()}
            </small>
          </div>
        )}
      </div>

      {/* Advertencias sobre configuración de proveedores */}
      {shoppingList.supplierStats && (shoppingList.supplierStats.incomplete > 0 || shoppingList.supplierStats.missing > 0) && (
        <div className="supplier-warnings">
          {shoppingList.supplierStats.missing > 0 && (
            <div className="warning-item missing">
              <FaTimesCircle className="warning-icon" />
              <span>
                <strong>{shoppingList.supplierStats.missing} ingredientes</strong> sin proveedor asignado - usando precios base
              </span>
            </div>
          )}
          {shoppingList.supplierStats.incomplete > 0 && (
            <div className="warning-item incomplete">
              <FaExclamationTriangle className="warning-icon" />
              <span>
                <strong>{shoppingList.supplierStats.incomplete} ingredientes</strong> con proveedor asignado pero sin precio configurado
              </span>
            </div>
          )}
          <div className="warning-note">
            <small>El costo total puede no ser preciso. Configura los proveedores y precios para obtener cálculos exactos.</small>
          </div>
        </div>
      )}

      {/* Botón para generar pedidos */}
      {shoppingList.ingredientsBySupplier.length > 0 && (
        <div className="generate-orders-section">
          <button 
            className="btn add generate-orders-btn"
            onClick={onGenerateOrders}
            disabled={isGeneratingOrders}
          >
            <FaPlus />
            {isGeneratingOrders ? 'Generando Pedidos...' : 'Generar Pedidos por Proveedor'}
          </button>
          <small className="generate-orders-note">
            Se creará un pedido separado para cada proveedor con estado "pendiente"
          </small>
        </div>
      )}

      {/* Lista por Proveedores */}
      {shoppingList.ingredientsBySupplier.length > 0 ? (
        <div className="suppliers-list">
          {shoppingList.ingredientsBySupplier.map(supplier => (
            <SupplierGroup 
              key={supplier.supplierId}
              supplier={supplier}
              onIngredientRowClick={onIngredientRowClick}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>{shoppingList.message || 'No hay ingredientes que comprar con los filtros seleccionados'}</p>
        </div>
      )}
    </div>
  );
};

const SupplierGroup = ({ supplier, onIngredientRowClick }) => {
  return (
    <div className="supplier-group">
      <div className="supplier-header">
        <h3>{supplier.supplierName}</h3>
        <span className="supplier-total">{formatCurrency(supplier.supplierTotal)}</span>
      </div>
      <div className="ingredients-table">
        <table>
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th>Necesario</th>
              <th>En Stock</th>
              <th>A Comprar</th>
              <th>Unidad Venta</th>
              <th>Cantidad Real</th>
              <th>Precio Real</th>
              <th>Total Real</th>
            </tr>
          </thead>
          <tbody>
            {supplier.ingredients.map(ingredient => {
              const statusIndicator = getSupplierStatusIndicator(ingredient.supplierStatus);
              const StatusIcon = statusIndicator.icon;
              return (
                <tr 
                  key={ingredient.ingredientId}
                  onClick={() => onIngredientRowClick(ingredient.ingredientId)}
                  style={{ cursor: 'pointer' }}
                  className="clickable-ingredient-row"
                >
                  <td>
                    <div className="ingredient-name-with-status">
                      <span>{ingredient.name}</span>
                      <StatusIcon 
                        className={`supplier-status-icon ${statusIndicator.className}`} 
                        title={statusIndicator.title}
                      />
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>{formatDecimal(ingredient.needed)} {ingredient.unit}</span>
                      {ingredient.wastePercent > 0 && (
                        <span style={{ 
                          fontSize: '11px', 
                          color: '#64748b',
                          fontStyle: 'italic'
                        }}>
                          Base: {formatDecimal(ingredient.neededBase)} + {(ingredient.wastePercent * 100).toFixed(1)}% merma
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{formatDecimal(ingredient.inStock)} {ingredient.unit}</td>
                  <td className="to-buy">{formatDecimal(ingredient.toBuy)} {ingredient.unit}</td>
                  <td className="package-info">
                    {ingredient.packageSize ? (
                      `${formatDecimal(ingredient.packageSize)} ${ingredient.packageUnit}`
                    ) : (
                      `1 ${ingredient.unit}`
                    )}
                  </td>
                  <td className="real-quantity">
                    {ingredient.packagesToBuy > 0 ? (
                      `${formatDecimal(ingredient.realQuantity)} ${ingredient.unit}`
                    ) : (
                      `${formatDecimal(ingredient.toBuy)} ${ingredient.unit}`
                    )}
                  </td>
                  <td className="real-price">
                    {ingredient.supplierPrice ? (
                      `${formatCurrency(ingredient.supplierPrice)}/${ingredient.packageUnit || 'unidad'}`
                    ) : (
                      formatCurrency(ingredient.pricePerUnit)
                    )}
                  </td>
                  <td className="total-cost">
                    {ingredient.realTotalCost > 0 ? (
                      formatCurrency(ingredient.realTotalCost)
                    ) : (
                      formatCurrency(ingredient.totalCost)
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShoppingResults;