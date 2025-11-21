import { useCallback } from 'react'
import type { Product } from '@/types'

/**
 * Custom hook to extract product images from different product data structures
 * Handles both MinimalProduct (with thumbnailImage/hoverImage) and full Product (with imageURLs)
 */
export function useProductImage() {
  /**
   * Get the primary/thumbnail image from a product
   */
  const getProductImage = useCallback((product: Product): string | null => {
    if (!product.imageURLs || Object.keys(product.imageURLs || {}).length === 0) {
      return null
    }
    const imageValues = Object.values(product.imageURLs || {})
    if (imageValues.length === 0) return null
    const firstImage = imageValues[0]
    return typeof firstImage === 'string' ? firstImage : firstImage?.url || null
  }, [])

  /**
   * Get the hover image from a product (if available)
   * Returns the second image in imageURLs if it exists
   */
  const getHoverImage = useCallback((product: Product): string | null => {
    if (!product.imageURLs || Object.keys(product.imageURLs || {}).length < 2) {
      return null
    }
    const imageValues = Object.values(product.imageURLs || {})
    if (imageValues.length < 2) return null
    const secondImage = imageValues[1]
    return typeof secondImage === 'string' ? secondImage : secondImage?.url || null
  }, [])

  /**
   * Get the finish ID associated with the hover image
   * Returns the finish ID (key) of the second image in imageURLs
   */
  const getHoverFinishId = useCallback((product: Product): string | null => {
    if (!product.imageURLs || Object.keys(product.imageURLs || {}).length < 2) {
      return null
    }
    const imageKeys = Object.keys(product.imageURLs || {})
    if (imageKeys.length < 2) return null
    // Return the second finish ID (key)
    return imageKeys[1]
  }, [])

  return {
    getProductImage,
    getHoverImage,
    getHoverFinishId,
  }
}
