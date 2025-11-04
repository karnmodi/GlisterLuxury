'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import LoadingScreen from '@/components/LoadingScreen'

interface LoadingContextType {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  // Initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500) // Show loading for 1.5 seconds on initial load

    return () => clearTimeout(timer)
  }, [])

  // Show loading on route change
  useEffect(() => {
    setIsLoading(true)
    // Show loading for 0.8 seconds, then trigger fade-out (0.5s)
    // Total: 1.3 seconds before page becomes fully visible
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800) // Animation will handle the fade-out transition

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen key="loading-screen" />}
      </AnimatePresence>
      <div className={isLoading ? 'pointer-events-none' : ''}>
        {children}
      </div>
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

