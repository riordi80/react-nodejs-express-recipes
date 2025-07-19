// src/pages/recipes/CardView.jsx
import React from 'react';
import { RecipeCard, LoadMoreButton } from '@/components/recipes';

export default function CardView({ recipes, onView, hasMore, onLoadMore }) {
  return (
    <div className="card-view">
      <div className="card-grid">
        {recipes.map(r => (
          <RecipeCard
            key={r.recipe_id || r.id}
            id={r.recipe_id || r.id}
            name={r.name}
            thumbnailUrl={r.thumbnail_url || r.thumbnailUrl}
            prepTime={r.prep_time || r.prepTime}
            difficulty={r.difficulty}
            category={r.category}
            onView={onView}
          />
        ))}
      </div>
      {hasMore && <LoadMoreButton onClick={onLoadMore} />}
      {!hasMore && recipes.length > 0 && (
        <div className="total-count">
          Total: {recipes.length} recetas
        </div>
      )}
    </div>
  );
}
