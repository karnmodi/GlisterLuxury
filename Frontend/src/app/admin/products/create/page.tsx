'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { productsApi, categoriesApi, materialsApi, finishesApi } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import type { Product, Category, MaterialMaster, Finish } from '@/types'
import ProductFormTabs from '@/components/admin/ProductFormTabs'

export default function CreateProductPage() {
  const router = useRouter()
  const toast = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [materials, setMaterials] = useState<MaterialMaster[]>([])
  const [finishes, setFinishes] = useState<Finish[]>([])
  
  const [formData, setFormData] = useState({
    basicInfo: {
      productID: '',
      productUID: '',
      name: '',
      description: '',
      category: '',
      subcategoryId: '',
      packagingPrice: 0,
      packagingUnit: 'Set',
    },
    materials: [] as Array<{
      materialID: string
      name: string
      basePrice: number
      sizeOptions: Array<{
        sizeMM: number
        additionalCost: number
        isOptional: boolean
      }>
    }>,
    finishes: [] as Array<{
      finishID: string
      priceAdjustment: number
    }>,
    images: [] as Array<{
      url: string
      file?: File
      mappedFinishID?: string
    }>
  })
  const [createdProductId, setCreatedProductId] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [categoriesData, materialsData, finishesData] = await Promise.all([
        categoriesApi.getAll(),
        materialsApi.getAll(),
        finishesApi.getAll(),
      ])
      setCategories(categoriesData)
      setMaterials(materialsData)
      setFinishes(finishesData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load form data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Validate required fields
      if (!formData.basicInfo.productID || !formData.basicInfo.name) {
        toast.error('Product ID and Name are required')
        return
      }
      
      if (formData.materials.length === 0) {
        toast.error('At least one material is required')
        return
      }

      // Validate materials have base prices
      const invalidMaterials = formData.materials.filter(m => m.basePrice <= 0)
      if (invalidMaterials.length > 0) {
        toast.error('All materials must have a base price greater than 0')
        return
      }

      // Prepare product data with proper ObjectId conversion
      const productData = {
        productID: formData.basicInfo.productID,
        productUID: formData.basicInfo.productUID || undefined,
        name: formData.basicInfo.name,
        description: formData.basicInfo.description || undefined,
        category: formData.basicInfo.category || undefined,
        subcategoryId: formData.basicInfo.subcategoryId || undefined,
        packagingPrice: formData.basicInfo.packagingPrice,
        packagingUnit: formData.basicInfo.packagingUnit,
        materials: formData.materials.map(material => {
          // Ensure materialID is a proper string
          let materialID = material.materialID
          if (typeof materialID === 'object' && materialID !== null) {
            materialID = materialID._id || materialID.toString()
          }
          if (typeof materialID !== 'string') {
            materialID = String(materialID)
          }
          
          return {
            materialID: materialID,
            name: material.name,
            basePrice: material.basePrice,
            sizeOptions: material.sizeOptions.map(size => ({
              sizeMM: size.sizeMM,
              additionalCost: size.additionalCost,
              isOptional: size.isOptional
            }))
          }
        }),
        finishes: formData.finishes.map(finish => {
          // Ensure finishID is a proper string
          let finishID = finish.finishID
          if (typeof finishID === 'object' && finishID !== null) {
            finishID = finishID._id || finishID.toString()
          }
          if (typeof finishID !== 'string') {
            finishID = String(finishID)
          }
          
          return {
            finishID: finishID,
            priceAdjustment: finish.priceAdjustment
          }
        }),
      }

      // Create product
      const product = await productsApi.create(productData)
      setCreatedProductId(product._id)
      
      // Upload images if any
      if (formData.images.length > 0) {
        const files = formData.images
          .filter(img => img.file)
          .map(img => img.file!)
        
        if (files.length > 0) {
          try {
            // Upload images to the server
            const uploadResult = await productsApi.uploadImages(product._id, files)
            
            // Get the uploaded image URLs
            const uploadedImageUrls = uploadResult.images || []
            
            // Create mappings for images with finish assignments
            const imageMappings = formData.images
              .filter(img => img.file && img.mappedFinishID) // Only new images with finish mappings
              .map((img, index) => ({
                imageUrl: uploadedImageUrls[index] || img.url,
                mappedFinishID: img.mappedFinishID
              }))
            
            // Apply image-finish mappings
            for (const mapping of imageMappings) {
              try {
                await productsApi.updateImageFinishMapping(product._id, mapping.imageUrl, mapping.mappedFinishID)
              } catch (error) {
                console.error('Failed to update image-finish mapping:', error)
              }
            }
            
            toast.success('Product and images created successfully!')
          } catch (error) {
            console.error('Failed to upload images:', error)
            toast.warning('Product created but some images failed to upload')
          }
        } else {
          toast.success('Product created successfully!')
        }
      } else {
        toast.success('Product created successfully!')
      }

      router.push('/admin/products')
    } catch (error) {
      console.error('Failed to create product:', error)
      toast.error('Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brass border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-charcoal/60 text-lg">Loading form data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-white to-cream/50 rounded-xl p-6 shadow-md border border-brass/20">
        <div>
          <h1 className="text-4xl font-serif font-bold text-charcoal mb-2">Create New Product</h1>
          <p className="text-charcoal/60">Configure all product details and options</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push('/admin/products')}
            className="px-4 py-2 text-charcoal/60 hover:text-charcoal border border-brass/30 hover:border-brass/50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-brass text-white hover:bg-brass/90 disabled:opacity-50 rounded-lg transition-colors"
          >
            {saving ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </div>

      {/* Form Tabs */}
      <ProductFormTabs
        formData={formData}
        setFormData={setFormData}
        categories={categories}
        materials={materials}
        finishes={finishes}
        isEditing={false}
        productId={createdProductId}
      />
    </div>
  )
}
