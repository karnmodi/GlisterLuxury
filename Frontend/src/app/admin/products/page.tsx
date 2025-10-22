'use client'

import { useState, useEffect } from 'react'
import { productsApi, categoriesApi, finishesApi } from '@/lib/api'
import { toNumber, formatCurrency } from '@/lib/utils'
import type { Product, Category, Finish } from '@/types'
import DataTable from '@/components/ui/DataTable'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [finishes, setFinishes] = useState<Finish[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
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
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct._id, formData)
      } else {
        await productsApi.create(formData)
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
      header: 'Materials',
      accessor: (item: Product) => `${item.materials?.length || 0} variants`,
    },
    {
      header: 'Packaging Price',
      accessor: (item: Product) => formatCurrency(item.packagingPrice),
    },
  ]

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-charcoal/60">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal">Products</h1>
          <p className="text-charcoal/60 mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={openCreateModal}>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </span>
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search products by ID, name, or UID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} variant="secondary">
          Search
        </Button>
        {searchQuery && (
          <Button onClick={() => { setSearchQuery(''); fetchData(); }} variant="ghost">
            Clear
          </Button>
        )}
      </div>

      {/* Products Table */}
      <DataTable
        data={products}
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
        title={editingProduct ? 'Edit Product' : 'Create Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

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
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingProduct ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

