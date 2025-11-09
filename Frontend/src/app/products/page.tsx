'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { productsApi, categoriesApi, finishesApi, materialsApi } from '@/lib/api'
import type { Category, Finish, MaterialMaster, Product } from '@/types'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [sidebarTop, setSidebarTop] = useState(80) // Start at 5rem (80px)
  const sidebarRef = useRef<HTMLDivElement | null>(null)
  const headerSectionRef = useRef<HTMLElement | null>(null)
  const footerRef = useRef<HTMLDivElement | null>(null)
  
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
  
  // Track which filter options have products
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<Set<string>>(new Set())
  const [subcategoriesWithProducts, setSubcategoriesWithProducts] = useState<Set<string>>(new Set())
  const [materialsWithProducts, setMaterialsWithProducts] = useState<Set<string>>(new Set())
  const [finishesWithProducts, setFinishesWithProducts] = useState<Set<string>>(new Set())
  
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
      // Reset to default if no sort params
      setSortOption('newest')
    }

    // Fetch products immediately using URL params
    const fetchProductsFromUrl = async () => {
      try {
        setLoading(true)
        setProducts([])
        setHasMore(true)
        
        // Parse sort params
        let sortParams: { sortBy: string; sortOrder: 'asc' | 'desc' } = { sortBy: 'createdAt', sortOrder: 'desc' }
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

    // Fetch products from URL params immediately
    fetchProductsFromUrl()
  }, [searchParams])

  // Fetch initial data (categories, finishes, materials) - only those with products
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [categoriesData, finishesData, materialsData] = await Promise.all([
          categoriesApi.getAllWithProducts(),
          finishesApi.getAllWithProducts(),
          materialsApi.getAllWithProducts(),
        ])
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        setFinishes(Array.isArray(finishesData) ? finishesData : [])
        setMaterials(Array.isArray(materialsData) ? materialsData : [])
        
        // Initialize filter option sets - will be populated from actual product results
        // This avoids fetching all products just for filter analysis
        setCategoriesWithProducts(new Set())
        setSubcategoriesWithProducts(new Set())
        setMaterialsWithProducts(new Set())
        setFinishesWithProducts(new Set())
      } catch (error) {
        console.error('Failed to fetch initial data:', error)
      }
    }
    fetchInitialData()
  }, [])


  // Update active category when selection changes
  useEffect(() => {
    if (categories.length === 0) {
      return
    }
    
    if (selectedCategory) {
      const category = categories.find(c => c._id === selectedCategory || c.slug === selectedCategory)
      setActiveCategory(category || null)
    } else {
      setActiveCategory(null)
    }
    // Reset subcategory when category changes
    if (!selectedCategory) {
      setSelectedSubcategory('')
      setActiveSubcategory(null)
    }
  }, [selectedCategory, categories])

  // Get available subcategories from the selected category (show all)
  const availableSubcategories = activeCategory?.subcategories || []
  
  // Show all categories (no filtering)
  const filteredCategories = Array.isArray(categories) ? categories : []
  
  // Show all materials (no filtering)
  const filteredMaterials = Array.isArray(materials) ? materials : []
  
  // Show all finishes (no filtering)
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
        return { sortBy: 'createdAt', sortOrder: 'desc' as const }
    }
  }, [sortOption])

  // Fetch products with current filters (initial load with limit 20)
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

      // Update filter option sets based on fetched products
      if (reset) {
        const categorySet = new Set<string>()
        const subcategorySet = new Set<string>()
        const materialSet = new Set<string>()
        const finishSet = new Set<string>()

        safeResults.forEach((product: MinimalProduct) => {
          // Note: MinimalProduct doesn't have full category/subcategory info
          // We'll need to track these from the actual product data if needed
          // For now, we'll rely on the categories/materials/finishes APIs
        })
      }

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

      // Check if there are more products to load
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

  // Auto-fetch products when filters change (skip initial fetch from URL params)
  useEffect(() => {
    // Skip the first fetch since it's handled by the URL params effect
    if (!initialFetchDone.current) {
      return
    }
    fetchProducts()
  }, [fetchProducts])

  // Update URL when filters change (skip initial load)
  useEffect(() => {
    // Skip if initial fetch hasn't completed yet
    if (!initialFetchDone.current) {
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
    // Only add sort params if not default (newest - createdAt desc)
    if (sortOption !== 'newest') {
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
  }, [debouncedSearchQuery, selectedCategory, selectedSubcategory, selectedMaterial, selectedFinish, hasSize, hasDiscount, sortOption, getSortParams, router])

  // Update active subcategory when selection changes
  useEffect(() => {
    if (selectedSubcategory && activeCategory?.subcategories) {
      const subcategory = activeCategory.subcategories.find((s: any) => s._id === selectedSubcategory)
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

  // Scroll position tracking for floating filter card with Products header and footer boundaries
  // Uses IntersectionObserver + dynamic calculations based on parent components
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Only update on desktop (lg and above)
    if (window.innerWidth < 1024) return

    const headerSection = headerSectionRef.current
    const footer = footerRef.current
    const sidebar = sidebarRef.current
    if (!headerSection || !footer || !sidebar) return

    const updatePosition = () => {
      // Only update on desktop
      if (window.innerWidth < 1024) return

      const scrollY = window.scrollY
      const viewportHeight = window.innerHeight
      const cardHeight = sidebar.offsetHeight

      // Get actual bounding boxes
      const headerRect = headerSection.getBoundingClientRect()
      const footerRect = footer.getBoundingClientRect()

      // Get container spacing dynamically from the products container
      const productsContainer = headerSection.nextElementSibling as HTMLElement
      const computedStyle = productsContainer ? getComputedStyle(productsContainer) : null
      const containerPaddingTop = computedStyle
        ? parseFloat(computedStyle.paddingTop) || 24
        : 24
      const containerPaddingBottom = computedStyle
        ? parseFloat(computedStyle.paddingBottom) || 24
        : 24

      // Calculate boundaries based on actual element positions (in viewport coordinates)
      const headerBottomViewport = headerRect.bottom
      const footerTopViewport = footerRect.top

      // Convert to absolute positions for boundary calculations
      const headerBottomAbsolute = headerRect.bottom + scrollY
      const footerTopAbsolute = footerRect.top + scrollY

      // Dynamic boundaries with calculated margins from container
      // Min: header bottom + container padding (where card should stick at top)
      // Max: footer top - card height - container padding (where card should stick at bottom)
      const minTop = headerBottomViewport + containerPaddingTop
      const maxTop = footerTopViewport - cardHeight - containerPaddingBottom

      // Calculate centered position in viewport (vertically centered)
      const centeredTop = (viewportHeight - cardHeight) / 2

      // Smart positioning: try to center, but respect boundaries
      let newTop: number

      if (centeredTop < minTop) {
        // Centered position would be above header boundary - stick to header bottom
        newTop = minTop
      } else if (centeredTop > maxTop && maxTop > minTop) {
        // Centered position would be below footer boundary - stick to footer top
        newTop = maxTop
      } else {
        // Centered position is within boundaries - use centered position
        newTop = centeredTop
      }

      // Final boundary check to ensure card never goes out of bounds
      if (minTop > 0 && newTop < minTop) {
        newTop = minTop
      }
      if (maxTop < viewportHeight && newTop > maxTop) {
        newTop = maxTop
      }

      setSidebarTop(newTop)
    }

    // Use IntersectionObserver for header/footer visibility changes
    const headerObserver = new IntersectionObserver(
      () => {
        updatePosition()
      },
      { threshold: [0, 0.1, 0.5, 1], rootMargin: '0px' }
    )

    const footerObserver = new IntersectionObserver(
      () => {
        updatePosition()
      },
      { threshold: [0, 0.1, 0.5, 1], rootMargin: '0px' }
    )

    headerObserver.observe(headerSection)
    footerObserver.observe(footer)

    // Throttled scroll handler for smooth updates
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updatePosition()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', updatePosition, { passive: true })

    // Initial calculation
    updatePosition()

    return () => {
      headerObserver.disconnect()
      footerObserver.disconnect()
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', updatePosition)
    }
  }, [])

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

  // Get the finish name for the hover image
  const getHoverFinishName = (product: MinimalProduct) => {
    if (product.hoverImageFinishId) {
      const finish = finishes.find(f => f._id === product.hoverImageFinishId)
      // Only return finish name if found, otherwise return null to hide the caption
      return finish?.name || null
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
        <section ref={headerSectionRef} className="bg-gradient-charcoal text-ivory py-8 relative overflow-hidden">
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
            {/* Spacer div for desktop - maintains layout spacing */}
            <div className="hidden lg:block w-72 lg:w-80 flex-shrink-0" />
            
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
                    className="fixed left-0 top-0 h-full w-full max-w-[min(380px,90vw)] bg-white shadow-2xl z-50 lg:hidden overflow-y-auto"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(218, 165, 32, 0.3) transparent',
                      paddingBottom: 'env(safe-area-inset-bottom)',
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
                    <div className="sticky top-0 bg-white border-b border-brass/20 p-4 sm:p-5 flex items-center justify-between z-10" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
                      <h2 className="text-lg sm:text-xl font-serif font-semibold text-charcoal flex items-center gap-2">
                        <span className="w-1 h-6 bg-brass"></span>
                        Filters
                      </h2>
                      <button
                        onClick={() => setMobileFiltersOpen(false)}
                        className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-brass/10 rounded-full transition-colors"
                        aria-label="Close filters"
                      >
                        <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                      {activeFilterCount > 0 && (
                        <p className="text-sm text-charcoal/60 mb-2">
                          {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                        </p>
                      )}

                      {/* Search */}
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2.5">
                          Search Products
                        </label>
                        <Input
                          placeholder="Search by name, ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full min-h-[44px] text-base"
                        />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-2.5">
                          Category
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => {
                            setSelectedCategory(e.target.value)
                            setSelectedSubcategory('')
                          }}
                          className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all min-h-[44px]"
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
                        <label className="block text-sm font-medium text-charcoal mb-2.5">
                          Subcategory
                        </label>
                        <select
                          value={selectedSubcategory}
                          onChange={(e) => setSelectedSubcategory(e.target.value)}
                          disabled={!selectedCategory || availableSubcategories.length === 0}
                          className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
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
                        <label className="block text-sm font-medium text-charcoal mb-2.5">
                          Material
                        </label>
                        <select
                          value={selectedMaterial}
                          onChange={(e) => setSelectedMaterial(e.target.value)}
                          className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all min-h-[44px]"
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
                        <label className="block text-sm font-medium text-charcoal mb-2.5">
                          Finish
                        </label>
                        <select
                          value={selectedFinish}
                          onChange={(e) => setSelectedFinish(e.target.value)}
                          className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all min-h-[44px]"
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
                        <label className="block text-sm font-medium text-charcoal mb-2.5">
                          Sort By
                        </label>
                        <select
                          value={sortOption}
                          onChange={(e) => setSortOption(e.target.value as SortOption)}
                          className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all min-h-[44px]"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="name-asc">Name A-Z</option>
                          <option value="name-desc">Name Z-A</option>
                          <option value="productid-asc">Product ID A-Z</option>
                          <option value="productid-desc">Product ID Z-A</option>
                          <option value="price-asc">Price Low-High</option>
                          <option value="price-desc">Price High-Low</option>
                        </select>
                      </div>

                      {/* Toggle Filters */}
                      <div className="space-y-4 border-t border-brass/20 pt-4 sm:pt-5">
                        <label className="flex items-center gap-3 cursor-pointer group min-h-[44px]">
                          <input
                            type="checkbox"
                            checked={hasSize}
                            onChange={(e) => setHasSize(e.target.checked)}
                            className="w-6 h-6 text-brass border-brass/30 rounded focus:ring-brass transition-all group-hover:border-brass flex-shrink-0"
                          />
                          <span className="text-sm sm:text-base text-charcoal group-hover:text-brass transition-colors">
                            Has Size Options
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group min-h-[44px]">
                          <input
                            type="checkbox"
                            checked={hasDiscount}
                            onChange={(e) => setHasDiscount(e.target.checked)}
                            className="w-6 h-6 text-brass border-brass/30 rounded focus:ring-brass transition-all group-hover:border-brass flex-shrink-0"
                          />
                          <span className="text-sm sm:text-base text-charcoal group-hover:text-brass transition-colors">
                            Discounted Items
                          </span>
                        </label>
                      </div>

                      {/* Clear Filters */}
                      {activeFilterCount > 0 && (
                        <div className="border-t border-brass/20 pt-4 sm:pt-5">
                          <button
                            onClick={() => {
                              clearFilters()
                              setMobileFiltersOpen(false)
                            }}
                            className="w-full px-4 py-3 min-h-[44px] bg-brass/10 hover:bg-brass/20 text-brass border border-brass/40 rounded-sm text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 group"
                          >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear All Filters
                            <span className="bg-brass/20 px-2 py-0.5 rounded text-xs sm:text-sm font-semibold">
                              {activeFilterCount}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* Active Filter Badges */}
                      {(activeCategory || activeSubcategory || debouncedSearchQuery || selectedMaterial || selectedFinish || hasSize || hasDiscount) && (
                        <div className="border-t border-brass/20 pt-4 sm:pt-5">
                          <p className="text-xs font-medium text-charcoal/60 mb-3">Active Filters:</p>
                          <div className="flex flex-wrap gap-2">
                            {activeCategory && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brass/10 text-brass text-xs sm:text-sm rounded-full border border-brass/30">
                                <span className="truncate max-w-[150px]">{activeCategory.name}</span>
                                <button
                                  onClick={() => {
                                    setSelectedCategory('')
                                    setSelectedSubcategory('')
                                  }}
                                  className="hover:text-charcoal transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center"
                                  aria-label="Remove category filter"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                            {activeSubcategory && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brass/10 text-brass text-xs sm:text-sm rounded-full border border-brass/30">
                                <span className="truncate max-w-[150px]">{activeSubcategory.name}</span>
                                <button
                                  onClick={() => setSelectedSubcategory('')}
                                  className="hover:text-charcoal transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center"
                                  aria-label="Remove subcategory filter"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                            {debouncedSearchQuery && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brass/10 text-brass text-xs sm:text-sm rounded-full border border-brass/30">
                                <span className="truncate max-w-[150px]">"{debouncedSearchQuery}"</span>
                                <button
                                  onClick={() => {
                                    setSearchQuery('')
                                    setDebouncedSearchQuery('')
                                  }}
                                  className="hover:text-charcoal transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center"
                                  aria-label="Remove search filter"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                            {selectedMaterial && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brass/10 text-brass text-xs sm:text-sm rounded-full border border-brass/30">
                                <span className="truncate max-w-[150px]">{selectedMaterial}</span>
                                <button
                                  onClick={() => setSelectedMaterial('')}
                                  className="hover:text-charcoal transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center"
                                  aria-label="Remove material filter"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                            {selectedFinish && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brass/10 text-brass text-xs sm:text-sm rounded-full border border-brass/30">
                                <span className="truncate max-w-[150px]">{finishes.find(f => f._id === selectedFinish)?.name || selectedFinish}</span>
                                <button
                                  onClick={() => setSelectedFinish('')}
                                  className="hover:text-charcoal transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center"
                                  aria-label="Remove finish filter"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                            {hasSize && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brass/10 text-brass text-xs sm:text-sm rounded-full border border-brass/30">
                                Size Options
                                <button
                                  onClick={() => setHasSize(false)}
                                  className="hover:text-charcoal transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center"
                                  aria-label="Remove size filter"
                                >
                                  ×
                                </button>
                              </span>
                            )}
                            {hasDiscount && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brass/10 text-brass text-xs sm:text-sm rounded-full border border-brass/30">
                                Discounted
                                <button
                                  onClick={() => setHasDiscount(false)}
                                  className="hover:text-charcoal transition-colors min-w-[20px] min-h-[20px] flex items-center justify-center"
                                  aria-label="Remove discount filter"
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

            {/* Desktop Sidebar - Filters - Floating Card */}
            <aside 
              ref={sidebarRef}
              className="hidden lg:block filter-sidebar w-72 lg:w-80 flex-shrink-0 fixed z-30 overflow-y-auto pr-2"
              style={{
                top: `${sidebarTop}px`,
                left: 'calc((100vw - min(1920px, 100vw)) / 2 + 2rem)',
                maxHeight: 'calc(100vh - 9rem)',
                transition: 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(218, 165, 32, 0.3) transparent',
              }}
              onScroll={(e) => {
                // Prevent scroll event from bubbling
                e.stopPropagation()
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
                className="bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-brass/30 p-6 space-y-6 hover:shadow-2xl transition-shadow duration-300"
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
                    <option value="oldest">Oldest First</option>
                    <option value="name-asc">Name A-Z</option>
                    <option value="name-desc">Name Z-A</option>
                    <option value="productid-asc">Product ID A-Z</option>
                    <option value="productid-desc">Product ID Z-A</option>
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

              {/* Products Grid - More Columns */}
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-charcoal/60 text-base sm:text-lg">Loading products...</div>
                </div>
              ) : (products?.length || 0) === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center px-4">
                    <p className="text-charcoal/60 text-base sm:text-lg mb-4">No products found</p>
                    <Button onClick={clearFilters} variant="secondary" className="min-h-[44px]">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {products.map((product, index) => (
                    <Link key={product._id} href={`/products/${product._id}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.03 }}
                        className="cursor-pointer group bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full flex flex-col"
                        onMouseEnter={() => setHoveredProduct(product._id)}
                        onMouseLeave={() => setHoveredProduct(null)}
                      >
                        {/* Product Image */}
                        <div className="relative h-48 sm:h-56 lg:h-64 bg-white overflow-hidden">
                        {/* Subtle Glow Effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: hoveredProduct === product._id ? 1 : 0
                          }}
                          transition={{ duration: 0.4 }}
                        />
                        {product.thumbnailImage ? (
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
                                src={product.thumbnailImage}
                                alt={product.name}
                                fill
                                className="object-contain p-4"
                              />
                            </motion.div>

                            {/* Hover Image with Smooth Transition */}
                            <AnimatePresence>
                              {hoveredProduct === product._id && product.hoverImage && (
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
                                    src={product.hoverImage}
                                    alt={`${product.name} - ${getHoverFinishName(product)}`}
                                    fill
                                    className="object-contain p-3"
                                  />

                                  {/* Finish Caption Overlay with Enhanced Animation - Only show if finish name exists */}
                                  {getHoverFinishName(product) && (
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
                                          <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 bg-brass rounded-full"></div>
                                            <span className="text-xs font-medium">
                                              {getHoverFinishName(product)}
                                            </span>
                                          </div>
                                        </motion.span>
                                      </motion.div>
                                    </motion.div>
                                  )}
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

                      {/* Product Info */}
                      <div className="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col">
                        <p className="text-xs text-brass tracking-luxury mb-1.5 sm:mb-2">
                          {product.productID}
                        </p>
                        <h3 className="text-sm sm:text-base lg:text-lg font-serif font-bold text-charcoal mb-1.5 sm:mb-2 group-hover:text-brass transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-charcoal/60 mb-3 sm:mb-4 line-clamp-2 flex-1 whitespace-pre-wrap">
                          {product.description || 'Premium quality product'}
                        </p>

                        <div className="flex items-center justify-between mt-auto gap-2">
                          <span className="text-xs sm:text-sm text-charcoal whitespace-nowrap">
                            {product.materialsCount} {product.materialsCount === 1 ? 'material' : 'materials'}
                          </span>
                          <span className="text-brass font-medium text-xs sm:text-sm group-hover:underline whitespace-nowrap">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </motion.div>
                    </Link>
                  ))}
                </div>
              )}
              
              {/* Infinite scroll trigger - invisible element at bottom */}
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
