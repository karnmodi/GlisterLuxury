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
import AnalyticsLineChart from '@/components/admin/analytics/AnalyticsLineChart'
import AnalyticsBarChart from '@/components/admin/analytics/AnalyticsBarChart'
import AnalyticsPieChart from '@/components/admin/analytics/AnalyticsPieChart'
import AnalyticsAreaChart from '@/components/admin/analytics/AnalyticsAreaChart'

export default function AnalyticsPage() {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'visits' | 'revenue' | 'products' | 'users' | 'orders' | 'conversions'>('overview')
  const [loadingTabs, setLoadingTabs] = useState<Record<string, boolean>>({})
  
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

      setLoadingTabs(prev => ({ ...prev, [tab]: true }))

      switch (tab) {
        case 'visits':
          if (!visitsData) {
            const response = await analyticsApi.getWebsiteVisits(token)
            console.log('Visits data received:', response.data)
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
    } finally {
      setLoadingTabs(prev => ({ ...prev, [tab]: false }))
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
    <div className="space-y-4 md:space-y-6 px-4 md:px-0">
      {/* Header */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1 text-sm md:text-base">Monitor your business performance and insights</p>
        </div>
      </div>

      {/* Tabs - Scrollable on mobile */}
      <div className="border-b border-gray-200 -mx-4 px-4 md:mx-0 md:px-0">
        <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide">
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
              className={`py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
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
        <div className="space-y-6 md:space-y-8">
          {/* Today's Metrics */}
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">Today</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">This Week</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">This Month</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 md:mb-4">All Time</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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

      {activeTab === 'visits' && (
        <div className="space-y-4 md:space-y-6">
          {loadingTabs.visits ? (
            <div className="flex items-center justify-center min-h-[40vh] md:min-h-[60vh]">
              <div className="text-center px-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm md:text-base">Loading website visits data...</p>
              </div>
            </div>
          ) : !visitsData ? (
            <div className="flex items-center justify-center min-h-[40vh] md:min-h-[60vh]">
              <div className="text-center px-4">
                <p className="text-gray-600 mb-2 text-sm md:text-base">No website visits data available</p>
                <p className="text-xs md:text-sm text-gray-500">Make sure you have visited customer-facing pages on your website.</p>
              </div>
            </div>
          ) : visitsData.timeSeries.length === 0 && visitsData.topPages.length === 0 ? (
            <div className="flex items-center justify-center min-h-[40vh] md:min-h-[60vh]">
              <div className="text-center px-4">
                <p className="text-gray-600 mb-2 text-sm md:text-base">No website visits found</p>
                <p className="text-xs md:text-sm text-gray-500">Start browsing your website to see analytics data here.</p>
              </div>
            </div>
          ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <MetricCard
              title="Total Page Views"
              value={visitsData.summary.totalPageViews.toLocaleString()}
              subtitle={`Average: ${visitsData.summary.averageDaily} per day`}
              colorClass="bg-blue-500"
            />
            <MetricCard
              title="Unique Visitors"
              value={visitsData.timeSeries.reduce((sum, d) => sum + (d.uniqueVisitors || 0), 0).toLocaleString()}
              subtitle="total unique visitors"
              colorClass="bg-green-500"
            />
          </div>

          {/* Page Views Over Time */}
          {visitsData.timeSeries.length > 0 && (
            <AnalyticsLineChart
              data={visitsData.timeSeries}
              lines={[
                { dataKey: 'pageViews', name: 'Page Views', color: '#3b82f6' },
                { dataKey: 'uniqueVisitors', name: 'Unique Visitors', color: '#10b981' }
              ]}
              xAxisKey="date"
              title="Website Visits Over Time"
              height={280}
            />
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Device Breakdown Pie Chart */}
            <AnalyticsPieChart
              data={[
                { name: 'Desktop', value: visitsData.deviceBreakdown.desktop },
                { name: 'Mobile', value: visitsData.deviceBreakdown.mobile },
                { name: 'Tablet', value: visitsData.deviceBreakdown.tablet }
              ].filter(d => d.value > 0)}
              colors={['#3b82f6', '#10b981', '#f59e0b']}
              title="Device Breakdown"
              height={300}
              innerRadius={60}
            />

            {/* Top Pages Bar Chart */}
            <AnalyticsBarChart
              data={visitsData.topPages.slice(0, 8).map(page => ({
                ...page,
                page: page.page.startsWith('/products/') 
                  ? page.page.replace('/products/', '') // Show just product name
                  : page.page
              }))}
              bars={[{ dataKey: 'views', name: 'Views', color: '#8b5cf6' }]}
              xAxisKey="page"
              title="Top 8 Pages"
              height={300}
              horizontal={true}
            />
          </div>
          </>
          )}
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

          {/* Revenue Over Time */}
          {revenueData.timeSeries.length > 0 && (
            <AnalyticsAreaChart
              data={revenueData.timeSeries}
              areas={[
                { dataKey: 'revenue', name: 'Revenue', color: '#10b981' },
                { dataKey: 'orders', name: 'Orders', color: '#3b82f6' }
              ]}
              xAxisKey="date"
              title="Revenue & Orders Over Time"
              height={350}
              formatYAxis={(value) => `£${value.toLocaleString()}`}
              formatTooltip={(value) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Category */}
            {revenueData.byCategory.length > 0 && (
              <AnalyticsBarChart
                data={revenueData.byCategory.slice(0, 8)}
                bars={[{ dataKey: 'revenue', name: 'Revenue', color: '#10b981' }]}
                xAxisKey="name"
                title="Revenue by Category"
                height={300}
                horizontal={true}
                formatYAxis={(value) => `£${value.toLocaleString()}`}
                formatTooltip={(value) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
              />
            )}

            {/* Revenue by Material */}
            {revenueData.byMaterial.length > 0 && (
              <AnalyticsPieChart
                data={revenueData.byMaterial.slice(0, 6).map(m => ({
                  name: m.name,
                  value: m.revenue
                }))}
                title="Revenue by Material"
                height={300}
                formatTooltip={(value) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
                innerRadius={60}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'products' && productData && (
        <div className="space-y-6">
          {/* Top Selling Products Chart */}
          {productData.topSelling.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnalyticsBarChart
                data={productData.topSelling.slice(0, 10)}
                bars={[{ dataKey: 'quantitySold', name: 'Quantity Sold', color: '#3b82f6' }]}
                xAxisKey="productName"
                title="Top 10 Selling Products by Quantity"
                height={350}
                horizontal={true}
              />
              <AnalyticsBarChart
                data={productData.topSelling.slice(0, 10)}
                bars={[{ dataKey: 'revenue', name: 'Revenue', color: '#10b981' }]}
                xAxisKey="productName"
                title="Top 10 Selling Products by Revenue"
                height={350}
                horizontal={true}
                formatYAxis={(value) => `£${value.toLocaleString()}`}
                formatTooltip={(value) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
              />
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products (Details)</h3>
            <TopProductsTable products={productData.topSelling} type="selling" />
          </div>
          
          {productData.mostViewed.length > 0 && (
            <>
              <AnalyticsBarChart
                data={productData.mostViewed.slice(0, 10)}
                bars={[{ dataKey: 'views', name: 'Views', color: '#8b5cf6' }]}
                xAxisKey="productName"
                title="Most Viewed Products"
                height={300}
                horizontal={true}
              />
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Viewed Products (Details)</h3>
              <TopProductsTable products={productData.mostViewed} type="viewed" />
            </div>
            </>
          )}
          
          {productData.mostWishlisted.length > 0 && (
            <>
              <AnalyticsBarChart
                data={productData.mostWishlisted.slice(0, 10)}
                bars={[{ dataKey: 'wishlistCount', name: 'Wishlist Count', color: '#ec4899' }]}
                xAxisKey="productName"
                title="Most Wishlisted Products"
                height={300}
                horizontal={true}
              />
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Wishlisted Products (Details)</h3>
              <TopProductsTable products={productData.mostWishlisted} type="wishlisted" />
            </div>
            </>
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
            <MetricCard
              title="Customer to Admin Ratio"
              value={`${(userData.roleBreakdown.customer / (userData.roleBreakdown.admin || 1)).toFixed(0)}:1`}
              subtitle="customers per admin"
              colorClass="bg-purple-500"
            />
                </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Registrations Over Time */}
            {userData.timeSeries.length > 0 && (
              <AnalyticsLineChart
                data={userData.timeSeries}
                lines={[
                  { dataKey: 'newRegistrations', name: 'New Registrations', color: '#10b981' },
                  { dataKey: 'totalUsers', name: 'Total Users', color: '#3b82f6' }
                ]}
                xAxisKey="date"
                title="User Growth Over Time"
                height={300}
              />
            )}

            {/* User Role Breakdown */}
            <AnalyticsPieChart
              data={[
                { name: 'Customers', value: userData.roleBreakdown.customer },
                { name: 'Admins', value: userData.roleBreakdown.admin }
              ]}
              colors={['#3b82f6', '#f59e0b']}
              title="User Role Distribution"
              height={300}
              innerRadius={60}
            />
          </div>
        </div>
      )}

      {activeTab === 'orders' && orderData && (
        <div className="space-y-6">
          {/* Orders Over Time */}
          {orderData.timeSeries.length > 0 && (
            <AnalyticsLineChart
              data={orderData.timeSeries}
              lines={[
                { dataKey: 'orders', name: 'Orders', color: '#3b82f6' },
                { dataKey: 'revenue', name: 'Revenue', color: '#10b981' }
              ]}
              xAxisKey="date"
              title="Orders & Revenue Over Time"
              height={350}
              formatTooltip={(value) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders by Status Pie Chart */}
            <AnalyticsPieChart
              data={orderData.ordersByStatus.map(s => ({
                name: s.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                value: s.count
              }))}
              title="Orders by Status"
              height={300}
              innerRadius={60}
            />
            
            {/* Payment Status Pie Chart */}
            <AnalyticsPieChart
              data={orderData.paymentsByStatus.map(s => ({
                name: s.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                value: s.count
              }))}
              colors={['#10b981', '#f59e0b', '#ef4444']}
              title="Payment Status Distribution"
              height={300}
              innerRadius={60}
            />
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

          {/* Conversion Rates Over Time */}
          {conversionData.timeSeries.length > 0 && (
            <AnalyticsAreaChart
              data={conversionData.timeSeries}
              areas={[
                { dataKey: 'conversionRate', name: 'Conversion Rate %', color: '#10b981' },
                { dataKey: 'abandonmentRate', name: 'Abandonment Rate %', color: '#ef4444' }
              ]}
              xAxisKey="date"
              title="Conversion & Abandonment Rates Over Time"
              height={350}
              formatTooltip={(value) => `${value}%`}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cart Funnel */}
            <AnalyticsPieChart
              data={[
                { name: 'Completed Orders', value: conversionData.summary.completedOrders },
                { name: 'Abandoned Carts', value: conversionData.summary.abandonedCarts }
              ]}
              colors={['#10b981', '#ef4444']}
              title="Cart Conversion Funnel"
              height={300}
              innerRadius={60}
            />

            {/* Average Cart Value Over Time */}
            {conversionData.timeSeries.filter(d => d.averageCartValue > 0).length > 0 && (
              <AnalyticsLineChart
                data={conversionData.timeSeries.filter(d => d.averageCartValue > 0)}
                lines={[
                  { dataKey: 'averageCartValue', name: 'Avg Cart Value', color: '#8b5cf6' }
                ]}
                xAxisKey="date"
                title="Average Cart Value Over Time"
                height={300}
                formatYAxis={(value) => `£${value.toLocaleString()}`}
                formatTooltip={(value) => `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

