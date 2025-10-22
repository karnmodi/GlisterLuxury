import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = 'font-medium tracking-wide transition-all duration-300 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-brass text-charcoal hover:bg-olive hover:shadow-lg hover:shadow-brass/50',
    secondary: 'bg-charcoal text-ivory border border-brass hover:bg-brass hover:text-charcoal',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-ivory hover:bg-brass/10 hover:text-brass',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
  }
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

