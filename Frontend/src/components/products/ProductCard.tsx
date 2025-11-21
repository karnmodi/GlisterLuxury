'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import ProductImage from './ProductImage'
import ProductInfo from './ProductInfo'
import type { Finish } from '@/types'

// Union type to support both MinimalProduct and full Product
interface BaseProductCardProps {
  _id: string
  productID: string
  name: string
  description?: string
  materialsCount?: number
  materials?: any[]
}

interface MinimalProductCardData extends BaseProductCardProps {
  thumbnailImage: string | null
  hoverImage?: string | null
  hoverImageFinishId?: string | null
  materialsCount: number
}

interface FullProductCardData extends BaseProductCardProps {
  imageURLs?: Record<string, any>
  materials?: any[]
}

type ProductCardData = MinimalProductCardData | FullProductCardData

interface ProductCardProps {
  product: ProductCardData
  index?: number
  hoveredProduct?: string | null
  onMouseEnter?: (id: string) => void
  onMouseLeave?: () => void
  showHoverEffect?: boolean
  finishes?: Finish[]
  getProductImage?: (product: any) => string | null
  getHoverImage?: (product: any) => string | null
  getHoverFinishId?: (product: any) => string | null
}

export default function ProductCard({
  product,
  index = 0,
  hoveredProduct = null,
  onMouseEnter,
  onMouseLeave,
  showHoverEffect = true,
  finishes = [],
  getProductImage,
  getHoverImage,
  getHoverFinishId,
}: ProductCardProps) {
  // Determine if this is a MinimalProduct (has thumbnailImage) or full Product
  const isMinimalProduct = 'thumbnailImage' in product

  // Get images based on product type
  const thumbnailImage = isMinimalProduct
    ? product.thumbnailImage
    : getProductImage
    ? getProductImage(product)
    : null

  const hoverImage = isMinimalProduct
    ? product.hoverImage || null
    : getHoverImage
    ? getHoverImage(product)
    : null

  const hoverImageFinishId = isMinimalProduct
    ? product.hoverImageFinishId || null
    : getHoverFinishId
    ? getHoverFinishId(product)
    : null

  // Get materials count
  const materialsCount = product.materialsCount || product.materials?.length || 0

  // Check if this product is currently hovered
  const isHovered = hoveredProduct === product._id

  return (
    <Link href={`/products/${product._id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.03 }}
        className="cursor-pointer group bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full flex flex-col"
        onMouseEnter={() => onMouseEnter?.(product._id)}
        onMouseLeave={() => onMouseLeave?.()}
      >
        <ProductImage
          thumbnailImage={thumbnailImage}
          hoverImage={hoverImage}
          hoverImageFinishId={hoverImageFinishId}
          productName={product.name}
          isHovered={isHovered}
          finishes={finishes}
          showHoverEffect={showHoverEffect}
        />

        <ProductInfo
          productID={product.productID}
          name={product.name}
          description={product.description}
          materialsCount={materialsCount}
        />
      </motion.div>
    </Link>
  )
}
