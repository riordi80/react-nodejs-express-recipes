import React from 'react';
import './Loading.css';

const Loading = ({ 
  message = 'Cargando...', 
  size = 'medium',
  center = true,
  inline = false 
}) => {
  const containerClass = `loading-container ${
    center ? 'center' : ''
  } ${
    inline ? 'inline' : ''
  } size-${size}`;

  return (
    <div className={containerClass}>
      <div className="loading-spinner"></div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default Loading;