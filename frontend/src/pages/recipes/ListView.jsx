// src/pages/recipes/ListView.jsx
import React from 'react';
import { RecipeRow, Pagination } from '@/components/recipes';

export default function ListView({ recipes, onView, page, totalPages, onPageChange }) {
  return (
    <div className="list-view">
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Tiempo de preparación</th>
            <th>Dificultad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {recipes.map(r => (
            <RecipeRow
              key={r.id}
              id={r.id}
              name={r.name}
              prepTime={r.prepTime}
              difficulty={r.difficulty}
              category={r.category}
              onView={onView}
            />
          ))}
        </tbody>
      </table>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
