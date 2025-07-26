// src/config/branding.js
// Configuración centralizada del branding de la aplicación

export const BRAND_COLORS = {
  // Colores del logo
  logo: {
    recipes: '#3b82f6',    // Azul para "Recipes"
    api: '#000000'         // Negro para "API"
  },
  
  // Colores RGB para jsPDF (valores 0-255)
  logoRGB: {
    recipes: [59, 130, 246],  // RGB equivalente de #3b82f6
    api: [0, 0, 0]            // RGB equivalente de #000000
  },
  
  // Otros colores de la aplicación que podrían reutilizarse
  primary: '#3b82f6',
  secondary: '#64748b',
  topbar: 'rgb(90, 106, 133)',
  accent: 'rgb(93, 135, 255)'
};

export const BRAND_CONFIG = {
  name: 'RecipesAPI',
  logoText: {
    part1: 'Recipes',
    part2: 'API'
  }
};

// Función helper para obtener colores RGB como array para jsPDF
export const getRGBColor = (colorName) => {
  return BRAND_COLORS.logoRGB[colorName] || [0, 0, 0];
};

// Función helper para obtener colores hex
export const getHexColor = (colorName) => {
  return BRAND_COLORS.logo[colorName] || '#000000';
};