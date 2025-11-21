'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { collectionsApi, categoriesApi, finishesApi, materialsApi } from '@/lib/api'
import type { Collection, Product, Category, Finish, MaterialMaster } from '@/types'
import { useLoading } from '@/contexts/LoadingContext'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import CollectionVisual from '@/components/CollectionVisual'
import Button from '@/components/ui/Button'
import { ProductGrid, FilterSidebar } from '@/components/products'
import { useProductImage } from '@/hooks/useProductImage'
import { motion } from 'framer-motion'

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

  // Use product image hook
  const { getProductImage, getHoverImage, getHoverFinishId } = useProductImage()

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
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      setFinishes(Array.isArray(finishesData) ? finishesData : [])
      setMaterials(Array.isArray(materialsData) ? materialsData : [])
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
      setCategories([])
      setFinishes([])
      setMaterials([])
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

  // Parse productID to extract prefix and numeric part
  const parseProductID = useCallback((productID: string) => {
    if (!productID || typeof productID !== 'string') {
      return { prefix: productID || '', numericPart: 0 }
    }

    const lastDashIndex = productID.lastIndexOf('-')

    if (lastDashIndex === -1) {
      return { prefix: productID, numericPart: 0 }
    }

    const prefix = productID.substring(0, lastDashIndex)
    const numericStr = productID.substring(lastDashIndex + 1)
    const numericPart = parseInt(numericStr, 10)

    return {
      prefix: prefix || productID,
      numericPart: isNaN(numericPart) ? 0 : numericPart
    }
  }, [])

  // Sort products by productID sequences
  const sortProductsByID = useCallback((products: Product[]) => {
    if (!Array.isArray(products) || products.length === 0) {
      return products
    }

    const sortedProducts = [...products]

    sortedProducts.sort((a, b) => {
      const parsedA = parseProductID(a.productID)
      const parsedB = parseProductID(b.productID)

      const prefixCompare = parsedA.prefix.localeCompare(parsedB.prefix)
      if (prefixCompare !== 0) {
        return prefixCompare
      }

      const numA = Number(parsedA.numericPart) || 0
      const numB = Number(parsedB.numericPart) || 0
      return numA - numB
    })

    return sortedProducts
  }, [parseProductID])

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
        <section className="bg-gradient-charcoal text-ivory py-8 relative overflow-hidden">
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
              groupByCategory={groupByCategory}
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
              onGroupByCategoryChange={setGroupByCategory}
              onClearFilters={clearFilters}
              categories={availableCategories}
              materials={materials}
              finishes={finishes}
              availableSubcategories={availableSubcategories}
              mobileOpen={mobileFiltersOpen}
              onMobileClose={() => setMobileFiltersOpen(false)}
              sidebarRef={{ current: null }}
              sidebarTop={0}
              activeFilterCount={activeFilterCount}
              useStaticPositioning={true}
              showGroupToggle={true}
              debouncedSearchQuery={debouncedSearchQuery}
            />

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

              {/* Product Grid Component */}
              <ProductGrid
                products={products}
                loading={loading}
                contextLoading={contextLoading}
                groupByCategory={groupByCategory}
                categories={categories}
                hoveredProduct={hoveredProduct}
                onMouseEnter={setHoveredProduct}
                onMouseLeave={() => setHoveredProduct(null)}
                onClearFilters={clearFilters}
                showHoverEffect={true}
                finishes={finishes}
                getProductImage={getProductImage}
                getHoverImage={getHoverImage}
                getHoverFinishId={getHoverFinishId}
                sortProductsByID={sortProductsByID}
              />

              {/* Infinite scroll trigger */}
              {!loading && hasMore && (
                <div ref={loadMoreRef} className="h-1 w-full" />
              )}
            </div>
          </div>
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}
