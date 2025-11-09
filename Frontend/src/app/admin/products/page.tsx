'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { productsApi, categoriesApi, finishesApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import type { Product, Category, Finish } from '@/types'
import Button from '@/components/ui/Button'

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [finishes, setFinishes] = useState<Finish[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search and filtering states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'productID' | 'packagingPrice'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Selected product for detail view
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      // Use Promise.allSettled to handle partial failures gracefully
      const [productsResult, categoriesResult, finishesResult] = await Promise.allSettled([
        productsApi.getAll(),
        categoriesApi.getAll(),
        finishesApi.getAll(),
      ])
      
      // Handle products
      if (productsResult.status === 'fulfilled') {
        setProducts(productsResult.value)
      } else {
        console.error('Failed to fetch products:', productsResult.reason)
      }
      
      // Handle categories
      if (categoriesResult.status === 'fulfilled') {
        setCategories(categoriesResult.value)
      } else {
        console.error('Failed to fetch categories:', categoriesResult.reason)
      }
      
      // Handle finishes
      if (finishesResult.status === 'fulfilled') {
        setFinishes(finishesResult.value)
      } else {
        console.error('Failed to fetch finishes:', finishesResult.reason)
      }
      
      // Show error only if all requests failed
      if (
        productsResult.status === 'rejected' &&
        categoriesResult.status === 'rejected' &&
        finishesResult.status === 'rejected'
      ) {
        alert('Failed to load data. Please refresh the page.')
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      alert('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getBasePrice = (product: Product) => {
    if (product.materials && product.materials.length > 0) {
      return product.materials[0].basePrice || 0
    }
    return product.packagingPrice || 0
  }

  const getFinishName = (finishId: string) => {
    const finish = finishes.find(f => f._id === finishId)
    return finish?.name || finishId
  }

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let filtered = products

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productID.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => {
        if (typeof product.category === 'string') {
          return product.category === selectedCategory
        }
        return product.category?.name === selectedCategory
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'productID':
          aValue = a.productID.toLowerCase()
          bValue = b.productID.toLowerCase()
          break
        case 'packagingPrice':
          aValue = a.packagingPrice || 0
          bValue = b.packagingPrice || 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [products, searchQuery, selectedCategory, sortBy, sortOrder])

  const openCreateModal = () => {
    router.push('/admin/products/create')
  }

  const openEditModal = (product: Product) => {
    let productId = typeof product._id === 'string' ? product._id : String(product._id)
    
    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
      console.error('Invalid product ID format:', productId)
      alert('Error: Invalid product ID format. Please refresh the page and try again.')
      return
    }
    
    router.push(`/admin/products/${productId}/edit`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await productsApi.delete(id)
      fetchData()
      if (selectedProduct?._id === id) {
        setSelectedProduct(null)
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product')
    }
  }

  const handleToggleVisibility = async (product: Product) => {
    // Default to true if undefined (existing products without the field)
    const currentVisibility = product.isVisible !== false
    const newVisibility = !currentVisibility
    const action = newVisibility ? 'show' : 'hide'
    
    try {
      await productsApi.toggleVisibility(product._id, newVisibility)
      // Update local state
      setProducts(products.map(p => 
        p._id === product._id ? { ...p, isVisible: newVisibility } : p
      ))
      // Update selected product if it's the one being toggled
      if (selectedProduct?._id === product._id) {
        setSelectedProduct({ ...selectedProduct, isVisible: newVisibility })
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error)
      alert(`Failed to ${action} product`)
    }
  }

  const totalProducts = products.length
  const filteredCount = filteredProducts.length

  if (loading && products.length === 0) {
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
      {/* Compact Header with Stats and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-lg px-3 py-2 shadow border border-brass/20 gap-2">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <h1 className="text-base sm:text-lg font-serif font-bold text-charcoal">Products</h1>
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="flex items-center gap-1 bg-brass/10 px-2 py-1 rounded">
              <svg className="w-3 h-3 text-brass" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
              </svg>
              <span className="font-semibold text-charcoal">{filteredCount}/{totalProducts}</span>
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

      {/* Compact Filters */}
      <div className="bg-white rounded-lg px-3 py-2 shadow border border-brass/20">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-2 py-1 text-xs border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
          />
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 sm:flex-none px-2 py-1 text-xs border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 sm:flex-none px-2 py-1 text-xs border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass"
            >
              <option value="name">Name</option>
              <option value="productID">ID</option>
              <option value="packagingPrice">Price</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-brass/10 rounded transition-colors"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              <svg className={`w-3 h-3 text-charcoal transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Split Pane Layout */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 overflow-hidden min-h-0">
        {/* Left Panel - Product List */}
        <div className="w-full md:w-1/2 bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden min-h-[300px] md:min-h-0">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20">
            <h2 className="text-xs font-semibold">PRODUCT LIST</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-cream/50 border-b border-brass/10">
                <tr>
                  <th className="hidden sm:table-cell px-2 py-1.5 text-left font-semibold text-charcoal text-[10px]">IMAGE</th>
                  <th className="hidden sm:table-cell px-2 py-1.5 text-left font-semibold text-charcoal text-[10px]">ID</th>
                  <th className="px-2 py-1.5 text-left font-semibold text-charcoal text-[10px]">NAME</th>
                  <th className="px-2 py-1.5 text-right font-semibold text-charcoal text-[10px]">PRICE</th>
                  <th className="px-2 py-1.5 text-right font-semibold text-charcoal text-[10px]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brass/5">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-6 text-center text-charcoal/60 text-xs">
                      No products
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr 
                      key={product._id} 
                      className={`hover:bg-brass/5 transition-colors cursor-pointer ${selectedProduct?._id === product._id ? 'bg-brass/10' : ''}`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <td className="hidden sm:table-cell px-2 py-1.5">
                        <div className="w-8 h-8 bg-cream/30 rounded overflow-hidden">
                          {product.imageURLs && Object.keys(product.imageURLs).length > 0 ? (
                            <img
                              src={Object.values(product.imageURLs)[0].url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-charcoal/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-2 py-1.5">
                        <span className="font-mono text-[10px] bg-cream px-1.5 py-0.5 rounded">{product.productID}</span>
                      </td>
                      <td className="px-2 py-1.5 font-medium text-charcoal truncate max-w-[100px] sm:max-w-[150px]">
                        <div className="flex items-center gap-1">
                          <span>{product.name}</span>
                          {product.isVisible === false && (
                            <span className="inline-flex items-center gap-0.5 bg-charcoal/10 text-charcoal/60 px-1.5 py-0.5 rounded text-[9px] font-medium" title="Hidden from customers">
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                              Hidden
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5 text-right font-semibold text-brass">{formatCurrency(getBasePrice(product))}</td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleVisibility(product)
                            }}
                            className={`p-1 rounded transition-colors ${
                              product.isVisible === false 
                                ? 'hover:bg-green-50 text-green-600' 
                                : 'hover:bg-charcoal/10 text-charcoal/60'
                            }`}
                            title={product.isVisible === false ? 'Show product' : 'Hide product from customers'}
                          >
                            {product.isVisible === false ? (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEditModal(product)
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
                              handleDelete(product._id)
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

        {/* Right Panel - Product Details */}
        <div className="w-full md:w-1/2 bg-white rounded-lg shadow border border-brass/20 flex flex-col overflow-hidden min-h-[300px] md:min-h-0">
          <div className="px-3 py-2 bg-charcoal text-ivory border-b border-brass/20 flex items-center justify-between">
            <h2 className="text-xs font-semibold">
              {selectedProduct ? 'PRODUCT DETAILS' : 'SELECT A PRODUCT'}
            </h2>
            {selectedProduct && (
              <button
                onClick={() => openEditModal(selectedProduct)}
                className="text-[10px] bg-brass text-white px-2 py-0.5 rounded hover:bg-brass/90 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {!selectedProduct ? (
              <div className="flex items-center justify-center h-full text-charcoal/40 text-xs">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p>Select a product to view details</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Product Images */}
                {selectedProduct.imageURLs && Object.keys(selectedProduct.imageURLs).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.values(selectedProduct.imageURLs).slice(0, 6).map((image, index) => (
                      <div key={index} className="aspect-square bg-cream/30 rounded overflow-hidden">
                        <img
                          src={image.url}
                          alt={`${selectedProduct.name} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="aspect-video bg-cream/30 rounded flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-8 h-8 text-charcoal/30 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-[10px] text-charcoal/60">No images</p>
                    </div>
                  </div>
                )}

                {/* Basic Info */}
                <div className="bg-brass/5 border border-brass/20 rounded p-2 space-y-1">
                  <h3 className="text-xs font-bold text-charcoal mb-2">{selectedProduct.name}</h3>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                    <span className="text-charcoal/60">Product ID:</span>
                    <span className="font-mono font-medium text-charcoal">{selectedProduct.productID}</span>
                    
                    <span className="text-charcoal/60">Category:</span>
                    <span className="font-medium text-charcoal">
                      {typeof selectedProduct.category === 'string' ? selectedProduct.category : selectedProduct.category?.name || 'N/A'}
                    </span>
                    
                    <span className="text-charcoal/60">Base Price:</span>
                    <span className="font-bold text-brass">{formatCurrency(getBasePrice(selectedProduct))}</span>
                    
                    <span className="text-charcoal/60">Packaging:</span>
                    <span className="font-medium text-charcoal">{formatCurrency(selectedProduct.packagingPrice)}</span>
                    
                    <span className="text-charcoal/60">Visibility:</span>
                    <span className={`font-medium ${selectedProduct.isVisible === false ? 'text-red-600' : 'text-green-600'}`}>
                      {selectedProduct.isVisible === false ? 'Hidden' : 'Visible to customers'}
                    </span>
                  </div>
                  {selectedProduct.description && (
                    <div className="mt-2 pt-2 border-t border-brass/20">
                      <p className="text-[10px] text-charcoal/80 leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
                    </div>
                  )}
                </div>

                {/* Materials */}
                <div>
                  <h4 className="text-xs font-semibold text-charcoal mb-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    Materials ({selectedProduct.materials?.length || 0})
                  </h4>
                  {selectedProduct.materials && selectedProduct.materials.length > 0 ? (
                    <div className="space-y-1">
                      {selectedProduct.materials.map((material, index) => (
                        <div key={index} className="bg-brass/5 border border-brass/10 rounded p-2">
                          <div className="flex justify-between items-start text-[10px]">
                            <span className="font-medium text-charcoal">{material.name}</span>
                            <span className="font-semibold text-brass">{formatCurrency(material.basePrice)}</span>
                          </div>
                          {material.sizeOptions && material.sizeOptions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {material.sizeOptions.map((size, sizeIndex) => (
                                <span key={sizeIndex} className="text-[9px] bg-brass/10 text-brass px-1.5 py-0.5 rounded">
                                  {size.sizeMM}mm (+{formatCurrency(size.additionalCost)})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-charcoal/60 italic">No materials</p>
                  )}
                </div>

                {/* Finishes */}
                <div>
                  <h4 className="text-xs font-semibold text-charcoal mb-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    Finishes ({selectedProduct.finishes?.length || 0})
                  </h4>
                  {selectedProduct.finishes && selectedProduct.finishes.length > 0 ? (
                    <div className="space-y-1">
                      {selectedProduct.finishes.map((finish, index) => (
                        <div key={index} className="bg-olive/5 border border-olive/10 rounded p-2 flex justify-between items-center text-[10px]">
                          <span className="font-medium text-charcoal">{getFinishName(finish.finishID)}</span>
                          <span className="font-semibold text-olive">
                            {finish.priceAdjustment >= 0 ? '+' : ''}{formatCurrency(finish.priceAdjustment)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-charcoal/60 italic">No finishes</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
