'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { toNumber, formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

interface PackagingOptionProps {
  product: Product
  includePackaging: boolean
  onPackagingToggle: () => void
}

export default function PackagingOption({ 
  product, 
  includePackaging, 
  onPackagingToggle 
}: PackagingOptionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white/80 backdrop-blur-xl rounded-xl p-3 shadow-lg border border-brass/20"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-brass"></span>
        <label className="block text-sm font-bold text-charcoal">
          Packaging
        </label>
      </div>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onPackagingToggle}
        className={`w-full p-2 rounded-lg border-2 transition-all duration-300 flex items-center justify-between ${
          includePackaging
            ? 'border-brass bg-gradient-to-br from-brass/20 to-olive/10 shadow-md'
            : 'border-brass/20 hover:border-brass/50 bg-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: includePackaging ? [1, 1.2, 1] : 1 }}
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
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
            <p className="font-bold text-charcoal text-sm">
              Include {product.packagingUnit || 'Packaging'}
            </p>
            <p className="text-xs text-charcoal/60">
              Premium packaging for your product
            </p>
          </div>
        </div>
        <div className="text-brass font-bold text-sm">
          {toNumber(product.packagingPrice) > 0 ? formatCurrency(product.packagingPrice) : 'Free'}
        </div>
      </motion.button>
    </motion.div>
  )
}
