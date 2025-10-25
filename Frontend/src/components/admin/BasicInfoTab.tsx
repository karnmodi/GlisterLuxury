'use client'

import { useState, useEffect } from 'react'
import type { Category } from '@/types'
import Input from '@/components/ui/Input'

interface BasicInfoData {
  productID: string
  productUID: string
  name: string
  description: string
  category: string
  subcategoryId: string
  packagingPrice: number
  packagingUnit: string
}

interface BasicInfoTabProps {
  data: BasicInfoData
  onChange: (data: BasicInfoData) => void
  categories: Category[]
}

export default function BasicInfoTab({ data, onChange, categories }: BasicInfoTabProps) {
  const [subcategories, setSubcategories] = useState<Array<{_id: string, name: string}>>([])

  useEffect(() => {
    if (data.category) {
      const selectedCategory = categories.find(cat => cat._id === data.category)
      if (selectedCategory) {
        setSubcategories(selectedCategory.subcategories || [])
        // Reset subcategory if it's not valid for the new category
        if (data.subcategoryId && !selectedCategory.subcategories?.find(sub => sub._id === data.subcategoryId)) {
          onChange({ ...data, subcategoryId: '' })
        }
      } else {
        setSubcategories([])
        onChange({ ...data, subcategoryId: '' })
      }
    } else {
      setSubcategories([])
      onChange({ ...data, subcategoryId: '' })
    }
  }, [data.category])

  const handleChange = (field: keyof BasicInfoData, value: any) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      {/* Product Identification */}
      <div className="bg-gradient-to-br from-brass/5 to-cream/20 rounded-lg p-6 border border-brass/20">
        <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Product Identification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Product ID *"
            value={data.productID}
            onChange={(e) => handleChange('productID', e.target.value)}
            placeholder="e.g., DOOR-001"
            required
            className="font-mono"
          />
          <Input
            label="Product UID"
            value={data.productUID}
            onChange={(e) => handleChange('productUID', e.target.value)}
            placeholder="Optional unique identifier"
            className="font-mono"
          />
        </div>
      </div>

      {/* Product Details */}
      <div className="bg-gradient-to-br from-olive/5 to-cream/20 rounded-lg p-6 border border-olive/20">
        <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-olive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Product Details
        </h3>
        <div className="space-y-4">
          <Input
            label="Product Name *"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter product name"
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Description
            </label>
            <textarea
              value={data.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
              rows={4}
              placeholder="Describe your product features, benefits, and specifications..."
            />
          </div>
        </div>
      </div>

      {/* Category & Classification */}
      <div className="bg-gradient-to-br from-charcoal/5 to-cream/20 rounded-lg p-6 border border-charcoal/20">
        <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Category & Classification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Category
            </label>
            <select
              value={data.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Subcategory
            </label>
            <select
              value={data.subcategoryId}
              onChange={(e) => handleChange('subcategoryId', e.target.value)}
              disabled={!data.category || subcategories.length === 0}
              className="w-full px-4 py-2.5 bg-white border border-brass/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Select a subcategory</option>
              {subcategories.map((subcategory) => (
                <option key={subcategory._id} value={subcategory._id}>
                  {subcategory.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Packaging Information */}
      <div className="bg-gradient-to-br from-brass/5 to-cream/20 rounded-lg p-6 border border-brass/20">
        <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-brass" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Packaging Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Packaging Price"
            type="number"
            step="0.01"
            min="0"
            value={data.packagingPrice}
            onChange={(e) => handleChange('packagingPrice', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
          <Input
            label="Packaging Unit"
            value={data.packagingUnit}
            onChange={(e) => handleChange('packagingUnit', e.target.value)}
            placeholder="e.g., Set, Box, Piece"
          />
        </div>
        <p className="text-sm text-charcoal/60 mt-2">
          Packaging price is added to the total cost when customers include packaging in their order.
        </p>
      </div>

      {/* Form Summary */}
      <div className="bg-gradient-to-r from-cream/50 to-white rounded-lg p-4 border border-brass/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${data.productID ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-charcoal/60">Product ID</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${data.name ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-charcoal/60">Product Name</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${data.category ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-charcoal/60">Category</span>
            </div>
          </div>
          <div className="text-xs text-charcoal/40">
            Required fields marked with *
          </div>
        </div>
      </div>
    </div>
  )
}
