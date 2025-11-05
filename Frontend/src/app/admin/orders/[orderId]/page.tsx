'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { ordersApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Order } from '@/types'

export default function AdminOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.orderId as string
  const { token, user } = useAuth()
  const toast = useToast()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [sending, setSending] = useState(false)
  
  // Status update state
  const [newOrderStatus, setNewOrderStatus] = useState('')
  const [newPaymentStatus, setNewPaymentStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  
  // Message state
  const [adminMessage, setAdminMessage] = useState('')
  const [messageSent, setMessageSent] = useState(false)
  
  // Toggle states for mobile
  const [showDeliveryAddress, setShowDeliveryAddress] = useState(false)
  const [showOrderStatusHistory, setShowOrderStatusHistory] = useState(false)
  const [showPaymentStatusHistory, setShowPaymentStatusHistory] = useState(false)

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchOrder()
    } else if (user && user.role !== 'admin') {
      router.push('/')
    }
  }, [token, user, orderId])

  const fetchOrder = async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await ordersApi.getOrderByIdAdmin(orderId, token)
      setOrder(response.order)
      setNewOrderStatus(response.order.status)
      setNewPaymentStatus(response.order.paymentInfo?.status || 'pending')
    } catch (error) {
      console.error('Failed to fetch order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async () => {
    if (!token || !order || newOrderStatus === order.status) return

    try {
      setUpdating(true)
      await ordersApi.updateStatus(orderId, newOrderStatus, statusNote || undefined, token)
      await fetchOrder()
      setStatusNote('')
      toast.success('Order status updated successfully')
    } catch (error) {
      console.error('Failed to update order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdatePaymentStatus = async () => {
    if (!token || !order || newPaymentStatus === order.paymentInfo?.status) return

    try {
      setUpdating(true)
      await ordersApi.updatePaymentStatus(orderId, newPaymentStatus, token)
      await fetchOrder()
      toast.success('Payment status updated successfully')
    } catch (error) {
      console.error('Failed to update payment status:', error)
      toast.error('Failed to update payment status')
    } finally {
      setUpdating(false)
    }
  }

  const handleSendMessage = async () => {
    if (!token || !adminMessage.trim()) return

    try {
      setSending(true)
      await ordersApi.addAdminMessage(orderId, adminMessage.trim(), token)
      await fetchOrder()
      setAdminMessage('')
      setMessageSent(true)
      setTimeout(() => setMessageSent(false), 3000)
      toast.success('Message sent to customer successfully')
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brass"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brass"></div>
          <p className="text-charcoal mt-4">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-charcoal text-lg">Order not found</p>
        <button
          onClick={() => router.push('/admin/orders')}
          className="mt-4 text-brass hover:text-brass/80"
        >
          ← Back to Orders
        </button>
      </div>
    )
  }

  const orderStatuses = [
    { value: 'pending', label: 'Pending', icon: '⏳', color: 'bg-yellow-500' },
    { value: 'confirmed', label: 'Confirmed', icon: '✓', color: 'bg-blue-500' },
    { value: 'processing', label: 'Processing', icon: '⚙️', color: 'bg-purple-500' },
    { value: 'shipped', label: 'Shipped', icon: '📦', color: 'bg-indigo-500' },
    { value: 'delivered', label: 'Delivered', icon: '✅', color: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelled', icon: '✕', color: 'bg-red-500' },
  ]

  const paymentStatuses = [
    { value: 'pending', label: 'Pending', icon: '⏳', color: 'bg-gray-500' },
    { value: 'awaiting_payment', label: 'Awaiting Payment', icon: '💳', color: 'bg-yellow-500' },
    { value: 'paid', label: 'Paid', icon: '✓', color: 'bg-green-500' },
    { value: 'partially_paid', label: 'Partially Paid', icon: '½', color: 'bg-blue-500' },
    { value: 'payment_failed', label: 'Payment Failed', icon: '✕', color: 'bg-red-500' },
    { value: 'payment_pending_confirmation', label: 'Pending Confirmation', icon: '⏱️', color: 'bg-orange-500' },
    { value: 'refunded', label: 'Refunded', icon: '↩️', color: 'bg-purple-500' },
  ]

  const getStatusConfig = (status: string, type: 'order' | 'payment') => {
    const statuses = type === 'order' ? orderStatuses : paymentStatuses
    return statuses.find(s => s.value === status) || statuses[0]
  }

  const orderStatusConfig = getStatusConfig(order.status, 'order')
  const paymentStatusConfig = getStatusConfig(order.paymentInfo?.status || 'pending', 'payment')

  return (
    <div className="space-y-4">
      {/* Header with Order Info and Status Badges */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-white via-ivory/50 to-white rounded-xl shadow-lg border-2 border-brass/30 p-5"
      >
        <button
          onClick={() => router.push('/admin/orders')}
          className="text-brass hover:text-brass/80 text-sm mb-3 inline-flex items-center gap-1 font-medium hover:gap-2 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Orders
        </button>
        
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          {/* Order Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-serif font-bold text-charcoal mb-2 tracking-tight">
              Order #{order.orderNumber}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-charcoal/60 text-sm">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(order.createdAt).toLocaleString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <span className="text-brass/60">•</span>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
              </div>
            </div>
          </div>
          
          {/* Status Badges */}
          <div className="flex flex-col sm:flex-row gap-3 lg:min-w-[400px]">
            <div className="flex-1">
              <p className="text-xs font-semibold text-charcoal/60 mb-2 uppercase tracking-wide">Order Status</p>
              <div className={`${orderStatusConfig.color} text-white px-4 py-3 rounded-lg shadow-md flex items-center gap-2 font-medium`}>
                <span className="text-xl">{orderStatusConfig.icon}</span>
                <span className="text-sm uppercase tracking-wide">{orderStatusConfig.label}</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-charcoal/60 mb-2 uppercase tracking-wide">Payment Status</p>
              <div className={`${paymentStatusConfig.color} text-white px-4 py-3 rounded-lg shadow-md flex items-center gap-2 font-medium`}>
                <span className="text-xl">{paymentStatusConfig.icon}</span>
                <span className="text-sm uppercase tracking-wide">{paymentStatusConfig.label}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Information */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-white to-ivory/30 rounded-xl shadow-md border border-brass/30 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-brass/10 p-2 rounded-lg">
                <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-serif font-bold text-charcoal">
                Customer Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Contact Details - Always Visible */}
              <div className="bg-white/50 rounded-lg p-3 border border-brass/10">
                <h3 className="text-xs font-bold text-brass mb-2 uppercase tracking-wide flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Details
                </h3>
                <p className="text-charcoal font-semibold text-sm mb-1">{order.customerInfo.name}</p>
                <p className="text-charcoal/70 text-xs mb-0.5 break-all">{order.customerInfo.email}</p>
                {order.customerInfo.phone && (
                  <p className="text-charcoal/70 text-xs flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {order.customerInfo.phone}
                  </p>
                )}
              </div>
              
              {/* Delivery Address - Toggleable on Mobile */}
              <div className="bg-white/50 rounded-lg p-3 border border-brass/10">
                <button 
                  onClick={() => setShowDeliveryAddress(!showDeliveryAddress)}
                  className="w-full text-left md:cursor-default"
                >
                  <h3 className="text-xs font-bold text-brass mb-2 uppercase tracking-wide flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Delivery Address
                    </span>
                    <svg 
                      className={`w-4 h-4 md:hidden transition-transform ${showDeliveryAddress ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </h3>
                </button>
                <div className={`${showDeliveryAddress ? 'block' : 'hidden'} md:block`}>
                  <p className="text-charcoal text-xs leading-relaxed">
                    {order.deliveryAddress.addressLine1}<br />
                    {order.deliveryAddress.addressLine2 && <>{order.deliveryAddress.addressLine2}<br /></>}
                    {order.deliveryAddress.city}<br />
                    {order.deliveryAddress.county && <>{order.deliveryAddress.county}<br /></>}
                    {order.deliveryAddress.postcode}<br />
                    <span className="font-semibold">{order.deliveryAddress.country}</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Order Items */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-white to-ivory/30 rounded-xl shadow-md border border-brass/30 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-brass/10 p-2 rounded-lg">
                <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h2 className="text-lg font-serif font-bold text-charcoal">
                Order Items
              </h2>
            </div>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-white/60 rounded-lg p-4 border border-brass/20 hover:border-brass/40 transition-colors"
                >
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal text-sm mb-1">{item.productName}</h3>
                      <p className="text-xs text-brass font-mono mb-2">{item.productCode}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-charcoal/70">
                        <div className="flex items-center gap-1.5">
                          <span className="text-brass">▪</span>
                          <span>Material: <span className="font-medium text-charcoal">{item.selectedMaterial.name}</span></span>
                        </div>
                        {item.selectedSize != null && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-brass">▪</span>
                            <span>Size: <span className="font-medium text-charcoal">{item.selectedSizeName ? `${item.selectedSizeName} ${item.selectedSize}mm` : `${item.selectedSize}mm`}</span></span>
                          </div>
                        )}
                        {item.selectedFinish?.name && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-brass">▪</span>
                            <span>Finish: <span className="font-medium text-charcoal">{item.selectedFinish.name}</span></span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-brass">▪</span>
                          <span>Qty: <span className="font-medium text-charcoal">{item.quantity}</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right border-l border-brass/20 pl-4">
                      <p className="font-bold text-brass text-lg">
                        {formatCurrency(item.totalPrice)}
                      </p>
                      <p className="text-xs text-charcoal/60 mt-1">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pricing Summary */}
            <div className="mt-5 pt-5 border-t-2 border-brass/20">
              <div className="space-y-2 bg-gradient-to-br from-brass/5 to-brass/10 rounded-lg p-4">
                <div className="flex justify-between text-charcoal text-sm">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold">{formatCurrency(order.pricing.subtotal)}</span>
                </div>
                {order.discountCode && order.pricing.discount && parseFloat(order.pricing.discount.toString()) > 0 && (
                  <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 -mx-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <span className="font-medium text-green-600">Discount Applied</span>
                        <p className="text-xs text-charcoal/60 font-mono">{order.discountCode}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">-{formatCurrency(order.pricing.discount)}</span>
                  </div>
                )}
                {order.pricing.shipping && parseFloat(order.pricing.shipping.toString()) > 0 && (
                  <div className="flex justify-between text-charcoal text-sm">
                    <span className="font-medium">Shipping:</span>
                    <span className="font-semibold">{formatCurrency(order.pricing.shipping)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-white bg-brass rounded-lg px-4 py-3 mt-3">
                  <span>Total:</span>
                  <span>{formatCurrency(order.pricing.total)}</span>
                </div>
                {order.pricing.tax && parseFloat(order.pricing.tax.toString()) > 0 && (
                  <div className="bg-charcoal/5 border border-brass/20 rounded-lg px-3 py-2 mt-2">
                    <p className="text-xs text-charcoal/60 text-center italic">
                      Includes VAT of {formatCurrency(order.pricing.tax)} @ 20%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Order Status History */}
          {order.orderStatusHistory.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-white to-ivory/30 rounded-xl shadow-md border border-brass/30 p-5 hover:shadow-lg transition-shadow"
            >
              <button
                onClick={() => setShowOrderStatusHistory(!showOrderStatusHistory)}
                className="w-full text-left md:cursor-default"
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-brass/10 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-serif font-bold text-charcoal">
                      Order Status History
                    </h2>
                  </div>
                  <svg 
                    className={`w-5 h-5 md:hidden transition-transform text-brass ${showOrderStatusHistory ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              <div className={`${showOrderStatusHistory ? 'block' : 'hidden'} md:block space-y-3`}>
                {order.orderStatusHistory.slice().reverse().map((history: any, index: number) => {
                  const statusConfig = getStatusConfig(history.status, 'order')
                  return (
                    <div key={index} className="flex gap-3 pb-3 border-b border-brass/10 last:border-0 last:pb-0">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`${statusConfig.color} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shadow-md`}>
                          {statusConfig.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-charcoal">{statusConfig.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-charcoal/60 mb-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(history.updatedAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {history.note && (
                          <p className="text-xs text-charcoal/70 bg-brass/5 rounded p-2 mt-1">{history.note}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Payment Status History */}
          {order.paymentStatusHistory.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-gradient-to-br from-white to-ivory/30 rounded-xl shadow-md border border-brass/30 p-5 hover:shadow-lg transition-shadow"
            >
              <button
                onClick={() => setShowPaymentStatusHistory(!showPaymentStatusHistory)}
                className="w-full text-left md:cursor-default"
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-brass/10 p-2 rounded-lg">
                      <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-serif font-bold text-charcoal">
                      Payment Status History
                    </h2>
                  </div>
                  <svg 
                    className={`w-5 h-5 md:hidden transition-transform text-brass ${showPaymentStatusHistory ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              <div className={`${showPaymentStatusHistory ? 'block' : 'hidden'} md:block space-y-3`}>
                {order.paymentStatusHistory.slice().reverse().map((history: any, index: number) => {
                  const statusConfig = getStatusConfig(history.status, 'payment')
                  return (
                    <div key={index} className="flex gap-3 pb-3 border-b border-brass/10 last:border-0 last:pb-0">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`${statusConfig.color} w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shadow-md`}>
                          {statusConfig.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-charcoal">{statusConfig.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-charcoal/60 mb-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(history.updatedAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {history.note && (
                          <p className="text-xs text-charcoal/70 bg-brass/5 rounded p-2 mt-1">{history.note}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status Management */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-white to-brass/5 rounded-xl shadow-lg border-2 border-brass/30 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-brass/20 p-2 rounded-lg">
                <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-base font-serif font-bold text-charcoal">
                Update Status
              </h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brass mb-2 uppercase tracking-wide">
                  Order Status
                </label>
                <select
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-brass/30 rounded-lg text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition-all shadow-sm"
                >
                  {orderStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.icon} {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brass mb-2 uppercase tracking-wide">
                  Payment Status
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-brass/30 rounded-lg text-charcoal font-medium focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition-all shadow-sm"
                >
                  {paymentStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.icon} {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brass mb-2 uppercase tracking-wide">
                  Note (optional)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={2}
                  placeholder="Add a note about this change..."
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-brass/30 rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition-all shadow-sm"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleUpdateOrderStatus}
                  disabled={updating || newOrderStatus === order.status}
                  className="w-full px-4 py-3 bg-gradient-to-r from-brass to-brass/90 text-white font-bold rounded-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Order Status
                    </>
                  )}
                </button>
                <button
                  onClick={handleUpdatePaymentStatus}
                  disabled={updating || newPaymentStatus === order.paymentInfo?.status}
                  className="w-full px-4 py-3 bg-gradient-to-r from-charcoal to-charcoal/90 text-white font-bold rounded-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Payment Status
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Admin Messages */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-white to-brass/5 rounded-xl shadow-lg border-2 border-brass/30 p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-brass/20 p-2 rounded-lg">
                <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h2 className="text-base font-serif font-bold text-charcoal">
                Customer Messages
              </h2>
            </div>
            
            {/* Message History */}
            {order.adminMessages && order.adminMessages?.length > 0 && (
              <div className="mb-4 space-y-2.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {order.adminMessages?.slice().reverse().map((msg: any, index: number) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-brass/10 to-brass/5 rounded-lg p-3 border border-brass/30 hover:border-brass/50 transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="bg-brass/20 rounded-full p-1">
                        <svg className="w-3 h-3 text-brass" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-xs text-charcoal whitespace-pre-wrap leading-relaxed flex-1">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-charcoal/60 pl-5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {new Date(msg.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* New Message Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-brass mb-2 uppercase tracking-wide">
                  Send Message
                </label>
                <textarea
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  rows={4}
                  placeholder="Type your message to the customer..."
                  className="w-full px-3 py-2.5 text-sm bg-white border-2 border-brass/30 rounded-lg text-charcoal focus:outline-none focus:ring-2 focus:ring-brass focus:border-brass transition-all shadow-sm resize-none"
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={sending || !adminMessage.trim()}
                className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Message & Email
                  </>
                )}
              </button>
              <AnimatePresence>
                {messageSent && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-3 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs font-semibold text-green-800">
                      Message sent and email delivered to customer!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

