'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import type { Finish } from '@/types'

interface ProductImageProps {
  thumbnailImage: string | null
  hoverImage?: string | null
  hoverImageFinishId?: string | null
  productName: string
  isHovered?: boolean
  finishes?: Finish[]
  showHoverEffect?: boolean
}

export default function ProductImage({
  thumbnailImage,
  hoverImage,
  hoverImageFinishId,
  productName,
  isHovered = false,
  finishes = [],
  showHoverEffect = true,
}: ProductImageProps) {
  // Get the finish name for the hover image
  const getHoverFinishName = () => {
    if (hoverImageFinishId && finishes.length > 0) {
      const finish = finishes.find(f => f._id === hoverImageFinishId)
      return finish?.name || null
    }
    return null
  }

  const hoverFinishName = getHoverFinishName()

  return (
    <div className="relative h-48 sm:h-56 lg:h-64 bg-white overflow-hidden">
      {/* Subtle Glow Effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-brass/5 to-transparent pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: isHovered ? 1 : 0
        }}
        transition={{ duration: 0.4 }}
      />

      {thumbnailImage ? (
        <>
          {/* Default Image with Smooth Transition */}
          <motion.div
            key={`default-${productName}`}
            initial={{ opacity: 1, scale: 1 }}
            animate={{
              opacity: isHovered && showHoverEffect && hoverImage ? 0 : 1,
              scale: isHovered && showHoverEffect && hoverImage ? 1.05 : 1
            }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="absolute inset-0"
          >
            <Image
              src={thumbnailImage}
              alt={productName}
              fill
              className="object-contain p-4"
            />
          </motion.div>

          {/* Hover Image with Smooth Transition */}
          {showHoverEffect && (
            <AnimatePresence>
              {isHovered && hoverImage && (
                <motion.div
                  key={`hover-${productName}`}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0
                  }}
                  exit={{
                    opacity: 0,
                    scale: 1.05,
                    y: -10
                  }}
                  transition={{
                    duration: 0.6,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: 0.1
                  }}
                  className="absolute inset-0"
                >
                  <Image
                    src={hoverImage}
                    alt={`${productName}${hoverFinishName ? ` - ${hoverFinishName}` : ''}`}
                    fill
                    className="object-contain p-3"
                  />

                  {/* Finish Caption Overlay - Only show if finish name exists */}
                  {hoverFinishName && (
                    <motion.div
                      initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: 15 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        rotateX: 0
                      }}
                      exit={{
                        opacity: 0,
                        y: 20,
                        scale: 0.95,
                        rotateX: -10
                      }}
                      transition={{
                        duration: 0.6,
                        delay: 0.2,
                        ease: [0.25, 0.46, 0.45, 0.94]
                      }}
                      className="absolute bottom-4 left-4 right-4 bg-charcoal/90 backdrop-blur-md text-ivory px-3 py-2 rounded-lg border border-brass/40 shadow-lg"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <motion.div
                        className="flex items-center gap-2"
                        initial={{ x: -10 }}
                        animate={{ x: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        <motion.div
                          className="w-2 h-2 bg-brass rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4, duration: 0.3 }}
                        ></motion.div>
                        <motion.span
                          className="text-sm font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5, duration: 0.3 }}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-brass rounded-full"></div>
                            <span className="text-xs font-medium">
                              {hoverFinishName}
                            </span>
                          </div>
                        </motion.span>
                      </motion.div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </>
      ) : (
        /* Fallback Placeholder */
        <div className="w-full h-full flex items-center justify-center bg-gradient-ivory">
          <svg className="w-16 h-16 text-brass/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  )
}
