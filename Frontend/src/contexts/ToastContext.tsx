'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { id, message, type }])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 5000)
  }, [])

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast])
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast])
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast])
  const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-green-500',
          text: 'text-gray-800',
          iconBg: 'bg-green-50',
          iconColor: 'text-green-600',
        }
      case 'error':
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-red-500',
          text: 'text-gray-800',
          iconBg: 'bg-red-50',
          iconColor: 'text-red-600',
        }
      case 'warning':
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-amber-500',
          text: 'text-gray-800',
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
        }
      case 'info':
      default:
        return {
          bg: 'bg-white',
          border: 'border-l-4 border-blue-500',
          text: 'text-gray-800',
          iconBg: 'bg-blue-50',
          iconColor: 'text-blue-600',
        }
    }
  }

  const getIcon = (type: ToastType) => {
    const styles = getToastStyles(type)
    switch (type) {
      case 'success':
        return (
          <div className={`${styles.iconBg} rounded-lg p-2.5`}>
            <svg className={`w-5 h-5 ${styles.iconColor}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className={`${styles.iconBg} rounded-lg p-2.5`}>
            <svg className={`w-5 h-5 ${styles.iconColor}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div className={`${styles.iconBg} rounded-lg p-2.5`}>
            <svg className={`w-5 h-5 ${styles.iconColor}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )
      case 'info':
      default:
        return (
          <div className={`${styles.iconBg} rounded-lg p-2.5`}>
            <svg className={`w-5 h-5 ${styles.iconColor}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      
      {/* Toast Container - Fixed positioning at bottom-right with margins */}
      <div className="fixed bottom-6 right-6 z-[99999] space-y-3 pointer-events-none max-w-[calc(100vw-3rem)] sm:max-w-md">
        <AnimatePresence>
          {toasts.map(toast => {
            const styles = getToastStyles(toast.type)
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, x: 100 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: 20, x: 100 }}
                transition={{ duration: 0.4, type: "spring", stiffness: 150, damping: 15 }}
                className={`
                  pointer-events-auto
                  flex items-center gap-4 px-5 py-4 rounded-xl
                  shadow-lg min-w-[320px] w-full
                  ${styles.bg} ${styles.border}
                  border border-gray-200
                `}
                style={{
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                }}
              >
                <div className="flex-shrink-0">
                  {getIcon(toast.type)}
                </div>
                <p className={`flex-1 text-sm font-medium leading-relaxed ${styles.text}`}>
                  {toast.message}
                </p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1.5 transition-all duration-200"
                  aria-label="Close notification"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

