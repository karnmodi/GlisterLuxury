import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-charcoal mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full px-2 py-1.5 text-xs bg-white border ${
          error ? 'border-red-500' : 'border-brass/30'
        } rounded focus:outline-none focus:ring-1 focus:ring-brass focus:border-transparent transition-all duration-300 ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

