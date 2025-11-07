'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { ordersApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import type { Order } from '@/types'

export default function OrdersPage() {
  const router = useRouter()
  const { token, isAuthenticated, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?returnUrl=/orders')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (token) {
      fetchOrders()
    }
  }, [token, filter])

  const fetchOrders = async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await ordersApi.getAll({ status: filter === 'all' ? undefined : filter }, token)
      setOrders(response.orders)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-charcoal">
        <LuxuryNavigation />
        <div className="pt-32 flex items-center justify-center h-96">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brass"></div>
        </div>
      </div>
    )
  }

  const filters = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
  ]

  return (
    <div className="min-h-screen bg-charcoal">
      <LuxuryNavigation />
      
      <main className="pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-12 xl:px-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-ivory mb-2 tracking-wide">
              My Orders
            </h1>
            <p className="text-brass text-xs sm:text-sm tracking-luxury">
              Track and manage your orders
            </p>
          </motion.div>

          {/* Filters */}
          <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap min-h-[44px] ${
                  filter === f.value
                    ? 'bg-brass text-charcoal'
                    : 'bg-charcoal/50 text-ivory border border-brass/30 hover:bg-brass/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brass"></div>
              <p className="text-ivory mt-4">Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-24 h-24 text-brass/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
              title="No orders found"
              description={filter === 'all' ? "You haven't placed any orders yet" : `No ${filter} orders`}
              action={{
                label: 'Browse Products',
                onClick: () => router.push('/products')
              }}
            />
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onClick={() => router.push(`/orders/${order._id}`)}
                  className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-4 sm:p-5 lg:p-6 hover:border-brass/40 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <h3 className="text-base sm:text-lg lg:text-xl font-serif font-bold text-ivory">
                          Order #{order.orderNumber}
                        </h3>
                        <StatusBadge status={order.status} size="sm" />
                      </div>
                      <p className="text-ivory/60 text-xs sm:text-sm">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-brass text-xl sm:text-2xl font-bold">
                        {formatCurrency(order.pricing.total)}
                      </p>
                      {order.discountCode && order.pricing.discount && parseFloat(order.pricing.discount.toString()) > 0 && (
                        <p className="text-green-400 text-xs sm:text-sm font-medium">
                          💰 Saved {formatCurrency(order.pricing.discount)}
                        </p>
                      )}
                      <p className="text-ivory/60 text-xs sm:text-sm">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item._id} className="flex-shrink-0 bg-charcoal/50 border border-brass/10 rounded px-2.5 sm:px-3 py-2 text-xs sm:text-sm min-w-[140px]">
                        <p className="text-ivory font-medium truncate">{item.productName}</p>
                        <p className="text-ivory/60 text-xs">Qty: {item.quantity}</p>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="flex-shrink-0 flex items-center px-2.5 sm:px-3 text-brass text-xs sm:text-sm whitespace-nowrap">
                        +{order.items.length - 3} more
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}

