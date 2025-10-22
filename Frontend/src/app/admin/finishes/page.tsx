'use client'

import { useState, useEffect } from 'react'
import { finishesApi } from '@/lib/api'
import type { Finish } from '@/types'
import DataTable from '@/components/ui/DataTable'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function AdminFinishesPage() {
  const [finishes, setFinishes] = useState<Finish[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFinish, setEditingFinish] = useState<Finish | null>(null)

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

  const columns = [
    { header: 'Name', accessor: 'name' as keyof Finish },
    {
      header: 'Color',
      accessor: (item: Finish) => (
        <div className="flex items-center gap-2">
          {item.color && (
            <div
              className="w-6 h-6 rounded border border-brass/30"
              style={{ backgroundColor: item.color }}
            />
          )}
          <span>{item.color || 'N/A'}</span>
        </div>
      ),
    },
    { header: 'Description', accessor: 'description' as keyof Finish },
  ]

  if (loading && finishes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-charcoal/60">Loading finishes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal">Finishes</h1>
          <p className="text-charcoal/60 mt-1">Manage product finishes and colors</p>
        </div>
        <Button onClick={openCreateModal}>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Finish
          </span>
        </Button>
      </div>

      {/* Finishes Table */}
      <DataTable
        data={finishes}
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
        title={editingFinish ? 'Edit Finish' : 'Create Finish'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Finish Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Color (hex code)"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            placeholder="#C9A66B"
          />

          <Input
            label="Image URL"
            value={formData.imageURL}
            onChange={(e) => setFormData({ ...formData, imageURL: e.target.value })}
            placeholder="https://..."
          />

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingFinish ? 'Update Finish' : 'Create Finish'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

