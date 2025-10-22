'use client'

import { useState, useEffect } from 'react'
import { materialsApi } from '@/lib/api'
import type { MaterialMaster } from '@/types'
import DataTable from '@/components/ui/DataTable'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    fetchMaterials()
  }, [])

  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const data = await materialsApi.getAll()
      setMaterials(data)
    } catch (error) {
      console.error('Failed to fetch materials:', error)
      alert('Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setFormData({ name: '', description: '' })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await materialsApi.create(formData)
      setIsModalOpen(false)
      fetchMaterials()
    } catch (error) {
      console.error('Failed to create material:', error)
      alert('Failed to create material')
    }
  }

  const columns = [
    { header: 'Name', accessor: 'name' as keyof MaterialMaster },
    { header: 'Description', accessor: 'description' as keyof MaterialMaster },
    {
      header: 'Created',
      accessor: (item: MaterialMaster) => 
        item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
    },
  ]

  if (loading && materials.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-charcoal/60">Loading materials...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal">Materials</h1>
          <p className="text-charcoal/60 mt-1">Manage material master list</p>
        </div>
        <Button onClick={openCreateModal}>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Material
          </span>
        </Button>
      </div>

      {/* Materials Table */}
      <DataTable data={materials} columns={columns} />

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Material"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Material Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
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
              Create Material
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

