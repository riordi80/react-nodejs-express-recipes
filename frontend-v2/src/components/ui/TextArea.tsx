'use client'

import React from 'react'
import { clsx } from 'clsx'

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(({
  label,
  error,
  helperText,
  fullWidth = true,
  resize = 'vertical',
  className,
  id,
  rows = 4,
  ...props
}, ref) => {
  const textAreaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`
  
  const baseClasses = 'block px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  
  const stateClasses = error 
    ? 'border-red-300 focus:ring-red-500 focus:border-transparent' 
    : 'border-gray-300'
    
  const resizeClasses = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  }

  return (
    <div className={clsx('relative', fullWidth && 'w-full')}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={textAreaId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      
      {/* TextArea */}
      <textarea
        ref={ref}
        id={textAreaId}
        rows={rows}
        className={clsx(
          baseClasses,
          stateClasses,
          resizeClasses[resize],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      />
      
      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      
      {/* Helper Text */}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
})

TextArea.displayName = 'TextArea'

export default TextArea