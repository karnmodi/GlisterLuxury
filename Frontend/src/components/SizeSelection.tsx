'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { toNumber, formatCurrency } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { SizeOption } from '@/types'

interface SizeSelectionProps {
  sizeOptions: SizeOption[]
  selectedSize: SizeOption | null
  onSizeSelect: (size: SizeOption) => void
}

export default function SizeSelection({ 
  sizeOptions, 
  selectedSize, 
  onSizeSelect 
}: SizeSelectionProps) {
  const isMobile = useIsMobile()
  
  if (!sizeOptions || sizeOptions.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={isMobile ? { opacity: 1, y: 0, height: 'auto' } : { opacity: 0, y: 20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={isMobile ? { duration: 0 } : { duration: 0.3 }}
        className="bg-white/80 backdrop-blur-xl rounded-xl p-3 shadow-lg border border-brass/20"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-brass"></span>
          <label className="block text-sm font-bold text-charcoal">
            Size
          </label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {sizeOptions.map((size, index) => {
            // Create a unique identifier for size comparison using both name and sizeMM
            const isSelected = selectedSize != null && 
              selectedSize.name === size.name && 
              selectedSize.sizeMM === size.sizeMM
            
            return (
            <motion.button
              key={`${size.name}-${size.sizeMM}-${index}`}
              initial={isMobile ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={isMobile ? { duration: 0 } : { delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSizeSelect(size)}
              className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                isSelected
                  ? 'border-brass bg-gradient-to-br from-brass/20 to-olive/10 shadow-md'
                  : 'border-brass/20 hover:border-brass/50 bg-white'
              }`}
            >
              {size.name ? (
                <>
                  <p className="font-semibold text-charcoal text-xs">{size.name}</p>
                  <p className="font-bold text-charcoal text-sm">{size.sizeMM}mm</p>
                </>
              ) : (
                <p className="font-bold text-charcoal text-sm">{size.sizeMM}mm</p>
              )}
              {toNumber(size.additionalCost) > 0 && (
                <p className="text-xs text-brass font-semibold">+{formatCurrency(size.additionalCost)}</p>
              )}
            </motion.button>
            )
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
