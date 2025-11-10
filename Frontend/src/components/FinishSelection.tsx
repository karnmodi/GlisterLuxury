'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { toNumber, formatCurrency } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { Product, Finish } from '@/types'

interface FinishSelectionProps {
  product: Product
  availableFinishes: Finish[]
  selectedFinish: string
  onFinishSelect: (finishId: string) => void
  onFinishClear: () => void
}

export default function FinishSelection({ 
  product,
  availableFinishes, 
  selectedFinish, 
  onFinishSelect,
  onFinishClear 
}: FinishSelectionProps) {
  const isMobile = useIsMobile()
  
  if (availableFinishes.length === 0) {
    return null
  }

  // Get selected finish details
  const getSelectedFinishDetails = () => {
    if (!selectedFinish) return null
    return availableFinishes.find(f => f._id === selectedFinish)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={isMobile ? { duration: 0 } : { delay: 0.4, duration: 0.3 }}
        className="bg-white/80 backdrop-blur-xl rounded-xl p-3 shadow-lg border border-brass/20"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-brass"></span>
          <label className="block text-sm font-bold text-charcoal">
            Finish <span className="text-red-500 text-xs">*</span>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {availableFinishes.map((finish, finishIdx) => {
            const finishOption = product.finishes?.find(f => f.finishID === finish._id)
            const isSelected = selectedFinish === finish._id
            return (
              <motion.button
                key={finish._id}
                initial={isMobile ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={isMobile ? { duration: 0 } : { delay: 0.5 + finishIdx * 0.05, duration: 0.3 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onFinishSelect(finish._id)}
                className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                  isSelected
                    ? 'border-brass bg-gradient-to-br from-brass/20 to-olive/10 shadow-xl ring-2 ring-brass/30'
                    : 'border-brass/20 hover:border-brass/50 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-2">
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
                          className="w-12 h-12 object-cover rounded-lg border-2 border-brass/30 shadow-md bg-white"
                        />
                      </motion.div>
                    ) : finish.color ? (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-12 h-12 rounded-lg border-2 border-brass/30 shadow-md"
                        style={{ backgroundColor: finish.color }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-cream to-ivory rounded-lg border-2 border-brass/30 flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6 text-brass/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <p className="font-bold text-charcoal mb-1 text-sm">{finish.name}</p>
                    {finish.color && (
                      <p className="text-xs text-charcoal/50 font-mono mb-1">{finish.color}</p>
                    )}
                    {finishOption && toNumber(finishOption.priceAdjustment) !== 0 && (
                      <motion.p
                        animate={{ scale: isSelected ? [1, 1.1, 1] : 1 }}
                        className="text-xs text-brass font-bold"
                      >
                        {toNumber(finishOption.priceAdjustment) > 0 ? '+' : ''}{formatCurrency(finishOption.priceAdjustment)}
                      </motion.p>
                    )}
                    {finish.description && (
                      <p className="text-xs text-charcoal/60 mt-1 line-clamp-2">
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
            className="mt-3 p-2 bg-gradient-to-r from-brass/10 to-olive/10 rounded-lg border border-brass/20"
          >
            <p className="text-sm text-charcoal/80">
              <span className="font-semibold">Selected:</span> {getSelectedFinishDetails()?.name}
              {getSelectedFinishDetails()?.description && ` - ${getSelectedFinishDetails()?.description}`}
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
