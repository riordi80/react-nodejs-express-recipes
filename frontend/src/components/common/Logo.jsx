// src/components/common/Logo.jsx
import React from 'react';
import { BRAND_COLORS, BRAND_CONFIG } from '../../config/branding';

const Logo = ({ 
  className = ""
}) => {
  return (
    <svg
      viewBox="0 0 130 20"
      version="1.1"
      className={className}
      width="220"
      height="40"
    >
      <g>
        <text
          style={{
            fontStyle: 'normal',
            fontVariant: 'normal',
            fontWeight: 'bold',
            fontStretch: 'normal',
            fontSize: '16.0299',
            lineHeight: 'normal',
            fontFamily: 'Montserrat',
            fill: '#ffffff',
            strokeWidth: '0.92676px'
          }}
          x="2"
          y="15"
        >
          <tspan
            style={{
              fontStyle: 'normal',
              fontVariant: 'normal',
              fontWeight: 'bold',
              fontStretch: 'normal',
              fontFamily: 'Montserrat',
              fill: '#000000',
              strokeWidth: '0.92676px'
            }}
            x="2"
            y="15"
          >
            <tspan
              style={{
                fill: BRAND_COLORS.logo.recipes,
                fillOpacity: 1,
                strokeWidth: '0.92676px'
              }}
            >
              {BRAND_CONFIG.logoText.part1}
            </tspan>
            <tspan
              style={{
                fill: BRAND_COLORS.logo.api,
                fillOpacity: 1,
                strokeWidth: '0.92676px'
              }}
            >
              {BRAND_CONFIG.logoText.part2}
            </tspan>
          </tspan>
        </text>
      </g>
    </svg>
  );
};

export default Logo;