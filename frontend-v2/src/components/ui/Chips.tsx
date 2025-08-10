'use client'

import React from 'react'
import { X } from 'lucide-react'

interface ChipOption {
  value: string
  label: string
}

interface ChipsProps {
  options: ChipOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variantClasses = {
  default: {
    unselected: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300',
    selected: 'bg-gray-700 text-white hover:bg-gray-800 border-gray-700'
  },
  primary: {
    unselected: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-300',
    selected: 'bg-orange-600 text-white hover:bg-orange-700 border-orange-600'
  },
  success: {
    unselected: 'bg-green-50 text-green-700 hover:bg-green-100 border-green-300',
    selected: 'bg-green-600 text-white hover:bg-green-700 border-green-600'
  },
  warning: {
    unselected: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-300',
    selected: 'bg-yellow-600 text-white hover:bg-yellow-700 border-yellow-600'
  },
  danger: {
    unselected: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-300',
    selected: 'bg-red-600 text-white hover:bg-red-700 border-red-600'
  }
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base'
}

export default function Chips({
  options,
  selected,
  onChange,
  placeholder = 'Seleccionar opciones...',
  className = '',
  disabled = false,
  variant = 'default',
  size = 'md'
}: ChipsProps) {
  const handleToggle = (value: string) => {
    if (disabled) return
    
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    onChange(selected.filter(item => item !== value))
  }

  const clearAll = () => {
    if (disabled) return
    onChange([])
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Selected chips display */}
      {false && selected.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center mb-3">
          {selected.map((value) => {
            const option = options.find(opt => opt.value === value)
            if (!option) return null
            
            return (
              <div
                key={value}
                className={`
                  inline-flex items-center gap-1 border rounded-full font-medium transition-colors
                  ${sizeClasses[size]}
                  ${variantClasses[variant].selected}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span>{option.label}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(value, e)}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )
          })}
          {!disabled && selected.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
            >
              Limpiar todo
            </button>
          )}
        </div>
      )}

      {/* Available options */}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value)
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              disabled={disabled}
              className={`
                inline-flex items-center border rounded-full font-medium transition-colors
                ${sizeClasses[size]}
                ${isSelected 
                  ? variantClasses[variant].selected 
                  : variantClasses[variant].unselected
                }
                ${disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-sm'
                }
              `}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Export additional components for different use cases
export function SeasonChips({ selected, onChange, disabled = false, size = 'md' }: {
  selected: string[]
  onChange: (selected: string[]) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const seasonOptions = [
    { value: 'enero', label: 'Enero' },
    { value: 'febrero', label: 'Febrero' },
    { value: 'marzo', label: 'Marzo' },
    { value: 'abril', label: 'Abril' },
    { value: 'mayo', label: 'Mayo' },
    { value: 'junio', label: 'Junio' },
    { value: 'julio', label: 'Julio' },
    { value: 'agosto', label: 'Agosto' },
    { value: 'septiembre', label: 'Septiembre' },
    { value: 'octubre', label: 'Octubre' },
    { value: 'noviembre', label: 'Noviembre' },
    { value: 'diciembre', label: 'Diciembre' },
    { value: 'todo_el_año', label: 'Todo el año' }
  ]

  return (
    <Chips
      options={seasonOptions}
      selected={selected}
      onChange={onChange}
      placeholder="Seleccionar temporadas..."
      variant="primary"
      size={size}
      disabled={disabled}
    />
  )
}

export function AllergenChips({ 
  options, 
  selected, 
  onChange, 
  disabled = false, 
  size = 'md',
  allowEmpty = true
}: {
  options: { allergen_id: number; name: string }[]
  selected: number[]
  onChange: (selected: number[]) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  allowEmpty?: boolean
}) {
  const allergenOptions = options.map(allergen => ({
    value: allergen.allergen_id.toString(),
    label: allergen.name
  }))

  const selectedStrings = selected.map(id => id.toString())

  const handleChange = (selectedValues: string[]) => {
    // Si allowEmpty es false y se intenta dejar vacío, no permitir el cambio
    if (!allowEmpty && selectedValues.length === 0 && selected.length > 0) {
      console.log('No se permite dejar vacío el campo de alérgenos')
      return // No hacer nada si se intenta dejar vacío cuando no se permite
    }
    
    const selectedIds = selectedValues.map(value => parseInt(value, 10))
    onChange(selectedIds)
  }

  return (
    <Chips
      options={allergenOptions}
      selected={selectedStrings}
      onChange={handleChange}
      placeholder="Seleccionar alérgenos..."
      variant="danger"
      size={size}
      disabled={disabled}
    />
  )
}