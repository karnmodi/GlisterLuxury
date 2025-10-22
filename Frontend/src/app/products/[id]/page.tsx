'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { productsApi, finishesApi } from '@/lib/api'
import { useCart } from '@/contexts/CartContext'
import { toNumber, formatCurrency } from '@/lib/utils'
import type { Product, Finish, Material, SizeOption } from '@/types'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import Button from '@/components/ui/Button'
import { motion } from 'framer-motion'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart, loading: cartLoading } = useCart()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [finishes, setFinishes] = useState<Finish[]>([])
  const [loading, setLoading] = useState(true)
  
  // Selection state
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [selectedSize, setSelectedSize] = useState<SizeOption | null>(null)
  const [selectedFinish, setSelectedFinish] = useState<string>('')
  const [includePackaging, setIncludePackaging] = useState(true) // Default to included
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const [productData, finishesData] = await Promise.all([
        productsApi.getById(params.id as string),
        finishesApi.getAll(),
      ])
      setProduct(productData)
      setFinishes(finishesData)
      
      // Auto-select first material if available
      if (productData.materials && productData.materials.length > 0) {
        setSelectedMaterial(productData.materials[0])
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
      alert('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product || !selectedMaterial) {
      alert('Please select a material')
      return
    }

    try {
      await addToCart({
        productID: product._id,
        selectedMaterial: {
          materialID: selectedMaterial.materialID,
          name: selectedMaterial.name,
          basePrice: toNumber(selectedMaterial.basePrice),
        },
        selectedSize: selectedSize?.sizeMM,
        selectedFinish: selectedFinish || undefined,
        quantity,
        includePackaging,
      })
      
      alert('Product added to cart!')
      router.push('/cart')
    } catch (error) {
      console.error('Failed to add to cart:', error)
      alert('Failed to add to cart. Please try again.')
    }
  }

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-ivory">
        <LuxuryNavigation />
        <div className="pt-24 flex items-center justify-center h-96">
          <div className="text-charcoal/60 text-lg">Loading product...</div>
        </div>
        <LuxuryFooter />
      </div>
    )
  }

  const availableFinishes = finishes.filter(finish =>
    product.finishes?.some(f => f.finishID === finish._id)
  )

  return (
    <div className="min-h-screen bg-ivory">
      <LuxuryNavigation />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-lg overflow-hidden shadow-xl border border-brass/20">
                <div className="relative h-96 md:h-[500px] bg-gradient-ivory">
                  {product.imageURLs && product.imageURLs.length > 0 ? (
                    <Image
                      src={product.imageURLs[currentImageIndex]}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-32 h-32 text-brass/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Image Thumbnails */}
                {product.imageURLs && product.imageURLs.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-4">
                    {product.imageURLs.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative h-20 rounded overflow-hidden border-2 ${
                          currentImageIndex === index ? 'border-brass' : 'border-transparent'
                        } hover:border-brass/50 transition-colors`}
                      >
                        <Image src={url} alt={`${product.name} ${index + 1}`} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div>
                <p className="text-sm text-brass tracking-luxury mb-2">
                  {product.productID}
                </p>
                <h1 className="text-4xl font-serif font-bold text-charcoal mb-4">
                  {product.name}
                </h1>
                <p className="text-charcoal/70 leading-relaxed">
                  {product.description || 'Premium quality product crafted with excellence'}
                </p>
              </div>

              {/* Material Selection */}
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-3">
                  Material *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {product.materials?.map((material, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedMaterial(material)
                        setSelectedSize(null) // Reset size when changing material
                      }}
                      className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                        selectedMaterial?.name === material.name
                          ? 'border-brass bg-brass/10'
                          : 'border-brass/20 hover:border-brass/50'
                      }`}
                    >
                      <p className="font-medium text-charcoal">{material.name}</p>
                      <p className="text-sm text-brass">{formatCurrency(material.basePrice)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              {selectedMaterial && selectedMaterial.sizeOptions && selectedMaterial.sizeOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-3">
                    Size
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {selectedMaterial.sizeOptions.map((size, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSize(size)}
                        className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                          selectedSize?.sizeMM === size.sizeMM
                            ? 'border-brass bg-brass/10'
                            : 'border-brass/20 hover:border-brass/50'
                        }`}
                      >
                        <p className="font-medium text-charcoal">{size.sizeMM}mm</p>
                        {toNumber(size.additionalCost) > 0 && (
                          <p className="text-xs text-brass">+{formatCurrency(size.additionalCost)}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Finish Selection */}
              {availableFinishes.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-charcoal mb-3">
                    Finish (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {availableFinishes.map((finish) => {
                      const finishOption = product.finishes?.find(f => f.finishID === finish._id)
                      return (
                        <button
                          key={finish._id}
                          onClick={() => setSelectedFinish(finish._id)}
                          className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                            selectedFinish === finish._id
                              ? 'border-brass bg-brass/10'
                              : 'border-brass/20 hover:border-brass/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {finish.color && (
                              <div
                                className="w-4 h-4 rounded-full border border-brass/30"
                                style={{ backgroundColor: finish.color }}
                              />
                            )}
                            <p className="font-medium text-charcoal">{finish.name}</p>
                          </div>
                          {finishOption && toNumber(finishOption.priceAdjustment) !== 0 && (
                            <p className="text-sm text-brass">
                              {toNumber(finishOption.priceAdjustment) > 0 ? '+' : ''}{formatCurrency(finishOption.priceAdjustment)}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Packaging Option */}
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-3">
                  Packaging
                </label>
                <button
                  onClick={() => setIncludePackaging(!includePackaging)}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-300 flex items-center justify-between ${
                    includePackaging
                      ? 'border-brass bg-brass/10'
                      : 'border-brass/20 hover:border-brass/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      includePackaging ? 'border-brass bg-brass' : 'border-brass/30'
                    }`}>
                      {includePackaging && (
                        <svg className="w-4 h-4 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-charcoal">
                        Include {product.packagingUnit || 'Packaging'}
                      </p>
                      <p className="text-xs text-charcoal/60">
                        Premium packaging for your product
                      </p>
                    </div>
                  </div>
                  <div className="text-brass font-semibold">
                    {toNumber(product.packagingPrice) > 0 ? formatCurrency(product.packagingPrice) : 'Free'}
                  </div>
                </button>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-charcoal mb-3">
                  Quantity
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg border-2 border-brass/30 hover:border-brass hover:bg-brass/10 transition-all"
                  >
                    -
                  </button>
                  <span className="text-xl font-semibold text-charcoal w-12 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg border-2 border-brass/30 hover:border-brass hover:bg-brass/10 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Price Summary */}
              {selectedMaterial && (
                <div className="bg-gradient-ivory rounded-lg p-6 border border-brass/20">
                  <h3 className="text-sm font-semibold text-charcoal mb-4">Price Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-charcoal/70">Material ({selectedMaterial.name})</span>
                      <span className="font-medium text-charcoal">{formatCurrency(selectedMaterial.basePrice)}</span>
                    </div>
                    {selectedSize && toNumber(selectedSize.additionalCost) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-charcoal/70">Size ({selectedSize.sizeMM}mm)</span>
                        <span className="font-medium text-charcoal">+{formatCurrency(selectedSize.additionalCost)}</span>
                      </div>
                    )}
                    {selectedFinish && (() => {
                      const finishOption = product.finishes?.find(f => f.finishID === selectedFinish)
                      const finishDetail = finishes.find(f => f._id === selectedFinish)
                      if (finishOption && toNumber(finishOption.priceAdjustment) !== 0) {
                        return (
                          <div className="flex justify-between">
                            <span className="text-charcoal/70">Finish ({finishDetail?.name})</span>
                            <span className="font-medium text-charcoal">
                              {toNumber(finishOption.priceAdjustment) > 0 ? '+' : ''}{formatCurrency(finishOption.priceAdjustment)}
                            </span>
                          </div>
                        )
                      }
                      return null
                    })()}
                    {includePackaging && toNumber(product.packagingPrice) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-charcoal/70">Packaging</span>
                        <span className="font-medium text-charcoal">+{formatCurrency(product.packagingPrice)}</span>
                      </div>
                    )}
                    <div className="border-t border-brass/20 pt-2 mt-2">
                      <div className="flex justify-between text-base">
                        <span className="font-semibold text-charcoal">Unit Price</span>
                        <span className="font-bold text-brass">
                          {(() => {
                            let total = toNumber(selectedMaterial.basePrice)
                            if (selectedSize) total += toNumber(selectedSize.additionalCost)
                            if (selectedFinish) {
                              const finishOption = product.finishes?.find(f => f.finishID === selectedFinish)
                              if (finishOption) total += toNumber(finishOption.priceAdjustment)
                            }
                            if (includePackaging) total += toNumber(product.packagingPrice)
                            return formatCurrency(total)
                          })()}
                        </span>
                      </div>
                      {quantity > 1 && (
                        <div className="flex justify-between text-xs text-charcoal/60 mt-1">
                          <span>Total ({quantity} items)</span>
                          <span>
                            {(() => {
                              let unitPrice = toNumber(selectedMaterial.basePrice)
                              if (selectedSize) unitPrice += toNumber(selectedSize.additionalCost)
                              if (selectedFinish) {
                                const finishOption = product.finishes?.find(f => f.finishID === selectedFinish)
                                if (finishOption) unitPrice += toNumber(finishOption.priceAdjustment)
                              }
                              if (includePackaging) unitPrice += toNumber(product.packagingPrice)
                              return formatCurrency(unitPrice * quantity)
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <div className="pt-6 border-t border-brass/20">
                <Button
                  onClick={handleAddToCart}
                  disabled={!selectedMaterial || cartLoading}
                  size="lg"
                  className="w-full"
                >
                  {cartLoading ? 'Adding...' : 'Add to Cart'}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}

