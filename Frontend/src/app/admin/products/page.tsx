'use client'

import { useState, useEffect } from 'react'
import { productsApi, categoriesApi, finishesApi } from '@/lib/api'
import { toNumber, formatCurrency } from '@/lib/utils'
import type { Product, Category, Finish } from '@/types'
import DataTable from '@/components/ui/DataTable'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import ImageUpload from '@/components/ui/ImageUpload'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [finishes, setFinishes] = useState<Finish[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [managingImagesProduct, setManagingImagesProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState({
    productID: '',
    productUID: '',
    name: '',
    description: '',
    category: '',
    packagingPrice: 0,
    packagingUnit: 'Set',
  })

  const [selectedFinishes, setSelectedFinishes] = useState<Array<{finishID: string, priceAdjustment: number}>>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [productsData, categoriesData, finishesData] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
        finishesApi.getAll(),
      ])
      setProducts(productsData)
      setCategories(categoriesData)
      setFinishes(finishesData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      alert('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const results = await productsApi.getAll({ q: searchQuery })
      setProducts(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingProduct(null)
    setFormData({
      productID: '',
      productUID: '',
      name: '',
      description: '',
      category: '',
      packagingPrice: 0,
      packagingUnit: 'Set',
    })
    setSelectedFinishes([])
    setIsModalOpen(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      productID: product.productID,
      productUID: product.productUID || '',
      name: product.name,
      description: product.description || '',
      category: typeof product.category === 'string' ? product.category : product.category?._id || '',
      packagingPrice: toNumber(product.packagingPrice),
      packagingUnit: product.packagingUnit,
    })
    setSelectedFinishes(product.finishes || [])
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        finishes: selectedFinishes
      }
      
      if (editingProduct) {
        await productsApi.update(editingProduct._id, submitData)
      } else {
        await productsApi.create(submitData)
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Failed to save product:', error)
      alert('Failed to save product')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await productsApi.delete(id)
      fetchData()
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product')
    }
  }

  const openImageModal = (product: Product) => {
    setManagingImagesProduct(product)
    setIsImageModalOpen(true)
  }

  const handleImageUpload = async (files: File[]) => {
    if (!managingImagesProduct) return
    
    try {
      const result = await productsApi.uploadImages(managingImagesProduct._id, files)
      setManagingImagesProduct(result.product)
      fetchData()
    } catch (error) {
      throw error
    }
  }

  const handleImageDelete = async (imageUrl: string) => {
    if (!managingImagesProduct) return
    
    try {
      const result = await productsApi.deleteImage(managingImagesProduct._id, imageUrl)
      setManagingImagesProduct(result.product)
      fetchData()
    } catch (error) {
      throw error
    }
  }

  const toggleFinish = (finishID: string) => {
    const exists = selectedFinishes.find(f => f.finishID === finishID)
    if (exists) {
      setSelectedFinishes(selectedFinishes.filter(f => f.finishID !== finishID))
    } else {
      setSelectedFinishes([...selectedFinishes, { finishID, priceAdjustment: 0 }])
    }
  }

  const updateFinishPrice = (finishID: string, priceAdjustment: number) => {
    setSelectedFinishes(selectedFinishes.map(f => 
      f.finishID === finishID ? { ...f, priceAdjustment } : f
    ))
  }

  const columns = [
    { header: 'Product ID', accessor: 'productID' as keyof Product },
    { header: 'Name', accessor: 'name' as keyof Product },
    {
      header: 'Category',
      accessor: (item: Product) => {
        if (!item.category) return 'N/A'
        return typeof item.category === 'string' ? item.category : item.category.name
      },
    },
    {
      header: 'Images',
      accessor: (item: Product) => (
        <div className="flex items-center gap-2">
          {item.imageURLs && item.imageURLs.length > 0 ? (
            <>
              <img 
                src={item.imageURLs[0]} 
                alt={item.name}
                className="w-12 h-12 object-cover rounded-lg border-2 border-brass/30 shadow-sm"
              />
              <span className="text-xs text-charcoal/60 bg-cream px-2 py-1 rounded-full">
                {item.imageURLs.length} {item.imageURLs.length !== 1 ? 'images' : 'image'}
              </span>
            </>
          ) : (
            <span className="text-xs text-charcoal/40 italic">No images</span>
          )}
        </div>
      ),
    },
    {
      header: 'Materials',
      accessor: (item: Product) => (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brass/10 text-brass border border-brass/20">
          {item.materials?.length || 0} variants
        </span>
      ),
    },
    {
      header: 'Finishes',
      accessor: (item: Product) => (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-olive/10 text-olive border border-olive/20">
          {item.finishes?.length || 0} options
        </span>
      ),
    },
    {
      header: 'Packaging Price',
      accessor: (item: Product) => (
        <span className="font-semibold text-charcoal">{formatCurrency(item.packagingPrice)}</span>
      ),
    },
  ]

  // Calculate stats
  const totalProducts = products.length
  const productsWithImages = products.filter(p => p.imageURLs && p.imageURLs.length > 0).length
  const productsWithFinishes = products.filter(p => p.finishes && p.finishes.length > 0).length

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brass border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-charcoal/60 text-lg">Loading products...</div>
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
              <p className="text-sm text-charcoal/60 font-medium mb-1">Total Products</p>
              <p className="text-3xl font-bold text-charcoal">{totalProducts}</p>
            </div>
            <div className="w-14 h-14 bg-brass/20 rounded-xl flex items-center justify-center">
              <svg className="w-8 h-8 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-cream/30 rounded-xl p-6 shadow-lg border border-brass/20 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60 font-medium mb-1">With Images</p>
              <p className="text-3xl font-bold text-charcoal">{productsWithImages}</p>
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
              <p className="text-sm text-charcoal/60 font-medium mb-1">With Finishes</p>
              <p className="text-3xl font-bold text-charcoal">{productsWithFinishes}</p>
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
          <h1 className="text-4xl font-serif font-bold text-charcoal mb-2">Products</h1>
          <p className="text-charcoal/60">Manage your product catalog with ease</p>
        </div>
        <Button onClick={openCreateModal} size="lg" className="shadow-lg hover:shadow-xl">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Product
          </span>
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-6 shadow-md border border-brass/20">
        <div className="flex gap-4">
          <Input
            placeholder="Search products by ID, name, or UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} variant="secondary" className="min-w-[120px]">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </span>
          </Button>
          {searchQuery && (
            <Button onClick={() => { setSearchQuery(''); fetchData(); }} variant="ghost">
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-lg border border-brass/20 overflow-hidden">
        <DataTable
          data={products}
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
          setManagingImagesProduct(null)
        }}
        title={`Manage Images: ${managingImagesProduct?.name || ''}`}
        size="lg"
      >
        {managingImagesProduct && (
          <div className="space-y-4">
            <div className="bg-cream/50 p-4 rounded-lg border border-brass/20">
              <p className="text-sm text-charcoal/80">
                <strong>Product ID:</strong> {managingImagesProduct.productID}
              </p>
              <p className="text-sm text-charcoal/80 mt-1">
                <strong>Product Name:</strong> {managingImagesProduct.name}
              </p>
            </div>
            
            <ImageUpload
              images={managingImagesProduct.imageURLs || []}
              onUpload={handleImageUpload}
              onDelete={handleImageDelete}
              multiple={true}
              maxImages={10}
            />
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Create New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="bg-cream/30 rounded-lg p-4 border border-brass/10">
            <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Product ID *"
                value={formData.productID}
                onChange={(e) => setFormData({ ...formData, productID: e.target.value })}
                required
                disabled={!!editingProduct}
              />
              <Input
                label="Product UID"
                value={formData.productUID}
                onChange={(e) => setFormData({ ...formData, productUID: e.target.value })}
              />
            </div>

            <Input
              label="Product Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="mt-4"
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-charcoal mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
                rows={3}
                placeholder="Describe your product..."
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-charcoal mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Packaging Section */}
          <div className="bg-cream/30 rounded-lg p-4 border border-brass/10">
            <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Packaging Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Packaging Price"
                type="number"
                step="0.01"
                value={formData.packagingPrice}
                onChange={(e) => setFormData({ ...formData, packagingPrice: parseFloat(e.target.value) })}
              />
              <Input
                label="Packaging Unit"
                value={formData.packagingUnit}
                onChange={(e) => setFormData({ ...formData, packagingUnit: e.target.value })}
                placeholder="e.g., Set, Box, Piece"
              />
            </div>
          </div>

          {/* Finishes Section */}
          <div className="bg-cream/30 rounded-lg p-4 border border-brass/10">
            <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Available Finishes
            </h3>
            <p className="text-sm text-charcoal/60 mb-4">Select finishes available for this product and set price adjustments</p>
            
            {finishes.length === 0 ? (
              <p className="text-sm text-charcoal/40 italic text-center py-8">No finishes available. Create finishes first.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {finishes.map((finish) => {
                  const isSelected = selectedFinishes.find(f => f.finishID === finish._id)
                  return (
                    <div
                      key={finish._id}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-brass bg-brass/5'
                          : 'border-brass/20 hover:border-brass/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => toggleFinish(finish._id)}
                          className="w-5 h-5 rounded border-brass/30 text-brass focus:ring-brass"
                        />
                        {finish.photoURL && (
                          <img
                            src={finish.photoURL}
                            alt={finish.name}
                            className="w-12 h-12 object-cover rounded-lg border border-brass/30"
                          />
                        )}
                        {finish.color && !finish.photoURL && (
                          <div
                            className="w-12 h-12 rounded-lg border border-brass/30"
                            style={{ backgroundColor: finish.color }}
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-charcoal">{finish.name}</p>
                          {finish.description && (
                            <p className="text-xs text-charcoal/60">{finish.description}</p>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-charcoal whitespace-nowrap">Price Adjustment:</label>
                          <Input
                            type="number"
                            step="0.01"
                            value={isSelected.priceAdjustment}
                            onChange={(e) => updateFinishPrice(finish._id, parseFloat(e.target.value))}
                            className="w-32"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {selectedFinishes.length > 0 && (
              <div className="mt-4 p-3 bg-brass/10 rounded-lg border border-brass/20">
                <p className="text-sm font-medium text-charcoal">
                  <span className="text-brass">{selectedFinishes.length}</span> finish{selectedFinishes.length !== 1 ? 'es' : ''} selected
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-brass/20">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="min-w-[150px]">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
