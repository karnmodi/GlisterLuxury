'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { collectionsApi, productsApi, categoriesApi } from '@/lib/api'
import type { Collection, Product, Category } from '@/types'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function AdminCollectionsPage() {
  const { token } = useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [productFilterCategory, setProductFilterCategory] = useState<string>('')
  const [productFilterSubcategory, setProductFilterSubcategory] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    displayOrder: 0,
  })

  useEffect(() => {
    if (token) {
      fetchCollections()
      fetchProducts()
      fetchCategories()
    }
  }, [token])

  const fetchCollections = async () => {
    try {
      setLoading(true)
      const data = await collectionsApi.getAll({ includeProductCount: true })
      if (data && Array.isArray(data)) {
        setCollections(data.sort((a, b) => a.displayOrder - b.displayOrder))
      } else {
        setCollections([])
      }
    } catch (error) {
      console.error('Failed to fetch collections:', error)
      alert('Failed to load collections')
      setCollections([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const data = await productsApi.getAll()
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.getAll()
      setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const openCreateModal = () => {
    setEditingCollection(null)
    setFormData({ name: '', description: '', isActive: true, displayOrder: 0 })
    setIsModalOpen(true)
  }

  const openEditModal = (collection: Collection) => {
    setEditingCollection(collection)
    setFormData({
      name: collection.name,
      description: collection.description || '',
      isActive: collection.isActive,
      displayOrder: collection.displayOrder,
    })
    setIsModalOpen(true)
  }

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection)
    setSelectedProductIds(
      Array.isArray(collection.products)
        ? collection.products.map(p => typeof p === 'string' ? p : p._id)
        : []
    )
    setSearchQuery('')
    setProductFilterCategory('')
    setProductFilterSubcategory('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      if (editingCollection) {
        await collectionsApi.update(editingCollection._id, formData, token)
      } else {
        await collectionsApi.create(formData, token)
      }
      setIsModalOpen(false)
      fetchCollections()
    } catch (error) {
      console.error('Failed to save collection:', error)
      alert('Failed to save collection')
    }
  }

  const handleDelete = async (id: string) => {
    if (!token) return
    if (!confirm('Are you sure you want to delete this collection?')) return

    try {
      await collectionsApi.delete(id, token)
      fetchCollections()
    } catch (error) {
      console.error('Failed to delete collection:', error)
      alert('Failed to delete collection')
    }
  }

  const handleToggleActive = async (collection: Collection) => {
    if (!token) return

    try {
      await collectionsApi.update(
        collection._id,
        { isActive: !collection.isActive },
        token
      )
      fetchCollections()
    } catch (error) {
      console.error('Failed to update collection:', error)
      alert('Failed to update collection')
    }
  }

  const handleSaveProducts = async () => {
    if (!token || !selectedCollection) return

    try {
      setIsSaving(true)
      const currentProductIds = Array.isArray(selectedCollection.products)
        ? selectedCollection.products.map(p => typeof p === 'string' ? p : p._id)
        : []

      const toAdd = selectedProductIds.filter(id => !currentProductIds.includes(id))
      const toRemove = currentProductIds.filter(id => !selectedProductIds.includes(id))

      if (toAdd.length > 0) {
        await collectionsApi.addProducts(selectedCollection._id, toAdd, token)
      }
      if (toRemove.length > 0) {
        await collectionsApi.removeProducts(selectedCollection._id, toRemove, token)
      }

      await fetchCollections()
      
      // Update selected collection with fresh data
      const updatedCollections = await collectionsApi.getAll({ includeProductCount: true })
      const updatedCollection = updatedCollections.find(c => c._id === selectedCollection._id)
      if (updatedCollection) {
        setSelectedCollection(updatedCollection)
        setSelectedProductIds(
          Array.isArray(updatedCollection.products)
            ? updatedCollection.products.map(p => typeof p === 'string' ? p : p._id)
            : []
        )
      }
    } catch (error) {
      console.error('Failed to update products:', error)
      alert('Failed to update products')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  // Get available subcategories for selected category
  const availableSubcategories = useMemo(() => {
    if (!productFilterCategory) return []
    const category = categories.find(c => c._id === productFilterCategory)
    return category?.subcategories || []
  }, [productFilterCategory, categories])

  // Filter products based on search, category, and subcategory
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productID.toLowerCase().includes(searchQuery.toLowerCase())

      // Category filter
      const productCategoryId = typeof product.category === 'string' 
        ? product.category 
        : product.category?._id
      const matchesCategory = !productFilterCategory || productCategoryId === productFilterCategory

      // Subcategory filter
      const matchesSubcategory = !productFilterSubcategory || product.subcategoryId === productFilterSubcategory

      return matchesSearch && matchesCategory && matchesSubcategory
    })
  }, [products, searchQuery, productFilterCategory, productFilterSubcategory])

  // Get product count per category for display
  const categoryProductCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    products.forEach(product => {
      const categoryId = typeof product.category === 'string' 
        ? product.category 
        : product.category?._id
      if (categoryId) {
        counts[categoryId] = (counts[categoryId] || 0) + 1
      }
    })
    return counts
  }, [products])

  const totalCollections = collections.length
  const activeCollections = collections.filter(c => c.isActive).length
  const totalProducts = collections.reduce((sum, c) => sum + (c.productCount || 0), 0)

  if (loading && collections.length === 0) {
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
          <h1 className="text-base sm:text-lg font-serif font-bold text-charcoal">Collections</h1>
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="flex items-center gap-1 bg-brass/10 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-brass" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <span className="font-semibold text-charcoal">{totalCollections}</span>
            </span>
            <span className="flex items-center gap-1 bg-olive/10 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-olive" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
              <span className="font-semibold text-charcoal">{activeCollections} active</span>
            </span>
            <span className="flex items-center gap-1 bg-charcoal/10 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-charcoal" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              <span className="font-semibold text-charcoal">{totalProducts} products</span>
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
        {/* Left Panel - Collections */}
        <div className="w-full md:w-1/2 bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden min-h-[300px] md:min-h-0">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20">
            <h2 className="text-xs font-semibold">COLLECTIONS</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-cream/50 border-b border-brass/10">
                <tr>
                  <th className="px-2 py-1.5 text-left font-semibold text-charcoal text-[10px]">NAME</th>
                  <th className="hidden sm:table-cell px-2 py-1.5 text-left font-semibold text-charcoal text-[10px]">SLUG</th>
                  <th className="px-2 py-1.5 text-center font-semibold text-charcoal text-[10px]">PRODUCTS</th>
                  <th className="px-2 py-1.5 text-center font-semibold text-charcoal text-[10px]">ORDER</th>
                  <th className="px-2 py-1.5 text-center font-semibold text-charcoal text-[10px]">STATUS</th>
                  <th className="px-2 py-1.5 text-right font-semibold text-charcoal text-[10px]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brass/5">
                {collections.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-6 text-center text-charcoal/60 text-xs">
                      No collections
                    </td>
                  </tr>
                ) : (
                  collections.map((collection) => (
                    <tr 
                      key={collection._id} 
                      className={`hover:bg-brass/5 transition-colors cursor-pointer ${selectedCollection?._id === collection._id ? 'bg-brass/10' : ''}`}
                      onClick={() => handleSelectCollection(collection)}
                    >
                      <td className="px-2 py-1.5 font-medium text-charcoal">{collection.name}</td>
                      <td className="hidden sm:table-cell px-2 py-1.5">
                        <span className="font-mono text-[10px] bg-cream px-1.5 py-0.5 rounded">{collection.slug}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-brass/20 text-brass">
                          {collection.productCount || 0}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <span className="text-[10px] text-charcoal/60">{collection.displayOrder}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleActive(collection)
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                            collection.isActive
                              ? 'bg-olive/20 text-olive'
                              : 'bg-charcoal/20 text-charcoal/60'
                          }`}
                        >
                          {collection.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(collection)
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
                              handleDelete(collection._id)
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

        {/* Right Panel - Products */}
        <div className="w-full md:w-1/2 bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden min-h-[300px] md:min-h-0">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between">
            <h2 className="text-xs font-semibold">
              {selectedCollection ? `${selectedCollection.name.toUpperCase()} - PRODUCTS` : 'SELECT A COLLECTION'}
            </h2>
            {selectedCollection && (
              <button
                onClick={handleSaveProducts}
                disabled={isSaving}
                className="text-[10px] bg-brass text-white px-2 py-0.5 rounded hover:bg-brass/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isSaving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedCollection ? (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <p>Select a collection to manage products</p>
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {/* Filters */}
                <div className="space-y-2">
                  <Input
                    label="Search Products"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or ID..."
                  />

                  {/* Category Filter */}
                  <div>
                    <label className="block text-xs font-medium text-charcoal mb-1">
                      Filter by Category
                    </label>
                    <select
                      value={productFilterCategory}
                      onChange={(e) => {
                        setProductFilterCategory(e.target.value)
                        setProductFilterSubcategory('')
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name} ({categoryProductCounts[cat._id] || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subcategory Filter */}
                  {productFilterCategory && availableSubcategories.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-charcoal mb-1">
                        Filter by Subcategory
                      </label>
                      <select
                        value={productFilterSubcategory}
                        onChange={(e) => setProductFilterSubcategory(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all"
                      >
                        <option value="">All Subcategories</option>
                        {availableSubcategories.map((sub: any) => (
                          <option key={sub._id} value={sub._id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Products List */}
                <div className="border border-brass/20 rounded max-h-96 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-charcoal/60 text-xs">
                        No products found
                      </div>
                    ) : (
                      filteredProducts.map((product) => {
                        const isSelected = selectedProductIds.includes(product._id)
                        return (
                          <label
                            key={product._id}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                              isSelected ? 'bg-brass/10 border border-brass/30' : 'hover:bg-cream/30 border border-transparent'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleProductSelection(product._id)}
                              className="w-4 h-4 text-brass border-brass/30 rounded focus:ring-brass"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-charcoal truncate">{product.name}</p>
                              <p className="text-[10px] text-charcoal/60 font-mono">{product.productID}</p>
                            </div>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Selection Count */}
                <div className="flex items-center justify-between pt-2 border-t border-brass/20">
                  <span className="text-xs text-charcoal/60">
                    {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Collection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCollection ? 'Edit Collection' : 'New Collection'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Trending New"
          />

          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass resize-y"
              rows={4}
              placeholder="Describe this collection...&#10;&#10;Line breaks will be preserved in the display."
              style={{ minHeight: '80px' }}
            />
            <p className="text-[9px] text-charcoal/60 mt-1">
              Press Enter to create new lines. Formatting will be preserved.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Display Order</label>
              <Input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                min="0"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-brass border-brass/30 rounded focus:ring-brass"
                />
                <span className="text-xs text-charcoal">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-brass/20">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {editingCollection ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}

