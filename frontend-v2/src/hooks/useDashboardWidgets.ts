// hooks/useDashboardWidgets.ts
// Hooks individuales para cada tipo de widget del dashboard

'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

// Tipos de datos para widgets
export interface StockAlert {
  ingredient_id: number;
  name: string;
  stock: number;
  stock_minimum: number;
  unit: string;
  stock_difference: number;
}

export interface SeasonalIngredient {
  ingredient_id: number;
  name: string;
  unit: string;
  season: string;
  stock: number;
  is_available: boolean;
}

export interface SeasonalAlert {
  ingredient_id: number;
  name: string;
  stock: number;
  unit: string;
  alert_type: 'in_season' | 'ending_season' | 'starting_season';
  message: string;
  urgency: 'success' | 'warning' | 'info';
}

export interface UpcomingEvent {
  event_id: number;
  name: string;
  event_date: string;
  event_time?: string;
  guests_count: number;
  location: string;
  status: 'planned' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  budget?: number;
}

export interface EventWithMenu {
  event_id: number;
  event_name: string;
  event_date: string;
  event_time?: string;
  guests_count: number;
  status: string;
  menu_items: Array<{
    recipe_id: number;
    recipe_name: string;
    course_type: string;
    portions: number;
  }>;
}

export interface LatestRecipe {
  recipe_id: number;
  name: string;
  difficulty: string;
  prep_time: number;
  created_at: string;
  cost_per_serving?: number;
  servings: number;
}

export interface RecipesByCategory {
  category_name: string;
  recipe_count: number;
}

export interface PendingOrder {
  order_id: number;
  order_date: string;
  delivery_date?: string;
  status: string;
  total_amount: number;
  supplier_name: string;
  phone?: string;
  email?: string;
  items_count: number;
}

export interface CostTrend {
  ingredient_id: number;
  name: string;
  current_price: number;
  old_price: number;
  change_date: string;
  price_change_percent: number;
  trend_direction: 'increase' | 'decrease' | 'stable';
  days_ago: number;
}

// Hook para alertas de stock bajo
export const useStockAlerts = (limit: number = 5, enabled: boolean = true) => {
  const [data, setData] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/dashboard/low-stock-ingredients?limit=${limit}`);
      setData(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar alertas de stock');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [limit, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para ingredientes de temporada
export const useSeasonalIngredients = (enabled: boolean = true) => {
  const [data, setData] = useState<{ current_month: string; seasonal_ingredients: SeasonalIngredient[] }>({
    current_month: '',
    seasonal_ingredients: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/dashboard/seasonal-ingredients');
      setData(response.data || { current_month: '', seasonal_ingredients: [] });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar ingredientes de temporada');
      setData({ current_month: '', seasonal_ingredients: [] });
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    data: data.seasonal_ingredients, 
    currentMonth: data.current_month,
    loading, 
    error, 
    refetch: fetchData 
  };
};

// Hook para alertas de temporada
export const useSeasonalAlerts = (limit: number = 8, enabled: boolean = true) => {
  const [data, setData] = useState<{ current_month: string; alerts: SeasonalAlert[] }>({
    current_month: '',
    alerts: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/dashboard/seasonal-alerts?limit=${limit}`);
      setData(response.data || { current_month: '', alerts: [] });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar alertas de temporada');
      setData({ current_month: '', alerts: [] });
    } finally {
      setLoading(false);
    }
  }, [limit, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    data: data.alerts, 
    currentMonth: data.current_month,
    loading, 
    error, 
    refetch: fetchData 
  };
};

// Hook para próximos eventos
export const useUpcomingEvents = (limit: number = 5, period: 'week' | 'month' = 'week', enabled: boolean = true) => {
  const [data, setData] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/dashboard/upcoming-events?limit=${limit}&period=${period}`);
      setData(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar eventos próximos');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [limit, period, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para eventos con menús
export const useEventsWithMenus = (limit: number = 5, enabled: boolean = true) => {
  const [data, setData] = useState<EventWithMenu[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/dashboard/events-with-menus?limit=${limit}`);
      setData(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar eventos con menús');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [limit, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para últimas recetas
export const useLatestRecipes = (limit: number = 5, enabled: boolean = true) => {
  const [data, setData] = useState<LatestRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/dashboard/latest-recipes?limit=${limit}`);
      setData(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar últimas recetas');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [limit, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para recetas por categoría
export const useRecipesByCategory = (enabled: boolean = true) => {
  const [data, setData] = useState<RecipesByCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/dashboard/recipes-by-category');
      setData(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar recetas por categoría');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para pedidos pendientes
export const usePendingOrders = (limit: number = 5, enabled: boolean = true) => {
  const [data, setData] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/dashboard/supplier-order-reminders?limit=${limit}`);
      setData(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar pedidos pendientes');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [limit, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para tendencias de costos
export const useCostTrends = (limit: number = 5, enabled: boolean = true) => {
  const [data, setData] = useState<CostTrend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/dashboard/cost-trends?limit=${limit}`);
      setData(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar tendencias de costos');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [limit, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Hook para estadísticas generales
export const useDashboardSummary = (enabled: boolean = true) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/dashboard/summary');
      setData(response.data || {});
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar resumen del dashboard');
      setData({});
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};