'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ordersApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import type { Order } from '@/types'

export default function AdminOrdersPage() {
  const router = useRouter()
  const { token, user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [orderStatus, setOrderStatus] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    pages: 1
  })
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0
  })

  useEffect(() => {
    if (token && user?.role === 'admin') {
      fetchOrders()
    } else if (user && user.role !== 'admin') {
      router.push('/')
    }
  }, [token, user, search, orderStatus, paymentStatus, page])

  const fetchOrders = async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await ordersApi.getAllOrdersAdmin({
        search: search || undefined,
        status: orderStatus !== 'all' ? orderStatus : undefined,
        paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined,
        page,
        limit: 20
      }, token)
      
      setOrders(response.orders)
      setStats(response.stats)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brass"></div>
      </div>
    )
  }

  const orderStatuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  const paymentStatuses = [
    { value: 'all', label: 'All Payment Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'awaiting_payment', label: 'Awaiting Payment' },
    { value: 'paid', label: 'Paid' },
    { value: 'partially_paid', label: 'Partially Paid' },
    { value: 'payment_failed', label: 'Payment Failed' },
    { value: 'payment_pending_confirmation', label: 'Pending Confirmation' },
    { value: 'refunded', label: 'Refunded' },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-charcoal mb-1">
            Orders Management
          </h1>
          <p className="text-charcoal/60 text-xs">
            Manage orders, update statuses, and communicate with customers
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow-sm border border-brass/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-charcoal/60 text-xs font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-charcoal mt-1">{stats.totalOrders}</p>
            </div>
            <div className="bg-brass/10 rounded-full p-2">
              <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-brass/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-charcoal/60 text-xs font-medium">Pending Orders</p>
              <p className="text-2xl font-bold text-charcoal mt-1">{stats.pendingOrders}</p>
            </div>
            <div className="bg-yellow-500/10 rounded-full p-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-brass/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-charcoal/60 text-xs font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-charcoal mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="bg-green-500/10 rounded-full p-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-brass/20 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Search
            </label>
            <Input
              type="text"
              placeholder="Search by name, email, or order number..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Order Status
            </label>
            <select
              value={orderStatus}
              onChange={(e) => {
                setOrderStatus(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 bg-white border border-brass/30 rounded-md text-charcoal focus:outline-none focus:ring-2 focus:ring-brass/50 transition-all"
            >
              {orderStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value)
                setPage(1)
              }}
              className="w-full px-4 py-2 bg-white border border-brass/30 rounded-md text-charcoal focus:outline-none focus:ring-2 focus:ring-brass/50 transition-all"
            >
              {paymentStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-brass/20 p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brass"></div>
            <p className="text-charcoal text-sm mt-3">Loading orders...</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-brass/20 p-8">
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-brass/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            }
            title="No orders found"
            description={search ? `No orders match "${search}"` : "No orders have been placed yet"}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-brass/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brass/20">
              <thead className="bg-charcoal/5">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                    Order Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-charcoal uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-charcoal uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-brass/10">
                {orders.map((order) => (
                  <tr 
                    key={order._id} 
                    onClick={() => router.push(`/admin/orders/${order._id}`)}
                    className="hover:bg-gradient-to-r hover:from-brass/5 hover:to-transparent transition-all duration-200 cursor-pointer group"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-bold text-brass group-hover:text-brass/80 transition-colors">
                        #{order.orderNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-charcoal group-hover:text-charcoal/90">
                          {order.customerInfo.name}
                        </p>
                        <p className="text-xs text-charcoal/60">
                          {order.customerInfo.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-charcoal">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-xs font-semibold text-charcoal">
                          {formatCurrency(order.pricing.total)}
                        </span>
                        {order.discountCode && order.pricing.discount && (
                          <div className="text-xs text-green-600 font-medium mt-0.5">
                            💰 -{formatCurrency(order.pricing.discount)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={order.status} type="order" size="sm" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={order.paymentInfo.status} type="payment" size="sm" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-charcoal/60">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span className="text-brass group-hover:text-brass/80 text-xs font-medium transition-colors inline-flex items-center gap-1">
                        View
                        <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="bg-charcoal/5 px-4 py-3 flex items-center justify-between border-t border-brass/20">
              <div className="text-xs text-charcoal/60">
                Page {pagination.page} of {pagination.pages} ({pagination.total} orders)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-white border border-brass/30 rounded-md text-xs font-medium text-charcoal hover:bg-brass/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.pages}
                  className="px-3 py-1.5 bg-white border border-brass/30 rounded-md text-xs font-medium text-charcoal hover:bg-brass/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

