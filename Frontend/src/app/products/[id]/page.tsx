'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { productsApi, finishesApi } from '@/lib/api'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useToast } from '@/contexts/ToastContext'
import { toNumber, formatCurrency } from '@/lib/utils'
import type { Product, Finish, Material, SizeOption } from '@/types'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import ProductImageGallery from '@/components/ProductImageGallery'
import ProductHeader from '@/components/ProductHeader'
import MaterialSelection from '@/components/MaterialSelection'
import SizeSelection from '@/components/SizeSelection'
import FinishSelection from '@/components/FinishSelection'
import PackagingOption from '@/components/PackagingOption'
import QuantitySelector from '@/components/QuantitySelector'
import PriceSummary from '@/components/PriceSummary'
import AddToCartButton from '@/components/AddToCartButton'
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
  const [manualImageSelected, setManualImageSelected] = useState(false)
  const [showMobileHeader, setShowMobileHeader] = useState(false)
  const [showMobilePreview, setShowMobilePreview] = useState(true)
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

  // Mobile header and preview scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (!imageRef) return
      
      const imageRect = imageRef.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const scrollY = window.scrollY
      
      // Image is considered visible if any part of it is in the viewport
      const isImageVisible = imageRect.bottom > 0 && imageRect.top < windowHeight
      
      // Show header ONLY when image is completely out of view AND we've scrolled past it
      const hasScrolledPastImage = imageRect.bottom < 0
      
      setShowMobileHeader(!isImageVisible && hasScrolledPastImage && scrollY > 50)
      
      // Hide mobile preview when at top of page (scrollY < 100) or when main image is visible
      setShowMobilePreview(scrollY > 100 || !isImageVisible)
    }

    // Initial check
    handleScroll()
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [imageRef])

  // Reset manual selection when finish changes
  useEffect(() => {
    setManualImageSelected(false)
  }, [selectedFinish])

  // Update image index based on selected finish
  useEffect(() => {
    if (manualImageSelected) return // Don't auto-update if user manually selected
    if (!product?.imageURLs) return
    
    const images = Object.values(product.imageURLs)
    if (images.length === 0) return
    
    // Sort images: default image (mappedFinishID: null) first, then others
    const sortedImages = [...images].sort((a, b) => {
      if (a.mappedFinishID === null && b.mappedFinishID !== null) return -1
      if (a.mappedFinishID !== null && b.mappedFinishID === null) return 1
      return 0
    })
    
    if (selectedFinish) {
      const finishImageIndex = sortedImages.findIndex(img => img.mappedFinishID === selectedFinish)
      if (finishImageIndex !== -1) {
        setCurrentImageIndex(finishImageIndex)
      }
    } else {
      const defaultImageIndex = sortedImages.findIndex(img => img.mappedFinishID === null)
      if (defaultImageIndex !== -1) {
        setCurrentImageIndex(defaultImageIndex)
      }
    }
  }, [selectedFinish, manualImageSelected, product])

  const handleAddToCart = async () => {
    if (!product || !selectedMaterial) {
      toast.warning('Please select a material')
      return
    }

    // Validate finish is selected
    if (!selectedFinish) {
      toast.warning('Please select a finish')
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
        selectedFinish: selectedFinish,
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

  // Smart material display logic
  const hasMultipleMaterials = product.materials && product.materials.length > 1
  const showMaterialInHeader = !hasMultipleMaterials && !!selectedMaterial

  // Get sorted images with default image first
  const getSortedImages = () => {
    const images = Object.values(product.imageURLs || {})
    if (images.length === 0) return []
    
    // Sort images: default image (mappedFinishID: null) first, then others
    return [...images].sort((a, b) => {
      if (a.mappedFinishID === null && b.mappedFinishID !== null) return -1
      if (a.mappedFinishID !== null && b.mappedFinishID === null) return 1
      return 0
    })
  }

  // Get the current display image based on selected finish or manual selection
  const getCurrentImage = () => {
    const images = getSortedImages()
    
    if (images.length === 0) return null
    
    // If an image was manually selected, show that one
    if (manualImageSelected && images[currentImageIndex]) {
      return images[currentImageIndex].url
    }
    
    // If a finish is selected, try to find a finish-specific image
    if (selectedFinish) {
      const finishSpecificImage = images.find(img => img.mappedFinishID === selectedFinish)
      if (finishSpecificImage) {
        return finishSpecificImage.url
      }
    } else {
      // If no finish is selected, show the default image (mappedFinishID: null)
      const defaultImage = images.find(img => img.mappedFinishID === null)
      if (defaultImage) {
        return defaultImage.url
      }
    }
    
    // Fallback: use the current index or first image
    return images[currentImageIndex]?.url || images[0]?.url
  }

  // Get selected finish details
  const getSelectedFinishDetails = () => {
    if (!selectedFinish) return null
    return availableFinishes.find(f => f._id === selectedFinish)
  }

  // Build URL with customer selections for breadcrumb navigation
  const buildProductsUrl = (categorySlug?: string, subcategorySlug?: string) => {
    const params = new URLSearchParams()
    
    if (categorySlug) {
      params.set('category', categorySlug)
    }
    if (subcategorySlug) {
      params.set('subcategory', subcategorySlug)
    }
    // Include customer selections if available
    if (selectedMaterial?.materialID) {
      params.set('material', selectedMaterial.materialID)
    }
    if (selectedFinish) {
      params.set('finishId', selectedFinish)
    }
    
    const queryString = params.toString()
    return queryString ? `/products?${queryString}` : '/products'
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
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Product Image Preview - Clickable to scroll to top */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                      })
                    }}
                    className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-white via-cream/20 to-white flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow duration-200"
                  >
                    <AnimatePresence mode="wait">
                      {product?.imageURLs && Object.keys(product.imageURLs).length > 0 ? (
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
                            className="object-contain p-1"
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="w-full h-full flex items-center justify-center"
                        >
                          <svg className="w-6 h-6 text-brass/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                  
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-sans font-semibold text-charcoal truncate leading-snug tracking-tight" style={{ letterSpacing: '-0.01em' }}>
                      {product?.name}
                    </h1>
                    {selectedMaterial && (
                      <p className="text-sm text-brass font-semibold flex items-center gap-2">
                        {product.discountPercentage && product.discountPercentage > 0 ? (
                          <>
                            <span className="line-through text-charcoal/60">
                              {formatCurrency(selectedMaterial.basePrice)}
                            </span>
                            <span>
                              {formatCurrency(
                                (toNumber(selectedMaterial.basePrice) * (1 - (product.discountPercentage || 0) / 100))
                              )}
                            </span>
                          </>
                        ) : (
                          <span>{formatCurrency(selectedMaterial.basePrice)}</span>
                        )}
                      </p>
                    )}
                  </div>
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
      
      <main className="pt-20 pb-8 relative z-10">
        <div className="container mx-auto px-4 py-4">
          {/* Breadcrumb with animation */}
          {product.category && typeof product.category === 'object' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-sm text-charcoal/60 mb-4 flex-wrap"
            >
              <Link href="/" className="hover:text-brass transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href={buildProductsUrl()} className="hover:text-brass transition-colors">
                Products
              </Link>
              <span>/</span>
              <Link
                href={buildProductsUrl(product.category.slug)}
                className="hover:text-brass transition-colors"
              >
                {product.category.name}
              </Link>
              {product.subcategory && (
                <>
                  <span>/</span>
                  <Link
                    href={buildProductsUrl(product.category.slug, product.subcategory.slug)}
                    className="hover:text-brass transition-colors"
                  >
                    {product.subcategory.name}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-charcoal font-medium">{product.name}</span>
            </motion.div>
          )}

          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Sticky Product Images Section */}
            <ProductImageGallery
              product={product}
              selectedFinish={selectedFinish}
              availableFinishes={availableFinishes}
              onImageChange={setCurrentImageIndex}
            />

            {/* Mobile Product Images Section */}
            <div className="w-full lg:hidden mb-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {/* Main Image Container */}
                <div 
                  ref={setImageRef}
                  className="relative bg-white rounded-xl overflow-hidden shadow-lg border border-brass/20 group"
                  data-image-container="true"
                >
                  <div className="relative h-[300px] bg-gradient-to-br from-white via-cream/20 to-white">
                    <AnimatePresence mode="wait">
                      {product.imageURLs && Object.keys(product.imageURLs).length > 0 ? (
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
                            className="object-contain p-4"
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
                  </div>
                  
                {/* Image Thumbnails - Below main image */}
                  {product.imageURLs && Object.keys(product.imageURLs).length > 1 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    className="mt-4 grid grid-cols-4 gap-2"
                    >
                      {getSortedImages().map((imageData, index) => {
                        const isCurrentImage = getCurrentImage() === imageData.url
                        return (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setCurrentImageIndex(index)
                              setManualImageSelected(true)
                            }}
                          className={`relative h-20 rounded-lg overflow-hidden border-2 bg-white ${
                              isCurrentImage ? 'border-brass shadow-lg ring-2 ring-brass/20' : 'border-brass/20'
                            } hover:border-brass/50 transition-all duration-300`}
                          >
                            <Image src={imageData.url} alt={`${product.name} ${index + 1}`} fill className="object-contain p-1" />
                          </motion.button>
                        )
                      })}
                    </motion.div>
                  )}
              </motion.div>
            </div>

            {/* Product Details - Scrollable */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full lg:w-[55%] space-y-3 min-w-0"
            >
              {/* Breadcrumb Navigation */}
              {product.category && typeof product.category === 'object' && (
                <motion.nav
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-2 text-sm text-charcoal/60 mb-4 flex-wrap"
                >
                  <Link href="/" className="hover:text-brass transition-colors">
                    Home
                  </Link>
                  <span>/</span>
                  <Link href={buildProductsUrl()} className="hover:text-brass transition-colors">
                    Products
                  </Link>
                  <span>/</span>
                  <Link
                    href={buildProductsUrl(product.category.slug)}
                    className="hover:text-brass transition-colors"
                  >
                    {product.category.name}
                  </Link>
                  {product.subcategory && (
                    <>
                      <span>/</span>
                      <Link
                        href={buildProductsUrl(product.category.slug, product.subcategory.slug)}
                        className="hover:text-brass transition-colors"
                      >
                        {product.subcategory.name}
                      </Link>
                    </>
                  )}
                  <span>/</span>
                  <span className="text-charcoal font-medium">{product.name}</span>
                </motion.nav>
              )}

              {/* Category & Subcategory Tags */}
              {(product.category && typeof product.category === 'object') || product.subcategory ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="flex items-center gap-2 mb-3"
                >
                  {product.category && typeof product.category === 'object' && (
                    <Link
                      href={buildProductsUrl(product.category.slug)}
                      className="inline-flex items-center px-3 py-1.5 bg-brass/10 text-brass text-xs font-medium rounded-full border border-brass/30 hover:bg-brass/20 hover:shadow-md transition-all duration-300"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {product.category.name}
                    </Link>
                  )}
                  {product.subcategory && product.category && typeof product.category === 'object' && (
                    <Link
                      href={buildProductsUrl(product.category.slug, product.subcategory.slug)}
                      className="inline-flex items-center px-3 py-1.5 bg-olive/10 text-olive text-xs font-medium rounded-full border border-olive/30 hover:bg-olive/20 hover:shadow-md transition-all duration-300"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      {product.subcategory.name}
                    </Link>
                  )}
                </motion.div>
              ) : null}

              {/* Product Header */}
              <ProductHeader
                product={product}
                isInWishlist={isInWishlist}
                onWishlistToggle={async () => {
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
                wishlistLoading={wishlistLoading}
                selectedMaterial={selectedMaterial}
                showMaterialInfo={showMaterialInHeader}
              />

              {/* Material Selection - Only show when multiple materials */}
              {hasMultipleMaterials && (
                <MaterialSelection
                  materials={product.materials || []}
                  selectedMaterial={selectedMaterial}
                  onMaterialSelect={(material) => {
                    setSelectedMaterial(material)
                    setSelectedSize(null)
                  }}
                />
              )}

              {/* Size Selection */}
              <SizeSelection
                sizeOptions={selectedMaterial?.sizeOptions || []}
                selectedSize={selectedSize}
                onSizeSelect={setSelectedSize}
              />

              {/* Finish Selection */}
              <FinishSelection
                product={product}
                availableFinishes={availableFinishes}
                selectedFinish={selectedFinish}
                onFinishSelect={setSelectedFinish}
                onFinishClear={() => {}} // No-op since finish is required
              />

              {/* Packaging Option */}
              <PackagingOption
                product={product}
                includePackaging={includePackaging}
                onPackagingToggle={() => setIncludePackaging(!includePackaging)}
              />

              {/* Quantity Selector */}
              <QuantitySelector
                quantity={quantity}
                onQuantityChange={setQuantity}
              />

              {/* Price Summary */}
              <PriceSummary
                product={product}
                selectedMaterial={selectedMaterial}
                selectedSize={selectedSize}
                selectedFinish={selectedFinish}
                includePackaging={includePackaging}
                quantity={quantity}
                availableFinishes={availableFinishes}
              />

              {/* Add to Cart Button */}
              <AddToCartButton
                onAddToCart={handleAddToCart}
                disabled={!selectedMaterial || !selectedFinish || cartLoading}
                loading={cartLoading}
                selectedMaterial={selectedMaterial}
                selectedFinish={selectedFinish}
              />
            </motion.div>
          </div>
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}

