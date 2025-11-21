'use client'

interface ProductInfoProps {
  productID: string
  name: string
  description?: string
  materialsCount: number
}

export default function ProductInfo({
  productID,
  name,
  description,
  materialsCount,
}: ProductInfoProps) {
  return (
    <div className="p-3 sm:p-4 lg:p-6 flex-1 flex flex-col">
      <p className="text-xs text-brass tracking-luxury mb-1.5 sm:mb-2">
        {productID}
      </p>
      <h3 className="text-sm sm:text-base lg:text-lg font-serif font-bold text-charcoal mb-1.5 sm:mb-2 group-hover:text-brass transition-colors line-clamp-2">
        {name}
      </h3>
      <p className="text-xs sm:text-sm text-charcoal/60 mb-3 sm:mb-4 line-clamp-2 flex-1 whitespace-pre-wrap">
        {description || 'Premium quality product'}
      </p>

      <div className="flex items-center justify-between mt-auto gap-2">
        <span className="text-xs sm:text-sm text-charcoal whitespace-nowrap">
          {materialsCount} {materialsCount === 1 ? 'material' : 'materials'}
        </span>
        <span className="text-brass font-medium text-xs sm:text-sm group-hover:underline whitespace-nowrap">
          View Details →
        </span>
      </div>
    </div>
  )
}
