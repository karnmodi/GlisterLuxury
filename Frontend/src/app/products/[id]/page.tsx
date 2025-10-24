'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { productsApi, finishesApi } from '@/lib/api'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useToast } from '@/contexts/ToastContext'
import { toNumber, formatCurrency } from '@/lib/utils'
import type { Product, Finish, Material, SizeOption } from '@/types'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import Button from '@/components/ui/Button'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart, loading: cartLoading } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const toast = useToast()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [finishes, setFinishes] = useState<Finish[]>([])
  const [loading, setLoading] = useState(true)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  
  // Selection state
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null)
  const [selectedFinish, setSelectedFinish] = useState<string>('')
  const [includePackaging, setIncludePackaging] = useState(true) // Default to included
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showMobileHeader, setShowMobileHeader] = useState(false)
  const [imageRef, setImageRef] = useState<HTMLDivElement | null>(null)

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true)
      const [productData, finishesData] = await Promise.all([
        productsApi.getById(params.id as string),
        finishesApi.getAll(),
      ])
      setProduct(productData)
      setFinishes(finishesData)
      
      // Auto-select first material if available
      if (productData.materials && productData.materials.length > 0) {
        setSelectedMaterial(productData.materials[0])
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id, fetchProduct])

  // Mobile header scroll detection - show only when image is not visible
  useEffect(() => {
    const handleScroll = () => {
      if (!imageRef) return
      
      const imageRect = imageRef.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      // Image is considered visible if any part of it is in the viewport
      const isImageVisible = imageRect.bottom > 0 && imageRect.top < windowHeight
      
      // Show header ONLY when image is completely out of view AND we've scrolled past it
      const hasScrolledPastImage = imageRect.bottom < 0
      
      setShowMobileHeader(!isImageVisible && hasScrolledPastImage && window.scrollY > 50)
    }

    // Initial check
    handleScroll()
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [imageRef])

  const handleAddToCart = async () => {
    if (!product || !selectedMaterial) {
      toast.warning('Please select a material')
      return
    }

    try {
      await addToCart({
        productID: product._id,
        selectedMaterial: {
          materialID: selectedMaterial.materialID,
          name: selectedMaterial.name,
          basePrice: toNumber(selectedMaterial.basePrice),
        },
        selectedSize: selectedSize?.sizeMM,
        selectedFinish: selectedFinish || undefined,
        quantity,
        includePackaging,
      })
      
      toast.success('Product added to cart!')
      router.push('/products')
    } catch (error) {
      console.error('Failed to add to cart:', error)
      toast.error('Failed to add to cart. Please try again.')
    }
  }

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-ivory">
        <LuxuryNavigation />
        <div className="pt-24 flex items-center justify-center h-96">
          <div className="text-charcoal/60 text-lg">Loading product...</div>
        </div>
        <LuxuryFooter />
      </div>
    )
  }

  const availableFinishes = finishes.filter(finish =>
    product.finishes?.some(f => f.finishID === finish._id)
  )

  // Get the current display image based on selected finish
  const getCurrentImage = () => {
    if (!product.imageURLs || product.imageURLs.length === 0) return null
    
    // If a finish is selected and there are multiple images, 
    // try to show a finish-specific image (this requires images to be ordered/tagged by finish)
    if (selectedFinish && product.imageURLs.length > 1) {
      const finishIndex = availableFinishes.findIndex(f => f._id === selectedFinish)
      // If there's an image for this finish index, use it
      if (finishIndex >= 0 && product.imageURLs[finishIndex + 1]) {
        return product.imageURLs[finishIndex + 1]
      }
    }
    
    return product.imageURLs[currentImageIndex]
  }

  // Get selected finish details
  const getSelectedFinishDetails = () => {
    if (!selectedFinish) return null
    return availableFinishes.find(f => f._id === selectedFinish)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory via-cream to-ivory relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-64 -right-64 w-[500px] h-[500px] bg-brass rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.02, 0.04, 0.02],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-64 -left-64 w-[600px] h-[600px] bg-olive rounded-full blur-3xl"
        />
      </div>

      <LuxuryNavigation />
      
      {/* Mobile Sticky Header - Only shows when image is not visible */}
      <AnimatePresence>
        {showMobileHeader && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-brass/20 shadow-lg lg:hidden"
            style={{ top: '80px' }} // Position just below navigation bar
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-charcoal truncate">
                    {product?.name}
                  </h1>
                  {selectedMaterial && (
                    <p className="text-sm text-brass font-semibold">
                      {formatCurrency(selectedMaterial.basePrice)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {selectedMaterial && (
                    <Button
                      onClick={handleAddToCart}
                      disabled={cartLoading}
                      size="sm"
                      className="text-sm px-4 py-2"
                    >
                      {cartLoading ? 'Adding...' : 'Add to Cart'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <main className="pt-24 pb-16 relative z-10">
        <div className="container mx-auto px-6 py-12">
          {/* Mobile Product Preview Card */}
          <div className="lg:hidden mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-brass/20"
            >
              <div className="flex items-center gap-4">
                {product?.imageURLs && product.imageURLs.length > 0 && (
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-white via-cream/20 to-white">
                    <Image
                      src={product.imageURLs[0]}
                      alt={product.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-charcoal truncate">
                    {product?.name}
                  </h2>
                  <p className="text-sm text-charcoal/60 truncate">
                    {product?.description || 'Premium quality product'}
                  </p>
                  {selectedMaterial && (
                    <p className="text-brass font-bold text-sm">
                      From {formatCurrency(selectedMaterial.basePrice)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
          {/* Breadcrumb with animation */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-charcoal/60 mb-8"
          >
            <button onClick={() => router.push('/')} className="hover:text-brass transition-colors">Home</button>
            <span>/</span>
            <button onClick={() => router.push('/products')} className="hover:text-brass transition-colors">Products</button>
            <span>/</span>
            <span className="text-charcoal font-medium">{product.name}</span>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-12">
            {/* Sticky Product Images Section */}
            <div className="w-full lg:w-[45%] shrink-0 hidden lg:block">
              <div className="lg:sticky lg:top-28 lg:h-[calc(100vh-8rem)]">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-6 h-full flex flex-col"
                >
                  {/* Main Image Container with Finish Overlay */}
                  <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl border border-brass/20 group flex-1">
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                    <motion.div
                      animate={{
                        x: ['-100%', '200%'],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 3,
                      }}
                      className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                    />
                  </div>

                  <div className="relative h-full min-h-[400px] bg-gradient-to-br from-white via-cream/20 to-white">
                    <AnimatePresence mode="wait">
                      {product.imageURLs && product.imageURLs.length > 0 ? (
                        <motion.div
                          key={getCurrentImage()}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0"
                        >
                          <Image
                            src={getCurrentImage() || ''}
                            alt={product.name}
                            fill
                            className="object-contain p-8"
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-full h-full flex items-center justify-center"
                        >
                          <div className="text-center">
                            <svg className="w-32 h-32 text-brass/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-charcoal/40">No image available</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Selected Finish Badge Overlay */}
                    <AnimatePresence>
                      {selectedFinish && getSelectedFinishDetails() && (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="absolute top-6 left-6 bg-charcoal/90 backdrop-blur-md text-ivory px-4 py-2 rounded-full border border-brass/40 shadow-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getSelectedFinishDetails()?.photoURL && (
                              <img
                                src={getSelectedFinishDetails()!.photoURL}
                                alt={getSelectedFinishDetails()!.name}
                                className="w-6 h-6 rounded-full object-cover border border-brass/30"
                              />
                            )}
                            <span className="text-sm font-medium">
                              {getSelectedFinishDetails()?.name}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Image Thumbnails */}
                  {product.imageURLs && product.imageURLs.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="absolute bottom-0 left-0 right-0 grid grid-cols-4 gap-3 p-4 bg-gradient-to-br from-ivory/50 to-cream/30 backdrop-blur-sm"
                    >
                      {product.imageURLs.map((url, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative h-20 rounded-lg overflow-hidden border-2 bg-white ${
                            currentImageIndex === index ? 'border-brass shadow-lg ring-2 ring-brass/20' : 'border-brass/20'
                          } hover:border-brass/50 transition-all duration-300`}
                        >
                          <Image src={url} alt={`${product.name} ${index + 1}`} fill className="object-contain p-2" />
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>
                </motion.div>
              </div>
            </div>

            {/* Mobile Product Images Section */}
            <div className="w-full lg:hidden mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                {/* Main Image Container */}
                <div 
                  ref={setImageRef}
                  className="relative bg-white rounded-2xl overflow-hidden shadow-2xl border border-brass/20 group"
                  data-image-container="true" // Add identifier for debugging
                >
                  <div className="relative h-[400px] bg-gradient-to-br from-white via-cream/20 to-white">
                    <AnimatePresence mode="wait">
                      {product.imageURLs && product.imageURLs.length > 0 ? (
                        <motion.div
                          key={getCurrentImage()}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0"
                        >
                          <Image
                            src={getCurrentImage() || ''}
                            alt={product.name}
                            fill
                            className="object-contain p-8"
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-full h-full flex items-center justify-center"
                        >
                          <div className="text-center">
                            <svg className="w-32 h-32 text-brass/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-charcoal/40">No image available</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Image Thumbnails */}
                  {product.imageURLs && product.imageURLs.length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="absolute bottom-0 left-0 right-0 grid grid-cols-4 gap-3 p-4 bg-gradient-to-br from-ivory/50 to-cream/30 backdrop-blur-sm"
                    >
                      {product.imageURLs.map((url, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative h-20 rounded-lg overflow-hidden border-2 bg-white ${
                            currentImageIndex === index ? 'border-brass shadow-lg ring-2 ring-brass/20' : 'border-brass/20'
                          } hover:border-brass/50 transition-all duration-300`}
                        >
                          <Image src={url} alt={`${product.name} ${index + 1}`} fill className="object-contain p-2" />
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Product Details - Scrollable */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-[55%] space-y-8 min-w-0"
            >
              {/* Header Section with Glassmorphic Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-brass/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-brass tracking-luxury font-semibold"
                  >
                    {product.productID}
                  </motion.p>
                  
                  {/* Wishlist Heart Button with pulse animation */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={async () => {
                      if (!product) return
                      setWishlistLoading(true)
                      try {
                        if (isInWishlist(product._id)) {
                          await removeFromWishlist(product._id)
                        } else {
                          await addToWishlist(product._id)
                        }
                      } catch (error) {
                        console.error('Failed to update wishlist:', error)
                      } finally {
                        setWishlistLoading(false)
                      }
                    }}
                    disabled={wishlistLoading}
                    className={`p-3 rounded-full transition-all duration-300 ${
                      isInWishlist(product._id)
                        ? 'bg-brass text-charcoal shadow-lg shadow-brass/30'
                        : 'bg-white text-charcoal border-2 border-charcoal/20 hover:border-brass hover:shadow-md'
                    } disabled:opacity-50`}
                    aria-label={isInWishlist(product._id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {wishlistLoading ? (
                      <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <motion.svg 
                        animate={isInWishlist(product._id) ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.3 }}
                        className="w-6 h-6" 
                        fill={isInWishlist(product._id) ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                        />
                      </motion.svg>
                    )}
                  </motion.button>
                </div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl lg:text-5xl font-serif font-bold text-charcoal mb-4 leading-tight"
                >
                  {product.name}
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-charcoal/70 leading-relaxed text-lg"
                >
                  {product.description || 'Premium quality product crafted with excellence and attention to detail'}
                </motion.p>
              </motion.div>

              {/* Material Selection with Animation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-brass/20"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-brass"></span>
                  <label className="block text-base font-bold text-charcoal">
                    Material <span className="text-red-500">*</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {product.materials?.map((material, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedMaterial(material)
                        setSelectedSize(null)
                      }}
                      className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                        selectedMaterial?.name === material.name
                          ? 'border-brass bg-gradient-to-br from-brass/20 to-olive/10 shadow-lg'
                          : 'border-brass/20 hover:border-brass/50 bg-white'
                      }`}
                    >
                      <p className="font-bold text-charcoal mb-1">{material.name}</p>
                      <p className="text-sm text-brass font-semibold">{formatCurrency(material.basePrice)}</p>
                      {selectedMaterial?.name === material.name && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="mt-2 flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 text-brass" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Size Selection with Animation */}
              <AnimatePresence>
                {selectedMaterial && selectedMaterial.sizeOptions && selectedMaterial.sizeOptions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-brass/20"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2 h-2 rounded-full bg-brass"></span>
                      <label className="block text-base font-bold text-charcoal">
                        Size
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedMaterial.sizeOptions.map((size, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedSize(size)}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                            selectedSize?.sizeMM === size.sizeMM
                              ? 'border-brass bg-gradient-to-br from-brass/20 to-olive/10 shadow-md'
                              : 'border-brass/20 hover:border-brass/50 bg-white'
                          }`}
                        >
                          <p className="font-bold text-charcoal">{size.sizeMM}mm</p>
                          {toNumber(size.additionalCost) > 0 && (
                            <p className="text-xs text-brass font-semibold">+{formatCurrency(size.additionalCost)}</p>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Finish Selection with Enhanced Animation */}
              <AnimatePresence>
                {availableFinishes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-brass/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brass"></span>
                        <label className="block text-base font-bold text-charcoal">
                          Finish <span className="text-charcoal/40 text-sm font-normal">(Optional)</span>
                        </label>
                      </div>
                      {selectedFinish && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setSelectedFinish('')}
                          className="text-xs text-brass hover:text-olive font-medium underline"
                        >
                          Clear
                        </motion.button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableFinishes.map((finish, finishIdx) => {
                        const finishOption = product.finishes?.find(f => f.finishID === finish._id)
                        const isSelected = selectedFinish === finish._id
                        return (
                          <motion.button
                            key={finish._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + finishIdx * 0.05 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedFinish(isSelected ? '' : finish._id)}
                            className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                              isSelected
                                ? 'border-brass bg-gradient-to-br from-brass/20 to-olive/10 shadow-xl ring-2 ring-brass/30'
                                : 'border-brass/20 hover:border-brass/50 bg-white hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Finish Preview Image/Color */}
                              <div className="relative">
                                {finish.photoURL ? (
                                  <motion.div
                                    whileHover={{ rotate: [0, -5, 5, 0] }}
                                    transition={{ duration: 0.5 }}
                                  >
                                    <img
                                      src={finish.photoURL}
                                      alt={finish.name}
                                      className="w-20 h-20 object-cover rounded-xl border-2 border-brass/30 shadow-md bg-white"
                                    />
                                  </motion.div>
                                ) : finish.color ? (
                                  <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    className="w-20 h-20 rounded-xl border-2 border-brass/30 shadow-md"
                                    style={{ backgroundColor: finish.color }}
                                  />
                                ) : (
                                  <div className="w-20 h-20 bg-gradient-to-br from-cream to-ivory rounded-xl border-2 border-brass/30 flex items-center justify-center shadow-md">
                                    <svg className="w-10 h-10 text-brass/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-brass rounded-full flex items-center justify-center shadow-lg"
                                  >
                                    <svg className="w-4 h-4 text-charcoal" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </motion.div>
                                )}
                              </div>
                              
                              {/* Finish Details */}
                              <div className="flex-1 text-left">
                                <p className="font-bold text-charcoal mb-1 text-base">{finish.name}</p>
                                {finish.color && (
                                  <p className="text-xs text-charcoal/50 font-mono mb-2">{finish.color}</p>
                                )}
                                {finishOption && toNumber(finishOption.priceAdjustment) !== 0 && (
                                  <motion.p
                                    animate={{ scale: isSelected ? [1, 1.1, 1] : 1 }}
                                    className="text-sm text-brass font-bold"
                                  >
                                    {toNumber(finishOption.priceAdjustment) > 0 ? '+' : ''}{formatCurrency(finishOption.priceAdjustment)}
                                  </motion.p>
                                )}
                                {finish.description && (
                                  <p className="text-xs text-charcoal/60 mt-2 line-clamp-2">
                                    {finish.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                    {selectedFinish && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-4 bg-gradient-to-r from-brass/10 to-olive/10 rounded-xl border border-brass/20"
                      >
                        <p className="text-sm text-charcoal/80">
                          <span className="font-semibold">Selected:</span> {getSelectedFinishDetails()?.name}
                          {getSelectedFinishDetails()?.description && ` - ${getSelectedFinishDetails()?.description}`}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Packaging Option with Animation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-brass/20"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-brass"></span>
                  <label className="block text-base font-bold text-charcoal">
                    Packaging
                  </label>
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setIncludePackaging(!includePackaging)}
                  className={`w-full p-5 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
                    includePackaging
                      ? 'border-brass bg-gradient-to-br from-brass/20 to-olive/10 shadow-md'
                      : 'border-brass/20 hover:border-brass/50 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ scale: includePackaging ? [1, 1.2, 1] : 1 }}
                      className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center ${
                        includePackaging ? 'border-brass bg-brass' : 'border-brass/30'
                      }`}
                    >
                      <AnimatePresence>
                        {includePackaging && (
                          <motion.svg
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 180 }}
                            className="w-5 h-5 text-charcoal"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </motion.div>
                    <div className="text-left">
                      <p className="font-bold text-charcoal">
                        Include {product.packagingUnit || 'Packaging'}
                      </p>
                      <p className="text-xs text-charcoal/60">
                        Premium packaging for your product
                      </p>
                    </div>
                  </div>
                  <div className="text-brass font-bold text-lg">
                    {toNumber(product.packagingPrice) > 0 ? formatCurrency(product.packagingPrice) : 'Free'}
                  </div>
                </motion.button>
              </motion.div>

              {/* Quantity with Animation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-brass/20"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-brass"></span>
                  <label className="block text-base font-bold text-charcoal">
                    Quantity
                  </label>
                </div>
                <div className="flex items-center gap-6">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-12 h-12 rounded-xl border-2 border-brass/30 hover:border-brass hover:bg-brass/10 transition-all flex items-center justify-center text-xl font-bold text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    −
                  </motion.button>
                  <motion.span
                    key={quantity}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-bold text-charcoal min-w-[60px] text-center"
                  >
                    {quantity}
                  </motion.span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-xl border-2 border-brass/30 hover:border-brass hover:bg-brass/10 transition-all flex items-center justify-center text-xl font-bold text-charcoal"
                  >
                    +
                  </motion.button>
                </div>
              </motion.div>

              {/* Price Summary with Animation */}
              <AnimatePresence>
                {selectedMaterial && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-charcoal via-charcoal/95 to-charcoal/90 rounded-2xl p-8 border-2 border-brass/40 shadow-2xl overflow-hidden relative"
                  >
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle, #C5A572 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }} />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-6">
                        <svg className="w-5 h-5 text-brass" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                        <h3 className="text-xl font-bold text-brass">Price Breakdown</h3>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <motion.div
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.8 }}
                          className="flex justify-between items-center text-base"
                        >
                          <span className="text-ivory/80 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                            Material ({selectedMaterial.name})
                          </span>
                          <span className="font-bold text-ivory">{formatCurrency(selectedMaterial.basePrice)}</span>
                        </motion.div>
                        
                        <AnimatePresence>
                          {selectedSize && toNumber(selectedSize.additionalCost) > 0 && (
                            <motion.div
                              initial={{ x: -20, opacity: 0, height: 0 }}
                              animate={{ x: 0, opacity: 1, height: 'auto' }}
                              exit={{ x: -20, opacity: 0, height: 0 }}
                              className="flex justify-between items-center text-base"
                            >
                              <span className="text-ivory/80 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                                Size ({selectedSize.sizeMM}mm)
                              </span>
                              <span className="font-bold text-brass">+{formatCurrency(selectedSize.additionalCost)}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <AnimatePresence>
                          {selectedFinish && (() => {
                            const finishOption = product.finishes?.find(f => f.finishID === selectedFinish)
                            const finishDetail = finishes.find(f => f._id === selectedFinish)
                            if (finishOption && toNumber(finishOption.priceAdjustment) !== 0) {
                              return (
                                <motion.div
                                  initial={{ x: -20, opacity: 0, height: 0 }}
                                  animate={{ x: 0, opacity: 1, height: 'auto' }}
                                  exit={{ x: -20, opacity: 0, height: 0 }}
                                  className="flex justify-between items-center text-base"
                                >
                                  <span className="text-ivory/80 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                                    Finish ({finishDetail?.name})
                                  </span>
                                  <span className="font-bold text-brass">
                                    {toNumber(finishOption.priceAdjustment) > 0 ? '+' : ''}{formatCurrency(finishOption.priceAdjustment)}
                                  </span>
                                </motion.div>
                              )
                            }
                            return null
                          })()}
                        </AnimatePresence>
                        
                        <AnimatePresence>
                          {includePackaging && toNumber(product.packagingPrice) > 0 && (
                            <motion.div
                              initial={{ x: -20, opacity: 0, height: 0 }}
                              animate={{ x: 0, opacity: 1, height: 'auto' }}
                              exit={{ x: -20, opacity: 0, height: 0 }}
                              className="flex justify-between items-center text-base"
                            >
                              <span className="text-ivory/80 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                                Premium Packaging
                              </span>
                              <span className="font-bold text-brass">+{formatCurrency(product.packagingPrice)}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      
                      <div className="border-t-2 border-brass/30 pt-6 space-y-3">
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.9 }}
                          className="flex justify-between items-center"
                        >
                          <span className="text-xl font-bold text-ivory">Unit Price</span>
                          <span className="text-3xl font-bold text-brass">
                            {(() => {
                              let total = toNumber(selectedMaterial.basePrice)
                              if (selectedSize) total += toNumber(selectedSize.additionalCost)
                              if (selectedFinish) {
                                const finishOption = product.finishes?.find(f => f.finishID === selectedFinish)
                                if (finishOption) total += toNumber(finishOption.priceAdjustment)
                              }
                              if (includePackaging) total += toNumber(product.packagingPrice)
                              return formatCurrency(total)
                            })()}
                          </span>
                        </motion.div>
                        
                        <AnimatePresence>
                          {quantity > 1 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex justify-between items-center text-sm bg-brass/10 rounded-lg p-3"
                            >
                              <span className="text-ivory/90 font-semibold">Total for {quantity} items</span>
                              <span className="text-lg font-bold text-brass">
                                {(() => {
                                  let unitPrice = toNumber(selectedMaterial.basePrice)
                                  if (selectedSize) unitPrice += toNumber(selectedSize.additionalCost)
                                  if (selectedFinish) {
                                    const finishOption = product.finishes?.find(f => f.finishID === selectedFinish)
                                    if (finishOption) unitPrice += toNumber(finishOption.priceAdjustment)
                                  }
                                  if (includePackaging) unitPrice += toNumber(product.packagingPrice)
                                  return formatCurrency(unitPrice * quantity)
                                })()}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Add to Cart Button with Animation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="pt-4"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleAddToCart}
                    disabled={!selectedMaterial || cartLoading}
                    size="lg"
                    className="w-full text-lg font-bold py-6 shadow-xl hover:shadow-2xl hover:shadow-brass/30 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {cartLoading ? (
                        <>
                          <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding to Cart...
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          Add to Cart
                        </>
                      )}
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-olive to-brass opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={false}
                    />
                  </Button>
                </motion.div>
                
                {!selectedMaterial && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-red-500 mt-3"
                  >
                    Please select a material to continue
                  </motion.p>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}

