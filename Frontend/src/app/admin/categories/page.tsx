'use client'

import { useState, useEffect } from 'react'
import { categoriesApi } from '@/lib/api'
import type { Category, Subcategory } from '@/types'
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
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)

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
    setEditingSubcategory(null)
    setSubcategoryFormData({ name: '', description: '' })
    setIsSubcategoryModalOpen(true)
  }

  const openEditSubcategoryModal = (category: Category, subcategory: Subcategory) => {
    setSelectedCategory(category)
    setEditingSubcategory(subcategory)
    setSubcategoryFormData({
      name: subcategory.name,
      description: subcategory.description || '',
    })
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
      if (editingSubcategory) {
        await categoriesApi.updateSubcategory(selectedCategory._id, editingSubcategory._id, subcategoryFormData)
      } else {
        await categoriesApi.addSubcategory(selectedCategory._id, subcategoryFormData)
      }
      setIsSubcategoryModalOpen(false)
      setEditingSubcategory(null)
      fetchCategories()
    } catch (error) {
      console.error('Failed to save subcategory:', error)
      alert('Failed to save subcategory')
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

  const totalCategories = categories.length
  const totalSubcategories = categories.reduce((sum, cat) => sum + (cat.subcategories?.length || 0), 0)

  if (loading && categories.length === 0) {
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
          <h1 className="text-base sm:text-lg font-serif font-bold text-charcoal">Categories</h1>
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="flex items-center gap-1 bg-brass/10 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-brass" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <span className="font-semibold text-charcoal">{totalCategories}</span>
            </span>
            <span className="flex items-center gap-1 bg-olive/10 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-olive" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
              <span className="font-semibold text-charcoal">{totalSubcategories} subs</span>
            </span>
          </div>
        </div>
        <Button onClick={openCreateModal} size="sm" className="text-xs py-1 px-3">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </span>
        </Button>
      </div>

      {/* Split Pane Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 overflow-hidden min-h-0">
        {/* Left Panel - Categories */}
        <div className="w-full md:w-1/2 bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden min-h-[300px] md:min-h-0">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20">
            <h2 className="text-xs font-semibold">CATEGORIES</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-cream/50 border-b border-brass/10">
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold text-charcoal text-[10px]">NAME</th>
                  <th className="hidden sm:table-cell px-2 py-1.5 text-left font-semibold text-charcoal text-[10px]">SLUG</th>
                  <th className="px-2 py-1.5 text-center font-semibold text-charcoal text-[10px]">SUBS</th>
                  <th className="px-2 py-1.5 text-right font-semibold text-charcoal text-[10px]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brass/5">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-2 py-6 text-center text-charcoal/60 text-xs">
                      No categories
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr 
                      key={cat._id} 
                      className={`hover:bg-brass/5 transition-colors cursor-pointer ${selectedCategory?._id === cat._id ? 'bg-brass/10' : ''}`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      <td className="px-2 py-1.5 font-medium text-charcoal">{cat.name}</td>
                      <td className="hidden sm:table-cell px-2 py-1.5">
                        <span className="font-mono text-[10px] bg-cream px-1.5 py-0.5 rounded">{cat.slug}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-brass/20 text-brass">
                          {cat.subcategories?.length || 0}
                        </span>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(cat)
                            }}
                            className="p-1 hover:bg-brass/10 rounded transition-colors"
                            title="Edit"
                          >
                            <svg className="w-3 h-3 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openSubcategoryModal(cat)
                            }}
                            className="p-1 hover:bg-olive/10 rounded transition-colors"
                            title="Add Subcategory"
                          >
                            <svg className="w-3 h-3 text-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(cat._id)
                            }}
                            className="p-1 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel - Subcategories */}
        <div className="w-full md:w-1/2 bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden min-h-[300px] md:min-h-0">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between">
            <h2 className="text-xs font-semibold">
              {selectedCategory ? `${selectedCategory.name.toUpperCase()} - SUBCATEGORIES` : 'SELECT A CATEGORY'}
            </h2>
            {selectedCategory && (
              <button
                onClick={() => openSubcategoryModal(selectedCategory)}
                className="text-[10px] bg-brass text-white px-2 py-0.5 rounded hover:bg-brass/90 transition-colors"
              >
                + Add
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedCategory ? (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <p>Select a category to view subcategories</p>
                </div>
              </div>
            ) : selectedCategory.subcategories?.length === 0 ? (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="mb-2">No subcategories yet</p>
                  <button
                    onClick={() => openSubcategoryModal(selectedCategory)}
                    className="text-brass hover:underline text-xs"
                  >
                    Add first subcategory
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {selectedCategory.subcategories?.map((sub) => (
                  <div 
                    key={sub._id} 
                    className="group p-2 bg-gradient-to-r from-cream/30 to-transparent rounded hover:from-brass/10 hover:to-transparent transition-all border border-transparent hover:border-brass/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-charcoal text-xs truncate">{sub.name}</p>
                        {sub.description && (
                          <p className="text-[10px] text-charcoal/60 mt-0.5 line-clamp-2">{sub.description}</p>
                        )}
                        <p className="text-[9px] text-charcoal/40 mt-0.5 font-mono">{sub.slug}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditSubcategoryModal(selectedCategory, sub)}
                          className="p-1 hover:bg-brass/10 rounded transition-colors"
                          title="Edit"
                        >
                          <svg className="w-3 h-3 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSubcategory(selectedCategory._id, sub._id)}
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'New Category'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Door Handles"
          />

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
              rows={2}
              placeholder="Describe this category..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brass/20">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Compact Subcategory Modal */}
      <Modal
        isOpen={isSubcategoryModalOpen}
        onClose={() => {
          setIsSubcategoryModalOpen(false)
          setEditingSubcategory(null)
        }}
        title={editingSubcategory ? 'Edit Subcategory' : 'New Subcategory'}
        size="sm"
      >
        <form onSubmit={handleSubcategorySubmit} className="space-y-3">
          <div className="bg-brass/10 rounded p-2 border border-brass/20">
            <p className="text-[10px] text-charcoal">
              <strong>Parent:</strong> {selectedCategory?.name}
            </p>
          </div>

          <Input
            label="Name *"
            value={subcategoryFormData.name}
            onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
            required
            placeholder="e.g., Mortise Handles"
          />

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">Description</label>
            <textarea
              value={subcategoryFormData.description}
              onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, description: e.target.value })}
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
              rows={2}
              placeholder="Describe this subcategory..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brass/20">
            <Button type="button" variant="ghost" size="sm" onClick={() => {
              setIsSubcategoryModalOpen(false)
              setEditingSubcategory(null)
            }}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {editingSubcategory ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
