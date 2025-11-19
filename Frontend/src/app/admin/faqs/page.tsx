'use client'

import { useState, useEffect } from 'react'
import { faqApi } from '@/lib/api'
import type { FAQ } from '@/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

// Helper function to convert HTML to plain text with preserved line breaks
const htmlToPlainText = (html: string): string => {
  return html
    .replace(/<br\s*\/?>/gi, '\n')  // Convert <br> tags to newlines
    .replace(/<\/p>/gi, '\n\n')      // Convert closing </p> to double newlines
    .replace(/<p>/gi, '')            // Remove opening <p>
    .replace(/<strong>(.*?)<\/strong>/gi, '$1') // Remove <strong> but keep content
    .replace(/<em>(.*?)<\/em>/gi, '$1')         // Remove <em> but keep content
    .replace(/<b>(.*?)<\/b>/gi, '$1')           // Remove <b> but keep content
    .replace(/<i>(.*?)<\/i>/gi, '$1')           // Remove <i> but keep content
    .replace(/<[^>]*>/g, '')         // Remove any remaining HTML tags
    .replace(/&nbsp;/g, ' ')         // Convert &nbsp; to space
    .replace(/&amp;/g, '&')          // Convert &amp; to &
    .replace(/&lt;/g, '<')           // Convert &lt; to <
    .replace(/&gt;/g, '>')           // Convert &gt; to >
    .replace(/&quot;/g, '"')         // Convert &quot; to "
    .trim()
}

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    linkType: 'none' as 'internal' | 'external' | 'none',
    linkUrl: '',
    linkText: '',
    isActive: true,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const faqsData = await faqApi.getAll({ sortBy: 'order' })
      setFaqs(faqsData)
      if (faqsData.length > 0 && !selectedFaq) {
        setSelectedFaq(faqsData[0])
      }
    } catch (error) {
      console.error('Failed to fetch FAQs:', error)
      alert('Failed to load FAQs')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const results = await faqApi.getAll({ q: searchQuery, sortBy: 'order' })
      setFaqs(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingFaq(null)
    setFormData({
      question: '',
      answer: '',
      linkType: 'none',
      linkUrl: '',
      linkText: '',
      isActive: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (faq: FAQ) => {
    setEditingFaq(faq)
    setFormData({
      question: faq.question,
      answer: htmlToPlainText(faq.answer), // Convert HTML to plain text for editing
      linkType: faq.linkType,
      linkUrl: faq.linkUrl || '',
      linkText: faq.linkText || '',
      isActive: faq.isActive,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let updatedFaq: FAQ | null = null
      if (editingFaq) {
        updatedFaq = await faqApi.update(editingFaq._id, formData)
      } else {
        updatedFaq = await faqApi.create(formData)
      }
      setIsModalOpen(false)
      await fetchData()
      // Update selected FAQ if it matches the saved one
      if (selectedFaq && editingFaq && selectedFaq._id === editingFaq._id) {
        const refreshedFaq = faqs.find(f => f._id === editingFaq._id)
        if (refreshedFaq) {
          setSelectedFaq(refreshedFaq)
        } else if (updatedFaq) {
          setSelectedFaq(updatedFaq)
        }
      }
    } catch (error) {
      console.error('Failed to save FAQ:', error)
      alert('Failed to save FAQ')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return
    
    try {
      await faqApi.delete(id)
      if (selectedFaq?._id === id) {
        setSelectedFaq(null)
      }
      fetchData()
    } catch (error) {
      console.error('Failed to delete FAQ:', error)
      alert('Failed to delete FAQ')
    }
  }

  const toggleActive = async (faq: FAQ) => {
    try {
      await faqApi.update(faq._id, { isActive: !faq.isActive })
      await fetchData()
      // Update selected FAQ if it matches the toggled one
      if (selectedFaq?._id === faq._id) {
        const refreshedFaq = faqs.find(f => f._id === faq._id)
        if (refreshedFaq) {
          setSelectedFaq(refreshedFaq)
        }
      }
    } catch (error) {
      console.error('Failed to toggle FAQ status:', error)
      alert('Failed to update FAQ status')
    }
  }

  // Drag and Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newFaqs = [...faqs]
    const [draggedItem] = newFaqs.splice(draggedIndex, 1)
    newFaqs.splice(dropIndex, 0, draggedItem)

    setFaqs(newFaqs)
    setDraggedIndex(null)

    // Update order in backend
    try {
      const orderedIds = newFaqs.map(faq => faq._id)
      await faqApi.reorder(orderedIds)
    } catch (error) {
      console.error('Failed to update FAQ order:', error)
      alert('Failed to update FAQ order')
      fetchData() // Revert on error
    }
  }

  if (loading && faqs.length === 0) {
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
          <h1 className="text-base sm:text-lg font-serif font-bold text-charcoal">FAQs</h1>
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="flex items-center gap-1 bg-brass/10 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-brass" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-charcoal">{faqs.length} FAQs</span>
            </span>
            <span className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
              <span className="font-semibold text-charcoal">{faqs.filter(f => f.isActive).length} Active</span>
          </span>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="text-[10px] sm:text-xs bg-brass text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded hover:bg-brass/90 transition-colors font-semibold"
        >
          + Add FAQ
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 bg-white rounded-lg px-3 py-2 shadow border border-brass/20">
        <input
          type="text"
          placeholder="Search FAQs..."
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
            onClick={() => { setSearchQuery(''); fetchData(); }}
            className="text-[10px] bg-charcoal/10 text-charcoal px-3 py-1 rounded hover:bg-charcoal/20 transition-colors font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Split Pane Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 overflow-hidden min-h-0">
        {/* Left Panel - FAQs List with Drag & Drop */}
        <div className="w-full md:w-2/5 h-[50vh] md:h-auto bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xs font-semibold">FAQ LIST (DRAG TO REORDER)</h2>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {faqs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No FAQs yet</p>
                  <button
                    onClick={openCreateModal}
                    className="text-brass hover:underline text-xs mt-2"
                  >
                    Add first FAQ
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {faqs.map((faq, index) => (
                  <div
                    key={faq._id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    className={`group p-2 rounded hover:bg-brass/10 transition-all border cursor-move ${
                      selectedFaq?._id === faq._id ? 'bg-brass/10 border-brass/30' : 'border-transparent'
                    } ${draggedIndex === index ? 'opacity-50' : ''}`}
                    onClick={() => setSelectedFaq(faq)}
                  >
                    <div className="flex items-start gap-2">
                      {/* Drag Handle */}
                      <div className="flex-shrink-0 pt-0.5">
                        <svg className="w-4 h-4 text-charcoal/30" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                        </svg>
                      </div>
                      
                      {/* Order Badge */}
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-5 h-5 text-[9px] font-bold text-white bg-brass rounded-full">
                          {index + 1}
                        </span>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-charcoal text-xs truncate">{faq.question}</p>
                        <p className="text-[10px] text-charcoal/60 mt-0.5 line-clamp-2">
                          {htmlToPlainText(faq.answer).substring(0, 60)}...
                        </p>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                          faq.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {faq.isActive ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - FAQ Details */}
        <div className="w-full md:w-3/5 h-[50vh] md:h-auto bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xs font-semibold">FAQ DETAILS</h2>
            {selectedFaq && (
              <div className="flex gap-1">
                <button
                  onClick={() => toggleActive(selectedFaq)}
                  className="p-1 hover:bg-brass/20 rounded transition-colors"
                  title={selectedFaq.isActive ? 'Set Inactive' : 'Set Active'}
                >
                  <svg className="w-3 h-3 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => openEditModal(selectedFaq)}
                  className="p-1 hover:bg-brass/20 rounded transition-colors"
                  title="Edit"
                >
                  <svg className="w-3 h-3 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(selectedFaq._id)}
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
            {selectedFaq ? (
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                      selectedFaq.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedFaq.isActive ? 'Active (Visible to Customers)' : 'Inactive (Hidden)'}
                    </span>
                  </div>
                </div>

                {/* Question */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Question</label>
                  <p className="text-sm text-charcoal mt-1 leading-relaxed">{selectedFaq.question}</p>
                </div>

                {/* Answer */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Answer</label>
                  <p className="text-xs text-charcoal/80 mt-1 leading-relaxed whitespace-pre-wrap">
                    {htmlToPlainText(selectedFaq.answer)}
                  </p>
                </div>

                {/* Link */}
                {selectedFaq.linkType !== 'none' && selectedFaq.linkUrl && (
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Link</label>
                    <div className="mt-1 p-2 bg-brass/5 rounded border border-brass/20">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="px-2 py-0.5 bg-brass/20 text-brass rounded text-[10px] font-semibold uppercase flex-shrink-0">
                            {selectedFaq.linkType}
                          </span>
                          <span className="text-charcoal/70 truncate">
                            {selectedFaq.linkText || selectedFaq.linkUrl}
                          </span>
                        </div>
                        {selectedFaq.linkType === 'external' ? (
                          <a
                            href={selectedFaq.linkUrl.startsWith('http://') || selectedFaq.linkUrl.startsWith('https://') 
                              ? selectedFaq.linkUrl 
                              : `https://${selectedFaq.linkUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 p-1 hover:bg-brass/10 rounded transition-colors group"
                            title="Open in new tab"
                          >
                            <svg className="w-4 h-4 text-brass group-hover:text-brass/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <a
                            href={selectedFaq.linkUrl}
                            className="flex-shrink-0 p-1 hover:bg-brass/10 rounded transition-colors group"
                            title="Navigate to page"
                          >
                            <svg className="w-4 h-4 text-brass group-hover:text-brass/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </a>
                        )}
                      </div>
                      {selectedFaq.linkUrl && (
                        <div className="mt-1 text-[10px] text-charcoal/50 font-mono truncate">
                          {selectedFaq.linkType === 'external' && !(selectedFaq.linkUrl.startsWith('http://') || selectedFaq.linkUrl.startsWith('https://'))
                            ? `https://${selectedFaq.linkUrl}`
                            : selectedFaq.linkUrl}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t border-brass/20">
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div>
                      <span className="text-charcoal/60 font-semibold">Order Position:</span>
                      <span className="ml-1 text-brass font-bold">#{faqs.findIndex(f => f._id === selectedFaq._id) + 1}</span>
                    </div>
                    <div>
                      <span className="text-charcoal/60 font-semibold">Link Type:</span>
                      <span className="ml-1 text-charcoal capitalize">{selectedFaq.linkType}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>Select an FAQ to view details</p>
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
        title={editingFaq ? 'Edit FAQ' : 'New FAQ'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Question *"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            required
            placeholder="Enter the frequently asked question"
          />

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">
              Answer *
            </label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              required
              placeholder="Enter the answer (press Enter for new lines)"
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass resize-y"
              rows={4}
              style={{ minHeight: '80px' }}
            />
            <p className="text-[10px] text-charcoal/60 mt-1">
              Press Enter to create line breaks. Text formatting is preserved as entered.
            </p>
          </div>

            <div>
            <label className="block text-xs font-medium text-charcoal mb-1">
                Link Type
              </label>
              <select
                value={formData.linkType}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  linkType: e.target.value as 'internal' | 'external' | 'none',
                  linkUrl: e.target.value === 'none' ? '' : formData.linkUrl,
                  linkText: e.target.value === 'none' ? '' : formData.linkText
                })}
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
              >
                <option value="none">No Link</option>
                <option value="internal">Internal Link</option>
                <option value="external">External Link</option>
              </select>
          </div>

          {formData.linkType !== 'none' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
              <Input
                label={`${formData.linkType === 'internal' ? 'Internal' : 'External'} URL`}
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder={formData.linkType === 'internal' ? '/products' : 'google.com or https://google.com'}
                required
              />
                  {formData.linkType === 'external' && formData.linkUrl && (
                    <p className="text-[10px] text-brass/80 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Will open: {formData.linkUrl.startsWith('http://') || formData.linkUrl.startsWith('https://') 
                        ? formData.linkUrl 
                        : `https://${formData.linkUrl}`}
                    </p>
                  )}
                  {formData.linkType === 'internal' && (
                    <p className="text-[10px] text-charcoal/60 mt-1">
                      Must start with / (e.g., /products, /about)
                    </p>
                  )}
                </div>
              <Input
                label="Link Text"
                value={formData.linkText}
                onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                placeholder="Learn More"
              />
              </div>
            </div>
          )}

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
              {editingFaq ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
