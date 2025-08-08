'use client'

import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, Camera, User, Globe, Shield, Settings } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import api from '@/lib/api'

interface FormData {
  first_name: string
  last_name: string
  email: string
  language: string
  timezone: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface PasswordPolicy {
  password_min_length: string
  password_require_special: boolean
  password_require_numbers: boolean
}

const ProfileSection = () => {
  const { user, setUser } = useAuth()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    language: 'es',
    timezone: 'Europe/Madrid',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  const [loading, setLoading] = useState(false)
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy>({
    password_min_length: '8',
    password_require_special: false,
    password_require_numbers: true
  })

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        language: user.language || 'es',
        timezone: user.timezone || 'Europe/Madrid'
      }))
    }
    
    fetchPasswordPolicy()
  }, [user])

  const fetchPasswordPolicy = async () => {
    try {
      const response = await api.get('/settings/password-policy')
      setPasswordPolicy(response.data)
    } catch (error) {
      console.error('Error al cargar políticas de contraseña:', error)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    const minLength = parseInt(passwordPolicy.password_min_length)
    
    if (password.length < minLength) {
      errors.push(`Mínimo ${minLength} caracteres`)
    }
    
    if (passwordPolicy.password_require_numbers && !/\d/.test(password)) {
      errors.push('Debe contener al menos un número')
    }
    
    if (passwordPolicy.password_require_special && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Debe contener al menos un carácter especial')
    }
    
    return errors
  }

  const handleProfileUpdate = async () => {
    try {
      setLoading(true)
      const profileData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        language: formData.language,
        timezone: formData.timezone
      }
      
      const response = await api.put('/profile', profileData)
      
      if (setUser) {
        setUser({ ...user, ...profileData })
      }
      
      showToast({ message: 'Perfil actualizado correctamente', type: 'success' })
    } catch (error: any) {
      showToast({ message: error.response?.data?.message || 'Error al actualizar el perfil', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    const passwordErrors = validatePassword(formData.newPassword)
    
    if (passwordErrors.length > 0) {
      showToast({ message: passwordErrors.join(', '), type: 'error' })
      return
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      showToast({ message: 'Las contraseñas no coinciden', type: 'error' })
      return
    }
    
    if (!formData.currentPassword) {
      showToast({ message: 'Ingresa tu contraseña actual', type: 'error' })
      return
    }

    try {
      setLoading(true)
      await api.put('/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      })
      
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
      
      showToast({ message: 'Contraseña actualizada correctamente', type: 'success' })
    } catch (error: any) {
      showToast({ message: error.response?.data?.message || 'Error al cambiar la contraseña', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const languageOptions = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' }
  ]

  const timezoneOptions = [
    { value: 'Europe/Madrid', label: 'Europa/Madrid (GMT+1)' },
    { value: 'Europe/London', label: 'Europa/Londres (GMT+0)' },
    { value: 'America/New_York', label: 'América/Nueva York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'América/Los Ángeles (GMT-8)' }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <User className="h-6 w-6 text-orange-600" />
          Perfil de Usuario
        </h2>
        <p className="text-gray-600">Gestiona tu información personal y preferencias</p>
      </div>

      {/* Información Personal */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Información Personal</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-gray-600">Rol:</span>
              <Badge variant="info">{user?.role || 'Usuario'}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input
            label="Nombre"
            value={formData.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
            placeholder="Tu nombre"
            required
          />
          <Input
            label="Apellidos"
            value={formData.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            placeholder="Tus apellidos"
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="tu@email.com"
            required
          />
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleProfileUpdate}
            loading={loading}
            disabled={loading}
          >
            Actualizar Perfil
          </Button>
        </div>
      </div>

      {/* Preferencias */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-orange-600" />
          Preferencias
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Select
            label="Idioma"
            value={formData.language}
            onChange={(e) => handleInputChange('language', e.target.value)}
            options={languageOptions}
          />
          <Select
            label="Zona Horaria"
            value={formData.timezone}
            onChange={(e) => handleInputChange('timezone', e.target.value)}
            options={timezoneOptions}
          />
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handleProfileUpdate}
            loading={loading}
            disabled={loading}
            variant="secondary"
          >
            Guardar Preferencias
          </Button>
        </div>
      </div>

      {/* Cambio de Contraseña */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-orange-600" />
          Cambiar Contraseña
        </h3>
        
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Input
              label="Contraseña Actual"
              type={showPasswords.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              placeholder="Tu contraseña actual"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              onClick={() => togglePasswordVisibility('current')}
            >
              {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Nueva Contraseña"
              type={showPasswords.new ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              placeholder="Tu nueva contraseña"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              onClick={() => togglePasswordVisibility('new')}
            >
              {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirmar Nueva Contraseña"
              type={showPasswords.confirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="Confirma tu nueva contraseña"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              onClick={() => togglePasswordVisibility('confirm')}
            >
              {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Políticas de contraseña */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Requisitos de contraseña:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Mínimo {passwordPolicy.password_min_length} caracteres</li>
            {passwordPolicy.password_require_numbers && <li>• Al menos un número</li>}
            {passwordPolicy.password_require_special && <li>• Al menos un carácter especial</li>}
          </ul>
        </div>

        <div className="flex justify-end">
          <Button 
            onClick={handlePasswordChange}
            loading={loading}
            disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
            variant="primary"
          >
            Cambiar Contraseña
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProfileSection