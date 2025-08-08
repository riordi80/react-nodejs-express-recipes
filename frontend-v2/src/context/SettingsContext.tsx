'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface AppSettings {
  pageSize: number
  dateFormat: string
  currency: string
  units: string
  autoSearch: boolean
  soundEnabled: boolean
}

interface SettingsContextType {
  settings: AppSettings
  updateSetting: (key: keyof AppSettings, value: any) => void
  updateSettings: (newSettings: Partial<AppSettings>) => void
  // Mantener compatibilidad con el código existente
  soundEnabled: boolean
  setSoundEnabled: (enabled: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

interface SettingsProviderProps {
  children: React.ReactNode
}

const DEFAULT_SETTINGS: AppSettings = {
  pageSize: 25,
  dateFormat: 'dd/mm/yyyy',
  currency: 'EUR',
  units: 'metric',
  autoSearch: true,
  soundEnabled: true
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)

  // Cargar configuraciones desde localStorage al inicializar
  useEffect(() => {
    const savedSettings: Partial<AppSettings> = {}
    
    // Cargar cada configuración individualmente para compatibilidad
    const pageSize = localStorage.getItem('app-pageSize')
    if (pageSize) savedSettings.pageSize = parseFloat(pageSize)
    
    const dateFormat = localStorage.getItem('app-dateFormat')
    if (dateFormat) savedSettings.dateFormat = dateFormat
    
    const currency = localStorage.getItem('app-currency')
    if (currency) savedSettings.currency = currency
    
    const units = localStorage.getItem('app-units')
    if (units) savedSettings.units = units
    
    const autoSearch = localStorage.getItem('app-autoSearch')
    if (autoSearch !== null) savedSettings.autoSearch = JSON.parse(autoSearch)
    
    const soundEnabled = localStorage.getItem('toast-sound-enabled')
    if (soundEnabled !== null) savedSettings.soundEnabled = JSON.parse(soundEnabled)
    
    // También intentar cargar desde el formato original
    const originalSettings = localStorage.getItem('app-settings')
    if (originalSettings) {
      try {
        const parsed = JSON.parse(originalSettings)
        Object.assign(savedSettings, parsed)
      } catch (error) {
        console.error('Error parsing saved settings:', error)
      }
    }
    
    if (Object.keys(savedSettings).length > 0) {
      setSettings(prev => ({ ...prev, ...savedSettings }))
    }
  }, [])

  // Actualizar una configuración específica
  const updateSetting = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    // Guardar en localStorage tanto individualmente como en conjunto
    localStorage.setItem(`app-${key}`, typeof value === 'boolean' ? JSON.stringify(value) : value.toString())
    localStorage.setItem('app-settings', JSON.stringify(newSettings))
    
    // Mantener compatibilidad con el formato anterior para soundEnabled
    if (key === 'soundEnabled') {
      localStorage.setItem('toast-sound-enabled', JSON.stringify(value))
    }
  }

  // Actualizar múltiples configuraciones
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    
    // Guardar en localStorage
    Object.entries(newSettings).forEach(([key, value]) => {
      localStorage.setItem(`app-${key}`, typeof value === 'boolean' ? JSON.stringify(value) : value.toString())
    })
    localStorage.setItem('app-settings', JSON.stringify(updatedSettings))
    
    // Mantener compatibilidad para soundEnabled
    if ('soundEnabled' in newSettings) {
      localStorage.setItem('toast-sound-enabled', JSON.stringify(newSettings.soundEnabled))
    }
  }

  // Función para compatibilidad con código existente
  const setSoundEnabled = (enabled: boolean) => {
    updateSetting('soundEnabled', enabled)
  }

  const value = {
    settings,
    updateSetting,
    updateSettings,
    soundEnabled: settings.soundEnabled,
    setSoundEnabled
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}