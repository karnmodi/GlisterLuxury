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
    { header: 'Slug', accessor: 'slug' as keyof Category },
    {
      header: 'Subcategories',
      accessor: (item: Category) => `${item.subcategories?.length || 0} items`,
    },
    { header: 'Description', accessor: 'description' as keyof Category },
  ]

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-charcoal/60">Loading categories...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal">Categories</h1>
          <p className="text-charcoal/60 mt-1">Manage product categories and subcategories</p>
        </div>
        <Button onClick={openCreateModal}>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </span>
        </Button>
      </div>

      {/* Categories Table */}
      <DataTable
        data={categories}
        columns={columns}
        actions={(item) => (
          <>
            <Button size="sm" variant="secondary" onClick={() => openEditModal(item)}>
              Edit
            </Button>
            <Button size="sm" variant="secondary" onClick={() => openSubcategoryModal(item)}>
              Add Subcategory
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleDelete(item._id)}>
              Delete
            </Button>
          </>
        )}
      />

      {/* Subcategories Display */}
      {categories.some(cat => cat.subcategories?.length > 0) && (
        <div className="mt-8">
          <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Subcategories</h2>
          {categories.map((category) => 
            category.subcategories && category.subcategories.length > 0 ? (
              <div key={category._id} className="mb-6 bg-white rounded-lg shadow-md border border-brass/20 p-6">
                <h3 className="text-lg font-semibold text-charcoal mb-4">{category.name}</h3>
                <div className="space-y-2">
                  {category.subcategories.map((sub) => (
                    <div key={sub._id} className="flex items-center justify-between p-3 bg-ivory/50 rounded">
                      <div>
                        <p className="font-medium text-charcoal">{sub.name}</p>
                        <p className="text-sm text-charcoal/60">{sub.description || 'No description'}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteSubcategory(category._id, sub._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name *"
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
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Subcategory Modal */}
      <Modal
        isOpen={isSubcategoryModalOpen}
        onClose={() => setIsSubcategoryModalOpen(false)}
        title={`Add Subcategory to ${selectedCategory?.name}`}
      >
        <form onSubmit={handleSubcategorySubmit} className="space-y-4">
          <Input
            label="Subcategory Name *"
            value={subcategoryFormData.name}
            onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Description</label>
            <textarea
              value={subcategoryFormData.description}
              onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsSubcategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Subcategory
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

