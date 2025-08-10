'use client'

import React from 'react'
import { clsx } from 'clsx'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'skeleton' | 'dots'
  text?: string
  className?: string
}

const LoadingSpinner = ({ size = 'md', className }: { size: string, className?: string }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }
  
  return (
    <div className={clsx(
      'animate-spin rounded-full border-2 border-current border-t-transparent',
      sizeClasses[size as keyof typeof sizeClasses],
      className
    )} />
  )
}

const LoadingDots = ({ size = 'md', className }: { size: string, className?: string }) => {
  const sizeClasses = {
    sm: 'h-1 w-1',
    md: 'h-2 w-2',
    lg: 'h-3 w-3'
  }
  
  const dotClass = clsx(
    'bg-current rounded-full animate-pulse',
    sizeClasses[size as keyof typeof sizeClasses]
  )
  
  return (
    <div className={clsx('flex space-x-1', className)}>
      <div className={dotClass} style={{ animationDelay: '0ms' }} />
      <div className={dotClass} style={{ animationDelay: '150ms' }} />
      <div className={dotClass} style={{ animationDelay: '300ms' }} />
    </div>
  )
}

const LoadingSkeleton = ({ className }: { className?: string }) => {
  return (
    <div className={clsx('animate-pulse bg-gray-200 rounded', className)} />
  )
}

const Loading = ({ 
  size = 'md', 
  variant = 'spinner', 
  text,
  className 
}: LoadingProps) => {
  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return <LoadingSpinner size={size} className="text-orange-600" />
      case 'dots':
        return <LoadingDots size={size} className="text-orange-600" />
      case 'skeleton':
        return <LoadingSkeleton className={className} />
      default:
        return <LoadingSpinner size={size} className="text-orange-600" />
    }
  }

  if (variant === 'skeleton') {
    return renderLoader()
  }

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        {renderLoader()}
        {text && (
          <p className="text-sm text-gray-600">{text}</p>
        )}
      </div>
    </div>
  )
}

// Componentes específicos para usar directamente
export const LoadingPage = ({ text = 'Cargando...' }: { text?: string }) => (
  <div className="flex items-center justify-center min-h-64">
    <Loading size="lg" text={text} />
  </div>
)

export const LoadingButton = ({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) => (
  <LoadingSpinner size={size} />
)

export const LoadingTableRow = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><LoadingSkeleton className="h-4 w-24" /></td>
    <td className="px-6 py-4"><LoadingSkeleton className="h-4 w-16" /></td>
    <td className="px-6 py-4"><LoadingSkeleton className="h-4 w-20" /></td>
    <td className="px-6 py-4"><LoadingSkeleton className="h-4 w-12" /></td>
  </tr>
)

export const LoadingCard = () => (
  <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
    <LoadingSkeleton className="h-4 w-3/4 mb-4" />
    <LoadingSkeleton className="h-3 w-1/2 mb-2" />
    <LoadingSkeleton className="h-3 w-2/3" />
  </div>
)

export default Loading