import React from 'react'
import { formatCurrency, toNumber } from '@/lib/utils'
import type { Order, Cart } from '@/types'
import { motion } from 'framer-motion'

interface OrderSummaryProps {
  data: Order | Cart
  type: 'order' | 'cart'
}

export default function OrderSummary({ data, type }: OrderSummaryProps) {
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
        
        {/* Discount Display */}
        {discountCode && discountAmount && toNumber(discountAmount) > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex justify-between text-sm text-green-400"
          >
            <span>Discount ({discountCode})</span>
            <span className="font-medium">-{formatCurrency(discountAmount)}</span>
          </motion.div>
        )}
        
        {type === 'order' && (
          <>
            <div className="flex justify-between text-sm text-ivory/70">
              <span>Shipping</span>
              <span>{formatCurrency((data as Order).pricing.shipping)}</span>
            </div>
            <div className="flex justify-between text-sm text-ivory/70">
              <span>Tax</span>
              <span>{formatCurrency((data as Order).pricing.tax)}</span>
            </div>
          </>
        )}
        
        <div className="flex justify-between text-lg font-bold text-ivory border-t border-brass/20 pt-3 mt-3">
          <span>Total</span>
          <span className="text-brass">
            {type === 'order' 
              ? formatCurrency((data as Order).pricing.total)
              : formatCurrency((data as Cart).total || (toNumber(subtotal) - toNumber(discountAmount || 0)))
            }
          </span>
        </div>
      </div>

      {type === 'cart' && (
        <p className="text-xs text-ivory/50 mt-4 text-center">
          Shipping and taxes calculated at checkout
        </p>
      )}
    </div>
  )
}

