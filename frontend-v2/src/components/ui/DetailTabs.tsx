'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { LucideIcon, ChevronDown } from 'lucide-react'

interface TabItem {
  id: string
  label: string
  icon: LucideIcon
  content?: ReactNode
}

interface UnifiedTabsProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  variant?: 'page' | 'detail' // 'page' para páginas completas, 'detail' para contenido dentro de cards
  mobileStyle?: 'orange' | 'white' // Estilo del dropdown móvil
  className?: string
  children?: ReactNode // Para contenido dinámico basado en activeTab
}

export default function UnifiedTabs({ 
  tabs, 
  activeTab, 
  onTabChange, 
  variant = 'page',
  mobileStyle = 'white',
  className = '',
  children
}: UnifiedTabsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId)
    setIsDropdownOpen(false)
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  // Desktop tabs component
  const DesktopTabs = () => (
    <div className={`hidden md:flex border-b border-gray-200 ${variant === 'page' ? 'mb-6' : ''}`}>
      {tabs.map(tab => {
        const IconComponent = tab.icon
        return (
          <button
            key={tab.id}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => handleTabChange(tab.id)}
          >
            <IconComponent className="h-5 w-5" />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )

  // Mobile dropdown component
  const MobileDropdown = () => (
    <div className={`md:hidden ${variant === 'page' ? 'mb-6' : ''}`}>
      <div className="relative" ref={dropdownRef}>
        <button
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all ${
            mobileStyle === 'orange'
              ? 'bg-orange-600 text-white hover:bg-orange-700 px-5 py-4 shadow-sm'
              : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent'
          }`}
          onClick={toggleDropdown}
        >
          <div className="flex items-center space-x-2">
            {activeTabData && <activeTabData.icon className="h-5 w-5" />}
            <span>{activeTabData?.label}</span>
          </div>
          <ChevronDown className={`h-5 w-5 transition-transform ${
            mobileStyle === 'orange' ? 'h-4 w-4' : ''
          } ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className={`absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 ${
            mobileStyle === 'orange' ? 'mt-2 shadow-xl z-[999999]' : 'mt-1'
          }`}>
            {tabs.map(tab => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  className={`w-full flex items-center space-x-2 px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                    mobileStyle === 'orange' 
                      ? 'gap-3 px-5 py-4 font-medium transition-colors border-b border-gray-100 last:border-b-0'
                      : ''
                  } ${
                    activeTab === tab.id 
                      ? (mobileStyle === 'orange' ? 'bg-orange-50 text-orange-600' : 'bg-orange-50 text-orange-600')
                      : 'text-gray-900'
                  }`}
                  onClick={() => handleTabChange(tab.id)}
                >
                  <IconComponent className={`h-5 w-5 ${mobileStyle === 'orange' ? 'flex-shrink-0' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  if (variant === 'page') {
    // Para páginas completas (como Pedidos, Configuración)
    return (
      <div className={className}>
        <DesktopTabs />
        <MobileDropdown />
        {children}
      </div>
    )
  } else {
    // Para detalles dentro de cards
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <DesktopTabs />
        <MobileDropdown />
        <div className="p-6">
          {children || tabs.find(tab => tab.id === activeTab)?.content}
        </div>
      </div>
    )
  }
}