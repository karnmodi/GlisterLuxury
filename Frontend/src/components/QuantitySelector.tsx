'use client'

import { motion } from 'framer-motion'

interface QuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
}

export default function QuantitySelector({ 
  quantity, 
  onQuantityChange 
}: QuantitySelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white/80 backdrop-blur-xl rounded-xl p-3 shadow-lg border border-brass/20"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-brass"></span>
        <label className="block text-sm font-bold text-charcoal">
          Quantity
        </label>
      </div>
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          className="w-10 h-10 rounded-lg border-2 border-brass/30 hover:border-brass hover:bg-brass/10 transition-all flex items-center justify-center text-lg font-bold text-charcoal disabled:opacity-30 disabled:cursor-not-allowed"
        >
          −
        </motion.button>
        <motion.span
          key={quantity}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-bold text-charcoal min-w-[50px] text-center"
        >
          {quantity}
        </motion.span>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onQuantityChange(quantity + 1)}
          className="w-10 h-10 rounded-lg border-2 border-brass/30 hover:border-brass hover:bg-brass/10 transition-all flex items-center justify-center text-lg font-bold text-charcoal"
        >
          +
        </motion.button>
      </div>
    </motion.div>
  )
}
