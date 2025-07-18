import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import api from '../../api/axios';
import FilterBar from '@/components/recipes/FilterBar';
import ViewToggle from '@/components/recipes/ViewToggle';
import CardView from './CardView';
import './Recipes.css';

export default function RecipesPage() {
  const navigate = useNavigate();

  // Vista: 'list' o 'card'
  const [view, setView]             = useState('list');

  // Datos y estados
  const [recipes, setRecipes]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // Filtros
  const [searchText, setSearchText]                     = useState('');
  const [categoryOptions, setCategoryOptions]           = useState([]);
  const [selectedCategory, setSelectedCategory]         = useState('');
  const [selectedPrepTime, setSelectedPrepTime]         = useState(null);
  const [difficultyOptions]                             = useState(['Easy', 'Medium', 'Hard']);
  const [selectedDifficulty, setSelectedDifficulty]     = useState('');
  const [ingredientOptions, setIngredientOptions]       = useState([]);
  const [selectedIngredient, setSelectedIngredient]     = useState('');
  const [allergenOptions, setAllergenOptions]           = useState([]);
  const [selectedAllergens, setSelectedAllergens]       = useState([]);

  const prepTimeOptions = [15, 30, 45, 60, 90, 120];

  // 1) Cargar categorías, alérgenos e ingredientes
  useEffect(() => {
    api.get('/recipe-categories')
      .then(({ data }) => setCategoryOptions(data.map(c => c.name)))
      .catch(console.error);

    api.get('/allergens')
      .then(({ data }) => setAllergenOptions(data.map(a => a.name)))
      .catch(console.error);

    api.get('/ingredients')
      .then(({ data }) => setIngredientOptions(data.map(i => i.name)))
      .catch(console.error);
  }, []);

  // 2) Traer recetas cuando cambien los filtros
  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = {
      search:     searchText,
      category:   selectedCategory,
      prepTime:   selectedPrepTime,
      difficulty: selectedDifficulty.toLowerCase(),
      ingredient: selectedIngredient,
      allergens:  selectedAllergens.join(','),
    };

    api.get('/recipes', { params })
      .then(({ data }) => setRecipes(data))
      .catch(() => setError('Error al obtener las recetas'))
      .finally(() => setLoading(false));
  }, [
    searchText,
    selectedCategory,
    selectedPrepTime,
    selectedDifficulty,
    selectedIngredient,
    selectedAllergens,
  ]);

  // Columnas para la vista 'list' (DataTable)
  const columns = useMemo(() => [
    {
      name:     'Nombre',
      selector: row => row.name,
      sortable: true,
      wrap:     true,
      grow:     2
    },
    {
      name:     'Categoría',
      selector: row => row.categories || '—',
      sortable: true,
      wrap:     true
    },
    {
      name:     'Prep Time',
      selector: row => `${row.prep_time} min`,
      sortable: true,
      width:    '120px'
    },
    {
      name:     'Dificultad',
      selector: row => row.difficulty
        ? row.difficulty[0].toUpperCase() + row.difficulty.slice(1)
        : '',
      sortable: true,
      width:    '120px'
    },
    {
      name:     'Acciones',
      cell:     row => (
        <button
          className="btn view"
          onClick={() => navigate(`/recipes/${row.recipe_id}`)}
        >
          Ver
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow:  true,
      button:         true,
      width:          '100px'
    }
  ], [navigate]);

  // Props para FilterBar
  const filterBarProps = {
    searchText,
    onSearchTextChange: setSearchText,
    categoryOptions,
    selectedCategory,
    onCategoryChange: setSelectedCategory,
    prepTimeOptions,
    selectedPrepTime,
    onPrepTimeChange: setSelectedPrepTime,
    difficultyOptions,
    selectedDifficulty,
    onDifficultyChange: setSelectedDifficulty,
    ingredientOptions,
    selectedIngredient,
    onIngredientChange: setSelectedIngredient,
    allergenOptions,
    selectedAllergens,
    onAllergensChange: setSelectedAllergens,
  };

  return (
    <div className="recipes-page">
      <div className="recipes-content">
        <h1>Recetas</h1>

        <div className="recipes-filters">
          <FilterBar {...filterBarProps} />
          <ViewToggle view={view} onChange={setView} />
          <button
            className="btn add new-recipe-button"
            onClick={() => navigate('/recipes/new')}
          >
            + Nueva Receta
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {view === 'list' ? (
          <StyleSheetManager shouldForwardProp={prop => isPropValid(prop)}>
            <DataTable
              className="recipes-table"
              columns={columns}
              data={recipes}
              progressPending={loading}
              progressComponent="Cargando..."
              noDataComponent="No hay recetas para mostrar"
              pagination
              paginationPerPage={15}
              paginationComponentOptions={{
                rowsPerPageText:       'Filas por página',
                rangeSeparatorText:    'de',
                noRowsPerPage:         false,
                selectAllRowsItem:     true,
                selectAllRowsItemText: 'Todos'
              }}
              highlightOnHover
              pointerOnHover
              noHeader
            />
          </StyleSheetManager>
        ) : (
          <CardView
            recipes={recipes}
            onView={id => navigate(`/recipes/${id}`)}
            hasMore={false}
            onLoadMore={() => {}}
          />
        )}
      </div>
    </div>
  );
}
