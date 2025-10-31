'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/contexts/ToastContext'
import { cartApi } from '@/lib/api'
import { formatCurrency, toNumber } from '@/lib/utils'
import type { Cart } from '@/types'
import Button from '@/components/ui/Button'

interface OfferCodeInputProps {
  cart: Cart | null
  sessionID: string
  userId?: string
  onDiscountApplied: () => void
  onCartUpdate?: (cart: Cart) => void
  showError?: boolean
}

export default function OfferCodeInput({
  cart,
  sessionID,
  userId,
  onDiscountApplied,
  onCartUpdate,
  showError = true
}: OfferCodeInputProps) {
  const [code, setCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const toast = useToast()

  const handleApplyCode = async () => {
    if (!code.trim()) {
      if (showError) {
        setErrorMessage('Please enter a discount code')
      } else {
        toast.warning('Please enter a discount code')
      }
      return
    }

    try {
      setApplying(true)
      setErrorMessage('')
      const response = await cartApi.applyDiscount(sessionID, code.trim().toUpperCase(), userId)
      setCode('')
      toast.success('Discount code applied successfully!')
      // Update cart state directly from response if callback provided, otherwise refresh
      if (onCartUpdate && response.cart) {
        onCartUpdate(response.cart)
      } else {
        onDiscountApplied()
      }
    } catch (error: any) {
      console.error('Failed to apply discount:', error)
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to apply discount code'
      setErrorMessage(errorMsg)
      if (showError) {
        toast.error(errorMsg)
      }
    } finally {
      setApplying(false)
    }
  }

  const handleRemoveCode = async () => {
    try {
      setRemoving(true)
      setErrorMessage('')
      const response = await cartApi.removeDiscount(sessionID)
      toast.success('Discount code removed')
      // Update cart state directly from response if callback provided, otherwise refresh
      if (onCartUpdate && response.cart) {
        onCartUpdate(response.cart)
      } else {
        onDiscountApplied()
      }
    } catch (error: any) {
      console.error('Failed to remove discount:', error)
      toast.error('Failed to remove discount code')
    } finally {
      setRemoving(false)
    }
  }

  // Check if discount is applied - handle both Decimal128 and number formats
  const discountAmount = cart?.discountAmount ? toNumber(cart.discountAmount) : 0
  const hasDiscount = Boolean(cart?.discountCode && discountAmount > 0)

  return (
    <div className="bg-gradient-ivory rounded-lg border border-brass/20 p-4">
      <h3 className="text-sm font-semibold text-charcoal mb-3">Discount Code</h3>
      
      {!hasDiscount ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setErrorMessage('')
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
              placeholder="Enter code"
              className={`flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent ${
                errorMessage ? 'border-red-500' : 'border-brass/30'
              }`}
            />
            <Button
              onClick={handleApplyCode}
              disabled={applying || !code.trim()}
              size="sm"
              className="px-4"
            >
              {applying ? 'Applying...' : 'Apply'}
            </Button>
          </div>
          
          {/* Error Message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2"
              >
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          {/* Applied Discount Display */}
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-4 py-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-semibold text-charcoal">Discount Applied</p>
              </div>
              <p className="text-sm font-mono font-bold text-brass">Code: {cart?.discountCode || 'N/A'}</p>
              <p className="text-xs text-charcoal/70">Savings: {formatCurrency(discountAmount)}</p>
            </div>
            <button
              onClick={handleRemoveCode}
              disabled={removing}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove discount code"
            >
              {removing ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Removing...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Remove
                </>
              )}
            </button>
          </div>
          
          {/* Info Message */}
          <p className="text-xs text-charcoal/60 bg-charcoal/5 border border-brass/20 rounded px-3 py-2">
            Only one discount code can be applied per cart. Remove this discount to apply a different one.
          </p>
        </motion.div>
      )}
    </div>
  )
}

