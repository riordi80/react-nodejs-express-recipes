// src/pages/supplier-orders/components/StarRating.jsx
import React from 'react';

const StarRating = ({ rating }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<span key={i} className="star filled">★</span>);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(<span key={i} className="star half">☆</span>);
    } else {
      stars.push(<span key={i} className="star empty">☆</span>);
    }
  }
  return stars;
};

export default StarRating;