'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useToast } from '@/contexts/ToastContext'
import { ordersApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import OrderSummary from '@/components/OrderSummary'
import OfferCodeInput from '@/components/OfferCodeInput'
import type { Address } from '@/types'

export default function CheckoutPage() {
  const router = useRouter()
  const { user, isAuthenticated, token, loading: authLoading, addAddress, updateAddress } = useAuth()
  const { cart, sessionID, loading: cartLoading } = useCart()
  const toast = useToast()
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [orderNotes, setOrderNotes] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Guest checkout state
  const [isGuestCheckout, setIsGuestCheckout] = useState(false)
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [guestAddress, setGuestAddress] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    county: '',
    postcode: '',
    country: 'United Kingdom'
  })

  // Address modal state
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
  const [updatingAddress, setUpdatingAddress] = useState(false)

  // Determine if user is checking out as guest
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setIsGuestCheckout(true)
    }
  }, [authLoading, isAuthenticated])

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
  }

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingAddress(true)

    try {
      if (editingAddress) {
        await updateAddress(editingAddress._id, {
          label: addressFormData.label,
          addressLine1: addressFormData.addressLine1,
          addressLine2: addressFormData.addressLine2 || undefined,
          city: addressFormData.city,
          county: addressFormData.county || undefined,
          postcode: addressFormData.postcode,
          country: addressFormData.country,
          isDefault: addressFormData.isDefault
        })
        toast.success('Address updated successfully!')
      } else {
        await addAddress({
          label: addressFormData.label,
          addressLine1: addressFormData.addressLine1,
          addressLine2: addressFormData.addressLine2 || undefined,
          city: addressFormData.city,
          county: addressFormData.county || undefined,
          postcode: addressFormData.postcode,
          country: addressFormData.country,
          isDefault: addressFormData.isDefault
        })
        toast.success('Address added successfully!')
        // If this is the first address or it's set as default, select it
        if (addressFormData.isDefault || !user || user.addresses.length === 0) {
          // The address will be selected automatically via useEffect when user updates
        }
      }
      closeAddressModal()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save address')
    } finally {
      setUpdatingAddress(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    if (!termsAccepted) {
      toast.warning('Please confirm that you have read and agree to the Terms & Conditions')
      return
    }

    try {
      setProcessing(true)

      if (isGuestCheckout) {
        // GUEST CHECKOUT FLOW
        // Validate guest info
        if (!guestInfo.name.trim() || !guestInfo.email.trim() || !guestInfo.phone.trim()) {
          toast.error('Please provide your name, email address, and phone number')
          setProcessing(false)
          return
        }

        // Validate email format
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
        if (!emailRegex.test(guestInfo.email)) {
          toast.error('Please provide a valid email address')
          setProcessing(false)
          return
        }

        // Validate guest address
        if (!guestAddress.addressLine1.trim() || !guestAddress.city.trim() || !guestAddress.postcode.trim()) {
          toast.error('Please provide complete delivery address (Address Line 1, City, and Postcode are required)')
          setProcessing(false)
          return
        }

        const response = await ordersApi.createGuest({
          sessionID,
          customerInfo: {
            name: guestInfo.name.trim(),
            email: guestInfo.email.trim(),
            phone: guestInfo.phone.trim()
          },
          deliveryAddress: {
            addressLine1: guestAddress.addressLine1.trim(),
            addressLine2: guestAddress.addressLine2.trim() || undefined,
            city: guestAddress.city.trim(),
            county: guestAddress.county.trim() || undefined,
            postcode: guestAddress.postcode.trim(),
            country: guestAddress.country.trim() || 'United Kingdom'
          },
          orderNotes: orderNotes.trim() || undefined
        })

        if (response.success) {
          setOrderNumber(response.order.orderNumber)
          setShowSuccess(true)
          toast.success('Order placed successfully!')
          // Save email to localStorage for order tracking
          if (typeof window !== 'undefined') {
            localStorage.setItem('guest_order_email', guestInfo.email)
          }
        } else {
          toast.error(response.message || 'Failed to place order. Please try again.')
        }
      } else {
        // AUTHENTICATED USER FLOW
        if (!selectedAddressId) {
          toast.warning('Please select a delivery address')
          setProcessing(false)
          return
        }

        if (!token) {
          toast.error('Please login to continue')
          router.push('/login?returnUrl=/checkout')
          setProcessing(false)
          return
        }

        const response = await ordersApi.create({
          sessionID,
          deliveryAddressId: selectedAddressId,
          orderNotes: orderNotes.trim() || undefined
        }, token)

        if (response.success) {
          setOrderNumber(response.order.orderNumber)
          setShowSuccess(true)
          toast.success('Order placed successfully!')
        } else {
          toast.error(response.message || 'Failed to place order. Please try again.')
        }
      }
    } catch (error: any) {
      console.error('Failed to place order:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to place order. Please try again.'
      toast.error(errorMessage)

      // If error is about missing address for authenticated users, redirect to profile
      if (!isGuestCheckout && (errorMessage.includes('address') || errorMessage.includes('Address'))) {
        setTimeout(() => {
          router.push('/profile')
        }, 3000)
      }
    } finally {
      setProcessing(false)
    }
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-charcoal">
        <LuxuryNavigation />
        <div className="pt-32 flex items-center justify-center h-96">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brass"></div>
        </div>
      </div>
    )
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
              {/* Guest Info Form (only shown for guest checkout) */}
              {isGuestCheckout && (
                <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-serif font-bold text-ivory">Contact Information</h2>
                    <Link
                      href="/login?returnUrl=/checkout"
                      className="text-sm text-brass hover:text-olive underline transition-colors"
                    >
                      Already have an account? Sign in
                    </Link>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-ivory text-sm font-medium mb-2">
                        Full Name <span className="text-brass">*</span>
                      </label>
                      <input
                        type="text"
                        value={guestInfo.name}
                        onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                        className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-ivory text-sm font-medium mb-2">
                        Email Address <span className="text-brass">*</span>
                      </label>
                      <input
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                        className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                        placeholder="john@example.com"
                        required
                      />
                      <p className="mt-1 text-xs text-ivory/50">We&apos;ll send your order confirmation to this email</p>
                    </div>

                    <div>
                      <label className="block text-ivory text-sm font-medium mb-2">
                        Phone Number <span className="text-brass">*</span>
                      </label>
                      <input
                        type="tel"
                        value={guestInfo.phone}
                        onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                        className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                        placeholder="+44 1234 567890"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Address */}
              <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-6">
                <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
                  <h2 className="text-2xl font-serif font-bold text-ivory">Delivery Address</h2>
                  {!isGuestCheckout && (
                    <div className="flex gap-2">
                      {user && user.addresses.length > 0 && (
                        <button
                          onClick={() => {
                            const addressToEdit = user.addresses.find(addr => addr._id === selectedAddressId)
                            if (addressToEdit) {
                              openAddressModal(addressToEdit)
                            }
                          }}
                          className="px-3 py-1.5 text-xs bg-ivory/10 text-ivory rounded border border-ivory/30 hover:bg-ivory/20 transition-colors"
                        >
                          Change Address
                        </button>
                      )}
                      <button
                        onClick={() => openAddressModal()}
                        className="px-3 py-1.5 text-xs bg-brass/20 text-brass rounded border border-brass/30 hover:bg-brass/30 transition-colors"
                      >
                        Add New
                      </button>
                    </div>
                  )}
                </div>

                {isGuestCheckout ? (
                  // Guest Address Form
                  <div className="space-y-4">
                    <div>
                      <label className="block text-ivory text-sm font-medium mb-2">
                        Address Line 1 <span className="text-brass">*</span>
                      </label>
                      <input
                        type="text"
                        value={guestAddress.addressLine1}
                        onChange={(e) => setGuestAddress({ ...guestAddress, addressLine1: e.target.value })}
                        className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                        placeholder="123 Main Street"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-ivory text-sm font-medium mb-2">
                        Address Line 2 (Optional)
                      </label>
                      <input
                        type="text"
                        value={guestAddress.addressLine2}
                        onChange={(e) => setGuestAddress({ ...guestAddress, addressLine2: e.target.value })}
                        className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                        placeholder="Apartment, suite, etc."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-ivory text-sm font-medium mb-2">
                          City <span className="text-brass">*</span>
                        </label>
                        <input
                          type="text"
                          value={guestAddress.city}
                          onChange={(e) => setGuestAddress({ ...guestAddress, city: e.target.value })}
                          className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                          placeholder="London"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-ivory text-sm font-medium mb-2">
                          County (Optional)
                        </label>
                        <input
                          type="text"
                          value={guestAddress.county}
                          onChange={(e) => setGuestAddress({ ...guestAddress, county: e.target.value })}
                          className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                          placeholder="Greater London"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-ivory text-sm font-medium mb-2">
                          Postcode <span className="text-brass">*</span>
                        </label>
                        <input
                          type="text"
                          value={guestAddress.postcode}
                          onChange={(e) => setGuestAddress({ ...guestAddress, postcode: e.target.value.toUpperCase() })}
                          className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass uppercase"
                          placeholder="SW1A 1AA"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-ivory text-sm font-medium mb-2">
                          Country
                        </label>
                        <input
                          type="text"
                          value={guestAddress.country}
                          onChange={(e) => setGuestAddress({ ...guestAddress, country: e.target.value })}
                          className="w-full px-4 py-3 bg-charcoal border border-brass/30 text-ivory rounded-md focus:outline-none focus:border-brass"
                        />
                      </div>
                    </div>
                  </div>
                ) : user && user.addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-ivory/70 mb-4">No delivery addresses found</p>
                    <button
                      onClick={() => openAddressModal()}
                      className="px-6 py-3 bg-brass text-charcoal font-medium rounded-md hover:bg-olive transition-all duration-300"
                    >
                      Add Address
                    </button>
                  </div>
                ) : user && user.addresses ? (
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
                ) : null}
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
                      Payment will be collected after order confirmation by Glister Luxury. 
                      You will receive an email with payment instructions and details shortly after placing your order.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1 space-y-6">
              <OrderSummary data={cart} type="cart" />
              
              {/* Discount Code Input */}
              {sessionID && (
                <OfferCodeInput
                  cart={cart}
                  sessionID={sessionID}
                  userId={user?.id}
                  onDiscountApplied={() => window.location.reload()}
                  showError={true}
                />
              )}
              
              {/* Terms & Conditions Checkbox */}
              <div className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 text-brass bg-charcoal border-brass/30 rounded focus:ring-brass focus:ring-2 cursor-pointer"
                  />
                  <label htmlFor="termsAccepted" className="text-ivory/70 text-sm leading-relaxed cursor-pointer flex-1">
                    I confirm that I have read and agree to the{' '}
                    <Link href="/terms" className="text-brass hover:text-olive underline transition-colors" target="_blank" rel="noopener noreferrer">
                      Terms & Conditions
                    </Link>
                  </label>
                </div>
              </div>
              
              <button
                onClick={handlePlaceOrder}
                disabled={processing || (!isGuestCheckout && !selectedAddressId) || !termsAccepted}
                className="w-full mt-6 px-6 py-4 bg-brass text-charcoal font-bold text-lg rounded-md hover:bg-olive transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Place Order'}
              </button>
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

            {isGuestCheckout ? (
              <>
                <div className="bg-brass/10 border border-brass/30 rounded-lg p-4 mb-6 text-left">
                  <p className="text-ivory/80 text-sm mb-3">
                    <strong className="text-brass">Important:</strong> Please save this order number and the email address you provided.
                  </p>
                  <p className="text-ivory/70 text-xs mb-2">
                    • Order confirmation sent to: <span className="text-brass">{guestInfo.email}</span>
                  </p>
                  <p className="text-ivory/70 text-xs">
                    • Track your order at any time using your order number and email
                  </p>
                </div>
                <p className="text-ivory/60 text-sm mb-6">
                  We&apos;ll send you an email with payment instructions shortly.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => router.push(`/orders/track`)}
                    className="w-full px-6 py-3 bg-brass text-charcoal font-medium rounded-md hover:bg-olive transition-all duration-300"
                  >
                    Track My Order
                  </button>
                  <button
                    onClick={() => router.push('/products')}
                    className="w-full px-6 py-3 border border-brass/50 text-ivory rounded-md hover:bg-brass/10 transition-all duration-300"
                  >
                    Continue Shopping
                  </button>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </motion.div>
        </div>
      )}

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
                    disabled={updatingAddress}
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
                    disabled={updatingAddress}
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
                    disabled={updatingAddress}
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
                      disabled={updatingAddress}
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
                      disabled={updatingAddress}
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
                      disabled={updatingAddress}
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
                      disabled={updatingAddress}
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
                    disabled={updatingAddress}
                  />
                  <label htmlFor="isDefault" className="text-ivory text-sm">
                    Set as default delivery address
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={updatingAddress}
                    className="flex-1 px-6 py-3 bg-brass text-charcoal font-medium tracking-wide rounded-md hover:bg-olive transition-all duration-300 disabled:opacity-50"
                  >
                    {updatingAddress ? 'Saving...' : editingAddress ? 'Update Address' : 'Add Address'}
                  </button>
                  <button
                    type="button"
                    onClick={closeAddressModal}
                    disabled={updatingAddress}
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

