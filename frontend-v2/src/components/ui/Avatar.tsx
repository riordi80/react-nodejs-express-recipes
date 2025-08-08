'use client'

import React from 'react'
import { clsx } from 'clsx'
import { User } from 'lucide-react'

interface AvatarProps {
  src?: string
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackIcon?: boolean
}

const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  className,
  fallbackIcon = true
}: AvatarProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl'
  }

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  }

  // Generar iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  // Generar color basado en el nombre
  const getBackgroundColor = (name: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500'
    ]
    
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc)
    }, 0)
    
    return colors[Math.abs(hash) % colors.length]
  }

  const baseClasses = 'inline-flex items-center justify-center rounded-full overflow-hidden'

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={clsx(
          baseClasses,
          sizeClasses[size],
          className
        )}
      />
    )
  }

  if (name) {
    return (
      <div
        className={clsx(
          baseClasses,
          sizeClasses[size],
          getBackgroundColor(name),
          'text-white font-medium',
          className
        )}
      >
        {getInitials(name)}
      </div>
    )
  }

  if (fallbackIcon) {
    return (
      <div
        className={clsx(
          baseClasses,
          sizeClasses[size],
          'bg-gray-100 text-gray-400',
          className
        )}
      >
        <User className={iconSizeClasses[size]} />
      </div>
    )
  }

  return (
    <div
      className={clsx(
        baseClasses,
        sizeClasses[size],
        'bg-gray-300',
        className
      )}
    />
  )
}

export default Avatar