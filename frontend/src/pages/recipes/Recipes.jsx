import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from 'react-data-table-component';
import { StyleSheetManager } from 'styled-components';
import isPropValid from '@emotion/is-prop-valid';
import { FaPlus } from 'react-icons/fa';
import TableActions from '../../components/table/TableActions';
import BasePage from '../../components/base-page/BasePage';
import Loading from '../../components/loading';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { usePageState } from '../../hooks/usePageState';
import { useSettings } from '../../context/SettingsContext';
import api from '../../api/axios';
import FilterBar from '@/components/recipes/FilterBar';
import ViewToggle from '../../components/view-toggle';
import { FaTable, FaTh } from 'react-icons/fa';
import CardView from './CardView';
import './Recipes.css';

export default function RecipesPage() {
  const navigate = useNavigate();
  const { settings } = useSettings();

  // Detectar si estamos en móvil
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState(null);

  // Vista: 'list' o 'card' - persistir preferencia del usuario
  const [view, setView] = useState(() => {
    const savedView = localStorage.getItem('recipes-view-preference');
    return savedView || 'list';
  });

  // Función para cambiar vista y guardar preferencia
  const handleViewChange = (newView) => {
    setView(newView);
    localStorage.setItem('recipes-view-preference', newView);
  };

  // Filter options
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [allergenOptions, setAllergenOptions] = useState([]);
  const [ingredientOptions, setIngredientOptions] = useState([]);
  const difficultyOptions = [
    { value: 'easy', label: 'Fácil' },
    { value: 'medium', label: 'Intermedio' },
    { value: 'hard', label: 'Difícil' }
  ];
  const prepTimeOptions = [15, 30, 45, 60, 90, 120];

  // Using usePageState with complex filters
  const {
    data: recipes,
    loading,
    error,
    setFilters,
  } = usePageState('/recipes', {
    useFilters: true,
    initialFilters: {
      search: '',
      category: '',
      prepTime: null,
      difficulty: '',
      ingredient: '',
      allergens: '',
    }
  });

  // Individual filter states for easier management
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPrepTime, setSelectedPrepTime] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState('');
  const [selectedAllergens, setSelectedAllergens] = useState([]);

  // Load filter options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [categoriesRes, allergensRes, ingredientsRes] = await Promise.all([
          api.get('/recipe-categories'),
          api.get('/allergens'),
          api.get('/ingredients')
        ]);
        
        setCategoryOptions(categoriesRes.data.map(c => c.name));
        setAllergenOptions(allergensRes.data.map(a => a.name));
        setIngredientOptions(ingredientsRes.data.map(i => i.name));
      } catch (error) {
        console.error('Error loading filter options:', error);
      }
    };

    loadOptions();
  }, []);

  // Update filters when individual states change
  useEffect(() => {
    setFilters({
      search: searchText,
      category: selectedCategory,
      prepTime: selectedPrepTime,
      difficulty: selectedDifficulty.toLowerCase(),
      ingredient: selectedIngredient,
      allergens: selectedAllergens.join(','),
    });
  }, [
    searchText,
    selectedCategory,
    selectedPrepTime,
    selectedDifficulty,
    selectedIngredient,
    selectedAllergens,
    setFilters
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
      selector: row => translateDifficulty(row.difficulty),
      sortable: true,
      width:    '120px'
    },
    {
      name:     'Acciones',
      cell: row => (
        <TableActions
          row={row}
          onDelete={openDeleteModal}
          showDelete={true}
          deleteTitle="Eliminar receta"
        />
      ),
      ignoreRowClick: true,
      allowOverflow:  true,
      button:         true,
      width:          '100px'
    }
  ], []);

  // Delete handlers
  const openDeleteModal = (recipe) => {
    setCurrentRecipe(recipe);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/recipes/${currentRecipe.recipe_id}`);
      // Refresh data after deletion
      window.location.reload();
      setIsDeleteOpen(false);
      setCurrentRecipe(null);
    } catch (error) {
      console.error('Error al eliminar receta:', error);
      alert('Error al eliminar la receta');
    }
  };

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
    // No pasar ViewToggle - se moverá al título
    viewToggleComponent: null,
  };

  // Custom filters component
  const customFiltersComponent = isMobile ? (
    // Layout móvil optimizado
    <div className="recipes-filters mobile">
      <FilterBar {...filterBarProps} />
      <button
        className="btn add new-recipe-button mobile-add-button"
        onClick={() => navigate('/recipes/new')}
      >
        <FaPlus className="btn-icon" />
         Añadir Receta
      </button>
    </div>
  ) : (
    // Layout desktop original
    <div className="recipes-filters">
      <FilterBar {...filterBarProps} />
      <button
        className="btn add new-recipe-button"
        onClick={() => navigate('/recipes/new')}
      >
        <FaPlus className="btn-icon" />
         Añadir Receta
      </button>
    </div>
  );

  // Table component for list view
  const tableComponent = (
    <div>
      <StyleSheetManager shouldForwardProp={prop => isPropValid(prop)}>
        <DataTable
          className="recipes-table"
          columns={columns}
          data={recipes}
          progressPending={loading}
          progressComponent={<Loading message="Cargando recetas..." size="medium" inline />}
          noDataComponent="No hay recetas para mostrar"
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
          paginationTotalRows={recipes.length}
          paginationDefaultPage={1}
          highlightOnHover
          pointerOnHover
          noHeader
          onRowClicked={(row) => navigate(`/recipes/${row.recipe_id}`)}
        />
      </StyleSheetManager>
      <div className="total-count">
        Total: {recipes.length} recetas
      </div>
    </div>
  );

  // Card component for card view
  const cardComponent = (
    <CardView
      recipes={recipes}
      onView={id => navigate(`/recipes/${id}`)}
      hasMore={false}
      onLoadMore={() => {}}
    />
  );

  return (
    <>
      <BasePage
        title="Recetas"
        subtitle="Crea y administra tus recetas de cocina"
        data={recipes}
        columns={columns}
        loading={loading}
        error={error}
        showSearch={false} // FilterBar handles search
        customFilters={customFiltersComponent}
        viewComponent={view === 'list' ? tableComponent : cardComponent}
        noDataMessage="No hay recetas para mostrar"
        filters={[]}
        enableMobileModal={false} // FilterBar has its own mobile modal
        actions={<ViewToggle 
          options={[
            { value: 'list', label: 'Tabla', icon: FaTable },
            { value: 'card', label: 'Tarjetas', icon: FaTh }
          ]}
          value={view}
          onChange={handleViewChange}
        />}
      />

      {/* DELETE MODAL */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar la receta "${currentRecipe?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </>
  );
}

// Función helper exportable para traducir dificultades
export const translateDifficulty = (difficulty) => {
  const translations = {
    'easy': 'Fácil',
    'medium': 'Intermedio',
    'hard': 'Difícil'
  };
  return translations[difficulty] || difficulty;
};
