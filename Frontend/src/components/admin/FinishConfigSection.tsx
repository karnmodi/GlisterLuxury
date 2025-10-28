'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Finish } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

interface FinishOption {
  finishID: string
  priceAdjustment: number
}

interface FinishConfigSectionProps {
  finishes: FinishOption[]
  onChange: (finishes: FinishOption[]) => void
  availableFinishes: Finish[]
}

export default function FinishConfigSection({ 
  finishes, 
  onChange, 
  availableFinishes 
}: FinishConfigSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // Debug: Log the available finishes
  console.log('FinishConfigSection - availableFinishes:', availableFinishes)
  console.log('FinishConfigSection - finishes (selected):', finishes)
  console.log('FinishConfigSection - availableFinishes length:', availableFinishes?.length || 0)

  const toggleFinish = (finishID: string) => {
    const existingFinish = finishes.find(f => f.finishID === finishID)
    
    if (existingFinish) {
      // Remove finish
      onChange(finishes.filter(f => f.finishID !== finishID))
    } else {
      // Add finish with default price adjustment
      onChange([...finishes, { finishID, priceAdjustment: 0 }])
    }
  }

  const updatePriceAdjustment = (finishID: string, priceAdjustment: number) => {
    const newFinishes = finishes.map(f => 
      f.finishID === finishID ? { ...f, priceAdjustment } : f
    )
    onChange(newFinishes)
  }

  const getFinishDetails = (finishID: string) => {
    return availableFinishes.find(f => f._id === finishID)
  }

  const filteredFinishes = availableFinishes.filter(finish =>
    finish.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedFinishes = finishes.map(f => ({
    ...f,
    details: getFinishDetails(f.finishID)
  })).filter(f => f.details)

  return (
    <div className="space-y-3">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <h3 className="text-xs font-semibold text-charcoal whitespace-nowrap">Available Finishes</h3>
        <div className="flex-1 w-full sm:w-auto">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search finishes..."
            className="mb-0"
          />
        </div>
      </div>

      {/* Finishes Grid - Responsive columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        <AnimatePresence>
          {filteredFinishes.map((finish) => {
            const isSelected = finishes.some(f => f.finishID === finish._id)
            const selectedFinish = finishes.find(f => f.finishID === finish._id)
            
            return (
              <motion.div
                key={finish._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`relative rounded-md border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-brass bg-brass/5'
                    : 'border-brass/20 hover:border-brass/40'
                }`}
                onClick={() => toggleFinish(finish._id)}
              >
                {/* Selection Indicator */}
                <div className="absolute top-1.5 right-1.5 z-10">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'bg-brass border-brass text-white'
                      : 'bg-white border-brass/30'
                  }`}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="p-2">
                  {/* Finish Preview */}
                  <div className="flex flex-col items-center gap-1.5 mb-2">
                    {finish.photoURL ? (
                      <img
                        src={finish.photoURL}
                        alt={finish.name}
                        className="w-8 h-8 object-cover rounded border border-brass/30"
                      />
                    ) : finish.color ? (
                      <div
                        className="w-8 h-8 rounded border border-brass/30"
                        style={{ backgroundColor: finish.color }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-brass/10 rounded border border-brass/30 flex items-center justify-center">
                        <svg className="w-4 h-4 text-brass/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                    )}
                    <h4 className="text-[10px] font-medium text-charcoal text-center truncate w-full px-1">{finish.name}</h4>
                  </div>

                  {/* Price Adjustment Input */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-brass/20 pt-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        label="Adj."
                        type="number"
                        step="0.01"
                        value={selectedFinish?.priceAdjustment || 0}
                        onChange={(e) => updatePriceAdjustment(finish._id, parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredFinishes.length === 0 && (
        <div className="text-center py-8 bg-cream/20 rounded-md border border-dashed border-brass/30">
          <svg className="w-10 h-10 mx-auto mb-2 text-brass/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <h3 className="text-xs font-medium text-charcoal mb-1">
            {searchTerm ? 'No Finishes Found' : 'No Finishes Available'}
          </h3>
          <p className="text-[10px] text-charcoal/60">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create finishes first to make them available'
            }
          </p>
        </div>
      )}
    </div>
  )
}
