'use client'

import { useState, useEffect, useRef } from 'react'

interface MultiSelectDropdownProps {
  options: string[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export default function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = 'Seleccionar...',
  className = '',
  disabled = false
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('left')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownContentRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (isOpen && dropdownRef.current && dropdownContentRef.current) {
      const container = dropdownRef.current
      const dropdown = dropdownContentRef.current
      const containerRect = container.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      
      // Check if there's enough space on the right
      const spaceOnRight = viewportWidth - containerRect.left
      const dropdownWidth = dropdown.scrollWidth || 200 // fallback width
      
      if (spaceOnRight < dropdownWidth + 20) { // 20px margin
        setDropdownPosition('right')
      } else {
        setDropdownPosition('left')
      }
    }
  }, [isOpen])

  const handleToggle = (option: string) => {
    if (disabled) return
    
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const getDisplayText = () => {
    if (selected.length === 0) {
      return placeholder
    } else if (selected.length === 1) {
      return selected[0]
    } else {
      return `${selected.length} seleccionados`
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <select
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm cursor-pointer h-[42px]"
        onClick={(e) => {
          e.preventDefault()
          if (!disabled) {
            setIsOpen(!isOpen)
          }
        }}
        onFocus={(e) => e.target.blur()}
        onChange={() => {}} // Prevent React warning
        value=""
        disabled={disabled}
      >
        <option value="">
          {getDisplayText()}
        </option>
      </select>
      
      {isOpen && !disabled && (
        <div 
          ref={dropdownContentRef}
          className={`absolute z-10 mt-1 min-w-max bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto ${
            dropdownPosition === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map(option => (
            <label key={option} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => handleToggle(option)}
                className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}