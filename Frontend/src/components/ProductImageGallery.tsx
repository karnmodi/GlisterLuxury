'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import type { Product, Finish } from '@/types'

interface ProductImageGalleryProps {
  product: Product
  selectedFinish: string
  availableFinishes: Finish[]
  onImageChange?: (index: number) => void
}

export default function ProductImageGallery({ 
  product, 
  selectedFinish, 
  availableFinishes,
  onImageChange 
}: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [manualImageSelected, setManualImageSelected] = useState(false)
  const [imageRef, setImageRef] = useState<HTMLDivElement | null>(null)

  // Get sorted images with default image first
  const getSortedImages = () => {
    const images = Object.values(product.imageURLs || {})
    if (images.length === 0) return []
    
    // Sort images: default image (mappedFinishID: null) first, then others
    return images.sort((a, b) => {
      if (a.mappedFinishID === null && b.mappedFinishID !== null) return -1
      if (a.mappedFinishID !== null && b.mappedFinishID === null) return 1
      return 0
    })
  }

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

  // Reset manual selection when finish changes
  useEffect(() => {
    setManualImageSelected(false)
  }, [selectedFinish])

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

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index)
    setManualImageSelected(true)
    onImageChange?.(index)
  }

  return (
    <div className="w-full lg:w-[45%] shrink-0 hidden lg:block">
      <div className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="h-full flex flex-col"
        >
          {/* Main Image Container with Finish Overlay */}
          <div className="relative bg-white rounded-xl overflow-hidden shadow-xl border border-brass/20 group flex-1">
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

            <div className="relative h-full min-h-[350px] bg-gradient-to-br from-white via-cream/20 to-white">
              <AnimatePresence mode="wait">
                {(() => {
                  const images = Object.values(product.imageURLs || {})
                  return images.length > 0 ? (
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
                      className="object-contain p-6"
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
                  )
                })()}
              </AnimatePresence>

              {/* Selected Finish Badge Overlay */}
              <AnimatePresence>
                {selectedFinish && getSelectedFinishDetails() && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="absolute top-4 left-4 bg-charcoal/90 backdrop-blur-md text-ivory px-3 py-1.5 rounded-full border border-brass/40 shadow-lg"
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
          </div>
          
          {/* Image Thumbnails - Below main image */}
          {(() => {
            const images = getSortedImages()
            return images.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 grid grid-cols-4 gap-2"
              >
                {getSortedImages().map((img, index) => {
                  const isCurrentImage = getCurrentImage() === img.url
                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleImageChange(index)}
                      className={`relative h-20 rounded-lg overflow-hidden border-2 bg-white ${
                        isCurrentImage ? 'border-brass shadow-lg ring-2 ring-brass/20' : 'border-brass/20'
                      } hover:border-brass/50 transition-all duration-300`}
                    >
                      <Image src={img.url} alt={`${product.name} ${index + 1}`} fill sizes="80px" className="object-contain p-1" />
                    </motion.button>
                  )
                })}
              </motion.div>
            )
          })()}
        </motion.div>
      </div>
    </div>
  )
}
