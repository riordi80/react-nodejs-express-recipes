import React, { useMemo } from 'react';
import { FaRegTrashAlt, FaStar, FaRegStar } from 'react-icons/fa';
import { formatCurrency } from '../../../utils/formatters';

export default function SupplierIngredientsTable({ 
  supplierIngredients, 
  sortConfig, 
  onEditIngredient, 
  onDeleteIngredient,
  onTogglePreferred
}) {
  
  const sortedSupplierIngredients = useMemo(() => {
    if (!sortConfig.key) return supplierIngredients;

    return [...supplierIngredients].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.key === 'is_preferred_supplier') {
        return sortConfig.direction === 'asc' 
          ? (aValue === bValue ? 0 : aValue ? -1 : 1)
          : (aValue === bValue ? 0 : aValue ? 1 : -1);
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [supplierIngredients, sortConfig]);

  if (supplierIngredients.length === 0) {
    return (
      <div className="no-ingredients">
        <p>Este proveedor no tiene ingredientes asignados.</p>
      </div>
    );
  }

  return (
    <div className="supplier-ingredients-table">
      <table>
        <thead>
          <tr>
            <th>Ingrediente</th>
            <th>Precio</th>
            <th style={{ textAlign: 'center' }}>Preferido</th>
            <th style={{ width: '60px' }}></th>
          </tr>
        </thead>
        <tbody>
          {sortedSupplierIngredients.map(item => (
            <tr 
              key={item.ingredient_id}
              onClick={() => onEditIngredient(item)}
              style={{ cursor: 'pointer' }}
              className="clickable-row"
            >
              <td>{item.name || item.ingredient_name || 'Ingrediente'}</td>
              <td>{formatCurrency(item.price)}</td>
              <td style={{ textAlign: 'center' }}>
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePreferred(item);
                  }}
                  style={{ 
                    cursor: 'pointer',
                    display: 'inline-block',
                    padding: '4px',
                    transition: 'transform 0.1s'
                  }}
                  title={item.is_preferred_supplier ? 'Quitar como preferido' : 'Marcar como preferido'}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {item.is_preferred_supplier ? (
                    <FaStar style={{ color: '#fbbf24' }} />
                  ) : (
                    <FaRegStar style={{ color: '#9ca3af' }} />
                  )}
                </span>
              </td>
              <td>
                <div className="table-actions">
                  <button 
                    className="icon-btn delete-icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteIngredient(item);
                    }}
                    title="Eliminar"
                  >
                    <FaRegTrashAlt />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}