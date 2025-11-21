'use client'

import { useState, useEffect } from 'react'
import { contactApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { ContactInfo, ContactInquiry } from '@/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function AdminContactPage() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<'info' | 'inquiries'>('info')
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([])
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedInfo, setSelectedInfo] = useState<ContactInfo | null>(null)
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null)
  const [adminNotes, setAdminNotes] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('')

  // Category options for the dropdown
  const categoryOptions = [
    { value: 'general_inquiry', label: 'General Inquiry' },
    { value: 'product_inquiry', label: 'Product Inquiry' },
    { value: 'order_status', label: 'Order Status' },
    { value: 'refund_request', label: 'Refund Request' },
    { value: 'bulk_order', label: 'Bulk Order' },
    { value: 'technical_support', label: 'Technical Support' },
    { value: 'shipping_delivery', label: 'Shipping & Delivery' },
    { value: 'payment_issue', label: 'Payment Issue' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'other', label: 'Other' }
  ]

  // Helper function to format category label
  const formatCategoryLabel = (category: string) => {
    const option = categoryOptions.find(opt => opt.value === category)
    return option ? option.label : category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const [formData, setFormData] = useState({
    type: 'address' as 'address' | 'phone' | 'email' | 'social',
    label: '',
    value: '',
    phones: [] as Array<{ type: 'landline' | 'contact', number: string, label?: string }>,
    displayOrder: 0,
    isActive: true,
    socialMedia: {
      instagram: '',
      facebook: '',
      linkedin: '',
      twitter: '',
      youtube: '',
      pinterest: '',
      tiktok: '',
    },
    businessWhatsApp: '',
  })

  useEffect(() => {
    if (token) {
      if (activeTab === 'info') {
        fetchContactInfo()
      } else {
        fetchInquiries()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeTab, statusFilter, categoryFilter, sortBy])

  const fetchContactInfo = async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await contactApi.getInfo({}, token)
      setContactInfo(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch contact info:', error)
      alert('Failed to load contact information')
      setContactInfo([])
    } finally {
      setLoading(false)
    }
  }

  const fetchInquiries = async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await contactApi.listInquiries(token, { 
        status: statusFilter || undefined, 
        q: searchQuery || undefined,
        category: categoryFilter || undefined,
        sortBy: sortBy || undefined
      })
      setInquiries(data)
    } catch (error) {
      console.error('Failed to fetch inquiries:', error)
      alert('Failed to load inquiries')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (activeTab === 'inquiries') {
      await fetchInquiries()
    }
  }

  const openCreateModal = () => {
    setSelectedInfo(null)
    setFormData({
      type: 'address',
      label: '',
      value: '',
      phones: [],
      displayOrder: 0,
      isActive: true,
      socialMedia: {
        instagram: '',
        facebook: '',
        linkedin: '',
        twitter: '',
        youtube: '',
        pinterest: '',
        tiktok: '',
      },
      businessWhatsApp: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (item: ContactInfo) => {
    setSelectedInfo(item)
    setFormData({
      type: item.type,
      label: item.label,
      value: item.value || '',
      phones: item.phones || [],
      displayOrder: item.displayOrder,
      isActive: item.isActive,
      socialMedia: {
        instagram: item.socialMedia?.instagram || '',
        facebook: item.socialMedia?.facebook || '',
        linkedin: item.socialMedia?.linkedin || '',
        twitter: item.socialMedia?.twitter || '',
        youtube: item.socialMedia?.youtube || '',
        pinterest: item.socialMedia?.pinterest || '',
        tiktok: item.socialMedia?.tiktok || '',
      },
      businessWhatsApp: item.businessWhatsApp || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    if (!token) return
    e.preventDefault()
    try {
      // Prepare payload - only include socialMedia if at least one platform has a value
      const hasSocialMedia = Object.values(formData.socialMedia).some(val => val.trim() !== '')
      const payload: any = {
        type: formData.type,
        label: formData.label,
        displayOrder: formData.displayOrder,
        isActive: formData.isActive,
      }
      
      // For phone type: use phones array if available, otherwise use value for backward compatibility
      if (formData.type === 'phone') {
        if (formData.phones && formData.phones.length > 0) {
          payload.phones = formData.phones.filter(p => p.number.trim() !== '')
        } else if (formData.value.trim() !== '') {
          // Backward compatibility: if phones array is empty but value exists, use value
          payload.value = formData.value.trim()
        }
      } else {
        // For other types, value is required
        if (formData.value.trim() !== '') {
          payload.value = formData.value.trim()
        }
      }
      
      if (hasSocialMedia) {
        payload.socialMedia = formData.socialMedia
      }
      
      if (formData.businessWhatsApp.trim() !== '') {
        payload.businessWhatsApp = formData.businessWhatsApp.trim()
      }
      
      if (selectedInfo) {
        await contactApi.updateInfo(selectedInfo._id, payload, token)
      } else {
        await contactApi.createInfo(payload, token)
      }
      setIsModalOpen(false)
      fetchContactInfo()
    } catch (error) {
      console.error('Failed to save contact info:', error)
      alert('Failed to save contact information')
    }
  }

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this contact information?')) return
    
    try {
      await contactApi.deleteInfo(id, token)
      if (selectedInfo?._id === id) {
        setSelectedInfo(null)
      }
      fetchContactInfo()
    } catch (error) {
      console.error('Failed to delete contact info:', error)
      alert('Failed to delete contact information')
    }
  }

  const updateInquiryStatus = async (inquiryId: string, status: string, adminNotes?: string) => {
    if (!token) return
    try {
      await contactApi.updateInquiry(inquiryId, { status: status as any, adminNotes }, token)
      await fetchInquiries()
      // Refresh selected inquiry if it's the one being updated
      if (selectedInquiry?._id === inquiryId) {
        const updatedInquiries = await contactApi.listInquiries(token, {})
        const updated = updatedInquiries.find(i => i._id === inquiryId)
        if (updated) {
          setSelectedInquiry(updated)
          setAdminNotes(updated.adminNotes || '')
        }
      }
    } catch (error) {
      console.error('Failed to update inquiry:', error)
      alert('Failed to update inquiry')
    }
  }

  const saveAdminNotes = async (inquiryId: string) => {
    if (!token) return
    try {
      await contactApi.updateInquiry(inquiryId, { adminNotes: adminNotes.trim() || undefined }, token)
      await fetchInquiries()
      // Refresh selected inquiry
      if (selectedInquiry?._id === inquiryId) {
        const updatedInquiries = await contactApi.listInquiries(token, {})
        const updated = updatedInquiries.find(i => i._id === inquiryId)
        if (updated) {
          setSelectedInquiry(updated)
        }
      }
    } catch (error) {
      console.error('Failed to save admin notes:', error)
      alert('Failed to save admin notes')
    }
  }

  const handleDeleteInquiry = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this inquiry?')) return
    
    try {
      await contactApi.deleteInquiry(id, token)
      if (selectedInquiry?._id === id) {
        setSelectedInquiry(null)
        setAdminNotes('')
      }
      await fetchInquiries()
    } catch (error) {
      console.error('Failed to delete inquiry:', error)
      alert('Failed to delete inquiry')
    }
  }

  const filteredInfo = (contactInfo || []).sort((a, b) => a.displayOrder - b.displayOrder)

  if (loading && (activeTab === 'info' ? contactInfo.length === 0 : inquiries.length === 0)) {
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-lg px-3 py-2 shadow border border-brass/20 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <h1 className="text-base sm:text-lg font-serif font-bold text-charcoal">Contact Management</h1>
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {activeTab === 'info' ? (
              <>
                <span className="flex items-center gap-1 bg-brass/10 px-2 py-1 rounded">
                  <span className="font-semibold text-charcoal">{contactInfo.length} Contact Info</span>
                </span>
                <span className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
                  <span className="font-semibold text-charcoal">{contactInfo.filter(f => f.isActive).length} Active</span>
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1 bg-brass/10 px-2 py-1 rounded">
                  <span className="font-semibold text-charcoal">{inquiries.length} Inquiries</span>
                </span>
                <span className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                  <span className="font-semibold text-charcoal">{inquiries.filter(i => i.status === 'new').length} New</span>
                </span>
              </>
            )}
          </div>
        </div>
        {activeTab === 'info' && (
          <button
            onClick={openCreateModal}
            className="text-[10px] sm:text-xs bg-brass text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded hover:bg-brass/90 transition-colors font-semibold"
          >
            + Add Contact Info
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-lg px-3 py-2 shadow border border-brass/20">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-xs font-semibold rounded transition-colors ${
            activeTab === 'info'
              ? 'bg-brass text-white'
              : 'bg-charcoal/10 text-charcoal hover:bg-charcoal/20'
          }`}
        >
          Contact Info
        </button>
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2 text-xs font-semibold rounded transition-colors ${
            activeTab === 'inquiries'
              ? 'bg-brass text-white'
              : 'bg-charcoal/10 text-charcoal hover:bg-charcoal/20'
          }`}
        >
          Inquiries
        </button>
      </div>

      {/* Search Bar */}
      {activeTab === 'inquiries' && (
        <div className="flex flex-wrap gap-2 bg-white rounded-lg px-3 py-2 shadow border border-brass/20">
          <input
            type="text"
            placeholder="Search inquiries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 min-w-[150px] px-2 py-1 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2 py-1 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
          >
            <option value="">All Categories</option>
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2 py-1 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
          >
            <option value="">Sort By...</option>
            <option value="category">Category</option>
            <option value="status">Status</option>
            <option value="name">Name</option>
            <option value="oldest">Oldest First</option>
          </select>
          <button
            onClick={handleSearch}
            className="text-[10px] bg-charcoal text-ivory px-3 py-1 rounded hover:bg-charcoal/90 transition-colors font-semibold"
          >
            Search
          </button>
        </div>
      )}

      {/* Content */}
      {activeTab === 'info' ? (
        <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0 bg-white rounded-lg shadow border border-brass/20 p-4">
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredInfo.length === 0 ? (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <p>No contact information yet</p>
                  <button
                    onClick={openCreateModal}
                    className="text-brass hover:underline text-xs mt-2"
                  >
                    Add first contact info
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredInfo.map((item) => (
                  <div
                    key={item._id}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      selectedInfo?._id === item._id ? 'bg-brass/10 border-brass/30' : 'bg-white border-brass/20 hover:border-brass/40'
                    }`}
                    onClick={() => setSelectedInfo(item)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-brass/20 text-brass rounded text-[10px] font-semibold uppercase">
                            {item.type}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                            item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="font-semibold text-charcoal text-sm">{item.label}</p>
                        {item.type === 'phone' && item.phones && item.phones.length > 0 ? (
                          <div className="text-xs text-charcoal/70 mt-1 space-y-1">
                            {item.phones.map((phone, idx) => (
                              <p key={idx}>
                                {phone.label || phone.type}: {phone.number}
                              </p>
                            ))}
                          </div>
                        ) : (
                          item.value && <p className="text-xs text-charcoal/70 mt-1">{item.value}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(item)
                          }}
                          className="p-1 hover:bg-brass/10 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(item._id)
                          }}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col md:flex-row gap-2 overflow-hidden min-h-0">
          {/* Left Panel - Inquiry List (Desktop) / Top (Mobile) */}
          <div className="w-full md:w-2/5 lg:w-1/3 h-[40vh] md:h-auto bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden">
            <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xs font-semibold">INQUIRY LIST</h2>
              {selectedInquiry && (
                <button
                  onClick={() => {
                    setSelectedInquiry(null)
                    setAdminNotes('')
                  }}
                  className="md:hidden text-ivory hover:text-brass transition-colors p-1"
                  title="Close Details"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 p-2">
              {inquiries.length === 0 ? (
                <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                  <div className="text-center">
                    <p>No inquiries yet</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {inquiries.map((inquiry) => (
                    <div
                      key={inquiry._id}
                      className={`p-2 rounded border cursor-pointer transition-all ${
                        selectedInquiry?._id === inquiry._id ? 'bg-brass/10 border-brass/30' : 'bg-white border-brass/20 hover:border-brass/40'
                      }`}
                      onClick={() => {
                        setSelectedInquiry(inquiry)
                        setAdminNotes(inquiry.adminNotes || '')
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                            inquiry.status === 'new' ? 'bg-blue-100 text-blue-800' :
                            inquiry.status === 'read' ? 'bg-yellow-100 text-yellow-800' :
                            inquiry.status === 'replied' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {inquiry.status.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="font-semibold text-charcoal text-xs truncate">{inquiry.subject}</p>
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-[8px] font-semibold whitespace-nowrap">
                              {formatCategoryLabel(inquiry.category)}
                            </span>
                          </div>
                          <p className="text-[10px] text-charcoal/60 mt-0.5 truncate">{inquiry.name}</p>
                          <p className="text-[10px] text-charcoal/50 mt-1 line-clamp-1">{inquiry.message.substring(0, 50)}...</p>
                          <p className="text-[9px] text-charcoal/40 mt-1">
                            {new Date(inquiry.createdAt || '').toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Inquiry Details (Desktop) / Bottom (Mobile) */}
          <div className={`w-full md:w-3/5 lg:w-2/3 h-[50vh] md:h-auto bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden transition-all ${
            selectedInquiry ? 'flex' : 'hidden md:flex md:items-center md:justify-center'
          }`}>
            <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xs font-semibold">INQUIRY DETAILS</h2>
              {selectedInquiry && (
                <button
                  onClick={() => {
                    setSelectedInquiry(null)
                    setAdminNotes('')
                  }}
                  className="text-ivory hover:text-brass transition-colors p-1"
                  title="Close Details"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 p-4">
              {selectedInquiry ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Status</label>
                    <div className="mt-1">
                      <select
                        value={selectedInquiry.status}
                        onChange={(e) => updateInquiryStatus(selectedInquiry._id, e.target.value, adminNotes)}
                        className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Category</label>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                        {formatCategoryLabel(selectedInquiry.category)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Admin Notes</label>
                    <div className="mt-1">
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add internal notes about this inquiry..."
                        className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
                        rows={4}
                      />
                      <button
                        onClick={() => saveAdminNotes(selectedInquiry._id)}
                        className="mt-2 text-[10px] bg-brass text-white px-3 py-1.5 rounded hover:bg-brass/90 transition-colors font-semibold"
                      >
                        Save Notes
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Name</label>
                    <p className="text-sm text-charcoal mt-1">{selectedInquiry.name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Email</label>
                    <p className="text-sm text-charcoal mt-1 break-all">{selectedInquiry.email}</p>
                  </div>
                  {selectedInquiry.phone && (
                    <div>
                      <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Phone</label>
                      <p className="text-sm text-charcoal mt-1">{selectedInquiry.phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Subject</label>
                    <p className="text-sm text-charcoal mt-1">{selectedInquiry.subject}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Message</label>
                    <p className="text-xs text-charcoal/80 mt-1 leading-relaxed whitespace-pre-wrap break-words">{selectedInquiry.message}</p>
                  </div>
                  <div className="pt-2 border-t border-brass/20">
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Submitted</label>
                    <p className="text-xs text-charcoal/60 mt-1">
                      {new Date(selectedInquiry.createdAt || '').toLocaleString()}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-brass/20">
                    <button
                      onClick={() => handleDeleteInquiry(selectedInquiry._id)}
                      className="w-full text-[10px] bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 transition-colors font-semibold"
                    >
                      Delete Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p>Select an inquiry to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal for Contact Info */}
      <Modal
        isOpen={isModalOpen && activeTab === 'info'}
        onClose={() => setIsModalOpen(false)}
        title={selectedInfo ? 'Edit Contact Info' : 'New Contact Info'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              required
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
            >
              <option value="address">Address</option>
              <option value="phone">Phone</option>
              <option value="email">Email</option>
              <option value="social">Social Media</option>
            </select>
          </div>

          <Input
            label="Label *"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            required
            placeholder="e.g., Head Office, Sales, Instagram"
          />

          {/* Value field - shown for non-phone types or as fallback for phone type */}
          {formData.type !== 'phone' && (
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">
                Value *
              </label>
              <textarea
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
                placeholder="Enter contact information"
                className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
                rows={3}
              />
            </div>
          )}

          {/* Phone Numbers Array - shown when type is 'phone' */}
          {formData.type === 'phone' && (
            <div className="space-y-2 border-t border-brass/20 pt-3">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-charcoal">
                  Phone Numbers *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      phones: [...formData.phones, { type: 'contact', number: '', label: '' }]
                    })
                  }}
                  className="text-[10px] bg-brass text-white px-2 py-1 rounded hover:bg-brass/90 transition-colors font-semibold"
                >
                  + Add Phone
                </button>
              </div>
              {formData.phones.length === 0 ? (
                <div className="text-xs text-charcoal/60 p-2 bg-charcoal/5 rounded border border-brass/20">
                  No phone numbers added. Click "Add Phone" to add one.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.phones.map((phone, index) => (
                    <div key={index} className="p-3 bg-charcoal/5 rounded border border-brass/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-charcoal">Phone #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              phones: formData.phones.filter((_, i) => i !== index)
                            })
                          }}
                          className="text-[10px] text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-medium text-charcoal/70 mb-1">
                            Type *
                          </label>
                          <select
                            value={phone.type}
                            onChange={(e) => {
                              const updatedPhones = [...formData.phones]
                              updatedPhones[index].type = e.target.value as 'landline' | 'contact'
                              setFormData({ ...formData, phones: updatedPhones })
                            }}
                            required
                            className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
                          >
                            <option value="landline">Landline</option>
                            <option value="contact">Contact</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-charcoal/70 mb-1">
                            Label (Optional)
                          </label>
                          <input
                            type="text"
                            value={phone.label || ''}
                            onChange={(e) => {
                              const updatedPhones = [...formData.phones]
                              updatedPhones[index].label = e.target.value
                              setFormData({ ...formData, phones: updatedPhones })
                            }}
                            placeholder="e.g., Main Office"
                            className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-charcoal/70 mb-1">
                          Number *
                        </label>
                        <input
                          type="tel"
                          value={phone.number}
                          onChange={(e) => {
                            const updatedPhones = [...formData.phones]
                            updatedPhones[index].number = e.target.value
                            setFormData({ ...formData, phones: updatedPhones })
                          }}
                          required
                          placeholder="e.g., +44 123 456 789"
                          className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Backward compatibility: Value field for old phone entries */}
              <div className="mt-3 pt-3 border-t border-brass/20">
                <label className="block text-xs font-medium text-charcoal/70 mb-1">
                  Value (Legacy - for backward compatibility)
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="Leave empty if using phone numbers above"
                  className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
                />
                <p className="text-[10px] text-charcoal/50 mt-1">
                  Only use this if migrating old data. New entries should use phone numbers above.
                </p>
              </div>
            </div>
          )}

          {/* Social Media Fields - shown when type is 'social' */}
          {formData.type === 'social' && (
            <div className="space-y-2 border-t border-brass/20 pt-3">
              <label className="block text-xs font-medium text-charcoal mb-2">
                Social Media URLs (Optional)
              </label>
              <Input
                label="Instagram"
                value={formData.socialMedia.instagram}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialMedia: { ...formData.socialMedia, instagram: e.target.value } 
                })}
                placeholder="https://instagram.com/username"
                type="url"
              />
              <Input
                label="Facebook"
                value={formData.socialMedia.facebook}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialMedia: { ...formData.socialMedia, facebook: e.target.value } 
                })}
                placeholder="https://facebook.com/username"
                type="url"
              />
              <Input
                label="LinkedIn"
                value={formData.socialMedia.linkedin}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialMedia: { ...formData.socialMedia, linkedin: e.target.value } 
                })}
                placeholder="https://linkedin.com/company/username"
                type="url"
              />
              <Input
                label="Twitter"
                value={formData.socialMedia.twitter}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialMedia: { ...formData.socialMedia, twitter: e.target.value } 
                })}
                placeholder="https://twitter.com/username"
                type="url"
              />
              <Input
                label="YouTube"
                value={formData.socialMedia.youtube}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialMedia: { ...formData.socialMedia, youtube: e.target.value } 
                })}
                placeholder="https://youtube.com/@username"
                type="url"
              />
              <Input
                label="Pinterest"
                value={formData.socialMedia.pinterest}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialMedia: { ...formData.socialMedia, pinterest: e.target.value } 
                })}
                placeholder="https://pinterest.com/username"
                type="url"
              />
              <Input
                label="TikTok"
                value={formData.socialMedia.tiktok}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialMedia: { ...formData.socialMedia, tiktok: e.target.value } 
                })}
                placeholder="https://tiktok.com/@username"
                type="url"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">
              Business WhatsApp (Optional)
            </label>
            <input
              type="tel"
              value={formData.businessWhatsApp}
              onChange={(e) => setFormData({ ...formData, businessWhatsApp: e.target.value })}
              placeholder="e.g., +1234567890"
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
            />
            <p className="text-[10px] text-charcoal/50 mt-1">
              Must be in E.164 format with country code (e.g., +1234567890)
            </p>
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

          <div className="flex justify-end gap-2 pt-2 border-t border-brass/20">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {selectedInfo ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

