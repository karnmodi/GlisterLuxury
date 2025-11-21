'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '@/utils/serviceWorker'
import InstallPrompt from './InstallPrompt'

export default function PWASetup() {
  useEffect(() => {
    // Register service worker
    registerServiceWorker().catch((error) => {
      console.error('[PWA] Failed to register service worker:', error)
    })
  }, [])

  return <InstallPrompt />
}

