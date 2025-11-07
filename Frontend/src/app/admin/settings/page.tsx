'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useSettings as useGlobalSettings } from '@/contexts/SettingsContext'
import { settingsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { Settings, DeliveryTier } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function SettingsPage() {
  const { token } = useAuth()
  const toast = useToast()
  const { refetchSettings } = useGlobalSettings()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [deliveryTiers, setDeliveryTiers] = useState<DeliveryTier[]>([])
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(true)
  const [freeDeliveryAmount, setFreeDeliveryAmount] = useState('100')
  const [vatRate, setVatRate] = useState('20')
  const [vatEnabled, setVatEnabled] = useState(true)

  // New tier form
  const [newTier, setNewTier] = useState({
    minAmount: '',
    maxAmount: '',
    fee: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const data = await settingsApi.get()
      setSettings(data)

      // Populate form with current settings
      setDeliveryTiers(data.deliveryTiers)
      setFreeDeliveryEnabled(data.freeDeliveryThreshold.enabled)
      setFreeDeliveryAmount(data.freeDeliveryThreshold.amount.toString())
      setVatRate(data.vatRate.toString())
      setVatEnabled(data.vatEnabled)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTier = () => {
    const minAmount = parseFloat(newTier.minAmount)
    const maxAmount = newTier.maxAmount ? parseFloat(newTier.maxAmount) : null
    const fee = parseFloat(newTier.fee)

    // Validation
    if (isNaN(minAmount) || minAmount < 0) {
      toast.error('Please enter a valid minimum amount')
      return
    }

    if (newTier.maxAmount && (isNaN(maxAmount!) || maxAmount! <= minAmount)) {
      toast.error('Maximum amount must be greater than minimum amount')
      return
    }

    if (isNaN(fee) || fee < 0) {
      toast.error('Please enter a valid fee')
      return
    }

    // Check for overlaps
    for (const tier of deliveryTiers) {
      if (minAmount >= tier.minAmount && minAmount < (tier.maxAmount || Infinity)) {
        toast.error('This tier overlaps with an existing tier')
        return
      }
      if (maxAmount && maxAmount > tier.minAmount && maxAmount <= (tier.maxAmount || Infinity)) {
        toast.error('This tier overlaps with an existing tier')
        return
      }
    }

    const newTierObj: DeliveryTier = {
      minAmount,
      maxAmount,
      fee
    }

    const updatedTiers = [...deliveryTiers, newTierObj].sort((a, b) => a.minAmount - b.minAmount)
    setDeliveryTiers(updatedTiers)
    setNewTier({ minAmount: '', maxAmount: '', fee: '' })
    toast.success('Tier added successfully')
  }

  const handleRemoveTier = (index: number) => {
    const updatedTiers = deliveryTiers.filter((_, i) => i !== index)
    setDeliveryTiers(updatedTiers)
    toast.success('Tier removed successfully')
  }

  const handleSaveSettings = async () => {
    if (!token) {
      toast.error('You must be logged in to save settings')
      return
    }

    // Clear any previous errors
    setError(null)

    // Validate inputs before saving
    const freeDeliveryAmountNum = parseFloat(freeDeliveryAmount)
    if (freeDeliveryEnabled && (isNaN(freeDeliveryAmountNum) || freeDeliveryAmountNum < 0)) {
      const errorMsg = 'Please enter a valid free delivery threshold amount'
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    const vatRateNum = parseFloat(vatRate)
    if (vatEnabled && (isNaN(vatRateNum) || vatRateNum < 0 || vatRateNum > 100)) {
      const errorMsg = 'Please enter a valid VAT rate (0-100)'
      setError(errorMsg)
      toast.error(errorMsg)
      return
    }

    try {
      setSaving(true)

      const updates: Partial<Settings> = {
        deliveryTiers,
        freeDeliveryThreshold: {
          enabled: freeDeliveryEnabled,
          amount: freeDeliveryAmountNum
        },
        vatRate: vatRateNum,
        vatEnabled
      }

      console.log('=== FRONTEND: Sending settings update ===')
      console.log('Updates:', updates)

      const response = await settingsApi.update(token, updates)
      
      console.log('=== FRONTEND: Received response ===')
      console.log('Response:', response)

      // Update local state with server response
      setSettings(response.settings)
      setDeliveryTiers(response.settings.deliveryTiers)
      setFreeDeliveryEnabled(response.settings.freeDeliveryThreshold.enabled)
      setFreeDeliveryAmount(response.settings.freeDeliveryThreshold.amount.toString())
      setVatRate(response.settings.vatRate.toString())
      setVatEnabled(response.settings.vatEnabled)

      // Refresh global settings context so changes are available app-wide
      await refetchSettings()

      toast.success('Settings saved successfully')

      // Verify persistence by fetching settings again after a short delay
      console.log('=== FRONTEND: Verifying persistence ===')
      setTimeout(async () => {
        try {
          const verifiedSettings = await settingsApi.get()
          console.log('=== FRONTEND: Verified settings from server ===')
          console.log('Verified:', {
            deliveryTiers: verifiedSettings.deliveryTiers.length,
            freeDeliveryAmount: verifiedSettings.freeDeliveryThreshold.amount,
            vatRate: verifiedSettings.vatRate,
            vatEnabled: verifiedSettings.vatEnabled
          })
          
          // Check if verification matches what we saved
          if (verifiedSettings.freeDeliveryThreshold.amount !== freeDeliveryAmountNum ||
              verifiedSettings.vatRate !== vatRateNum) {
            console.error('PERSISTENCE VERIFICATION FAILED!')
            console.error('Expected:', { freeDeliveryAmount: freeDeliveryAmountNum, vatRate: vatRateNum })
            console.error('Got:', { 
              freeDeliveryAmount: verifiedSettings.freeDeliveryThreshold.amount, 
              vatRate: verifiedSettings.vatRate 
            })
            toast.error('Warning: Settings may not have persisted correctly. Please refresh and verify.')
          } else {
            console.log('✅ Persistence verified successfully')
          }
        } catch (error) {
          console.error('Failed to verify persistence:', error)
        }
      }, 1000)

    } catch (error: any) {
      console.error('=== FRONTEND: Error saving settings ===')
      console.error('Error:', error)
      console.error('Error message:', error.message)
      console.error('Error response:', error.response?.data)
      
      const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message || 'Failed to save settings'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleResetSettings = async () => {
    if (!token) {
      toast.error('You must be logged in to reset settings')
      return
    }

    if (!confirm('Are you sure you want to reset settings to default? This cannot be undone.')) {
      return
    }

    try {
      setSaving(true)
      const response = await settingsApi.reset(token)
      setSettings(response.settings)

      // Update form state
      setDeliveryTiers(response.settings.deliveryTiers)
      setFreeDeliveryEnabled(response.settings.freeDeliveryThreshold.enabled)
      setFreeDeliveryAmount(response.settings.freeDeliveryThreshold.amount.toString())
      setVatRate(response.settings.vatRate.toString())
      setVatEnabled(response.settings.vatEnabled)

      toast.success('Settings reset to default')
    } catch (error: any) {
      console.error('Failed to reset settings:', error)
      toast.error(error.message || 'Failed to reset settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brass"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-4">
      <div className="container mx-auto px-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Error Banner */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start justify-between">
              <div className="flex items-start gap-2 flex-1">
                <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-red-800">Error Saving Settings</h3>
                  <p className="text-xs text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-2 p-0.5 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                title="Dismiss"
              >
                <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg sm:text-xl font-serif font-bold text-charcoal">Settings</h1>
            <div className="flex gap-4">
              <Button
                onClick={handleResetSettings}
                disabled={saving}
                variant="secondary"
              >
                Reset to Default
              </Button>
              <Button
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>

          {/* Delivery Tiers Section */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-3">
            <h2 className="text-lg font-bold text-charcoal mb-3">Delivery Tiers</h2>
            <p className="text-charcoal/60 mb-4 text-sm">
              Configure tiered delivery fees based on order value (after discount is applied).
            </p>

            {/* Current Tiers */}
            {deliveryTiers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-charcoal mb-2">Current Tiers</h3>
                <div className="space-y-1.5">
                  {deliveryTiers.map((tier, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-cream/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <span className="text-charcoal font-medium">
                          {formatCurrency(tier.minAmount)} - {tier.maxAmount ? formatCurrency(tier.maxAmount) : '∞'}
                        </span>
                        <span className="mx-3 text-charcoal/50">→</span>
                        <span className="text-brass font-semibold">
                          {tier.fee === 0 ? 'FREE' : formatCurrency(tier.fee)}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleRemoveTier(index)}
                        variant="secondary"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Tier */}
            <div className="border-t border-charcoal/10 pt-4">
              <h3 className="text-sm font-semibold text-charcoal mb-2">Add New Tier</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <Input
                    label="Min Amount (£)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newTier.minAmount}
                    onChange={(e) => setNewTier({ ...newTier, minAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Input
                    label="Max Amount (£)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newTier.maxAmount}
                    onChange={(e) => setNewTier({ ...newTier, maxAmount: e.target.value })}
                    placeholder="Leave empty for ∞"
                  />
                </div>
                <div>
                  <Input
                    label="Delivery Fee (£)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newTier.fee}
                    onChange={(e) => setNewTier({ ...newTier, fee: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAddTier}
                    className="w-full"
                  >
                    Add Tier
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Free Delivery Threshold */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-3">
            <h2 className="text-lg font-bold text-charcoal mb-3">Free Delivery Threshold</h2>
            <p className="text-charcoal/60 mb-4 text-sm">
              Automatically apply free delivery when order total (after discount) exceeds this amount.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="freeDeliveryEnabled"
                  checked={freeDeliveryEnabled}
                  onChange={(e) => setFreeDeliveryEnabled(e.target.checked)}
                  className="w-5 h-5 text-brass border-charcoal/30 rounded focus:ring-brass"
                />
                <label htmlFor="freeDeliveryEnabled" className="text-charcoal font-medium">
                  Enable free delivery threshold
                </label>
              </div>

              {freeDeliveryEnabled && (
                <div className="max-w-xs">
                  <Input
                    label="Threshold Amount (£)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={freeDeliveryAmount}
                    onChange={(e) => setFreeDeliveryAmount(e.target.value)}
                  />
                  <p className="text-sm text-charcoal/60 mt-2">
                    Orders {formatCurrency(parseFloat(freeDeliveryAmount || '0'))} or more will get free delivery
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* VAT Configuration */}
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-bold text-charcoal mb-3">VAT Configuration</h2>
            <p className="text-charcoal/60 mb-4 text-sm">
              Configure VAT (Value Added Tax) settings. All prices are VAT-inclusive (UK B2C standard).
              VAT is extracted from final prices for display and reporting purposes only.
            </p>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="vatEnabled"
                  checked={vatEnabled}
                  onChange={(e) => setVatEnabled(e.target.checked)}
                  className="w-5 h-5 text-brass border-charcoal/30 rounded focus:ring-brass"
                />
                <label htmlFor="vatEnabled" className="text-charcoal font-medium">
                  Enable VAT calculation
                </label>
              </div>

              {vatEnabled && (
                <div className="max-w-xs">
                  <Input
                    label="VAT Rate (%)"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                  />
                  <p className="text-sm text-charcoal/60 mt-2">
                    UK standard VAT rate is 20%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Last Updated Info */}
          {settings && (
            <div className="mt-6 text-sm text-charcoal/60 text-right">
              Last updated: {new Date(settings.lastUpdated || '').toLocaleString()} by {settings.updatedBy || 'system'}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
