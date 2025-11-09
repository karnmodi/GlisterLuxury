'use client'

import { useEffect, useState, useMemo } from 'react'
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
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import type { Product } from '@/types'

export default function FavoritesPage() {
  const router = useRouter()
  const { wishlist, loading, removeFromWishlist, refreshWishlist } = useWishlist()
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const toast = useToast()
  const [removing, setRemoving] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

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
    if (!product.materials || !Array.isArray(product.materials) || product.materials.length === 0) {
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

  // Get the default image (mappedFinishID: null or undefined)
  const getDefaultImage = (product: Product) => {
    if (!product.imageURLs || Object.keys(product.imageURLs || {}).length === 0) {
      return null
    }

    const images = Object.values(product.imageURLs || {})
    // First try to find image with no mappedFinishID (default image)
    const defaultImage = images.find(img => !img.mappedFinishID || img.mappedFinishID === null)
    if (defaultImage) {
      return defaultImage.url
    }
    
    // Fallback to first available image
    return images[0]?.url || null
  }

  // Filter and search products
  const filteredItems = useMemo(() => {
    const items = wishlist?.items || []
    if (!searchQuery) return items

    return items.filter(item => {
      const product = typeof item.productID === 'string' ? null : item.productID as Product
      if (!product) return false
      
      return product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             product.productID.toLowerCase().includes(searchQuery.toLowerCase()) ||
             (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    })
  }, [wishlist?.items, searchQuery])

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
            className="text-center mb-8"
          >
            <h1 className="text-4xl lg:text-5xl font-serif font-bold text-ivory mb-3 tracking-wide">
              My Favorites
            </h1>
            <p className="text-brass text-sm tracking-luxury">
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} saved
            </p>
          </motion.div>

          {/* Search and View Controls */}
          {!isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gradient-to-r from-charcoal/80 via-charcoal/60 to-charcoal/80 backdrop-blur-xl border border-brass/30 rounded-2xl p-6 mb-8 shadow-2xl"
            >
              <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
                {/* Search Bar */}
                <div className="flex-1 w-full xl:max-w-2xl">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-brass/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <Input
                      placeholder="Search your favorites..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 pr-4 py-3 bg-charcoal/70 border-brass/40 text-ivory placeholder-ivory/60 focus:border-brass focus:ring-2 focus:ring-brass/20 rounded-xl text-base w-full"
                    />
                    {/* Clear Search Button */}
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-brass/60 hover:text-brass transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-4">
                  <span className="text-ivory/80 text-sm font-medium whitespace-nowrap">View:</span>
                  <div className="flex bg-charcoal/70 rounded-xl p-1 border border-brass/30 shadow-lg">
                    <button
                      onClick={() => setViewMode('card')}
                      className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 min-w-[80px] justify-center ${
                        viewMode === 'card'
                          ? 'bg-brass text-charcoal shadow-lg'
                          : 'text-ivory/70 hover:text-ivory hover:bg-charcoal/50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span className="hidden md:inline">Grid</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 min-w-[80px] justify-center ${
                        viewMode === 'list'
                          ? 'bg-brass text-charcoal shadow-lg'
                          : 'text-ivory/70 hover:text-ivory hover:bg-charcoal/50'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span className="hidden md:inline">List</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

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
            <>
              {/* No Results Message */}
              {filteredItems.length === 0 && searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <svg className="w-16 h-16 text-brass/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-ivory text-lg font-medium mb-2">No results found</h3>
                  <p className="text-ivory/70 mb-4">Try adjusting your search terms</p>
                  <Button onClick={() => setSearchQuery('')} variant="secondary">
                    Clear Search
                  </Button>
                </motion.div>
              )}

              {/* Products Display */}
              {filteredItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className={viewMode === 'card' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                  }
                >
                  <AnimatePresence>
                    {filteredItems.map((item, index) => {
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
                          className={viewMode === 'card'
                            ? "bg-gradient-to-br from-charcoal/95 via-charcoal/90 to-charcoal/95 backdrop-blur-xl border border-brass/30 rounded-2xl overflow-hidden group hover:border-brass/50 hover:shadow-2xl hover:shadow-brass/10 transition-all duration-500 shadow-xl"
                            : "bg-gradient-to-br from-charcoal/95 via-charcoal/90 to-charcoal/95 backdrop-blur-xl border border-brass/30 rounded-2xl overflow-hidden group hover:border-brass/50 hover:shadow-2xl hover:shadow-brass/10 transition-all duration-500 shadow-xl"
                          }
                        >
                          {viewMode === 'card' ? (
                            <>
                              {/* Card View - Product Image */}
                              <div 
                                className="relative h-64 bg-gradient-to-br from-white via-cream/20 to-white cursor-pointer group/image"
                                onClick={() => router.push(`/products/${product._id}`)}
                              >
                                {getDefaultImage(product) ? (
                                  <Image
                                    src={getDefaultImage(product)!}
                                    alt={product.name}
                                    fill
                                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ivory via-cream/20 to-ivory">
                                    <div className="text-center">
                                      <svg className="w-16 h-16 text-brass/30 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                      </svg>
                                      <p className="text-brass/50 text-xs">No image</p>
                                    </div>
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

                              {/* Card View - Product Details */}
                              <div className="p-6">
                                <p className="text-brass text-xs tracking-luxury mb-2 font-medium">
                                  {product.productID}
                                </p>
                                <h3 
                                  className="text-ivory font-serif font-bold text-lg mb-3 line-clamp-2 cursor-pointer hover:text-brass transition-colors group-hover:scale-105 transform duration-300"
                                  onClick={() => router.push(`/products/${product._id}`)}
                                >
                                  {product.name}
                                </h3>

                                {product.materials && Array.isArray(product.materials) && product.materials.length > 0 && (
                                  <p className="text-ivory/80 text-lg font-semibold mb-6">
                                    {formatCurrency(toNumber(product.materials[0].basePrice))}
                                  </p>
                                )}

                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleAddToCart(product)}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-brass to-brass/90 text-charcoal text-sm font-semibold rounded-xl hover:from-brass/90 hover:to-brass/80 transition-all duration-300 shadow-lg hover:shadow-xl"
                                  >
                                    Add to Cart
                                  </button>
                                  <button
                                    onClick={() => router.push(`/products/${product._id}`)}
                                    className="px-4 py-3 border-2 border-brass/50 text-brass text-sm font-semibold rounded-xl hover:bg-brass/10 hover:border-brass transition-all duration-300"
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* List View */}
                              <div className="flex items-center gap-6 p-6">
                                {/* Product Image */}
                                <div 
                                  className="relative w-24 h-24 bg-gradient-to-br from-white via-cream/20 to-white rounded-xl cursor-pointer flex-shrink-0 shadow-lg group/image"
                                  onClick={() => router.push(`/products/${product._id}`)}
                                >
                                  {getDefaultImage(product) ? (
                                    <Image
                                      src={getDefaultImage(product)!}
                                      alt={product.name}
                                      fill
                                      className="object-contain p-2 rounded-lg"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ivory via-cream/20 to-ivory rounded-lg">
                                      <div className="text-center">
                                        <svg className="w-8 h-8 text-brass/30 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-brass/50 text-xs">No image</p>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-brass text-xs tracking-luxury mb-2 font-medium">
                                    {product.productID}
                                  </p>
                                  <h3 
                                    className="text-ivory font-serif font-bold text-xl mb-2 cursor-pointer hover:text-brass transition-colors"
                                    onClick={() => router.push(`/products/${product._id}`)}
                                  >
                                    {product.name}
                                  </h3>
                                  {product.materials && Array.isArray(product.materials) && product.materials.length > 0 && (
                                    <p className="text-ivory/80 text-lg font-semibold">
                                      {formatCurrency(toNumber(product.materials[0].basePrice))}
                                    </p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleAddToCart(product)}
                                    className="px-6 py-3 bg-gradient-to-r from-brass to-brass/90 text-charcoal text-sm font-semibold rounded-xl hover:from-brass/90 hover:to-brass/80 transition-all duration-300 shadow-lg hover:shadow-xl"
                                  >
                                    Add to Cart
                                  </button>
                                  <button
                                    onClick={() => router.push(`/products/${product._id}`)}
                                    className="px-6 py-3 border-2 border-brass/50 text-brass text-sm font-semibold rounded-xl hover:bg-brass/10 hover:border-brass transition-all duration-300"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handleRemove(product._id)}
                                    disabled={isRemoving}
                                    className="p-3 bg-charcoal/80 backdrop-blur-sm rounded-full border border-brass/20 hover:bg-red-900/80 hover:border-red-500/50 transition-all duration-300 disabled:opacity-50"
                                  >
                                    {isRemoving ? (
                                      <div className="w-4 h-4 border-2 border-ivory/30 border-t-ivory rounded-full animate-spin"></div>
                                    ) : (
                                      <svg className="w-4 h-4 text-ivory" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                      </svg>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}

