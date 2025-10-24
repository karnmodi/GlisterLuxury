import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      {icon && (
        <div className="flex justify-center mb-6">
          {icon}
        </div>
      )}
      <h3 className="text-2xl font-serif font-bold text-ivory mb-3">
        {title}
      </h3>
      {description && (
        <p className="text-ivory/70 text-sm max-w-md mx-auto mb-6">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-brass text-charcoal font-medium tracking-wide rounded-md hover:bg-olive transition-all duration-300"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

