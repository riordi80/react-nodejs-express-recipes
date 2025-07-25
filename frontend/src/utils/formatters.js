// utils/formatters.js
// Funciones de formateo para la aplicación

/**
 * Formatea un valor numérico como moneda europea
 * - Usa coma como separador decimal
 * - Coloca el símbolo de euro al final sin espacio
 * - Ejemplo: 1234.56 -> "1.234,56€"
 */
export const formatCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '0,' + '0'.repeat(decimals) + '€';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '0,' + '0'.repeat(decimals) + '€';
  
  const formatted = numValue.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  
  return `${formatted}€`;
};

/**
 * Formatea un número con separadores de miles y coma decimal
 * Sin símbolo de moneda
 * - Ejemplo: 1234.56 -> "1.234,56"
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return decimals > 0 ? '0,' + '0'.repeat(decimals) : '0';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return decimals > 0 ? '0,' + '0'.repeat(decimals) : '0';
  
  return numValue.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Formatea un número decimal simple con coma
 * Para reemplazar usos de toFixed()
 * - Ejemplo: 1234.567 -> "1234,57" (con 2 decimales por defecto)
 */
export const formatDecimal = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return decimals > 0 ? '0,' + '0'.repeat(decimals) : '0';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return decimals > 0 ? '0,' + '0'.repeat(decimals) : '0';
  
  return numValue.toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: false // Sin separadores de miles para números simples
  });
};

/**
 * Formatea un porcentaje
 * - Ejemplo: 0.1556 -> "15,56%"
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '0,00%';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '0,00%';
  
  return (numValue * 100).toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }) + '%';
};

/**
 * Convierte un string con formato europeo (coma decimal) a número
 * Para procesar valores de inputs antes de enviar al backend
 * - Ejemplo: "1.234,56" -> 1234.56
 * - Ejemplo: "12,34" -> 12.34
 */
export const parseEuropeanNumber = (value) => {
  if (!value || value === '') return '';
  
  // Convertir string a string (por si acaso es un número)
  const str = String(value);
  
  // Reemplazar coma por punto para parsing
  const americanFormat = str.replace(',', '.');
  
  // Devolver el número parseado
  const parsed = parseFloat(americanFormat);
  return isNaN(parsed) ? '' : parsed;
};

/**
 * Formatea un precio mostrando hasta 4 decimales, pero eliminando ceros innecesarios
 * - Ejemplo: 1.2000 -> "1,20€"
 * - Ejemplo: 1.2340 -> "1,2340€"
 * - Ejemplo: 1.0000 -> "1,00€"
 */
export const formatPrice = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0,00€';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '0,00€';
  
  // Determinar cuántos decimales realmente necesitamos (máximo 4, mínimo 2)
  const str = numValue.toFixed(4);
  const decimalPart = str.split('.')[1];
  
  let decimalsToShow = 2; // mínimo 2 decimales
  for (let i = 3; i >= 2; i--) {
    if (decimalPart[i] !== '0') {
      decimalsToShow = i + 1;
      break;
    }
  }
  
  const formatted = numValue.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimalsToShow
  });
  
  return `${formatted}€`;
};

/**
 * Formatea un número decimal mostrando hasta 4 decimales, pero eliminando ceros innecesarios
 * Sin símbolo de moneda
 * - Ejemplo: 1.2000 -> "1,20"
 * - Ejemplo: 1.2340 -> "1,234"
 */
export const formatDecimalPrice = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0,00';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '0,00';
  
  // Determinar cuántos decimales realmente necesitamos (máximo 4, mínimo 2)
  const str = numValue.toFixed(4);
  const decimalPart = str.split('.')[1];
  
  let decimalsToShow = 2; // mínimo 2 decimales
  for (let i = 3; i >= 2; i--) {
    if (decimalPart[i] !== '0') {
      decimalsToShow = i + 1;
      break;
    }
  }
  
  return numValue.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimalsToShow,
    useGrouping: false
  });
};