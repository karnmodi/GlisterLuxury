'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { productsApi, categoriesApi, finishesApi } from '@/lib/api'
import { toNumber, formatCurrency } from '@/lib/utils'
import type { Product, Category, Finish } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [finishes, setFinishes] = useState<Finish[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search and filtering states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedFinish, setSelectedFinish] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'productID' | 'packagingPrice' | 'createdAt'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // Quick view modal states
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // Helper function to get base price from materials
  const getBasePrice = (product: Product) => {
    if (product.materials && product.materials.length > 0) {
      return product.materials[0].basePrice || 0
    }
    return product.packagingPrice || 0
  }

  // Helper function to get finish name by ID
  const getFinishName = (finishId: string) => {
    const finish = finishes.find(f => f._id === finishId)
    return finish?.name || finishId
  }

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

    // Finish filter
    if (selectedFinish) {
      filtered = filtered.filter(product => 
        product.finishes?.some(finish => {
          if (typeof finish === 'string') {
            return finish === selectedFinish
          }
          // Check if the finish ID matches or if the finish name matches
          const finishName = getFinishName(finish.finishID)
          return finish.finishID === selectedFinish || finishName === selectedFinish
        })
      )
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
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime()
          bValue = new Date(b.createdAt || 0).getTime()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [products, searchQuery, selectedCategory, selectedFinish, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  const handleSearch = async () => {
    try {
      setLoading(true)
      const results = await productsApi.getAll({ q: searchQuery })
      setProducts(results)
      setCurrentPage(1) // Reset to first page
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    // Navigate to create page instead of opening modal
    router.push('/admin/products/create')
  }

  const openEditModal = (product: Product) => {
    // Navigate to edit page instead of opening modal
    console.log('Product object:', product)
    console.log('Product._id:', product._id)
    console.log('Product._id type:', typeof product._id)
    
    // Ensure we have a valid string ID
    let productId = ''
    
    if (typeof product._id === 'string') {
      productId = product._id
    } else {
      productId = String(product._id)
    }
    
    console.log('Navigating to product ID:', productId)
    
    // Validate that it looks like a MongoDB ObjectId
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
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product')
    }
  }

  const openQuickView = (product: Product) => {
    setSelectedProduct(product)
    setIsQuickViewOpen(true)
  }




  // Calculate stats
  const totalProducts = products.length
  const filteredCount = filteredProducts.length
  const productsWithImages = products.filter(p => p.imageURLs && Object.keys(p.imageURLs).length > 0).length
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
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-white to-cream/50 rounded-xl p-6 shadow-lg border border-brass/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-serif font-bold text-charcoal mb-2">Product Catalog</h1>
            <p className="text-charcoal/60">Manage your luxury product collection</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={openCreateModal} size="lg" className="shadow-lg hover:shadow-xl">
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-md border border-brass/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60 font-medium">Total Products</p>
              <p className="text-2xl font-bold text-charcoal">{totalProducts}</p>
            </div>
            <div className="w-10 h-10 bg-brass/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-brass/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60 font-medium">Filtered</p>
              <p className="text-2xl font-bold text-charcoal">{filteredCount}</p>
            </div>
            <div className="w-10 h-10 bg-olive/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-brass/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60 font-medium">With Images</p>
              <p className="text-2xl font-bold text-charcoal">{productsWithImages}</p>
            </div>
            <div className="w-10 h-10 bg-charcoal/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-md border border-brass/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60 font-medium">With Finishes</p>
              <p className="text-2xl font-bold text-charcoal">{productsWithFinishes}</p>
            </div>
            <div className="w-10 h-10 bg-brass/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-brass/20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-charcoal mb-2">Search Products</label>
            <div className="flex gap-2">
          <Input
                placeholder="Search by name, ID, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
              <Button onClick={handleSearch} variant="secondary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-brass/30 rounded-lg focus:ring-2 focus:ring-brass/50 focus:border-brass"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Finish Filter */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Finish</label>
            <select
              value={selectedFinish}
              onChange={(e) => setSelectedFinish(e.target.value)}
              className="w-full px-3 py-2 border border-brass/30 rounded-lg focus:ring-2 focus:ring-brass/50 focus:border-brass"
            >
              <option value="">All Finishes</option>
              {finishes.map(finish => (
                <option key={finish._id} value={finish.name}>
                  {finish.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort and View Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-charcoal">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-brass/30 rounded-lg focus:ring-2 focus:ring-brass/50 focus:border-brass"
              >
                <option value="name">Name</option>
                <option value="productID">Product ID</option>
                <option value="packagingPrice">Price</option>
                <option value="createdAt">Date Created</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-brass/10 rounded-lg transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <svg className={`w-4 h-4 text-charcoal transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-charcoal">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-1 border border-brass/30 rounded-lg focus:ring-2 focus:ring-brass/50 focus:border-brass"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
        </div>
      </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-charcoal">View:</span>
            <div className="flex border border-brass/30 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-brass text-white' : 'bg-white text-charcoal hover:bg-brass/10'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-brass text-white' : 'bg-white text-charcoal hover:bg-brass/10'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      {paginatedProducts.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-lg border border-brass/20 text-center">
          <div className="w-16 h-16 bg-brass/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">No products found</h3>
          <p className="text-charcoal/60 mb-4">Try adjusting your search or filter criteria</p>
          <Button onClick={() => { setSearchQuery(''); setSelectedCategory(''); setSelectedFinish(''); }} variant="secondary">
            Clear Filters
              </Button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              {paginatedProducts.map((product) => (
                <div key={product._id} className="bg-white rounded-xl shadow-lg border border-brass/20 overflow-hidden hover:shadow-xl transition-shadow cursor-pointer" onClick={() => openQuickView(product)}>
                  {/* Product Image */}
                  <div className="aspect-square bg-cream/30 relative overflow-hidden">
                    {product.imageURLs && Object.keys(product.imageURLs).length > 0 ? (
                      <img
                        src={Object.values(product.imageURLs)[0].url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-charcoal/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <div className="mb-2">
                      <h3 className="font-semibold text-charcoal text-xs mb-1">{product.productID}</h3>
                      <h4 className="font-medium text-charcoal text-sm line-clamp-2 leading-tight">{product.name}</h4>
                    </div>

                    <div className="space-y-1 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-charcoal/60">Price:</span>
                        <span className="font-semibold text-brass text-xs">{formatCurrency(getBasePrice(product))}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-charcoal/60">Materials:</span>
                        <span className="bg-brass/10 text-brass px-1.5 py-0.5 rounded-full text-xs">
                          {product.materials?.length || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-charcoal/60">Finishes:</span>
                        <span className="bg-olive/10 text-olive px-1.5 py-0.5 rounded-full text-xs">
                          {product.finishes?.length || 0}
                        </span>
                      </div>
                    </div>

                    {/* Modern Action Buttons */}
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(product)
                        }}
                        className="flex-1 bg-gradient-to-r from-brass to-brass/90 text-white px-3 py-2 rounded-lg text-xs font-medium hover:from-brass/90 hover:to-brass/80 transition-all duration-200 flex items-center justify-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(product._id)
                        }}
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center justify-center"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
      <div className="bg-white rounded-xl shadow-lg border border-brass/20 overflow-hidden">
              <div className="divide-y divide-brass/10">
                {paginatedProducts.map((product) => (
                  <div key={product._id} className="p-4 hover:bg-brass/5 transition-colors cursor-pointer" onClick={() => openQuickView(product)}>
                    <div className="flex items-center gap-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-cream/30 rounded-lg overflow-hidden flex-shrink-0">
                        {product.imageURLs && Object.keys(product.imageURLs).length > 0 ? (
                          <img
                            src={Object.values(product.imageURLs)[0].url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-charcoal/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-charcoal text-sm">{product.productID}</h3>
                              <span className="text-charcoal/40">•</span>
                              <span className="text-xs text-charcoal/60">
                                {typeof product.category === 'string' ? product.category : product.category?.name || 'N/A'}
                              </span>
                            </div>
                            <h4 className="font-medium text-charcoal text-base mb-2 line-clamp-1">{product.name}</h4>
                            <div className="flex items-center gap-4 text-xs text-charcoal/60">
                              <span className="bg-brass/10 text-brass px-2 py-0.5 rounded-full">
                                {product.materials?.length || 0} materials
                              </span>
                              <span className="bg-olive/10 text-olive px-2 py-0.5 rounded-full">
                                {product.finishes?.length || 0} finishes
                              </span>
                              <span className="font-semibold text-brass">{formatCurrency(getBasePrice(product))}</span>
                            </div>
                          </div>

                          {/* Modern Action Buttons */}
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                openEditModal(product)
                              }}
                              className="bg-gradient-to-r from-brass to-brass/90 text-white px-3 py-2 rounded-lg text-xs font-medium hover:from-brass/90 hover:to-brass/80 transition-all duration-200 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(product._id)
                              }}
                              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-xl p-4 shadow-lg border border-brass/20">
              <div className="flex items-center justify-between">
                <div className="text-sm text-charcoal/60">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-brass text-white'
                              : 'text-charcoal hover:bg-brass/10'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    {totalPages > 5 && (
                      <>
                        <span className="text-charcoal/40">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === totalPages
                              ? 'bg-brass text-white'
                              : 'text-charcoal hover:bg-brass/10'
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating Add Button - Mobile */}
      <div className="sm:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={openCreateModal}
          className="w-14 h-14 bg-gradient-to-r from-brass to-brass/90 text-white rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
          title="Add New Product"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Quick View Modal */}
      {isQuickViewOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-brass/20 p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-charcoal">{selectedProduct.name}</h2>
                  <p className="text-charcoal/60 mt-1">Product ID: {selectedProduct.productID}</p>
                </div>
                <button
                  onClick={() => setIsQuickViewOpen(false)}
                  className="p-2 hover:bg-brass/10 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Product Images */}
              {selectedProduct.imageURLs && Object.keys(selectedProduct.imageURLs).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.values(selectedProduct.imageURLs).map((image, index) => (
                    <div key={index} className="aspect-square bg-cream/30 rounded-lg overflow-hidden">
                      <img
                        src={image.url}
                        alt={`${selectedProduct.name} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aspect-video bg-cream/30 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-charcoal/30 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-charcoal/60">No images available</p>
                  </div>
                </div>
              )}

              {/* Product Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-charcoal mb-3">Basic Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">Product ID:</span>
                        <span className="font-medium text-charcoal">{selectedProduct.productID}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">Category:</span>
                        <span className="font-medium text-charcoal">
                          {typeof selectedProduct.category === 'string' ? selectedProduct.category : selectedProduct.category?.name || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">Base Price:</span>
                        <span className="font-semibold text-brass text-lg">{formatCurrency(getBasePrice(selectedProduct))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal/60">Packaging Price:</span>
                        <span className="font-medium text-charcoal">{formatCurrency(selectedProduct.packagingPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedProduct.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-charcoal mb-3">Description</h3>
                      <p className="text-charcoal/80 leading-relaxed">{selectedProduct.description}</p>
                    </div>
                  )}
                </div>

                {/* Materials and Finishes */}
                <div className="space-y-4">
                  {/* Materials */}
                  <div>
                    <h3 className="text-lg font-semibold text-charcoal mb-3">Materials ({selectedProduct.materials?.length || 0})</h3>
                    {selectedProduct.materials && selectedProduct.materials.length > 0 ? (
                      <div className="space-y-2">
                        {selectedProduct.materials.map((material, index) => (
                          <div key={index} className="bg-brass/5 border border-brass/20 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-charcoal">{material.name}</p>
                                <p className="text-sm text-charcoal/60">Base Price: {formatCurrency(material.basePrice)}</p>
                              </div>
                            </div>
                            {material.sizeOptions && material.sizeOptions.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-charcoal/60 mb-1">Size Options:</p>
                                <div className="flex flex-wrap gap-1">
                                  {material.sizeOptions.map((size, sizeIndex) => (
                                    <span key={sizeIndex} className="text-xs bg-brass/10 text-brass px-2 py-1 rounded">
                                      {size.sizeMM}mm (+{formatCurrency(size.additionalCost)})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-charcoal/60 italic">No materials configured</p>
                    )}
                  </div>

                  {/* Finishes */}
                  <div>
                    <h3 className="text-lg font-semibold text-charcoal mb-3">Finishes ({selectedProduct.finishes?.length || 0})</h3>
                    {selectedProduct.finishes && selectedProduct.finishes.length > 0 ? (
                      <div className="space-y-2">
                        {selectedProduct.finishes.map((finish, index) => (
                          <div key={index} className="bg-olive/5 border border-olive/20 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-charcoal">{getFinishName(finish.finishID)}</p>
                                <p className="text-sm text-charcoal/60">
                                  Price Adjustment: {finish.priceAdjustment >= 0 ? '+' : ''}{formatCurrency(finish.priceAdjustment)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-charcoal/60 italic">No finishes configured</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-brass/20">
                <button
                  onClick={() => openEditModal(selectedProduct)}
                  className="flex-1 bg-gradient-to-r from-brass to-brass/90 text-white px-6 py-3 rounded-lg font-medium hover:from-brass/90 hover:to-brass/80 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Product
                </button>
                <button
                  onClick={() => setIsQuickViewOpen(false)}
                  className="px-6 py-3 border border-brass/30 text-charcoal rounded-lg font-medium hover:bg-brass/5 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          </div>
        )}

    </div>
  )
}
