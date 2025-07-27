// src/components/BasePage.jsx
import React from 'react';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import PageHeader from '../page-header/PageHeader';
import Loading from '../loading';
import { useSettings } from '../../context/SettingsContext';

const BasePage = ({
  // Data and table props
  data,
  columns,
  loading,
  error,
  noDataMessage = "No hay datos para mostrar",
  onRowClicked,
  
  // Content customization
  viewComponent, // Para vistas alternativas como CardView
  customContent, // Para contenido personalizado en lugar de DataTable
  showTotalCount = true,
  totalCountLabel = "elementos",
  children, // Content between header and table
  
  // PageHeader props (explicitly defined for clarity)
  title,
  subtitle,
  message,
  messageType,
  filterText,
  onFilterChange,
  onAdd,
  addButtonText = "Añadir",
  searchPlaceholder = "Buscar...",
  showSearch = true,
  filters = [],
  customFilters,
  actions,
  headerLayout = 'standard',
  enableMobileModal = true,
}) => {
  const { settings } = useSettings();
  return (
    <div className="common-page-container">
      <div className="common-page-content">
        {/* PageHeader handles all header functionality */}
        <PageHeader
          title={title}
          subtitle={subtitle}
          message={message}
          messageType={messageType}
          searchValue={filterText}
          onSearchChange={onFilterChange}
          searchPlaceholder={searchPlaceholder}
          showSearch={showSearch}
          filters={filters}
          customFilters={customFilters}
          onAdd={onAdd}
          addButtonText={addButtonText}
          actions={actions}
          layout={headerLayout}
          enableMobileModal={enableMobileModal}
        >
          {children}
        </PageHeader>

        {/* Error display (kept separate from PageHeader for now) */}
        {error && <div className="error">{error}</div>}

        {/* Custom content (for alternative views like CardView) */}
        {customContent}

        {/* Default Data Table (only if no custom content) */}
        {!customContent && viewComponent}
        
        {!customContent && !viewComponent && (
          <div>
            <StyleSheetManager shouldForwardProp={prop => isPropValid(prop)}>
              <DataTable
                className="common-table"
                columns={columns}
                data={data}
                progressPending={loading}
                progressComponent={
                  <Loading message="Cargando datos..." size="medium" inline />
                }
                noDataComponent={noDataMessage}
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
                pointerOnHover
                selectableRows={false}
                noHeader
                onRowClicked={onRowClicked}
              />
            </StyleSheetManager>
            {showTotalCount && data && (
              <div className="total-count">
                Total: {data.length} {totalCountLabel}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BasePage;