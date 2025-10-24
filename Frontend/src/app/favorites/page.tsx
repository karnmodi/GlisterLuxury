'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency, toNumber } from '@/lib/utils'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import EmptyState from '@/components/ui/EmptyState'
import type { Product } from '@/types'

export default function FavoritesPage() {
  const router = useRouter()
  const { wishlist, loading, removeFromWishlist, refreshWishlist } = useWishlist()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const toast = useToast()
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    refreshWishlist()
  }, [refreshWishlist])

  const handleRemove = async (productID: string) => {
    try {
      setRemoving(productID)
      await removeFromWishlist(productID)
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
    } finally {
      setRemoving(null)
    }
  }

  const handleAddToCart = async (product: Product) => {
    if (!product.materials || product.materials.length === 0) {
      toast.warning('This product has no available materials')
      return
    }

    try {
      // Add with first material by default
      const firstMaterial = product.materials[0]
      await addToCart({
        productID: product._id,
        selectedMaterial: {
          materialID: firstMaterial.materialID,
          name: firstMaterial.name,
          basePrice: toNumber(firstMaterial.basePrice)
        },
        quantity: 1
      })
      toast.success('Added to cart!')
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast.error('Failed to add to cart')
    }
  }

  if (loading && !wishlist) {
    return (
      <div className="min-h-screen bg-charcoal">
        <LuxuryNavigation />
        <div className="pt-32 flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brass"></div>
            <p className="text-ivory mt-4">Loading favorites...</p>
          </div>
        </div>
        <LuxuryFooter />
      </div>
    )
  }

  const items = wishlist?.items || []
  const isEmpty = items.length === 0

  return (
    <div className="min-h-screen bg-charcoal">
      <LuxuryNavigation />
      
      <main className="pt-32 pb-20 px-6 lg:px-12 xl:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-serif font-bold text-ivory mb-2 tracking-wide">
              My Favorites
            </h1>
            <p className="text-brass text-sm tracking-luxury">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </motion.div>

          {/* Guest Prompt */}
          {!isAuthenticated && !isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brass/10 border border-brass/30 rounded-lg p-6 mb-8 max-w-2xl mx-auto"
            >
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-brass flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-ivory font-medium mb-1">Sign in to save your favorites</h3>
                  <p className="text-ivory/70 text-sm mb-3">
                    Your favorites are currently saved locally. Sign in to access them from any device.
                  </p>
                  <button
                    onClick={() => router.push('/login?returnUrl=/favorites')}
                    className="px-4 py-2 bg-brass text-charcoal text-sm font-medium rounded-md hover:bg-olive transition-all duration-300"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {isEmpty ? (
            <EmptyState
              icon={
                <svg className="w-24 h-24 text-brass/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              }
              title="No favorites yet"
              description="Start adding products to your favorites to see them here"
              action={{
                label: 'Browse Products',
                onClick: () => router.push('/products')
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {items.map((item, index) => {
                  const product = typeof item.productID === 'string' ? null : item.productID as Product
                  if (!product) return null

                  const isRemoving = removing === product._id

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="bg-charcoal/95 backdrop-blur-md border border-brass/20 rounded-lg overflow-hidden group hover:border-brass/40 transition-all duration-300"
                    >
                      {/* Product Image */}
                      <div 
                        className="relative h-64 bg-white cursor-pointer"
                        onClick={() => router.push(`/products/${product._id}`)}
                      >
                        {product.imageURLs && product.imageURLs.length > 0 ? (
                          <Image
                            src={product.imageURLs[0]}
                            alt={product.name}
                            fill
                            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-ivory">
                            <svg className="w-16 h-16 text-brass/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}

                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemove(product._id)
                          }}
                          disabled={isRemoving}
                          className="absolute top-3 right-3 p-2 bg-charcoal/80 backdrop-blur-sm rounded-full border border-brass/20 hover:bg-red-900/80 hover:border-red-500/50 transition-all duration-300 disabled:opacity-50"
                        >
                          {isRemoving ? (
                            <div className="w-5 h-5 border-2 border-ivory/30 border-t-ivory rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-5 h-5 text-ivory" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Product Details */}
                      <div className="p-4">
                        <p className="text-brass text-xs tracking-luxury mb-1">
                          {product.productID}
                        </p>
                        <h3 
                          className="text-ivory font-serif font-bold text-lg mb-3 line-clamp-2 cursor-pointer hover:text-brass transition-colors"
                          onClick={() => router.push(`/products/${product._id}`)}
                        >
                          {product.name}
                        </h3>

                        {product.materials && product.materials.length > 0 && (
                          <p className="text-ivory/70 text-sm mb-4">
                            {formatCurrency(toNumber(product.materials[0].basePrice))}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="flex-1 px-4 py-2 bg-brass text-charcoal text-sm font-medium rounded-md hover:bg-olive transition-all duration-300"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => router.push(`/products/${product._id}`)}
                            className="px-4 py-2 border border-brass/50 text-brass text-sm font-medium rounded-md hover:bg-brass/10 transition-all duration-300"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}

