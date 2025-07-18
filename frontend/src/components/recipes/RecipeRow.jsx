// src/components/recipes/RecipeRow.jsx
import React from 'react';
import PropTypes from 'prop-types';

export default function RecipeRow({ id, name, category, prepTime, difficulty, onView }) {
  return (
    <tr>
      <td>{name}</td>
      <td>{category || '—'}</td>
      <td>{prepTime} min</td>
      <td>{difficulty}</td>
      <td>
        <button onClick={() => onView(id)}>Ver</button>
      </td>
    </tr>
  );
}

RecipeRow.propTypes = {
  id: PropTypes.any.isRequired,
  name: PropTypes.string.isRequired,
  category: PropTypes.string,
  prepTime: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  difficulty: PropTypes.string.isRequired,
  onView: PropTypes.func.isRequired,
};
