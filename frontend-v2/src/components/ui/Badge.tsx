'use client'

import React from 'react'
import { clsx } from 'clsx'
import { LucideIcon } from 'lucide-react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  icon?: LucideIcon
  className?: string
  onClick?: () => void
}

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  icon: Icon,
  className,
  onClick
}: BadgeProps) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full transition-colors'
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    outline: 'border border-gray-300 text-gray-700 bg-white'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-0.5 text-sm gap-1',
    lg: 'px-3 py-1 text-sm gap-1.5'
  }

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      onClick={onClick}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
    >
      {Icon && <Icon className={iconSizeClasses[size]} />}
      {children}
    </Component>
  )
}

export default Badge