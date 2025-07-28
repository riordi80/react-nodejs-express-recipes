// src/pages/supplier-orders/components/QuickActions.jsx
import React from 'react';
import { FaPlus, FaListUl, FaTruck } from 'react-icons/fa';
import ActionButtonsGrid from '../../../components/action-buttons-grid';

const QuickActions = ({ onNavigateToTab }) => {
  const actions = [
    {
      label: 'Generar Lista de Compras',
      icon: FaPlus,
      variant: 'add',
      onClick: () => onNavigateToTab('shopping-list')
    },
    {
      label: 'Ver Pedidos Activos',  
      icon: FaListUl,
      variant: 'view',
      onClick: () => onNavigateToTab('active-orders')
    },
    {
      label: 'Gestionar Proveedores',
      icon: FaTruck,
      variant: 'edit', 
      onClick: () => onNavigateToTab('suppliers')
    }
  ];

  return (
    <ActionButtonsGrid 
      title="Acciones Rápidas"
      actions={actions}
    />
  );
};

export default QuickActions;