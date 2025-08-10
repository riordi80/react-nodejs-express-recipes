'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  User, 
  LayoutDashboard, 
  Settings, 
  Users, 
  Shield, 
  Database,
  Building2,
  ChevronDown 
} from 'lucide-react'
import Card from '@/components/ui/Card'
import { useAuth } from '@/context/AuthContext'
import ProfileSection from './components/ProfileSection'
import DashboardSection from './components/DashboardSection'
import SystemSection from './components/SystemSection'
import UsersSection from './components/UsersSection'
import SecuritySection from './components/SecuritySection'
import DataSection from './components/DataSection'
import RestaurantSection from './components/RestaurantSection'

const SettingsPage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filtrar tabs según el rol del usuario
  const allTabs = [
    { id: 'profile', label: 'Perfil', icon: User, roles: ['admin', 'chef', 'supplier_manager'] },
    { id: 'restaurant', label: 'Restaurante', icon: Building2, roles: ['admin'] },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'chef'] },
    { id: 'system', label: 'Sistema', icon: Settings, roles: ['admin'] },
    { id: 'users', label: 'Usuarios', icon: Users, roles: ['admin'] },
    { id: 'security', label: 'Seguridad', icon: Shield, roles: ['admin'] },
    { id: 'data', label: 'Datos', icon: Database, roles: ['admin'] },
  ]

  const tabs = allTabs.filter(tab => 
    user?.role && tab.roles.includes(user.role)
  )

  // Verificar que el tab activo es válido para el usuario
  useEffect(() => {
    if (user && tabs.length > 0) {
      const activeTabExists = tabs.some(tab => tab.id === activeTab)
      if (!activeTabExists) {
        setActiveTab('profile')
      }
    }
  }, [user, tabs, activeTab])

  // Efecto para cerrar el dropdown cuando se hace clic fuera
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
    setActiveTab(tabId)
    setIsDropdownOpen(false)
  }

  const toggleDropdown = () => {
    // Si estamos abriendo el dropdown, blur cualquier elemento enfocado (como selects)
    if (!isDropdownOpen && document.activeElement) {
      (document.activeElement as HTMLElement).blur()
    }
    setIsDropdownOpen(!isDropdownOpen)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection />
      case 'restaurant':
        return <RestaurantSection />
      case 'dashboard':
        return <DashboardSection />
      case 'system':
        return <SystemSection />
      case 'users':
        return <UsersSection />
      case 'security':
        return <SecuritySection />
      case 'data':
        return <DataSection />
      default:
        return <ProfileSection />
    }
  }

  const activeTabData = tabs.find(tab => tab.id === activeTab)

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Settings className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        </div>
        <p className="text-gray-600">Gestiona las preferencias de tu aplicación</p>
      </div>

      {/* Desktop Tabs - Pestañas horizontales */}
      <div className="hidden md:flex border-b border-gray-200 mb-6">
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

      {/* Mobile Dropdown - Mantenemos el formato original */}
      <div className="md:hidden mb-6">
        <div className="relative" ref={dropdownRef}>
          <button 
            className="flex items-center justify-between w-full px-5 py-4 bg-orange-600 text-white rounded-lg shadow-sm font-medium transition-all hover:bg-orange-700"
            onClick={toggleDropdown}
          >
            <div className="flex items-center gap-3">
              {activeTabData && <activeTabData.icon className="h-5 w-5" />}
              <span>{activeTabData?.label}</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-[999999]">
              {tabs.map(tab => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    className={`flex items-center gap-3 w-full px-5 py-4 text-left font-medium transition-colors border-b border-gray-100 last:border-b-0 ${
                      activeTab === tab.id
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <IconComponent className="h-5 w-5 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Panel de contenido */}
      <div className="w-full">
        <Card padding="lg" className="min-h-[600px]">
          {renderContent()}
        </Card>
      </div>
    </div>
  )
}

export default SettingsPage