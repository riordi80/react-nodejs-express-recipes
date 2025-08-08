'use client'

import Image from 'next/image'
import { useState } from 'react'

// Mapeo exacto de nombres de alérgenos de la BD a archivos de imagen
const ALLERGEN_ICON_MAP: Record<string, string> = {
  // Mapeo directo BD → archivos (con normalizacion de case)
  'gluten': 'gluten.svg',
  'crustáceo': 'crustaceos.svg',
  'crustaceo': 'crustaceos.svg',
  'huevo': 'huevos.svg',
  'pescado': 'pescado.svg',
  'cacahuete': 'cacauetes.svg',
  'soja': 'soja.svg',
  'leche': 'lacteros.svg',
  'frutos de cáscara': 'frutos-secos.svg',
  'frutos de cascara': 'frutos-secos.svg',
  'apio': 'apio.svg',
  'mostaza': 'mostaza.svg',
  'granos de sésamo': 'sesamo.svg',
  'granos de sesamo': 'sesamo.svg',
  'sésamo': 'sesamo.svg',
  'sesamo': 'sesamo.svg',
  'dióxido de azufre y sulfitos': 'sulfitos.svg',
  'dioxido de azufre y sulfitos': 'sulfitos.svg',
  'sulfitos': 'sulfitos.svg',
  'altramuz': 'altramuces.svg',
  'molusco': 'moluscos.svg',
}

// Lista de alérgenos de la BD (ordenados según DB)
export const DB_ALLERGENS = [
  'Gluten',
  'Crustáceo',
  'Huevo',
  'Pescado',
  'Cacahuete',
  'Soja',
  'Leche',
  'Frutos de cáscara',
  'Apio',
  'Mostaza',
  'Granos de sésamo',
  'Dióxido de azufre y sulfitos',
  'Altramuz',
  'Molusco'
]

interface AllergenIconProps {
  allergenName: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  className?: string
  title?: string
}

const SIZE_MAP = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48
}

export default function AllergenIcon({ 
  allergenName, 
  size = 'md', 
  showLabel = false,
  className = '',
  title
}: AllergenIconProps) {
  const [hasError, setHasError] = useState(false)
  
  // Normalizar nombre del alérgeno para búsqueda
  const normalizedName = allergenName.toLowerCase().trim()
  const iconFileName = ALLERGEN_ICON_MAP[normalizedName]
  const iconSize = SIZE_MAP[size]
  
  // Si no hay mapeo o hay error, mostrar fallback
  if (!iconFileName || hasError) {
    return (
      <div 
        className={`inline-flex items-center justify-center bg-red-100 text-red-700 rounded-full font-medium ${className}`}
        style={{ 
          width: iconSize, 
          height: iconSize,
          fontSize: size === 'sm' ? '8px' : size === 'md' ? '10px' : '12px'
        }}
        title={title || allergenName}
      >
        !
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center ${showLabel ? 'space-x-2' : ''} ${className}`}>
      <div 
        className="relative flex-shrink-0"
        title={title || allergenName}
      >
        <Image
          src={`/images/allergens/${iconFileName}`}
          alt={allergenName}
          width={iconSize}
          height={iconSize}
          className="object-contain"
          onError={() => setHasError(true)}
        />
      </div>
      {showLabel && (
        <span className={`text-gray-700 ${
          size === 'sm' ? 'text-xs' : 
          size === 'md' ? 'text-sm' : 
          size === 'lg' ? 'text-base' : 'text-lg'
        }`}>
          {allergenName}
        </span>
      )}
    </div>
  )
}

// Componente para mostrar múltiples alérgenos
interface AllergenListProps {
  allergens: string[]
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabels?: boolean
  maxDisplay?: number
  className?: string
}

export function AllergenList({
  allergens,
  size = 'md',
  showLabels = false,
  maxDisplay,
  className = ''
}: AllergenListProps) {
  const displayAllergens = maxDisplay ? allergens.slice(0, maxDisplay) : allergens
  const remainingCount = allergens.length - (maxDisplay || allergens.length)

  if (allergens.length === 0) {
    return null
  }

  return (
    <div className={`flex items-center flex-wrap gap-2 ${className}`}>
      {displayAllergens.map((allergen, index) => (
        <AllergenIcon
          key={index}
          allergenName={allergen}
          size={size}
          showLabel={showLabels}
        />
      ))}
      {remainingCount > 0 && (
        <span className="text-sm text-gray-500 ml-1">
          +{remainingCount} más
        </span>
      )}
    </div>
  )
}