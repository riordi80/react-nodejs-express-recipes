// src/components/BasePage.jsx
import React from 'react';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';

const BasePage = ({
  title,
  data,
  columns,
  loading,
  error,
  message,
  messageType,
  filterText,
  onFilterChange,
  onAdd,
  addButtonText = "Añadir",
  searchPlaceholder = "Buscar...",
  noDataMessage = "No hay datos para mostrar",
  children, // Para contenido adicional entre el título y la tabla
  actions, // Para botones adicionales en el subheader
  
  // New props for complex pages like Recipes
  customFilters, // Para filtros complejos como FilterBar
  viewComponent, // Para vistas alternativas como CardView
  showSearch = true, // Para ocultar búsqueda si se usan filtros complejos
  customContent, // Para contenido personalizado en lugar de DataTable
  showTotalCount = true, // Para mostrar/ocultar el contador total
  totalCountLabel = "elementos", // Etiqueta personalizada para el contador
  onRowClicked, // Para manejar clicks en filas de tabla
}) => {
  return (
    <div className="common-page-container">
      <div className="common-page-content">
        <h1 className="common-page-title">{title}</h1>

        {/* Messages */}
        {message && (
          <div className={`notification ${messageType}`}>
            {message}
          </div>
        )}
        {error && <div className="error">{error}</div>}

        {/* Children content (for custom content between title and subheader) */}
        {children}

        {/* Complex filters (like FilterBar for Recipes) */}
        {customFilters}

        {/* Subheader with search and actions */}
        {(showSearch || actions || onAdd) && (
          <div className="subheader">
            {showSearch && (
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="common-search-input"
                value={filterText}
                onChange={(e) => onFilterChange(e.target.value)}
              />
            )}
            
            {/* Custom actions */}
            {actions}
            
            {/* Add button */}
            {onAdd && (
              <button className="btn add" onClick={onAdd}>
                {addButtonText}
              </button>
            )}
          </div>
        )}

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
                  <div className="loading-overlay">
                    <div className="loading-text">
                      Cargando...
                    </div>
                  </div>
                }
                noDataComponent={noDataMessage}
                pagination
                paginationPerPage={15}
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