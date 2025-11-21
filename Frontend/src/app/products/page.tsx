'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { productsApi, finishesApi, materialsApi } from '@/lib/api'
import type { Category, Finish, MaterialMaster } from '@/types'
import { useCategories } from '@/contexts/CategoriesContext'
import { useLoading } from '@/contexts/LoadingContext'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import Button from '@/components/ui/Button'
import { ProductGrid, FilterSidebar } from '@/components/products'
import { useFloatingSidebar } from '@/hooks/useFloatingSidebar'
import { motion } from 'framer-motion'

type MinimalProduct = {
  _id: string
  productID: string
  name: string
  description: string
  materialsCount: number
  thumbnailImage: string | null
  hoverImage: string | null
  hoverImageFinishId: string | null
}

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'productid-asc' | 'productid-desc' | 'price-asc' | 'price-desc'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isLoading: contextLoading } = useLoading()
  const { categories: contextCategories, loading: categoriesLoading } = useCategories()
  const [products, setProducts] = useState<MinimalProduct[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [finishes, setFinishes] = useState<Finish[]>([])
  const [materials, setMaterials] = useState<MaterialMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const productsLengthRef = useRef(0)
  const sidebarRef = useRef<HTMLDivElement | null>(null)
  const headerSectionRef = useRef<HTMLElement | null>(null)
  const footerRef = useRef<HTMLDivElement | null>(null)

  // Use floating sidebar hook
  const sidebarTop = useFloatingSidebar({
    sidebarRef,
    headerRef: headerSectionRef,
    footerRef,
    initialTop: 120,
  })

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [selectedMaterial, setSelectedMaterial] = useState<string>('')
  const [selectedFinish, setSelectedFinish] = useState<string>('')
  const [hasSize, setHasSize] = useState<boolean>(false)
  const [hasDiscount, setHasDiscount] = useState<boolean>(false)
  const [sortOption, setSortOption] = useState<SortOption>('productid-asc')

  const [activeCategory, setActiveCategory] = useState<Category | null>(null)
  const [activeSubcategory, setActiveSubcategory] = useState<{ _id: string; name: string; slug: string } | null>(null)

  // Track if initial fetch is complete
  const initialFetchDone = useRef(false)

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
        setSortOption(sortOrder === 'asc' ? 'oldest' : 'newest')
      } else if (sortBy === 'productID') {
        setSortOption(sortOrder === 'asc' ? 'productid-asc' : 'productid-desc')
      }
    } else {
      setSortOption('productid-asc')
    }

    // Fetch products immediately using URL params
    const fetchProductsFromUrl = async () => {
      try {
        setLoading(true)
        setProducts([])
        setHasMore(true)

        let sortParams: { sortBy: string; sortOrder: 'asc' | 'desc' } = { sortBy: 'productID', sortOrder: 'asc' }
        if (sortBy && sortOrder) {
          sortParams = { sortBy, sortOrder: sortOrder as 'asc' | 'desc' }
        }

        const params: any = {
          ...sortParams,
          limit: 20,
          skip: 0,
        }
        if (q) params.q = q
        if (category) params.category = category
        if (subcategory) params.subcategory = subcategory
        if (material) params.material = material
        if (finishId) params.finishId = finishId
        if (hasSizeParam) params.hasSize = true
        if (hasDiscountParam) params.hasDiscount = true

        const results = await productsApi.getListing(params)
        const safeResults = Array.isArray(results) ? results : []
        setProducts(safeResults)
        productsLengthRef.current = safeResults.length
        setHasMore(safeResults.length === 20)
        initialFetchDone.current = true
      } catch (error) {
        console.error('Failed to fetch products from URL params:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProductsFromUrl()
  }, [searchParams])

  // Use categories from context - single source of truth
  useEffect(() => {
    setCategories(contextCategories)
  }, [contextCategories])

  // Fetch finishes and materials (categories come from context)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [finishesData, materialsData] = await Promise.all([
          finishesApi.getAllWithProducts(),
          materialsApi.getAllWithProducts(),
        ])

        setFinishes(Array.isArray(finishesData) ? finishesData : [])
        setMaterials(Array.isArray(materialsData) ? materialsData : [])
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
      }
    }
    fetchInitialData()
  }, [])

  // Update active category when selection changes
  useEffect(() => {
    if (categories.length === 0) return

    if (selectedCategory) {
      const category = categories.find(c => c._id === selectedCategory) ||
                       categories.find(c => c.slug === selectedCategory)
      setActiveCategory(category || null)
    } else {
      setActiveCategory(null)
    }
    if (!selectedCategory) {
      setSelectedSubcategory('')
      setActiveSubcategory(null)
    }
  }, [selectedCategory, categories])

  // Get available subcategories
  const availableSubcategories = activeCategory?.subcategories || []
  const filteredCategories = Array.isArray(categories) ? categories : []
  const filteredMaterials = Array.isArray(materials) ? materials : []
  const filteredFinishes = Array.isArray(finishes) ? finishes : []

  // Parse sort option to backend params
  const getSortParams = useCallback(() => {
    switch (sortOption) {
      case 'newest':
        return { sortBy: 'createdAt', sortOrder: 'desc' as const }
      case 'oldest':
        return { sortBy: 'createdAt', sortOrder: 'asc' as const }
      case 'name-asc':
        return { sortBy: 'name', sortOrder: 'asc' as const }
      case 'name-desc':
        return { sortBy: 'name', sortOrder: 'desc' as const }
      case 'productid-asc':
        return { sortBy: 'productID', sortOrder: 'asc' as const }
      case 'productid-desc':
        return { sortBy: 'productID', sortOrder: 'desc' as const }
      case 'price-asc':
        return { sortBy: 'price', sortOrder: 'asc' as const }
      case 'price-desc':
        return { sortBy: 'price', sortOrder: 'desc' as const }
      default:
        return { sortBy: 'productID', sortOrder: 'asc' as const }
    }
  }, [sortOption])

  // Fetch products with current filters
  const fetchProducts = useCallback(async (reset = true) => {
    try {
      if (reset) {
        setLoading(true)
        setProducts([])
        setHasMore(true)
        productsLengthRef.current = 0
      } else {
        setLoadingMore(true)
      }

      const sortParams = getSortParams()
      const params: any = {
        ...sortParams,
        limit: 20,
        skip: reset ? 0 : productsLengthRef.current,
      }

      if (debouncedSearchQuery) params.q = debouncedSearchQuery
      if (selectedCategory) params.category = selectedCategory
      if (selectedSubcategory) params.subcategory = selectedSubcategory
      if (selectedMaterial) params.material = selectedMaterial
      if (selectedFinish) params.finishId = selectedFinish
      if (hasSize) params.hasSize = true
      if (hasDiscount) params.hasDiscount = true

      const results = await productsApi.getListing(params)
      const safeResults = Array.isArray(results) ? results : []

      if (reset) {
        setProducts(safeResults)
        productsLengthRef.current = safeResults.length
      } else {
        setProducts(prev => {
          const prevProducts = Array.isArray(prev) ? prev : []
          const newProducts = [...prevProducts, ...safeResults]
          productsLengthRef.current = newProducts.length
          return newProducts
        })
      }

      setHasMore(safeResults.length === 20)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [debouncedSearchQuery, selectedCategory, selectedSubcategory, selectedMaterial, selectedFinish, hasSize, hasDiscount, getSortParams])

  // Load more products for infinite scroll
  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return
    await fetchProducts(false)
  }, [loadingMore, hasMore, loading, fetchProducts])

  // Auto-fetch products when filters change
  useEffect(() => {
    if (!initialFetchDone.current) return
    fetchProducts()
  }, [fetchProducts])

  // Update URL when filters change
  useEffect(() => {
    if (!initialFetchDone.current) return

    const params = new URLSearchParams()

    if (debouncedSearchQuery) params.set('q', debouncedSearchQuery)
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedSubcategory) params.set('subcategory', selectedSubcategory)
    if (selectedMaterial) params.set('material', selectedMaterial)
    if (selectedFinish) params.set('finishId', selectedFinish)
    if (hasSize) params.set('hasSize', 'true')
    if (hasDiscount) params.set('hasDiscount', 'true')

    const sortParams = getSortParams()
    if (sortOption !== 'newest') {
      params.set('sortBy', sortParams.sortBy)
      params.set('sortOrder', sortParams.sortOrder)
    }

    const queryString = params.toString()
    const newUrl = queryString ? `/products?${queryString}` : '/products'
    const currentUrl = window.location.pathname + window.location.search

    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false })
    }
  }, [debouncedSearchQuery, selectedCategory, selectedSubcategory, selectedMaterial, selectedFinish, hasSize, hasDiscount, sortOption, getSortParams, router])

  // Update active subcategory
  useEffect(() => {
    if (selectedSubcategory && activeCategory?.subcategories) {
      const subcategory = activeCategory.subcategories.find((s: any) => s._id === selectedSubcategory) ||
                          activeCategory.subcategories.find((s: any) => s.slug === selectedSubcategory)
      setActiveSubcategory(subcategory || null)
    } else {
      setActiveSubcategory(null)
    }
  }, [selectedSubcategory, activeCategory])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const currentRef = loadMoreRef.current
    if (!currentRef || !hasMore || loading || loadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMoreProducts()
        }
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.1,
      }
    )

    observer.observe(currentRef)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, loading, loadingMore, loadMoreProducts])

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
        <section ref={headerSectionRef} className="bg-gradient-charcoal text-ivory py-8 relative overflow-hidden">
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

              {(activeCategory || activeSubcategory) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-3 flex items-center justify-center gap-2 text-sm text-brass/80"
                >
                  <a href="/products" className="hover:text-brass transition-colors">
                    All Products
                  </a>
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

        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 sm:pt-8 pb-4 sm:pb-8">
          {/* Mobile Filter Toggle Button */}
          <div className="lg:hidden mb-4 sm:mb-6 flex items-center justify-between gap-3">
            <Button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 min-h-[44px] px-4 text-sm sm:text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="hidden xs:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold min-w-[20px] text-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <div className="text-xs sm:text-sm text-charcoal/60">
              {loading ? 'Loading...' : `${products?.length || 0} ${(products?.length || 0) === 1 ? 'product' : 'products'}`}
            </div>
          </div>

          <div className="flex gap-4 lg:gap-6 xl:gap-8 relative">
            {/* Spacer div for desktop */}
            <div className="hidden lg:block w-72 lg:w-80 flex-shrink-0" />

            {/* Filter Sidebar Component */}
            <FilterSidebar
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              selectedMaterial={selectedMaterial}
              selectedFinish={selectedFinish}
              hasSize={hasSize}
              hasDiscount={hasDiscount}
              sortOption={sortOption}
              onSearchChange={setSearchQuery}
              onCategoryChange={(value) => {
                setSelectedCategory(value)
                setSelectedSubcategory('')
              }}
              onSubcategoryChange={setSelectedSubcategory}
              onMaterialChange={setSelectedMaterial}
              onFinishChange={setSelectedFinish}
              onHasSizeChange={setHasSize}
              onHasDiscountChange={setHasDiscount}
              onSortChange={setSortOption}
              onClearFilters={clearFilters}
              categories={filteredCategories}
              materials={filteredMaterials}
              finishes={filteredFinishes}
              availableSubcategories={availableSubcategories}
              mobileOpen={mobileFiltersOpen}
              onMobileClose={() => setMobileFiltersOpen(false)}
              sidebarRef={sidebarRef}
              sidebarTop={sidebarTop}
              activeFilterCount={activeFilterCount}
              debouncedSearchQuery={debouncedSearchQuery}
            />

            {/* Right Content Area - Products */}
            <div className="flex-1 min-w-0">
              {/* Results Header - Desktop Only */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="hidden lg:flex items-center justify-between mb-6 mt-2"
              >
                <div className="text-charcoal/60">
                  {loading ? (
                    <span>Loading...</span>
                  ) : (
                    <span className="font-medium">
                      {products?.length || 0} {(products?.length || 0) === 1 ? 'product' : 'products'} found
                    </span>
                  )}
                </div>
              </motion.div>

              {/* Product Grid Component */}
              <ProductGrid
                products={products}
                loading={loading}
                contextLoading={contextLoading}
                hoveredProduct={hoveredProduct}
                onMouseEnter={setHoveredProduct}
                onMouseLeave={() => setHoveredProduct(null)}
                onClearFilters={clearFilters}
                showHoverEffect={true}
                finishes={finishes}
              />

              {/* Infinite scroll trigger */}
              {!loading && hasMore && (
                <div ref={loadMoreRef} className="h-1 w-full" />
              )}
            </div>
          </div>
        </div>
      </main>

      <div ref={footerRef}>
        <LuxuryFooter />
      </div>
    </div>
  )
}
