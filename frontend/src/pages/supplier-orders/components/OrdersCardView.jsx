// src/pages/supplier-orders/components/OrdersCardView.jsx
import React, { useState } from 'react';
import OrderCard from './OrderCard';
import Loading from '../../../components/loading';

const OrdersCardView = ({ 
  orders, 
  loading, 
  onViewOrder, 
  onUpdateStatus, 
  onDeleteOrder,
  itemsPerPage = 20 
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Paginar pedidos para vista cards
  const getFilteredAndPaginatedOrders = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return orders.slice(startIndex, endIndex);
  };

  const paginatedOrders = getFilteredAndPaginatedOrders();
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  // Reset pagination when orders change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [orders.length]);

  if (loading) {
    return <Loading message="Cargando pedidos activos..." size="medium" inline />;
  }

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <p>No hay pedidos activos</p>
        <p>Los pedidos generados desde la Lista de Compras aparecerán aquí</p>
      </div>
    );
  }

  return (
    <>
      <div className="orders-grid">
        {paginatedOrders.map(order => (
          <OrderCard
            key={order.order_id}
            order={order}
            onViewOrder={onViewOrder}
            onUpdateStatus={onUpdateStatus}
            onDeleteOrder={onDeleteOrder}
          />
        ))}
      </div>

      {/* Paginación estilo DataTable */}
      {totalPages > 1 && (
        <div className="rdt_Pagination">
          <div className="rdt_PaginationInfo">
            {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, orders.length)} de {orders.length}
          </div>
          
          <div className="rdt_PaginationNav">
            <button
              className="rdt_PaginationButton"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ←
            </button>
            
            <span className="rdt_PaginationPage">
              {currentPage}
            </span>
            
            <button
              className="rdt_PaginationButton"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              →
            </button>
          </div>
          
          <div className="rdt_PaginationSelect">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                // En una implementación real cambiaríamos itemsPerPage
                console.log('Cambiar elementos por página:', e.target.value);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>filas por página</span>
          </div>
        </div>
      )}
    </>
  );
};

export default OrdersCardView;