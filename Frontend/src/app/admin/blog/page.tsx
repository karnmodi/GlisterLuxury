'use client'

import { useState, useEffect } from 'react'
import { blogApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { Blog } from '@/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function AdminBlogPage() {
  const { token } = useAuth()
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Blog | null>(null)
  const [selectedItem, setSelectedItem] = useState<Blog | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tagFilter, setTagFilter] = useState<string>('')

  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    content: '',
    tags: [] as string[],
    tagInput: '',
    seoTitle: '',
    seoDescription: '',
    featuredImage: '',
    order: 0,
    isActive: true,
  })

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  const fetchData = async () => {
    if (!token) return
    try {
      setLoading(true)
      const data = await blogApi.getAll({ sortBy: 'order' }, token)
      setBlogs(data)
      if (data.length > 0 && !selectedItem) {
        setSelectedItem(data[0])
      }
    } catch (error) {
      console.error('Failed to fetch blog articles:', error)
      alert('Failed to load blog articles')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!token) return
    try {
      setLoading(true)
      const results = await blogApi.getAll({ 
        q: searchQuery, 
        tags: tagFilter || undefined,
        sortBy: 'order' 
      }, token)
      setBlogs(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({
      title: '',
      shortDescription: '',
      content: '',
      tags: [],
      tagInput: '',
      seoTitle: '',
      seoDescription: '',
      featuredImage: '',
      order: 0,
      isActive: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (item: Blog) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      shortDescription: item.shortDescription,
      content: item.content,
      tags: item.tags || [],
      tagInput: '',
      seoTitle: item.seoTitle || '',
      seoDescription: item.seoDescription || '',
      featuredImage: item.featuredImage || '',
      order: item.order,
      isActive: item.isActive,
    })
    setIsModalOpen(true)
  }

  const handleAddTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: '',
      })
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    if (!token) return
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        tags: formData.tags,
      }
      delete (submitData as any).tagInput

      let updatedItem: Blog | null = null
      if (editingItem) {
        updatedItem = await blogApi.update(editingItem._id, submitData, token)
      } else {
        updatedItem = await blogApi.create(submitData, token)
      }
      setIsModalOpen(false)
      await fetchData()
      // Update selected item if it matches the saved one
      if (selectedItem && editingItem && selectedItem._id === editingItem._id) {
        const refreshedItem = blogs.find(b => b._id === editingItem._id)
        if (refreshedItem) {
          setSelectedItem(refreshedItem)
        } else if (updatedItem) {
          setSelectedItem(updatedItem)
        }
      }
    } catch (error) {
      console.error('Failed to save blog article:', error)
      alert('Failed to save blog article')
    }
  }

  const handleDelete = async (id: string) => {
    if (!token || !confirm('Are you sure you want to delete this blog article?')) return
    
    try {
      await blogApi.delete(id, token)
      if (selectedItem?._id === id) {
        setSelectedItem(null)
      }
      fetchData()
    } catch (error) {
      console.error('Failed to delete blog article:', error)
      alert('Failed to delete blog article')
    }
  }

  const toggleActive = async (item: Blog) => {
    if (!token) return
    try {
      await blogApi.update(item._id, { isActive: !item.isActive }, token)
      await fetchData()
      // Update selected item if it matches the toggled one
      if (selectedItem?._id === item._id) {
        const refreshedItem = blogs.find(b => b._id === item._id)
        if (refreshedItem) {
          setSelectedItem(refreshedItem)
        }
      }
    } catch (error) {
      console.error('Failed to toggle blog article status:', error)
      alert('Failed to update blog article status')
    }
  }

  // Get all unique tags from blogs
  const allTags = Array.from(new Set(blogs.flatMap(blog => blog.tags || [])))

  const filteredItems = tagFilter 
    ? blogs.filter(item => item.tags?.includes(tagFilter))
    : blogs

  if (loading && blogs.length === 0) {
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
          <h1 className="text-base sm:text-lg font-serif font-bold text-charcoal">Blog Articles</h1>
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="flex items-center gap-1 bg-brass/10 px-2 py-1 rounded">
              <span className="font-semibold text-charcoal">{blogs.length} Articles</span>
            </span>
            <span className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
              <span className="font-semibold text-charcoal">{blogs.filter(f => f.isActive).length} Active</span>
            </span>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="text-[10px] sm:text-xs bg-brass text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded hover:bg-brass/90 transition-colors font-semibold"
        >
          + Add Article
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 bg-white rounded-lg px-3 py-2 shadow border border-brass/20">
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-2 py-1 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
        />
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="px-2 py-1 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
        >
          <option value="">All Tags</option>
          {allTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        <button
          onClick={handleSearch}
          className="text-[10px] bg-charcoal text-ivory px-3 py-1 rounded hover:bg-charcoal/90 transition-colors font-semibold"
        >
          Search
        </button>
        {(searchQuery || tagFilter) && (
          <button
            onClick={() => { setSearchQuery(''); setTagFilter(''); fetchData(); }}
            className="text-[10px] bg-charcoal/10 text-charcoal px-3 py-1 rounded hover:bg-charcoal/20 transition-colors font-semibold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Split Pane Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 overflow-hidden min-h-0">
        {/* Left Panel - Article List */}
        <div className="w-full md:w-2/5 h-[50vh] md:h-auto bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xs font-semibold">ARTICLE LIST</h2>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredItems.length === 0 ? (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <p>No articles yet</p>
                  <button
                    onClick={openCreateModal}
                    className="text-brass hover:underline text-xs mt-2"
                  >
                    Add first article
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredItems.map((item) => (
                  <div
                    key={item._id}
                    className={`group p-2 rounded hover:bg-brass/10 transition-all border cursor-pointer ${
                      selectedItem?._id === item._id ? 'bg-brass/10 border-brass/30' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center justify-center w-5 h-5 text-[9px] font-bold text-white bg-brass rounded-full">
                          {item.order}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                            item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.isActive ? '✓' : '✗'}
                          </span>
                          {item.tags && item.tags.length > 0 && (
                            <span className="px-1.5 py-0.5 bg-brass/20 text-brass rounded text-[9px] font-semibold">
                              {item.tags.length} tags
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-charcoal text-xs truncate">{item.title}</p>
                        <p className="text-[10px] text-charcoal/60 mt-0.5 line-clamp-2">
                          {item.shortDescription}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Article Details */}
        <div className="w-full md:w-3/5 h-[50vh] md:h-auto bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xs font-semibold">ARTICLE DETAILS</h2>
            {selectedItem && (
              <div className="flex gap-1">
                <button
                  onClick={() => toggleActive(selectedItem)}
                  className="p-1 hover:bg-brass/20 rounded transition-colors"
                  title={selectedItem.isActive ? 'Set Inactive' : 'Set Active'}
                >
                  <svg className="w-3 h-3 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => openEditModal(selectedItem)}
                  className="p-1 hover:bg-brass/20 rounded transition-colors"
                  title="Edit"
                >
                  <svg className="w-3 h-3 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(selectedItem._id)}
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
            {selectedItem ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                      selectedItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedItem.isActive ? 'Active (Visible to Customers)' : 'Inactive (Hidden)'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Title</label>
                  <p className="text-sm text-charcoal mt-1 leading-relaxed">{selectedItem.title}</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Short Description</label>
                  <p className="text-xs text-charcoal/80 mt-1 leading-relaxed">{selectedItem.shortDescription}</p>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Content</label>
                  <p className="text-xs text-charcoal/80 mt-1 leading-relaxed whitespace-pre-wrap">
                    {selectedItem.content}
                  </p>
                </div>
                {selectedItem.tags && selectedItem.tags.length > 0 && (
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Tags</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedItem.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-brass/10 text-brass rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedItem.seoTitle && (
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">SEO Title</label>
                    <p className="text-xs text-charcoal/80 mt-1">{selectedItem.seoTitle}</p>
                  </div>
                )}
                {selectedItem.seoDescription && (
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">SEO Description</label>
                    <p className="text-xs text-charcoal/80 mt-1">{selectedItem.seoDescription}</p>
                  </div>
                )}
                {selectedItem.featuredImage && (
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Featured Image</label>
                    <p className="text-xs text-charcoal/80 mt-1 break-all">{selectedItem.featuredImage}</p>
                  </div>
                )}
                <div className="pt-4 border-t border-brass/20">
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div>
                      <span className="text-charcoal/60 font-semibold">Order:</span>
                      <span className="ml-1 text-brass font-bold">#{selectedItem.order}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <p>Select article to view details</p>
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
        title={editingItem ? 'Edit Blog Article' : 'New Blog Article'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Title *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Enter article title"
          />

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">
              Short Description *
            </label>
            <textarea
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              required
              placeholder="Enter short description"
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass resize-y"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              placeholder="Enter article content"
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass resize-y"
              rows={6}
              style={{ minHeight: '150px' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={formData.tagInput}
                onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Enter tag and press Enter"
                className="flex-1 px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 text-xs bg-brass text-white rounded hover:bg-brass/90 transition-colors"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass rounded text-xs"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Input
            label="SEO Title (Optional)"
            value={formData.seoTitle}
            onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
            placeholder="Enter SEO title"
          />

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">
              SEO Description (Optional)
            </label>
            <textarea
              value={formData.seoDescription}
              onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
              placeholder="Enter SEO description"
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass resize-y"
              rows={2}
            />
          </div>

          <Input
            label="Featured Image URL (Optional)"
            value={formData.featuredImage}
            onChange={(e) => setFormData({ ...formData, featuredImage: e.target.value })}
            placeholder="Enter image URL"
          />

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">
              Order
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
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

          <div className="flex justify-end gap-2 pt-2 border-t border-brass/20">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}


