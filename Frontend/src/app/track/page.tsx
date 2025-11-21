'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ordersApi } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, toNumber } from '@/lib/utils'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import type { Order, OrderItem } from '@/types'

export default function TrackGuestOrderPage() {
  const toast = useToast()
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [showVATBreakdown, setShowVATBreakdown] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

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

  const toggleItemExpansion = (index: number) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  // Calculate per-item price breakdown with VAT using actual priceBreakdown data
  // Note: All prices are VAT-inclusive, so we extract VAT from the total
  const calculateItemBreakdown = (item: OrderItem, orderVATRate: number) => {
    // Use priceBreakdown from item if available
    const priceBreakdown = item.priceBreakdown || {
      materialBase: toNumber(item.selectedMaterial.basePrice),
      materialDiscount: item.selectedMaterial.materialDiscount ? toNumber(item.selectedMaterial.materialDiscount) : 0,
      materialNet: item.selectedMaterial.netBasePrice ? toNumber(item.selectedMaterial.netBasePrice) : toNumber(item.selectedMaterial.basePrice),
      size: item.selectedSize ? toNumber(item.selectedSize.sizeCost) : 0,
      finishes: item.selectedFinish ? toNumber(item.selectedFinish.priceAdjustment) : 0,
      packaging: toNumber(item.packagingPrice),
      totalItemDiscount: 0
    }
    
    const materialBasePrice = toNumber(priceBreakdown.materialBase)
    const materialDiscount = toNumber(priceBreakdown.materialDiscount)
    const materialNet = toNumber(priceBreakdown.materialNet)
    const sizeCost = toNumber(priceBreakdown.size)
    const finishCost = toNumber(priceBreakdown.finishes)
    const packagingCost = toNumber(priceBreakdown.packaging)
    
    // Material cost is the net price (after discount)
    const materialCost = materialNet
    
    // All component prices are VAT-inclusive
    // Unit price (VAT-inclusive) = material + size + finish + packaging
    const unitPriceIncludingVAT = materialCost + sizeCost + finishCost + packagingCost
    
    const quantity = item.quantity
    
    // Total item price (VAT-inclusive)
    const itemTotal = toNumber(item.totalPrice)
    
    // Extract VAT from the total price using the formula: VAT = price × (rate / (100 + rate))
    const vatRate = orderVATRate || 20
    const vatAmount = (itemTotal * vatRate) / (100 + vatRate)
    
    // Calculate price excluding VAT
    const itemSubtotalBeforeVAT = itemTotal - vatAmount
    const unitPriceBeforeVAT = itemSubtotalBeforeVAT / quantity

    return {
      materialBasePrice,
      materialCost,
      materialDiscount,
      sizeCost,
      finishCost,
      packagingCost,
      unitPriceBeforeVAT,
      unitPriceIncludingVAT,
      quantity,
      itemSubtotalBeforeVAT,
      vatAmount,
      itemTotal,
      hasDiscount: materialDiscount > 0,
      discountPercentage: materialBasePrice > 0 ? Math.round((materialDiscount / materialBasePrice) * 100) : 0
    }
  }

  return (
    <div className="min-h-screen bg-charcoal">
      <LuxuryNavigation />

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 text-center"
          >
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-ivory mb-2">
              Track Your Order
            </h1>
            <p className="text-brass text-sm tracking-luxury">
              Enter your order details to check your order status
            </p>
          </motion.div>

          {/* Compact Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-4 sm:p-6 mb-6 max-w-6xl mx-auto"
          >
            <form onSubmit={handleTrackOrder}>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Order Number Input */}
                <div className="md:col-span-4">
                  <label className="block text-ivory text-xs font-medium mb-1.5">
                    Order Number <span className="text-brass">*</span>
                  </label>
                  <input
                    type="text"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass uppercase text-sm"
                    placeholder="GL202411190001"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Email Input */}
                <div className="md:col-span-5">
                  <label className="block text-ivory text-xs font-medium mb-1.5">
                    Email Address <span className="text-brass">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass text-sm"
                    placeholder="your.email@example.com"
                    required
                    disabled={loading}
                  />
                </div>

                {/* Submit Button */}
                <div className="md:col-span-3 md:flex md:items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-brass text-charcoal font-bold rounded-md hover:bg-olive transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:mt-6"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Track Order
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-3 text-xs text-ivory/50 text-center">
                Enter the order number (e.g., GL202411190001) and email address you used when placing the order
              </p>
            </form>
          </motion.div>

          {/* Order Details - Full Width Grid Layout */}
          {searched && order && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-7xl mx-auto"
            >
              {/* Order Badge & Order Status */}
              <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-4 sm:p-6 mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {order.isGuestOrder && (
                    <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium bg-gray-900/50 text-gray-300 border-gray-600">
                      Guest Order
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-ivory">Order {order.orderNumber}</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-ivory/70 text-xs mb-1">Order Date</p>
                    <p className="text-ivory text-sm">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-ivory/70 text-xs mb-1">Status</p>
                    <span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-medium ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-ivory/70 text-xs mb-1">Payment</p>
                    <span className={`inline-block px-2 py-0.5 rounded-md border text-xs font-medium ${getPaymentStatusColor(order.paymentInfo.status)}`}>
                      {formatStatus(order.paymentInfo.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-ivory/70 text-xs mb-1">Total</p>
                    <p className="text-brass font-bold text-sm">{formatCurrency(toNumber(order.pricing.total))}</p>
                  </div>
                </div>
              </div>

              {/* Main Grid Layout - 2 Columns on Desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Items (2/3 width) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-ivory mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Order Items ({order.items.length})
                    </h2>
                    <div className="space-y-3">
                      {order.items.map((item, index) => {
                        const isExpanded = expandedItems.has(index)
                        const breakdown = calculateItemBreakdown(item, order.pricing.vatRate || 20)

                        return (
                          <div key={index} className="bg-charcoal/50 border border-brass/10 rounded-lg overflow-hidden">
                            {/* Item Header - Always Visible */}
                            <div className="p-4">
                              <div className="flex justify-between items-start gap-4 mb-2">
                                <div className="flex-1">
                                  <h3 className="text-ivory font-bold text-sm sm:text-base">{item.productCode}</h3>
                                  <p className="text-ivory/50 text-xs mt-0.5">{item.productName}</p>
                                  <div className="mt-2 space-y-1">
                                    <p className="text-ivory/70 text-xs">
                                      <span className="font-medium">Material:</span> {item.selectedMaterial.name}
                                    </p>
                                    {item.selectedFinish?.name && (
                                      <p className="text-ivory/70 text-xs">
                                        <span className="font-medium">Finish:</span> {item.selectedFinish.name}
                                      </p>
                                    )}
                                    {item.selectedSize && (
                                      <p className="text-ivory/70 text-xs">
                                        <span className="font-medium">Size:</span> {
                                          item.selectedSize.name && item.selectedSize.sizeMM 
                                            ? `${item.selectedSize.name} ${item.selectedSize.sizeMM}mm`
                                            : item.selectedSize.sizeMM 
                                            ? `${item.selectedSize.sizeMM}mm`
                                            : item.selectedSize.name || 'Standard'
                                        }
                                      </p>
                                    )}
                                    <p className="text-ivory/70 text-xs">
                                      <span className="font-medium">Qty:</span> {item.quantity}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {(() => {
                                    const unitPrice = item.unitPrice ? toNumber(item.unitPrice) : (toNumber(item.totalPrice) / item.quantity)
                                    return (
                                      <>
                                        <p className="text-ivory font-bold text-base sm:text-lg">{formatCurrency(unitPrice)}</p>
                                        <p className="text-ivory/50 text-xs">{formatCurrency(unitPrice)} each</p>
                                        {item.quantity > 1 && (
                                          <p className="text-ivory/60 text-xs mt-1">
                                            Total: {formatCurrency(toNumber(item.totalPrice))}
                                          </p>
                                        )}
                                      </>
                                    )
                                  })()}
                                </div>
                              </div>

                              {/* Toggle Price Breakdown Button */}
                              <button
                                onClick={() => toggleItemExpansion(index)}
                                className="w-full flex items-center justify-between bg-brass/10 border border-brass/30 rounded-md px-3 py-2 hover:bg-brass/20 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-brass">Price Breakdown</span>
                                </div>
                                <svg
                                  className={`w-4 h-4 text-brass transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            </div>

                            {/* Expandable Price Breakdown with VAT */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-charcoal/80 border-t border-brass/20 p-4 space-y-3">
                                    {/* Price Breakdown Section */}
                                    <div>
                                      <div className="flex items-center gap-2 mb-3">
                                        <svg className="w-4 h-4 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h4 className="text-brass font-bold text-sm">Price Breakdown</h4>
                                      </div>
                                      
                                      <div className="space-y-2.5">
                                        {/* Material with discount if applicable */}
                                        <div className="flex items-center justify-between">
                                          <span className="text-ivory/70 text-xs">
                                            Material ({item.selectedMaterial.name})
                                          </span>
                                          <div className="flex items-center gap-2">
                                            {breakdown.hasDiscount && (
                                              <>
                                                <span className="text-ivory/50 text-xs line-through">
                                                  {formatCurrency(breakdown.materialBasePrice)}
                                                </span>
                                                <span className="bg-brass/20 text-brass text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                                  -{breakdown.discountPercentage}%
                                                </span>
                                              </>
                                            )}
                                            <span className="text-ivory font-medium text-xs">
                                              {formatCurrency(breakdown.materialCost)}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Size */}
                                    {breakdown.sizeCost > 0 && item.selectedSize && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-ivory/70 text-xs">
                                              Size {item.selectedSize.name && item.selectedSize.sizeMM 
                                                ? `(${item.selectedSize.name} ${item.selectedSize.sizeMM}mm)`
                                                : item.selectedSize.sizeMM 
                                                ? `(${item.selectedSize.sizeMM}mm)`
                                                : item.selectedSize.name 
                                                ? `(${item.selectedSize.name})`
                                                : ''}
                                            </span>
                                            <span className="text-ivory font-medium text-xs">
                                              +{formatCurrency(breakdown.sizeCost)}
                                            </span>
                                          </div>
                                        )}

                                        {/* Finish */}
                                        {breakdown.finishCost > 0 && item.selectedFinish && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-ivory/70 text-xs">
                                              Finish ({item.selectedFinish.name})
                                            </span>
                                            <span className="text-ivory font-medium text-xs">
                                              +{formatCurrency(breakdown.finishCost)}
                                            </span>
                                          </div>
                                        )}

                                        {/* Premium Packaging */}
                                        {breakdown.packagingCost > 0 && (
                                          <div className="flex items-center justify-between">
                                            <span className="text-ivory/70 text-xs">
                                              Premium Packaging
                                            </span>
                                            <span className="text-ivory font-medium text-xs">
                                              +{formatCurrency(breakdown.packagingCost)}
                                            </span>
                                      </div>
                                    )}
                                      </div>
                                    </div>

                                    {/* Item Total Section */}
                                    <div className="border-t border-brass/20 pt-3">
                                      <div className="flex items-center gap-2 mb-3">
                                        <svg className="w-4 h-4 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h4 className="text-brass font-bold text-sm">Item Total (VAT Included):</h4>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-ivory/70 text-xs">Price excluding VAT:</span>
                                          <span className="text-ivory font-medium text-xs">
                                            {formatCurrency(breakdown.itemSubtotalBeforeVAT)}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <span className="text-ivory/70 text-xs">
                                            VAT ({order.pricing.vatRate || 20}%):
                                          </span>
                                          <span className="text-ivory font-medium text-xs">
                                            +{formatCurrency(breakdown.vatAmount)}
                                          </span>
                                        </div>
                                        <div className="border-t border-brass/20 pt-2 mt-2">
                                          <div className="flex items-center justify-between">
                                            <span className="text-brass font-bold text-xs">Total (inc. VAT):</span>
                                            <span className="text-brass font-bold text-sm">
                                              {formatCurrency(breakdown.itemTotal)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Additional Information */}
                                    <div className="border-t border-brass/20 pt-3 mt-3">
                                      <p className="text-ivory/50 text-[10px] leading-relaxed">
                                        All prices include {order.pricing.vatRate || 20}% VAT. Delivery charges calculated at checkout.
                                      </p>
                                      <p className="text-ivory/50 text-[10px] leading-relaxed mt-1">
                                        Delivery to UK Mainland only (excl. Northern Ireland).{' '}
                                        <a href="/terms" className="text-brass underline hover:text-olive transition-colors">
                                          See Terms & Conditions
                                        </a>
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-ivory mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Delivery Address
                    </h2>
                    <div className="text-ivory/70 text-sm space-y-1">
                      <p className="text-ivory font-medium mb-2">{order.customerInfo.name}</p>
                      <p>{order.deliveryAddress.addressLine1}</p>
                      {order.deliveryAddress.addressLine2 && <p>{order.deliveryAddress.addressLine2}</p>}
                      <p>{order.deliveryAddress.city}, {order.deliveryAddress.postcode}</p>
                      <p>{order.deliveryAddress.country}</p>
                    </div>
                  </div>
                </div>

                {/* Right Column - Order Summary (1/3 width) */}
                <div className="lg:col-span-1">
                  <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-4 sm:p-6 sticky top-24">
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-ivory mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Order Summary
                    </h2>
                    <div className="space-y-3">
                      {/* Item Total */}
                      <div className="flex justify-between text-ivory/70 text-sm">
                        <span>Item Total:</span>
                        <span className="font-medium text-ivory">{formatCurrency(toNumber(order.pricing.subtotal))}</span>
                      </div>

                      {/* Discount Applied */}
                      {toNumber(order.pricing.discount) > 0 && (() => {
                        const subtotalNum = toNumber(order.pricing.subtotal)
                        const discountNum = toNumber(order.pricing.discount)
                        const discountPercentage = subtotalNum > 0 ? Math.round((discountNum / subtotalNum) * 100 * 10) / 10 : 0
                        
                        return (
                          <div className="bg-green-900/30 border border-green-700/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-green-400 font-semibold text-sm">Discount Applied</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className="text-green-300 text-xs">
                            {order.discountCode && (
                                  <span className="font-medium">{order.discountCode}</span>
                                )}
                                {order.discountCode && discountPercentage > 0 && <span className="mx-1">•</span>}
                                {discountPercentage > 0 && (
                                  <span>{discountPercentage}% off</span>
                                )}
                              </div>
                              <span className="text-green-400 font-bold text-sm">-{formatCurrency(discountNum)}</span>
                            </div>
                        </div>
                        )
                      })()}

                      {/* Total After Discount */}
                      {toNumber(order.pricing.discount) > 0 && (
                        <div className="flex justify-between text-ivory text-sm font-medium border-t border-brass/20 pt-2">
                          <span>Total After Discount:</span>
                          <span>{formatCurrency(Math.max(0, toNumber(order.pricing.subtotal) - toNumber(order.pricing.discount)))}</span>
                        </div>
                      )}

                      {/* Shipping */}
                      <div className="flex justify-between text-ivory/70 text-sm">
                        <span>Shipping:</span>
                        <span className="font-medium text-ivory">{formatCurrency(toNumber(order.pricing.shipping))}</span>
                      </div>

                      {/* VAT Breakdown - Toggleable */}
                      {(() => {
                        const subtotalNum = toNumber(order.pricing.subtotal)
                        const discountNum = toNumber(order.pricing.discount)
                        const shippingNum = toNumber(order.pricing.shipping)
                        const totalAfterDiscount = Math.max(0, subtotalNum - discountNum)
                        // Total amount (VAT-inclusive) = subtotal - discount + shipping
                        const totalIncludingVAT = totalAfterDiscount + shippingNum
                        const vatRate = order.pricing.vatRate || 20
                        
                        // Extract VAT from VAT-inclusive total: VAT = total × (rate / (100 + rate))
                        const vatAmount = (totalIncludingVAT * vatRate) / (100 + vatRate)
                        // Calculate total before VAT
                        const totalBeforeVAT = totalIncludingVAT - vatAmount

                        if (vatRate > 0) {
                          return (
                            <div className="mt-3">
                              <button
                                onClick={() => setShowVATBreakdown(!showVATBreakdown)}
                                className="w-full flex items-center justify-between bg-brass/10 border border-brass/30 rounded-lg px-3 py-2 hover:bg-brass/20 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-brass">VAT Breakdown</span>
                                </div>
                                <svg
                                  className={`w-4 h-4 text-brass transition-transform ${showVATBreakdown ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <AnimatePresence>
                                {showVATBreakdown && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="bg-brass/5 border border-brass/20 rounded-lg p-3 mt-2 space-y-2">
                                      <div className="flex justify-between text-ivory/70 text-xs">
                                        <span>Item Total Before VAT:</span>
                                        <span className="font-semibold text-ivory">{formatCurrency(totalBeforeVAT)}</span>
                                      </div>
                                      <div className="flex justify-between text-ivory/70 text-xs">
                                        <span>VAT ({vatRate}%):</span>
                                        <span className="font-semibold text-ivory">+{formatCurrency(vatAmount)}</span>
                                      </div>
                                      <div className="flex justify-between text-ivory text-xs font-bold border-t border-brass/20 pt-2 mt-2">
                                        <span>Total (inc. VAT):</span>
                                        <span className="text-brass">{formatCurrency(totalIncludingVAT)}</span>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )
                        }
                        return null
                      })()}

                      {/* Final Amount */}
                      <div className="flex justify-between text-lg font-bold text-white bg-brass rounded-lg px-4 py-3 mt-4">
                        <span>Final Amount (inc. VAT):</span>
                        <span>{formatCurrency(toNumber(order.pricing.total))}</span>
                      </div>
                      <p className="text-ivory/50 text-[10px] text-center mt-2">
                        All prices include {order.pricing.vatRate || 20}% UK VAT
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Help Section */}
              <div className="bg-brass/10 border border-brass/30 rounded-lg p-4 sm:p-6 mt-6 max-w-7xl mx-auto">
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
                      <p className="text-brass font-medium">enquiries@glisterlondon.com</p>
                      <p className="text-ivory/60">Quote your order number: <span className="text-brass font-semibold">{order.orderNumber}</span></p>
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

