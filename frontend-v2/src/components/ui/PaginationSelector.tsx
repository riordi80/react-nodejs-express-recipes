'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, List } from 'lucide-react'

interface PaginationSelectorProps {
  currentPageSize: number
  onPageSizeChange: (newSize: number) => void
  totalItems?: number
  className?: string
}

const PAGE_SIZE_OPTIONS = [
  { value: 10, label: '10 por página' },
  { value: 25, label: '25 por página' },
  { value: 50, label: '50 por página' },
  { value: 100, label: '100 por página' }
]

export default function PaginationSelector({ 
  currentPageSize, 
  onPageSizeChange, 
  totalItems,
  className = "" 
}: PaginationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOptionClick = (newSize: number) => {
    onPageSizeChange(newSize)
    setIsOpen(false)
  }

  const currentOption = PAGE_SIZE_OPTIONS.find(opt => opt.value === currentPageSize)
  const displayLabel = currentOption?.label || `${currentPageSize} por página`

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <List className="h-4 w-4 text-gray-400" />
        <span>{displayLabel}</span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {PAGE_SIZE_OPTIONS
              .filter((option) => {
                // Hide options that exceed total items
                return totalItems === undefined || option.value <= totalItems
              })
              .map((option) => {
                const isSelected = option.value === currentPageSize
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleOptionClick(option.value)}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-orange-50 text-orange-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option.label}</span>
                      {isSelected && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}