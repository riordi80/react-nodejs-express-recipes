'use client'

import { useRef, useEffect } from 'react'
import { List, Plus, Package, ChevronDown } from 'lucide-react'

interface ModeSelectorProps {
  showEventSelection: boolean
  showManualOrder: boolean
  onModeChange: (mode: 'automatic' | 'events' | 'manual') => void
  isModeDropdownOpen: boolean
  setIsModeDropdownOpen: (open: boolean) => void
}

export default function ModeSelector({ 
  showEventSelection, 
  showManualOrder, 
  onModeChange,
  isModeDropdownOpen,
  setIsModeDropdownOpen
}: ModeSelectorProps) {
  const modeDropdownRef = useRef<HTMLDivElement>(null)

  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setIsModeDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [setIsModeDropdownOpen])

  const toggleModeDropdown = () => {
    setIsModeDropdownOpen(!isModeDropdownOpen)
  }

  // Mode options for mobile dropdown
  const modeOptions = [
    { 
      id: 'automatic' as const, 
      label: 'Automático por Filtros', 
      icon: List,
      isActive: !showEventSelection && !showManualOrder,
      onClick: () => onModeChange('automatic')
    },
    { 
      id: 'events' as const, 
      label: 'Seleccionar Eventos Específicos', 
      icon: Plus,
      isActive: showEventSelection && !showManualOrder,
      onClick: () => onModeChange('events')
    },
    { 
      id: 'manual' as const, 
      label: 'Pedido Manual', 
      icon: Package,
      isActive: showManualOrder,
      onClick: () => onModeChange('manual')
    }
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      {/* Desktop Mode Toggle */}
      <div className="hidden md:flex space-x-2">
        <button 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            !showEventSelection && !showManualOrder 
              ? 'bg-orange-50 border-orange-200 text-orange-700' 
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => onModeChange('automatic')}
        >
          <List className="h-4 w-4" />
          <span>Automático por Filtros</span>
        </button>
        <button 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            showEventSelection && !showManualOrder 
              ? 'bg-orange-50 border-orange-200 text-orange-700' 
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => onModeChange('events')}
        >
          <Plus className="h-4 w-4" />
          <span>Seleccionar Eventos Específicos</span>
        </button>
        <button 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            showManualOrder 
              ? 'bg-orange-50 border-orange-200 text-orange-700' 
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => onModeChange('manual')}
        >
          <Package className="h-4 w-4" />
          <span>Pedido Manual</span>
        </button>
      </div>

      {/* Mobile Dropdown */}
      <div className="md:hidden relative" ref={modeDropdownRef}>
        <button 
          className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          onClick={toggleModeDropdown}
        >
          <div className="flex items-center space-x-2">
            {(() => {
              const activeMode = modeOptions.find(mode => mode.isActive)
              const IconComponent = activeMode?.icon || List
              return (
                <>
                  <IconComponent className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">{activeMode?.label || 'Seleccionar Modo'}</span>
                </>
              )
            })()}
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isModeDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isModeDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {modeOptions.map(mode => {
              const IconComponent = mode.icon
              return (
                <button
                  key={mode.id}
                  className={`w-full flex items-center space-x-2 px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                    mode.isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-900'
                  }`}
                  onClick={() => {
                    mode.onClick()
                    setIsModeDropdownOpen(false)
                  }}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{mode.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}