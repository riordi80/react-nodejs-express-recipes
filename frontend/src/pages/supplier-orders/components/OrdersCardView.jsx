// src/pages/supplier-orders/components/OrdersCardView.jsx
import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import OrderCard from './OrderCard';
import Loading from '../../../components/loading';
import { useSettings } from '../../../context/SettingsContext';

const OrdersCardView = ({ 
  orders, 
  loading, 
  onViewOrder, 
  onUpdateStatus, 
  onDeleteOrder
}) => {
  const { settings } = useSettings();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(settings.pageSize || 20);

  // Paginar pedidos para vista cards
  const getFilteredAndPaginatedOrders = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return orders.slice(startIndex, endIndex);
  };

  const paginatedOrders = getFilteredAndPaginatedOrders();

  // Reset pagination when orders change
  useEffect(() => {
    setCurrentPage(1);
  }, [orders.length]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerRowsChange = (newPerPage, page) => {
    setRowsPerPage(newPerPage);
    setCurrentPage(page);
  };

  // Columnas vacías para el DataTable invisible
  const emptyColumns = [];

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

      {/* DataTable invisible solo para paginación */}
      {orders.length > rowsPerPage && (
        <div>
          <StyleSheetManager shouldForwardProp={prop => isPropValid(prop)}>
            <DataTable
              columns={emptyColumns}
              data={orders}
              pagination
              paginationServer={false}
              paginationTotalRows={orders.length}
              paginationDefaultPage={currentPage}
              paginationPerPage={rowsPerPage}
              paginationRowsPerPageOptions={[10, 20, 25, 50, 100]}
              onChangePage={handlePageChange}
              onChangeRowsPerPage={handlePerRowsChange}
              paginationComponentOptions={{
                rowsPerPageText: 'Filas por página',
                rangeSeparatorText: 'de',
                noRowsPerPage: false,
                selectAllRowsItem: true,
                selectAllRowsItemText: 'Todos'
              }}
              customStyles={{
                table: {
                  style: {
                    display: 'none' // Ocultar la tabla, solo mostrar paginación
                  }
                },
                headRow: {
                  style: {
                    display: 'none'
                  }
                },
                noData: {
                  style: {
                    display: 'none'
                  }
                }
              }}
            />
          </StyleSheetManager>
          <div className="total-count">
            Total: {orders.length} pedidos
          </div>
        </div>
      )}
      
      {(orders.length <= rowsPerPage && orders.length > 0) && (
        <div className="total-count">
          Total: {orders.length} pedidos
        </div>
      )}
    </>
  );
};

export default OrdersCardView;