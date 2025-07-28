// src/pages/supplier-orders/components/OrdersTable.jsx
import React from 'react';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import { useSettings } from '../../../context/SettingsContext';
import { formatCurrency } from '../../../utils/formatters';
import Loading from '../../../components/loading';

const getStatusStyle = (status) => {
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

const OrdersTable = ({ orders, loading, onViewOrder }) => {
  const { settings } = useSettings();

  const columns = React.useMemo(() => [
    {
      name: 'Pedido',
      selector: row => `#${row.order_id}`,
      sortable: true,
      width: '100px'
    },
    {
      name: 'Proveedor',
      selector: row => row.supplier_name,
      sortable: true
    },
    {
      name: 'Estado',
      selector: row => row.status,
      sortable: true,
      cell: row => {
        const statusStyle = getStatusStyle(row.status);
        return (
          <span className={`order-status-badge ${statusStyle.className}`}>
            <span className="status-icon">{statusStyle.icon}</span>
            {statusStyle.label}
          </span>
        );
      }
    },
    {
      name: 'Fecha Pedido',
      selector: row => new Date(row.order_date),
      sortable: true,
      cell: row => new Date(row.order_date).toLocaleDateString('es-ES')
    },
    {
      name: 'Fecha Entrega',
      selector: row => row.delivery_date ? new Date(row.delivery_date) : null,
      sortable: true,
      cell: row => row.delivery_date ? new Date(row.delivery_date).toLocaleDateString('es-ES') : '-'
    },
    {
      name: 'Total',
      selector: row => row.total_amount,
      sortable: true,
      cell: row => formatCurrency(row.total_amount)
    }
  ], []);

  if (loading) {
    return <Loading message="Cargando pedidos activos..." size="medium" inline />;
  }

  return (
    <div className="orders-table-container">
      <StyleSheetManager shouldForwardProp={prop => isPropValid(prop)}>
        <DataTable
          className="common-table"
          columns={columns}
          data={orders}
          noDataComponent="No hay pedidos activos"
          pagination
          paginationPerPage={settings.pageSize}
          paginationRowsPerPageOptions={[10, 25, 50, 100]}
          paginationComponentOptions={{
            rowsPerPageText: 'Filas por página',
            rangeSeparatorText: 'de',
            noRowsPerPage: false,
            selectAllRowsItem: true,
            selectAllRowsItemText: 'Todos'
          }}
          highlightOnHover
          onRowClicked={row => onViewOrder(row.order_id)}
        />
      </StyleSheetManager>
      
      {orders.length > 0 && (
        <div className="total-count">
          Total: {orders.length} pedidos
        </div>
      )}
    </div>
  );
};

export default OrdersTable;