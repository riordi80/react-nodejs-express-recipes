// src/config/branding.ts
export const BRAND_CONFIG = {
  name: 'RecetasAPI',
  logoText: {
    part1: 'Recetas',
    part2: 'API'
  },
  colors: {
    recipes: '#ea580c', // orange-600 (para "Recetas")
    api: '#111827',     // gray-900 (para "API")
    icon: '#ea580c'     // orange-600 (para el icono)
  }
}

// Función para obtener colores RGB para jsPDF
export const getRGBColor = (colorKey: keyof typeof BRAND_CONFIG.colors): [number, number, number] => {
  const hex = BRAND_CONFIG.colors[colorKey]
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16) 
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}