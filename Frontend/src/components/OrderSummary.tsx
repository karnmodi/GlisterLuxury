import React, { useEffect, useState } from 'react'
import { formatCurrency, toNumber } from '@/lib/utils'
import { useSettings } from '@/contexts/SettingsContext'
import type { Order, Cart } from '@/types'
import { motion } from 'framer-motion'

interface OrderSummaryProps {
  data: Order | Cart
  type: 'order' | 'cart'
}

export default function OrderSummary({ data, type }: OrderSummaryProps) {
  const { settings } = useSettings()
  const [estimatedShipping, setEstimatedShipping] = useState(0)
  const [estimatedVAT, setEstimatedVAT] = useState(0)

  // Calculate shipping and VAT for cart
  useEffect(() => {
    if (type !== 'cart' || !settings) {
      setEstimatedShipping(0)
      setEstimatedVAT(0)
      return
    }

    const cart = data as Cart
    const subtotal = toNumber(cart.subtotal)
    const discount = toNumber(cart.discountAmount || 0)
    const totalAfterDiscount = Math.max(0, subtotal - discount)

    // Calculate shipping
    let shipping = 0
    if (settings.freeDeliveryThreshold?.enabled &&
        totalAfterDiscount >= settings.freeDeliveryThreshold.amount) {
      shipping = 0
    } else {
      for (const tier of settings.deliveryTiers) {
        if (totalAfterDiscount >= tier.minAmount &&
            (tier.maxAmount === null || totalAfterDiscount <= tier.maxAmount)) {
          shipping = tier.fee
          break
        }
      }
    }

    // Calculate VAT (extract from VAT-inclusive prices)
    // VAT amount = price / (1 + rate/100) * (rate/100)
    const vatRate = settings.vatRate || 20
    const taxableAmount = totalAfterDiscount + shipping
    const vat = settings.vatEnabled ? (taxableAmount * (vatRate / 100)) / (1 + vatRate / 100) : 0

    setEstimatedShipping(shipping)
    setEstimatedVAT(vat)
  }, [type, data, settings])
  const items = data.items
  const subtotal = type === 'order' 
    ? (data as Order).pricing.subtotal 
    : (data as Cart).subtotal
  
  const discountAmount = type === 'cart'
    ? (data as Cart).discountAmount
    : (data as Order).pricing.discount
  const discountCode = type === 'cart'
    ? (data as Cart).discountCode
    : (data as Order).discountCode
  const isAutoApplied = type === 'cart' ? (data as Cart).isAutoApplied : false

  return (
    <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6">
      <h3 className="text-xl font-serif font-bold text-ivory mb-4">
        {type === 'order' ? 'Order Summary' : 'Cart Summary'}
      </h3>

      {/* Items List */}
      <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item._id} className="flex justify-between items-start text-sm border-b border-brass/10 pb-3">
            <div className="flex-1">
              <p className="text-ivory font-medium">{item.productName}</p>
              <p className="text-brass/70 text-xs">{item.productCode}</p>
              <div className="text-ivory/60 text-xs mt-1 space-y-0.5">
                <p>Material: {item.selectedMaterial.name}</p>
                {item.selectedSize != null && <p>Size: {item.selectedSizeName ? `${item.selectedSizeName} ${item.selectedSize}mm` : `${item.selectedSize}mm`}</p>}
                {item.selectedFinish && <p>Finish: {item.selectedFinish.name}</p>}
                <p>Qty: {item.quantity}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-brass font-medium">{formatCurrency(item.totalPrice)}</p>
              <p className="text-ivory/50 text-xs">{formatCurrency(item.unitPrice)} each</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Summary */}
      <div className="space-y-2 border-t border-brass/20 pt-4">
        <div className="flex justify-between text-sm text-ivory/70">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        
        {/* Discount Display - Enhanced */}
        {discountCode && discountAmount && toNumber(discountAmount) > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex justify-between items-center text-sm p-2 rounded-md -mx-2 ${
              isAutoApplied
                ? 'bg-brass/10 border border-brass/20'
                : 'bg-green-500/10 border border-green-500/20'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {isAutoApplied && (
                <svg className="w-3.5 h-3.5 text-brass" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
              <span className={isAutoApplied ? 'text-brass font-medium' : 'text-green-400 font-medium'}>
                Discount
                {isAutoApplied && <span className="text-xs ml-1">(Auto-Applied)</span>}
              </span>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${isAutoApplied ? 'text-brass' : 'text-green-400'}`}>
                -{formatCurrency(discountAmount)}
              </p>
              <p className="text-xs text-ivory/60 font-mono">{discountCode}</p>
            </div>
          </motion.div>
        )}
        
        {/* Shipping and Tax - Show for both order and cart */}
        {type === 'order' ? (
          <>
            <div className="flex justify-between text-sm text-ivory/70">
              <span>Shipping</span>
              <span>{formatCurrency((data as Order).pricing.shipping)}</span>
            </div>
            <div className="flex justify-between text-sm text-ivory/70">
              <span>Tax (VAT)</span>
              <span>{formatCurrency((data as Order).pricing.tax)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between text-sm text-ivory/70">
              <span>Shipping</span>
              <span>
                {estimatedShipping === 0 ? (
                  <span className="text-green-400 font-semibold">FREE</span>
                ) : (
                  formatCurrency(estimatedShipping)
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm text-ivory/70">
              <span>VAT ({settings?.vatRate || 20}%) included:</span>
              <span>{formatCurrency(estimatedVAT)}</span>
            </div>
          </>
        )}

        <div className="flex justify-between text-lg font-bold text-ivory border-t border-brass/20 pt-3 mt-3">
          <span>Total (inc. VAT)</span>
          <span className="text-brass">
            {type === 'order'
              ? formatCurrency((data as Order).pricing.total)
              : formatCurrency(
                  Math.max(0, toNumber(subtotal) - toNumber(discountAmount || 0) + estimatedShipping)
                )
            }
          </span>
        </div>
        <p className="text-xs text-ivory/60 mt-1">All prices include VAT</p>
      </div>
    </div>
  )
}

