'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { analyticsApi } from '@/lib/api'
import type { 
  DashboardSummary, 
  WebsiteVisitAnalytics, 
  RevenueAnalytics, 
  ProductAnalytics,
  UserAnalytics,
  OrderAnalytics,
  ConversionAnalytics 
} from '@/types'
import MetricCard from '@/components/admin/analytics/MetricCard'
import TopProductsTable from '@/components/admin/analytics/TopProductsTable'

export default function AnalyticsPage() {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'revenue' | 'products' | 'users' | 'orders' | 'conversions'>('overview')
  
  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null)
  const [visitsData, setVisitsData] = useState<WebsiteVisitAnalytics | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null)
  const [productData, setProductData] = useState<ProductAnalytics | null>(null)
  const [userData, setUserData] = useState<UserAnalytics | null>(null)
  const [orderData, setOrderData] = useState<OrderAnalytics | null>(null)
  const [conversionData, setConversionData] = useState<ConversionAnalytics | null>(null)

  useEffect(() => {
    if (user && token) {
      loadDashboardData()
    }
  }, [user, token])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      if (!token) {
        showToast('Please login to view analytics', 'error')
        return
      }

      const response = await analyticsApi.getDashboardSummary(token)
      setDashboardData(response.data)
    } catch (error) {
      showToast('Failed to load analytics data', 'error')
      console.error('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTabData = async (tab: string) => {
    try {
      if (!token) {
        showToast('Please login to view analytics', 'error')
        return
      }

      switch (tab) {
        case 'visits':
          if (!visitsData) {
            const response = await analyticsApi.getWebsiteVisits(token)
            setVisitsData(response.data)
          }
          break
        case 'revenue':
          if (!revenueData) {
            const response = await analyticsApi.getRevenueAnalytics(token)
            setRevenueData(response.data)
          }
          break
        case 'products':
          if (!productData) {
            const response = await analyticsApi.getProductAnalytics(token)
            setProductData(response.data)
          }
          break
        case 'users':
          if (!userData) {
            const response = await analyticsApi.getUserAnalytics(token)
            setUserData(response.data)
          }
          break
        case 'orders':
          if (!orderData) {
            const response = await analyticsApi.getOrderAnalytics(token)
            setOrderData(response.data)
          }
          break
        case 'conversions':
          if (!conversionData) {
            const response = await analyticsApi.getConversionAnalytics(token)
            setConversionData(response.data)
          }
          break
      }
    } catch (error) {
      showToast('Failed to load analytics data', 'error')
      console.error('Analytics error:', error)
    }
  }

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    if (tab !== 'overview') {
      loadTabData(tab)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor your business performance and insights</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'visits', label: 'Website Visits' },
            { id: 'revenue', label: 'Revenue' },
            { id: 'products', label: 'Products' },
            { id: 'users', label: 'Users' },
            { id: 'orders', label: 'Orders' },
            { id: 'conversions', label: 'Conversions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as typeof activeTab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Today's Metrics */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Today</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Page Views"
                value={dashboardData.today.pageViews.toLocaleString()}
                subtitle="today"
                colorClass="bg-blue-500"
              />
              <MetricCard
                title="Unique Visitors"
                value={dashboardData.today.uniqueVisitors.toLocaleString()}
                subtitle="today"
                colorClass="bg-green-500"
              />
              <MetricCard
                title="Orders"
                value={dashboardData.today.orders.toLocaleString()}
                subtitle="today"
                colorClass="bg-purple-500"
              />
              <MetricCard
                title="Revenue"
                value={`£${dashboardData.today.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle="today"
                colorClass="bg-yellow-500"
              />
            </div>
          </div>

          {/* Weekly Metrics */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">This Week</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Page Views"
                value={dashboardData.weekly.pageViews.toLocaleString()}
                subtitle="this week"
                colorClass="bg-blue-500"
              />
              <MetricCard
                title="Orders"
                value={dashboardData.weekly.orders.toLocaleString()}
                subtitle="this week"
                colorClass="bg-purple-500"
              />
              <MetricCard
                title="Revenue"
                value={`£${dashboardData.weekly.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle="this week"
                colorClass="bg-yellow-500"
              />
              <MetricCard
                title="Conversion Rate"
                value={`${dashboardData.weekly.conversionRate}%`}
                subtitle="this week"
                colorClass="bg-green-500"
              />
            </div>
          </div>

          {/* Monthly Metrics */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">This Month</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Page Views"
                value={dashboardData.monthly.pageViews.toLocaleString()}
                subtitle="this month"
                colorClass="bg-blue-500"
              />
              <MetricCard
                title="Orders"
                value={dashboardData.monthly.orders.toLocaleString()}
                subtitle="this month"
                colorClass="bg-purple-500"
              />
              <MetricCard
                title="Revenue"
                value={`£${dashboardData.monthly.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                subtitle="this month"
                colorClass="bg-yellow-500"
              />
              <MetricCard
                title="New Users"
                value={dashboardData.monthly.registrations.toLocaleString()}
                subtitle="this month"
                colorClass="bg-green-500"
              />
            </div>
          </div>

          {/* Totals */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Time</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Total Users"
                value={dashboardData.totals.users.toLocaleString()}
                subtitle="registered users"
                colorClass="bg-indigo-500"
              />
              <MetricCard
                title="Total Orders"
                value={dashboardData.totals.orders.toLocaleString()}
                subtitle="all time"
                colorClass="bg-pink-500"
              />
              <MetricCard
                title="Total Products"
                value={dashboardData.totals.products.toLocaleString()}
                subtitle="in catalog"
                colorClass="bg-teal-500"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'visits' && visitsData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Total Page Views"
              value={visitsData.summary.totalPageViews.toLocaleString()}
              subtitle={`Average: ${visitsData.summary.averageDaily} per day`}
              colorClass="bg-blue-500"
            />
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Desktop</span>
                  <span className="font-semibold">{visitsData.deviceBreakdown.desktop.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Mobile</span>
                  <span className="font-semibold">{visitsData.deviceBreakdown.mobile.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tablet</span>
                  <span className="font-semibold">{visitsData.deviceBreakdown.tablet.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visitsData.topPages.map((page, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm text-gray-900">{page.page}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{page.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && revenueData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Revenue"
              value={`£${revenueData.summary.totalRevenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
              colorClass="bg-green-500"
            />
            <MetricCard
              title="Total Orders"
              value={revenueData.summary.totalOrders.toLocaleString()}
              colorClass="bg-blue-500"
            />
            <MetricCard
              title="Avg Order Value"
              value={`£${revenueData.summary.averageOrderValue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
              colorClass="bg-purple-500"
            />
          </div>

          {revenueData.byCategory.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {revenueData.byCategory.map((cat, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 text-sm text-gray-900">{cat.name}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          £{cat.revenue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{cat.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'products' && productData && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
            <TopProductsTable products={productData.topSelling} type="selling" />
          </div>
          
          {productData.mostViewed.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Viewed Products</h3>
              <TopProductsTable products={productData.mostViewed} type="viewed" />
            </div>
          )}
          
          {productData.mostWishlisted.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Wishlisted Products</h3>
              <TopProductsTable products={productData.mostWishlisted} type="wishlisted" />
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && userData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Users"
              value={userData.summary.totalUsers.toLocaleString()}
              colorClass="bg-blue-500"
            />
            <MetricCard
              title="New Registrations"
              value={userData.summary.totalRegistrations.toLocaleString()}
              subtitle={`Average: ${userData.summary.averageDaily} per day`}
              colorClass="bg-green-500"
            />
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Customers</span>
                  <span className="font-semibold">{userData.roleBreakdown.customer.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Admins</span>
                  <span className="font-semibold">{userData.roleBreakdown.admin.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && orderData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Status</h3>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-3">
                  {orderData.ordersByStatus.map((status, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600 capitalize">{status.status.replace(/_/g, ' ')}</span>
                      <span className="font-semibold">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="space-y-3">
                  {orderData.paymentsByStatus.map((status, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600 capitalize">{status.status.replace(/_/g, ' ')}</span>
                      <span className="font-semibold">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {orderData.refunds.count > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MetricCard
                title="Total Refunds"
                value={orderData.refunds.count.toLocaleString()}
                colorClass="bg-red-500"
              />
              <MetricCard
                title="Refund Amount"
                value={`£${orderData.refunds.totalAmount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
                colorClass="bg-orange-500"
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'conversions' && conversionData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Total Carts"
              value={conversionData.summary.totalCarts.toLocaleString()}
              colorClass="bg-blue-500"
            />
            <MetricCard
              title="Completed Orders"
              value={conversionData.summary.completedOrders.toLocaleString()}
              colorClass="bg-green-500"
            />
            <MetricCard
              title="Abandoned Carts"
              value={conversionData.summary.abandonedCarts.toLocaleString()}
              colorClass="bg-red-500"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Conversion Rate"
              value={`${conversionData.summary.conversionRate}%`}
              subtitle="carts to orders"
              colorClass="bg-green-500"
            />
            <MetricCard
              title="Abandonment Rate"
              value={`${conversionData.summary.abandonmentRate}%`}
              subtitle="abandoned carts"
              colorClass="bg-red-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}

