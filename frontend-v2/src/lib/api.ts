import axios from 'axios';

// Tipo para la configuración
type RuntimeConfig = {
  apiBaseUrl: string;
  environment: string;
  multitenant?: boolean;
  tenantBaseUrl?: string;
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
export const apiGet = async <T = any>(url: string, config?: any) => {
  console.log('🔍 ApiGet llamada:', url);
  
  // Esperar a que la configuración esté lista
  if (!configReady) {
    console.log('⏳ Esperando configuración runtime...');
    await configPromise;
  }
  
  console.log('📍 BaseURL actual:', api.defaults.baseURL);
  console.log('🏗️ Config ready:', configReady);
  console.log('🌐 Runtime config:', runtimeConfig);
  
  return api.get<T>(url, config);
};

export const apiPost = async <T = any>(url: string, data?: any, config?: any) => {
  console.log('🚀 ApiPost llamada:', url, 'con datos:', data);
  
  // Esperar a que la configuración esté lista
  if (!configReady) {
    console.log('⏳ Esperando configuración runtime para POST...');
    await configPromise;
  }
  
  console.log('📍 BaseURL actual:', api.defaults.baseURL);
  return api.post<T>(url, data, config);
};

export const apiPut = async <T = any>(url: string, data?: any, config?: any) => {
  // Esperar a que la configuración esté lista
  if (!configReady) {
    console.log('⏳ Esperando configuración runtime para PUT...');
    await configPromise;
  }
  
  return api.put<T>(url, data, config);
};

export const apiDelete = async <T = any>(url: string, config?: any) => {
  // Esperar a que la configuración esté lista
  if (!configReady) {
    console.log('⏳ Esperando configuración runtime para DELETE...');
    await configPromise;
  }
  
  return api.delete<T>(url, config);
};

// Función para detectar si estamos en un dominio principal
export const isMainDomain = async () => {
  if (typeof window === 'undefined') return false;
  
  const config = await waitForConfig();
  const hostname = window.location.hostname;
  
  // Si no es multitenant, siempre es dominio principal (desarrollo local)
  if (!config.multitenant) return true;
  
  const tenantBaseUrl = config.tenantBaseUrl || 'localhost';
  
  // Lista de dominios principales
  const mainDomains = [
    tenantBaseUrl,
    `www.${tenantBaseUrl}`,
    `recipes.${tenantBaseUrl}`,
    'localhost'
  ];
  
  return mainDomains.includes(hostname);
};

export default api;