'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import { ordersApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import OrderSummary from '@/components/OrderSummary'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, isAuthenticated, token, loading: authLoading } = useAuth()
  const { cart, sessionID, loading: cartLoading } = useCart()
  const toast = useToast()
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [orderNotes, setOrderNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?returnUrl=/checkout')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user && user.addresses.length > 0) {
      const defaultAddress = user.addresses.find(addr => addr.isDefault)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id)
      } else {
        setSelectedAddressId(user.addresses[0]._id)
      }
    }
  }, [user])

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    if (!selectedAddressId) {
      toast.warning('Please select a delivery address')
      return
    }

    if (!token) {
      toast.error('Please login to continue')
      router.push('/login?returnUrl=/checkout')
      return
    }

    try {
      setProcessing(true)

      const response = await ordersApi.create({
        sessionID,
        deliveryAddressId: selectedAddressId,
        orderNotes: orderNotes.trim() || undefined
      }, token)

      setOrderNumber(response.order.orderNumber)
      setShowSuccess(true)
      toast.success('Order placed successfully!')
    } catch (error) {
      console.error('Failed to place order:', error)
      toast.error('Failed to place order. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-charcoal">
        <LuxuryNavigation />
        <div className="pt-32 flex items-center justify-center h-96">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brass"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-charcoal">
        <LuxuryNavigation />
        <main className="pt-32 pb-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-serif font-bold text-ivory mb-4">Your Cart is Empty</h1>
            <button
              onClick={() => router.push('/products')}
              className="px-6 py-3 bg-brass text-charcoal font-medium rounded-md hover:bg-olive transition-all duration-300"
            >
              Browse Products
            </button>
          </div>
        </main>
        <LuxuryFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-charcoal">
      <LuxuryNavigation />
      
      <main className="pt-32 pb-20 px-6 lg:px-12 xl:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-serif font-bold text-ivory mb-2">
              Checkout
            </h1>
            <p className="text-brass text-sm tracking-luxury">
              Review and complete your order
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Address */}
              <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6">
                <h2 className="text-2xl font-serif font-bold text-ivory mb-4">Delivery Address</h2>
                
                {user.addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-ivory/70 mb-4">No delivery addresses found</p>
                    <button
                      onClick={() => router.push('/profile')}
                      className="px-6 py-3 bg-brass text-charcoal font-medium rounded-md hover:bg-olive transition-all duration-300"
                    >
                      Add Address
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {user.addresses.map((address) => (
                      <div
                        key={address._id}
                        onClick={() => setSelectedAddressId(address._id)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                          selectedAddressId === address._id
                            ? 'border-brass bg-brass/5'
                            : 'border-brass/20 hover:border-brass/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            checked={selectedAddressId === address._id}
                            onChange={() => setSelectedAddressId(address._id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-brass font-medium">{address.label}</span>
                              {address.isDefault && (
                                <span className="px-2 py-0.5 bg-brass/20 text-brass text-xs rounded">Default</span>
                              )}
                            </div>
                            <div className="text-ivory/70 text-sm space-y-0.5">
                              <p>{address.addressLine1}</p>
                              {address.addressLine2 && <p>{address.addressLine2}</p>}
                              <p>{address.city}, {address.postcode}</p>
                              <p>{address.country}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6">
                <h2 className="text-2xl font-serif font-bold text-ivory mb-4">Order Notes (Optional)</h2>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                  rows={4}
                  placeholder="Add any special instructions or notes for your order..."
                />
              </div>

              {/* Payment Information */}
              <div className="bg-brass/10 border border-brass/30 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 text-brass flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-ivory font-medium mb-2">Payment Information</h3>
                    <p className="text-ivory/70 text-sm">
                      Payment will be collected after order confirmation by Glister London. 
                      You will receive an email with payment instructions and details shortly after placing your order.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <OrderSummary data={cart} type="cart" />
              
              <button
                onClick={handlePlaceOrder}
                disabled={processing || !selectedAddressId}
                className="w-full mt-6 px-6 py-4 bg-brass text-charcoal font-bold text-lg rounded-md hover:bg-olive transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Place Order'}
              </button>

              <p className="text-ivory/50 text-xs text-center mt-4">
                By placing this order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-charcoal border border-brass/20 rounded-lg p-8 max-w-md w-full text-center"
          >
            <div className="w-16 h-16 bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-ivory mb-3">Order Placed Successfully!</h3>
            <p className="text-ivory/70 text-sm mb-2">
              Your order number is:
            </p>
            <p className="text-brass text-xl font-bold mb-6">{orderNumber}</p>
            <p className="text-ivory/60 text-sm mb-6">
              We&apos;ll send you an email with payment instructions shortly.
              You can track your order status in your orders page.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => router.push(`/orders`)}
                className="flex-1 px-6 py-3 bg-brass text-charcoal font-medium rounded-md hover:bg-olive transition-all duration-300"
              >
                View Orders
              </button>
              <button
                onClick={() => router.push('/products')}
                className="flex-1 px-6 py-3 border border-brass/50 text-ivory rounded-md hover:bg-brass/10 transition-all duration-300"
              >
                Continue Shopping
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <LuxuryFooter />
    </div>
  )
}

