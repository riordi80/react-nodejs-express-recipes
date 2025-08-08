// Tipos base para la aplicación

// Usuario y autenticación
export interface User {
  user_id: number
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'chef' | 'supplier_manager'
  restaurant_name?: string
  language?: string
  timezone?: string
}

export interface AuthResponse {
  ok: boolean
  message?: string
  user: User
}

// Ingredientes
export interface Ingredient {
  ingredient_id: number
  name: string
  category: string
  unit: string
  cost_per_unit: number
  stock_quantity?: number
  min_stock_level?: number
  allergens?: string[]
  created_at: string
  updated_at: string
}

// Recetas
export interface Recipe {
  recipe_id: number
  name: string
  description?: string
  difficulty_level: 'facil' | 'medio' | 'dificil'
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  production_servings?: number
  cost_per_serving: number
  category: string
  instructions: string
  image_url?: string
  allergens?: string[]
  created_at: string
  updated_at: string
  ingredients?: RecipeIngredient[]
}

export interface RecipeIngredient {
  ingredient_id: number
  ingredient_name: string
  quantity: number
  unit: string
  cost?: number
}

// Proveedores
export interface Supplier {
  supplier_id: number
  name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  active: boolean
  created_at: string
  updated_at: string
}

// Eventos
export interface Event {
  event_id: number
  name: string
  description?: string
  event_date: string
  event_time?: string
  guests_count: number
  location?: string
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  budget?: number
  notes?: string
  created_at: string
  updated_at: string
  menu?: EventRecipe[]
}

export interface EventRecipe {
  recipe_id: number
  recipe_name: string
  portions: number
  course_type: 'starter' | 'main' | 'side' | 'dessert' | 'beverage'
  notes?: string
}

// Respuestas de API genéricas
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Estados de carga
export interface LoadingState {
  isLoading: boolean
  error: string | null
}

// Notificaciones
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}