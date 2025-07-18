// src/components/recipes/LoadMoreButton.jsx
import React from 'react';
import PropTypes from 'prop-types';

export default function LoadMoreButton({ onClick }) {
  return (
    <button className="load-more-button" onClick={onClick}>
      Mostrar más
    </button>
  );
}

LoadMoreButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};
