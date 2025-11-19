'use client'

export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col animate-pulse">
      {/* Product Image Skeleton */}
      <div className="relative h-48 sm:h-56 lg:h-64 bg-gradient-to-br from-charcoal/5 via-charcoal/10 to-charcoal/5 overflow-hidden" />

      {/* Product Info Skeleton */}
      <div className="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col">
        {/* Product ID Skeleton */}
        <div className="h-3 w-20 bg-brass/20 rounded mb-1.5 sm:mb-2" />

        {/* Product Name Skeleton */}
        <div className="h-4 sm:h-5 lg:h-6 w-3/4 bg-charcoal/20 rounded mb-1.5 sm:mb-2" />

        {/* Description Skeleton - Two lines */}
        <div className="space-y-2 mb-3 sm:mb-4 flex-1">
          <div className="h-3 sm:h-4 w-full bg-charcoal/10 rounded" />
          <div className="h-3 sm:h-4 w-5/6 bg-charcoal/10 rounded" />
        </div>

        {/* Footer Skeleton */}
        <div className="flex items-center justify-between mt-auto gap-2">
          <div className="h-3 sm:h-4 w-24 bg-charcoal/10 rounded" />
          <div className="h-3 sm:h-4 w-20 bg-brass/20 rounded" />
        </div>
      </div>
    </div>
  )
}

