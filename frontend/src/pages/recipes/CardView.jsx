// src/pages/recipes/CardView.jsx
import React from 'react';
import { RecipeCard, LoadMoreButton } from '@/components/recipes';

export default function CardView({ recipes, onView, hasMore, onLoadMore }) {
  return (
    <div className="card-view">
      <div className="card-grid">
        {recipes.map(r => (
          <RecipeCard
            key={r.id}
            id={r.id}
            name={r.name}
            prepTime={r.prepTime}
            difficulty={r.difficulty}
            category={r.category}
            onView={onView}
          />
        ))}
      </div>
      {hasMore && <LoadMoreButton onClick={onLoadMore} />}
    </div>
  );
}
