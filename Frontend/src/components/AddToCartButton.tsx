'use client'

import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'

interface AddToCartButtonProps {
  onAddToCart: () => void
  disabled: boolean
  loading: boolean
  selectedMaterial: any
  selectedFinish?: string | null
}

export default function AddToCartButton({ 
  onAddToCart, 
  disabled, 
  loading, 
  selectedMaterial,
  selectedFinish
}: AddToCartButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="pt-2"
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={onAddToCart}
          disabled={disabled}
          size="lg"
          className="w-full text-base font-bold py-4 shadow-lg hover:shadow-xl hover:shadow-brass/30 relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding to Cart...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      
      {(!selectedMaterial || !selectedFinish) && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-red-500 mt-2"
        >
          {!selectedMaterial 
            ? 'Please select a material to continue'
            : !selectedFinish 
            ? 'Please select a finish to continue'
            : ''}
        </motion.p>
      )}
    </motion.div>
  )
}
