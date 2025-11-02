'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { productsApi, categoriesApi, finishesApi, materialsApi } from '@/lib/api'
import type { Product, Category, Finish, MaterialMaster } from '@/types'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [finishes, setFinishes] = useState<Finish[]>([])
  const [materials, setMaterials] = useState<MaterialMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [selectedFinish, setSelectedFinish] = useState<string>('')
  const [hasSize, setHasSize] = useState<boolean>(false)
  const [hasDiscount, setHasDiscount] = useState<boolean>(false)
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [activeSubcategory, setActiveSubcategory] = useState<{ _id: string; name: string; slug: string } | null>(null)
  
  // Track if we're fetching from URL params to prevent duplicate fetches
  const isFetchingFromUrlRef = useRef(false)
  // Track if we're initializing from URL params to prevent URL overwrites
  const isInitializingFromUrlRef = useRef(false)
  
  // Track which filter options have products
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<Set<string>>(new Set())
  const [subcategoriesWithProducts, setSubcategoriesWithProducts] = useState<Set<string>>(new Set())
  const [materialsWithProducts, setMaterialsWithProducts] = useState<Set<string>>(new Set())
  const [finishesWithProducts, setFinishesWithProducts] = useState<Set<string>>(new Set())

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Read URL params on mount and when URL changes
  useEffect(() => {
    const q = searchParams.get('q') || ''
    const category = searchParams.get('category') || ''
    const subcategory = searchParams.get('subcategory') || ''
    const material = searchParams.get('material') || ''
    const finishId = searchParams.get('finishId') || ''
    const hasSizeParam = searchParams.get('hasSize') === 'true'
    const hasDiscountParam = searchParams.get('hasDiscount') === 'true'
    const sortBy = searchParams.get('sortBy') || ''
    const sortOrder = searchParams.get('sortOrder') || ''

    // Mark that we're initializing from URL params
    isInitializingFromUrlRef.current = true

    setSearchQuery(q)
    setDebouncedSearchQuery(q)
    setSelectedCategory(category)
    setSelectedSubcategory(subcategory)
    setSelectedMaterial(material)
    setSelectedFinish(finishId)
    setHasSize(hasSizeParam)
    setHasDiscount(hasDiscountParam)

    // Map sortBy and sortOrder to sortOption
    if (sortBy && sortOrder) {
      if (sortBy === 'name') {
        setSortOption(sortOrder === 'asc' ? 'name-asc' : 'name-desc')
      } else if (sortBy === 'price' || sortBy === 'packagingPrice') {
        setSortOption(sortOrder === 'asc' ? 'price-asc' : 'price-desc')
      } else if (sortBy === 'createdAt') {
        setSortOption('newest')
      }
    }

    // Fetch products immediately using URL params (before state updates complete)
    // This ensures products are filtered correctly when navigating from menu
    const fetchProductsFromUrl = async () => {
      try {
        isFetchingFromUrlRef.current = true
        setLoading(true)
        
        // Parse sort params
        let sortParams: { sortBy: string; sortOrder: 'asc' | 'desc' } = { sortBy: 'createdAt', sortOrder: 'desc' }
        if (sortBy && sortOrder) {
          sortParams = { sortBy, sortOrder: sortOrder as 'asc' | 'desc' }
        }
        
        const params: any = { ...sortParams }
        if (q) params.q = q
        if (category) params.category = category
        if (subcategory) params.subcategory = subcategory
        if (material) params.material = material
        if (finishId) params.finishId = finishId
        if (hasSizeParam) params.hasSize = true
        if (hasDiscountParam) params.hasDiscount = true

        const results = await productsApi.getAll(params)
        setProducts(results)
      } catch (error) {
        console.error('Failed to fetch products from URL params:', error)
      } finally {
        setLoading(false)
        // Reset flags after a delay to allow state updates to complete
        setTimeout(() => {
          isFetchingFromUrlRef.current = false
          isInitializingFromUrlRef.current = false
        }, 200)
      }
    }

    // Fetch products from URL params immediately
    fetchProductsFromUrl()
  }, [searchParams])

  // Fetch initial data (categories, finishes, materials) and products to determine which options have products
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [categoriesData, finishesData, materialsData, allProducts] = await Promise.all([
          categoriesApi.getAll(),
          finishesApi.getAll(),
          materialsApi.getAll(),
          productsApi.getAll(), // Fetch all products to analyze which options are used
        ])
        setCategories(categoriesData)
        setFinishes(finishesData)
        setMaterials(materialsData)
        
        // Analyze which categories, subcategories, materials, and finishes have products
        const categorySet = new Set<string>()
        const subcategorySet = new Set<string>()
        const materialSet = new Set<string>()
        const finishSet = new Set<string>()
        
        allProducts.forEach((product: Product) => {
          // Track categories with products
          const categoryId = typeof product.category === 'string' 
            ? product.category 
            : product.category?._id
          if (categoryId) {
            categorySet.add(categoryId)
          }
          
          // Track subcategories with products
          if (product.subcategoryId) {
            subcategorySet.add(product.subcategoryId)
          }
          
          // Track materials with products (from materials array)
          if (product.materials && Array.isArray(product.materials)) {
            product.materials.forEach((material: any) => {
              if (material.name) {
                materialSet.add(material.name)
              }
            })
          }
          
          // Track finishes with products (from finishes array)
          if (product.finishes && Array.isArray(product.finishes)) {
            product.finishes.forEach((finish: any) => {
              if (finish.finishID) {
                finishSet.add(finish.finishID)
              }
            })
          }
        })
        
        setCategoriesWithProducts(categorySet)
        setSubcategoriesWithProducts(subcategorySet)
        setMaterialsWithProducts(materialSet)
        setFinishesWithProducts(finishSet)
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
      }
    }
    fetchInitialData()
  }, [])

  // Resolve category/subcategory from URL params after categories load
  // This converts slugs to IDs and updates the selected state for dropdowns
  useEffect(() => {
    if (categories.length > 0) {
      const urlCategory = searchParams.get('category') || ''
      const urlSubcategory = searchParams.get('subcategory') || ''
      
      if (urlCategory) {
        // Find category by slug or ID
        const category = categories.find((c: Category) => 
          c.slug === urlCategory || c._id === urlCategory
        )
        
        if (category) {
          // Update selectedCategory to use ID (for dropdown)
          setSelectedCategory(category._id)
          setActiveCategory(category)
          
          // Handle subcategory if present in URL
          if (urlSubcategory && category.subcategories) {
            const subcategory = category.subcategories.find((s: any) => 
              s.slug === urlSubcategory || s._id === urlSubcategory
            )
            if (subcategory) {
              // Update selectedSubcategory to use ID (for dropdown)
              setSelectedSubcategory(subcategory._id)
              setActiveSubcategory(subcategory)
            } else {
              // Subcategory from URL not found, clear it
              setSelectedSubcategory('')
              setActiveSubcategory(null)
            }
          } else if (!urlSubcategory) {
            // Clear subcategory if not in URL
            setSelectedSubcategory('')
            setActiveSubcategory(null)
          }
        } else {
          // Category from URL not found, clear selection
          setSelectedCategory('')
          setActiveCategory(null)
          setSelectedSubcategory('')
          setActiveSubcategory(null)
        }
      } else {
        // No category in URL, clear selection
        setSelectedCategory('')
        setActiveCategory(null)
        setSelectedSubcategory('')
        setActiveSubcategory(null)
      }
    }
  }, [categories, searchParams])

  // Update active category when selection changes manually (not from URL initialization)
  // This handles manual filter changes in the dropdowns
  useEffect(() => {
    // Skip if we're initializing from URL params to avoid conflicts
    if (isInitializingFromUrlRef.current || categories.length === 0) {
      return
    }
    
    if (selectedCategory && categories.length > 0) {
      const category = categories.find(c => c._id === selectedCategory)
      setActiveCategory(category || null)
    } else {
      setActiveCategory(null)
    }
    // Reset subcategory when category changes manually
    if (!selectedCategory) {
      setSelectedSubcategory('')
      setActiveSubcategory(null)
    }
  }, [selectedCategory, categories])

  // Get available subcategories based on selected category, filtered to only show those with products
  const availableSubcategories = activeCategory?.subcategories?.filter((sub) => {
    return subcategoriesWithProducts.has(sub._id)
  }) || []
  
  // Filter categories to only show those with products
  const filteredCategories = categories.filter((cat) => {
    const hasDirectProducts = categoriesWithProducts.has(cat._id)
    const hasSubcategoriesWithProducts = cat.subcategories?.some((sub) => {
      return subcategoriesWithProducts.has(sub._id)
    }) || false
    return hasDirectProducts || hasSubcategoriesWithProducts
  })
  
  // Filter materials to only show those with products
  const filteredMaterials = materials.filter((mat) => {
    return materialsWithProducts.has(mat.name)
  })
  
  // Filter finishes to only show those with products
  const filteredFinishes = finishes.filter((fin) => {
    return finishesWithProducts.has(fin._id)
  })

  // Parse sort option to backend params
  const getSortParams = () => {
    switch (sortOption) {
      case 'name-asc':
        return { sortBy: 'name', sortOrder: 'asc' as const }
      case 'name-desc':
        return { sortBy: 'name', sortOrder: 'desc' as const }
      case 'price-asc':
        return { sortBy: 'price', sortOrder: 'asc' as const }
      case 'price-desc':
        return { sortBy: 'price', sortOrder: 'desc' as const }
      case 'newest':
        return { sortBy: 'createdAt', sortOrder: 'desc' as const }
      default:
        return { sortBy: 'createdAt', sortOrder: 'desc' as const }
    }
  }

  // Fetch products with current filters
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const sortParams = getSortParams()
      const params: any = {
        ...sortParams,
      }
      
      if (debouncedSearchQuery) params.q = debouncedSearchQuery
      if (selectedCategory) params.category = selectedCategory
      if (selectedSubcategory) params.subcategory = selectedSubcategory
      if (selectedMaterial) params.material = selectedMaterial
      if (selectedFinish) params.finishId = selectedFinish
      if (hasSize) params.hasSize = true
      if (hasDiscount) params.hasDiscount = true

      const results = await productsApi.getAll(params)
      setProducts(results)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchQuery, selectedCategory, selectedSubcategory, selectedMaterial, selectedFinish, hasSize, hasDiscount, sortOption])

  // Auto-fetch products when filters change (but skip if we're fetching from URL params)
  useEffect(() => {
    // Skip if we just fetched from URL params to prevent duplicate fetches
    if (isFetchingFromUrlRef.current) {
      return
    }
    fetchProducts()
  }, [fetchProducts])

  // Update URL when filters change (but skip during initialization from URL params)
  useEffect(() => {
    // Skip if we're currently initializing from URL params to prevent overwriting the URL
    if (isFetchingFromUrlRef.current || isInitializingFromUrlRef.current) {
      return
    }

    const params = new URLSearchParams()
    
    if (debouncedSearchQuery) params.set('q', debouncedSearchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedSubcategory) params.set('subcategory', selectedSubcategory)
    if (selectedMaterial) params.set('material', selectedMaterial)
    if (selectedFinish) params.set('finishId', selectedFinish)
    if (hasSize) params.set('hasSize', 'true')
    if (hasDiscount) params.set('hasDiscount', 'true')
    
    const sortParams = getSortParams()
    if (sortParams.sortBy !== 'createdAt' || sortParams.sortOrder !== 'desc') {
      params.set('sortBy', sortParams.sortBy)
      params.set('sortOrder', sortParams.sortOrder)
    }

    const queryString = params.toString()
    const newUrl = queryString ? `/products?${queryString}` : '/products'
    
    // Get current URL to compare
    const currentUrl = window.location.pathname + window.location.search
    
    // Only update URL if it's different to avoid unnecessary navigation
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false }) // Use replace instead of push to avoid history entries
    }
  }, [debouncedSearchQuery, selectedCategory, selectedSubcategory, selectedMaterial, selectedFinish, hasSize, hasDiscount, sortOption, router])

  // Update active subcategory when selection changes
  useEffect(() => {
    if (selectedSubcategory && activeCategory?.subcategories) {
      const subcategory = activeCategory.subcategories.find((s: any) => s._id === selectedSubcategory)
      setActiveSubcategory(subcategory || null)
    } else {
      setActiveSubcategory(null)
    }
  }, [selectedSubcategory, activeCategory])

  const clearFilters = () => {
    setSearchQuery('')
    setDebouncedSearchQuery('')
    setSelectedCategory('')
    setSelectedSubcategory('')
    setSelectedMaterial('')
    setSelectedFinish('')
    setHasSize(false)
    setHasDiscount(false)
    setSortOption('newest')
    router.push('/products', { scroll: false })
  }

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

  // Get active filter count
  const activeFilterCount = [
    debouncedSearchQuery,
    selectedCategory,
    selectedSubcategory,
    selectedMaterial,
    selectedFinish,
    hasSize,
    hasDiscount,
    sortOption !== 'newest'
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-ivory relative overflow-hidden">
      {/* Luxury Background Design */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-brass/5 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-charcoal/3 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-brass/4 rounded-full blur-3xl"
          animate={{
            x: [0, 60, 0],
            y: [0, -60, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Subtle Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 69, 19, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 69, 19, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Decorative Lines */}
        <motion.div
          className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brass/10 to-transparent"
          animate={{
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <LuxuryNavigation />
      
      <main className="pt-24 pb-16 relative z-10">
        {/* Compact Header Section */}
        <section className="bg-gradient-charcoal text-ivory py-8 relative overflow-hidden">
          {/* Header Background Animation */}
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(218, 165, 32, 0.3) 0%, transparent 50%),
                               radial-gradient(circle at 80% 50%, rgba(218, 165, 32, 0.2) 0%, transparent 50%)`,
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          
          <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold mb-2 tracking-wide">
                {activeCategory ? activeCategory.name : 'Our Products'}
              </h1>
              <p className="text-base sm:text-lg text-brass tracking-luxury">
                {activeSubcategory
                  ? activeSubcategory.name
                  : activeCategory
                  ? activeCategory.description || 'Discover Excellence in Every Detail'
                  : 'Discover Excellence in Every Detail'}
              </p>

              {/* Compact Breadcrumb */}
              {(activeCategory || activeSubcategory) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-3 flex items-center justify-center gap-2 text-sm text-brass/80"
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

        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-8">
          {/* Mobile Filter Toggle Button */}
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <Button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <div className="text-sm text-charcoal/60">
              {loading ? 'Loading...' : `${products.length} ${products.length === 1 ? 'product' : 'products'}`}
            </div>
          </div>

          <div className="flex gap-4 lg:gap-6 xl:gap-8">
            {/* Left Sidebar - Filters */}
            {/* Mobile Overlay */}
            <AnimatePresence>
              {mobileFiltersOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setMobileFiltersOpen(false)}
                  />
                  <motion.aside
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 lg:hidden overflow-y-auto"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(218, 165, 32, 0.3) transparent',
                    }}
                  >
              <style dangerouslySetInnerHTML={{
                __html: `
                  .filter-sidebar::-webkit-scrollbar {
                    width: 6px;
                  }
                  .filter-sidebar::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .filter-sidebar::-webkit-scrollbar-thumb {
                    background: rgba(218, 165, 32, 0.3);
                    border-radius: 3px;
                  }
                  .filter-sidebar::-webkit-scrollbar-thumb:hover {
                    background: rgba(218, 165, 32, 0.5);
                  }
                `
              }} />
                    <div className="sticky top-0 bg-white border-b border-brass/20 p-4 flex items-center justify-between z-10">
                      <h2 className="text-lg font-serif font-semibold text-charcoal flex items-center gap-2">
                        <span className="w-1 h-6 bg-brass"></span>
                        Filters
                      </h2>
                      <button
                        onClick={() => setMobileFiltersOpen(false)}
                        className="p-2 hover:bg-brass/10 rounded-full transition-colors"
                        aria-label="Close filters"
                      >
                        <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6 space-y-6">
                      {activeFilterCount > 0 && (
                        <p className="text-sm text-charcoal/60 mb-4">
                          {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                        </p>
                      )}

                      {/* Search */}
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          Search Products
                        </label>
                        <Input
                          placeholder="Search by name, ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          Category
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value)
                            setSelectedSubcategory('')
                          }}
                          className="w-full px-3 py-2 text-sm bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all"
                        >
                          <option value="">All Categories</option>
                          {filteredCategories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Subcategory */}
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          Subcategory
                        </label>
                        <select
                          value={selectedSubcategory}
                          onChange={(e) => setSelectedSubcategory(e.target.value)}
                          disabled={!selectedCategory || availableSubcategories.length === 0}
                          className="w-full px-3 py-2 text-sm bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="">All Subcategories</option>
                          {availableSubcategories.map((sub: any) => (
                            <option key={sub._id} value={sub._id}>
                              {sub.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Material */}
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          Material
                        </label>
                        <select
                          value={selectedMaterial}
                          onChange={(e) => setSelectedMaterial(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all"
                        >
                          <option value="">All Materials</option>
                          {filteredMaterials.map((mat) => (
                            <option key={mat._id} value={mat.name}>
                              {mat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Finish */}
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          Finish
                        </label>
                        <select
                          value={selectedFinish}
                          onChange={(e) => setSelectedFinish(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all"
                        >
                          <option value="">All Finishes</option>
                          {filteredFinishes.map((fin) => (
                            <option key={fin._id} value={fin._id}>
                              {fin.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Sort */}
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2">
                          Sort By
                        </label>
                        <select
                          value={sortOption}
                          onChange={(e) => setSortOption(e.target.value as SortOption)}
                          className="w-full px-3 py-2 text-sm bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all"
                        >
                          <option value="newest">Newest First</option>
                          <option value="name-asc">Name A-Z</option>
                          <option value="name-desc">Name Z-A</option>
                          <option value="price-asc">Price Low-High</option>
                          <option value="price-desc">Price High-Low</option>
                        </select>
                      </div>

                      {/* Toggle Filters */}
                      <div className="space-y-3 border-t border-brass/20 pt-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={hasSize}
                            onChange={(e) => setHasSize(e.target.checked)}
                            className="w-5 h-5 text-brass border-brass/30 rounded focus:ring-brass transition-all group-hover:border-brass"
                          />
                          <span className="text-sm text-charcoal group-hover:text-brass transition-colors">
                            Has Size Options
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={hasDiscount}
                            onChange={(e) => setHasDiscount(e.target.checked)}
                            className="w-5 h-5 text-brass border-brass/30 rounded focus:ring-brass transition-all group-hover:border-brass"
                          />
                          <span className="text-sm text-charcoal group-hover:text-brass transition-colors">
                            Discounted Items
                          </span>
                        </label>
                      </div>

                      {/* Clear Filters */}
                      {activeFilterCount > 0 && (
                        <div className="border-t border-brass/20 pt-4">
                          <button
                            onClick={() => {
                              clearFilters()
                              setMobileFiltersOpen(false)
                            }}
                            className="w-full px-4 py-2.5 bg-brass/10 hover:bg-brass/20 text-brass border border-brass/40 rounded-sm text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 group"
                          >
                            <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear All Filters
                            <span className="bg-brass/20 px-1.5 py-0.5 rounded text-xs font-semibold">
                              {activeFilterCount}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Active Filter Badges */}
                      {(activeCategory || activeSubcategory || debouncedSearchQuery || selectedMaterial || selectedFinish || hasSize || hasDiscount) && (
                        <div className="border-t border-brass/20 pt-4">
                          <p className="text-xs font-medium text-charcoal/60 mb-2">Active Filters:</p>
                          <div className="flex flex-wrap gap-2">
                            {activeCategory && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                                {activeCategory.name}
                                <button
                                  onClick={() => {
                                    setSelectedCategory('')
                                    setSelectedSubcategory('')
                                  }}
                                  className="hover:text-charcoal transition-colors"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                            {activeSubcategory && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                                {activeSubcategory.name}
                                <button
                                  onClick={() => setSelectedSubcategory('')}
                                  className="hover:text-charcoal transition-colors"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                            {debouncedSearchQuery && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                                "{debouncedSearchQuery}"
                                <button
                                  onClick={() => {
                                    setSearchQuery('')
                                    setDebouncedSearchQuery('')
                                  }}
                                  className="hover:text-charcoal transition-colors"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                            {selectedMaterial && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                                {selectedMaterial}
                                <button
                                  onClick={() => setSelectedMaterial('')}
                                  className="hover:text-charcoal transition-colors"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                            {selectedFinish && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                                {finishes.find(f => f._id === selectedFinish)?.name || selectedFinish}
                                <button
                                  onClick={() => setSelectedFinish('')}
                                  className="hover:text-charcoal transition-colors"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                            {hasSize && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                                Size Options
                                <button
                                  onClick={() => setHasSize(false)}
                                  className="hover:text-charcoal transition-colors"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                            {hasDiscount && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                                Discounted
                                <button
                                  onClick={() => setHasDiscount(false)}
                                  className="hover:text-charcoal transition-colors"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.aside>
                </>
              )}
            </AnimatePresence>

            {/* Desktop Sidebar - Filters */}
            <aside 
              className="hidden lg:block filter-sidebar w-72 lg:w-80 flex-shrink-0 sticky top-20 self-start h-[calc(100vh-8rem)] overflow-y-auto pr-2"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(218, 165, 32, 0.3) transparent',
              }}
            >
              <style dangerouslySetInnerHTML={{
                __html: `
                  .filter-sidebar::-webkit-scrollbar {
                    width: 6px;
                  }
                  .filter-sidebar::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  .filter-sidebar::-webkit-scrollbar-thumb {
                    background: rgba(218, 165, 32, 0.3);
                    border-radius: 3px;
                  }
                  .filter-sidebar::-webkit-scrollbar-thumb:hover {
                    background: rgba(218, 165, 32, 0.5);
                  }
                `
              }} />
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-lg shadow-lg border border-brass/20 p-6 space-y-6"
              >
                <div className="border-b border-brass/20 pb-4">
                  <h2 className="text-xl font-serif font-semibold text-charcoal flex items-center gap-2">
                    <span className="w-1 h-6 bg-brass"></span>
                    Filters
                  </h2>
                  {activeFilterCount > 0 && (
                    <p className="text-sm text-charcoal/60 mt-1">
                      {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                    </p>
                  )}
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Search Products
                  </label>
                  <Input
                    placeholder="Search by name, ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value)
                      setSelectedSubcategory('')
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all"
                  >
                    <option value="">All Categories</option>
                    {filteredCategories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Subcategory
                  </label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    disabled={!selectedCategory || availableSubcategories.length === 0}
                    className="w-full px-3 py-2 text-sm bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">All Subcategories</option>
                    {availableSubcategories.map((sub: any) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Material */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Material
                  </label>
                  <select
                    value={selectedMaterial}
                    onChange={(e) => setSelectedMaterial(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all"
                  >
                    <option value="">All Materials</option>
                    {filteredMaterials.map((mat) => (
                      <option key={mat._id} value={mat.name}>
                        {mat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Finish */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Finish
                  </label>
                  <select
                    value={selectedFinish}
                    onChange={(e) => setSelectedFinish(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all"
                  >
                    <option value="">All Finishes</option>
                    {filteredFinishes.map((fin) => (
                      <option key={fin._id} value={fin._id}>
                        {fin.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="w-full px-3 py-2 text-sm bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all"
                  >
                    <option value="newest">Newest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="price-asc">Price Low-High</option>
                    <option value="price-desc">Price High-Low</option>
                  </select>
                </div>

                {/* Toggle Filters */}
                <div className="space-y-3 border-t border-brass/20 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={hasSize}
                      onChange={(e) => setHasSize(e.target.checked)}
                      className="w-5 h-5 text-brass border-brass/30 rounded focus:ring-brass transition-all group-hover:border-brass"
                    />
                    <span className="text-sm text-charcoal group-hover:text-brass transition-colors">
                      Has Size Options
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={hasDiscount}
                      onChange={(e) => setHasDiscount(e.target.checked)}
                      className="w-5 h-5 text-brass border-brass/30 rounded focus:ring-brass transition-all group-hover:border-brass"
                    />
                    <span className="text-sm text-charcoal group-hover:text-brass transition-colors">
                      Discounted Items
                    </span>
                  </label>
                </div>

                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                  <div className="border-t border-brass/20 pt-4">
                    <button
                      onClick={clearFilters}
                      className="w-full px-4 py-2.5 bg-brass/10 hover:bg-brass/20 text-brass border border-brass/40 rounded-sm text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 group"
                    >
                      <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear All Filters
                      <span className="bg-brass/20 px-1.5 py-0.5 rounded text-xs font-semibold">
                        {activeFilterCount}
                      </span>
                    </button>
                  </div>
                )}

                {/* Active Filter Badges */}
                {(activeCategory || activeSubcategory || debouncedSearchQuery || selectedMaterial || selectedFinish || hasSize || hasDiscount) && (
                  <div className="border-t border-brass/20 pt-4">
                    <p className="text-xs font-medium text-charcoal/60 mb-2">Active Filters:</p>
                    <div className="flex flex-wrap gap-2">
                      {activeCategory && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                          {activeCategory.name}
                          <button
                            onClick={() => {
                              setSelectedCategory('')
                              setSelectedSubcategory('')
                            }}
                            className="hover:text-charcoal transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {activeSubcategory && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                          {activeSubcategory.name}
                          <button
                            onClick={() => setSelectedSubcategory('')}
                            className="hover:text-charcoal transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {debouncedSearchQuery && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                          "{debouncedSearchQuery}"
                          <button
                            onClick={() => {
                              setSearchQuery('')
                              setDebouncedSearchQuery('')
                            }}
                            className="hover:text-charcoal transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {selectedMaterial && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                          {selectedMaterial}
                          <button
                            onClick={() => setSelectedMaterial('')}
                            className="hover:text-charcoal transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {selectedFinish && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                          {finishes.find(f => f._id === selectedFinish)?.name || selectedFinish}
                          <button
                            onClick={() => setSelectedFinish('')}
                            className="hover:text-charcoal transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {hasSize && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                          Size Options
                          <button
                            onClick={() => setHasSize(false)}
                            className="hover:text-charcoal transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                          Discounted
                          <button
                            onClick={() => setHasDiscount(false)}
                            className="hover:text-charcoal transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </aside>

            {/* Right Content Area - Products */}
            <div className="flex-1 min-w-0">
              {/* Results Header - Desktop Only */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="hidden lg:flex items-center justify-between mb-6"
              >
                <div className="text-charcoal/60">
                  {loading ? (
                    <span>Loading...</span>
                  ) : (
                    <span className="font-medium">
                      {products.length} {products.length === 1 ? 'product' : 'products'} found
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Products Grid - More Columns */}
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
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
                  {products.map((product, index) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.03 }}
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
                          {/* Product Image - Compact */}
                          <div className="relative h-32 sm:h-40 md:h-48 bg-white overflow-hidden">
                            {product.discountPercentage && product.discountPercentage > 0 && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 left-2 z-10"
                              >
                                <span className="px-2 py-1 text-[10px] font-semibold rounded-md bg-brass text-white shadow-lg">
                                  {Math.round(product.discountPercentage)}% OFF
                                </span>
                              </motion.div>
                            )}
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
                                <motion.div
                                  key={`default-${product._id}`}
                                  initial={{ opacity: 1, scale: 1 }}
                                  animate={{ 
                                    opacity: hoveredProduct === product._id ? 0 : 1,
                                    scale: hoveredProduct === product._id ? 1.05 : 1
                                  }}
                                  transition={{ 
                                    duration: 0.6, 
                                    ease: [0.25, 0.46, 0.45, 0.94]
                                  }}
                                  className="absolute inset-0"
                                >
                                  <Image
                                    src={getDefaultImage(product)}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-3"
                                  />
                                </motion.div>
                                
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
                                        className="object-contain p-3"
                                      />
                                      
                                      <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ 
                                          opacity: 1, 
                                          y: 0
                                        }}
                                        exit={{ 
                                          opacity: 0, 
                                          y: 20
                                        }}
                                        transition={{ 
                                          duration: 0.4, 
                                          delay: 0.2
                                        }}
                                        className="absolute bottom-2 left-2 right-2 bg-charcoal/90 backdrop-blur-md text-ivory px-2 py-1 rounded border border-brass/40 shadow-lg"
                                      >
                                        <div className="flex items-center gap-2">
                                          <div className="w-1.5 h-1.5 bg-brass rounded-full"></div>
                                          <span className="text-xs font-medium">
                                            {getHoverFinishName(product)}
                                          </span>
                                        </div>
                                      </motion.div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-ivory">
                                <svg className="w-16 h-16 text-brass/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Product Info - Compact */}
                          <div className="p-3 sm:p-4">
                            <p className="text-[9px] sm:text-[10px] text-brass tracking-luxury mb-1">
                              {product.productID}
                            </p>
                            <h3 className="text-sm sm:text-base font-sans font-semibold text-charcoal mb-1 group-hover:text-brass transition-colors leading-tight line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-xs text-charcoal/60 mb-3 line-clamp-2 overflow-hidden">
                              {product.description || 'Premium quality product'}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2 sm:mt-0">
                              <span className="text-[10px] sm:text-xs text-charcoal">
                                {product.materials?.length || 0} materials
                              </span>
                              <span className="hidden sm:inline text-brass font-medium text-xs group-hover:underline">
                                View →
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
          </div>
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}
