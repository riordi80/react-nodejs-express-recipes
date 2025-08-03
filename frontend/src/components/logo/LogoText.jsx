// src/components/logo/LogoText.jsx
import React from 'react';
import { BRAND_COLORS, BRAND_CONFIG } from '../../config/branding';

const LogoText = ({ 
  className = "",
  recipesColor = BRAND_COLORS.logo.recipes,
  apiColor = BRAND_COLORS.logo.api,
  size = "16px",
  weight = "600",
  // Props especiales para casos específicos como footer móvil
  variant = "default" // "default" | "footer-mobile-login"
}) => {
  // Override de colores para variantes específicas
  let finalRecipesColor = recipesColor;
  let finalApiColor = apiColor;
  
  if (variant === "footer-mobile-login") {
    finalRecipesColor = BRAND_COLORS.footer.loginMobile.appName;
    finalApiColor = BRAND_COLORS.footer.loginMobile.appName;
  }
  
  return (
    <span 
      className={className}
      style={{
        fontSize: size,
        fontWeight: weight,
        fontFamily: 'inherit'
      }}
    >
      <span style={{ color: finalRecipesColor }}>
        {BRAND_CONFIG.logoText.part1}
      </span>
      <span style={{ color: finalApiColor }}>
        {BRAND_CONFIG.logoText.part2}
      </span>
    </span>
  );
};

export default LogoText;