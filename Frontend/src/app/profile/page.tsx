'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { ordersApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Address, OrderStats } from '@/types'

type TabType = 'overview' | 'account' | 'addresses' | 'orders'

export default function ProfilePage() {
  const { user, loading, isAuthenticated, logout, token, updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAuth()
  const { cart } = useCart()
  const { itemCount: wishlistCount } = useWishlist()
  const router = useRouter()
  
  // Active tab for mobile
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  
  // Order stats
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  
  // Profile editing
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  })
  
  // Address management
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addressFormData, setAddressFormData] = useState({
    label: 'Home',
    addressLine1: '',
    addressLine2: '',
    city: '',
    county: '',
    postcode: '',
    country: 'United Kingdom',
    isDefault: false
  })
  
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [loading, isAuthenticated, router])

  // Fetch order stats
  useEffect(() => {
    if (token) {
      fetchOrderStats()
    }
  }, [token])

  const fetchOrderStats = async () => {
    if (!token) return
    
    try {
      setStatsLoading(true)
      const response = await ordersApi.getStats(token)
      setOrderStats(response.stats)
    } catch (error) {
      console.error('Failed to fetch order stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setUpdating(true)

    try {
      await updateProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone || undefined,
      })
      setSuccess('Profile updated successfully!')
      setIsEditingProfile(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setUpdating(false)
    }
  }

  const openAddressModal = (address?: Address) => {
    if (address) {
      setEditingAddress(address)
      setAddressFormData({
        label: address.label,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || '',
        city: address.city,
        county: address.county || '',
        postcode: address.postcode,
        country: address.country,
        isDefault: address.isDefault
      })
    } else {
      setEditingAddress(null)
      setAddressFormData({
        label: 'Home',
        addressLine1: '',
        addressLine2: '',
        city: '',
        county: '',
        postcode: '',
        country: 'United Kingdom',
        isDefault: user?.addresses.length === 0
      })
    }
    setShowAddressModal(true)
  }

  const closeAddressModal = () => {
    setShowAddressModal(false)
    setEditingAddress(null)
    setError('')
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setUpdating(true)

    try {
      if (editingAddress) {
        await updateAddress(editingAddress._id, addressFormData)
        setSuccess('Address updated successfully!')
      } else {
        await addAddress(addressFormData)
        setSuccess('Address added successfully!')
      }
      closeAddressModal()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return
    
    setError('')
    setSuccess('')
    setUpdating(true)

    try {
      await deleteAddress(addressId)
      setSuccess('Address deleted successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address')
    } finally {
      setUpdating(false)
    }
  }

  const handleSetDefault = async (addressId: string) => {
    setError('')
    setUpdating(true)

    try {
      await setDefaultAddress(addressId)
      setSuccess('Default address updated!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default address')
    } finally {
      setUpdating(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brass"></div>
          <p className="text-ivory mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const tabs = [
    { 
      id: 'overview' as TabType, 
      label: 'Overview', 
      icon: <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    },
    { 
      id: 'account' as TabType, 
      label: 'Account', 
      icon: <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    },
    { 
      id: 'addresses' as TabType, 
      label: 'Addresses', 
      icon: <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    },
    { 
      id: 'orders' as TabType, 
      label: 'Orders', 
      icon: <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    },
  ]

  return (
    <div className="min-h-screen bg-charcoal relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 right-0 w-96 h-96 bg-brass rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.02, 0.05, 0.02],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-olive rounded-full blur-3xl"
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: `linear-gradient(#C5A572 1px, transparent 1px), linear-gradient(90deg, #C5A572 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-brass rounded-full"
            initial={{
              x: Math.random() * 100 + '%',
              y: Math.random() * 100 + '%',
            }}
            animate={{
              y: [null, Math.random() * 100 + '%'],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <LuxuryNavigation />
      
      <main className="pt-24 pb-12 px-4 md:px-6 lg:px-12 xl:px-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <motion.h1 
              className="text-3xl md:text-4xl font-serif font-bold text-ivory mb-2 tracking-wide"
              animate={{ 
                textShadow: [
                  "0 0 20px rgba(197, 165, 114, 0.1)",
                  "0 0 30px rgba(197, 165, 114, 0.2)",
                  "0 0 20px rgba(197, 165, 114, 0.1)",
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              My Account
            </motion.h1>
            <p className="text-brass text-sm tracking-luxury">
              Welcome back, {user.name}
            </p>
          </motion.div>

          {/* Mobile Tabs */}
          <div className="lg:hidden mb-6">
            <div className="bg-charcoal/80 backdrop-blur-xl border border-brass/20 rounded-lg p-1 grid grid-cols-4 gap-1">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-3 rounded-md text-xs font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-brass text-charcoal shadow-lg'
                      : 'text-ivory/60 hover:text-ivory hover:bg-brass/10'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="mb-1">{tab.icon}</div>
                  <div className="hidden sm:block">{tab.label}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Success/Error Messages */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto mb-6 bg-green-900/20 border border-green-500/50 rounded-md p-4"
              >
                <p className="text-green-400 text-sm text-center">{success}</p>
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto mb-6 bg-red-900/20 border border-red-500/50 rounded-md p-4"
              >
                <p className="text-red-400 text-sm text-center">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shopping Overview Cards - Always visible on desktop, tabbed on mobile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className={`mb-6 ${activeTab !== 'overview' ? 'hidden lg:block' : ''}`}
          >
            <h2 className="text-xl md:text-2xl font-serif font-bold text-ivory mb-4">Shopping Overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {/* Total Orders Card */}
              <motion.div 
                whileHover={{ y: -4, borderColor: 'rgba(197, 165, 114, 0.4)' }}
                className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-4 md:p-6 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 md:p-3 bg-brass/20 rounded-lg">
                    <svg className="w-4 h-4 md:w-6 md:h-6 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                </div>
                <p className="text-ivory/60 text-xs md:text-sm mb-1">Total Orders</p>
                <motion.p 
                  className="text-2xl md:text-3xl font-bold text-ivory"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {statsLoading ? '...' : orderStats?.totalOrders || 0}
                </motion.p>
              </motion.div>

              {/* Total Spent Card */}
              <motion.div 
                whileHover={{ y: -4, borderColor: 'rgba(197, 165, 114, 0.4)' }}
                className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-4 md:p-6 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 md:p-3 bg-brass/20 rounded-lg">
                    <svg className="w-4 h-4 md:w-6 md:h-6 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-ivory/60 text-xs md:text-sm mb-1">Total Spent</p>
                <motion.p 
                  className="text-2xl md:text-3xl font-bold text-brass"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                >
                  {statsLoading ? '...' : formatCurrency(orderStats?.totalSpent || 0)}
                </motion.p>
              </motion.div>

              {/* Active Cart Value Card */}
              <motion.div 
                whileHover={{ y: -4, borderColor: 'rgba(197, 165, 114, 0.4)' }}
                className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-4 md:p-6 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 md:p-3 bg-brass/20 rounded-lg">
                    <svg className="w-4 h-4 md:w-6 md:h-6 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-ivory/60 text-xs md:text-sm mb-1">Active Cart</p>
                <p className="text-2xl md:text-3xl font-bold text-ivory">
                  {formatCurrency(cart?.subtotal || 0)}
                </p>
                <p className="text-xs text-ivory/50 mt-1">{cart?.items.length || 0} items</p>
              </motion.div>

              {/* Saved Items Card */}
              <motion.div 
                whileHover={{ y: -4, borderColor: 'rgba(197, 165, 114, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-4 md:p-6 cursor-pointer transition-all" 
                onClick={() => router.push('/favorites')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 md:p-3 bg-brass/20 rounded-lg">
                    <svg className="w-4 h-4 md:w-6 md:h-6 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-ivory/60 text-xs md:text-sm mb-1">Saved Items</p>
                <p className="text-2xl md:text-3xl font-bold text-ivory">{wishlistCount}</p>
                <p className="text-xs text-brass/70 mt-1">View all →</p>
              </motion.div>
            </div>
          </motion.div>

          {/* Recent Orders Section */}
          {orderStats && orderStats.recentOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className={`mb-6 ${activeTab !== 'overview' ? 'hidden lg:block' : ''}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-serif font-bold text-ivory">Recent Orders</h2>
                <button
                  onClick={() => router.push('/orders')}
                  className="text-brass hover:text-olive transition-colors text-xs md:text-sm font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {orderStats.recentOrders.slice(0, 4).map((order, index) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4, borderColor: 'rgba(197, 165, 114, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/orders/${order._id}`)}
                    className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-4 md:p-6 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-ivory/60 text-xs">Order #{order.orderNumber}</p>
                        <p className="text-ivory text-sm mt-1">
                          {new Date(order.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-ivory/60 text-sm">{order.items.length} items</p>
                      <p className="text-brass font-bold">{formatCurrency(order.pricing.total)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Main Content - 3 columns */}
            <div className="lg:col-span-3 space-y-6 md:space-y-8">
              {/* Account Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className={`bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6 md:p-8 shadow-2xl ${
                  activeTab !== 'account' ? 'hidden lg:block' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-ivory">Account Details</h2>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-4 py-2 text-sm text-brass border border-brass/50 rounded-md hover:bg-brass/10 transition-all duration-300"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-ivory text-sm font-medium mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass transition-colors"
                          disabled={updating}
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-ivory text-sm font-medium mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass transition-colors"
                          disabled={updating}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="phone" className="block text-ivory text-sm font-medium mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass transition-colors"
                          placeholder="Optional"
                          disabled={updating}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        disabled={updating}
                        className="flex-1 px-6 py-3 bg-brass text-charcoal font-medium tracking-wide rounded-md hover:bg-olive transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updating ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingProfile(false)
                          setError('')
                          if (user) {
                            setProfileData({
                              name: user.name || '',
                              email: user.email || '',
                              phone: user.phone || '',
                            })
                          }
                        }}
                        disabled={updating}
                        className="px-6 py-3 text-ivory border border-brass/50 rounded-md hover:bg-brass/10 transition-all duration-300 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-brass/70 text-sm">Name</span>
                      <span className="text-ivory text-lg">{user.name}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-brass/70 text-sm">Email</span>
                      <span className="text-ivory text-lg">{user.email}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-brass/70 text-sm">Phone</span>
                      <span className="text-ivory text-lg">{user.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-brass/70 text-sm">Role</span>
                      <span className="px-3 py-1 bg-brass/20 text-brass text-xs font-medium rounded-full uppercase w-fit">
                        {user.role}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Addresses Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className={`bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6 md:p-8 shadow-2xl ${
                  activeTab !== 'addresses' ? 'hidden lg:block' : ''
                }`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-ivory">Delivery Addresses</h2>
                  <button
                    onClick={() => openAddressModal()}
                    className="px-4 py-2 bg-brass text-charcoal text-sm font-medium rounded-md hover:bg-olive transition-all duration-300"
                  >
                    + Add Address
                  </button>
                </div>

                {user.addresses && user.addresses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {user.addresses.map((address, index) => (
                      <motion.div
                        key={address._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className={`p-4 md:p-6 rounded-lg border ${
                          address.isDefault
                            ? 'border-brass bg-brass/5'
                            : 'border-brass/20 bg-charcoal/50'
                        } relative transition-all`}
                      >
                        {address.isDefault && (
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-1 bg-brass text-charcoal text-xs font-medium rounded">
                              Default
                            </span>
                          </div>
                        )}
                        
                        <h3 className="text-base md:text-lg font-medium text-brass mb-3">{address.label}</h3>
                        <div className="text-ivory/80 text-xs md:text-sm space-y-1 mb-4">
                          <p>{address.addressLine1}</p>
                          {address.addressLine2 && <p>{address.addressLine2}</p>}
                          <p>{address.city}</p>
                          {address.county && <p>{address.county}</p>}
                          <p>{address.postcode}</p>
                          <p>{address.country}</p>
                        </div>
                        
                        <div className="flex gap-2 flex-wrap">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openAddressModal(address)}
                            className="px-3 py-1.5 text-xs text-brass border border-brass/50 rounded hover:bg-brass/10 transition-all"
                          >
                            Edit
                          </motion.button>
                          {!address.isDefault && (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSetDefault(address._id)}
                              disabled={updating}
                              className="px-3 py-1.5 text-xs text-ivory border border-ivory/30 rounded hover:bg-ivory/10 transition-all disabled:opacity-50"
                            >
                              Set Default
                            </motion.button>
                          )}
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteAddress(address._id)}
                            disabled={updating}
                            className="px-3 py-1.5 text-xs text-red-400 border border-red-400/50 rounded hover:bg-red-900/20 transition-all disabled:opacity-50"
                          >
                            Delete
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-brass/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-ivory/70 text-sm">No addresses added yet</p>
                    <p className="text-ivory/50 text-xs mt-2">Add your first delivery address to get started</p>
                  </div>
                )}
              </motion.div>

              {/* Order History Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className={`bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6 md:p-8 shadow-2xl ${
                  activeTab !== 'orders' ? 'hidden lg:block' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-ivory">Order History</h2>
                  <button
                    onClick={() => router.push('/orders')}
                    className="text-brass hover:text-olive transition-colors text-xs md:text-sm font-medium"
                  >
                    View All →
                  </button>
                </div>
                {orderStats && orderStats.recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {orderStats.recentOrders.slice(0, 3).map((order, index) => (
                      <motion.div
                        key={order._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 4, borderColor: 'rgba(197, 165, 114, 0.4)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push(`/orders/${order._id}`)}
                        className="bg-charcoal/50 border border-brass/20 rounded-lg p-4 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-ivory/60 text-xs">Order #{order.orderNumber}</p>
                            <p className="text-ivory text-sm mt-1">
                              {new Date(order.createdAt).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          <StatusBadge status={order.status} size="sm" />
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-brass/10">
                          <p className="text-ivory/60 text-xs">{order.items.length} items</p>
                          <p className="text-brass font-bold text-sm">{formatCurrency(order.pricing.total)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <motion.svg 
                      className="w-16 h-16 text-brass/50 mx-auto mb-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </motion.svg>
                    <p className="text-ivory/70 text-sm">No orders yet</p>
                    <p className="text-ivory/50 text-xs mt-2">Your order history will appear here</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/products')}
                      className="mt-4 px-6 py-2 bg-brass text-charcoal text-sm font-medium rounded-md hover:bg-olive transition-all"
                    >
                      Start Shopping
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar - 1 column - Hidden on mobile */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="hidden lg:flex flex-col space-y-6"
            >
              {/* Quick Actions */}
              <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6 shadow-2xl">
                <h3 className="text-lg font-serif font-bold text-ivory mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/products')}
                    className="w-full px-4 py-3 text-left text-ivory hover:text-brass border border-brass/30 rounded-md hover:bg-brass/10 transition-all duration-300 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Browse Products
                  </motion.button>
                  <motion.button
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/cart')}
                    className="w-full px-4 py-3 text-left text-ivory hover:text-brass border border-brass/30 rounded-md hover:bg-brass/10 transition-all duration-300 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    View Cart
                  </motion.button>
                  {user.role === 'admin' && (
                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push('/admin/products')}
                      className="w-full px-4 py-3 text-left text-ivory hover:text-brass border border-brass/30 rounded-md hover:bg-brass/10 transition-all duration-300 flex items-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Admin Panel
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Logout Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full px-6 py-3 bg-brass text-charcoal font-medium tracking-wide rounded-md hover:bg-olive transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </motion.button>
            </motion.div>

            {/* Mobile Logout Button - Shown on all tabs */}
            <div className="lg:hidden">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="w-full px-6 py-3 bg-brass text-charcoal font-medium tracking-wide rounded-md hover:bg-olive transition-all duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </main>

      {/* Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
            onClick={closeAddressModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-charcoal border border-brass/20 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-serif font-bold text-ivory mb-6">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>

              <form onSubmit={handleAddressSubmit} className="space-y-6">
                <div>
                  <label className="block text-ivory text-sm font-medium mb-2">
                    Address Label <span className="text-brass">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressFormData.label}
                    onChange={(e) => setAddressFormData({ ...addressFormData, label: e.target.value })}
                    className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                    placeholder="e.g., Home, Work, Office"
                    required
                    disabled={updating}
                  />
                </div>

                <div>
                  <label className="block text-ivory text-sm font-medium mb-2">
                    Address Line 1 <span className="text-brass">*</span>
                  </label>
                  <input
                    type="text"
                    value={addressFormData.addressLine1}
                    onChange={(e) => setAddressFormData({ ...addressFormData, addressLine1: e.target.value })}
                    className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                    placeholder="House number and street name"
                    required
                    disabled={updating}
                  />
                </div>

                <div>
                  <label className="block text-ivory text-sm font-medium mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={addressFormData.addressLine2}
                    onChange={(e) => setAddressFormData({ ...addressFormData, addressLine2: e.target.value })}
                    className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                    placeholder="Apartment, suite, etc. (optional)"
                    disabled={updating}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-ivory text-sm font-medium mb-2">
                      City <span className="text-brass">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressFormData.city}
                      onChange={(e) => setAddressFormData({ ...addressFormData, city: e.target.value })}
                      className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                      placeholder="e.g., London"
                      required
                      disabled={updating}
                    />
                  </div>

                  <div>
                    <label className="block text-ivory text-sm font-medium mb-2">
                      County
                    </label>
                    <input
                      type="text"
                      value={addressFormData.county}
                      onChange={(e) => setAddressFormData({ ...addressFormData, county: e.target.value })}
                      className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                      placeholder="e.g., Greater London"
                      disabled={updating}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-ivory text-sm font-medium mb-2">
                      Postcode <span className="text-brass">*</span>
                    </label>
                    <input
                      type="text"
                      value={addressFormData.postcode}
                      onChange={(e) => setAddressFormData({ ...addressFormData, postcode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass uppercase"
                      placeholder="e.g., SW1A 1AA"
                      required
                      disabled={updating}
                    />
                  </div>

                  <div>
                    <label className="block text-ivory text-sm font-medium mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={addressFormData.country}
                      onChange={(e) => setAddressFormData({ ...addressFormData, country: e.target.value })}
                      className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                      disabled={updating}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={addressFormData.isDefault}
                    onChange={(e) => setAddressFormData({ ...addressFormData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-brass bg-charcoal border-brass/30 rounded focus:ring-brass"
                    disabled={updating}
                  />
                  <label htmlFor="isDefault" className="text-ivory text-sm">
                    Set as default delivery address
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 px-6 py-3 bg-brass text-charcoal font-medium tracking-wide rounded-md hover:bg-olive transition-all duration-300 disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : editingAddress ? 'Update Address' : 'Add Address'}
                  </button>
                  <button
                    type="button"
                    onClick={closeAddressModal}
                    disabled={updating}
                    className="px-6 py-3 text-ivory border border-brass/50 rounded-md hover:bg-brass/10 transition-all duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LuxuryFooter />
    </div>
  )
}
