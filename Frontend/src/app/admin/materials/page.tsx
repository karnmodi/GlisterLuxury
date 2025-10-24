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
      setFormData({ name: '', description: '' })
      fetchMaterials()
    } catch (error) {
      console.error('Failed to create material:', error)
      alert('Failed to create material')
    }
  }

  const columns = [
    { 
      header: 'Name', 
      accessor: (item: MaterialMaster) => (
        <span className="font-semibold text-charcoal">{item.name}</span>
      )
    },
    { 
      header: 'Description', 
      accessor: (item: MaterialMaster) => (
        <span className="text-charcoal/70">{item.description || '-'}</span>
      )
    },
    {
      header: 'Created',
      accessor: (item: MaterialMaster) => (
        <span className="text-sm text-charcoal/60">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'N/A'}
        </span>
      ),
    },
  ]

  const totalMaterials = materials.length
  const recentMaterials = materials.filter(m => {
    if (!m.createdAt) return false
    const created = new Date(m.createdAt)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return created > weekAgo
  }).length

  if (loading && materials.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brass border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-charcoal/60 text-lg">Loading materials...</div>
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
              <p className="text-sm text-charcoal/60 font-medium mb-1">Total Materials</p>
              <p className="text-3xl font-bold text-charcoal">{totalMaterials}</p>
            </div>
            <div className="w-14 h-14 bg-brass/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-cream/30 rounded-xl p-6 shadow-lg border border-brass/20 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60 font-medium mb-1">Added This Week</p>
              <p className="text-3xl font-bold text-charcoal">{recentMaterials}</p>
            </div>
            <div className="w-14 h-14 bg-olive/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-cream/30 rounded-xl p-6 shadow-lg border border-brass/20 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60 font-medium mb-1">Material Types</p>
              <p className="text-3xl font-bold text-charcoal">{totalMaterials}</p>
              <p className="text-xs text-charcoal/60 mt-1">Active variations</p>
            </div>
            <div className="w-14 h-14 bg-charcoal/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-white to-cream/50 rounded-xl p-6 shadow-md border border-brass/20">
        <div>
          <h1 className="text-4xl font-serif font-bold text-charcoal mb-2">Materials</h1>
          <p className="text-charcoal/60">Master list of all available materials</p>
        </div>
        <Button onClick={openCreateModal} size="lg" className="shadow-lg hover:shadow-xl">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Material
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
            <h3 className="font-semibold text-charcoal mb-2">About Materials</h3>
            <p className="text-sm text-charcoal/70 leading-relaxed">
              Materials are the base types used in your products (e.g., Brass, Stainless Steel, Zinc Alloy). 
              Each product can have multiple material variants with different pricing and size options.
            </p>
          </div>
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-xl shadow-lg border border-brass/20 overflow-hidden">
        <DataTable
          data={materials}
          columns={columns}
        />
      </div>

      {materials.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-brass/20 p-12 text-center">
          <div className="w-20 h-20 bg-brass/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-brass/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-charcoal mb-2">No Materials Yet</h3>
          <p className="text-charcoal/60 mb-6">Start by creating your first material to use in products.</p>
          <Button onClick={openCreateModal}>
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create First Material
            </span>
          </Button>
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Material"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-brass/5 rounded-lg p-4 border border-brass/20">
            <p className="text-sm text-charcoal/70">
              Materials represent the base material type for products. Examples include Brass, Stainless Steel, 
              Zinc Alloy, etc. You can later configure specific pricing and sizes per product.
            </p>
          </div>

          <Input
            label="Material Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Brass, Stainless Steel, Zinc Alloy"
          />

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
              rows={3}
              placeholder="Describe this material, its properties, or typical use cases..."
            />
          </div>

          <div className="bg-olive/5 rounded-lg p-4 border border-olive/20">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-olive flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-charcoal/70">
                <strong className="text-charcoal">Tip:</strong> Once created, you can assign this material to products 
                and set specific pricing for each product variant.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-brass/20">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-[150px]">
              Create Material
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
