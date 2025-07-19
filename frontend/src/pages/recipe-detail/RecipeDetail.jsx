// src/pages/recipe-detail/RecipeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit3, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import BasePage from '../../components/BasePage';
import Modal from '../../components/modal/Modal';
import AddIngredientModal from './components/AddIngredientModal';
import EditIngredientModal from './components/EditIngredientModal';
import api from '../../api/axios';
import { translateDifficulty } from '../recipes/Recipes';
import './RecipeDetail.css';

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewRecipe = id === 'new';
  
  const [recipe, setRecipe] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [allergens, setAllergens] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(isNewRecipe); // Nueva receta empieza en modo edición
  
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
      console.warn('Error loading available categories:', err);
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
        console.warn('Error loading nutrition:', nutritionErr);
        setNutrition(null); // Fallback a null
      }
      
      // Cargar alérgenos por separado para no fallar toda la carga si hay error
      try {
        const allergensResponse = await api.get(`/recipes/${id}/allergens`);
        setAllergens(allergensResponse.data);
      } catch (allergensErr) {
        console.warn('Error loading allergens:', allergensErr);
        setAllergens([]); // Fallback a array vacío
      }
      
      // Luego buscar las categorías en el listado usando el nombre de la receta
      try {
        const recipesListResponse = await api.get(`/recipes`);
        const recipeWithCategories = recipesListResponse.data.find(r => r.recipe_id === parseInt(id));
        if (recipeWithCategories && recipeWithCategories.categories) {
          // Asegurar que categories sea un array
          const cats = Array.isArray(recipeWithCategories.categories) 
            ? recipeWithCategories.categories 
            : [recipeWithCategories.categories];
          setCategories(cats);
        } else {
          setCategories([]);
        }
      } catch (categoriesErr) {
        console.warn('Error loading categories:', categoriesErr);
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
      if (isNewRecipe) {
        // Crear nueva receta
        const response = await api.post('/recipes', recipe);
        const newRecipeId = response.data.id;
        
        // Guardar categorías seleccionadas si hay
        if (selectedCategoryIds.length > 0) {
          try {
            await api.put(`/recipes/${newRecipeId}/categories`, { 
              categoryIds: selectedCategoryIds 
            });
          } catch (categoryErr) {
            console.warn('Error saving categories:', categoryErr);
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
        // Actualizar receta existente
        await api.put(`/recipes/${id}`, recipe);
        
        // Guardar categorías seleccionadas si hay cambios
        if (selectedCategoryIds.length > 0) {
          try {
            await api.put(`/recipes/${id}/categories`, { 
              categoryIds: selectedCategoryIds 
            });
          } catch (categoryErr) {
            console.warn('Error saving categories:', categoryErr);
          }
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

    const costPerServing = parseFloat(recipe.cost_per_serving) || 0;
    const netPrice = parseFloat(recipe.net_price) || 0;
    const servings = parseInt(recipe.servings) || 1;
    const totalCost = costPerServing * servings;
    
    // Calcular margen y precio sugerido
    const currentMargin = netPrice - costPerServing;
    const currentMarginPercent = netPrice > 0 ? ((netPrice - costPerServing) / netPrice) * 100 : 0;
    const suggestedPrice40 = costPerServing > 0 ? costPerServing / 0.6 : 0; // 40% margen

    return {
      totalCost,
      costPerServing,
      netPrice,
      currentMargin,
      currentMarginPercent,
      suggestedPrice40
    };
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || isNaN(value)) return '€0.00';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '€0.00';
    return `€${numValue.toFixed(2)}`;
  };


  // Manejar selección de categorías
  const handleCategoryChange = (categoryId, isChecked) => {
    if (isChecked) {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
    } else {
      setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== categoryId));
    }
  };

  // Inicializar categorías seleccionadas cuando se entra en modo edición
  const toggleEdit = () => {
    if (!isEditing && categories.length > 0) {
      // Cuando se entra en modo edición, mapear nombres de categorías a IDs
      const categoryIds = categories.map(categoryName => {
        const found = availableCategories.find(cat => cat.name === categoryName);
        return found ? found.category_id : null;
      }).filter(id => id !== null);
      setSelectedCategoryIds(categoryIds);
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
      await api.delete(`/recipes/${id}/ingredients/${ingredientToDelete.ingredient_id}`);
      // Recargar ingredientes después de eliminar
      await loadRecipeData();
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

  const customActions = (
    <div className="recipe-detail-actions">
      <button className="btn back-btn" onClick={handleBack}>
        <FiArrowLeft />
      </button>
      {!isEditing ? (
        <>
          <button className="btn edit" onClick={toggleEdit}>
            <FiEdit3 /> Editar
          </button>
          {!isNewRecipe && (
            <button className="btn delete" onClick={openDeleteModal}>
              <FiTrash2 /> Eliminar
            </button>
          )}
        </>
      ) : (
        <>
          <button className="btn cancel" onClick={() => isNewRecipe ? navigate('/recipes') : setIsEditing(false)}>
            <FiX /> Cancelar
          </button>
          <button className="btn add" onClick={handleSave}>
            <FiSave /> {isNewRecipe ? 'Crear' : 'Guardar'}
          </button>
        </>
      )}
    </div>
  );

  const recipeContent = () => {
    if (loading) {
      return <div className="loading">Cargando receta...</div>;
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
                <label>Nombre de la receta</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={recipe.name || ''}
                    onChange={(e) => setRecipe({...recipe, name: e.target.value})}
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
                <label>Porciones</label>
                {isEditing ? (
                  <input
                    type="number"
                    className="form-input"
                    value={recipe.servings || ''}
                    onChange={(e) => setRecipe({...recipe, servings: e.target.value})}
                  />
                ) : (
                  <div className="form-value">{recipe.servings || 'No especificado'}</div>
                )}
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
                📊 Cantidades para {recipe.servings} {recipe.servings === 1 ? 'porción' : 'porciones'}
              </div>
            )}
            {isEditing && (
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
              {ingredients?.length > 0 ? (
                ingredients.map((ingredient, index) => {
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
                          <strong>{totalQuantity.toFixed(2)} {ingredient.unit || ''}</strong>
                        </div>
                        <div className="quantity-per-serving" style={{ fontSize: '12px', color: '#64748b' }}>
                          ({quantityPerServing} {ingredient.unit} por porción)
                        </div>
                        {wastePercent > 0 && (
                          <span className="waste-info"> (+{(wastePercent * 100).toFixed(1)}% merma)</span>
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
                        Añadir Primer Ingrediente
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
                    <div className="cost-detail">Para {recipe.servings} porciones</div>
                  </div>
                  <div className="cost-card">
                    <div className="cost-label">Coste por Porción</div>
                    <div className="cost-value">{formatCurrency(metrics.costPerServing)}</div>
                    <div className="cost-detail">Calculado automáticamente</div>
                  </div>
                  <div className="cost-card">
                    <div className="cost-label">Precio de Venta Actual</div>
                    <div className="cost-value highlight">{formatCurrency(metrics.netPrice)}</div>
                    <div className="cost-detail">
                      Margen: {formatCurrency(metrics.currentMargin)} ({metrics.currentMarginPercent.toFixed(1)}%)
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
          <h2 className="section-title">🍎 Información Nutricional por porción</h2>
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
      <BasePage
        title={isNewRecipe ? 'Nueva Receta' : (recipe ? recipe.name : 'Detalle de Receta')}
        loading={loading}
        error={error}
        actions={customActions}
        showSearch={false}
        customContent={recipeContent()}
      />

      {/* DELETE MODAL */}
      <Modal isOpen={isDeleteOpen} title="Confirmar eliminación" onClose={() => setIsDeleteOpen(false)}>
        <p>¿Seguro que deseas eliminar la receta <strong>{recipe?.name}</strong>?</p>
        <div className="modal-actions">
          <button type="button" className="btn cancel" onClick={() => setIsDeleteOpen(false)}>Cancelar</button>
          <button type="button" className="btn delete" onClick={handleDelete}>Eliminar</button>
        </div>
      </Modal>

      {/* ADD INGREDIENT MODAL */}
      <AddIngredientModal
        isOpen={isAddIngredientOpen}
        onClose={() => setIsAddIngredientOpen(false)}
        recipeId={id}
        recipeName={recipe?.name || 'la receta'}
        existingIngredients={ingredients}
        onSave={handleAddIngredientSave}
      />

      {/* DELETE INGREDIENT MODAL */}
      <Modal isOpen={isDeleteIngredientOpen} title="Confirmar eliminación" onClose={() => setIsDeleteIngredientOpen(false)}>
        <p>¿Estás seguro de que deseas eliminar el ingrediente <strong>{ingredientToDelete?.name}</strong> de esta receta?</p>
        <div className="modal-actions">
          <button type="button" className="btn cancel" onClick={() => setIsDeleteIngredientOpen(false)}>Cancelar</button>
          <button type="button" className="btn delete" onClick={handleRemoveIngredient}>Eliminar</button>
        </div>
      </Modal>

      {/* EDIT INGREDIENT MODAL */}
      <EditIngredientModal
        isOpen={isEditIngredientOpen}
        onClose={() => setIsEditIngredientOpen(false)}
        recipeId={id}
        ingredient={ingredientToEdit}
        onSave={handleEditIngredientSave}
      />
    </>
  );
};

export default RecipeDetail;