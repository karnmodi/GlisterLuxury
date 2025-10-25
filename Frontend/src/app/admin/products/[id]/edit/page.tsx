'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { productsApi, categoriesApi, materialsApi, finishesApi } from '@/lib/api'
import { useToast } from '@/contexts/ToastContext'
import type { Product, Category, MaterialMaster, Finish } from '@/types'
import ProductFormTabs from '@/components/admin/ProductFormTabs'

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const toast = useToast()
  
  // Debug: Log params immediately
  console.log('EditProductPage - params:', params)
  console.log('EditProductPage - params.id:', params.id)
  console.log('EditProductPage - typeof params.id:', typeof params.id)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
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

  useEffect(() => {
    if (params.id) {
      fetchData()
    }
  }, [params.id])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Extract the ID properly from params
      console.log('Params object:', params)
      console.log('Params.id type:', typeof params.id)
      console.log('Params.id value:', params.id)
      
      let productId = ''
      
      if (typeof params.id === 'string') {
        // Decode URL-encoded string
        productId = decodeURIComponent(params.id)
        console.log('Decoded productId:', productId)
        
        // Check if the decoded value is "[object Object]" which means the original was an object
        if (productId === '[object Object]') {
          console.error('Product ID is an object that was stringified incorrectly')
          console.error('This usually means the product._id in the products list is an object instead of a string')
          console.error('Please check the products API response and ensure _id is a string')
          throw new Error('Invalid product ID: object was passed instead of string. Please check the products list data.')
        }
      } else if (Array.isArray(params.id)) {
        productId = params.id[0] || ''
      } else if (params.id && typeof params.id === 'object') {
        // Handle case where id might be an object
        productId = String(params.id)
      } else {
        productId = String(params.id || '')
      }
      
      console.log('Final productId:', productId)
      
      if (!productId) {
        throw new Error('Product ID is required')
      }
      
      // Validate that the ID looks like a MongoDB ObjectId
      if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
        console.error('Invalid product ID format:', productId)
        throw new Error('Invalid product ID format')
      }
      
      const [productData, categoriesData, materialsData, finishesData] = await Promise.all([
        productsApi.getById(productId),
        categoriesApi.getAll(),
        materialsApi.getAll(),
        finishesApi.getAll(),
      ])
      
      // Debug: Log the raw data to see what we're getting
      console.log('Raw product data:', productData)
      console.log('Materials data:', productData.materials)
      console.log('Finishes data:', finishesData)
      console.log('Categories data:', categoriesData)
      
      if (productData.materials && productData.materials.length > 0) {
        console.log('First material:', productData.materials[0])
        console.log('Base price type:', typeof productData.materials[0].basePrice)
        console.log('Base price value:', productData.materials[0].basePrice)
      }
      
      if (finishesData && finishesData.length > 0) {
        console.log('First finish:', finishesData[0])
        console.log('Finishes count:', finishesData.length)
      } else {
        console.warn('No finishes found in API response')
      }
      
      setProduct(productData)
      setCategories(categoriesData)
      setMaterials(materialsData)
      setFinishes(finishesData)
      
      // Populate form with existing product data
      setFormData({
        basicInfo: {
          productID: productData.productID,
          productUID: productData.productUID || '',
          name: productData.name,
          description: productData.description || '',
          category: typeof productData.category === 'string' ? productData.category : productData.category?._id || '',
          subcategoryId: productData.subcategoryId || '',
          packagingPrice: Number(productData.packagingPrice) || 0,
          packagingUnit: productData.packagingUnit,
        },
        materials: (productData.materials || []).map(material => {
          // Handle materialID conversion - ensure it's a string
          let materialID: string = material.materialID || '';
          if (typeof materialID === 'object' && materialID !== null) {
            const obj = materialID as any;
            materialID = obj._id || obj.toString();
          }
          if (typeof materialID !== 'string') {
            materialID = String(materialID);
          }
          
          return {
            materialID: materialID,
            name: material.name,
            basePrice: Number(material.basePrice) || 0,
            sizeOptions: (material.sizeOptions || []).map(size => ({
              sizeMM: Number(size.sizeMM),
              additionalCost: Number(size.additionalCost) || 0,
              isOptional: Boolean(size.isOptional)
            }))
          };
        }),
        finishes: (productData.finishes || []).map(finish => {
          // Handle finishID conversion - ensure it's a string
          let finishID: string = finish.finishID || '';
          if (typeof finishID === 'object' && finishID !== null) {
            const obj = finishID as any;
            finishID = obj._id || obj.toString();
          }
          if (typeof finishID !== 'string') {
            finishID = String(finishID);
          }
          
          return {
            finishID: finishID,
            priceAdjustment: Number(finish.priceAdjustment) || 0
          };
        }),
        images: Object.values(productData.imageURLs || {}).map(img => ({
          url: img.url,
          mappedFinishID: img.mappedFinishID ? String(img.mappedFinishID) : undefined
        }))
      })
    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error('Failed to load product data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!product) return
    
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

      // Debug: Log the form data before conversion
      console.log('Form data before conversion:', formData)
      console.log('Materials before conversion:', formData.materials)
      console.log('Finishes before conversion:', formData.finishes)
      
      // Debug: Log individual material IDs
      formData.materials.forEach((material, index) => {
        console.log(`Material ${index} ID:`, material.materialID)
        console.log(`Material ${index} ID type:`, typeof material.materialID)
        console.log(`Material ${index} ID constructor:`, material.materialID?.constructor?.name)
      })
      
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
          let materialID: string = material.materialID || ''
          if (typeof materialID === 'object' && materialID !== null) {
            const obj = materialID as any;
            materialID = obj._id || obj.toString();
          }
          if (typeof materialID !== 'string') {
            materialID = String(materialID)
          }
          
          // Validate that materialID is a valid MongoDB ObjectId string
          if (!/^[0-9a-fA-F]{24}$/.test(materialID)) {
            console.error('Invalid materialID format:', materialID)
            throw new Error(`Invalid material ID: ${materialID}`)
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
          let finishID: string = finish.finishID || ''
          if (typeof finishID === 'object' && finishID !== null) {
            const obj = finishID as any;
            finishID = obj._id || obj.toString();
          }
          if (typeof finishID !== 'string') {
            finishID = String(finishID)
          }
          
          // Validate that finishID is a valid MongoDB ObjectId string
          if (!/^[0-9a-fA-F]{24}$/.test(finishID)) {
            console.error('Invalid finishID format:', finishID)
            throw new Error(`Invalid finish ID: ${finishID}`)
          }
          
          return {
            finishID: finishID,
            priceAdjustment: finish.priceAdjustment
          }
        }),
      }

      // Debug: Log the converted data
      console.log('Converted product data:', productData)
      console.log('Converted materials:', productData.materials)
      console.log('Converted finishes:', productData.finishes)

      // Update product
      await productsApi.update(product._id, productData)
      
      // Upload new images if any
      const newImageFiles = formData.images
        .filter(img => img.file)
        .map(img => img.file!)
      
      if (newImageFiles.length > 0) {
        await productsApi.uploadImages(product._id, newImageFiles)
      }

      toast.success('Product updated successfully!')
      router.push('/admin/products')
    } catch (error) {
      console.error('Failed to update product:', error)
      toast.error('Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brass border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-charcoal/60 text-lg">Loading product data...</div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-charcoal/60 text-lg">Product not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-white to-cream/50 rounded-xl p-6 shadow-md border border-brass/20">
        <div>
          <h1 className="text-4xl font-serif font-bold text-charcoal mb-2">Edit Product</h1>
          <p className="text-charcoal/60">Update product details and configurations</p>
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
            {saving ? 'Saving...' : 'Save Changes'}
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
        isEditing={true}
        productId={product?._id || ''}
      />
    </div>
  )
}
