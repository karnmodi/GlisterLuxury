'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { collectionsApi, productsApi, categoriesApi, finishesApi, materialsApi } from '@/lib/api'
import type { Collection, Product, Category, Finish, MaterialMaster } from '@/types'
import { useLoading } from '@/contexts/LoadingContext'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import CollectionVisual from '@/components/CollectionVisual'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'productid-asc' | 'productid-desc' | 'price-asc' | 'price-desc'

export default function CollectionDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = params.slug as string
  const { isLoading: contextLoading } = useLoading()

  const [collection, setCollection] = useState<Collection | null>(null)
  const [products, setProducts] = useState<Product[]>([])
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
  const [groupByCategory, setGroupByCategory] = useState<boolean>(false)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch collection and initial data
  useEffect(() => {
    if (slug) {
      fetchCollection()
      fetchInitialData()
    }
  }, [slug])

  // Fetch products when filters change
  useEffect(() => {
    if (collection) {
      fetchProducts(true)
    }
  }, [debouncedSearchQuery, selectedCategory, selectedSubcategory, selectedMaterial, selectedFinish, hasSize, hasDiscount, sortOption, collection])

  const fetchCollection = async () => {
    try {
      setLoading(true)
      const data = await collectionsApi.getBySlug(slug)
      setCollection(data)
    } catch (error) {
      console.error('Failed to fetch collection:', error)
      setCollection(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchInitialData = async () => {
    try {
      const [categoriesData, finishesData, materialsData] = await Promise.all([
        categoriesApi.getAllWithProducts(),
        finishesApi.getAllWithProducts(),
        materialsApi.getAllWithProducts(),
      ])
      setCategories(categoriesData)
      setFinishes(finishesData)
      setMaterials(materialsData)
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
    }
  }

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

  const fetchProducts = useCallback(async (reset = true) => {
    if (!collection) return

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

      const results = await collectionsApi.getProducts(collection._id, params)
      const safeResults = Array.isArray(results) ? results : []

      if (reset) {
        setProducts(safeResults)
        productsLengthRef.current = safeResults.length
      } else {
        setProducts(prev => {
          const newProducts = [...prev, ...safeResults]
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
  }, [collection, debouncedSearchQuery, selectedCategory, selectedSubcategory, selectedMaterial, selectedFinish, hasSize, hasDiscount, getSortParams])

  // Load more products for infinite scroll
  const loadMoreProducts = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return
    await fetchProducts(false)
  }, [loadingMore, hasMore, loading, fetchProducts])

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

  // Dynamic filter bar positioning on scroll (desktop only)
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
  }

  const getProductImage = (product: Product) => {
    if (!product.imageURLs || Object.keys(product.imageURLs || {}).length === 0) return null
    const imageValues = Object.values(product.imageURLs || {})
    if (imageValues.length === 0) return null
    const firstImage = imageValues[0]
    return typeof firstImage === 'string' ? firstImage : firstImage?.url || null
  }

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

  // Get categories that have products in this collection
  const categoriesInCollection = useMemo(() => {
    if (!products.length) return []
    const categoryMap = new Map<string, { category: Category; products: Product[] }>()
    
    products.forEach((product) => {
      const categoryId = typeof product.category === 'string' 
        ? product.category 
        : product.category?._id
      
      if (categoryId) {
        const category = categories.find(c => c._id === categoryId)
        if (category) {
          if (!categoryMap.has(categoryId)) {
            categoryMap.set(categoryId, { category, products: [] })
          }
          categoryMap.get(categoryId)!.products.push(product)
        }
      }
    })
    
    return Array.from(categoryMap.values())
  }, [products, categories])

  // Get available categories (only those with products in collection)
  const availableCategories = useMemo(() => {
    if (!products.length) return []
    const categoryIds = new Set<string>()
    
    products.forEach((product) => {
      const categoryId = typeof product.category === 'string' 
        ? product.category 
        : product.category?._id
      if (categoryId) {
        categoryIds.add(categoryId)
      }
    })
    
    return categories.filter(cat => categoryIds.has(cat._id))
  }, [products, categories])

  // Get available subcategories (only those with products in collection)
  const availableSubcategories = useMemo(() => {
    if (!selectedCategory || !products.length) return []
    
    const subcategoryIds = new Set<string>()
    
    products.forEach((product) => {
      const categoryId = typeof product.category === 'string' 
        ? product.category 
        : product.category?._id
      
      // Only include subcategories if product belongs to selected category
      if (categoryId === selectedCategory && product.subcategory) {
        const subcategoryId = typeof product.subcategory === 'string'
          ? product.subcategory
          : product.subcategory?._id
        if (subcategoryId) {
          subcategoryIds.add(subcategoryId)
        }
      }
    })
    
    const category = categories.find(c => c._id === selectedCategory)
    if (!category || !category.subcategories) return []
    
    return category.subcategories.filter((sub: any) => subcategoryIds.has(sub._id))
  }, [selectedCategory, products, categories])

  // Parse productID to extract prefix and numeric part (matching backend logic)
  const parseProductID = useCallback((productID: string) => {
    if (!productID || typeof productID !== 'string') {
      return { prefix: productID || '', numericPart: 0 }
    }

    const lastDashIndex = productID.lastIndexOf('-')
    
    // If no dash found, treat entire string as prefix
    if (lastDashIndex === -1) {
      return { prefix: productID, numericPart: 0 }
    }

    // Extract prefix: all parts before the last "-"
    const prefix = productID.substring(0, lastDashIndex)
    
    // Extract numeric part: last part after the last "-"
    const numericStr = productID.substring(lastDashIndex + 1)
    const numericPart = parseInt(numericStr, 10)
    
    // If numeric part is not a valid number, treat as 0
    return {
      prefix: prefix || productID,
      numericPart: isNaN(numericPart) ? 0 : numericPart
    }
  }, [])

  // Sort products by productID sequences (matching backend sortProductsByCategoryAndID logic)
  const sortProductsByID = useCallback((products: Product[]) => {
    if (!Array.isArray(products) || products.length === 0) {
      return products
    }

    // Create a copy to avoid mutating the original array
    const sortedProducts = [...products]

    sortedProducts.sort((a, b) => {
      // Parse productIDs to get prefix and numeric part
      const parsedA = parseProductID(a.productID)
      const parsedB = parseProductID(b.productID)
      
      // Compare by productID prefix (alphabetically)
      const prefixCompare = parsedA.prefix.localeCompare(parsedB.prefix)
      if (prefixCompare !== 0) {
        return prefixCompare
      }

      // Compare by numeric part (numerically)
      const numA = Number(parsedA.numericPart) || 0
      const numB = Number(parsedB.numericPart) || 0
      return numA - numB
    })

    return sortedProducts
  }, [parseProductID])

  // Group products by category when grouping is enabled
  const groupedProducts = useMemo(() => {
    if (!groupByCategory) return { ungrouped: products }
    
    const grouped: Record<string, Product[]> = {}
    
    products.forEach((product) => {
      const categoryId = typeof product.category === 'string' 
        ? product.category 
        : product.category?._id
      
      const categoryName = typeof product.category === 'object' && product.category
        ? product.category.name
        : categories.find(c => c._id === categoryId)?.name || 'Uncategorized'
      
      if (!grouped[categoryName]) {
        grouped[categoryName] = []
      }
      grouped[categoryName].push(product)
    })
    
    // Sort products within each category by productID sequences
    Object.keys(grouped).forEach((categoryName) => {
      grouped[categoryName] = sortProductsByID(grouped[categoryName])
    })
    
    return grouped
  }, [products, groupByCategory, categories, sortProductsByID])

  if (loading && !collection) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-brass border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <div className="text-charcoal/60 text-sm">Loading collection...</div>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-2xl font-serif font-bold text-charcoal mb-2">Collection Not Found</h1>
          <p className="text-charcoal/60 mb-4">The collection you're looking for doesn't exist.</p>
          <Link href="/collections">
            <Button>Back to Collections</Button>
          </Link>
        </div>
      </div>
    )
  }

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
      </div>

      <LuxuryNavigation />
      
      <main className="pt-24 pb-16 relative z-10">
        {/* Header Section */}
        <section ref={headerSectionRef} className="bg-gradient-charcoal text-ivory py-8 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, rgba(218, 165, 32, 0.3) 0%, transparent 50%)`,
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
              className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8"
            >
              {/* Collection Visual */}
              <div className="w-full lg:w-64 flex-shrink-0">
                <CollectionVisual collection={collection} size="lg" showBadge={true} />
              </div>

              {/* Collection Info */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold mb-2 tracking-wide">
                  {collection.name}
                </h1>
                {collection.description && (
                  <p className="text-base sm:text-lg text-brass tracking-luxury mb-4 whitespace-pre-wrap">
                    {collection.description}
                  </p>
                )}

                {/* Breadcrumb */}
                <div className="flex items-center justify-center lg:justify-start gap-2 text-sm text-brass/80">
                  <Link href="/collections" className="hover:text-brass transition-colors">
                    Collections
                  </Link>
                  <span>/</span>
                  <span className="text-ivory">{collection.name}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 sm:pt-8 pb-4 sm:pb-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4 flex items-center justify-between gap-3">
            <Button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 min-h-[44px] px-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <div className="text-xs text-charcoal/60">
              {loading ? 'Loading...' : `${products.length} products`}
            </div>
          </div>

          <div className="flex gap-4 lg:gap-6 relative">
            {/* Mobile Filters Overlay */}
            <AnimatePresence>
              {mobileFiltersOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-[9997] lg:hidden"
                    onClick={() => setMobileFiltersOpen(false)}
                  />
                  <motion.aside
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed left-0 top-[80px] h-[calc(100vh-80px)] w-full max-w-[min(380px,90vw)] bg-white shadow-2xl z-[9998] lg:hidden overflow-y-auto filter-sidebar"
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
                    <div className="sticky top-0 bg-white border-b border-brass/20 p-4 sm:p-5 flex items-center justify-between z-10">
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
                    <div className="p-4 sm:p-6 pb-24 space-y-5 sm:space-y-6">
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
                          {availableCategories?.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          )) || []}
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
                          disabled={!selectedCategory || !availableSubcategories || availableSubcategories.length === 0}
                          className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                        >
                          <option value="">All Subcategories</option>
                          {availableSubcategories?.map((sub: any) => (
                            <option key={sub._id} value={sub._id}>
                              {sub.name}
                            </option>
                          )) || []}
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
                          {materials?.map((mat) => (
                            <option key={mat._id} value={mat.name}>
                              {mat.name}
                            </option>
                          )) || []}
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
                          {finishes?.map((fin) => (
                            <option key={fin._id} value={fin._id}>
                              {fin.name}
                            </option>
                          )) || []}
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

                      {/* Group by Category Toggle */}
                      <div className="border-t border-brass/20 pt-4 sm:pt-5">
                        <label className="flex items-center gap-3 cursor-pointer group min-h-[44px]">
                          <input
                            type="checkbox"
                            checked={groupByCategory}
                            onChange={(e) => setGroupByCategory(e.target.checked)}
                            className="w-6 h-6 text-brass border-brass/30 rounded focus:ring-brass transition-all group-hover:border-brass flex-shrink-0"
                          />
                          <span className="text-sm sm:text-base font-medium text-charcoal group-hover:text-brass transition-colors">
                            Group by Category
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
                      {(selectedCategory || selectedSubcategory || debouncedSearchQuery || selectedMaterial || selectedFinish || hasSize || hasDiscount) && (
                        <div className="border-t border-brass/20 pt-4 sm:pt-5">
                          <p className="text-xs font-medium text-charcoal/60 mb-3">Active Filters:</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedCategory && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brass/10 text-brass text-xs sm:text-sm rounded-full border border-brass/30">
                                <span className="truncate max-w-[150px]">{availableCategories?.find(c => c._id === selectedCategory)?.name || selectedCategory}</span>
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
                            {selectedSubcategory && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brass/10 text-brass text-xs sm:text-sm rounded-full border border-brass/30">
                                <span className="truncate max-w-[150px]">{availableSubcategories?.find((sub: any) => sub._id === selectedSubcategory)?.name || selectedSubcategory}</span>
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
                                <span className="truncate max-w-[150px]">{finishes?.find(f => f._id === selectedFinish)?.name || selectedFinish}</span>
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

            {/* Spacer div for desktop - maintains layout spacing */}
            <div className="hidden lg:block w-72 flex-shrink-0" />

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
                    {availableCategories?.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    )) || []}
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
                    disabled={!selectedCategory || !availableSubcategories || availableSubcategories.length === 0}
                    className="w-full px-3 py-2 text-sm bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">All Subcategories</option>
                    {availableSubcategories?.map((sub: any) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    )) || []}
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
                    {materials?.map((mat) => (
                      <option key={mat._id} value={mat.name}>
                        {mat.name}
                      </option>
                    )) || []}
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
                    {finishes?.map((fin) => (
                      <option key={fin._id} value={fin._id}>
                        {fin.name}
                      </option>
                    )) || []}
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

                {/* Group by Category Toggle */}
                <div className="border-t border-brass/20 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={groupByCategory}
                      onChange={(e) => setGroupByCategory(e.target.checked)}
                      className="w-5 h-5 text-brass border-brass/30 rounded focus:ring-brass transition-all group-hover:border-brass"
                    />
                    <span className="text-sm font-medium text-charcoal group-hover:text-brass transition-colors">
                      Group by Category
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
                {(selectedCategory || selectedSubcategory || debouncedSearchQuery || selectedMaterial || selectedFinish || hasSize || hasDiscount) && (
                  <div className="border-t border-brass/20 pt-4">
                    <p className="text-xs font-medium text-charcoal/60 mb-2">Active Filters:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategory && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                          {availableCategories.find(c => c._id === selectedCategory)?.name || selectedCategory}
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
                      {selectedSubcategory && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-brass/10 text-brass text-xs rounded-full border border-brass/30">
                          {availableSubcategories.find((sub: any) => sub._id === selectedSubcategory)?.name || selectedSubcategory}
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

            {/* Products Grid */}
            <div className="flex-1 min-w-0">
              <div className="hidden lg:flex items-center justify-between mb-6">
                <div className="text-charcoal/60">
                  {loading ? 'Loading...' : `${products.length} products found`}
                </div>
                {!loading && products.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-charcoal/70 hover:text-charcoal transition-colors">
                      <input
                        type="checkbox"
                        checked={groupByCategory}
                        onChange={(e) => setGroupByCategory(e.target.checked)}
                        className="w-4 h-4 text-brass border-brass/30 rounded focus:ring-brass transition-all"
                      />
                      <span>Group by Category</span>
                    </label>
                  </div>
                )}
              </div>

              {!contextLoading && loading && products.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-charcoal/60">Loading products...</div>
                </div>
              ) : contextLoading ? null : products.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center px-4">
                    <p className="text-charcoal/60 mb-4">No products found in this collection</p>
                    <Button onClick={clearFilters} variant="secondary">
                      Clear Filters
                    </Button>
                  </div>
                </div>
              ) : groupByCategory ? (
                /* Grouped Products by Category */
                <div className="space-y-8">
                  {Object.entries(groupedProducts).map(([categoryName, categoryProducts], groupIndex) => (
                    <div key={categoryName} className="space-y-4">
                      {/* Category Header */}
                      <div className="flex items-center gap-3 pb-2 border-b-2 border-brass/30">
                        <h3 className="text-xl font-serif font-bold text-charcoal">
                          {categoryName}
                        </h3>
                        <span className="text-sm text-charcoal/60">
                          ({categoryProducts.length} {categoryProducts.length === 1 ? 'product' : 'products'})
                        </span>
                      </div>
                      
                      {/* Products Grid for this Category */}
                      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        {categoryProducts.map((product, index) => {
                          const imageUrl = getProductImage(product)
                          return (
                            <Link key={product._id} href={`/products/${product._id}`}>
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: (groupIndex * 0.1) + (index * 0.03) }}
                                className="cursor-pointer group bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full flex flex-col"
                                onMouseEnter={() => setHoveredProduct(product._id)}
                                onMouseLeave={() => setHoveredProduct(null)}
                              >
                                {/* Product Image */}
                                <div className="relative h-48 sm:h-56 lg:h-64 bg-white overflow-hidden">
                                  {imageUrl ? (
                                    <Image
                                      src={imageUrl}
                                      alt={product.name}
                                      fill
                                      className="object-contain p-4"
                                    />
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
                                  <p className="text-xs text-brass tracking-luxury mb-1.5">
                                    {product.productID}
                                  </p>
                                  <h3 className="text-sm sm:text-base lg:text-lg font-serif font-bold text-charcoal mb-1.5 group-hover:text-brass transition-colors line-clamp-2">
                                    {product.name}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-charcoal/60 mb-3 line-clamp-2 flex-1 whitespace-pre-wrap">
                                    {product.description || 'Premium quality product'}
                                  </p>
                                  <div className="flex items-center justify-between mt-auto gap-2">
                                    <span className="text-xs text-charcoal">
                                      {product.materials?.length || 0} {product.materials?.length === 1 ? 'material' : 'materials'}
                                    </span>
                                    <span className="text-brass font-medium text-xs group-hover:underline">
                                      View Details →
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Ungrouped Products (Flat List) */
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {products.map((product, index) => {
                    const imageUrl = getProductImage(product)
                    return (
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
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={product.name}
                                fill
                                className="object-contain p-4"
                              />
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
                            <p className="text-xs text-brass tracking-luxury mb-1.5">
                              {product.productID}
                            </p>
                            <h3 className="text-sm sm:text-base lg:text-lg font-serif font-bold text-charcoal mb-1.5 group-hover:text-brass transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-charcoal/60 mb-3 line-clamp-2 flex-1 whitespace-pre-wrap">
                              {product.description || 'Premium quality product'}
                            </p>
                            <div className="flex items-center justify-between mt-auto gap-2">
                              <span className="text-xs text-charcoal">
                                {product.materials?.length || 0} {product.materials?.length === 1 ? 'material' : 'materials'}
                              </span>
                              <span className="text-brass font-medium text-xs group-hover:underline">
                                View Details →
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      </Link>
                    )
                  })}
                </div>
              )}

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

