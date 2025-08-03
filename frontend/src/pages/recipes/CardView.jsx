// src/pages/recipes/CardView.jsx
import React, { useState, useEffect } from 'react';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import { RecipeCard, LoadMoreButton } from '@/components/recipes';
import { useSettings } from '../../context/SettingsContext';

export default function CardView({ recipes, onView, hasMore, onLoadMore }) {
  const { settings } = useSettings();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(settings.pageSize || 20);

  // Paginar recetas para vista cards
  const getFilteredAndPaginatedRecipes = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return recipes.slice(startIndex, endIndex);
  };

  const paginatedRecipes = getFilteredAndPaginatedRecipes();

  // Reset pagination when recipes change
  useEffect(() => {
    setCurrentPage(1);
  }, [recipes.length]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePerRowsChange = (newPerPage, page) => {
    setRowsPerPage(newPerPage);
    setCurrentPage(page);
  };

  // Columnas vacías para el DataTable invisible
  const emptyColumns = [];

  return (
    <div className="card-view">
      <div className="card-grid">
        {paginatedRecipes.map(r => (
          <RecipeCard
            key={r.recipe_id || r.id}
            id={r.recipe_id || r.id}
            name={r.name}
            thumbnailUrl={r.thumbnail_url || r.thumbnailUrl}
            prepTime={r.prep_time || r.prepTime}
            difficulty={r.difficulty}
            category={r.category}
            onView={onView}
          />
        ))}
      </div>
      
      {hasMore && <LoadMoreButton onClick={onLoadMore} />}
      
      {/* DataTable invisible solo para paginación */}
      {!hasMore && recipes.length > rowsPerPage && (
        <div>
          <StyleSheetManager shouldForwardProp={prop => isPropValid(prop)}>
            <DataTable
              columns={emptyColumns}
              data={recipes}
              pagination
              paginationServer={false}
              paginationTotalRows={recipes.length}
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
            Total: {recipes.length} recetas
          </div>
        </div>
      )}
      
      {(!hasMore && recipes.length <= rowsPerPage && recipes.length > 0) && (
        <div className="total-count">
          Total: {recipes.length} recetas
        </div>
      )}
    </div>
  );
}
