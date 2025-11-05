'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { toNumber, formatCurrency, calculateVAT } from '@/lib/utils'
import type { Product, Material, SizeOption, Finish } from '@/types'

interface PriceSummaryProps {
  product: Product
  selectedMaterial: Material | null
  selectedSize: SizeOption | null
  selectedFinish: string
  includePackaging: boolean
  quantity: number
  availableFinishes: Finish[]
}

export default function PriceSummary({ 
  product,
  selectedMaterial, 
  selectedSize, 
  selectedFinish, 
  includePackaging, 
  quantity,
  availableFinishes 
}: PriceSummaryProps) {
  if (!selectedMaterial) {
    return null
  }

  // Calculate unit price
  const calculateUnitPrice = () => {
    const base = toNumber(selectedMaterial.basePrice)
    const dp = product.discountPercentage ?? 0
    const discountedBase = dp > 0 ? base * (1 - dp / 100) : base
    let total = discountedBase
    if (selectedSize != null) total += toNumber(selectedSize.additionalCost)
    if (selectedFinish) {
      const finishOption = product.finishes?.find(f => f.finishID === selectedFinish)
      if (finishOption) total += toNumber(finishOption.priceAdjustment)
    }
    if (includePackaging) total += toNumber(product.packagingPrice)
    return total
  }

  const unitPrice = calculateUnitPrice()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-br from-charcoal via-charcoal/95 to-charcoal/90 rounded-xl p-4 border-2 border-brass/40 shadow-xl overflow-hidden relative"
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #C5A572 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-brass" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
            <h3 className="text-base font-bold text-brass">Price Breakdown</h3>
          </div>
          
          <div className="space-y-1.5 mb-3">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex justify-between items-center text-sm"
            >
              <span className="text-ivory/80 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                Material ({selectedMaterial.name})
              </span>
              <span className="font-bold text-ivory flex items-center gap-2 flex-wrap">
                {product.discountPercentage && product.discountPercentage > 0 ? (
                  <>
                    <span className="line-through opacity-70">{formatCurrency(selectedMaterial.basePrice)}</span>
                    <span>
                      {formatCurrency(
                        (toNumber(selectedMaterial.basePrice) * (1 - (product.discountPercentage || 0) / 100))
                      )}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] leading-none font-semibold bg-brass/20 text-brass rounded">
                      -{Math.round(product.discountPercentage || 0)}%
                    </span>
                  </>
                ) : (
                  <span>{formatCurrency(selectedMaterial.basePrice)}</span>
                )}
              </span>
            </motion.div>
            
            <AnimatePresence>
              {selectedSize != null && (
                <motion.div
                  initial={{ x: -20, opacity: 0, height: 0 }}
                  animate={{ x: 0, opacity: 1, height: 'auto' }}
                  exit={{ x: -20, opacity: 0, height: 0 }}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-ivory/80 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brass"></span>
                    Size ({selectedSize.name} {selectedSize.sizeMM}mm)
                  </span>
                  <span className="font-bold text-brass">
                    {toNumber(selectedSize.additionalCost) > 0 ? `+${formatCurrency(selectedSize.additionalCost)}` : formatCurrency(0)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {selectedFinish && (() => {
                const finishOption = product.finishes?.find(f => f.finishID === selectedFinish)
                const finishDetail = availableFinishes.find(f => f._id === selectedFinish)
                if (finishOption && toNumber(finishOption.priceAdjustment) !== 0) {
                  return (
                    <motion.div
                      initial={{ x: -20, opacity: 0, height: 0 }}
                      animate={{ x: 0, opacity: 1, height: 'auto' }}
                      exit={{ x: -20, opacity: 0, height: 0 }}
                      className="flex justify-between items-center text-sm"
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
                  className="flex justify-between items-center text-sm"
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
          
          <div className="border-t-2 border-brass/30 pt-3 space-y-1.5">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex justify-between items-center"
            >
              <span className="text-base font-bold text-ivory">Unit Price</span>
              <span className="text-xl font-bold text-brass">
                {formatCurrency(unitPrice)}
              </span>
            </motion.div>

            {/* VAT Breakdown */}
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ delay: 1.0 }}
              className="bg-brass/5 border border-brass/20 rounded-lg p-2 text-xs space-y-1"
            >
              <div className="flex justify-between text-ivory/70">
                <span>Excl. VAT</span>
                <span className="font-mono">{formatCurrency(calculateVAT(unitPrice).net)}</span>
              </div>
              <div className="flex justify-between text-ivory/70">
                <span>VAT (20%)</span>
                <span className="font-mono">{formatCurrency(calculateVAT(unitPrice).vat)}</span>
              </div>
              <div className="text-[10px] text-ivory/50 italic text-center pt-1 border-t border-brass/10">
                All prices include VAT
              </div>
            </motion.div>
            
            <AnimatePresence>
              {quantity > 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex justify-between items-center text-sm bg-brass/10 rounded-lg p-2"
                >
                  <span className="text-ivory/90 font-semibold">Total for {quantity} items</span>
                  <span className="text-base font-bold text-brass">
                    {formatCurrency(unitPrice * quantity)}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
