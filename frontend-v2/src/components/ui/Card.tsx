'use client'

import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  border?: boolean
  hover?: boolean
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

interface CardFooterProps {
  children: React.ReactNode
  className?: string
}

const Card = ({ 
  children, 
  className, 
  padding = 'md',
  shadow = 'sm',
  border = true,
  hover = false
}: CardProps) => {
  const baseClasses = 'bg-white rounded-lg transition-shadow'
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  }

  return (
    <div
      className={clsx(
        baseClasses,
        paddingClasses[padding],
        shadowClasses[shadow],
        border && 'border border-gray-200',
        hover && 'hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  )
}

const CardHeader = ({ children, className }: CardHeaderProps) => (
  <div className={clsx('mb-4', className)}>
    {children}
  </div>
)

const CardContent = ({ children, className }: CardContentProps) => (
  <div className={clsx(className)}>
    {children}
  </div>
)

const CardFooter = ({ children, className }: CardFooterProps) => (
  <div className={clsx('mt-4 pt-4 border-t border-gray-200', className)}>
    {children}
  </div>
)

const CardTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <h3 className={clsx('text-lg font-semibold text-gray-900', className)}>
    {children}
  </h3>
)

const CardDescription = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <p className={clsx('text-sm text-gray-600', className)}>
    {children}
  </p>
)

// Exportar componentes
Card.Header = CardHeader
Card.Content = CardContent
Card.Footer = CardFooter
Card.Title = CardTitle
Card.Description = CardDescription

export default Card