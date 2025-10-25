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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-charcoal">Available Finishes</h3>
          <p className="text-sm text-charcoal/60">Select finishes and configure price adjustments</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gradient-to-br from-brass/5 to-cream/20 rounded-lg p-4 border border-brass/20">
        <Input
          label="Search Finishes"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type to search finishes..."
          className="mb-0"
        />
      </div>

      {/* Selected Finishes Summary */}
      {selectedFinishes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-olive/10 to-cream/20 rounded-lg p-4 border border-olive/20"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-charcoal">Selected Finishes ({selectedFinishes.length})</h4>
            <div className="text-sm text-charcoal/60">
              {selectedFinishes.filter(f => f.priceAdjustment !== 0).length} with price adjustments
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedFinishes.map((finish) => (
              <div
                key={finish.finishID}
                className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-olive/30 text-sm"
              >
                {finish.details?.photoURL && (
                  <img
                    src={finish.details.photoURL}
                    alt={finish.details.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                )}
                {finish.details?.color && !finish.details?.photoURL && (
                  <div
                    className="w-4 h-4 rounded-full border border-charcoal/20"
                    style={{ backgroundColor: finish.details.color }}
                  />
                )}
                <span className="font-medium text-charcoal">{finish.details?.name}</span>
                {finish.priceAdjustment !== 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    finish.priceAdjustment > 0 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {finish.priceAdjustment > 0 ? '+' : ''}{finish.priceAdjustment.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Finishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className={`relative rounded-lg border-2 transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? 'border-brass bg-brass/5 shadow-lg'
                    : 'border-brass/20 hover:border-brass/40 hover:shadow-md'
                }`}
                onClick={() => toggleFinish(finish._id)}
              >
                {/* Selection Indicator */}
                <div className="absolute top-3 right-3 z-10">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected
                      ? 'bg-brass border-brass text-white'
                      : 'bg-white border-brass/30'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {/* Finish Preview */}
                  <div className="flex items-center gap-3 mb-3">
                    {finish.photoURL ? (
                      <img
                        src={finish.photoURL}
                        alt={finish.name}
                        className="w-12 h-12 object-cover rounded-lg border border-brass/30"
                      />
                    ) : finish.color ? (
                      <div
                        className="w-12 h-12 rounded-lg border border-brass/30"
                        style={{ backgroundColor: finish.color }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-brass/20 to-cream/30 rounded-lg border border-brass/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-brass/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-charcoal truncate">{finish.name}</h4>
                      {finish.description && (
                        <p className="text-xs text-charcoal/60 truncate">{finish.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Price Adjustment Input */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-brass/20 pt-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Input
                        label="Price Adjustment"
                        type="number"
                        step="0.01"
                        value={selectedFinish?.priceAdjustment || 0}
                        onChange={(e) => updatePriceAdjustment(finish._id, parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="text-sm"
                      />
                      <p className="text-xs text-charcoal/60 mt-1">
                        Positive values increase price, negative values decrease price
                      </p>
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
        <div className="text-center py-12 bg-gradient-to-br from-cream/30 to-white rounded-lg border-2 border-dashed border-brass/30">
          <svg className="w-16 h-16 mx-auto mb-4 text-brass/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <h3 className="text-lg font-medium text-charcoal mb-2">
            {searchTerm ? 'No Finishes Found' : 'No Finishes Available'}
          </h3>
          <p className="text-charcoal/60">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create finishes first to make them available for products'
            }
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gradient-to-r from-brass/5 to-cream/20 rounded-lg p-4 border border-brass/20">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-charcoal/60">Finishes selected:</span>
            <span className="font-medium text-charcoal">{selectedFinishes.length}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-charcoal/60">With price adjustments:</span>
            <span className="font-medium text-charcoal">
              {selectedFinishes.filter(f => f.priceAdjustment !== 0).length}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-charcoal/60">Total adjustment:</span>
            <span className={`font-medium ${
              selectedFinishes.reduce((sum, f) => sum + f.priceAdjustment, 0) >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {selectedFinishes.reduce((sum, f) => sum + f.priceAdjustment, 0) >= 0 ? '+' : ''}
              {selectedFinishes.reduce((sum, f) => sum + f.priceAdjustment, 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
