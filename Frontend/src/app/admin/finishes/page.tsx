'use client'

import { useState, useEffect } from 'react'
import { finishesApi } from '@/lib/api'
import type { Finish } from '@/types'
import DataTable from '@/components/ui/DataTable'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import ImageUpload from '@/components/ui/ImageUpload'

export default function AdminFinishesPage() {
  const [finishes, setFinishes] = useState<Finish[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [editingFinish, setEditingFinish] = useState<Finish | null>(null)
  const [managingImageFinish, setManagingImageFinish] = useState<Finish | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '',
    imageURL: '',
  })

  useEffect(() => {
    fetchFinishes()
  }, [])

  const fetchFinishes = async () => {
    try {
      setLoading(true)
      const data = await finishesApi.getAll()
      setFinishes(data)
    } catch (error) {
      console.error('Failed to fetch finishes:', error)
      alert('Failed to load finishes')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingFinish(null)
    setFormData({ name: '', description: '', color: '', imageURL: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (finish: Finish) => {
    setEditingFinish(finish)
    setFormData({
      name: finish.name,
      description: finish.description || '',
      color: finish.color || '',
      imageURL: finish.imageURL || '',
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingFinish) {
        await finishesApi.update(editingFinish._id, formData)
      } else {
        await finishesApi.create(formData)
      }
      setIsModalOpen(false)
      fetchFinishes()
    } catch (error) {
      console.error('Failed to save finish:', error)
      alert('Failed to save finish')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this finish?')) return
    
    try {
      await finishesApi.delete(id)
      fetchFinishes()
    } catch (error) {
      console.error('Failed to delete finish:', error)
      alert('Failed to delete finish')
    }
  }

  const openImageModal = (finish: Finish) => {
    setManagingImageFinish(finish)
    setIsImageModalOpen(true)
  }

  const handleImageUpload = async (files: File[]) => {
    if (!managingImageFinish || files.length === 0) return
    
    try {
      const result = await finishesApi.uploadImage(managingImageFinish._id, files[0])
      setManagingImageFinish(result.finish)
      fetchFinishes()
    } catch (error) {
      throw error
    }
  }

  const handleImageDelete = async () => {
    if (!managingImageFinish) return
    
    try {
      const result = await finishesApi.deleteImage(managingImageFinish._id)
      setManagingImageFinish(result.finish)
      fetchFinishes()
    } catch (error) {
      throw error
    }
  }

  const columns = [
    { 
      header: 'Name', 
      accessor: (item: Finish) => (
        <span className="font-semibold text-charcoal">{item.name}</span>
      )
    },
    {
      header: 'Preview',
      accessor: (item: Finish) => (
        <div className="flex items-center gap-3">
          {item.photoURL ? (
            <img 
              src={item.photoURL} 
              alt={item.name}
              className="w-16 h-16 object-cover rounded-lg border-2 border-brass/30 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-cream to-ivory border-2 border-brass/30 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-brass/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Color',
      accessor: (item: Finish) => (
        <div className="flex items-center gap-3">
          {item.color && (
            <>
              <div
                className="w-10 h-10 rounded-lg border-2 border-brass/30 shadow-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="font-mono text-sm text-charcoal/70">{item.color}</span>
            </>
          )}
          {!item.color && <span className="text-charcoal/40 italic">Not set</span>}
        </div>
      ),
    },
    { 
      header: 'Description', 
      accessor: (item: Finish) => (
        <span className="text-charcoal/70">{item.description || '-'}</span>
      )
    },
  ]

  const totalFinishes = finishes.length
  const withImages = finishes.filter(f => f.photoURL).length
  const withColors = finishes.filter(f => f.color).length

  if (loading && finishes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brass border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-charcoal/60 text-lg">Loading finishes...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-cream/30 rounded-xl p-6 shadow-lg border border-brass/20 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60 font-medium mb-1">Total Finishes</p>
              <p className="text-3xl font-bold text-charcoal">{totalFinishes}</p>
            </div>
            <div className="w-14 h-14 bg-brass/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-cream/30 rounded-xl p-6 shadow-lg border border-brass/20 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60 font-medium mb-1">With Images</p>
              <p className="text-3xl font-bold text-charcoal">{withImages}</p>
            </div>
            <div className="w-14 h-14 bg-olive/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-cream/30 rounded-xl p-6 shadow-lg border border-brass/20 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60 font-medium mb-1">With Colors</p>
              <p className="text-3xl font-bold text-charcoal">{withColors}</p>
            </div>
            <div className="w-14 h-14 bg-charcoal/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-white to-cream/50 rounded-xl p-6 shadow-md border border-brass/20">
        <div>
          <h1 className="text-4xl font-serif font-bold text-charcoal mb-2">Finishes</h1>
          <p className="text-charcoal/60">Manage product finishes and surface treatments</p>
        </div>
        <Button onClick={openCreateModal} size="lg" className="shadow-lg hover:shadow-xl">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Finish
          </span>
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-brass/10 to-olive/10 rounded-xl p-6 border border-brass/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-brass/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-charcoal mb-2">About Finishes</h3>
            <p className="text-sm text-charcoal/70 leading-relaxed">
              Finishes represent surface treatments or coatings for products (e.g., Polished, Matte, Antique Brass). 
              You can add images and colors to help customers visualize each finish option.
            </p>
          </div>
        </div>
      </div>

      {/* Finishes Grid View */}
      {finishes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {finishes.map((finish) => (
            <div
              key={finish._id}
              className="group bg-white rounded-xl shadow-lg border border-brass/20 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative h-48 bg-gradient-to-br from-cream to-ivory">
                {finish.photoURL ? (
                  <img
                    src={finish.photoURL}
                    alt={finish.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {finish.color ? (
                      <div
                        className="w-32 h-32 rounded-lg shadow-xl border-4 border-white"
                        style={{ backgroundColor: finish.color }}
                      />
                    ) : (
                      <svg className="w-20 h-20 text-brass/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                )}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    onClick={() => openImageModal(finish)}
                    className="shadow-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </Button>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-serif font-bold text-charcoal mb-2">{finish.name}</h3>
                <p className="text-sm text-charcoal/60 mb-4 line-clamp-2">
                  {finish.description || 'No description provided'}
                </p>
                {finish.color && (
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-6 h-6 rounded border-2 border-brass/30"
                      style={{ backgroundColor: finish.color }}
                    />
                    <span className="text-xs font-mono text-charcoal/60">{finish.color}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEditModal(finish)} className="flex-1">
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(finish._id)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      <div className="bg-white rounded-xl shadow-lg border border-brass/20 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-charcoal to-charcoal/90 border-b border-brass/20">
          <h2 className="text-lg font-semibold text-ivory">Detailed List View</h2>
        </div>
        <DataTable
          data={finishes}
          columns={columns}
          actions={(item) => (
            <>
              <Button size="sm" variant="secondary" onClick={() => openImageModal(item)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </Button>
              <Button size="sm" variant="secondary" onClick={() => openEditModal(item)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(item._id)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </>
          )}
        />
      </div>

      {/* Image Management Modal */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false)
          setManagingImageFinish(null)
        }}
        title={`Manage Image: ${managingImageFinish?.name || ''}`}
      >
        {managingImageFinish && (
          <div className="space-y-4">
            <div className="bg-cream/50 p-4 rounded-lg border border-brass/20">
              <p className="text-sm text-charcoal/80">
                <strong>Finish Name:</strong> {managingImageFinish.name}
              </p>
              {managingImageFinish.color && (
                <div className="flex items-center gap-2 mt-2">
                  <strong className="text-sm text-charcoal/80">Color:</strong>
                  <div
                    className="w-8 h-8 rounded-lg border border-brass/30"
                    style={{ backgroundColor: managingImageFinish.color }}
                  />
                  <span className="text-sm text-charcoal/80 font-mono">{managingImageFinish.color}</span>
                </div>
              )}
            </div>
            
            <ImageUpload
              images={managingImageFinish.photoURL ? [managingImageFinish.photoURL] : []}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              multiple={false}
            />
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFinish ? 'Edit Finish' : 'Create New Finish'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-brass/5 rounded-lg p-4 border border-brass/20">
            <p className="text-sm text-charcoal/70">
              Finishes represent surface treatments or colors available for products. 
              Add a name, optional color code, and upload an image to help customers visualize the finish.
            </p>
          </div>

          <Input
            label="Finish Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Polished Brass, Matte Black, Antique Finish"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Color (hex code)"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#C9A66B"
              />
            </div>
            <div className="flex items-end">
              {formData.color && (
                <div className="flex items-center gap-3 p-3 bg-cream/50 rounded-lg border border-brass/20 w-full">
                  <span className="text-sm text-charcoal/70">Preview:</span>
                  <div
                    className="w-12 h-12 rounded-lg border-2 border-brass/30 shadow-sm"
                    style={{ backgroundColor: formData.color }}
                  />
                </div>
              )}
            </div>
          </div>

          <Input
            label="Image URL (Optional)"
            value={formData.imageURL}
            onChange={(e) => setFormData({ ...formData, imageURL: e.target.value })}
            placeholder="https://..."
          />

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
              rows={3}
              placeholder="Describe the finish, its characteristics, or use cases..."
            />
          </div>

          <div className="bg-olive/5 rounded-lg p-4 border border-olive/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-olive flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-charcoal/70">
                <strong className="text-charcoal">Note:</strong> After creating a finish, you can upload a high-quality 
                image using the image management feature. This helps customers see exactly what the finish looks like.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-brass/20">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-[150px]">
              {editingFinish ? 'Update Finish' : 'Create Finish'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
