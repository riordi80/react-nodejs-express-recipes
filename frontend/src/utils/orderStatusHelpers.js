// src/utils/orderStatusHelpers.js

export const getStatusStyle = (status) => {
  switch (status) {
    case 'pending':
      return { className: 'status-pending', label: 'Pendiente', icon: '📝' };
    case 'ordered':
      return { className: 'status-ordered', label: 'Enviado', icon: '📤' };
    case 'delivered':
      return { className: 'status-delivered', label: 'Entregado', icon: '✅' };
    case 'cancelled':
      return { className: 'status-cancelled', label: 'Cancelado', icon: '❌' };
    default:
      return { className: 'status-unknown', label: status, icon: '❓' };
  }
};