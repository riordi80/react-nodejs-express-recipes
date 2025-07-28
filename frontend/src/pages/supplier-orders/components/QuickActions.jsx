// src/pages/supplier-orders/components/QuickActions.jsx
import React from 'react';
import { FaPlus, FaListUl, FaTruck } from 'react-icons/fa';

const QuickActions = ({ onNavigateToTab }) => {
  return (
    <div className="quick-actions">
      <h3>Acciones Rápidas</h3>
      <div className="actions-grid">
        <button 
          className="btn add" 
          onClick={() => onNavigateToTab('shopping-list')}
        >
          <FaPlus /> Generar Lista de Compras
        </button>
        <button 
          className="btn view" 
          onClick={() => onNavigateToTab('active-orders')}
        >
          <FaListUl /> Ver Pedidos Activos
        </button>
        <button 
          className="btn edit" 
          onClick={() => onNavigateToTab('suppliers')}
        >
          <FaTruck /> Gestionar Proveedores
        </button>
      </div>
    </div>
  );
};

export default QuickActions;