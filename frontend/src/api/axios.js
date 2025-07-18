import axios from 'axios';

// Configuración runtime cargada desde public/config.json
let runtimeConfig = null;

// Función para cargar configuración runtime
async function loadRuntimeConfig() {
  if (runtimeConfig !== null) {
    return runtimeConfig; // Ya cargada
  }
  
  try {
    const response = await fetch('/config.json');
    if (response.ok) {
      runtimeConfig = await response.json();
      return runtimeConfig;
    }
  } catch (error) {
    // Silencioso: usar .env fallback
  }
  
  // Fallback a variables de entorno si config.json falla
  runtimeConfig = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
    environment: 'fallback'
  };
  
  return runtimeConfig;
}

// Crear instancia de axios con URL temporal
const api = axios.create({
  baseURL: 'http://localhost:4000/api', // Valor temporal, se actualiza al cargar config
  withCredentials: true,
});

// Cargar configuración e inicializar axios
loadRuntimeConfig().then(config => {
  api.defaults.baseURL = config.apiBaseUrl;
});

// Función para obtener la configuración actual
export const getConfig = () => runtimeConfig;

export default api;
