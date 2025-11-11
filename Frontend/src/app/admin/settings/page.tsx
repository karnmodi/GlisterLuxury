'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useSettings as useGlobalSettings } from '@/contexts/SettingsContext'
import { settingsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Settings, DeliveryTier, AutoReplyConfig } from '@/types'
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
  const [autoReplySettings, setAutoReplySettings] = useState<AutoReplyConfig[]>([])

  // Business emails
  const businessEmails = [
    'enquiries@glisterlondon.com',
    'sales@glisterlondon.com',
    'orders@glisterlondon.com',
    'noreply@glisterlondon.com'
  ]

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
      
      // Initialize auto-reply settings
      if (data.autoReplySettings && data.autoReplySettings.length > 0) {
        setAutoReplySettings(data.autoReplySettings)
      } else {
        // Initialize with default configs for each business email
        const defaultConfigs: AutoReplyConfig[] = businessEmails.map(email => ({
          emailAddress: email,
          enabled: false,
          subject: email === 'enquiries@glisterlondon.com' ? 'Thank you for contacting Glister London' : '',
          message: email === 'enquiries@glisterlondon.com' 
            ? `Thank you for reaching out to Glister London! 💛

We're thrilled to hear from you and delighted to welcome you into the Glister family. Your enquiry is important to us, and our dedicated Enquiries Team will personally get back to you within 3 business days.

At Glister London, every product we craft reflects timeless design, superior quality, and the elegance you deserve. From luxurious bathroom accessories to our full range of premium hardware solutions, we are committed to bringing beauty and distinction into your home.

We can't wait to assist you and make your experience with Glister London truly exceptional. Your journey with us is just beginning, and we're excited to share it with you! ✨

Warm regards,

The Glister London Enquiries Team

Crafted for those who value distinction.

+44 7767 198433 | enquiries@glisterlondon.com

https://www.glisterlondon.com/`
            : ''
        }))
        setAutoReplySettings(defaultConfigs)
      }
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

      // Update lastUpdated and updatedBy for auto-reply settings
      const updatedAutoReplySettings = autoReplySettings.map(config => ({
        ...config,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'admin'
      }))

      const updates: Partial<Settings> = {
        deliveryTiers,
        freeDeliveryThreshold: {
          enabled: freeDeliveryEnabled,
          amount: freeDeliveryAmountNum
        },
        vatRate: vatRateNum,
        vatEnabled,
        autoReplySettings: updatedAutoReplySettings
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
      if (response.settings.autoReplySettings) {
        setAutoReplySettings(response.settings.autoReplySettings)
      }

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
      if (response.settings.autoReplySettings) {
        setAutoReplySettings(response.settings.autoReplySettings)
      }

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
      <div className="flex items-center justify-center h-40">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brass border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-charcoal/60 text-xs">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-90px)] md:h-[calc(100vh-90px)] flex flex-col gap-2 overflow-hidden">
      {/* Compact Header */}
      <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 shadow border border-brass/20">
        <h1 className="text-sm font-serif font-bold text-charcoal">Settings</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleResetSettings}
            disabled={saving}
            variant="ghost"
            size="sm"
            className="text-xs border border-charcoal/30 text-charcoal hover:bg-charcoal/10 hover:border-charcoal/50 disabled:opacity-50"
          >
            Reset
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            size="sm"
            className="text-xs bg-brass text-white hover:bg-brass/90 border border-brass disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded px-2 py-1.5 flex items-start justify-between">
          <div className="flex items-start gap-1.5 flex-1">
            <svg className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-[10px] text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-2 p-1 hover:bg-red-100 rounded flex-shrink-0 border border-red-300 hover:border-red-400 transition-colors"
            title="Dismiss"
          >
            <svg className="w-3 h-3 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {/* Delivery Tiers Section */}
        <div className="bg-white rounded-lg shadow border border-brass/20 p-2">
          <h2 className="text-xs font-bold text-charcoal mb-1">Delivery Tiers</h2>
          <p className="text-charcoal/60 mb-2 text-[10px]">
            Configure tiered delivery fees based on order value (after discount).
          </p>

          {/* Current Tiers */}
          {deliveryTiers.length > 0 && (
            <div className="mb-2">
              <h3 className="text-[10px] font-semibold text-charcoal mb-1">Current Tiers</h3>
              <div className="space-y-1">
                {deliveryTiers.map((tier, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-1.5 bg-cream/50 rounded"
                  >
                    <div className="flex-1">
                      <span className="text-[11px] text-charcoal font-medium">
                        {formatCurrency(tier.minAmount)} - {tier.maxAmount ? formatCurrency(tier.maxAmount) : '∞'}
                      </span>
                      <span className="mx-2 text-charcoal/50 text-[10px]">→</span>
                      <span className="text-[11px] text-brass font-semibold">
                        {tier.fee === 0 ? 'FREE' : formatCurrency(tier.fee)}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleRemoveTier(index)}
                      variant="ghost"
                      size="sm"
                      className="text-[10px] py-0.5 px-2 border border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 font-medium"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Tier */}
          <div className="border-t border-charcoal/10 pt-2">
            <h3 className="text-[10px] font-semibold text-charcoal mb-1">Add New Tier</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5">
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
                  placeholder="∞"
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
                  size="sm"
                  className="w-full text-[10px] bg-brass text-white hover:bg-brass/90 border border-brass font-medium"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Free Delivery Threshold */}
        <div className="bg-white rounded-lg shadow border border-brass/20 p-2">
          <h2 className="text-xs font-bold text-charcoal mb-1">Free Delivery Threshold</h2>
          <p className="text-charcoal/60 mb-2 text-[10px]">
            Automatically apply free delivery when order total (after discount) exceeds this amount.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <input
                type="checkbox"
                id="freeDeliveryEnabled"
                checked={freeDeliveryEnabled}
                onChange={(e) => setFreeDeliveryEnabled(e.target.checked)}
                className="w-3.5 h-3.5 text-brass border-charcoal/30 rounded focus:ring-brass"
              />
              <label htmlFor="freeDeliveryEnabled" className="text-[11px] text-charcoal font-medium">
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
                <p className="text-[10px] text-charcoal/60 mt-1">
                  Orders {formatCurrency(parseFloat(freeDeliveryAmount || '0'))} or more will get free delivery
                </p>
              </div>
            )}
          </div>
        </div>

        {/* VAT Configuration */}
        <div className="bg-white rounded-lg shadow border border-brass/20 p-2">
          <h2 className="text-xs font-bold text-charcoal mb-1">VAT Configuration</h2>
          <p className="text-charcoal/60 mb-2 text-[10px]">
            Configure VAT (Value Added Tax) settings. All prices are VAT-inclusive (UK B2C standard).
            VAT is extracted from final prices for display and reporting purposes only.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <input
                type="checkbox"
                id="vatEnabled"
                checked={vatEnabled}
                onChange={(e) => setVatEnabled(e.target.checked)}
                className="w-3.5 h-3.5 text-brass border-charcoal/30 rounded focus:ring-brass"
              />
              <label htmlFor="vatEnabled" className="text-[11px] text-charcoal font-medium">
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
                <p className="text-[10px] text-charcoal/60 mt-1">
                  UK standard VAT rate is 20%
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Email Auto-Reply Configuration */}
        <div className="bg-white rounded-lg shadow border border-brass/20 p-2">
          <h2 className="text-xs font-bold text-charcoal mb-1">Email Auto-Reply Configuration</h2>
          <p className="text-charcoal/60 mb-2 text-[10px]">
            Configure automatic replies for incoming emails to your business email addresses. Auto-replies are sent when emails are received directly or through the contact form.
          </p>

          <div className="space-y-3">
            {businessEmails.map((email) => {
              const config = autoReplySettings.find(c => c.emailAddress === email) || {
                emailAddress: email,
                enabled: false,
                subject: '',
                message: ''
              }

              const updateConfig = (updates: Partial<AutoReplyConfig>) => {
                setAutoReplySettings(prev => {
                  const existing = prev.find(c => c.emailAddress === email)
                  if (existing) {
                    return prev.map(c => c.emailAddress === email ? { ...c, ...updates } : c)
                  } else {
                    return [...prev, { ...config, ...updates }]
                  }
                })
              }

              return (
                <div key={email} className="border border-charcoal/20 rounded p-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-semibold text-charcoal">{email}</h3>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id={`autoReplyEnabled-${email}`}
                        checked={config.enabled}
                        onChange={(e) => updateConfig({ enabled: e.target.checked })}
                        className="w-3.5 h-3.5 text-brass border-charcoal/30 rounded focus:ring-brass"
                      />
                      <label htmlFor={`autoReplyEnabled-${email}`} className="text-[10px] text-charcoal font-medium">
                        Enable Auto-Reply
                      </label>
                    </div>
                  </div>

                  {config.enabled && (
                    <div className="space-y-2 pl-2 border-l-2 border-brass/30">
                      <div>
                        <Input
                          label="Auto-Reply Subject"
                          type="text"
                          value={config.subject}
                          onChange={(e) => updateConfig({ subject: e.target.value })}
                          placeholder="e.g., Thank you for contacting Glister London"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-charcoal mb-1">
                          Auto-Reply Message
                          <span className="text-charcoal/60 ml-1">
                            ({config.message.length} characters)
                          </span>
                        </label>
                        <textarea
                          value={config.message}
                          onChange={(e) => updateConfig({ message: e.target.value })}
                          placeholder="Enter your auto-reply message here..."
                          rows={8}
                          className="w-full px-2 py-1.5 text-[11px] border border-charcoal/30 rounded focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass resize-y"
                        />
                        <p className="text-[9px] text-charcoal/60 mt-1">
                          You can use variables: {'{name}'}, {'{email}'}, {'{date}'}, {'{originalSubject}'}
                        </p>
                      </div>
                      {config.lastUpdated && (
                        <p className="text-[9px] text-charcoal/60">
                          Last updated: {new Date(config.lastUpdated).toLocaleString()} by {config.updatedBy || 'system'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Last Updated Info */}
        {settings && (
          <div className="text-[9px] text-charcoal/60 text-right px-2 pb-1">
            Last updated: {new Date(settings.lastUpdated || '').toLocaleString()} by {settings.updatedBy || 'system'}
          </div>
        )}
      </div>
    </div>
  )
}
