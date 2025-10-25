'use client'

import { useState, useEffect } from 'react'
import { faqApi } from '@/lib/api'
import type { FAQ } from '@/types'
import DataTable from '@/components/ui/DataTable'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function AdminFAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    linkType: 'none' as 'internal' | 'external' | 'none',
    linkUrl: '',
    linkText: '',
    order: 0,
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
      order: 0,
      isActive: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (faq: FAQ) => {
    setEditingFaq(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      linkType: faq.linkType,
      linkUrl: faq.linkUrl || '',
      linkText: faq.linkText || '',
      order: faq.order,
      isActive: faq.isActive,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingFaq) {
        await faqApi.update(editingFaq._id, formData)
      } else {
        await faqApi.create(formData)
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to save FAQ:', error)
      alert('Failed to save FAQ')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return
    
    try {
      await faqApi.delete(id)
      fetchData()
    } catch (error) {
      console.error('Failed to delete FAQ:', error)
      alert('Failed to delete FAQ')
    }
  }

  const toggleActive = async (faq: FAQ) => {
    try {
      await faqApi.update(faq._id, { isActive: !faq.isActive })
      fetchData()
    } catch (error) {
      console.error('Failed to toggle FAQ status:', error)
      alert('Failed to update FAQ status')
    }
  }

  const columns = [
    { 
      header: 'Order', 
      accessor: 'order' as keyof FAQ,
      className: 'w-20 text-center'
    },
    { 
      header: 'Question', 
      accessor: (item: FAQ) => (
        <div className="max-w-xs">
          <div className="font-medium text-charcoal truncate">
            {item.question}
          </div>
        </div>
      )
    },
    {
      header: 'Answer',
      accessor: (item: FAQ) => (
        <div className="max-w-xs">
          <div className="text-charcoal/70 text-sm truncate">
            {item.answer.replace(/<[^>]*>/g, '').substring(0, 50)}...
          </div>
        </div>
      ),
    },
    {
      header: 'Link',
      accessor: (item: FAQ) => {
        if (item.linkType === 'none') return 'None'
        return (
          <div className="text-sm">
            <div className="font-medium text-brass capitalize">{item.linkType}</div>
            {item.linkText && (
              <div className="text-charcoal/60 truncate max-w-32">{item.linkText}</div>
            )}
          </div>
        )
      },
    },
    {
      header: 'Status',
      accessor: (item: FAQ) => (
        <button
          onClick={() => toggleActive(item)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
            item.isActive
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
        >
          {item.isActive ? 'Active' : 'Inactive'}
        </button>
      ),
    },
  ]

  if (loading && faqs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-charcoal/60">Loading FAQs...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal">FAQs</h1>
          <p className="text-charcoal/60 mt-1">Manage frequently asked questions</p>
        </div>
        <Button onClick={openCreateModal}>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add FAQ
          </span>
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search FAQs by question or answer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} variant="secondary">
          Search
        </Button>
        {searchQuery && (
          <Button onClick={() => { setSearchQuery(''); fetchData(); }} variant="ghost">
            Clear
          </Button>
        )}
      </div>

      {/* FAQs Table */}
      <DataTable
        data={faqs}
        columns={columns}
        actions={(item) => (
          <>
            <Button size="sm" variant="secondary" onClick={() => openEditModal(item)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleDelete(item._id)}>
              Delete
            </Button>
          </>
        )}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaq ? 'Edit FAQ' : 'Create FAQ'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Question *"
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            required
            placeholder="Enter the frequently asked question"
          />

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Answer *
            </label>
            <textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              required
              placeholder="Enter the answer (HTML supported)"
              className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
              rows={4}
            />
            <p className="text-xs text-charcoal/60 mt-1">
              You can use HTML tags like &lt;br&gt;, &lt;strong&gt;, &lt;em&gt; for formatting
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
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
                className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
              >
                <option value="none">No Link</option>
                <option value="internal">Internal Link</option>
                <option value="external">External Link</option>
              </select>
            </div>

            <Input
              label="Display Order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>

          {formData.linkType !== 'none' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={`${formData.linkType === 'internal' ? 'Internal' : 'External'} URL`}
                value={formData.linkUrl}
                onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                placeholder={formData.linkType === 'internal' ? '/page-path' : 'https://example.com'}
                required
              />
              <Input
                label="Link Text"
                value={formData.linkText}
                onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                placeholder="Learn More"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-brass border-brass/30 rounded focus:ring-brass focus:ring-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-charcoal">
              Active (visible to customers)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingFaq ? 'Update FAQ' : 'Create FAQ'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
