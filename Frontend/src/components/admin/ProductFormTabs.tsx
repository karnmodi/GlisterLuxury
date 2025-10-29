'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Category, MaterialMaster, Finish } from '@/types'
import BasicInfoTab from './BasicInfoTab'
import MaterialConfigSection from './MaterialConfigSection'
import FinishConfigSection from './FinishConfigSection'
import ImageFinishMapper from './ImageFinishMapper'
import ProductFormSummary from './ProductFormSummary'

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

interface ProductFormTabsProps {
  formData: FormData
  setFormData: (data: FormData) => void
  categories: Category[]
  materials: MaterialMaster[]
  finishes: Finish[]
  isEditing: boolean
  productId?: string
}

const tabs = [
  { id: 'basic', label: 'Basic Information', icon: 'info' },
  { id: 'materials', label: 'Materials & Pricing', icon: 'settings' },
  { id: 'finishes', label: 'Finishes', icon: 'palette' },
  { id: 'images', label: 'Product Images', icon: 'image' },
]

export default function ProductFormTabs({ 
  formData, 
  setFormData, 
  categories, 
  materials, 
  finishes, 
  isEditing,
  productId = ''
}: ProductFormTabsProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [tabErrors, setTabErrors] = useState<Record<string, boolean>>({})

  // Validation functions
  const validateBasicInfo = () => {
    const errors = []
    if (!formData.basicInfo.productID) errors.push('Product ID is required')
    if (!formData.basicInfo.name) errors.push('Product name is required')
    if (formData.basicInfo.packagingPrice < 0) errors.push('Packaging price cannot be negative')
    return errors.length === 0
  }

  const validateMaterials = () => {
    if (formData.materials.length === 0) return false
    return formData.materials.every(material => 
      material.basePrice > 0 && 
      material.sizeOptions.every(size => size.additionalCost >= 0)
    )
  }

  const validateFinishes = () => {
    return true // Finishes are optional
  }

  const validateImages = () => {
    return true // Images are optional
  }

  // Update tab errors
  const updateTabErrors = useCallback(() => {
    setTabErrors({
      basic: !validateBasicInfo(),
      materials: !validateMaterials(),
      finishes: !validateFinishes(),
      images: !validateImages(),
    })
  }, [formData])

  // Update errors when form data changes
  useEffect(() => {
    updateTabErrors()
  }, [formData, updateTabErrors])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
  }

  const updateFormData = (section: keyof FormData, data: any) => {
    const newFormData = { ...formData, [section]: data }
    setFormData(newFormData)
    
    // Update validation
    setTimeout(() => {
      updateTabErrors()
    }, 100)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return (
          <BasicInfoTab
            data={formData.basicInfo}
            onChange={(data) => updateFormData('basicInfo', data)}
            categories={categories}
          />
        )
      case 'materials':
        return (
          <MaterialConfigSection
            materials={formData.materials}
            onChange={(materials) => updateFormData('materials', materials)}
            availableMaterials={materials}
          />
        )
      case 'finishes':
        return (
          <FinishConfigSection
            finishes={formData.finishes}
            onChange={(finishes) => updateFormData('finishes', finishes)}
            availableFinishes={finishes}
          />
        )
      case 'images':
        return (
          <ImageFinishMapper
            images={formData.images}
            onChange={(images) => updateFormData('images', images)}
            availableFinishes={finishes}
            selectedFinishes={formData.finishes}
            productId={productId}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-md shadow border border-brass/20">
      {/* Tab Navigation - Compact */}
      <div className="border-b border-brass/20 bg-cream/20">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex-1 min-w-[120px] px-3 py-2 text-left transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-brass bg-white border-b-2 border-brass'
                  : 'text-charcoal/60 hover:text-charcoal hover:bg-cream/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-brass/10 flex items-center justify-center flex-shrink-0">
                  {tab.icon === 'info' && (
                    <svg className="w-3 h-3 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {tab.icon === 'settings' && (
                    <svg className="w-3 h-3 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {tab.icon === 'palette' && (
                    <svg className="w-3 h-3 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  )}
                  {tab.icon === 'image' && (
                    <svg className="w-3 h-3 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-xs truncate">{tab.label}</div>
                </div>
                {tabErrors[tab.id] && (
                  <div className="ml-auto w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Layout: Content + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px]">
        {/* Tab Content */}
        <div className="p-3 pb-6 order-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Summary Panel */}
        <div className="border-t lg:border-t-0 lg:border-l border-brass/20 order-2">
          <ProductFormSummary 
            formData={formData}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            availableFinishes={finishes}
          />
        </div>
      </div>
    </div>
  )
}
