'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { announcementsApi } from '@/lib/api'
import type { Announcement } from '@/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function AdminAnnouncementsPage() {
  const { token } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    message: '',
    linkType: 'none' as 'internal' | 'external' | 'none',
    linkUrl: '',
    linkText: '',
    backgroundColor: '#1E1E1E',
    textColor: '#FFFFFF',
    isActive: true,
    startDate: '',
    endDate: '',
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
      const data = await announcementsApi.getAll(token, { sortBy: 'order' })
      setAnnouncements(data)
      if (data.length > 0 && !selectedAnnouncement) {
        setSelectedAnnouncement(data[0])
      }
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
      alert('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!token) return
    try {
      setLoading(true)
      const results = await announcementsApi.getAll(token, { q: searchQuery, sortBy: 'order' })
      setAnnouncements(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingAnnouncement(null)
    setFormData({
      message: '',
      linkType: 'none',
      linkUrl: '',
      linkText: '',
      backgroundColor: '#1E1E1E',
      textColor: '#FFFFFF',
      isActive: true,
      startDate: '',
      endDate: '',
    })
    setIsModalOpen(true)
  }

  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      message: announcement.message,
      linkType: announcement.linkType,
      linkUrl: announcement.linkUrl || '',
      linkText: announcement.linkText || '',
      backgroundColor: announcement.backgroundColor || '#1E1E1E',
      textColor: announcement.textColor || '#FFFFFF',
      isActive: announcement.isActive,
      startDate: announcement.startDate ? new Date(announcement.startDate).toISOString().split('T')[0] : '',
      endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().split('T')[0] : '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    try {
      const submitData = {
        ...formData,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      }
      if (editingAnnouncement) {
        await announcementsApi.update(editingAnnouncement._id, submitData, token)
      } else {
        await announcementsApi.create(submitData, token)
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to save announcement:', error)
      alert('Failed to save announcement')
    }
  }

  const handleDelete = async (id: string) => {
    if (!token) return
    if (!confirm('Are you sure you want to delete this announcement?')) return
    
    try {
      await announcementsApi.delete(id, token)
      if (selectedAnnouncement?._id === id) {
        setSelectedAnnouncement(null)
      }
      fetchData()
    } catch (error) {
      console.error('Failed to delete announcement:', error)
      alert('Failed to delete announcement')
    }
  }

  const toggleActive = async (announcement: Announcement) => {
    if (!token) return
    try {
      await announcementsApi.update(announcement._id, { isActive: !announcement.isActive }, token)
      fetchData()
    } catch (error) {
      console.error('Failed to toggle announcement status:', error)
      alert('Failed to update announcement status')
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
    if (!token || draggedIndex === null || draggedIndex === dropIndex) return

    const newAnnouncements = [...announcements]
    const [draggedItem] = newAnnouncements.splice(draggedIndex, 1)
    newAnnouncements.splice(dropIndex, 0, draggedItem)

    setAnnouncements(newAnnouncements)
    setDraggedIndex(null)

    // Update order in backend
    try {
      const orderedIds = newAnnouncements.map(announcement => announcement._id)
      await announcementsApi.reorder(orderedIds, token)
    } catch (error) {
      console.error('Failed to update announcement order:', error)
      alert('Failed to update announcement order')
      fetchData() // Revert on error
    }
  }

  if (loading && announcements.length === 0) {
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
          <h1 className="text-base sm:text-lg font-serif font-bold text-charcoal">Announcements</h1>
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="flex items-center gap-1 bg-brass/10 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-brass" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-charcoal">{announcements.length} Announcements</span>
            </span>
            <span className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-charcoal">{announcements.filter(a => a.isActive).length} Active</span>
            </span>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="text-[10px] sm:text-xs bg-brass text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded hover:bg-brass/90 transition-colors font-semibold"
        >
          + Add Announcement
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2 bg-white rounded-lg px-3 py-2 shadow border border-brass/20">
        <input
          type="text"
          placeholder="Search announcements..."
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
        {/* Left Panel - Announcements List with Drag & Drop */}
        <div className="w-full md:w-2/5 h-[50vh] md:h-auto bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xs font-semibold">ANNOUNCEMENT LIST (DRAG TO REORDER)</h2>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {announcements.length === 0 ? (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <p>No announcements yet</p>
                  <button
                    onClick={openCreateModal}
                    className="text-brass hover:underline text-xs mt-2"
                  >
                    Add first announcement
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {announcements.map((announcement, index) => (
                  <div
                    key={announcement._id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    className={`group p-2 rounded hover:bg-brass/10 transition-all border cursor-move ${
                      selectedAnnouncement?._id === announcement._id ? 'bg-brass/10 border-brass/30' : 'border-transparent'
                    } ${draggedIndex === index ? 'opacity-50' : ''}`}
                    onClick={() => setSelectedAnnouncement(announcement)}
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
                      
                      {/* Preview with Colors */}
                      <div className="flex-1 min-w-0">
                        <div 
                          className="px-2 py-1 rounded text-[10px] text-center truncate mb-1"
                          style={{
                            backgroundColor: announcement.backgroundColor || '#1E1E1E',
                            color: announcement.textColor || '#FFFFFF'
                          }}
                        >
                          {announcement.message}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-charcoal/60">
                          <div 
                            className="w-3 h-3 rounded border border-charcoal/20"
                            style={{ backgroundColor: announcement.backgroundColor || '#1E1E1E' }}
                          />
                          <div 
                            className="w-3 h-3 rounded border border-charcoal/20"
                            style={{ backgroundColor: announcement.textColor || '#FFFFFF' }}
                          />
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                          announcement.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {announcement.isActive ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Announcement Details */}
        <div className="w-full md:w-3/5 h-[50vh] md:h-auto bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xs font-semibold">ANNOUNCEMENT DETAILS</h2>
            {selectedAnnouncement && (
              <div className="flex gap-1">
                <button
                  onClick={() => toggleActive(selectedAnnouncement)}
                  className="p-1 hover:bg-brass/20 rounded transition-colors"
                  title={selectedAnnouncement.isActive ? 'Set Inactive' : 'Set Active'}
                >
                  <svg className="w-3 h-3 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => openEditModal(selectedAnnouncement)}
                  className="p-1 hover:bg-brass/20 rounded transition-colors"
                  title="Edit"
                >
                  <svg className="w-3 h-3 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(selectedAnnouncement._id)}
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
            {selectedAnnouncement ? (
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                      selectedAnnouncement.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedAnnouncement.isActive ? 'Active (Visible on Homepage)' : 'Inactive (Hidden)'}
                    </span>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Preview</label>
                  <div 
                    className="mt-1 px-4 py-3 rounded text-center"
                    style={{
                      backgroundColor: selectedAnnouncement.backgroundColor || '#1E1E1E',
                      color: selectedAnnouncement.textColor || '#FFFFFF'
                    }}
                  >
                    {selectedAnnouncement.message}
                    {selectedAnnouncement.linkUrl && selectedAnnouncement.linkType !== 'none' && selectedAnnouncement.linkText && (
                      <span className="ml-2 font-semibold underline">
                        {selectedAnnouncement.linkText} →
                      </span>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Message</label>
                  <p className="text-sm text-charcoal mt-1 leading-relaxed">{selectedAnnouncement.message}</p>
                </div>

                {/* Colors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Background Color</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded border border-charcoal/20"
                        style={{ backgroundColor: selectedAnnouncement.backgroundColor || '#1E1E1E' }}
                      />
                      <span className="text-xs text-charcoal font-mono">{selectedAnnouncement.backgroundColor || '#1E1E1E'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Text Color</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded border border-charcoal/20"
                        style={{ backgroundColor: selectedAnnouncement.textColor || '#FFFFFF' }}
                      />
                      <span className="text-xs text-charcoal font-mono">{selectedAnnouncement.textColor || '#FFFFFF'}</span>
                    </div>
                  </div>
                </div>

                {/* Link */}
                {selectedAnnouncement.linkType !== 'none' && selectedAnnouncement.linkUrl && (
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Link</label>
                    <div className="mt-1 p-2 bg-brass/5 rounded border border-brass/20">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="px-2 py-0.5 bg-brass/20 text-brass rounded text-[10px] font-semibold uppercase flex-shrink-0">
                            {selectedAnnouncement.linkType}
                          </span>
                          <span className="text-charcoal/70 truncate">
                            {selectedAnnouncement.linkText || selectedAnnouncement.linkUrl}
                          </span>
                        </div>
                        {selectedAnnouncement.linkType === 'external' ? (
                          <a
                            href={selectedAnnouncement.linkUrl.startsWith('http://') || selectedAnnouncement.linkUrl.startsWith('https://') 
                              ? selectedAnnouncement.linkUrl 
                              : `https://${selectedAnnouncement.linkUrl}`}
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
                            href={selectedAnnouncement.linkUrl}
                            className="flex-shrink-0 p-1 hover:bg-brass/10 rounded transition-colors group"
                            title="Navigate to page"
                          >
                            <svg className="w-4 h-4 text-brass group-hover:text-brass/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </a>
                        )}
                      </div>
                      {selectedAnnouncement.linkUrl && (
                        <div className="mt-1 text-[10px] text-charcoal/50 font-mono truncate">
                          {selectedAnnouncement.linkType === 'external' && !(selectedAnnouncement.linkUrl.startsWith('http://') || selectedAnnouncement.linkUrl.startsWith('https://'))
                            ? `https://${selectedAnnouncement.linkUrl}`
                            : selectedAnnouncement.linkUrl}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Date Range */}
                {(selectedAnnouncement.startDate || selectedAnnouncement.endDate) && (
                  <div>
                    <label className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Date Range</label>
                    <div className="mt-1 text-xs text-charcoal/70">
                      {selectedAnnouncement.startDate && (
                        <div>Start: {new Date(selectedAnnouncement.startDate).toLocaleDateString()}</div>
                      )}
                      {selectedAnnouncement.endDate && (
                        <div>End: {new Date(selectedAnnouncement.endDate).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t border-brass/20">
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div>
                      <span className="text-charcoal/60 font-semibold">Order Position:</span>
                      <span className="ml-1 text-brass font-bold">#{announcements.findIndex(a => a._id === selectedAnnouncement._id) + 1}</span>
                    </div>
                    <div>
                      <span className="text-charcoal/60 font-semibold">Link Type:</span>
                      <span className="ml-1 text-charcoal capitalize">{selectedAnnouncement.linkType}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <p>Select an announcement to view details</p>
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
        title={editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Message *"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            placeholder="Enter announcement message"
          />

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
                <Input
                  label={`${formData.linkType === 'internal' ? 'Internal' : 'External'} URL`}
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  placeholder={formData.linkType === 'internal' ? '/products' : 'google.com or https://google.com'}
                  required
                />
                <Input
                  label="Link Text"
                  value={formData.linkText}
                  onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                  placeholder="Learn More"
                />
              </div>
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
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="w-12 h-8 border border-brass/30 rounded cursor-pointer"
                />
                <Input
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  placeholder="#1E1E1E"
                  className="text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">
                Text Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  className="w-12 h-8 border border-brass/30 rounded cursor-pointer"
                />
                <Input
                  value={formData.textColor}
                  onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                  placeholder="#FFFFFF"
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">
                Start Date (Optional)
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">
                End Date (Optional)
              </label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="text-xs"
              />
            </div>
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
              Active (visible on homepage)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brass/20">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {editingAnnouncement ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

