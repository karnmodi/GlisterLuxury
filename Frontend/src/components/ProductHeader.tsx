'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatCurrency, toNumber } from '@/lib/utils'
import type { Product, Material } from '@/types'

interface ProductHeaderProps {
  product: Product
  isInWishlist: (productId: string) => boolean
  onWishlistToggle: () => Promise<void>
  wishlistLoading: boolean
  selectedMaterial?: Material | null
  showMaterialInfo?: boolean
}

export default function ProductHeader({ 
  product, 
  isInWishlist, 
  onWishlistToggle, 
  wishlistLoading,
  selectedMaterial,
  showMaterialInfo = false
}: ProductHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-brass/20"
    >
      <div className="flex items-center justify-between mb-2">
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
          onClick={onWishlistToggle}
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
        className="text-2xl lg:text-3xl font-sans font-semibold text-charcoal mb-3 leading-relaxed tracking-tight"
        style={{ letterSpacing: '-0.02em' }}
      >
        {product.name}
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-charcoal/70 leading-relaxed text-sm whitespace-pre-wrap"
      >
        {product.description || 'Premium quality product crafted with excellence and attention to detail'}
      </motion.p>
      
      {/* Material Information - Only show when there's a single material */}
      {showMaterialInfo && selectedMaterial && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-3 p-2 bg-gradient-to-r from-brass/10 to-olive/10 rounded-lg border border-brass/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-charcoal mb-1">
                Material: {selectedMaterial.name}
              </p>
              <p className="text-xs text-charcoal/60">
                Selected material for this product
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-brass flex items-center gap-2 flex-wrap">
                {product.discountPercentage && product.discountPercentage > 0 ? (
                  <>
                    <span className="line-through text-charcoal/60 font-medium">
                      {formatCurrency(selectedMaterial.basePrice)}
                    </span>
                    <span>
                      {formatCurrency(
                        (toNumber(selectedMaterial.basePrice) * (1 - (product.discountPercentage || 0) / 100))
                      )}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] leading-none font-semibold bg-brass/15 text-brass rounded md:ml-1">
                      -{Math.round(product.discountPercentage || 0)}%
                    </span>
                  </>
                ) : (
                  <span>{formatCurrency(selectedMaterial.basePrice)}</span>
                )}
              </p>
              <p className="text-xs text-charcoal/60">Base price</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
