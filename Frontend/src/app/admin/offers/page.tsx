'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { offersApi } from '@/lib/api'
import { formatCurrency, toNumber } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { Offer } from '@/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function OffersPage() {
  const { token } = useAuth()
  const toast = useToast()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    minOrderAmount: '',
    maxUses: '',
    validFrom: '',
    validTo: '',
    isActive: true,
    applicableTo: 'all' as 'all' | 'new_users',
    autoApply: false,
    priority: 0,
    displayName: ''
  })

  useEffect(() => {
    if (token) {
      fetchOffers()
    }
  }, [token])

  const fetchOffers = async () => {
    try {
      setLoading(true)
      const data = await offersApi.list(token!, false)
      setOffers(data)
      if (data.length > 0 && !selectedOffer) {
        setSelectedOffer(data[0])
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error)
      toast.error('Failed to load offers')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    // Client-side filtering for now
    if (!searchQuery.trim()) {
      fetchOffers()
      return
    }
    const filtered = offers.filter(offer =>
      offer.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setOffers(filtered)
  }

  const openCreateModal = () => {
    setEditingOffer(null)
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '',
      maxUses: '',
      validFrom: new Date().toISOString().split('T')[0],
      validTo: '',
      isActive: true,
      applicableTo: 'all',
      autoApply: false,
      priority: 0,
      displayName: ''
    })
    setIsModalOpen(true)
  }

  const openEditModal = (offer: Offer) => {
    setEditingOffer(offer)
    setFormData({
      code: offer.code || '',
      description: offer.description,
      discountType: offer.discountType,
      discountValue: toNumber(offer.discountValue).toString(),
      minOrderAmount: toNumber(offer.minOrderAmount).toString(),
      maxUses: offer.maxUses?.toString() || '',
      validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().split('T')[0] : '',
      validTo: offer.validTo ? new Date(offer.validTo).toISOString().split('T')[0] : '',
      isActive: offer.isActive,
      applicableTo: offer.applicableTo,
      autoApply: offer.autoApply || false,
      priority: offer.priority || 0,
      displayName: offer.displayName || ''
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData: any = {
        ...formData,
        code: formData.autoApply && !formData.code.trim() ? undefined : formData.code,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        validFrom: formData.validFrom || undefined,
        validTo: formData.validTo || undefined,
        priority: formData.autoApply ? parseInt(formData.priority.toString()) : undefined,
        displayName: formData.autoApply && formData.displayName.trim() ? formData.displayName : undefined
      }

      if (editingOffer) {
        await offersApi.update(editingOffer._id, submitData, token!)
        toast.success('Offer updated successfully')
      } else {
        await offersApi.create(submitData, token!)
        toast.success('Offer created successfully')
      }
      setIsModalOpen(false)
      fetchOffers()
    } catch (error: any) {
      console.error('Failed to save offer:', error)
      toast.error(error?.response?.data?.message || 'Failed to save offer')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return
    try {
      await offersApi.delete(id, token!)
      toast.success('Offer deleted successfully')
      if (selectedOffer?._id === id) {
        setSelectedOffer(null)
      }
      fetchOffers()
    } catch (error) {
      console.error('Failed to delete offer:', error)
      toast.error('Failed to delete offer')
    }
  }

  const toggleActive = async (offer: Offer) => {
    try {
      await offersApi.update(offer._id, { isActive: !offer.isActive }, token!)
      toast.success(`Offer ${!offer.isActive ? 'activated' : 'deactivated'}`)
      fetchOffers()
    } catch (error) {
      console.error('Failed to toggle offer:', error)
      toast.error('Failed to update offer')
    }
  }

  const filteredOffers = filterActive !== null 
    ? offers.filter(o => o.isActive === filterActive)
    : offers

  if (loading && offers.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-brass border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-charcoal/60 text-xs">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-90px)] md:h-[calc(100vh-90px)] flex flex-col gap-2 overflow-hidden">
      {/* Compact Header with Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-lg px-3 py-2 shadow border border-brass/20 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <h1 className="text-base sm:text-lg font-serif font-bold text-charcoal">Offers & Discounts</h1>
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="flex items-center gap-1 bg-brass/10 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-brass" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-charcoal">{offers.length} Offers</span>
            </span>
            <span className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-charcoal">{offers.filter(f => f.isActive).length} Active</span>
            </span>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="text-[10px] sm:text-xs bg-brass text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded hover:bg-brass/90 transition-colors font-semibold"
        >
          + Add Offer
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 bg-white rounded-lg px-3 py-2 shadow border border-brass/20">
        <input
          type="text"
          placeholder="Search offers by code or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-2 py-1 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
        />
        <button
          onClick={handleSearch}
          className="text-[10px] bg-charcoal text-ivory px-3 py-1 rounded hover:bg-charcoal/90 transition-colors font-semibold"
        >
          Search
        </button>
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); fetchOffers(); }}
            className="text-[10px] bg-charcoal/10 text-charcoal px-3 py-1 rounded hover:bg-charcoal/20 transition-colors font-semibold"
          >
            Clear
          </button>
        )}
        <select
          value={filterActive === null ? 'all' : filterActive ? 'active' : 'inactive'}
          onChange={(e) => {
            const value = e.target.value
            setFilterActive(value === 'all' ? null : value === 'active')
          }}
          className="text-[10px] px-2 py-1 border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
        >
          <option value="all">All</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Split Pane Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 overflow-hidden min-h-0">
        {/* Left Panel - Offers List */}
        <div className="w-full md:w-2/5 h-[50vh] md:h-auto bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xs font-semibold">OFFERS LIST</h2>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredOffers.length === 0 ? (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No offers yet</p>
                  <button
                    onClick={openCreateModal}
                    className="text-brass hover:underline text-xs mt-2"
                  >
                    Add first offer
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredOffers.map((offer) => (
                  <div
                    key={offer._id}
                    className={`group p-2 rounded hover:bg-brass/10 transition-all border cursor-pointer ${
                      selectedOffer?._id === offer._id ? 'bg-brass/10 border-brass/30' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedOffer(offer)}
                  >
                    <div className="flex items-start gap-2">
                      {/* Code Badge */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 text-[9px] font-bold text-white bg-brass rounded">
                          {offer.code || '(auto)'}
                        </span>
                        {offer.autoApply && (
                          <span className="inline-flex items-center justify-center w-4 h-4 bg-brass/20 rounded-full" title="Auto-Apply Enabled">
                            <svg className="w-2.5 h-2.5 text-brass" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-charcoal text-xs truncate flex items-center gap-1">
                          {offer.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-charcoal/60">
                            {offer.discountType === 'percentage'
                              ? `${toNumber(offer.discountValue)}%`
                              : formatCurrency(toNumber(offer.discountValue))}
                          </span>
                          <span className="text-[10px] text-charcoal/40">•</span>
                          <span className="text-[10px] text-charcoal/60">
                            {offer.usedCount} / {offer.maxUses || '∞'}
                          </span>
                          {offer.autoApply && (
                            <>
                              <span className="text-[10px] text-charcoal/40">•</span>
                              <span className="text-[10px] text-brass font-medium">P:{offer.priority || 0}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                          offer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {offer.isActive ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Offer Details */}
        <div className="w-full md:w-3/5 h-[50vh] md:h-auto bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xs font-semibold">OFFER DETAILS</h2>
            {selectedOffer && (
              <div className="flex gap-1">
                <button
                  onClick={() => toggleActive(selectedOffer)}
                  className="p-1 hover:bg-brass/20 rounded transition-colors"
                  title={selectedOffer.isActive ? 'Set Inactive' : 'Set Active'}
                >
                  <svg className="w-3 h-3 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => openEditModal(selectedOffer)}
                  className="p-1 hover:bg-brass/20 rounded transition-colors"
                  title="Edit"
                >
                  <svg className="w-3 h-3 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(selectedOffer._id)}
                  className="p-1 hover:bg-red-500/20 rounded transition-colors"
                  title="Delete"
                >
                  <svg className="w-3 h-3 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-4">
            {selectedOffer ? (
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Status</label>
                  <div className="mt-1 flex gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                      selectedOffer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedOffer.isActive ? 'Active (Available to Customers)' : 'Inactive (Hidden)'}
                    </span>
                    {selectedOffer.autoApply && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-brass/20 text-brass border border-brass/30">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Auto-Apply
                      </span>
                    )}
                  </div>
                </div>

                {/* Auto-Apply Details */}
                {selectedOffer.autoApply && (
                  <div className="bg-brass/5 border border-brass/20 rounded-lg p-3">
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide flex items-center gap-1">
                      <svg className="w-3 h-3 text-brass" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Auto-Apply Configuration
                    </label>
                    <div className="mt-2 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">Display Name:</span>
                        <span className="font-medium text-charcoal">{selectedOffer.displayName || 'Using description'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">Priority:</span>
                        <span className="font-medium text-charcoal">{selectedOffer.priority || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">Auto-Applied:</span>
                        <span className="font-medium text-brass">{selectedOffer.autoApplyCount || 0} times</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">Manual Applied:</span>
                        <span className="font-medium text-charcoal">{selectedOffer.manualApplyCount || 0} times</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Code */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Code</label>
                  <p className="text-sm font-mono font-bold text-brass mt-1">{selectedOffer.code || '(Auto-generated)'}</p>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Description</label>
                  <p className="text-sm text-charcoal mt-1 leading-relaxed">{selectedOffer.description}</p>
                </div>

                {/* Discount */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Discount</label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-bold text-brass">
                      {selectedOffer.discountType === 'percentage' 
                        ? `${toNumber(selectedOffer.discountValue)}%`
                        : formatCurrency(toNumber(selectedOffer.discountValue))}
                    </span>
                    <span className="text-xs text-charcoal/60 capitalize">({selectedOffer.discountType})</span>
                  </div>
                </div>

                {/* Min Order Amount */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Minimum Order Amount</label>
                  <p className="text-sm text-charcoal mt-1">{formatCurrency(toNumber(selectedOffer.minOrderAmount))}</p>
                </div>

                {/* Usage */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Usage</label>
                  <p className="text-sm text-charcoal mt-1">
                    {selectedOffer.usedCount} / {selectedOffer.maxUses || 'Unlimited'}
                  </p>
                </div>

                {/* Valid Dates */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Valid Period</label>
                  <div className="mt-1 text-xs text-charcoal">
                    <p>From: {new Date(selectedOffer.validFrom).toLocaleDateString()}</p>
                    {selectedOffer.validTo && (
                      <p>To: {new Date(selectedOffer.validTo).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                {/* Applicable To */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Applicable To</label>
                  <p className="text-sm text-charcoal mt-1 capitalize">
                    {selectedOffer.applicableTo === 'new_users' ? 'New Users Only' : 'All Customers'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Select an offer to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOffer ? 'Edit Offer' : 'New Offer'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                label={`Code ${formData.autoApply ? '(optional)' : '*'}`}
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required={!formData.autoApply}
                placeholder={formData.autoApply ? "Auto-generated if empty" : "WELCOME"}
              />
              {formData.autoApply && (
                <p className="text-[9px] text-charcoal/50 mt-0.5">Code is optional for auto-apply offers</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Discount Type *</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
                required
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
          </div>

          <Input
            label="Description *"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder="5% discount for new users"
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label={`Discount Value * (${formData.discountType === 'percentage' ? '%' : '£'})`}
              type="number"
              step="0.01"
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
              required
              placeholder={formData.discountType === 'percentage' ? '5' : '10.00'}
            />
            <Input
              label="Min Order Amount (£)"
              type="number"
              step="0.01"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Max Uses"
              type="number"
              value={formData.maxUses}
              onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
              placeholder="Unlimited if empty"
            />
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Applicable To</label>
              <select
                value={formData.applicableTo}
                onChange={(e) => setFormData({ ...formData, applicableTo: e.target.value as 'all' | 'new_users' })}
                className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
              >
                <option value="all">All Customers</option>
                <option value="new_users">New Users Only</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Valid From"
              type="date"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
            />
            <Input
              label="Valid To"
              type="date"
              value={formData.validTo}
              onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-3 h-3 text-brass border-brass/30 rounded focus:ring-brass focus:ring-1"
            />
            <label htmlFor="isActive" className="text-xs font-medium text-charcoal">
              Active (visible to customers)
            </label>
          </div>

          {/* Auto-Apply Section */}
          <div className="border border-brass/30 rounded-lg p-3 bg-brass/5 space-y-3">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="autoApply"
                checked={formData.autoApply}
                onChange={(e) => setFormData({ ...formData, autoApply: e.target.checked })}
                className="w-3 h-3 mt-0.5 text-brass border-brass/30 rounded focus:ring-brass focus:ring-1"
              />
              <div className="flex-1">
                <label htmlFor="autoApply" className="text-xs font-bold text-charcoal flex items-center gap-1">
                  <svg className="w-4 h-4 text-brass" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Auto-Apply Discount
                </label>
                <p className="text-[10px] text-charcoal/60 mt-1">
                  Automatically apply this discount when cart value exceeds minimum order amount. No code entry required by customer.
                </p>
              </div>
            </div>

            {formData.autoApply && (
              <div className="space-y-2 pl-5 animate-in fade-in duration-200">
                <div>
                  <Input
                    label="Display Name (shown to customer)"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g., Welcome Offer, Summer Sale"
                  />
                  <p className="text-[9px] text-charcoal/50 mt-0.5">Leave empty to use description</p>
                </div>
                <div>
                  <Input
                    label="Priority (for tie-breaking)"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                  <p className="text-[9px] text-charcoal/50 mt-0.5">Higher priority offers are preferred when discounts are equal</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded p-2 text-[10px] text-blue-800">
                  <strong>ℹ️ How Auto-Apply Works:</strong>
                  <ul className="list-disc ml-4 mt-1 space-y-0.5">
                    <li>System automatically selects the best discount for the customer</li>
                    <li>Priority helps break ties when multiple offers give same discount</li>
                    <li>Code is optional for auto-apply offers (backend will auto-generate if empty)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brass/20">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {editingOffer ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
