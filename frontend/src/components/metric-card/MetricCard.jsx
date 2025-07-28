// src/components/metric-card/MetricCard.jsx
import React from 'react';

const MetricCard = ({ 
  type = 'primary', // 'primary', 'success', 'highlight', 'warning-style'
  icon: IconComponent, 
  label, 
  value, 
  detail 
}) => {
  return (
    <div className={`metric-card ${type}`}>
      <div className="metric-icon">
        <IconComponent />
      </div>
      <div className="metric-info">
        <div className="metric-label">{label}</div>
        <div className="metric-value">{value}</div>
        <div className="metric-detail">{detail}</div>
      </div>
    </div>
  );
};

export default MetricCard;