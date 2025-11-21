'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { toNumber, formatCurrency } from '@/lib/utils'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import Button from '@/components/ui/Button'
import OfferCodeInput from '@/components/OfferCodeInput'
import { motion, AnimatePresence } from 'framer-motion'
import type { CartItem, Product } from '@/types'

export default function CartPage() {
  const router = useRouter()
  const { cart, loading, updateQuantity, removeItem, clearCart, refreshCart, sessionID } = useCart()
  const { isAuthenticated, user } = useAuth()
  const { settings } = useSettings()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [localCart, setLocalCart] = useState<typeof cart>(cart)
  const [estimatedShipping, setEstimatedShipping] = useState(0)

  // Sync local cart with context cart
  useEffect(() => {
    setLocalCart(cart)
  }, [cart])

  // Only refresh cart if it's null and sessionID is available (on initial load)
  useEffect(() => {
    if (!cart && sessionID) {
      refreshCart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - cart and sessionID are checked inside

  // Calculate estimated shipping when cart or settings change
  useEffect(() => {
    if (!settings || !cart) {
      setEstimatedShipping(0)
      return
    }

    // Calculate total after discount (same logic as backend)
    const subtotal = toNumber(cart.subtotal)
    const discount = toNumber(cart.discountAmount || 0)
    const totalAfterDiscount = Math.max(0, subtotal - discount)

    // Check free delivery threshold first
    if (settings.freeDeliveryThreshold?.enabled &&
        totalAfterDiscount >= settings.freeDeliveryThreshold.amount) {
      setEstimatedShipping(0)
      return
    }

    // Find matching tier
    let shippingFee = 0
    for (const tier of settings.deliveryTiers) {
      if (totalAfterDiscount >= tier.minAmount &&
          (tier.maxAmount === null || totalAfterDiscount <= tier.maxAmount)) {
        shippingFee = tier.fee
        break
      }
    }

    setEstimatedShipping(shippingFee)
  }, [cart, settings])

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // Remove item from cart if quantity reaches 0 (no confirmation)
      await handleRemoveItem(itemId, false)
      return
    }
    try {
      await updateQuantity(itemId, newQuantity)
    } catch (error) {
      console.error('Failed to update quantity:', error)
    }
  }

  const handleRemoveItem = async (itemId: string, showConfirm = true) => {
    if (showConfirm && !confirm('Remove this item from cart?')) return
    try {
      await removeItem(itemId)
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  const handleClearCart = async () => {
    if (!confirm('Clear entire cart?')) return
    try {
      await clearCart()
    } catch (error) {
      console.error('Failed to clear cart:', error)
    }
  }

  const toggleBreakdown = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const getProductFromItem = (item: CartItem): Product | null => {
    if (typeof item.productID === 'string') return null
    return item.productID
  }

  const displayCart = localCart || cart

  if (loading && !displayCart) {
    return (
      <div className="min-h-screen bg-ivory">
        <LuxuryNavigation />
        <div className="pt-24 flex items-center justify-center h-96">
          <div className="text-charcoal/60 text-lg">Loading cart...</div>
        </div>
        <LuxuryFooter />
      </div>
    )
  }

  const isEmpty = !displayCart || displayCart.items.length === 0

  return (
    <div className="min-h-screen bg-ivory">
      <LuxuryNavigation />
      
      <main className="pt-24 pb-16">
        {/* Header Section */}
        <section className="bg-gradient-charcoal text-ivory py-8 sm:py-12 lg:py-16">
          <div className="container mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-2 sm:mb-4 tracking-wide">
                Shopping Cart
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-brass tracking-luxury">
                Review Your Selection
              </p>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 lg:py-12">
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 sm:py-16 px-4"
            >
              <svg className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-brass/30 mx-auto mb-4 sm:mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-3 sm:mb-4">
                Your cart is empty
              </h2>
              <p className="text-sm sm:text-base text-charcoal/60 mb-6 sm:mb-8">
                Discover our premium collection of products
              </p>
              <Button onClick={() => router.push('/products')} size="lg" className="min-h-[44px]">
                Browse Products
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between mb-4 sm:mb-6 gap-3">
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-charcoal">
                    Cart Items ({displayCart.items.length})
                  </h2>
                  {displayCart.items.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClearCart} className="min-h-[40px] text-xs sm:text-sm">
                      Clear All
                    </Button>
                  )}
                </div>

                {displayCart.items.map((item, index) => {
                  const product = getProductFromItem(item)

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="bg-white rounded-lg shadow-md border border-brass/20 p-3 sm:p-4 lg:p-6"
                    >
                      <div className="flex gap-3 sm:gap-4 lg:gap-6">
                        {/* Product Image */}
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-white border border-brass/10 flex-shrink-0">
                          {product && product.imageURLs && Object.keys(product.imageURLs || {}).length > 0 && Object.values(product.imageURLs || {})[0]?.url ? (
                            <Image
                              src={Object.values(product.imageURLs || {})[0]?.url || ''}
                              alt={item.productName}
                              fill
                              className="object-contain p-1.5 sm:p-2"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-ivory">
                              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-brass/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-brass tracking-luxury truncate">
                                {item.productCode}
                              </p>
                              <h3 className="text-sm sm:text-base lg:text-lg font-serif font-bold text-charcoal line-clamp-2">
                                {item.productName}
                              </h3>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item._id)}
                              className="text-charcoal/40 hover:text-red-600 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center flex-shrink-0 -mt-1 -mr-1"
                              aria-label="Remove item from cart"
                            >
                              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          <div className="space-y-0.5 sm:space-y-1 text-xs sm:text-sm text-charcoal/70 mb-3 sm:mb-4">
                            <p className="truncate">Material: <span className="font-medium text-charcoal">{item.selectedMaterial.name}</span></p>
                            {item.selectedSize && (
                              <p className="truncate">Size: <span className="font-medium text-charcoal">
                                {item.selectedSize.name && item.selectedSize.sizeMM 
                                  ? `${item.selectedSize.name} ${item.selectedSize.sizeMM}mm`
                                  : item.selectedSize.sizeMM 
                                  ? `${item.selectedSize.sizeMM}mm`
                                  : item.selectedSize.name || 'Standard'}
                              </span></p>
                            )}
                            {item.selectedFinish && (
                              <p className="truncate">Finish: <span className="font-medium text-charcoal">{item.selectedFinish.name}</span></p>
                            )}
                          </div>

                          {/* Price Breakdown Toggle */}
                          <div className="mb-3 sm:mb-4">
                            <button
                              onClick={() => toggleBreakdown(item._id)}
                              className="flex items-center justify-between w-full bg-gradient-ivory rounded-md px-2.5 sm:px-3 py-2.5 sm:py-3 text-xs sm:text-sm hover:bg-brass/10 transition-all group min-h-[44px]"
                            >
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                <span className="font-medium text-charcoal/90 text-xs sm:text-sm whitespace-nowrap">Unit Price:</span>
                                <span className="text-brass font-bold text-xs sm:text-sm truncate">{formatCurrency(item.unitPrice)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-charcoal/60 group-hover:text-brass transition-colors flex-shrink-0 ml-2">
                                <span className="hidden xs:inline">{expandedItems.has(item._id) ? 'Hide' : 'View'}</span>
                                <span className="whitespace-nowrap">
                                  {expandedItems.has(item._id) ? (
                                    <span className="xs:hidden">Hide</span>
                                  ) : (
                                    <span className="xs:hidden">View</span>
                                  )}
                                </span>
                                <svg
                                  className={`w-4 h-4 transition-transform ${expandedItems.has(item._id) ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>

                            {/* Collapsible Breakdown */}
                            <AnimatePresence>
                              {expandedItems.has(item._id) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-gradient-ivory/50 rounded-b-md px-3 py-3 text-xs space-y-2 border-t border-charcoal/10">
                                    <p className="font-semibold text-charcoal mb-2 text-xs uppercase tracking-wide">Price Components:</p>
                                    
                                    {/* Material Base Price */}
                                    <div className="flex items-center justify-between text-charcoal/70 flex-wrap gap-2">
                                      <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                                        Material Base ({item.selectedMaterial.name})
                                      </span>
                                      <span className="font-medium text-charcoal">
                                        {formatCurrency(item.priceBreakdown.materialBase || item.selectedMaterial.basePrice)}
                                      </span>
                                    </div>

                                    {/* Material Discount */}
                                    {item.priceBreakdown.materialDiscount && toNumber(item.priceBreakdown.materialDiscount) > 0 && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center justify-between text-green-700 font-medium flex-wrap gap-2 bg-green-50/50 rounded-md px-2 py-1.5"
                                      >
                                        <span className="flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                          <span>Material Discount</span>
                                          <span className="px-1.5 py-0.5 text-[10px] leading-none font-semibold bg-green-100 text-green-700 rounded border border-green-200">
                                            -{Math.round((toNumber(item.priceBreakdown.materialDiscount) / Math.max(1, toNumber(item.priceBreakdown.materialBase))) * 100)}%
                                          </span>
                                        </span>
                                        <span className="font-semibold text-green-700">
                                          -{formatCurrency(item.priceBreakdown.materialDiscount)}
                                        </span>
                                      </motion.div>
                                    )}

                                    {/* Material Net Price */}
                                    <div className="flex items-center justify-between text-charcoal/70 flex-wrap gap-2 border-t border-charcoal/10 pt-2">
                                      <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                                        Material Net
                                      </span>
                                      <span className="font-medium text-charcoal">
                                        {formatCurrency(item.priceBreakdown.materialNet || item.selectedMaterial.netBasePrice || item.priceBreakdown.materialBase)}
                                      </span>
                                    </div>

                                    {/* Size */}
                                    {item.selectedSize && toNumber(item.priceBreakdown.size) > 0 && (
                                    <div className="flex items-center justify-between text-charcoal/70 flex-wrap gap-2">
                                      <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                                        Size {item.selectedSize.name && item.selectedSize.sizeMM 
                                          ? `${item.selectedSize.name} ${item.selectedSize.sizeMM}mm`
                                          : item.selectedSize.sizeMM 
                                          ? `${item.selectedSize.sizeMM}mm`
                                          : item.selectedSize.name || 'Standard'}
                                      </span>
                                      <span className="font-medium text-charcoal">
                                        +{formatCurrency(item.priceBreakdown.size)}
                                      </span>
                                    </div>
                                    )}

                                    {/* Finish */}
                                    {toNumber(item.priceBreakdown.finishes) > 0 && (
                                    <div className="flex items-center justify-between text-charcoal/70 flex-wrap gap-2">
                                      <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                                        Finish {item.selectedFinish ? `(${item.selectedFinish.name})` : 'Cost'}
                                      </span>
                                      <span className="font-medium text-charcoal">
                                        +{formatCurrency(item.priceBreakdown.finishes)}
                                      </span>
                                    </div>
                                    )}

                                    {/* Packaging */}
                                    {toNumber(item.priceBreakdown.packaging) > 0 && (
                                    <div className="flex justify-between text-charcoal/70">
                                      <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                                        Premium Packaging
                                      </span>
                                      <span className="font-medium text-charcoal">
                                        +{formatCurrency(item.priceBreakdown.packaging)}
                                      </span>
                                    </div>
                                    )}

                                    <div className="flex items-center justify-between text-charcoal font-bold border-t border-charcoal/20 pt-2 mt-2 flex-wrap gap-2">
                                      <span>Total Unit Price</span>
                                      <span className="text-brass">{formatCurrency(item.unitPrice)}</span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 sm:gap-3">
                              <button
                                onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded border-2 border-brass/30 hover:border-brass hover:bg-brass/10 transition-all text-base sm:text-lg font-semibold"
                                title={item.quantity === 1 ? 'Remove from cart' : 'Decrease quantity'}
                                aria-label="Decrease quantity"
                              >
                                -
                              </button>
                              <span className="text-base sm:text-lg font-semibold text-charcoal w-6 sm:w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded border-2 border-brass/30 hover:border-brass hover:bg-brass/10 transition-all text-base sm:text-lg font-semibold"
                                title="Increase quantity"
                                aria-label="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right flex-shrink-0">
                              <p className="text-[10px] sm:text-xs text-charcoal/60 truncate">
                                {formatCurrency(item.unitPrice)} × {item.quantity}
                              </p>
                              <p className="text-base sm:text-lg lg:text-xl font-bold text-brass">
                                {formatCurrency(item.totalPrice)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white rounded-lg shadow-xl border border-brass/20 p-4 sm:p-5 lg:p-6 lg:sticky lg:top-24"
                >
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-charcoal mb-4 sm:mb-6">
                    Order Summary
                  </h2>

                  <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                    {displayCart.items.map((item) => (
                      <div key={item._id} className="flex justify-between gap-3 text-xs sm:text-sm">
                        <span className="text-charcoal/70 line-clamp-2 flex-1">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="font-medium text-charcoal flex-shrink-0">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Discount Code Input - Must be before pricing summary */}
                  {sessionID && (
                    <div className="mb-4">
                      <OfferCodeInput
                        cart={localCart || cart}
                        sessionID={sessionID}
                        userId={user?.id}
                        onDiscountApplied={refreshCart}
                        onCartUpdate={(updatedCart) => {
                          setLocalCart(updatedCart)
                          // Also refresh from server to ensure consistency
                          refreshCart()
                        }}
                        showError={true}
                      />
                    </div>
                  )}

                  <div className="border-t border-brass/20 pt-3 sm:pt-4 space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm gap-3">
                      <span className="text-charcoal">Item Total</span>
                      <span className="text-charcoal font-medium">{formatCurrency(displayCart.subtotal)}</span>
                    </div>

                    {/* Discount Display - Shows in pricing summary when applied */}
                    {displayCart.discountCode && displayCart.discountAmount && toNumber(displayCart.discountAmount) > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between text-xs sm:text-sm text-green-600 font-medium gap-3"
                      >
                        <span className="truncate">Discount ({displayCart.discountCode})</span>
                        <span className="flex-shrink-0">-{formatCurrency(displayCart.discountAmount)}</span>
                      </motion.div>
                    )}

                    {/* Total After Discount */}
                    {(() => {
                      const subtotalNum = toNumber(displayCart.subtotal)
                      const discountNum = toNumber(displayCart.discountAmount || 0)
                      const totalAfterDiscount = Math.max(0, subtotalNum - discountNum)
                      return (
                        <div className="flex justify-between text-xs sm:text-sm font-medium text-charcoal border-t border-brass/10 pt-2 mt-2 gap-3">
                          <span>Total After Discount</span>
                          <span>{formatCurrency(totalAfterDiscount)}</span>
                        </div>
                      )
                    })()}

                    {/* Estimated Shipping Display */}
                    {settings && (
                      <div className="flex justify-between text-xs sm:text-sm gap-3">
                        <div className="flex flex-col">
                          <span className="text-charcoal">Shipping</span>
                          <span className="text-[10px] text-charcoal/60 mt-0.5">UK Mainland only (excl. Northern Ireland)</span>
                        </div>
                        <span className="text-charcoal font-medium flex-shrink-0">
                          {estimatedShipping === 0 ? (
                            <span className="text-green-600 font-semibold">FREE</span>
                          ) : (
                            formatCurrency(estimatedShipping)
                          )}
                        </span>
                      </div>
                    )}

                    {/* Free Delivery Hint */}
                    {settings?.freeDeliveryThreshold?.enabled && estimatedShipping > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] sm:text-xs text-brass/80 bg-brass/10 px-2 py-1.5 rounded"
                      >
                        Add {formatCurrency(
                          settings.freeDeliveryThreshold.amount -
                          Math.max(0, toNumber(displayCart.subtotal) - toNumber(displayCart.discountAmount || 0))
                        )} more for FREE delivery!
                      </motion.div>
                    )}

                    {/* VAT Breakdown */}
                    {settings && settings.vatEnabled && (() => {
                      const subtotalNum = toNumber(displayCart.subtotal)
                      const discountNum = toNumber(displayCart.discountAmount || 0)
                      const totalAfterDiscount = Math.max(0, subtotalNum - discountNum)
                      const taxableAmount = totalAfterDiscount + estimatedShipping
                      const vatRate = settings.vatRate || 20
                      const itemTotalBeforeVAT = taxableAmount / (1 + vatRate / 100)
                      const vatAmount = taxableAmount * (vatRate / 100) / (1 + vatRate / 100)
                      
                      return (
                        <div className="bg-brass/5 border border-brass/20 rounded-lg p-3 mt-3 space-y-2">
                          <div className="text-[10px] sm:text-xs font-semibold text-brass mb-2 pb-1 border-b border-brass/20">
                            VAT Breakdown
                          </div>
                          <div className="flex justify-between text-[10px] sm:text-xs text-charcoal/70 gap-2">
                            <span>Item Total Before VAT</span>
                            <span className="font-medium text-charcoal flex-shrink-0">{formatCurrency(itemTotalBeforeVAT)}</span>
                          </div>
                          <div className="flex justify-between text-[10px] sm:text-xs text-charcoal/70 gap-2">
                            <span>VAT Added ({vatRate}%)</span>
                            <span className="font-medium text-charcoal flex-shrink-0">{formatCurrency(vatAmount)}</span>
                          </div>
                        </div>
                      )
                    })()}

                    <div className="flex justify-between text-base sm:text-lg font-bold border-t border-brass/20 pt-2 mt-2 gap-3">
                      <span className="text-charcoal">Final Amount (inc. VAT)</span>
                      <span className="text-brass flex-shrink-0">
                        {formatCurrency(
                          toNumber(displayCart.subtotal) - toNumber(displayCart.discountAmount || 0) + estimatedShipping
                        )}
                      </span>
                    </div>
                    {settings && settings.vatEnabled && (
                      <p className="text-[10px] sm:text-xs text-charcoal/60 mt-1">All prices include {settings.vatRate}% VAT</p>
                    )}
                    <p className="text-[10px] sm:text-xs text-charcoal/60 mt-1">
                      Delivery terms apply. See{' '}
                      <Link href="/terms" className="text-brass hover:text-olive underline" target="_blank" rel="noopener noreferrer">
                        Terms & Conditions
                      </Link>
                    </p>
                  </div>

                  <Button
                    size="lg"
                    className="w-full mb-3 mt-4 sm:mt-5 min-h-[48px] text-sm sm:text-base"
                    onClick={() => router.push('/checkout')}
                  >
                    Proceed to Checkout
                  </Button>

                  {!isAuthenticated && (
                    <>
                      <p className="text-xs text-charcoal/60 text-center mb-3">
                        Continue as guest or sign in to your account
                      </p>
                      <Button
                        variant="secondary"
                        size="lg"
                        className="w-full mb-3 min-h-[48px] text-sm sm:text-base"
                        onClick={() => router.push('/login?redirect=/checkout')}
                      >
                        Sign In
                      </Button>
                    </>
                  )}

                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full border-2 font-semibold min-h-[48px] text-sm sm:text-base"
                    onClick={() => router.push('/products')}
                  >
                    Continue Shopping
                  </Button>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}

