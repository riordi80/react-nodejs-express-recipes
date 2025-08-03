// src/pages/recipe-detail/RecipeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit3, FiTrash2, FiSave, FiX, FiPlus } from 'react-icons/fi';
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
  
  // Delete section modal state
  const [isDeleteSectionOpen, setIsDeleteSectionOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  
  // Edit ingredient modal state
  const [isEditIngredientOpen, setIsEditIngredientOpen] = useState(false);
  const [ingredientToEdit, setIngredientToEdit] = useState(null);

  // Section management state
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSection, setEditingSection] = useState(null);
  const [editSectionName, setEditSectionName] = useState('');
  const [realSections, setRealSections] = useState([]); // Secciones reales del backend

  // Drag and drop state
  const [draggedIngredient, setDraggedIngredient] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);

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
      // Primero cargar datos básicos de la receta, ingredientes y secciones reales
      const [recipeResponse, ingredientsResponse, sectionsResponse] = await Promise.all([
        api.get(`/recipes/${id}`),
        api.get(`/recipes/${id}/ingredients`),
        api.get(`/recipes/${id}/sections`)
      ]);
      
      setRecipe(recipeResponse.data);
      setIngredients(ingredientsResponse.data);
      setRealSections(sectionsResponse.data || []);
      
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

  // Función para calcular información nutricional de un ingrediente
  const calculateIngredientNutrition = (ingredient, totalQuantity) => {
    if (!ingredient || !totalQuantity) return null;
    
    // Convertir la cantidad total a gramos según la unidad
    let quantityInGrams = totalQuantity;
    if (ingredient.unit === 'kg') {
      quantityInGrams = totalQuantity * 1000;
    } else if (ingredient.unit === 'L') {
      quantityInGrams = totalQuantity * 1000; // Asumiendo densidad = 1
    } else if (ingredient.unit === 'ml') {
      quantityInGrams = totalQuantity; // ml ≈ gramos para líquidos
    }
    
    const factor = quantityInGrams / 100; // Factor desde per-100g
    
    return {
      calories: Math.round((ingredient.calories_per_100g || 0) * factor),
      protein: formatDecimal((ingredient.protein_per_100g || 0) * factor, 1),
      carbs: formatDecimal((ingredient.carbs_per_100g || 0) * factor, 1),
      fat: formatDecimal((ingredient.fat_per_100g || 0) * factor, 1)
    };
  };

  // Funciones para drag and drop
  const handleDragStart = (e, ingredient) => {
    if (!isEditing) return; // Solo permitir drag en modo edición
    
    console.log('🚀 DRAG START:', ingredient);
    setDraggedIngredient(ingredient);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Para compatibilidad
    
    // Añadir clase visual al elemento arrastrado
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIngredient(null);
    setDragOverSection(null);
  };

  const handleDragOver = (e, sectionKey) => {
    if (!draggedIngredient) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSection(sectionKey);
  };

  const handleDragLeave = (e) => {
    // Solo quitar el highlight si realmente salimos del área
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverSection(null);
    }
  };

  const handleDrop = async (e, targetSectionKey, targetSectionName) => {
    e.preventDefault();
    
    console.log('🎯 DROP EVENT:', {
      draggedIngredient,
      targetSectionKey,
      targetSectionName,
      isNewRecipe
    });
    
    if (!draggedIngredient) {
      console.log('❌ No hay ingrediente arrastrado');
      return;
    }
    
    // Determinar el section_id de destino
    let targetSectionId = null;
    if (targetSectionKey !== 'sin-seccion') {
      targetSectionId = targetSectionKey;
    }

    console.log('🔄 Target section ID:', targetSectionId);

    try {
      if (isNewRecipe) {
        // Para recetas nuevas, solo actualizamos localmente
        console.log('⚠️ Receta nueva: actualizando solo localmente');
        
        // Actualizar el ingrediente en el estado local
        const updatedIngredients = ingredients.map(ing => 
          ing.ingredient_id === draggedIngredient.ingredient_id 
            ? { ...ing, section_id: targetSectionId, section_name: targetSectionName }
            : ing
        );
        
        setIngredients(updatedIngredients);
        notify(`Ingrediente movido a "${targetSectionName}"`, 'success');
      } else {
        // Para recetas existentes, actualizar en el backend
        console.log('🔄 Actualizando en backend...');
        
        await api.put(`/recipes/${id}/ingredients/${draggedIngredient.ingredient_id}/section`, {
          section_id: targetSectionId
        });
        
        // Actualizar el ingrediente en el estado local
        const updatedIngredients = ingredients.map(ing => 
          ing.ingredient_id === draggedIngredient.ingredient_id 
            ? { ...ing, section_id: targetSectionId, section_name: targetSectionName }
            : ing
        );
        
        setIngredients(updatedIngredients);
        console.log('✅ Ingrediente movido y guardado en backend');
        notify(`Ingrediente movido a "${targetSectionName}"`, 'success');
      }
    } catch (error) {
      console.error('❌ Error moving ingredient:', error);
      notify('Error al mover el ingrediente', 'error');
    }
    
    setDraggedIngredient(null);
    setDragOverSection(null);
  };

  // Función para agrupar ingredientes por secciones usando las secciones reales del backend
  const groupIngredientsBySection = () => {
    const ingredients = getDisplayIngredients();
    
    console.log('📋 Agrupando ingredientes:', ingredients);
    console.log('🏗️ Secciones reales del backend:', realSections);

    if (realSections.length === 0) {
      // Fallback: usar el comportamiento anterior si no hay secciones del backend
      return groupIngredientsBySection_fallback();
    }

    // Crear estructura base con las secciones reales del backend
    const sectionsMap = {};
    
    // Inicializar todas las secciones reales (vacías)
    realSections.forEach(section => {
      sectionsMap[section.section_id] = {
        key: section.section_id.toString(),
        id: section.section_id,
        name: section.name,
        ingredients: []
      };
    });

    // Array para ingredientes sin sección válida (temporal)
    const ingredientsWithoutSection = [];

    // Distribuir ingredientes según su section_id real
    if (ingredients && ingredients.length > 0) {
      ingredients.forEach(ingredient => {
        console.log(`🏷️ Ingrediente "${ingredient.name}": section_id=${ingredient.section_id}, section_name="${ingredient.section_name}"`);
        
        const ingredientSectionId = ingredient.section_id;
        
        // Buscar la sección correcta por section_id
        if (ingredientSectionId && sectionsMap[ingredientSectionId]) {
          sectionsMap[ingredientSectionId].ingredients.push(ingredient);
        } else {
          // Si no encuentra la sección, guardarlo temporalmente
          console.warn(`⚠️ Ingrediente "${ingredient.name}" tiene section_id=${ingredientSectionId} que no existe en realSections.`);
          ingredientsWithoutSection.push(ingredient);
        }
      });
    }

    // Solo crear sección "Principal" si realmente hay ingredientes sin sección válida
    if (ingredientsWithoutSection.length > 0) {
      sectionsMap['principal'] = {
        key: 'principal',
        id: null,
        name: 'Principal',
        ingredients: ingredientsWithoutSection
      };
    }

    // Convertir a array - mostrar secciones reales aunque estén vacías
    const result = Object.values(sectionsMap)
      .sort((a, b) => {
        if (a.key === 'principal') return 1;
        if (b.key === 'principal') return -1;
        return a.name.localeCompare(b.name);
      });
      
    console.log('📊 Secciones agrupadas (usando backend):', result);
    return result;
  };

  // Función de fallback para cuando no se pueden cargar las secciones del backend
  const groupIngredientsBySection_fallback = () => {
    const ingredients = getDisplayIngredients();
    if (!ingredients || ingredients.length === 0) return [];

    const grouped = ingredients.reduce((sections, ingredient) => {
      const sectionKey = ingredient.section_name || ingredient.section_id || 'sin-seccion';
      const sectionName = ingredient.section_name || (ingredient.section_id ? `Sección ${ingredient.section_id}` : 'Principal');
      
      if (!sections[sectionKey]) {
        sections[sectionKey] = {
          name: sectionName,
          id: ingredient.section_id || null,
          ingredients: []
        };
      }
      
      sections[sectionKey].ingredients.push(ingredient);
      return sections;
    }, {});

    return Object.entries(grouped)
      .map(([key, section]) => ({ key, id: section.id, name: section.name, ingredients: section.ingredients }))
      .sort((a, b) => {
        if (a.key === 'sin-seccion') return 1;
        if (b.key === 'sin-seccion') return -1;
        return a.name.localeCompare(b.name);
      });
  };

  // ===== FUNCIONES PARA GESTIÓN DE SECCIONES =====

  // Función para obtener las secciones reales desde el backend
  const getRealSections = async () => {
    try {
      const response = await api.get(`/recipes/${id}/sections`);
      console.log('📡 Respuesta del backend:', response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching real sections:', err);
      return [];
    }
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim()) {
      notify('El nombre de la sección es obligatorio', 'error');
      return;
    }

    try {
      await api.post(`/recipes/${id}/sections`, {
        name: newSectionName.trim()
      });

      setNewSectionName('');
      setIsAddSectionOpen(false);
      await loadRecipeData();
      notify('Sección creada correctamente');
    } catch (err) {
      console.error('Error creating section:', err);
      notify(err.response?.data?.message || 'Error al crear la sección', 'error');
    }
  };

  const handleEditSection = async (sectionId, sectionName) => {
    try {
      console.log('🖊️ Iniciando edición de sección:', { sectionId, sectionName });
      
      // Usar el nombre de la sección como identificador para evitar problemas con IDs inconsistentes
      setEditingSection(sectionName); // Usar nombre en lugar de ID
      setEditSectionName(sectionName); // Mantener el nombre original para edición
    } catch (error) {
      console.error('Error en handleEditSection:', error);
      alert(`ERROR: ${error.message}`);
    }
  };

  const handleSaveSection = async (sectionNameOrId) => {
    if (!editSectionName.trim()) {
      notify('El nombre de la sección es obligatorio', 'error');
      return;
    }

    try {
      // Obtener las secciones reales del backend
      const realSections = await getRealSections();
      
      // Mapear nombres de sección frontend a nombres del backend
      const sectionNameMap = {
        'Condimentos': 'Aliño',
        'Pescado': 'Verduras',
        'Ingredientes principales': 'Base'
      };
      
      // Determinar el nombre actual que se está editando
      const currentSectionName = editingSection; // editingSection ahora contiene el nombre
      const mappedName = sectionNameMap[currentSectionName] || currentSectionName;
      
      // Buscar la sección real por el nombre mapeado
      const realSection = realSections.find(s => s.name === mappedName);
      
      if (!realSection) {
        notify(`Error: No se encontró la sección "${mappedName}" en el backend`, 'error');
        return;
      }

      console.log('🔧 Actualizando sección:', { 
        originalName: currentSectionName, 
        mappedName, 
        sectionId: realSection.section_id, 
        newName: editSectionName.trim(), 
        recipeId: id 
      });
      
      await api.put(`/recipes/${id}/sections/${realSection.section_id}`, {
        name: editSectionName.trim()
      });

      setEditingSection(null);
      setEditSectionName('');
      await loadRecipeData();
      notify('Sección actualizada correctamente');
    } catch (err) {
      console.error('Error updating section:', err);
      notify(err.response?.data?.message || 'Error al actualizar la sección', 'error');
    }
  };

  const openDeleteSectionModal = (section) => {
    setSectionToDelete(section);
    setIsDeleteSectionOpen(true);
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;

    try {
      await api.delete(`/recipes/${id}/sections/${sectionToDelete.id}`);
      await loadRecipeData();
      notify('Sección eliminada correctamente');
      setIsDeleteSectionOpen(false);
      setSectionToDelete(null);
    } catch (err) {
      console.error('Error deleting section:', err);
      const errorMessage = err.response?.data?.message || 'Error al eliminar la sección';
      notify(errorMessage, 'error');
      setIsDeleteSectionOpen(false);
      setSectionToDelete(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditSectionName('');
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
          <div style={{ marginBottom: '8px' }}>
            <h2 className="section-title">🥕 Ingredientes</h2>
            {isEditing && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', marginRight: '24px', marginLeft: '24px' }}>
                <button
                  type="button"
                  className="btn add"
                  onClick={() => setIsAddIngredientOpen(true)}
                >
                  <FiPlus /> <span className="btn-text">Añadir Ingrediente</span>
                </button>
                <button
                  type="button"
                  className="btn add"
                  onClick={() => setIsAddSectionOpen(true)}
                >
                  <FiPlus /> <span className="btn-text">Añadir Sección</span>
                </button>
              </div>
            )}
          </div>
          
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
            <div className="ingredients-sections">
              {getDisplayIngredients()?.length > 0 ? (
                groupIngredientsBySection().map((section, sectionIndex) => (
                  <div 
                    key={section.key} 
                    className={`ingredient-section-card ${dragOverSection === section.key ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, section.key)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, section.key, section.name)}
                  >
                    <div className="section-header">
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '48px' }}>
                        <div style={{ flex: 1 }}>
                          {editingSection === section.name ? (
                            <input
                              type="text"
                              className="form-input"
                              value={editSectionName}
                              onChange={(e) => setEditSectionName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveSection(section.name);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              style={{ 
                                margin: 0, 
                                padding: '12px',
                                fontSize: '16px',
                                fontWeight: '600',
                                width: '100%',
                                height: '48px',
                                border: '2px solid #3b82f6',
                                borderRadius: '4px',
                                background: '#ffffff',
                                boxSizing: 'border-box',
                                lineHeight: '1.2'
                              }}
                              autoFocus
                            />
                          ) : (
                            <h4 className="section-title" style={{ 
                              margin: 0, 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              height: '48px',
                              lineHeight: '1.2'
                            }}>
                              🥕 {section.name}
                            </h4>
                          )}
                        </div>
                        <div className="section-count">
                          {section.ingredients.length} {section.ingredients.length === 1 ? 'ingrediente' : 'ingredientes'}
                        </div>
                      </div>
                      {isEditing && section.id && (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {editingSection === section.name ? (
                            <>
                              <button 
                                onClick={() => handleSaveSection(section.name)}
                                title="Guardar cambios"
                                className="btn"
                                style={{
                                  background: '#059669',
                                  border: '1px solid #059669',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  padding: '4px 6px',
                                  height: '28px',
                                  minWidth: 'auto'
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20,6 9,17 4,12"></polyline>
                                </svg>
                                Guardar
                              </button>
                              <button 
                                onClick={handleCancelEdit}
                                title="Cancelar edición"
                                className="btn cancel"
                                style={{
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  color: '#374151',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  padding: '4px 6px',
                                  height: '28px',
                                  minWidth: 'auto'
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleEditSection(section.id, section.name)}
                                title="Editar sección"
                                className="btn"
                                style={{
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  color: '#374151',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  padding: '4px 6px',
                                  height: '28px',
                                  minWidth: 'auto'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#e2e8f0';
                                  e.target.style.borderColor = '#cbd5e1';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#f8fafc';
                                  e.target.style.borderColor = '#e2e8f0';
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                  <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                                Editar
                              </button>
                              <button 
                                onClick={() => openDeleteSectionModal(section)}
                                title="Eliminar sección"
                                className="btn"
                                style={{
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                  color: '#374151',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  padding: '4px 6px',
                                  height: '28px',
                                  minWidth: 'auto'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = '#fef2f2';
                                  e.target.style.borderColor = '#fecaca';
                                  e.target.style.color = '#dc2626';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = '#f8fafc';
                                  e.target.style.borderColor = '#e2e8f0';
                                  e.target.style.color = '#374151';
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3,6 5,6 21,6"></polyline>
                                  <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                                </svg>
                                Eliminar
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="ingredients-list">
                      {section.ingredients.map((ingredient, index) => {
                  const wastePercent = parseFloat(ingredient.waste_percent) || 0;
                  const wasteMultiplier = 1 + wastePercent;
                  const quantityPerServing = parseFloat(ingredient.quantity_per_serving) || 0;
                  const price = parseFloat(ingredient.base_price) || 0;
                  
                  // Calcular cantidad total para el número actual de porciones
                  const currentServings = parseInt(recipe?.servings) || 1;
                  const totalQuantity = quantityPerServing * currentServings;
                  const ingredientCost = totalQuantity * price * wasteMultiplier;
                  
                  // Calcular información nutricional para la cantidad total
                  const nutrition = calculateIngredientNutrition(ingredient, totalQuantity);
                  
                  return (
                    <div 
                      key={index} 
                      className={`ingredient-item ${isEditing ? 'draggable' : ''}`}
                      draggable={isEditing}
                      onDragStart={(e) => handleDragStart(e, ingredient)}
                      onDragEnd={handleDragEnd}
                    >
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
                      
                      <div className="ingredient-cost-row">
                        {/* Información Nutricional - solo icono y valores principales */}
                        {nutrition && nutrition.calories > 0 && (
                          <span className="ingredient-nutrition">
                            🔥 {nutrition.calories}kcal
                          </span>
                        )}
                        <div className="ingredient-cost">
                          {formatCurrency(ingredientCost)}
                        </div>
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
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  {isEditing ? 
                    "Usa el botón 'Añadir Ingrediente' de arriba para empezar a añadir ingredientes a esta receta." :
                    "No hay ingredientes registrados"
                  }
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
        existingSections={groupIngredientsBySection()}
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

      {/* ADD SECTION MODAL */}
      {isAddSectionOpen && (
        <div className="modal-overlay" onClick={() => setIsAddSectionOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Añadir Nueva Sección</h3>
              <button 
                className="modal-close"
                onClick={() => setIsAddSectionOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label className="required-label">Nombre de la sección</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Condimentos, Verduras..."
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newSectionName.trim()) {
                      handleAddSection();
                    }
                    if (e.key === 'Escape') {
                      setIsAddSectionOpen(false);
                    }
                  }}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn cancel"
                onClick={() => setIsAddSectionOpen(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn add"
                onClick={handleAddSection}
                disabled={!newSectionName.trim()}
              >
                Añadir Sección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SECTION MODAL */}
      <ConfirmModal
        isOpen={isDeleteSectionOpen}
        onClose={() => setIsDeleteSectionOpen(false)}
        onConfirm={handleDeleteSection}
        title="Confirmar eliminación"
        message={`¿Estás seguro de que deseas eliminar la sección "${sectionToDelete?.name}"?`}
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