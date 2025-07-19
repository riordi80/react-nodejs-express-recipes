// src/components/recipes/RecipeCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { FaClock, FaStar, FaUtensils } from 'react-icons/fa';
import { translateDifficulty } from '../../pages/recipes/Recipes';
import './RecipeCard.css';

export default function RecipeCard({ id, name, thumbnailUrl, prepTime, difficulty, category, onView }) {
  const handleCardClick = (e) => {
    // Evitar que el click en el botón dispare también el click de la card
    if (e.target.closest('.recipe-card-action')) return;
    onView(id);
  };


  return (
    <div className="recipe-card" onClick={handleCardClick}>
      <div className="recipe-card-image-container">
        <img 
          src={thumbnailUrl || '/placeholder.png'} 
          alt={name}
          className="recipe-card-image"
        />
      </div>
      
      <div className="recipe-card-content">
        <div className="recipe-card-header">
          <h3 className="recipe-card-title">{name}</h3>
          {category && (
            <span className="recipe-card-category">
              <FaUtensils />
              {category}
            </span>
          )}
        </div>
        
        <div className="recipe-card-meta">
          <div className="recipe-card-meta-item">
            <FaClock />
            <span>{prepTime}m</span>
          </div>
          <div className="recipe-card-meta-item">
            <FaStar />
            <span>{translateDifficulty(difficulty)}</span>
          </div>
        </div>
      </div>
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
