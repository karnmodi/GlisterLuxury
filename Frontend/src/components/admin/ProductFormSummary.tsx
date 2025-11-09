'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import type { Category, MaterialMaster, Finish } from '@/types'

interface FormData {
  basicInfo: {
    productID: string
    productUID: string
    name: string
    description: string
    category: string
    subcategoryId: string
    packagingPrice: number
    packagingUnit: string
  }
  materials: Array<{
    materialID: string
    name: string
    basePrice: number
    sizeOptions: Array<{
      sizeMM: number
      additionalCost: number
      isOptional: boolean
    }>
  }>
  finishes: Array<{
    finishID: string
    priceAdjustment: number
  }>
  images: Array<{
    url: string
    file?: File
    mappedFinishID?: string
  }>
}

interface ProductFormSummaryProps {
  formData: FormData
  activeTab: string
  onTabChange: (tab: string) => void
  availableFinishes: Finish[]
}

export default function ProductFormSummary({ 
  formData, 
  activeTab, 
  onTabChange,
  availableFinishes 
}: ProductFormSummaryProps) {
  
  // Ensure arrays are always arrays to prevent null/undefined errors
  const safeMaterials = Array.isArray(formData.materials) ? formData.materials : []
  const safeImages = Array.isArray(formData.images) ? formData.images : []
  const safeFinishes = Array.isArray(formData.finishes) ? formData.finishes : []
  
  // Validation checks
  const validation = useMemo(() => {
    const basicValid = !!(formData.basicInfo.productID && formData.basicInfo.name)
    const materialsValid = safeMaterials.length > 0 && 
      safeMaterials.every(m => m.basePrice > 0)
    const finishesValid = true // Optional
    const imagesValid = true // Optional
    
    return {
      basic: basicValid,
      materials: materialsValid,
      finishes: finishesValid,
      images: imagesValid,
      overall: basicValid && materialsValid
    }
  }, [formData.basicInfo, safeMaterials])

  // Statistics
  const stats = useMemo(() => {
    const totalSizes = safeMaterials.reduce((sum, m) => {
      const sizeOptions = m.sizeOptions && Array.isArray(m.sizeOptions) ? m.sizeOptions : []
      return sum + sizeOptions.length
    }, 0)
    const mappedImages = safeImages.filter(img => img.mappedFinishID).length
    const defaultImages = safeImages.length - mappedImages
    const priceAdjustmentSum = safeFinishes.reduce((sum, f) => sum + f.priceAdjustment, 0)
    
    return {
      totalSizes,
      mappedImages,
      defaultImages,
      priceAdjustmentSum
    }
  }, [safeMaterials, safeImages, safeFinishes])

  return (
    <div className="flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-brass/20 px-3 py-2 bg-cream/20">
        <h3 className="text-xs font-semibold text-charcoal uppercase tracking-wide">Summary</h3>
      </div>

      {/* Content */}
      <div className="p-3 pb-6 space-y-4">
        
        {/* Overall Status */}
        <div className="bg-cream/30 rounded-md p-3 border border-brass/20">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-3 h-3 rounded-full ${validation.overall ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs font-medium text-charcoal">
              {validation.overall ? 'Ready to Save' : 'Needs Attention'}
            </span>
          </div>
          {!validation.overall && (
            <p className="text-[10px] text-charcoal/60">Complete required fields to save product</p>
          )}
        </div>

        {/* Tab Status */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Sections</h4>
          
          {/* Basic Info */}
          <button
            onClick={() => onTabChange('basic')}
            className={`w-full text-left px-2 py-1.5 rounded border transition-colors ${
              activeTab === 'basic' 
                ? 'bg-brass/10 border-brass/30' 
                : 'bg-white border-brass/20 hover:border-brass/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-charcoal">Basic Info</span>
              <div className={`w-2 h-2 rounded-full ${validation.basic ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <div className="text-[10px] text-charcoal/60 mt-0.5">
              {formData.basicInfo.productID || 'No ID'} • {formData.basicInfo.category ? '✓' : 'No category'}
            </div>
          </button>

          {/* Materials */}
          <button
            onClick={() => onTabChange('materials')}
            className={`w-full text-left px-2 py-1.5 rounded border transition-colors ${
              activeTab === 'materials' 
                ? 'bg-brass/10 border-brass/30' 
                : 'bg-white border-brass/20 hover:border-brass/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-charcoal">Materials</span>
              <div className={`w-2 h-2 rounded-full ${validation.materials ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            <div className="text-[10px] text-charcoal/60 mt-0.5">
              {safeMaterials.length} materials • {stats.totalSizes} sizes
            </div>
          </button>

          {/* Finishes */}
          <button
            onClick={() => onTabChange('finishes')}
            className={`w-full text-left px-2 py-1.5 rounded border transition-colors ${
              activeTab === 'finishes' 
                ? 'bg-brass/10 border-brass/30' 
                : 'bg-white border-brass/20 hover:border-brass/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-charcoal">Finishes</span>
              <div className={`w-2 h-2 rounded-full ${validation.finishes ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
            <div className="text-[10px] text-charcoal/60 mt-0.5">
              {safeFinishes.length} finishes • 
              {stats.priceAdjustmentSum !== 0 ? (
                <span className={stats.priceAdjustmentSum > 0 ? 'text-red-600' : 'text-green-600'}>
                  {' '}{stats.priceAdjustmentSum > 0 ? '+' : ''}{stats.priceAdjustmentSum.toFixed(2)}
                </span>
              ) : ' No adjustments'}
            </div>
          </button>

          {/* Images */}
          <button
            onClick={() => onTabChange('images')}
            className={`w-full text-left px-2 py-1.5 rounded border transition-colors ${
              activeTab === 'images' 
                ? 'bg-brass/10 border-brass/30' 
                : 'bg-white border-brass/20 hover:border-brass/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-charcoal">Images</span>
              <div className={`w-2 h-2 rounded-full ${validation.images ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
            <div className="text-[10px] text-charcoal/60 mt-0.5">
              {safeImages.length} total • {stats.mappedImages} mapped
            </div>
          </button>
        </div>

        {/* Selected Finishes Preview */}
        {safeFinishes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Selected Finishes</h4>
            <div className="space-y-1">
              {safeFinishes.slice(0, 5).map((finish) => {
                const finishDetails = availableFinishes.find(f => f._id === finish.finishID)
                return (
                  <div key={finish.finishID} className="flex items-center gap-2 text-xs bg-white border border-brass/20 rounded px-2 py-1">
                    {finishDetails?.photoURL && (
                      <div className="relative w-3 h-3 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={finishDetails.photoURL}
                          alt={finishDetails.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    )}
                    {finishDetails?.color && !finishDetails?.photoURL && (
                      <div
                        className="w-3 h-3 rounded-full border border-charcoal/20"
                        style={{ backgroundColor: finishDetails.color }}
                      />
                    )}
                    <span className="flex-1 truncate text-[10px] text-charcoal">{finishDetails?.name || 'Unknown'}</span>
                    {finish.priceAdjustment !== 0 && (
                      <span className={`text-[9px] ${finish.priceAdjustment > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {finish.priceAdjustment > 0 ? '+' : ''}{finish.priceAdjustment.toFixed(2)}
                      </span>
                    )}
                  </div>
                )
              })}
              {safeFinishes.length > 5 && (
                <div className="text-[10px] text-charcoal/60 text-center py-1">
                  +{safeFinishes.length - 5} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-semibold text-charcoal/60 uppercase tracking-wide">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white border border-brass/20 rounded px-2 py-1.5 text-center">
              <div className="text-lg font-bold text-brass">{safeMaterials.length}</div>
              <div className="text-[9px] text-charcoal/60">Materials</div>
            </div>
            <div className="bg-white border border-brass/20 rounded px-2 py-1.5 text-center">
              <div className="text-lg font-bold text-olive">{safeFinishes.length}</div>
              <div className="text-[9px] text-charcoal/60">Finishes</div>
            </div>
            <div className="bg-white border border-brass/20 rounded px-2 py-1.5 text-center">
              <div className="text-lg font-bold text-charcoal">{stats.totalSizes}</div>
              <div className="text-[9px] text-charcoal/60">Size Options</div>
            </div>
            <div className="bg-white border border-brass/20 rounded px-2 py-1.5 text-center">
              <div className="text-lg font-bold text-brass">{safeImages.length}</div>
              <div className="text-[9px] text-charcoal/60">Images</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

