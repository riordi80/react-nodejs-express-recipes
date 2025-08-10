// Opciones exactas del frontend original para mantener consistencia

// Opciones de dificultad de recetas (EXACTO del original)
export const difficultyOptions = [
  { value: 'easy', label: 'Fácil' },
  { value: 'medium', label: 'Intermedio' },
  { value: 'hard', label: 'Difícil' }
]

// Traducciones de dificultad (EXACTO del original)
export const difficultyTranslations = {
  'easy': 'Fácil',
  'medium': 'Intermedio',
  'hard': 'Difícil'
}

// Función para traducir dificultad (EXACTO del original)
export const translateDifficulty = (difficulty: string) => {
  return difficultyTranslations[difficulty as keyof typeof difficultyTranslations] || difficulty
}

// Colores para las etiquetas de dificultad (estilo TotXo)
export const difficultyColors = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
}

// Opciones de tiempo de preparación para filtros (común en el frontend original)
export const prepTimeOptions = [15, 30, 45, 60, 90, 120]

// Opciones de disponibilidad para ingredientes (del frontend original)
export const availabilityOptions = [
  { value: 'all', label: 'Todas las disponibilidades' },
  { value: 'available', label: 'Solo disponibles' },
  { value: 'unavailable', label: 'Solo no disponibles' }
]

// Opciones de estado de stock (del frontend original)
export const stockStatusOptions = [
  { value: 'all', label: 'Todos los stocks' },
  { value: 'low', label: 'Stock bajo' },
  { value: 'withStock', label: 'Con stock' },
  { value: 'noStock', label: 'Sin stock' }
]

// Estados de eventos (del frontend original)
export const eventStatusOptions = [
  { value: 'planificado', label: 'Planificado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'en_preparacion', label: 'En Preparación' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' }
]

// Estados de pedidos (del frontend original)
export const orderStatusOptions = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' }
]

// Categorías por defecto (fallback del frontend original)
export const defaultCategories = [
  { category_id: 1, name: 'Entrante' },
  { category_id: 2, name: 'Principal' },
  { category_id: 3, name: 'Postre' },
  { category_id: 4, name: 'Bebida' },
  { category_id: 5, name: 'Comida vegetariana' },
  { category_id: 6, name: 'Ensaladas' }
]

// Valores por defecto para nuevas recetas (EXACTO del original)
export const defaultRecipeValues = {
  name: '',
  instructions: '',
  prep_time: '',
  servings: 1,
  production_servings: 1,
  difficulty: '',
  net_price: '',
  is_featured_recipe: false,
  tax_id: 1
}

// Valores por defecto para nuevos ingredientes en recetas
export const defaultIngredientValues = {
  quantity_per_serving: '',
  unit: '',
  base_price: '',
  waste_percent: '0',
  section_id: undefined
}