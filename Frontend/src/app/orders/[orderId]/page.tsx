'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { ordersApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import StatusBadge from '@/components/ui/StatusBadge'
import OrderSummary from '@/components/OrderSummary'
import type { Order } from '@/types'

export default function OrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { token, isAuthenticated, loading: authLoading } = useAuth()
  const toast = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [refundReason, setRefundReason] = useState('')
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?returnUrl=/orders')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (token && params.orderId) {
      fetchOrder()
    }
  }, [token, params.orderId])

  const fetchOrder = async () => {
    if (!token || !params.orderId) return

    try {
      setLoading(true)
      const response = await ordersApi.getById(params.orderId as string, token)
      setOrder(response.order)
    } catch (error) {
      console.error('Failed to fetch order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestRefund = async () => {
    if (!token || !order || !refundReason.trim()) {
      toast.warning('Please provide a reason for the refund')
      return
    }

    try {
      setProcessing(true)
      await ordersApi.requestRefund(order._id, refundReason, token)
      toast.success('Refund requested successfully')
      setShowRefundModal(false)
      fetchOrder()
    } catch (error) {
      console.error('Failed to request refund:', error)
      toast.error('Failed to request refund')
    } finally {
      setProcessing(false)
    }
  }

  if (authLoading || loading || !order) {
    return (
      <div className="min-h-screen bg-charcoal">
        <LuxuryNavigation />
        <div className="pt-32 flex items-center justify-center h-96">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brass"></div>
        </div>
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
            <button
              onClick={() => router.push('/orders')}
              className="text-brass hover:text-olive transition-colors mb-4 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Orders
            </button>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl font-serif font-bold text-ivory mb-2">
                  Order #{order.orderNumber}
                </h1>
                <p className="text-ivory/60 text-sm">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <StatusBadge status={order.status} size="lg" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6">
                <h2 className="text-2xl font-serif font-bold text-ivory mb-6">Order Items</h2>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item._id} className="flex gap-4 border-b border-brass/10 pb-4 last:border-0 last:pb-0">
                      <div className="flex-1">
                        <h3 className="text-ivory font-medium mb-1">{item.productName}</h3>
                        <p className="text-brass/70 text-sm mb-2">{item.productCode}</p>
                        <div className="text-ivory/60 text-sm space-y-1">
                          <p>Material: {item.selectedMaterial.name}</p>
                          {item.selectedSize != null && <p>Size: {item.selectedSizeName ? `${item.selectedSizeName} ${item.selectedSize}mm` : `${item.selectedSize}mm`}</p>}
                          {item.selectedFinish && <p>Finish: {item.selectedFinish.name}</p>}
                          <p>Quantity: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-brass font-bold text-lg">{formatCurrency(item.totalPrice)}</p>
                        <p className="text-ivory/50 text-sm">{formatCurrency(item.unitPrice)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address */}
              <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6">
                <h2 className="text-2xl font-serif font-bold text-ivory mb-4">Delivery Address</h2>
                <div className="text-ivory/80 space-y-1">
                  {order.deliveryAddress.label && (
                    <p className="text-brass font-medium">{order.deliveryAddress.label}</p>
                  )}
                  <p>{order.deliveryAddress.addressLine1}</p>
                  {order.deliveryAddress.addressLine2 && <p>{order.deliveryAddress.addressLine2}</p>}
                  <p>{order.deliveryAddress.city}</p>
                  {order.deliveryAddress.county && <p>{order.deliveryAddress.county}</p>}
                  <p>{order.deliveryAddress.postcode}</p>
                  <p>{order.deliveryAddress.country}</p>
                </div>
              </div>

              {/* Messages from Glister London */}
              {order.adminMessages && order.adminMessages.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-gradient-to-br from-brass/10 to-brass/5 backdrop-blur-md border border-brass/30 rounded-lg p-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-brass/20 rounded-full p-2">
                      <svg className="w-6 h-6 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-ivory">Messages from Glister London</h2>
                  </div>
                  <div className="space-y-4">
                    {order.adminMessages.slice().reverse().map((msg: any, index: number) => (
                      <div 
                        key={index} 
                        className="bg-charcoal/50 backdrop-blur-sm border border-brass/20 rounded-lg p-5 hover:border-brass/40 transition-all duration-300"
                      >
                        <div className="flex items-start gap-3">
                          <div className="bg-brass/10 rounded-full p-2 flex-shrink-0">
                            <svg className="w-4 h-4 text-brass" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-ivory/90 whitespace-pre-wrap leading-relaxed mb-3">
                              {msg.message}
                            </p>
                            <div className="flex items-center gap-2 text-brass/70 text-xs">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>
                                {new Date(msg.createdAt).toLocaleString('en-GB', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-5 border-t border-brass/20">
                    <p className="text-ivory/60 text-sm flex items-center gap-2">
                      <svg className="w-4 h-4 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      These messages were also sent to your email address
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Order Notes */}
              {order.orderNotes && (
                <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6">
                  <h2 className="text-2xl font-serif font-bold text-ivory mb-4">Order Notes</h2>
                  <p className="text-ivory/80">{order.orderNotes}</p>
                </div>
              )}

              {/* Refund Option */}
              {order.status === 'delivered' && (
                <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6">
                  <h2 className="text-2xl font-serif font-bold text-ivory mb-4">Need a Refund?</h2>
                  <p className="text-ivory/70 text-sm mb-4">
                    If you&apos;re not satisfied with your order, you can request a refund.
                  </p>
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="px-6 py-3 bg-brass text-charcoal font-medium rounded-md hover:bg-olive transition-all duration-300"
                  >
                    Request Refund
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <OrderSummary data={order} type="order" />
              
              {/* Payment Note */}
              <div className="mt-6 bg-brass/10 border border-brass/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-brass flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-ivory text-sm font-medium mb-1">Payment Information</p>
                    <p className="text-ivory/70 text-xs">
                      Payment instructions will be sent via email after order confirmation by Glister London.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-charcoal border border-brass/20 rounded-lg p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-serif font-bold text-ivory mb-4">Request Refund</h3>
            <p className="text-ivory/70 text-sm mb-4">
              Please provide a reason for your refund request:
            </p>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass mb-6"
              rows={4}
              placeholder="Enter reason for refund..."
              disabled={processing}
            />
            <div className="flex gap-4">
              <button
                onClick={handleRequestRefund}
                disabled={processing || !refundReason.trim()}
                className="flex-1 px-6 py-3 bg-brass text-charcoal font-medium rounded-md hover:bg-olive transition-all duration-300 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Submit Request'}
              </button>
              <button
                onClick={() => setShowRefundModal(false)}
                disabled={processing}
                className="px-6 py-3 border border-brass/50 text-ivory rounded-md hover:bg-brass/10 transition-all duration-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <LuxuryFooter />
    </div>
  )
}

