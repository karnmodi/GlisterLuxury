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
  const isAutoApplied = cart?.isAutoApplied || false
  const discountMethod = cart?.discountApplicationMethod || 'none'

  return (
    <div className="bg-gradient-ivory rounded-lg border border-brass/20 p-3 sm:p-4">
      <h3 className="text-xs sm:text-sm font-semibold text-charcoal mb-2.5 sm:mb-3">Discount Code</h3>

      {!hasDiscount ? (
        <div className="space-y-2">
          <div className="flex gap-2 flex-col sm:flex-row">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setErrorMessage('')
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleApplyCode()}
              placeholder="Enter code"
              className={`flex-1 px-3 py-2.5 sm:py-3 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent min-h-[44px] ${
                errorMessage ? 'border-red-500' : 'border-brass/30'
              }`}
            />
            <Button
              onClick={handleApplyCode}
              disabled={applying || !code.trim()}
              size="sm"
              className="px-4 sm:w-auto w-full min-h-[44px] text-sm sm:text-base"
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
                className="text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2"
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
          className="space-y-2.5 sm:space-y-3"
        >
          {/* Applied Discount Display - Different UI for Auto vs Manual */}
          <div className={`flex items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-md px-3 sm:px-4 py-2.5 sm:py-3 ${
            isAutoApplied
              ? 'bg-gradient-to-r from-brass/10 to-brass/5 border-2 border-brass/30'
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-start sm:items-center gap-2 mb-1">
                {isAutoApplied ? (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-brass flex-shrink-0 mt-0.5 sm:mt-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-brass">Auto-Applied Discount!</p>
                      <p className="text-[10px] sm:text-xs text-charcoal/60 mt-0.5 line-clamp-2">Best deal automatically applied for you</p>
                    </div>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs sm:text-sm font-semibold text-charcoal">Discount Applied</p>
                  </>
                )}
              </div>
              <p className="text-xs sm:text-sm font-mono font-bold text-brass mt-1 truncate">
                {cart?.discountCode || 'N/A'}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-green-600 mt-1">
                💰 You save: {formatCurrency(discountAmount)}
              </p>
            </div>
            <button
              onClick={handleRemoveCode}
              disabled={removing}
              className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 min-w-[44px] min-h-[44px]"
              title="Remove discount code"
              aria-label="Remove discount code"
            >
              {removing ? (
                <>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Removing...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden sm:inline">Remove</span>
                </>
              )}
            </button>
          </div>

          {/* Info Message */}
          {isAutoApplied ? (
            <p className="text-[10px] sm:text-xs text-charcoal/60 bg-brass/5 border border-brass/20 rounded px-2.5 sm:px-3 py-1.5 sm:py-2">
              ✨ This discount was automatically applied because it gives you the best savings! You can remove it and enter a different code if you prefer.
            </p>
          ) : (
            <p className="text-[10px] sm:text-xs text-charcoal/60 bg-charcoal/5 border border-brass/20 rounded px-2.5 sm:px-3 py-1.5 sm:py-2">
              Only one discount code can be applied per cart. Remove this discount to apply a different one.
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}

