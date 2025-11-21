'use client'

import { useMemo } from 'react'
import ProductCard from './ProductCard'
import ProductCardSkeleton from '../ProductCardSkeleton'
import Button from '../ui/Button'
import type { Category, Finish } from '@/types'

interface ProductGridProps {
  products: any[]
  loading?: boolean
  contextLoading?: boolean
  groupByCategory?: boolean
  categories?: Category[]
  hoveredProduct?: string | null
  onMouseEnter?: (id: string) => void
  onMouseLeave?: () => void
  onClearFilters?: () => void
  showHoverEffect?: boolean
  finishes?: Finish[]
  getProductImage?: (product: any) => string | null
  getHoverImage?: (product: any) => string | null
  getHoverFinishId?: (product: any) => string | null
  sortProductsByID?: (products: any[]) => any[]
}

export default function ProductGrid({
  products,
  loading = false,
  contextLoading = false,
  groupByCategory = false,
  categories = [],
  hoveredProduct = null,
  onMouseEnter,
  onMouseLeave,
  onClearFilters,
  showHoverEffect = true,
  finishes = [],
  getProductImage,
  getHoverImage,
  getHoverFinishId,
  sortProductsByID,
}: ProductGridProps) {
  // Group products by category when grouping is enabled
  const groupedProducts = useMemo(() => {
    if (!groupByCategory) return { ungrouped: products }

    const grouped: Record<string, any[]> = {}

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

    // Sort products within each category by productID sequences if sorter is provided
    if (sortProductsByID) {
      Object.keys(grouped).forEach((categoryName) => {
        grouped[categoryName] = sortProductsByID(grouped[categoryName])
      })
    }

    return grouped
  }, [products, groupByCategory, categories, sortProductsByID])

  // Loading state
  if (!contextLoading && loading && products.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  // Context loading (don't render anything)
  if (contextLoading) {
    return null
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center px-4">
          <p className="text-charcoal/60 text-base sm:text-lg mb-4">No products found</p>
          {onClearFilters && (
            <Button onClick={onClearFilters} variant="secondary" className="min-h-[44px]">
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Grouped products display
  if (groupByCategory) {
    return (
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
              {categoryProducts.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  index={groupIndex * 10 + index}
                  hoveredProduct={hoveredProduct}
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                  showHoverEffect={showHoverEffect}
                  finishes={finishes}
                  getProductImage={getProductImage}
                  getHoverImage={getHoverImage}
                  getHoverFinishId={getHoverFinishId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Ungrouped products display (flat list)
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {products.map((product, index) => (
        <ProductCard
          key={product._id}
          product={product}
          index={index}
          hoveredProduct={hoveredProduct}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          showHoverEffect={showHoverEffect}
          finishes={finishes}
          getProductImage={getProductImage}
          getHoverImage={getHoverImage}
          getHoverFinishId={getHoverFinishId}
        />
      ))}
    </div>
  )
}
