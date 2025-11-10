'use client'

import { motion } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { Material } from '@/types'

interface MaterialSelectionProps {
  materials: Material[]
  selectedMaterial: Material | null
  onMaterialSelect: (material: Material) => void
}

export default function MaterialSelection({ 
  materials, 
  selectedMaterial, 
  onMaterialSelect 
}: MaterialSelectionProps) {
  const isMobile = useIsMobile()
  
  return (
    <motion.div
      initial={isMobile ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={isMobile ? { duration: 0 } : { delay: 0.3, duration: 0.3 }}
      className="bg-white/80 backdrop-blur-xl rounded-xl p-3 shadow-lg border border-brass/20"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-brass"></span>
        <label className="block text-sm font-bold text-charcoal">
          Material <span className="text-red-500">*</span>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {materials.map((material, index) => (
          <motion.button
            key={index}
            initial={isMobile ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={isMobile ? { duration: 0 } : { delay: 0.4 + index * 0.1, duration: 0.3 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onMaterialSelect(material)}
            className={`p-2 rounded-lg border-2 transition-all duration-300 ${
              selectedMaterial?.name === material.name
                ? 'border-brass bg-gradient-to-br from-brass/20 to-olive/10 shadow-lg'
                : 'border-brass/20 hover:border-brass/50 bg-white'
            }`}
          >
            <p className="font-bold text-charcoal mb-1 text-sm">{material.name}</p>
            <p className="text-xs text-brass font-semibold">{formatCurrency(material.basePrice)}</p>
            {selectedMaterial?.name === material.name && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-2 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-brass" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
