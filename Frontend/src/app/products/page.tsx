'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { productsApi, categoriesApi, finishesApi } from '@/lib/api'
import type { Product, Category, Finish } from '@/types'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [finishes, setFinishes] = useState<Finish[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [activeSubcategory, setActiveSubcategory] = useState<{ _id: string; name: string; slug: string } | null>(null)

  // Read URL params on mount
  useEffect(() => {
    const categorySlug = searchParams.get('category')
    const subcategorySlug = searchParams.get('subcategory')

    if (categorySlug || subcategorySlug) {
      // Store slugs to use after categories are loaded
      setSelectedCategory(categorySlug || '')
      setSelectedSubcategory(subcategorySlug || '')
    }
  }, [searchParams])

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
      setCategories(categoriesData)
      setFinishes(finishesData)

      // After categories load, resolve category/subcategory from URL params
      const categorySlug = searchParams.get('category')
      const subcategorySlug = searchParams.get('subcategory')

      if (categorySlug) {
        const category = categoriesData.find((c: Category) => c.slug === categorySlug)
        if (category) {
          setActiveCategory(category)
          setSelectedCategory(category._id)

          if (subcategorySlug && category.subcategories) {
            const subcategory = category.subcategories.find((s: any) => s.slug === subcategorySlug)
            if (subcategory) {
              setActiveSubcategory(subcategory)
              setSelectedSubcategory(subcategory._id)
            }
          }
        }
      }

      // Filter products based on URL params
      if (categorySlug || subcategorySlug) {
        await handleSearch()
      } else {
        setProducts(productsData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (searchQuery) params.q = searchQuery
      if (selectedCategory) params.category = selectedCategory
      if (selectedSubcategory) params.subcategory = selectedSubcategory
      const results = await productsApi.getAll(params)
      setProducts(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedSubcategory('')
    setActiveCategory(null)
    setActiveSubcategory(null)
    router.push('/products')
    fetchData()
  }

  // Update active category when selection changes
  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(c => c._id === selectedCategory)
      setActiveCategory(category || null)
    } else {
      setActiveCategory(null)
    }
  }, [selectedCategory, categories])

  // Get available subcategories based on selected category
  const availableSubcategories = activeCategory?.subcategories || []

  // Get the default image (mappedFinishID: null)
  const getDefaultImage = (product: Product) => {
    const images = Object.values(product.imageURLs || {})
    const defaultImage = images.find(img => img.mappedFinishID === null)
    return defaultImage?.url || images[0]?.url
  }

  // Get the first finish-specific image for hover effect
  const getHoverImage = (product: Product) => {
    const images = Object.values(product.imageURLs || {})
    const finishImage = images.find(img => img.mappedFinishID !== null)
    return finishImage?.url
  }

  // Get the finish name for the hover image
  const getHoverFinishName = (product: Product) => {
    const images = Object.values(product.imageURLs || {})
    const finishImage = images.find(img => img.mappedFinishID !== null)
    if (finishImage?.mappedFinishID) {
      const finish = finishes.find(f => f._id === finishImage.mappedFinishID)
      return finish?.name || 'Custom Finish'
    }
    return null
  }

  return (
    <div className="min-h-screen bg-ivory">
      <LuxuryNavigation />
      
      <main className="pt-24 pb-16">
        {/* Header Section */}
        <section className="bg-gradient-charcoal text-ivory py-16">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-5xl font-serif font-bold mb-4 tracking-wide">
                {activeCategory ? activeCategory.name : 'Our Products'}
              </h1>
              <p className="text-xl text-brass tracking-luxury">
                {activeSubcategory
                  ? activeSubcategory.name
                  : activeCategory
                  ? activeCategory.description || 'Discover Excellence in Every Detail'
                  : 'Discover Excellence in Every Detail'}
              </p>

              {/* Breadcrumb for active filters */}
              {(activeCategory || activeSubcategory) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 flex items-center justify-center gap-2 text-sm text-brass/80"
                >
                  <Link href="/products" className="hover:text-brass transition-colors">
                    All Products
                  </Link>
                  {activeCategory && (
                    <>
                      <span>/</span>
                      <span className="text-ivory">{activeCategory.name}</span>
                    </>
                  )}
                  {activeSubcategory && (
                    <>
                      <span>/</span>
                      <span className="text-ivory">{activeSubcategory.name}</span>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-6 py-12">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md border border-brass/20 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />

              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setSelectedSubcategory('') // Reset subcategory when category changes
                }}
                className="px-4 py-2.5 bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                disabled={!selectedCategory || availableSubcategories.length === 0}
                className="px-4 py-2.5 bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">All Subcategories</option>
                {availableSubcategories.map((sub: any) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  Search
                </Button>
                {(searchQuery || selectedCategory || selectedSubcategory) && (
                  <Button onClick={clearFilters} variant="ghost">
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filter Badges */}
            {(activeCategory || activeSubcategory || searchQuery) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 pt-4 border-t border-brass/20 flex flex-wrap gap-2"
              >
                <span className="text-sm text-charcoal/60">Active Filters:</span>
                {activeCategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-brass/10 text-brass text-sm rounded-full border border-brass/30">
                    Category: {activeCategory.name}
                    <button
                      onClick={() => {
                        setSelectedCategory('')
                        setSelectedSubcategory('')
                        setActiveCategory(null)
                        setActiveSubcategory(null)
                      }}
                      className="ml-1 hover:text-charcoal transition-colors"
                    >
                      ×
                    </button>
                  </span>
                )}
                {activeSubcategory && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-brass/10 text-brass text-sm rounded-full border border-brass/30">
                    Subcategory: {activeSubcategory.name}
                    <button
                      onClick={() => {
                        setSelectedSubcategory('')
                        setActiveSubcategory(null)
                      }}
                      className="ml-1 hover:text-charcoal transition-colors"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-brass/10 text-brass text-sm rounded-full border border-brass/30">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-charcoal transition-colors"
                    >
                      ×
                    </button>
                  </span>
                )}
              </motion.div>
            )}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-charcoal/60 text-lg">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-charcoal/60 text-lg mb-4">No products found</p>
                <Button onClick={clearFilters} variant="secondary">
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link href={`/products/${product._id}`}>
                    <motion.div 
                      className="bg-white rounded-lg overflow-hidden shadow-md border border-brass/20 hover:shadow-xl transition-all duration-300 group relative"
                      onMouseEnter={() => setHoveredProduct(product._id)}
                      onMouseLeave={() => setHoveredProduct(null)}
                      whileHover={{ 
                        scale: 1.02,
                        transition: { duration: 0.3, ease: "easeOut" }
                      }}
                    >
                      {/* Product Image */}
                      <div className="relative h-64 bg-white overflow-hidden">
                        {/* Subtle Glow Effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ 
                            opacity: hoveredProduct === product._id ? 1 : 0 
                          }}
                          transition={{ duration: 0.4 }}
                        />
                        {product.imageURLs && Object.keys(product.imageURLs).length > 0 ? (
                          <>
                            {/* Default Image with Smooth Transition */}
                            <motion.div
                              key={`default-${product._id}`}
                              initial={{ opacity: 1, scale: 1 }}
                              animate={{ 
                                opacity: hoveredProduct === product._id ? 0 : 1,
                                scale: hoveredProduct === product._id ? 1.05 : 1
                              }}
                              transition={{ 
                                duration: 0.6, 
                                ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smoothness
                              }}
                              className="absolute inset-0"
                            >
                              <Image
                                src={getDefaultImage(product)}
                                alt={product.name}
                                fill
                                className="object-contain p-4"
                              />
                            </motion.div>
                            
                            {/* Hover Image with Smooth Transition */}
                            <AnimatePresence>
                              {hoveredProduct === product._id && getHoverImage(product) && (
                                <motion.div
                                  key={`hover-${product._id}`}
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ 
                                    opacity: 1, 
                                    scale: 1,
                                    y: 0
                                  }}
                                  exit={{ 
                                    opacity: 0, 
                                    scale: 1.05,
                                    y: -10
                                  }}
                                  transition={{ 
                                    duration: 0.6,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                    delay: 0.1
                                  }}
                                  className="absolute inset-0"
                                >
                                  <Image
                                    src={getHoverImage(product)!}
                                    alt={`${product.name} - ${getHoverFinishName(product)}`}
                                    fill
                                    className="object-contain p-4"
                                  />
                                  
                                  {/* Finish Caption Overlay with Enhanced Animation */}
                                  <motion.div
                                    initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: 15 }}
                                    animate={{ 
                                      opacity: 1, 
                                      y: 0,
                                      scale: 1,
                                      rotateX: 0
                                    }}
                                    exit={{ 
                                      opacity: 0, 
                                      y: 20,
                                      scale: 0.95,
                                      rotateX: -10
                                    }}
                                    transition={{ 
                                      duration: 0.6, 
                                      delay: 0.2,
                                      ease: [0.25, 0.46, 0.45, 0.94]
                                    }}
                                    className="absolute bottom-4 left-4 right-4 bg-charcoal/90 backdrop-blur-md text-ivory px-3 py-2 rounded-lg border border-brass/40 shadow-lg"
                                    style={{ transformStyle: 'preserve-3d' }}
                                  >
                                    <motion.div 
                                      className="flex items-center gap-2"
                                      initial={{ x: -10 }}
                                      animate={{ x: 0 }}
                                      transition={{ delay: 0.3, duration: 0.4 }}
                                    >
                                      <motion.div 
                                        className="w-2 h-2 bg-brass rounded-full"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.4, duration: 0.3 }}
                                      ></motion.div>
                                      <motion.span 
                                        className="text-sm font-medium"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5, duration: 0.3 }}
                                      >
                                        {getHoverFinishName(product)}
                                      </motion.span>
                                    </motion.div>
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-ivory">
                            <svg className="w-20 h-20 text-brass/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-6">
                        <p className="text-xs text-brass tracking-luxury mb-2">
                          {product.productID}
                        </p>
                        <h3 className="text-lg font-serif font-bold text-charcoal mb-2 group-hover:text-brass transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-charcoal/60 mb-4 line-clamp-2">
                          {product.description || 'Premium quality product'}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-charcoal">
                            {product.materials?.length || 0} materials
                          </span>
                          <span className="text-brass font-medium text-sm group-hover:underline">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}

