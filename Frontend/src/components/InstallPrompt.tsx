'use client'

import { useState, useEffect } from 'react'
import { isAppInstalled, canInstallApp } from '@/utils/serviceWorker'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    setIsInstalled(isAppInstalled())

    // Check if can be installed
    if (!canInstallApp() && !isAppInstalled()) {
      // For Safari iOS, show instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
      
      if (isIOS && isSafari) {
        // Show prompt for iOS Safari after a delay
        const timer = setTimeout(() => {
          setShowPrompt(true)
        }, 3000)
        return () => clearTimeout(timer)
      }
    }

    // Listen for beforeinstallprompt event (Chrome, Edge, etc.)
    // Note: Calling preventDefault() will show a console warning, but this is expected.
    // We prevent the default browser prompt and show our custom UI instead.
    // The prompt() method will be called when the user clicks the install button.
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar from appearing
      // This will show a console warning, but it's expected behavior
      e.preventDefault()
      
      // Store the event for later use (must be called within user gesture)
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      
      // Show our custom install prompt UI
      setShowPrompt(true)
      
      console.log('[PWA] Install prompt event captured, custom UI will be shown')
      console.log('[PWA] Note: Console warning about preventDefault() is expected - prompt() will be called on user click')
    }

    // Only add listener if not already installed
    if (!isAppInstalled()) {
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App installed')
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }
    
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        // Show the install prompt
        await deferredPrompt.prompt()
        console.log('[PWA] Install prompt shown')

        // Wait for user response
        const { outcome } = await deferredPrompt.userChoice
        console.log('[PWA] User choice:', outcome)

        if (outcome === 'accepted') {
          console.log('[PWA] User accepted install prompt')
          setShowPrompt(false)
        } else {
          console.log('[PWA] User dismissed install prompt')
        }

        // Clear the deferred prompt so it can't be used again
        setDeferredPrompt(null)
      } catch (error) {
        console.error('[PWA] Error showing install prompt:', error)
        // If prompt fails, still clear it and hide the UI
        setDeferredPrompt(null)
        setShowPrompt(false)
      }
    } else {
      // For iOS Safari or if prompt is not available, just close the prompt
      console.log('[PWA] No deferred prompt available, closing UI')
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pwa-install-dismissed', 'true')
    }
  }

  // Don't show if already installed or dismissed
  if (isInstalled || !showPrompt) {
    return null
  }

  // Check if dismissed in this session
  if (typeof window !== 'undefined' && sessionStorage.getItem('pwa-install-dismissed')) {
    return null
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-charcoal border-2 border-brass rounded-lg shadow-2xl p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 relative">
              <img
                src="/images/business/G.png"
                alt="Glister Luxury"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-ivory font-serif font-bold text-lg">
                Install Glister Luxury
              </h3>
              <p className="text-ivory/70 text-sm">
                {isIOS && isSafari
                  ? 'Add to Home Screen for a better experience'
                  : 'Install our app for quick access'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-ivory/50 hover:text-ivory transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isIOS && isSafari ? (
          <div className="space-y-3">
            <div className="bg-charcoal/50 rounded p-3 border border-brass/30">
              <p className="text-ivory/80 text-sm mb-2">
                To install on iOS:
              </p>
              <ol className="text-ivory/70 text-xs space-y-1 list-decimal list-inside">
                <li>Tap the Share button <span className="text-brass">□↑</span> at the bottom</li>
                <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
                <li>Tap &quot;Add&quot; to confirm</li>
              </ol>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full bg-brass text-charcoal font-semibold py-2 px-4 rounded hover:bg-brass/90 transition-colors"
            >
              Got it
            </button>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full bg-brass text-charcoal font-semibold py-2 px-4 rounded hover:bg-brass/90 transition-colors"
          >
            Install App
          </button>
        )}
      </div>
    </div>
  )
}

