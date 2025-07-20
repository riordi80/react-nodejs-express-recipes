import React, { useMemo } from 'react';
import { FaEdit, FaRegTrashAlt } from 'react-icons/fa';
import { formatCurrency } from '../../../utils/formatters';

export default function SupplierIngredientsTable({ 
  supplierIngredients, 
  sortConfig, 
  onEditIngredient, 
  onDeleteIngredient 
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
            <th>Tiempo entrega</th>
            <th>Preferido</th>
            <th style={{ width: '80px' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedSupplierIngredients.map(item => (
            <tr key={item.ingredient_id}>
              <td>{item.name || item.ingredient_name || 'Ingrediente'}</td>
              <td>{formatCurrency(item.price)}</td>
              <td>{item.delivery_time || '-'} días</td>
              <td>{item.is_preferred_supplier ? 'Sí' : 'No'}</td>
              <td>
                <div className="table-actions">
                  <button 
                    className="icon-btn edit-icon" 
                    onClick={() => onEditIngredient(item)}
                    title="Editar"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="icon-btn delete-icon" 
                    onClick={() => onDeleteIngredient(item)}
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