'use client'

import React, { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, LucideIcon } from 'lucide-react'

interface DropdownItem {
  label: string
  value: string | number
  icon?: LucideIcon
  disabled?: boolean
  onClick?: () => void
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  onSelect?: (item: DropdownItem) => void
  position?: 'left' | 'right'
  className?: string
}

const Dropdown = ({ 
  trigger, 
  items, 
  onSelect, 
  position = 'left',
  className 
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return
    
    item.onClick?.()
    onSelect?.(item)
    setIsOpen(false)
  }

  const positionClasses = {
    left: 'left-0',
    right: 'right-0'
  }

  return (
    <div className={clsx('relative inline-block', className)} ref={dropdownRef}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={clsx(
          'absolute z-50 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1',
          positionClasses[position]
        )}>
          {items.map((item, index) => {
            const Icon = item.icon

            return (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={clsx(
                  'w-full flex items-center px-4 py-2 text-sm text-left transition-colors',
                  {
                    'text-gray-700 hover:bg-gray-100': !item.disabled,
                    'text-gray-400 cursor-not-allowed': item.disabled
                  }
                )}
              >
                {Icon && (
                  <Icon className="h-4 w-4 mr-3 text-gray-400" />
                )}
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Dropdown