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
  discountPercentage?: number
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
    <div className="space-y-3">
      {/* Product Identification */}
      <div className="bg-white rounded-md p-3 border border-brass/20">
        <h3 className="text-xs font-semibold text-charcoal mb-2">Product Identification</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      <div className="bg-white rounded-md p-3 border border-brass/20">
        <h3 className="text-xs font-semibold text-charcoal mb-2">Product Details</h3>
        <div className="space-y-3">
          <Input
            label="Product Name *"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter product name"
            required
          />
          
          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">
              Description
            </label>
            <textarea
              value={data.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-brass/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brass focus:border-transparent transition-all resize-y"
              rows={6}
              placeholder="Describe your product features and specifications...&#10;&#10;You can add line breaks by pressing Enter.&#10;Empty lines will be preserved in the display."
              style={{ minHeight: '120px' }}
            />
            <p className="text-[10px] text-charcoal/60 mt-1">
              Line breaks and paragraph formatting will be preserved. Press Enter to create new lines.
            </p>
          </div>
        </div>
      </div>

      {/* Category & Classification */}
      <div className="bg-white rounded-md p-3 border border-brass/20">
        <h3 className="text-xs font-semibold text-charcoal mb-2">Category & Classification</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-charcoal mb-1">
              Category
            </label>
            <select
              value={data.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-white border border-brass/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brass focus:border-transparent transition-all"
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
            <label className="block text-xs font-medium text-charcoal mb-1">
              Subcategory
            </label>
            <select
              value={data.subcategoryId}
              onChange={(e) => handleChange('subcategoryId', e.target.value)}
              disabled={!data.category || subcategories.length === 0}
              className="w-full px-3 py-1.5 text-sm bg-white border border-brass/30 rounded-md focus:outline-none focus:ring-1 focus:ring-brass focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500"
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
      <div className="bg-white rounded-md p-3 border border-brass/20">
        <h3 className="text-xs font-semibold text-charcoal mb-2">Packaging Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Packaging Price"
            type="number"
            step="0.01"
            min="0"
            value={data.packagingPrice}
            onChange={(e) => handleChange('packagingPrice', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
          <div className="w-full">
            <label className="block text-xs font-medium text-charcoal mb-1">
              Packaging Unit
            </label>
            <input
              type="text"
              list="packaging-unit-options"
              value={data.packagingUnit}
              onChange={(e) => handleChange('packagingUnit', e.target.value)}
              placeholder="e.g., 1 set of pair"
              className="w-full px-2 py-1.5 text-xs bg-white border border-brass/30 rounded focus:outline-none focus:ring-1 focus:ring-brass focus:border-transparent transition-all duration-300"
            />
            <datalist id="packaging-unit-options">
              <option value="1 set of pair" />
              <option value="2 pairs of one" />
            </datalist>
          </div>
        </div>
        <p className="text-[10px] text-charcoal/60 mt-1.5">
          Packaging price is added when customers include packaging in their order.
        </p>
      </div>

      
    </div>
  )
}
