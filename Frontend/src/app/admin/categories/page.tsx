'use client'

import { useState, useEffect } from 'react'
import { categoriesApi } from '@/lib/api'
import type { Category, Subcategory } from '@/types'
import DataTable from '@/components/ui/DataTable'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await categoriesApi.getAll()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      alert('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
    })
    setIsModalOpen(true)
  }

  const openSubcategoryModal = (category: Category) => {
    setSelectedCategory(category)
    setSubcategoryFormData({ name: '', description: '' })
    setIsSubcategoryModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory._id, formData)
      } else {
        await categoriesApi.create(formData)
      }
      setIsModalOpen(false)
      fetchCategories()
    } catch (error) {
      console.error('Failed to save category:', error)
      alert('Failed to save category')
    }
  }

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCategory) return

    try {
      await categoriesApi.addSubcategory(selectedCategory._id, subcategoryFormData)
      setIsSubcategoryModalOpen(false)
      fetchCategories()
    } catch (error) {
      console.error('Failed to add subcategory:', error)
      alert('Failed to add subcategory')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    try {
      await categoriesApi.delete(id)
      fetchCategories()
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category')
    }
  }

  const handleDeleteSubcategory = async (categoryId: string, subcategoryId: string) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return
    
    try {
      await categoriesApi.deleteSubcategory(categoryId, subcategoryId)
      fetchCategories()
    } catch (error) {
      console.error('Failed to delete subcategory:', error)
      alert('Failed to delete subcategory')
    }
  }

  const columns = [
    { header: 'Name', accessor: 'name' as keyof Category },
    { 
      header: 'Slug', 
      accessor: (item: Category) => (
        <span className="font-mono text-xs bg-cream px-3 py-1 rounded-full">{item.slug}</span>
      )
    },
    {
      header: 'Subcategories',
      accessor: (item: Category) => (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brass/10 text-brass border border-brass/20">
          {item.subcategories?.length || 0} items
        </span>
      ),
    },
    { header: 'Description', accessor: 'description' as keyof Category },
  ]

  const totalCategories = categories.length
  const totalSubcategories = categories.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0)
  const categoriesWithSubs = categories.filter(cat => cat.subcategories && cat.subcategories.length > 0).length

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brass border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-charcoal/60 text-lg">Loading categories...</div>
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
              <p className="text-sm text-charcoal/60 font-medium mb-1">Categories</p>
              <p className="text-3xl font-bold text-charcoal">{totalCategories}</p>
            </div>
            <div className="w-14 h-14 bg-brass/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-cream/30 rounded-xl p-6 shadow-lg border border-brass/20 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60 font-medium mb-1">Subcategories</p>
              <p className="text-3xl font-bold text-charcoal">{totalSubcategories}</p>
            </div>
            <div className="w-14 h-14 bg-olive/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-cream/30 rounded-xl p-6 shadow-lg border border-brass/20 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60 font-medium mb-1">With Subs</p>
              <p className="text-3xl font-bold text-charcoal">{categoriesWithSubs}</p>
            </div>
            <div className="w-14 h-14 bg-charcoal/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-white to-cream/50 rounded-xl p-6 shadow-md border border-brass/20">
        <div>
          <h1 className="text-4xl font-serif font-bold text-charcoal mb-2">Categories</h1>
          <p className="text-charcoal/60">Organize products with categories and subcategories</p>
        </div>
        <Button onClick={openCreateModal} size="lg" className="shadow-lg hover:shadow-xl">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </span>
        </Button>
      </div>

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-lg border border-brass/20 overflow-hidden">
        <DataTable
          data={categories}
          columns={columns}
          actions={(item) => (
            <>
              <Button size="sm" variant="secondary" onClick={() => openEditModal(item)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button size="sm" variant="secondary" onClick={() => openSubcategoryModal(item)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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

      {/* Subcategories Display */}
      {categories.some(cat => cat.subcategories?.length > 0) && (
        <div className="space-y-6">
          <h2 className="text-3xl font-serif font-bold text-charcoal flex items-center gap-2">
            <svg className="w-8 h-8 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Subcategories
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {categories.map((category) => 
              category.subcategories && category.subcategories.length > 0 ? (
                <div key={category._id} className="bg-white rounded-xl shadow-lg border border-brass/20 p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-brass/20">
                    <h3 className="text-xl font-serif font-bold text-charcoal flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brass"></div>
                      {category.name}
                    </h3>
                    <span className="text-sm text-charcoal/60 bg-cream px-3 py-1 rounded-full">
                      {category.subcategories.length} items
                    </span>
                  </div>
                  <div className="space-y-2">
                    {category.subcategories.map((sub) => (
                      <div key={sub._id} className="group flex items-center justify-between p-4 bg-gradient-to-r from-cream/50 to-transparent rounded-lg hover:from-brass/5 hover:to-transparent transition-all">
                        <div className="flex-1">
                          <p className="font-semibold text-charcoal group-hover:text-brass transition-colors">{sub.name}</p>
                          <p className="text-sm text-charcoal/60 mt-1">{sub.description || 'No description'}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteSubcategory(category._id, sub._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Door Handles"
          />

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
              rows={3}
              placeholder="Describe this category..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-brass/20">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-[150px]">
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Subcategory Modal */}
      <Modal
        isOpen={isSubcategoryModalOpen}
        onClose={() => setIsSubcategoryModalOpen(false)}
        title={`Add Subcategory to "${selectedCategory?.name}"`}
      >
        <form onSubmit={handleSubcategorySubmit} className="space-y-4">
          <div className="bg-brass/10 rounded-lg p-4 border border-brass/20">
            <p className="text-sm text-charcoal">
              <strong>Parent Category:</strong> {selectedCategory?.name}
            </p>
          </div>

          <Input
            label="Subcategory Name *"
            value={subcategoryFormData.name}
            onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
            required
            placeholder="e.g., Mortise Handles"
          />

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Description</label>
            <textarea
              value={subcategoryFormData.description}
              onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
              rows={3}
              placeholder="Describe this subcategory..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-brass/20">
            <Button type="button" variant="ghost" onClick={() => setIsSubcategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-[150px]">
              Add Subcategory
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
