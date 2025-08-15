'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

interface SuperAdminThemeContextType {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
  getThemeClasses: () => {
    bg: string
    bgSecondary: string
    text: string
    textSecondary: string
    border: string
    button: string
    buttonHover: string
    card: string
    header: string
  }
}

const SuperAdminThemeContext = createContext<SuperAdminThemeContextType | undefined>(undefined)

export function SuperAdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  // Cargar tema desde localStorage al montar
  useEffect(() => {
    const savedTheme = localStorage.getItem('superadmin-theme') as Theme
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme)
    }
  }, [])

  // Guardar tema en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('superadmin-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  const isDark = theme === 'dark'

  const getThemeClasses = () => {
    if (isDark) {
      return {
        bg: 'bg-slate-900',
        bgSecondary: 'bg-slate-800',
        text: 'text-white',
        textSecondary: 'text-slate-300',
        border: 'border-slate-700',
        button: 'text-slate-400 hover:text-slate-300',
        buttonHover: 'hover:bg-slate-700',
        card: 'bg-slate-800 border-slate-700',
        header: 'bg-slate-800 border-slate-700'
      }
    } else {
      return {
        bg: 'bg-white',
        bgSecondary: 'bg-gray-50',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        border: 'border-gray-200',
        button: 'text-gray-600 hover:text-gray-900',
        buttonHover: 'hover:bg-gray-100',
        card: 'bg-white border-gray-200',
        header: 'bg-white border-gray-200'
      }
    }
  }

  const value: SuperAdminThemeContextType = {
    theme,
    toggleTheme,
    isDark,
    getThemeClasses
  }

  return (
    <SuperAdminThemeContext.Provider value={value}>
      {children}
    </SuperAdminThemeContext.Provider>
  )
}

export function useSuperAdminTheme() {
  const context = useContext(SuperAdminThemeContext)
  if (context === undefined) {
    throw new Error('useSuperAdminTheme must be used within a SuperAdminThemeProvider')
  }
  return context
}