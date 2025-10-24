'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { productsApi, categoriesApi } from '@/lib/api'
import type { Product, Category } from '@/types'
import LuxuryNavigation from '@/components/LuxuryNavigation'
import LuxuryFooter from '@/components/LuxuryFooter'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { motion } from 'framer-motion'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [productsData, categoriesData] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
      ])
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (searchQuery) params.q = searchQuery
      if (selectedCategory) params.category = selectedCategory
      const results = await productsApi.getAll(params)
      setProducts(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    fetchData()
  }

  return (
    <div className="min-h-screen bg-ivory">
      <LuxuryNavigation />
      
      <main className="pt-24 pb-16">
        {/* Header Section */}
        <section className="bg-gradient-charcoal text-ivory py-16">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-5xl font-serif font-bold mb-4 tracking-wide">
                Our Products
              </h1>
              <p className="text-xl text-brass tracking-luxury">
                Discover Excellence in Every Detail
              </p>
            </motion.div>
          </div>
        </section>

        <div className="container mx-auto px-6 py-12">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md border border-brass/20 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2.5 bg-white border border-brass/30 rounded-sm focus:outline-none focus:ring-2 focus:ring-brass focus:border-transparent transition-all duration-300"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  Search
                </Button>
                {(searchQuery || selectedCategory) && (
                  <Button onClick={clearFilters} variant="ghost">
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-charcoal/60 text-lg">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-charcoal/60 text-lg mb-4">No products found</p>
                <Button onClick={clearFilters} variant="secondary">
                  Clear Filters
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {products.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link href={`/products/${product._id}`}>
                    <div className="bg-white rounded-lg overflow-hidden shadow-md border border-brass/20 hover:shadow-xl transition-all duration-300 group">
                      {/* Product Image */}
                      <div className="relative h-64 bg-white overflow-hidden">
                        {product.imageURLs && product.imageURLs.length > 0 ? (
                          <Image
                            src={product.imageURLs[0]}
                            alt={product.name}
                            fill
                            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-ivory">
                            <svg className="w-20 h-20 text-brass/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-6">
                        <p className="text-xs text-brass tracking-luxury mb-2">
                          {product.productID}
                        </p>
                        <h3 className="text-lg font-serif font-bold text-charcoal mb-2 group-hover:text-brass transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-charcoal/60 mb-4 line-clamp-2">
                          {product.description || 'Premium quality product'}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-charcoal">
                            {product.materials?.length || 0} materials
                          </span>
                          <span className="text-brass font-medium text-sm group-hover:underline">
                            View Details →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <LuxuryFooter />
    </div>
  )
}

