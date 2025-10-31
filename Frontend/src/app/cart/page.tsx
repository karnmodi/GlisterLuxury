'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [localCart, setLocalCart] = useState<typeof cart>(cart)

  // Sync local cart with context cart
  useEffect(() => {
    setLocalCart(cart)
  }, [cart])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

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
        <section className="bg-gradient-charcoal text-ivory py-16">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-5xl font-serif font-bold mb-4 tracking-wide">
                Shopping Cart
              </h1>
              <p className="text-xl text-brass tracking-luxury">
                Review Your Selection
              </p>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-6 py-12">
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <svg className="w-24 h-24 text-brass/30 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h2 className="text-3xl font-serif font-bold text-charcoal mb-4">
                Your cart is empty
              </h2>
              <p className="text-charcoal/60 mb-8">
                Discover our premium collection of products
              </p>
              <Button onClick={() => router.push('/products')} size="lg">
                Browse Products
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif font-bold text-charcoal">
                    Cart Items ({displayCart.items.length})
                  </h2>
                  {displayCart.items.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleClearCart}>
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
                      className="bg-white rounded-lg shadow-md border border-brass/20 p-6"
                    >
                      <div className="flex gap-6">
                        {/* Product Image */}
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white border border-brass/10 flex-shrink-0">
                          {product && product.imageURLs && Object.keys(product.imageURLs).length > 0 ? (
                            <Image
                              src={Object.values(product.imageURLs)[0].url}
                              alt={item.productName}
                              fill
                              className="object-contain p-2"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-ivory">
                              <svg className="w-10 h-10 text-brass/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-xs text-brass tracking-luxury">
                                {item.productCode}
                              </p>
                              <h3 className="text-lg font-serif font-bold text-charcoal">
                                {item.productName}
                              </h3>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item._id)}
                              className="text-charcoal/40 hover:text-red-600 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          <div className="space-y-1 text-sm text-charcoal/70 mb-4">
                            <p>Material: <span className="font-medium text-charcoal">{item.selectedMaterial.name}</span></p>
                            {item.selectedSize && (
                              <p>Size: <span className="font-medium text-charcoal">{item.selectedSize}mm</span></p>
                            )}
                            {item.selectedFinish && (
                              <p>Finish: <span className="font-medium text-charcoal">{item.selectedFinish.name}</span></p>
                            )}
                          </div>

                          {/* Price Breakdown Toggle */}
                          <div className="mb-4">
                            <button
                              onClick={() => toggleBreakdown(item._id)}
                              className="flex items-center justify-between w-full bg-gradient-ivory rounded-md px-3 py-2 text-sm hover:bg-brass/10 transition-all group"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-charcoal/90">Unit Price:</span>
                                <span className="text-brass font-bold">{formatCurrency(item.unitPrice)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-charcoal/60 group-hover:text-brass transition-colors">
                                <span>{expandedItems.has(item._id) ? 'Hide' : 'View'} Breakdown</span>
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
                                    
                                    <div className="flex justify-between text-charcoal/70">
                                      <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                                        Material ({item.selectedMaterial.name})
                                      </span>
                                      <span className="font-medium text-charcoal">{formatCurrency(item.priceBreakdown.material)}</span>
                                    </div>

                                    <div className="flex justify-between text-charcoal/70">
                                      <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                                        Size {item.selectedSize ? `(${item.selectedSize}mm)` : 'Adjustment'}
                                      </span>
                                      <span className="font-medium text-charcoal">
                                        {toNumber(item.priceBreakdown.size) > 0 ? `+${formatCurrency(item.priceBreakdown.size)}` : formatCurrency(0)}
                                      </span>
                                    </div>

                                    <div className="flex justify-between text-charcoal/70">
                                      <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                                        Finish {item.selectedFinish ? `(${item.selectedFinish.name})` : 'Cost'}
                                      </span>
                                      <span className="font-medium text-charcoal">
                                        {toNumber(item.priceBreakdown.finishes) > 0 ? `+${formatCurrency(item.priceBreakdown.finishes)}` : formatCurrency(0)}
                                      </span>
                                    </div>

                                    <div className="flex justify-between text-charcoal/70">
                                      <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                                        Premium Packaging
                                      </span>
                                      <span className="font-medium text-charcoal">
                                        {toNumber(item.priceBreakdown.packaging) > 0 ? `+${formatCurrency(item.priceBreakdown.packaging)}` : formatCurrency(0)}
                                      </span>
                                    </div>

                                    <div className="flex justify-between text-charcoal font-bold border-t border-charcoal/20 pt-2 mt-2">
                                      <span>Total Unit Price</span>
                                      <span className="text-brass">{formatCurrency(item.unitPrice)}</span>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="flex items-center justify-between">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                className="w-8 h-8 rounded border-2 border-brass/30 hover:border-brass hover:bg-brass/10 transition-all"
                                title={item.quantity === 1 ? 'Remove from cart' : 'Decrease quantity'}
                              >
                                -
                              </button>
                              <span className="text-lg font-semibold text-charcoal w-8 text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                className="w-8 h-8 rounded border-2 border-brass/30 hover:border-brass hover:bg-brass/10 transition-all"
                                title="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-xs text-charcoal/60">
                                {formatCurrency(item.unitPrice)} × {item.quantity}
                              </p>
                              <p className="text-xl font-bold text-brass">
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
                  className="bg-white rounded-lg shadow-xl border border-brass/20 p-6 sticky top-24"
                >
                  <h2 className="text-2xl font-serif font-bold text-charcoal mb-6">
                    Order Summary
                  </h2>

                  <div className="space-y-4 mb-6">
                    {displayCart.items.map((item) => (
                      <div key={item._id} className="flex justify-between text-sm">
                        <span className="text-charcoal/70">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="font-medium text-charcoal">
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

                  <div className="border-t border-brass/20 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-charcoal">Subtotal</span>
                      <span className="text-charcoal font-medium">{formatCurrency(displayCart.subtotal)}</span>
                    </div>
                    
                    {/* Discount Display - Shows in pricing summary when applied */}
                    {displayCart.discountCode && displayCart.discountAmount && toNumber(displayCart.discountAmount) > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-between text-sm text-green-600 font-medium"
                      >
                        <span>Discount ({displayCart.discountCode})</span>
                        <span>-{formatCurrency(displayCart.discountAmount)}</span>
                      </motion.div>
                    )}
                    
                    <div className="flex justify-between text-lg font-bold border-t border-brass/20 pt-2 mt-2">
                      <span className="text-charcoal">Total</span>
                      <span className="text-brass">
                        {formatCurrency(displayCart.total || (toNumber(displayCart.subtotal) - toNumber(displayCart.discountAmount || 0)))}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal/60 mt-2">
                      Shipping and taxes calculated at checkout
                    </p>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full mb-3"
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push('/login?returnUrl=/checkout')
                      } else {
                        router.push('/checkout')
                      }
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                  
                  {!isAuthenticated && (
                    <p className="text-xs text-charcoal/60 text-center mb-3">
                      You&apos;ll need to sign in to complete your purchase
                    </p>
                  )}
                  
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full border-2 font-semibold"
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

