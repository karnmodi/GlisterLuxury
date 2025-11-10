'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect if the current viewport is mobile (< 1024px)
 * Uses Tailwind's lg breakpoint (1024px) to differentiate mobile/desktop
 * On initial render, assumes mobile to prevent flash of desktop animations
 */
export function useIsMobile(): boolean {
  // Initialize with true to assume mobile on first render (prevents flash of desktop animations)
  // This is safe because mobile-first approach ensures components are visible immediately
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // Only check window if available (client-side)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    // Default to true (mobile) for SSR safety
    return true
  })

  useEffect(() => {
    // Check on mount
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }

    // Initial check (in case window size changed between SSR and hydration)
    checkMobile()

    // Listen for resize events
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return isMobile
}

