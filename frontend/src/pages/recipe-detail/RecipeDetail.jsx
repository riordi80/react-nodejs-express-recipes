// src/pages/recipe-detail/RecipeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit3, FiTrash2, FiSave, FiX } from 'react-icons/fi';
// BasePage removed - using custom layout
import ConfirmModal from '../../components/modals/ConfirmModal';
import Loading from '../../components/loading';
import AddIngredientModal from './components/AddIngredientModal';
import EditIngredientModal from './components/EditIngredientModal';
import api from '../../api/axios';
import { translateDifficulty } from '../recipes/Recipes';
import { formatCurrency, formatDecimal } from '../../utils/formatters';
import './RecipeDetail.css';

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewRecipe = id === 'new';
  
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [temporalIngredients, setTemporalIngredients] = useState([]); // Para nuevas recetas
  const [allergens, setAllergens] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [isEditing, setIsEditing] = useState(isNewRecipe); // Nueva receta empieza en modo edición
  const [validationErrors, setValidationErrors] = useState({});
  
  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Add ingredient modal state
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false);
  
  // Delete ingredient modal state
  const [isDeleteIngredientOpen, setIsDeleteIngredientOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState(null);
  
  // Edit ingredient modal state
  const [isEditIngredientOpen, setIsEditIngredientOpen] = useState(false);
  const [ingredientToEdit, setIngredientToEdit] = useState(null);

  // Notification function
  const notify = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  };

  // Función para obtener los ingredientes a mostrar (temporales o reales)
  const getDisplayIngredients = () => {
    return isNewRecipe ? temporalIngredients : ingredients;
  };


  useEffect(() => {
    if (isNewRecipe) {
      // Para nueva receta, inicializar con datos vacíos
      initializeNewRecipe();
    } else {
      // Para receta existente, cargar datos
      loadRecipeData();
    }
    loadAvailableCategories();
  }, [id, isNewRecipe]);

  const initializeNewRecipe = async () => {
    try {
      setLoading(true);
      // Inicializar receta vacía con valores por defecto
      setRecipe({
        name: '',
        instructions: '',
        prep_time: '',
        servings: 1,
        production_servings: 1,
        difficulty: '',
        net_price: '',
        is_featured_recipe: false,
        tax_id: 1 // Valor por defecto
      });
      setIngredients([]);
      setTemporalIngredients([]);
      setAllergens([]);
      setCategories([]);
      setSelectedCategoryIds([]);
      setNutrition(null);
      setError('');
    } catch (err) {
      setError('Error al inicializar nueva receta');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCategories = async () => {
    try {
      const response = await api.get('/recipe-categories');
      setAvailableCategories(response.data);
    } catch (err) {
      // Fallback con categorías hardcodeadas si no existe el endpoint
      setAvailableCategories([
        { category_id: 1, name: 'Entrante' },
        { category_id: 2, name: 'Principal' },
        { category_id: 3, name: 'Postre' },
        { category_id: 4, name: 'Bebida' },
        { category_id: 5, name: 'Comida vegetariana' },
        { category_id: 6, name: 'Ensaladas' }
      ]);
    }
  };

  const loadRecipeData = async () => {
    try {
      setLoading(true);
      // Primero cargar datos básicos de la receta e ingredientes
      const [recipeResponse, ingredientsResponse] = await Promise.all([
        api.get(`/recipes/${id}`),
        api.get(`/recipes/${id}/ingredients`)
      ]);
      
      setRecipe(recipeResponse.data);
      setIngredients(ingredientsResponse.data);
      
      // Cargar información nutricional por separado
      try {
        const nutritionResponse = await api.get(`/recipes/${id}/nutrition`);
        setNutrition(nutritionResponse.data);
      } catch (nutritionErr) {
        setNutrition(null); // Fallback a null
      }
      
      // Cargar alérgenos por separado para no fallar toda la carga si hay error
      try {
        const allergensResponse = await api.get(`/recipes/${id}/allergens`);
        setAllergens(allergensResponse.data);
      } catch (allergensErr) {
        setAllergens([]); // Fallback a array vacío
      }
      
      // Luego buscar las categorías en el listado usando el nombre de la receta
      try {
        const recipesListResponse = await api.get(`/recipes`);
        const recipeWithCategories = recipesListResponse.data.find(r => r.recipe_id === parseInt(id));
        if (recipeWithCategories && recipeWithCategories.categories) {
          // Las categorías vienen como string concatenado desde el backend
          // Ejemplo: "Principal, Postre" -> ["Principal", "Postre"]
          let cats;
          if (typeof recipeWithCategories.categories === 'string') {
            cats = recipeWithCategories.categories.split(', ').map(cat => cat.trim());
          } else if (Array.isArray(recipeWithCategories.categories)) {
            cats = recipeWithCategories.categories;
          } else {
            cats = [recipeWithCategories.categories];
          }
          setCategories(cats);
        } else {
          setCategories([]);
        }
      } catch (categoriesErr) {
        setCategories([]); // Asegurar que sea array vacío en caso de error
      }
      
      setError('');
    } catch (err) {
      setError('Error al cargar la receta');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validar campos obligatorios y crear mensaje específico
      const errors = {};
      
      if (!recipe.name || recipe.name.trim() === '') {
        errors.name = 'El nombre de la receta es obligatorio';
      }
      
      if (!recipe.servings || parseInt(recipe.servings) <= 0) {
        errors.servings = 'El número de comensales es obligatorio y debe ser mayor a 0';
      }
      
      if (!recipe.production_servings || parseInt(recipe.production_servings) <= 0) {
        errors.production_servings = 'Las raciones mínimas son obligatorias y deben ser mayor a 0';
      }
      
      if (!recipe.net_price || parseFloat(recipe.net_price) <= 0) {
        errors.net_price = 'El precio de venta es obligatorio y debe ser mayor a 0';
      }
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        
        // Crear mensaje específico con los campos que faltan
        const missingFields = [];
        if (errors.name) missingFields.push('Nombre de la receta');
        if (errors.servings) missingFields.push('Comensales');
        if (errors.production_servings) missingFields.push('Raciones mínimas para producción');
        if (errors.net_price) missingFields.push('Precio de venta total');
        
        const message = missingFields.length === 1 
          ? `Falta completar el campo: ${missingFields[0]}`
          : `Faltan completar los campos: ${missingFields.join(', ')}`;
          
        notify(message, 'error');
        return;
      }
      
      // Validación: Los comensales no pueden ser menores que las raciones mínimas
      const servings = parseInt(recipe.servings) || 0;
      const productionServings = parseInt(recipe.production_servings) || 0;
      
      if (servings < productionServings) {
        notify(`Los comensales (${servings}) no pueden ser menores que las raciones mínimas para producción (${productionServings})`, 'error');
        return;
      }
      if (isNewRecipe) {
        // Sanitizar campos antes de enviar
        const sanitizedRecipe = {
          ...recipe,
          prep_time: recipe.prep_time === '' ? null : recipe.prep_time,
          difficulty: recipe.difficulty === '' ? null : recipe.difficulty
        };
        
        // Crear nueva receta
        const response = await api.post('/recipes', sanitizedRecipe);
        const newRecipeId = response.data.id;
        
        // Guardar categorías seleccionadas
        try {
          await api.put(`/recipes/${newRecipeId}/categories`, { 
            categoryIds: selectedCategoryIds 
          });
        } catch (categoryErr) {
          console.warn('Error saving categories:', categoryErr);
        }
        
        // Añadir ingredientes temporales si los hay
        if (temporalIngredients && temporalIngredients.length > 0) {
          try {
            for (const ingredient of temporalIngredients) {
              await api.post(`/recipes/${newRecipeId}/ingredients`, {
                ingredient_id: ingredient.ingredient_id,
                quantity_per_serving: ingredient.quantity_per_serving,
                section_id: ingredient.section_id
              });
            }
          } catch (ingredientsErr) {
            console.warn('Error saving ingredients:', ingredientsErr);
            // Mostrar advertencia pero no impedir la navegación
            notify('Receta creada, pero hubo un error al guardar algunos ingredientes', 'warning');
          }
        }
        
        // Recalcular costes para la nueva receta
        try {
          await api.put(`/recipes/${newRecipeId}/costs`);
        } catch (costErr) {
          console.warn('Error calculating costs:', costErr);
        }
        
        // Navegar a la receta creada
        navigate(`/recipes/${newRecipeId}`);
      } else {
        // Sanitizar campos antes de enviar
        const sanitizedRecipe = {
          ...recipe,
          prep_time: recipe.prep_time === '' ? null : recipe.prep_time,
          difficulty: recipe.difficulty === '' ? null : recipe.difficulty
        };
        
        // Actualizar receta existente
        await api.put(`/recipes/${id}`, sanitizedRecipe);
        
        // Guardar categorías seleccionadas
        try {
          await api.put(`/recipes/${id}/categories`, { 
            categoryIds: selectedCategoryIds 
          });
        } catch (categoryErr) {
          console.warn('Error saving categories:', categoryErr);
        }
        
        // Recalcular costes después de actualizar
        await api.put(`/recipes/${id}/costs`);
        
        // Recargar datos actualizados
        await loadRecipeData();
        setIsEditing(false);
      }
      
      setError('');
    } catch (err) {
      setError(isNewRecipe ? 'Error al crear la receta' : 'Error al guardar la receta');
      console.error(err);
    }
  };

  // Calcular métricas de coste basadas en datos reales
  const calculateCostMetrics = () => {
    if (!recipe) return null;

    const netPrice = parseFloat(recipe.net_price) || 0;
    const servings = parseInt(recipe.servings) || 1;
    const productionServings = parseInt(recipe.production_servings) || 1;
    
    // Calcular coste total directamente para el número de servings
    let totalCost = 0;
    let costPerServing = 0;
    
    const displayIngredients = getDisplayIngredients();
    if (displayIngredients && displayIngredients.length > 0) {
      totalCost = displayIngredients.reduce((total, ingredient) => {
        const quantity = parseFloat(ingredient.quantity_per_serving) || 0;
        const price = parseFloat(ingredient.base_price) || 0;
        const wastePercent = parseFloat(ingredient.waste_percent) || 0;
        const wasteMultiplier = 1 + wastePercent;
        // Coste para todos los servings
        return total + (quantity * price * wasteMultiplier * servings);
      }, 0);
      
      // Calcular coste por porción a partir del total
      costPerServing = servings > 0 ? totalCost / servings : 0;
    }
    
    // Calcular margen y precio sugerido
    // net_price ya es el precio total de la receta, no por porción
    const totalNetPrice = netPrice;
    const pricePerServing = netPrice / servings; // Calcular precio por porción para mostrar
    const currentMargin = totalNetPrice - totalCost;
    const currentMarginPercent = totalNetPrice > 0 ? ((totalNetPrice - totalCost) / totalNetPrice) * 100 : 0;
    const suggestedPrice40 = costPerServing > 0 ? costPerServing / 0.6 : 0; // 40% margen sobre coste por porción

    return {
      totalCost,
      costPerServing,
      netPrice,
      totalNetPrice,
      pricePerServing,
      currentMargin,
      currentMarginPercent,
      suggestedPrice40,
      productionServings,
      servings
    };
  };



  // Manejar selección de categorías
  const handleCategoryChange = (categoryId, isChecked) => {
    if (isChecked) {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
    } else {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== categoryId));
    }
  };

  // Cambiar modo de edición
  const toggleEdit = () => {
    if (!isEditing) {
      // Al entrar en modo edición, mapear categorías actuales a IDs
      if (categories.length > 0 && availableCategories.length > 0) {
        const categoryIds = categories.map(categoryName => {
          const found = availableCategories.find(cat => cat.name === categoryName);
          return found ? found.category_id : null;
        }).filter(id => id !== null);
        setSelectedCategoryIds(categoryIds);
      } else {
        setSelectedCategoryIds([]);
      }
    }
    setIsEditing(!isEditing);
  };

  const handleBack = () => {
    navigate('/recipes');
  };

  // Delete handlers
  const openDeleteModal = () => {
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/recipes/${id}`);
      navigate('/recipes');
    } catch (error) {
      console.error('Error al eliminar receta:', error);
      setError('Error al eliminar la receta');
    }
    setIsDeleteOpen(false);
  };

  // Ingredient handlers
  const openAddIngredientModal = () => {
    setIsAddIngredientOpen(true);
  };

  const handleAddIngredientSave = async () => {
    // Recargar ingredientes después de añadir
    if (!isNewRecipe) {
      await loadRecipeData();
    }
    setIsAddIngredientOpen(false);
  };

  const openDeleteIngredientModal = (ingredient) => {
    setIngredientToDelete(ingredient);
    setIsDeleteIngredientOpen(true);
  };

  const handleRemoveIngredient = async () => {
    try {
      if (isNewRecipe) {
        // Para nuevas recetas: eliminar del estado temporal
        const updatedTemporalIngredients = temporalIngredients.filter(
          ingredient => ingredient.ingredient_id !== ingredientToDelete.ingredient_id
        );
        setTemporalIngredients(updatedTemporalIngredients);
      } else {
        // Para recetas existentes: eliminar del backend
        await api.delete(`/recipes/${id}/ingredients/${ingredientToDelete.ingredient_id}`);
        // Recargar ingredientes después de eliminar
        await loadRecipeData();
      }
      
      setIsDeleteIngredientOpen(false);
      setIngredientToDelete(null);
    } catch (error) {
      console.error('Error removing ingredient:', error);
      setError('Error al eliminar ingrediente');
    }
  };

  const openEditIngredientModal = (ingredient) => {
    setIngredientToEdit(ingredient);
    setIsEditIngredientOpen(true);
  };

  const handleEditIngredientSave = async () => {
    // Recargar ingredientes después de editar
    await loadRecipeData();
    setIsEditIngredientOpen(false);
    setIngredientToEdit(null);
  };

  // Función para actualizar un ingrediente en el estado temporal
  const handleTemporalIngredientUpdate = (updatedIngredient) => {
    const updatedTemporalIngredients = temporalIngredients.map(ingredient =>
      ingredient.ingredient_id === updatedIngredient.ingredient_id
        ? updatedIngredient
        : ingredient
    );
    setTemporalIngredients(updatedTemporalIngredients);
  };

  // Crear un header personalizado con título a la izquierda y botones a la derecha
  const customHeader = (
    <div className="recipe-detail-header">      
      <h1 className="recipe-detail-title">
        {isNewRecipe ? 'Nueva Receta' : (recipe ? recipe.name : 'Detalle de Receta')}
      </h1>
      
      <div className="recipe-detail-header-right">
        <button className="btn secondary recipe-back-btn" onClick={handleBack} title="Volver">
          <FiArrowLeft />
        </button>
        {!isEditing ? (
          <>
            <button className="btn edit" onClick={toggleEdit}>
              <FiEdit3 /> <span className="btn-text">Editar</span>
            </button>
            {!isNewRecipe && (
              <button className="btn delete" onClick={openDeleteModal}>
                <FiTrash2 /> <span className="btn-text">Eliminar</span>
              </button>
            )}
          </>
        ) : (
          <>
            <button className="btn cancel" onClick={() => isNewRecipe ? navigate('/recipes') : setIsEditing(false)}>
              <FiX /> <span className="btn-text">Cancelar</span>
            </button>
            <button className="btn add" onClick={handleSave}>
              <FiSave /> <span className="btn-text">{isNewRecipe ? 'Crear' : 'Guardar'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );

  const recipeContent = () => {
    if (loading) {
      return <Loading message="Cargando receta..." size="large" />;
    }

    if (!recipe) {
      return <div className="error">No se encontró la receta</div>;
    }

    return (
      <div className="recipe-detail-content">
        {/* Basic Information Section */}
        <div className="recipe-section">
          <h2 className="section-title">📋 Información Básica</h2>
          <div className="section-content">
            <div className="form-grid-2">
              <div className="form-field">
                <label className="required-label">Nombre de la receta</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={recipe.name || ''}
                    onChange={(e) => {
                      setRecipe({...recipe, name: e.target.value});
                      if (validationErrors.name) {
                        setValidationErrors({...validationErrors, name: null});
                      }
                    }}
                  />
                ) : (
                  <div className="form-value">{recipe.name}</div>
                )}
              </div>
              <div className="form-field">
                <label>Categorías</label>
                {isEditing ? (
                  <div className="categories-selector">
                    {availableCategories.length > 0 ? (
                      availableCategories.map((category) => (
                        <label key={category.category_id} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.includes(category.category_id)}
                            onChange={(e) => handleCategoryChange(category.category_id, e.target.checked)}
                          />
                          {category.name}
                        </label>
                      ))
                    ) : (
                      <div className="empty-state">Cargando categorías...</div>
                    )}
                  </div>
                ) : (
                  <div className="form-value">
                    {Array.isArray(categories) && categories.length > 0 
                      ? categories.join(', ')
                      : 'Sin categoría'
                    }
                  </div>
                )}
              </div>
            </div>
            
            <div className="form-grid-3">
              <div className="form-field">
                <label>Tiempo de preparación</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="form-input"
                    value={recipe.prep_time || ''}
                    onChange={(e) => setRecipe({...recipe, prep_time: e.target.value})}
                    placeholder="minutos"
                  />
                ) : (
                  <div className="form-value">{recipe.prep_time ? `${recipe.prep_time} min` : 'No especificado'}</div>
                )}
              </div>
              <div className="form-field">
                <label>Dificultad</label>
                {isEditing ? (
                  <select
                    className="form-input"
                    value={recipe.difficulty || ''}
                    onChange={(e) => setRecipe({...recipe, difficulty: e.target.value})}
                  >
                    <option value="">Seleccionar</option>
                    <option value="easy">Fácil</option>
                    <option value="medium">Intermedio</option>
                    <option value="hard">Difícil</option>
                  </select>
                ) : (
                  <div className="form-value">{translateDifficulty(recipe.difficulty) || 'No especificado'}</div>
                )}
              </div>
              <div className="form-field">
                <div className="tooltip-container">
                  <label className="required-label">Raciones mínimas para producción</label>
                  <div className="tooltip-icon">
                    ?
                    <div className="tooltip-text">
                      Las raciones mínimas indican el número mínimo para producir eficientemente esta receta
                    </div>
                  </div>
                </div>
                {isEditing ? (
                  <input
                    type="number"
                    className="form-input"
                    value={recipe.production_servings || ''}
                    onChange={(e) => {
                      setRecipe({...recipe, production_servings: e.target.value});
                      if (validationErrors.production_servings) {
                        setValidationErrors({...validationErrors, production_servings: null});
                      }
                    }}
                    placeholder="Mínimo para producir"
                  />
                ) : (
                  <div className="form-value">{recipe.production_servings || 'No especificado'}</div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Event Planning Section */}
        <div className="recipe-section">
          <h2 className="section-title">📊 Calculadora de Costos</h2>
          <div className="section-content">
            <div className="form-grid-3">
              <div className="form-field">
                <label className="required-label">
                  Comensales {recipe.production_servings ? `(mínimo ${recipe.production_servings})` : ''}
                </label>
                {isEditing ? (
                  <div>
                    <input
                      type="number"
                      className="form-input"
                      value={recipe.servings || ''}
                      min={recipe.production_servings || 1}
                      onChange={(e) => {
                        setRecipe({...recipe, servings: e.target.value});
                        if (validationErrors.servings) {
                          setValidationErrors({...validationErrors, servings: null});
                        }
                      }}
                      placeholder="Para cuántas personas"
                    />
                    {recipe.production_servings && parseInt(recipe.servings) < parseInt(recipe.production_servings) && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#ef4444', 
                        marginTop: '4px',
                        fontStyle: 'italic'
                      }}>
                        Debe ser mínimo {recipe.production_servings} comensales
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="form-value">{recipe.servings || 'No especificado'}</div>
                )}
              </div>
              <div className="form-field">
                <label className="required-label">Precio de venta total</label>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={recipe.net_price || ''}
                    onChange={(e) => {
                      setRecipe({...recipe, net_price: e.target.value});
                      if (validationErrors.net_price) {
                        setValidationErrors({...validationErrors, net_price: null});
                      }
                    }}
                    placeholder="€"
                  />
                ) : (
                  <div className="form-value">{recipe.net_price ? formatCurrency(recipe.net_price) : 'No especificado'}</div>
                )}
              </div>
              <div className="form-field">
                <div className="tooltip-container">
                  <label>Precio por comensal</label>
                  <div className="tooltip-icon">
                    ?
                    <div className="tooltip-text">
                      Cálculo automático dividiendo el precio de venta total entre el número de comensales
                    </div>
                  </div>
                </div>
                <div className="form-value">
                  {recipe.net_price && recipe.servings ? 
                    formatCurrency(parseFloat(recipe.net_price) / parseInt(recipe.servings)) : 
                    'Calculado automáticamente'
                  }
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Ingredients Section */}
        <div className="recipe-section">
          <h2 className="section-title">🥕 Ingredientes</h2>
          <div className="section-content">
            {recipe?.servings && (
              <div className="servings-info" style={{ 
                marginBottom: '16px', 
                padding: '12px', 
                background: '#e0f2fe', 
                borderRadius: '6px',
                fontSize: '14px',
                color: '#0369a1',
                fontWeight: '500'
              }}>
                📊 Cantidades para {recipe.servings} {recipe.servings === 1 ? 'comensal' : 'comensales'}
              </div>
            )}
            {isEditing && getDisplayIngredients()?.length > 0 && (
              <div className="ingredients-header" style={{ marginBottom: '16px' }}>
                <button 
                  className="btn add ingredients-add-btn" 
                  onClick={openAddIngredientModal}
                  style={{ fontSize: '14px', height: '36px', padding: '0 16px' }}
                >
                  Añadir
                </button>
              </div>
            )}
            <div className="ingredients-list">
              {getDisplayIngredients()?.length > 0 ? (
                getDisplayIngredients().map((ingredient, index) => {
                  const wastePercent = parseFloat(ingredient.waste_percent) || 0;
                  const wasteMultiplier = 1 + wastePercent;
                  const quantityPerServing = parseFloat(ingredient.quantity_per_serving) || 0;
                  const price = parseFloat(ingredient.base_price) || 0;
                  
                  // Calcular cantidad total para el número actual de porciones
                  const currentServings = parseInt(recipe?.servings) || 1;
                  const totalQuantity = quantityPerServing * currentServings;
                  const ingredientCost = totalQuantity * price * wasteMultiplier;
                  
                  return (
                    <div key={index} className="ingredient-item">
                      <div className="ingredient-name">{ingredient.name || 'Sin nombre'}</div>
                      <div className="ingredient-quantity">
                        <div className="quantity-total">
                          <strong>{formatDecimal(totalQuantity, 2)} {ingredient.unit || ''}</strong>
                        </div>
                        <div className="quantity-per-serving" style={{ fontSize: '12px', color: '#64748b' }}>
                          ({quantityPerServing} {ingredient.unit} por porción)
                        </div>
                        {wastePercent > 0 && (
                          <span className="waste-info"> (+{formatDecimal(wastePercent * 100, 1)}% merma)</span>
                        )}
                      </div>
                      <div className="ingredient-cost">
                        {formatCurrency(ingredientCost)}
                      </div>
                      {isEditing && (
                        <div className="ingredient-actions" style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          display: 'flex',
                          gap: '4px'
                        }}>
                          <button 
                            className="edit-ingredient-btn"
                            onClick={() => openEditIngredientModal(ingredient)}
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px'
                            }}
                            title="Editar ingrediente"
                          >
                            <FiEdit3 />
                          </button>
                          <button 
                            className="remove-ingredient-btn"
                            onClick={() => openDeleteIngredientModal(ingredient)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '50%',
                              width: '32px',
                              height: '32px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px'
                            }}
                            title="Eliminar ingrediente"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  No hay ingredientes registrados
                  {isEditing && (
                    <div style={{ marginTop: '12px' }}>
                      <button 
                        className="btn add"
                        onClick={openAddIngredientModal}
                        style={{ fontSize: '14px', height: '36px', padding: '0 16px' }}
                      >
                        Añadir primer ingrediente
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cost Analysis Section */}
        <div className="recipe-section">
          <h2 className="section-title">💰 Análisis de Costes</h2>
          <div className="section-content">
            {(() => {
              const metrics = calculateCostMetrics();
              if (!metrics) return <div className="empty-state">Calculando costes...</div>;
              
              return (
                <div className="cost-grid">
                  <div className="cost-card">
                    <div className="cost-label">Coste Total Ingredientes</div>
                    <div className="cost-value primary">{formatCurrency(metrics.totalCost)}</div>
                    <div className="cost-detail">Para {metrics.servings} comensales</div>
                  </div>
                  <div className="cost-card">
                    <div className="cost-label">Coste por Comensal</div>
                    <div className="cost-value">{formatCurrency(metrics.costPerServing)}</div>
                    <div className="cost-detail">Calculado automáticamente</div>
                  </div>
                  <div className="cost-card">
                    <div className="cost-label">Precio de Venta Total</div>
                    <div className="cost-value highlight">{formatCurrency(metrics.totalNetPrice)}</div>
                    <div className="cost-detail">
                      {formatCurrency(metrics.pricePerServing)} por porción
                    </div>
                  </div>
                  <div className="cost-card">
                    <div className="cost-label">Margen de Beneficio</div>
                    <div className={`cost-value ${metrics.currentMargin >= 0 ? 'success' : 'danger'}`}>
                      {formatCurrency(metrics.currentMargin)}
                    </div>
                    <div className="cost-detail">
                      {formatDecimal(metrics.currentMarginPercent, 1)}% sobre precio de venta
                      {metrics.currentMargin < 0 && ' (PÉRDIDA)'}
                    </div>
                  </div>
                  <div className="cost-card">
                    <div className="cost-label">Precio Sugerido (40%)</div>
                    <div className="cost-value success">{formatCurrency(metrics.suggestedPrice40)}</div>
                    <div className="cost-detail">
                      Beneficio: {formatCurrency(metrics.suggestedPrice40 - metrics.costPerServing)}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Nutritional Information */}
        <div className="recipe-section">
          <h2 className="section-title">🍎 Información Nutricional</h2>
          <div className="section-content">
            {nutrition ? (
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <span className="nutrition-label">Calorías</span>
                  <span className="nutrition-value">{nutrition.calories} kcal</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Proteínas</span>
                  <span className="nutrition-value">{nutrition.protein}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Carbohidratos</span>
                  <span className="nutrition-value">{nutrition.carbs}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Grasas</span>
                  <span className="nutrition-value">{nutrition.fat}g</span>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                {isNewRecipe ? 'Añade ingredientes para ver la información nutricional' : 'Calculando información nutricional...'}
              </div>
            )}
          </div>
        </div>

        {/* Instructions Section */}
        <div className="recipe-section">
          <h2 className="section-title">👨‍🍳 Instrucciones</h2>
          <div className="section-content">
            {isEditing ? (
              <textarea
                className="form-textarea instructions-textarea"
                rows="8"
                value={recipe.instructions || ''}
                onChange={(e) => setRecipe({...recipe, instructions: e.target.value})}
                placeholder="Instrucciones paso a paso..."
              />
            ) : (
              <div className="instructions-content">
                {recipe.instructions ? (
                  <pre className="instructions-text">{recipe.instructions}</pre>
                ) : (
                  <div className="empty-state">No hay instrucciones registradas</div>
                )}
              </div>
            )}
          </div>
        </div>        

        {/* Allergens Section */}
        <div className="recipe-section">
          <h2 className="section-title">⚠️ Alérgenos</h2>
          <div className="section-content">
            <div className="allergens-content">
              {allergens?.length > 0 ? (
                <div className="allergens-chips">
                  {allergens.map((allergen, index) => (
                    <span key={index} className="allergen-chip">
                      {allergen.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No hay alérgenos identificados</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="common-page-container">
        <div className="common-page-content">
          {/* Header personalizado con botones a los lados */}
          {customHeader}
          
          {/* Message display - debajo de todo el header */}
          {message && (
            <div className={`page-header-message page-header-message-${messageType} recipe-detail-message`}>
              {message}
            </div>
          )}
          
          {/* Error display */}
          {error && <div className="error">{error}</div>}
          
          {/* Contenido de la receta */}
          {recipeContent()}
        </div>
      </div>

      {/* DELETE MODAL */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar la receta "${recipe?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* ADD INGREDIENT MODAL */}
      <AddIngredientModal
        isOpen={isAddIngredientOpen}
        onClose={() => setIsAddIngredientOpen(false)}
        recipeId={id}
        recipeName={recipe?.name || 'la receta'}
        existingIngredients={getDisplayIngredients()}
        onSave={handleAddIngredientSave}
        isNewRecipe={isNewRecipe}
        onTemporalSave={setTemporalIngredients}
      />

      {/* DELETE INGREDIENT MODAL */}
      <ConfirmModal
        isOpen={isDeleteIngredientOpen}
        onClose={() => setIsDeleteIngredientOpen(false)}
        onConfirm={handleRemoveIngredient}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar el ingrediente "${ingredientToDelete?.name}" de esta receta?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* EDIT INGREDIENT MODAL */}
      <EditIngredientModal
        isOpen={isEditIngredientOpen}
        onClose={() => setIsEditIngredientOpen(false)}
        recipeId={id}
        ingredient={ingredientToEdit}
        onSave={handleEditIngredientSave}
        isNewRecipe={isNewRecipe}
        onTemporalUpdate={handleTemporalIngredientUpdate}
      />
    </>
  );
};

export default RecipeDetail;