import axios from 'axios';

// Tipo para la configuración
type RuntimeConfig = {
  apiBaseUrl: string;
  environment: string;
};

// Configuración runtime similar al frontend original
let runtimeConfig: RuntimeConfig | null = null;

// Función para cargar configuración runtime
async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (runtimeConfig !== null) {
    return runtimeConfig;
  }
  
  try {
    const response = await fetch('/config.json');
    if (response.ok) {
      const config = await response.json() as RuntimeConfig;
      runtimeConfig = config;
      return config;
    }
  } catch (error) {
    // Silencioso: usar fallback de variables de entorno
  }
  
  // Fallback a variables de entorno si config.json falla
  const fallbackConfig: RuntimeConfig = {
    apiBaseUrl: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api',
    environment: 'fallback'
  };
  
  runtimeConfig = fallbackConfig;
  return fallbackConfig;
}

// Crear instancia de axios con URL de variables de entorno
const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable para rastrear si la configuración está lista
let configReady = false;

// Cargar configuración e inicializar axios
const configPromise = loadRuntimeConfig().then(config => {
  api.defaults.baseURL = config.apiBaseUrl;
  configReady = true;
  return config;
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo redirigir en rutas que REQUIEREN autenticación (dashboard, etc.)
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        
        // Solo redirigir si estamos en rutas protegidas (dashboard)
        const isProtectedRoute = pathname.startsWith('/dashboard') || 
                                pathname.startsWith('/recipes') || 
                                pathname.startsWith('/ingredients') ||
                                pathname.startsWith('/suppliers') ||
                                pathname.startsWith('/events') ||
                                pathname.startsWith('/orders') ||
                                pathname.startsWith('/settings');
        
        // No redirigir si ya estamos en login o en rutas públicas
        if (isProtectedRoute && !pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Funciones de utilidad
export const getConfig = () => runtimeConfig;
export const waitForConfig = () => configPromise;
export const isConfigReady = () => configReady;

// Utilidades API (ya incluyen /api en la baseURL)
export const apiGet = <T = any>(url: string, config?: any) => 
  api.get<T>(url, config);

export const apiPost = <T = any>(url: string, data?: any, config?: any) => 
  api.post<T>(url, data, config);

export const apiPut = <T = any>(url: string, data?: any, config?: any) => 
  api.put<T>(url, data, config);

export const apiDelete = <T = any>(url: string, config?: any) => 
  api.delete<T>(url, config);

export default api;