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
  
  // Colores principales de la aplicación
  primary: '#3b82f6',
  secondary: '#64748b',
  topbar: 'rgb(90, 106, 133)',
  accent: 'rgb(93, 135, 255)',
  
  // Colores específicos del footer
  footer: {
    background: '#fff',
    border: '#eeeeee',
    appName: '#2c3e50',
    version: {
      background: 'linear-gradient(135deg, rgb(93, 135, 255), rgb(66, 101, 204))',
      color: 'white'
    },
    copyright: '#6c757d',
    // Para versión móvil del login
    loginMobile: {
      background: 'linear-gradient(135deg, rgb(66, 101, 204), rgb(93, 135, 255))',
      appName: 'white',
      version: {
        background: 'rgba(255, 255, 255, 0.3)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.4)'
      },
      copyright: 'white'
    }
  }
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