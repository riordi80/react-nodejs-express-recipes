// src/components/recipes/RecipeCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { translateDifficulty } from '../../pages/recipes/Recipes';

export default function RecipeCard({ id, name, thumbnailUrl, prepTime, difficulty, category, onView }) {
  return (
    <div className="recipe-card" onClick={() => onView(id)}>
      <img src={thumbnailUrl || '/placeholder.png'} alt={name} />
      <h3>{name}</h3>
      <div>⏱ {prepTime}m | ⭐ {translateDifficulty(difficulty)}</div>
      {category && <div className="badge">{category}</div>}
      <button className="btn view" onClick={() => onView(id)}>Ver</button>
    </div>
  );
}

RecipeCard.propTypes = {
  id: PropTypes.any.isRequired,
  name: PropTypes.string.isRequired,
  thumbnailUrl: PropTypes.string,
  prepTime: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  difficulty: PropTypes.string.isRequired,
  category: PropTypes.string,
  onView: PropTypes.func.isRequired,
};
