'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cartApi } from '@/lib/api'
import { formatCurrency, toNumber } from '@/lib/utils'
import type { Cart, NearMissOffer } from '@/types'

interface NearMissOfferBannerProps {
  cart: Cart | null
  sessionID: string
  userId?: string
}

export default function NearMissOfferBanner({
  cart,
  sessionID,
  userId
}: NearMissOfferBannerProps) {
  const [nearMissOffers, setNearMissOffers] = useState<NearMissOffer[]>([])
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Only fetch if cart has items and not dismissed
    if (!cart || cart.items.length === 0 || dismissed) {
      setNearMissOffers([])
      return
    }

    fetchNearMissOffers()
  }, [cart?.subtotal, cart?.items.length, dismissed])

  const fetchNearMissOffers = async () => {
    try {
      setLoading(true)
      const response = await cartApi.getNearMissOffers(sessionID, userId || cart?.userID)
      setNearMissOffers(response.nearMissOffers || [])
    } catch (error) {
      console.error('Failed to fetch near-miss offers:', error)
      setNearMissOffers([])
    } finally {
      setLoading(false)
    }
  }

  // Don't show if no near-miss offers or loading
  if (loading || nearMissOffers.length === 0 || dismissed) {
    return null
  }

  const topOffer = nearMissOffers[0]
  const gapAmount = toNumber(topOffer.gapAmount)
  const potentialSavings = toNumber(topOffer.potentialDiscount)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="relative bg-gradient-to-r from-brass/10 via-brass/5 to-transparent border-l-4 border-brass rounded-lg p-4 mb-4 shadow-sm"
      >
        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 text-charcoal/40 hover:text-charcoal/60 transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start gap-3 pr-6">
          {/* Icon */}
          <div className="shrink-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-brass/20 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-brass" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm sm:text-base font-semibold text-charcoal mb-1">
              🎉 You're close to a discount!
            </h4>
            <p className="text-xs sm:text-sm text-charcoal/80 mb-2">
              Add <span className="font-bold text-brass">{formatCurrency(gapAmount)}</span> more to your cart to unlock:
            </p>

            {/* Offer details */}
            <div className="bg-white/60 border border-brass/20 rounded-md p-2 sm:p-3">
              <p className="text-xs sm:text-sm font-medium text-charcoal">
                {topOffer.offer.displayName || topOffer.offer.description}
              </p>
              <p className="text-xs text-green-600 font-semibold mt-1">
                  Potential savings: {formatCurrency(potentialSavings)}
              </p>
            </div>

            {/* Additional offers indicator */}
            {nearMissOffers.length > 1 && (
              <p className="text-xs text-charcoal/60 mt-2">
                +{nearMissOffers.length - 1} more {nearMissOffers.length - 1 === 1 ? 'offer' : 'offers'} available
              </p>
            )}
          </div>
        </div>

        {/* Mobile-friendly progress indicator */}
        <div className="mt-3">
          <div className="relative w-full h-2 bg-charcoal/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(100, ((toNumber(cart?.subtotal) || 0) / toNumber(topOffer.offer.minOrderAmount)) * 100)}%`
              }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-brass to-brass/70"
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-charcoal/60">
              Current: {formatCurrency(toNumber(cart?.subtotal) || 0)}
            </span>
            <span className="text-xs font-medium text-brass">
              Goal: {formatCurrency(toNumber(topOffer.offer.minOrderAmount))}
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
