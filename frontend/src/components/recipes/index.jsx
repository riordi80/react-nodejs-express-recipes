// src/components/recipes/index.js
export { default as RecipeCard } from './RecipeCard';
export { default as FilterBar } from './FilterBar';
export { default as ViewToggle } from './ViewToggle';

// Placeholder para LoadMoreButton si no existe
export const LoadMoreButton = ({ onClick }) => (
  <button 
    className="btn add"
    onClick={onClick}
    style={{ 
      margin: '20px auto', 
      display: 'block',
      padding: '12px 24px',
      fontSize: '16px'
    }}
  >
    Cargar más recetas
  </button>
);