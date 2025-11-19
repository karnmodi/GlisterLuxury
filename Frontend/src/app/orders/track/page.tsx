'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ordersApi } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/lib/utils'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import type { Order } from '@/types'

export default function TrackGuestOrderPage() {
  const router = useRouter()
  const toast = useToast()
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  // Load saved email from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = localStorage.getItem('guest_order_email')
      if (savedEmail) {
        setEmail(savedEmail)
      }
    }
  }, [])

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!orderNumber.trim() || !email.trim()) {
      toast.error('Please provide both order number and email address')
      return
    }

    try {
      setLoading(true)
      setSearched(true)
      const response = await ordersApi.trackGuest(orderNumber.trim(), email.trim())

      if (response.success && response.order) {
        setOrder(response.order)
        toast.success('Order found!')
      } else {
        toast.error('Order not found')
        setOrder(null)
      }
    } catch (error: any) {
      console.error('Failed to track order:', error)
      const errorMessage = error?.message || 'Order not found. Please check your order number and email address.'
      toast.error(errorMessage)
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-400/30'
      case 'confirmed':
        return 'bg-blue-900/20 text-blue-400 border-blue-400/30'
      case 'processing':
        return 'bg-purple-900/20 text-purple-400 border-purple-400/30'
      case 'shipped':
        return 'bg-indigo-900/20 text-indigo-400 border-indigo-400/30'
      case 'delivered':
        return 'bg-green-900/20 text-green-400 border-green-400/30'
      case 'cancelled':
        return 'bg-red-900/20 text-red-400 border-red-400/30'
      default:
        return 'bg-brass/20 text-brass border-brass/30'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-900/20 text-green-400 border-green-400/30'
      case 'awaiting_payment':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-400/30'
      case 'payment_failed':
        return 'bg-red-900/20 text-red-400 border-red-400/30'
      default:
        return 'bg-brass/20 text-brass border-brass/30'
    }
  }

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="min-h-screen bg-charcoal">
      <LuxuryNavigation />

      <main className="pt-32 pb-20 px-6 lg:px-12 xl:px-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl font-serif font-bold text-ivory mb-2">
              Track Your Order
            </h1>
            <p className="text-brass text-sm tracking-luxury">
              Enter your order details to check your order status
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-8 mb-8"
          >
            <form onSubmit={handleTrackOrder} className="space-y-6">
              <div>
                <label className="block text-ivory text-sm font-medium mb-2">
                  Order Number <span className="text-brass">*</span>
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass uppercase"
                  placeholder="GL202411190001"
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-ivory/50">
                  Format: GL followed by date and sequence number (e.g., GL202411190001)
                </p>
              </div>

              <div>
                <label className="block text-ivory text-sm font-medium mb-2">
                  Email Address <span className="text-brass">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                  placeholder="john@example.com"
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-ivory/50">
                  The email address you used when placing the order
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-brass text-charcoal font-bold rounded-md hover:bg-olive transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Track Order'}
              </button>
            </form>
          </motion.div>

          {/* Order Details */}
          {searched && order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              {/* Order Status */}
              <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6">
                <h2 className="text-2xl font-serif font-bold text-ivory mb-4">Order Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-ivory/70 text-sm mb-1">Order Number</p>
                    <p className="text-brass text-lg font-bold">{order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-ivory/70 text-sm mb-1">Order Date</p>
                    <p className="text-ivory">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-ivory/70 text-sm mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-md border text-sm font-medium ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-ivory/70 text-sm mb-1">Payment Status</p>
                    <span className={`inline-block px-3 py-1 rounded-md border text-sm font-medium ${getPaymentStatusColor(order.paymentInfo.status)}`}>
                      {formatStatus(order.paymentInfo.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6">
                <h2 className="text-2xl font-serif font-bold text-ivory mb-4">Order Items</h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex gap-4 pb-4 border-b border-brass/20 last:border-0">
                      <div className="flex-1">
                        <h3 className="text-ivory font-medium mb-1">{item.productName}</h3>
                        <p className="text-ivory/50 text-sm mb-2">{item.productCode}</p>
                        <div className="text-ivory/70 text-xs space-y-0.5">
                          <p>Material: {item.selectedMaterial.name}</p>
                          {item.selectedSizeName && <p>Size: {item.selectedSizeName}</p>}
                          {item.selectedFinish?.name && <p>Finish: {item.selectedFinish.name}</p>}
                          <p>Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-ivory font-medium">{formatCurrency(parseFloat(item.totalPrice.toString()))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6">
                <h2 className="text-2xl font-serif font-bold text-ivory mb-4">Delivery Address</h2>
                <div className="text-ivory/70 text-sm space-y-1">
                  <p className="text-ivory font-medium mb-2">{order.customerInfo.name}</p>
                  <p>{order.deliveryAddress.addressLine1}</p>
                  {order.deliveryAddress.addressLine2 && <p>{order.deliveryAddress.addressLine2}</p>}
                  <p>{order.deliveryAddress.city}, {order.deliveryAddress.postcode}</p>
                  <p>{order.deliveryAddress.country}</p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6">
                <h2 className="text-2xl font-serif font-bold text-ivory mb-4">Order Summary</h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-ivory/70">
                    <span>Subtotal</span>
                    <span>{formatCurrency(parseFloat(order.pricing.subtotal.toString()))}</span>
                  </div>
                  {order.pricing.discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount {order.discountCode && `(${order.discountCode})`}</span>
                      <span>-{formatCurrency(parseFloat(order.pricing.discount.toString()))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-ivory/70">
                    <span>Shipping</span>
                    <span>{formatCurrency(parseFloat(order.pricing.shipping.toString()))}</span>
                  </div>
                  <div className="flex justify-between text-ivory/70 text-xs border-t border-brass/20 pt-2">
                    <span>VAT (included at {order.pricing.vatRate}%)</span>
                    <span>{formatCurrency(parseFloat(order.pricing.tax.toString()))}</span>
                  </div>
                  <div className="flex justify-between text-ivory text-lg font-bold border-t border-brass/20 pt-2">
                    <span>Total</span>
                    <span className="text-brass">{formatCurrency(parseFloat(order.pricing.total.toString()))}</span>
                  </div>
                </div>
              </div>

              {/* Help Section */}
              <div className="bg-brass/10 border border-brass/30 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <svg className="w-6 h-6 text-brass flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-ivory font-medium mb-2">Need Help?</h3>
                    <p className="text-ivory/70 text-sm mb-3">
                      If you have any questions about your order, please contact us at:
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-brass">enquiries@glisterlondon.com</p>
                      <p className="text-ivory/60">Quote your order number: {order.orderNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* No Results */}
          {searched && !order && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-serif font-bold text-ivory mb-2">Order Not Found</h3>
              <p className="text-ivory/70 text-sm mb-6">
                We couldn&apos;t find an order matching the details you provided.
                Please check your order number and email address and try again.
              </p>
              <button
                onClick={() => {
                  setSearched(false)
                  setOrderNumber('')
                }}
                className="px-6 py-3 bg-brass text-charcoal font-medium rounded-md hover:bg-olive transition-all duration-300"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}
