'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { settingsApi } from '@/lib/api'
import type { Settings } from '@/types'

interface SettingsContextType {
  settings: Settings | null
  loading: boolean
  error: string | null
  refetchSettings: () => Promise<void>
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await settingsApi.get()
      setSettings(data)
    } catch (err: any) {
      console.error('Failed to fetch settings:', err)
      setError(err.message || 'Failed to load settings')
      
      // Set default settings as fallback
      setSettings({
        deliveryTiers: [
          { minAmount: 0, maxAmount: 49.99, fee: 5.99 },
          { minAmount: 50, maxAmount: 99.99, fee: 3.99 },
          { minAmount: 100, maxAmount: null, fee: 0 }
        ],
        freeDeliveryThreshold: {
          enabled: true,
          amount: 100
        },
        vatRate: 20,
        vatEnabled: true,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const refetchSettings = async () => {
    await fetchSettings()
  }

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refetchSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

