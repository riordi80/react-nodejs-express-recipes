import React from 'react'

interface DetailSectionProps {
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function DetailSection({ title, children, actions, className = '' }: DetailSectionProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {actions && <div>{actions}</div>}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

export default DetailSection